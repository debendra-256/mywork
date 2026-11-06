import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, QrCode, X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

const FRAMES = [
  { id: 'none', label: 'None' },
  { id: 'border', label: 'Border' },
  { id: 'classic', label: 'Classic' },
  { id: 'label', label: 'Label' },
  { id: 'sketch', label: 'Sketch' },
  { id: 'handwrite', label: 'Handwrite' },
  { id: 'note', label: 'Note' },
  { id: 'sticky', label: 'Sticky' },
  { id: 'kraft', label: 'Kraft' },
  { id: 'leather', label: 'Leather' },
  { id: 'tag', label: 'Tag' },
  { id: 'blueribbon', label: 'Blue ribbon' },
  { id: 'blueband', label: 'Blue band' },
  { id: 'orange', label: 'Orange' },
  { id: 'green', label: 'Green' },
  { id: 'red', label: 'Red' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'doodle', label: 'Doodle' },
  { id: 'circle', label: 'Circle' },
  { id: 'phone', label: 'Phone' },
]

const BANDED_FRAMES = {
  blueband: { border: '#2f7fd0', band: '#d6ecfd', text: '#1d5c9e', label: 'Scan Me.', hairline: true },
  orange: { border: '#ef7c1a', band: '#ef7c1a', text: '#ffffff', label: 'SCAN ME' },
  green: { border: '#2ea44f', band: '#2ea44f', text: '#ffffff', label: 'Scan me!' },
  red: { border: '#d32f2f', band: '#d32f2f', text: '#ffffff', label: 'SCAN ME' },
}

const SANS = '"Inter", "Segoe UI", system-ui, sans-serif'
const SCRIPT = '"Segoe Script", "Comic Sans MS", cursive'

function roundRectPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function topRoundRectPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h)
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h)
  ctx.closePath()
}

function bottomRoundRectPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y)
  ctx.closePath()
}

function wavyRectPath(ctx, width, height, amplitude) {
  const steps = 9
  const points = []
  for (let i = 0; i <= steps; i += 1) points.push([(width * i) / steps, i % 2 ? amplitude : 0])
  for (let i = 1; i <= steps; i += 1) points.push([width - (i % 2 ? amplitude : 0), (height * i) / steps])
  for (let i = 1; i <= steps; i += 1) points.push([width - (width * i) / steps, height - (i % 2 ? amplitude : 0)])
  for (let i = 1; i <= steps; i += 1) points.push([i % 2 ? amplitude : 0, height - (height * i) / steps])
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1])
  ctx.closePath()
}

function drawFramedQr(canvas, qrImage, frameId, baseSize) {
  if (!canvas || !qrImage || !qrImage.width) return null
  const S = baseSize || qrImage.width
  const u = S / 320
  const px = (value) => Math.max(1, Math.round(value * u))
  const m = px(22)
  const pad = px(20)
  const sizes = {
    none: [S, S],
    border: [S + px(52), S + px(52)],
    classic: [S + m * 2, S + m * 2 + px(48)],
    label: [S + pad * 2, S + pad * 2 + px(46)],
    sketch: [S + px(48), S + px(96)],
    handwrite: [S + px(48), S + px(100)],
    note: [S + px(48), S + px(48)],
    sticky: [S + pad * 2, px(48) + S + pad],
    kraft: [S + px(44), S + px(92)],
    leather: [S + px(52), S + px(52)],
    tag: [S + px(32), S + px(104)],
    blueribbon: [S + px(36), S + px(92)],
    blueband: [S + px(40), S + px(92)],
    orange: [S + px(40), S + px(92)],
    green: [S + px(40), S + px(92)],
    red: [S + px(40), S + px(92)],
    ribbon: [S + m * 2, S + m * 2 + px(58)],
    arrow: [S + px(48), S + px(98)],
    doodle: [S + px(136), S + px(44)],
    circle: [Math.round(S * 1.56), Math.round(S * 1.56)],
    phone: [S + px(44), S + px(100)],
  }
  const [width, height] = sizes[frameId] || sizes.none
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, width, height)

  const write = (text, x, y, font, fill, spacing = 0) => {
    ctx.save()
    ctx.font = font
    ctx.fillStyle = fill
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${px(spacing)}px`
    ctx.fillText(text, x, y)
    ctx.restore()
  }
  const drawQr = (x, y) => ctx.drawImage(qrImage, x, y, S, S)

  if (frameId === 'classic') {
    const labelHeight = px(48)
    roundRectPath(ctx, 0, 0, width, height, px(18))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    topRoundRectPath(ctx, px(3), px(3), width - px(6), labelHeight, px(15))
    ctx.fillStyle = '#17231c'
    ctx.fill()
    write('SCAN ME', width / 2, px(3) + labelHeight / 2, `800 ${px(18)}px ${SANS}`, '#ffffff', 4)
    drawQr(m, labelHeight + m)
    roundRectPath(ctx, px(1.75), px(1.75), width - px(3.5), height - px(3.5), px(17))
    ctx.strokeStyle = '#17231c'
    ctx.lineWidth = px(3.5)
    ctx.stroke()
  } else if (frameId === 'label') {
    const labelHeight = px(46)
    const pillWidth = px(176)
    const pillHeight = px(42)
    const pillX = (width - pillWidth) / 2
    roundRectPath(ctx, px(1.5), px(1.5), width - px(3), height - px(3), px(14))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#1f2521'
    ctx.lineWidth = px(2.5)
    ctx.stroke()
    roundRectPath(ctx, pillX, 0, pillWidth, pillHeight, px(11))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(pillX + px(2), pillHeight - px(2), pillWidth - px(4), px(4))
    write('SCAN ME', width / 2, pillHeight / 2, `800 ${px(17)}px ${SANS}`, '#1d2420', 3)
    drawQr(pad, labelHeight + pad)
  } else if (frameId === 'sticky') {
    roundRectPath(ctx, 0, 0, width, height, px(7))
    ctx.fillStyle = '#f6e7a5'
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(width - px(34), height)
    ctx.lineTo(width, height - px(34))
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = '#e3d18d'
    ctx.fill()
    write('Scan me', width / 2, px(24), `italic 700 ${px(24)}px ${SCRIPT}`, '#6d551f')
    drawQr(pad, px(48))
  } else if (frameId === 'tag') {
    roundRectPath(ctx, 0, 0, width, height, px(14))
    ctx.fillStyle = '#5fd3e6'
    ctx.fill()
    write('SCAN ME', width / 2, px(21), `800 ${px(12)}px ${SANS}`, '#12283f', 3)
    roundRectPath(ctx, px(8), px(38), S + px(16), S + px(16), px(9))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    drawQr(px(16), px(46))
    bottomRoundRectPath(ctx, 0, height - px(44), width, px(44), px(14))
    ctx.fillStyle = '#12283f'
    ctx.fill()
    write('Scan Me!', width / 2, height - px(22), `800 ${px(20)}px ${SANS}`, '#ffffff', 1)
  } else if (frameId === 'ribbon') {
    roundRectPath(ctx, px(1.25), px(1.25), width - px(2.5), height - px(2.5), px(16))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#24292e'
    ctx.lineWidth = px(2.5)
    ctx.stroke()
    drawQr(m, m)
    const top = height - px(63)
    const bottom = height - px(17)
    const middle = (top + bottom) / 2
    const left = width * 0.06
    const right = width * 0.94
    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(right, top)
    ctx.lineTo(right - px(12), middle)
    ctx.lineTo(right, bottom)
    ctx.lineTo(left, bottom)
    ctx.lineTo(left + px(12), middle)
    ctx.closePath()
    ctx.fillStyle = '#c62f2f'
    ctx.fill()
    write('SCAN ME', width / 2, middle, `800 ${px(18)}px ${SANS}`, '#ffffff', 3)
  } else if (frameId === 'border') {
    const m2 = px(26)
    roundRectPath(ctx, px(1.5), px(1.5), width - px(3), height - px(3), px(20))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#17231c'
    ctx.lineWidth = px(3)
    ctx.stroke()
    drawQr(m2, m2)
  } else if (frameId === 'sketch') {
    const labelHeight = px(48)
    const m2 = px(24)
    roundRectPath(ctx, px(2), px(2), width - px(4), height - px(4), px(10))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#2f6fd0'
    ctx.lineWidth = px(3.5)
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.translate(px(1.5), -px(1))
    ctx.lineWidth = px(1.5)
    ctx.stroke()
    ctx.restore()
    write('SCAN ME', width / 2, labelHeight / 2, `800 ${px(17)}px ${SANS}`, '#2f6fd0', 2)
    drawQr(m2, labelHeight + m2)
  } else if (frameId === 'handwrite') {
    const labelHeight = px(52)
    const m2 = px(24)
    roundRectPath(ctx, px(1), px(1), width - px(2), height - px(2), px(6))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#3a3a3a'
    ctx.lineWidth = px(2)
    ctx.stroke()
    ctx.save()
    ctx.translate(width / 2, labelHeight / 2 - px(2))
    ctx.rotate(-0.035)
    ctx.font = `italic 800 ${px(27)}px ${SCRIPT}`
    ctx.fillStyle = '#e23b2e'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SCAN ME!', 0, 0)
    ctx.restore()
    ctx.strokeStyle = '#e23b2e'
    ctx.lineWidth = px(2)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(width * 0.3, px(39))
    ctx.quadraticCurveTo(width * 0.5, px(45), width * 0.7, px(38))
    ctx.stroke()
    drawQr(m2, labelHeight + m2)
  } else if (frameId === 'kraft') {
    roundRectPath(ctx, 0, 0, width, height, px(5))
    ctx.fillStyle = '#b4875c'
    ctx.fill()
    roundRectPath(ctx, px(7), px(7), width - px(14), height - px(14), px(3))
    ctx.strokeStyle = '#8f6844'
    ctx.lineWidth = px(2)
    ctx.stroke()
    drawQr(px(22), px(22))
    write('Scan me', width / 2, height - px(24), `italic 800 ${px(24)}px ${SCRIPT}`, '#fff7ea')
  } else if (BANDED_FRAMES[frameId]) {
    const style = BANDED_FRAMES[frameId]
    const m2 = px(20)
    const bandHeight = px(52)
    roundRectPath(ctx, px(1.5), px(1.5), width - px(3), height - px(3), px(16))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = style.border
    ctx.lineWidth = px(3)
    ctx.stroke()
    drawQr(m2, m2)
    bottomRoundRectPath(ctx, 0, height - bandHeight, width, bandHeight, px(14))
    ctx.fillStyle = style.band
    ctx.fill()
    if (style.hairline) {
      ctx.strokeStyle = style.border
      ctx.lineWidth = px(2)
      ctx.beginPath()
      ctx.moveTo(0, height - bandHeight)
      ctx.lineTo(width, height - bandHeight)
      ctx.stroke()
    }
    write(style.label, width / 2, height - bandHeight / 2, `800 ${px(18)}px ${SANS}`, style.text, 2)
  } else if (frameId === 'arrow') {
    const labelHeight = px(50)
    const m2 = px(24)
    roundRectPath(ctx, px(1), px(1), width - px(2), height - px(2), px(10))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#454545'
    ctx.lineWidth = px(1.5)
    ctx.stroke()
    ctx.save()
    ctx.translate(width * 0.4, labelHeight / 2)
    ctx.rotate(-0.03)
    ctx.font = `italic 800 ${px(25)}px ${SCRIPT}`
    ctx.fillStyle = '#1f9d55'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Scan me', 0, 0)
    ctx.restore()
    ctx.strokeStyle = '#1f9d55'
    ctx.lineWidth = px(2.5)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(width * 0.66, px(10))
    ctx.quadraticCurveTo(width * 0.93, px(15), width * 0.83, px(43))
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(width * 0.83, px(43))
    ctx.lineTo(width * 0.765, px(35))
    ctx.moveTo(width * 0.83, px(43))
    ctx.lineTo(width * 0.875, px(34))
    ctx.stroke()
    drawQr(m2, labelHeight + m2)
  } else if (frameId === 'circle') {
    const cx = width / 2
    const cy = height / 2
    const radius = width / 2 - px(1.5)
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#17231c'
    ctx.lineWidth = px(3)
    ctx.stroke()
    drawQr((width - S) / 2, cy - S / 2 - px(12))
    const pillWidth = px(126)
    const pillHeight = px(28)
    const pillX = (width - pillWidth) / 2
    const pillY = cy + radius - px(40)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.clip()
    roundRectPath(ctx, pillX, pillY, pillWidth, pillHeight, px(6))
    ctx.fillStyle = '#7e4bd1'
    ctx.fill()
    write('SCAN ME!', cx, pillY + pillHeight / 2, `800 ${px(12)}px ${SANS}`, '#ffffff', 1.2)
    ctx.restore()
  } else if (frameId === 'note') {
    const m2 = px(24)
    ctx.save()
    ctx.shadowColor = 'rgba(70, 60, 10, 0.28)'
    ctx.shadowBlur = px(10)
    ctx.shadowOffsetY = px(5)
    roundRectPath(ctx, px(2), px(2), width - px(4), height - px(4), px(4))
    ctx.fillStyle = '#f4eda0'
    ctx.fill()
    ctx.restore()
    ctx.beginPath()
    ctx.moveTo(px(3), height - px(28))
    ctx.quadraticCurveTo(px(10), height - px(10), px(30), height - px(3))
    ctx.lineTo(px(3), height - px(3))
    ctx.closePath()
    ctx.fillStyle = '#e4d985'
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(px(3), height - px(28))
    ctx.quadraticCurveTo(px(10), height - px(10), px(30), height - px(3))
    ctx.strokeStyle = 'rgba(150, 130, 50, 0.55)'
    ctx.lineWidth = px(1.2)
    ctx.stroke()
    drawQr(m2, m2)
  } else if (frameId === 'leather') {
    const amplitude = px(2.5)
    wavyRectPath(ctx, width, height, amplitude)
    ctx.fillStyle = '#ad6c2c'
    ctx.fill()
    const sheen = ctx.createRadialGradient(width * 0.5, height * 0.42, S * 0.08, width * 0.5, height * 0.55, S * 0.72)
    sheen.addColorStop(0, 'rgba(255, 209, 140, 0.45)')
    sheen.addColorStop(1, 'rgba(96, 52, 12, 0)')
    wavyRectPath(ctx, width, height, amplitude)
    ctx.fillStyle = sheen
    ctx.fill()
    wavyRectPath(ctx, width, height, amplitude)
    ctx.strokeStyle = 'rgba(105, 58, 18, 0.7)'
    ctx.lineWidth = px(3)
    ctx.stroke()
    let seed = 11
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    ctx.fillStyle = 'rgba(70, 38, 8, 0.22)'
    for (let i = 0; i < 140; i += 1) {
      ctx.beginPath()
      ctx.arc(random() * width, random() * height, px(0.6 + random() * 1.8), 0, Math.PI * 2)
      ctx.fill()
    }
    drawQr(px(26), px(26))
  } else if (frameId === 'blueribbon') {
    const m2 = px(18)
    const cardHeight = S + px(58)
    roundRectPath(ctx, 0, 0, width, cardHeight, px(14))
    ctx.fillStyle = '#6fd8ea'
    ctx.fill()
    drawQr(m2, m2)
    const ribbonHeight = px(40)
    const top = cardHeight - px(10)
    const middle = top + ribbonHeight / 2
    const left = width * 0.04
    const right = width * 0.96
    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(right, top)
    ctx.lineTo(right - px(12), middle)
    ctx.lineTo(right, top + ribbonHeight)
    ctx.lineTo(left, top + ribbonHeight)
    ctx.lineTo(left + px(12), middle)
    ctx.closePath()
    ctx.fillStyle = '#2e78b7'
    ctx.fill()
    ctx.save()
    ctx.font = `italic 800 ${px(21)}px ${SCRIPT}`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Scan Me', width / 2, middle)
    ctx.restore()
  } else if (frameId === 'doodle') {
    const cardX = px(96)
    const cardY = px(4)
    const cardSize = S + px(36)
    roundRectPath(ctx, cardX, cardY, cardSize, cardSize, px(12))
    ctx.fillStyle = '#b8b8b8'
    ctx.fill()
    ctx.strokeStyle = '#a4a4a4'
    ctx.lineWidth = px(1.5)
    ctx.stroke()
    drawQr(cardX + px(18), cardY + px(18))
    ctx.strokeStyle = '#161616'
    ctx.lineWidth = px(2.5)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px(86), px(30))
    ctx.bezierCurveTo(px(20), px(40), px(18), px(96), px(56), px(104))
    ctx.bezierCurveTo(px(94), px(112), px(60), px(168), px(34), px(158))
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(px(86), px(30))
    ctx.lineTo(px(72), px(21))
    ctx.moveTo(px(86), px(30))
    ctx.lineTo(px(70), px(40))
    ctx.stroke()
    ctx.save()
    ctx.font = `italic 800 ${px(23)}px ${SCRIPT}`
    ctx.fillStyle = '#141414'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Scan me', px(48), height - px(16))
    ctx.restore()
  } else if (frameId === 'phone') {
    roundRectPath(ctx, 0, 0, width, height, px(38))
    ctx.fillStyle = '#1c232c'
    ctx.fill()
    roundRectPath(ctx, px(10), px(10), width - px(20), height - px(20), px(29))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    roundRectPath(ctx, (width - px(62)) / 2, px(17), px(62), px(7), px(4))
    ctx.fillStyle = '#1c232c'
    ctx.fill()
    drawQr(px(22), px(46))
    write('Scan me', width / 2, px(46) + S + px(20), `600 ${px(16)}px ${SANS}`, '#8b949e')
    roundRectPath(ctx, (width - px(76)) / 2, height - px(16), px(76), px(5), px(3))
    ctx.fillStyle = '#d7dde3'
    ctx.fill()
  } else {
    drawQr(0, 0)
  }
  return { width, height }
}

function makeSampleQr() {
  const canvas = document.createElement('canvas')
  canvas.width = 240
  canvas.height = 240
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 240, 240)
  const grid = 15
  const cell = 240 / 17
  const offset = cell
  let seed = 7
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  ctx.fillStyle = '#17231c'
  for (let y = 0; y < grid; y += 1) {
    for (let x = 0; x < grid; x += 1) {
      const inFinder = (x < 3 && y < 3) || (x > grid - 4 && y < 3) || (x < 3 && y > grid - 4)
      if (!inFinder && random() > 0.5) ctx.fillRect(offset + x * cell, offset + y * cell, cell, cell)
    }
  }
  for (const [fx, fy] of [[0, 0], [grid - 3, 0], [0, grid - 3]]) {
    const x = offset + fx * cell
    const y = offset + fy * cell
    ctx.fillRect(x, y, cell * 3, cell * 3)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x + cell, y + cell, cell, cell)
    ctx.fillStyle = '#17231c'
    ctx.fillRect(x + cell * 1.3, y + cell * 1.3, cell * 0.4, cell * 0.4)
  }
  return canvas
}

function FrameThumb({ frame, sample }) {
  const ref = useRef(null)
  useEffect(() => {
    drawFramedQr(ref.current, sample, frame)
  }, [frame, sample])
  return <canvas ref={ref} aria-hidden="true" />
}

export default function QRCodeGenerator() {
  const [value, setValue] = useState('')
  const [qrColor, setQrColor] = useState('#17231c')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [size, setSize] = useState(320)
  const [frame, setFrame] = useState('none')
  const [dims, setDims] = useState({ width: 320, height: 320 })
  const qrCanvasRef = useRef(null)
  const composedRef = useRef(null)
  const sampleQr = useMemo(makeSampleQr, [])

  useEffect(() => {
    if (!value.trim()) return
    const composed = drawFramedQr(composedRef.current, qrCanvasRef.current, frame, size)
    if (composed) setDims(composed)
  }, [value, qrColor, bgColor, size, frame])

  const download = () => {
    const canvas = composedRef.current
    if (!canvas || !value.trim()) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'imgmojo-qr-code.png'
    link.click()
  }

  const frameLabel = FRAMES.find((item) => item.id === frame)?.label || 'None'

  return <section className="home-photo-generator qr-generator" aria-label="QR code generator">
    <div className="qr-generator-layout">
      <div className="qr-generator-settings">
        <label className="qr-field-label" htmlFor="qr-generator-value">Link or text</label>
        <textarea id="qr-generator-value" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Paste a link or enter text" rows={5} />
        <div className="qr-color-fields">
          <label>QR color<input type="color" value={qrColor} onChange={(event) => setQrColor(event.target.value)} /></label>
          <label>Background<input type="color" value={bgColor} onChange={(event) => setBgColor(event.target.value)} /></label>
        </div>
        <div className="qr-frame-field">
          <span className="qr-field-label">Frame</span>
          <div className="qr-frame-grid" role="radiogroup" aria-label="QR frame">
            {FRAMES.map((item) => <button type="button" key={item.id} role="radio" aria-checked={frame === item.id} className={`qr-frame-option${frame === item.id ? ' is-active' : ''}`} onClick={() => setFrame(item.id)} title={`${item.label} frame`}>
              <FrameThumb frame={item.id} sample={sampleQr} />
              <span>{item.label}</span>
            </button>)}
          </div>
        </div>
        <label className="qr-size-field">Image size <span>{size}px</span><input type="range" min="160" max="640" step="32" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label>
        <div className="qr-generator-actions"><button type="button" className="qr-clear-button" onClick={() => setValue('')} disabled={!value}><X size={15} />Clear</button><button type="button" className="qr-download-button" onClick={download} disabled={!value.trim()}><Download size={16} />Download PNG</button></div>
      </div>
      <div className="qr-generator-preview">
        <div className="qr-preview-frame" style={{ backgroundColor: bgColor }}>
          {value.trim() ? <>
            <QRCodeCanvas ref={qrCanvasRef} value={value.trim()} size={size} fgColor={qrColor} bgColor={bgColor} level="H" marginSize={2} style={{ display: 'none' }} />
            <canvas ref={composedRef} className="qr-framed-canvas" role="img" aria-label={`QR code with ${frameLabel} frame`} />
          </> : <div className="qr-preview-empty"><QrCode size={68} strokeWidth={1.2} /><span>Your QR code will appear here</span></div>}
        </div>
        <strong>{value.trim() ? 'Ready to scan' : 'Enter a link or text to begin'}</strong>
        <p>{value.trim() ? `${frameLabel} frame · PNG ${dims.width} × ${dims.height} px` : `PNG download · ${size} × ${size} px`}</p>
      </div>
    </div>
  </section>
}
