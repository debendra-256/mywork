/**
 * The passport canvas pipeline: crop transform, background, pixel adjustments
 * and the clothing layer, plus the compliance guide overlay that is drawn only
 * on screen and never exported.
 */

import { drawGarment } from './garments'

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read that image'))
    img.src = src
  })
}

export function canvasBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 6000)
}

export const DEFAULT_ADJUSTMENTS = { brightness: 100, contrast: 100, saturate: 100, warmth: 0, gamma: 0, sharpen: 0, smooth: 0, grayscale: false }

export function filterString(adj) {
  const parts = [`brightness(${adj.brightness}%)`, `contrast(${adj.contrast}%)`, `saturate(${adj.grayscale ? 0 : adj.saturate}%)`]
  if (adj.grayscale) parts.push(`grayscale(${Math.round(adj.saturate >= 100 ? 100 : Math.min(100, adj.saturate))}%)`)
  return parts.join(' ')
}

const cssColor = (value) => (value ? value : '#ffffff')

/** Cover-fit scale that keeps the frame filled at any rotation angle. */
export function coverScale(img, W, H, rotation) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  const rad = (rotation * Math.PI) / 180
  const a = Math.abs(Math.cos(rad)), b = Math.abs(Math.sin(rad))
  return Math.max((W * a + H * b) / iw, (W * b + H * a) / ih)
}

function blurCopy(canvas, radius) {
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  ctx.filter = `blur(${radius}px)`
  ctx.drawImage(canvas, 0, 0)
  ctx.filter = 'none'
  return ctx.getImageData(0, 0, out.width, out.height)
}

function lut(gamma, warmR, warmB) {
  const red = new Uint8Array(256), green = new Uint8Array(256), blue = new Uint8Array(256)
  for (let i = 0; i < 256; i++) {
    const v = Math.pow(i / 255, 1 / gamma) * 255
    red[i] = Math.max(0, Math.min(255, Math.round(v * warmR)))
    green[i] = Math.max(0, Math.min(255, Math.round(v)))
    blue[i] = Math.max(0, Math.min(255, Math.round(v * warmB)))
  }
  return { red, green, blue }
}

/**
 * Warmth, gamma, unsharp mask and skin smoothing run as one pixel pass over the
 * finished frame. At passport sizes this is a fraction of a millisecond budget
 * per slider move, and it keeps the export identical to the preview.
 */
function applyPixels(canvas, adj) {
  const needsTone = adj.warmth !== 0 || adj.gamma !== 0
  const needsBlur = adj.sharpen > 0 || adj.smooth > 0
  if (!needsTone && !needsBlur) return
  const W = canvas.width, H = canvas.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const current = ctx.getImageData(0, 0, W, H)
  const data = current.data
  const unit = Math.max(1, Math.round(W / 300))
  const table = needsTone ? lut(1 + adj.gamma / 100 * 0.55, 1 + adj.warmth / 100 * 0.2, 1 - adj.warmth / 100 * 0.2) : null

  if (adj.smooth > 0) {
    const soft = blurCopy(canvas, 1.6 * unit).data
    const k = (adj.smooth / 100) * 0.6
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue
      data[i] += (soft[i] - data[i]) * k
      data[i + 1] += (soft[i + 1] - data[i + 1]) * k
      data[i + 2] += (soft[i + 2] - data[i + 2]) * k
    }
  }

  if (adj.sharpen > 0) {
    const sharp = blurCopy(canvas, 1 * unit).data
    const amount = (adj.sharpen / 100) * 1.1
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue
      data[i] += (data[i] - sharp[i]) * amount
      data[i + 1] += (data[i + 1] - sharp[i + 1]) * amount
      data[i + 2] += (data[i + 2] - sharp[i + 2]) * amount
    }
  }

  if (table) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue
      data[i] = table.red[data[i]]
      data[i + 1] = table.green[data[i + 1]]
      data[i + 2] = table.blue[data[i + 2]]
    }
  }

  ctx.putImageData(current, 0, 0)
}

export function drawPhoto(target, state, images) {
  const { w: W, h: H } = state.frame
  target.width = W
  target.height = H
  const ctx = target.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, W, H)

  const cut = state.bg.mode === 'cut'
  if (cut && !state.bg.transparent) {
    ctx.fillStyle = cssColor(state.bg.color)
    ctx.fillRect(0, 0, W, H)
  }

  const source = cut && images.cut ? images.cut : images.base
  if (!source) return false

  const scale = coverScale(source, W, H, state.crop.rotation) * state.crop.zoom
  const dw = (source.naturalWidth || source.width) * scale
  const dh = (source.naturalHeight || source.height) * scale
  ctx.save()
  ctx.translate(W / 2 + state.crop.dx * W, H / 2 + state.crop.dy * H)
  ctx.rotate((state.crop.rotation * Math.PI) / 180)
  if (state.crop.mirror) ctx.scale(-1, 1)
  ctx.filter = filterString(state.adj)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh)
  ctx.filter = 'none'
  ctx.restore()

  applyPixels(target, state.adj)

  if (state.clothes.on && state.clothes.garment) {
    const layer = document.createElement('canvas')
    layer.width = W
    layer.height = H
    const lctx = layer.getContext('2d')
    drawGarment(lctx, state.clothes.garment, { w: W, h: H }, state.head, { scale: state.clothes.scale, dx: state.clothes.dx, dy: state.clothes.dy }, state.clothes.colors)
    ctx.drawImage(layer, 0, 0)
  }

  return true
}

/** Crown / chin / eye positions for the current size, in frame fractions. */
export function headLines(preset) {
  return { top: preset.headTop, bottom: preset.headBottom, eye: preset.eyeLine }
}

export function drawGuides(target, state) {
  const W = target.width = state.frame.w
  const H = target.height = state.frame.h
  const ctx = target.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  if (!state.guidesOn || !state.baseLoaded) return

  const unit = Math.max(1, W / 300)
  const head = state.head
  const crownY = head.top * H
  const chinY = head.bottom * H
  const eyeY = head.eye * H
  const cx = W / 2
  const headH = chinY - crownY
  const headW = headH * 0.66

  ctx.save()
  ctx.lineWidth = 1.4 * unit
  ctx.strokeStyle = 'rgba(37, 99, 235, .82)'
  ctx.setLineDash([7 * unit, 5 * unit])

  ctx.beginPath(); ctx.moveTo(0, crownY); ctx.lineTo(W, crownY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, chinY); ctx.lineTo(W, chinY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, eyeY); ctx.lineTo(W, eyeY); ctx.stroke()
  ctx.setLineDash([4 * unit, 6 * unit])
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(224, 36, 60, .9)'
  ctx.lineWidth = 1.8 * unit
  ctx.beginPath()
  ctx.ellipse(cx, (crownY + chinY) / 2, headW / 2, headH / 2, 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255, 255, 255, .9)'
  ctx.lineWidth = 2 * unit
  const tick = 12 * unit
  ;[[0, 0], [W, 0], [0, H], [W, H]].forEach(([x, y]) => {
    ctx.beginPath()
    ctx.moveTo(x + (x ? -tick : tick), y + 1 * unit)
    ctx.lineTo(x + (x ? -1 : 1) * unit, y + 1 * unit)
    ctx.lineTo(x + (x ? -1 : 1) * unit, y + (y ? -tick : tick))
    ctx.stroke()
  })
  ctx.restore()

  ctx.font = `${Math.round(9 * unit)}px Inter, sans-serif`
  ctx.fillStyle = 'rgba(224, 36, 60, .95)'
  ctx.fillText('head', cx + headW / 2 + 4 * unit, (crownY + chinY) / 2)
  ctx.fillStyle = 'rgba(37, 99, 235, .95)'
  ctx.fillText('crown', 4 * unit, crownY - 4 * unit)
  ctx.fillText('chin', 4 * unit, chinY + 11 * unit)
  ctx.fillText('eye line', 4 * unit, eyeY - 4 * unit)
}
