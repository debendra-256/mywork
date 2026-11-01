// Pixel engine for the Photoshop-style tools. Everything here works on plain
// canvases so it can be reused outside the poster editor.
import { renderToCanvas } from '../export.js'

const imageCache = new Map()

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

export function loadImage(src) {
  if (!src) return Promise.reject(new Error('No image'))
  if (imageCache.has(src)) return imageCache.get(src)
  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      imageCache.delete(src)
      reject(new Error('Could not load image'))
    }
    img.src = src
  })
  imageCache.set(src, promise)
  return promise
}

export function stripRasterLayers(doc) {
  return {
    ...doc,
    elements: (doc.elements || []).filter((el) => el.type !== 'raster' && el.type !== 'annotation'),
  }
}

// The rendered page underneath the paint layer. Retouch tools sample this so
// they affect the photo and template, not only previously painted pixels.
export async function renderUnderlay(doc, width) {
  return renderToCanvas(stripRasterLayers(doc), width)
}

export const rasterOfDoc = (doc) => (doc.elements || []).find((el) => el.type === 'raster' && el.role === 'paint') || null

export async function hydrateLayer(canvas, doc) {
  const ctx = canvas.getContext('2d')
  const layer = rasterOfDoc(doc)
  if (!layer?.src) return ctx
  try {
    const img = await loadImage(layer.src)
    ctx.save()
    ctx.globalAlpha = layer.opacity ?? 1
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    ctx.restore()
  } catch {
    /* an unreadable layer simply starts empty */
  }
  return ctx
}

export function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const value = parseInt(full, 16)
  if (Number.isNaN(value)) return { r: 0, g: 0, b: 0 }
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

export const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`

export function sampleColor(ctx, x, y) {
  const px = ctx.getImageData(clamp(Math.round(x), 0, ctx.canvas.width - 1), clamp(Math.round(y), 0, ctx.canvas.height - 1), 1, 1).data
  return rgbToHex(px[0], px[1], px[2])
}

export async function samplePageColor(doc, fx, fy, width = 640) {
  const canvas = await renderUnderlay(doc, width)
  const ctx = canvas.getContext('2d')
  return sampleColor(ctx, fx * canvas.width, fy * canvas.height)
}

export function colorDistance(a, b) {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return Math.sqrt((A.r - B.r) ** 2 + (A.g - B.g) ** 2 + (A.b - B.b) ** 2)
}

function softStamp(ctx, x, y, radius, hardness, color, alpha, mode) {
  if (radius <= 0.4) return
  ctx.save()
  ctx.globalCompositeOperation = mode || 'source-over'
  ctx.globalAlpha = clamp(alpha, 0, 1)
  if (hardness >= 0.999) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }
  const inner = radius * clamp(hardness, 0, 0.95)
  const gradient = ctx.createRadialGradient(x, y, inner, x, y, radius)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, `${color}00`)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function paintStamp(canvas, x, y, opts) {
  const ctx = canvas.getContext('2d')
  const radius = Math.max(0.5, (opts.size || 2) / 2)
  const mode = opts.erase ? 'destination-out' : 'source-over'
  // Keep the erase colour six-digit so the soft-stop suffix stays a valid colour.
  softStamp(ctx, x, y, radius, opts.erase ? 0.9 : (opts.hardness ?? 0.75), opts.erase ? '#000000' : (opts.color || '#000000'), opts.opacity ?? 1, mode)
}

// Stamps along a segment, spaced tightly enough that fast drags stay solid.
export function paintStroke(canvas, from, to, opts) {
  const size = Math.max(0.6, opts.size || 2)
  const spacing = Math.max(1, size * (opts.hardness >= 0.99 ? 0.28 : 0.16))
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy)
  const steps = Math.max(1, Math.ceil(distance / spacing))
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps
    paintStamp(canvas, from.x + dx * t, from.y + dy * t, opts)
  }
}

export function fillGradient(canvas, from, to, opts) {
  const ctx = canvas.getContext('2d')
  ctx.save()
  ctx.globalAlpha = clamp(opts.opacity ?? 1, 0, 1)
  let gradient
  if (opts.type === 'radial') {
    const radius = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y))
    gradient = ctx.createRadialGradient(from.x, from.y, 0, from.x, from.y, radius)
  } else {
    gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
  }
  gradient.addColorStop(0, opts.foreground || '#000')
  gradient.addColorStop(1, opts.background || '#fff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()
}

function floodMask(sourceCtx, width, height, startX, startY, tolerance, contiguous) {
  const data = sourceCtx.getImageData(0, 0, width, height).data
  const mask = new Uint8ClampedArray(width * height)
  const x0 = clamp(Math.round(startX), 0, width - 1)
  const y0 = clamp(Math.round(startY), 0, height - 1)
  const base = (y0 * width + x0) * 4
  const target = [data[base], data[base + 1], data[base + 2]]
  const limit = Math.max(1, tolerance) ** 2 * 3
  const matches = (index) => {
    const offset = index * 4
    if (data[offset + 3] === 0) return false
    const dr = data[offset] - target[0]
    const dg = data[offset + 1] - target[1]
    const db = data[offset + 2] - target[2]
    return dr * dr + dg * dg + db * db <= limit
  }
  if (!contiguous) {
    for (let i = 0; i < width * height; i += 1) if (matches(i)) mask[i] = 255
    return mask
  }
  const stack = [y0 * width + x0]
  const seen = new Uint8Array(width * height)
  while (stack.length) {
    const index = stack.pop()
    if (seen[index]) continue
    seen[index] = 1
    if (!matches(index)) continue
    mask[index] = 255
    const x = index % width
    const y = (index - x) / width
    if (x > 0) stack.push(index - 1)
    if (x < width - 1) stack.push(index + 1)
    if (y > 0) stack.push(index - width)
    if (y < height - 1) stack.push(index + width)
  }
  return mask
}

export function paintBucket(canvas, sourceCanvas, x, y, opts) {
  const { width, height } = canvas
  const sourceCtx = sourceCanvas ? sourceCanvas.getContext('2d') : canvas.getContext('2d')
  const mask = floodMask(sourceCtx, width, height, x, y, opts.tolerance ?? 32, opts.contiguous !== false)
  const patch = createCanvas(width, height)
  const pctx = patch.getContext('2d')
  const image = pctx.createImageData(width, height)
  const { r, g, b } = hexToRgb(opts.color || '#000')
  for (let i = 0; i < mask.length; i += 1) {
    const offset = i * 4
    image.data[offset] = r
    image.data[offset + 1] = g
    image.data[offset + 2] = b
    image.data[offset + 3] = mask[i]
  }
  pctx.putImageData(image, 0, 0)
  const ctx = canvas.getContext('2d')
  ctx.save()
  ctx.globalAlpha = clamp(opts.opacity ?? 1, 0, 1)
  ctx.drawImage(patch, 0, 0)
  ctx.restore()
}

// Copies a soft-edged patch of `source` onto `target`. This one primitive
// powers clone, healing, history brush, blur, sharpen, dodge, burn and sponge.
export function paintPatch(target, source, x, y, opts) {
  const size = Math.max(2, opts.size || 8)
  const radius = size / 2
  const diameter = Math.ceil(size) + 2
  const patch = createCanvas(diameter, diameter)
  const pctx = patch.getContext('2d')
  const sx = clamp((opts.sourceX ?? x) - radius, 0, Math.max(0, source.width - 1))
  const sy = clamp((opts.sourceY ?? y) - radius, 0, Math.max(0, source.height - 1))
  if (opts.filter) pctx.filter = opts.filter
  pctx.drawImage(source, sx, sy, diameter, diameter, 0, 0, diameter, diameter)
  pctx.filter = 'none'
  if (opts.tint) {
    pctx.save()
    pctx.globalCompositeOperation = opts.tint.mode || 'source-over'
    pctx.globalAlpha = opts.tint.alpha ?? 1
    pctx.fillStyle = opts.tint.color
    pctx.fillRect(0, 0, diameter, diameter)
    pctx.restore()
  }
  if (opts.saturate !== false && opts.grayscale) {
    pctx.save()
    pctx.globalCompositeOperation = 'saturation'
    pctx.fillStyle = opts.grayscale
    pctx.fillRect(0, 0, diameter, diameter)
    pctx.restore()
  }
  // Feather the patch so it blends instead of showing a pasted circle.
  pctx.save()
  pctx.globalCompositeOperation = 'destination-in'
  const hardness = clamp(opts.hardness ?? 0.5, 0, 0.95)
  const gradient = pctx.createRadialGradient(diameter / 2, diameter / 2, (diameter / 2) * hardness, diameter / 2, diameter / 2, diameter / 2)
  gradient.addColorStop(0, 'rgba(0,0,0,1)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  pctx.fillStyle = gradient
  pctx.fillRect(0, 0, diameter, diameter)
  pctx.restore()

  const ctx = target.getContext('2d')
  ctx.save()
  ctx.globalAlpha = clamp(opts.opacity ?? 1, 0, 1)
  ctx.drawImage(patch, x - diameter / 2, y - diameter / 2)
  ctx.restore()
}

export function paintPatchLine(target, source, from, to, opts) {
  const spacing = Math.max(2, (opts.size || 8) * 0.28)
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  const steps = Math.max(1, Math.ceil(distance / spacing))
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps
    paintPatch(target, source, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, {
      ...opts,
      sourceX: (opts.sourceX ?? from.x) + (to.x - from.x) * t,
      sourceY: (opts.sourceY ?? from.y) + (to.y - from.y) * t,
    })
  }
}

export function smudgeLine(target, underlay, from, to, opts) {
  const size = Math.max(4, opts.size || 8)
  const radius = size / 2
  const diameter = Math.ceil(size) + 2
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  const spacing = Math.max(1.5, size * 0.12)
  const steps = Math.max(1, Math.ceil(distance / spacing))
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps
    const sx = from.x + (to.x - from.x) * (t * 0.7)
    const sy = from.y + (to.y - from.y) * (t * 0.7)
    const dx = from.x + (to.x - from.x) * t
    const dy = from.y + (to.y - from.y) * t
    const patch = createCanvas(diameter, diameter)
    const pctx = patch.getContext('2d')
    if (underlay) pctx.drawImage(underlay, sx - radius, sy - radius, diameter, diameter, 0, 0, diameter, diameter)
    pctx.drawImage(target, sx - radius, sy - radius, diameter, diameter, 0, 0, diameter, diameter)
    pctx.globalCompositeOperation = 'destination-in'
    const gradient = pctx.createRadialGradient(diameter / 2, diameter / 2, radius * 0.25, diameter / 2, diameter / 2, radius)
    gradient.addColorStop(0, 'rgba(0,0,0,1)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    pctx.fillStyle = gradient
    pctx.fillRect(0, 0, diameter, diameter)
    const ctx = target.getContext('2d')
    ctx.save()
    ctx.globalAlpha = clamp(opts.strength ?? 0.55, 0, 1) * 0.65
    ctx.drawImage(patch, dx - diameter / 2, dy - diameter / 2)
    ctx.restore()
  }
}

// Patch tool: drop a rectangle, fill it with feathered pixels sampled from the
// left (or right) of the rectangle.
export function patchRect(target, underlay, rect, opts = {}) {
  const size = Math.max(6, Math.min(rect.width, rect.height))
  const offsetX = opts.offsetX ?? -rect.width
  const offsetY = opts.offsetY ?? 0
  const step = Math.max(4, size * 0.22)
  const cols = Math.max(1, Math.ceil(rect.width / step))
  const rows = Math.max(1, Math.ceil(rect.height / step))
  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= cols; col += 1) {
      paintPatch(target, underlay, rect.x + (col / cols) * rect.width, rect.y + (row / rows) * rect.height, {
        size: step * 1.6,
        hardness: 0.35,
        opacity: 0.9,
        filter: 'blur(1.5px)',
        sourceX: rect.x + (col / cols) * rect.width + offsetX,
        sourceY: rect.y + (row / rows) * rect.height + offsetY,
      })
    }
  }
}

export async function layerDataUrl(canvas, quality = 0.95) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (!blob) return canvas.toDataURL('image/png')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the paint layer'))
    reader.readAsDataURL(blob)
  })
}
