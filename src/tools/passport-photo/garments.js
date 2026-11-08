/**
 * Formal clothing overlays for the passport tool.
 * Nothing here is a bitmap: every garment is drawn with canvas paths from the
 * measured head position, so it scales cleanly from 300 px uploads to 600 DPI
 * prints and can be recoloured by the user.
 */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

function rgbOf(color) {
  const value = String(color || '#000000').trim()
  const hex = value.replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex.padEnd(6, '0')
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}

export function shade(color, amount) {
  const [r, g, b] = rgbOf(color)
  const mix = (channel) => clamp(Math.round(amount >= 0 ? channel + (255 - channel) * amount : channel * (1 + amount)), 0, 255)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function poly(ctx, points) {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  ctx.closePath()
}

function fill(ctx, points, color) {
  poly(ctx, points)
  ctx.fillStyle = color
  ctx.fill()
}

function shoulderBody(ctx, g, topHalfScale, color, dip) {
  const left = g.cx - g.shoulder
  const right = g.cx + g.shoulder
  const neck = g.neckHalf * topHalfScale
  const shoulderY = g.shoulderY + dip * g.hw
  ctx.beginPath()
  ctx.moveTo(left, g.H + 2)
  ctx.lineTo(left, shoulderY + g.hw * 0.34)
  ctx.quadraticCurveTo(left + g.hw * 0.06, shoulderY, g.cx - neck, shoulderY - g.hw * 0.06)
  ctx.lineTo(g.cx + neck, shoulderY - g.hw * 0.06)
  ctx.quadraticCurveTo(g.right - g.hw * 0.06, shoulderY, g.right, shoulderY + g.hw * 0.34)
  ctx.lineTo(g.right, g.H + 2)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function sleeveSeams(ctx, g, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, g.hw * 0.035)
  ctx.beginPath()
  ctx.moveTo(g.cx - g.shoulder * 0.84, g.shoulderY + g.hw * 0.3)
  ctx.lineTo(g.cx - g.shoulder * 0.78, g.H)
  ctx.moveTo(g.cx + g.shoulder * 0.84, g.shoulderY + g.hw * 0.3)
  ctx.lineTo(g.cx + g.shoulder * 0.78, g.H)
  ctx.stroke()
}

/** Geometry every drafter needs, derived once from the frame and head position. */
function geometry(W, H, head, options) {
  const headTopY = head.top * H
  const headBottomY = head.bottom * H
  const headH = headBottomY - headTopY
  // A head is roughly 0.72 × as wide as it is tall, so half its width is the
  // unit every drafter measures collars, lapels and ties against.
  const hw = headH * 0.36 * options.scale
  const cx = W / 2 + options.dx * W
  const chinY = headBottomY + options.dy * H
  return {
    W, H, hw, cx, chinY,
    neckHalf: hw * 0.42,
    shoulder: hw * 1.62,
    shoulderY: chinY + hw * 0.42,
    right: cx + hw * 1.62,
    headCenterY: (headTopY + chinY) / 2,
    headH,
  }
}

/* ---------------------------------------------------------------- drafters */

function suitWithTie(ctx, g, c) {
  const jacket = c.suit, shirt = c.shirt, tie = c.tie
  const vBottom = g.chinY + g.hw * 1.5
  shoulderBody(ctx, g, 1.0, jacket, 0)
  fill(ctx, [[g.cx - g.neckHalf * 0.95, g.shoulderY - g.hw * 0.04], [g.cx, vBottom], [g.cx + g.neckHalf * 0.95, g.shoulderY - g.hw * 0.04], [g.cx + g.neckHalf * 0.5, g.chinY - g.hw * 0.12], [g.cx - g.neckHalf * 0.5, g.chinY - g.hw * 0.12]], shirt)
  // shirt collar wings
  fill(ctx, [[g.cx - g.neckHalf * 0.86, g.chinY - g.hw * 0.1], [g.cx - g.neckHalf * 0.12, g.chinY + g.hw * 0.5], [g.cx - g.neckHalf * 0.62, g.chinY + g.hw * 0.62]], shade(shirt, 0.1))
  fill(ctx, [[g.cx + g.neckHalf * 0.86, g.chinY - g.hw * 0.1], [g.cx + g.neckHalf * 0.12, g.chinY + g.hw * 0.5], [g.cx + g.neckHalf * 0.62, g.chinY + g.hw * 0.62]], shade(shirt, 0.1))
  // lapels
  const lapel = shade(jacket, -0.16)
  fill(ctx, [[g.cx - g.neckHalf * 1.02, g.shoulderY - g.hw * 0.02], [g.cx - g.neckHalf * 0.4, g.chinY - g.hw * 0.08], [g.cx - g.hw * 0.02, vBottom + g.hw * 0.1], [g.cx - g.neckHalf * 1.5, g.shoulderY + g.hw * 0.9], [g.cx - g.neckHalf * 1.72, g.shoulderY + g.hw * 0.16]], lapel)
  fill(ctx, [[g.cx + g.neckHalf * 1.02, g.shoulderY - g.hw * 0.02], [g.cx + g.neckHalf * 0.4, g.chinY - g.hw * 0.08], [g.cx + g.hw * 0.02, vBottom + g.hw * 0.1], [g.cx + g.neckHalf * 1.5, g.shoulderY + g.hw * 0.9], [g.cx + g.neckHalf * 1.72, g.shoulderY + g.hw * 0.16]], lapel)
  // tie knot + blade
  fill(ctx, [[g.cx - g.hw * 0.16, g.chinY + g.hw * 0.4], [g.cx + g.hw * 0.16, g.chinY + g.hw * 0.4], [g.cx + g.hw * 0.12, g.chinY + g.hw * 0.72], [g.cx - g.hw * 0.12, g.chinY + g.hw * 0.72]], tie)
  fill(ctx, [[g.cx - g.hw * 0.11, g.chinY + g.hw * 0.7], [g.cx + g.hw * 0.11, g.chinY + g.hw * 0.7], [g.cx + g.hw * 0.2, g.H * 0.94], [g.cx, g.H], [g.cx - g.hw * 0.2, g.H * 0.94]], shade(tie, -0.08))
  sleeveSeams(ctx, g, shade(jacket, -0.24))
}

function suitOpenCollar(ctx, g, c) {
  shoulderBody(ctx, g, 1.02, c.suit, 0)
  const vBottom = g.chinY + g.hw * 1.25
  fill(ctx, [[g.cx - g.neckHalf * 0.95, g.shoulderY], [g.cx, vBottom], [g.cx + g.neckHalf * 0.95, g.shoulderY], [g.cx + g.neckHalf * 0.3, g.chinY - g.hw * 0.14], [g.cx - g.neckHalf * 0.3, g.chinY - g.hw * 0.14]], c.shirt)
  fill(ctx, [[g.cx - g.neckHalf * 1.06, g.shoulderY - g.hw * 0.04], [g.cx - g.hw * 0.04, vBottom], [g.cx - g.neckHalf * 1.62, g.shoulderY + g.hw * 0.86]], shade(c.suit, -0.14))
  fill(ctx, [[g.cx + g.neckHalf * 1.06, g.shoulderY - g.hw * 0.04], [g.cx + g.hw * 0.04, vBottom], [g.cx + g.neckHalf * 1.62, g.shoulderY + g.hw * 0.86]], shade(c.suit, -0.14))
  fill(ctx, [[g.cx - g.neckHalf * 0.5, g.chinY - g.hw * 0.16], [g.cx - g.hw * 0.06, g.chinY + g.hw * 0.42], [g.cx - g.neckHalf * 0.78, g.chinY + g.hw * 0.5]], shade(c.shirt, 0.12))
  fill(ctx, [[g.cx + g.neckHalf * 0.5, g.chinY - g.hw * 0.16], [g.cx + g.hw * 0.06, g.chinY + g.hw * 0.42], [g.cx + g.neckHalf * 0.78, g.chinY + g.hw * 0.5]], shade(c.shirt, 0.12))
  sleeveSeams(ctx, g, shade(c.suit, -0.24))
}

function shirtAndTie(ctx, g, c) {
  const shoulderY = g.shoulderY + g.hw * 0.12
  ctx.beginPath()
  ctx.moveTo(g.cx - g.shoulder * 0.9, g.H + 2)
  ctx.lineTo(g.cx - g.shoulder * 0.9, shoulderY + g.hw * 0.3)
  ctx.quadraticCurveTo(g.cx - g.shoulder * 0.86, shoulderY, g.cx - g.neckHalf * 0.8, shoulderY - g.hw * 0.1)
  ctx.lineTo(g.cx + g.neckHalf * 0.8, shoulderY - g.hw * 0.1)
  ctx.quadraticCurveTo(g.cx + g.shoulder * 0.86, shoulderY, g.cx + g.shoulder * 0.9, shoulderY + g.hw * 0.3)
  ctx.lineTo(g.cx + g.shoulder * 0.9, g.H + 2)
  ctx.closePath()
  ctx.fillStyle = c.shirt
  ctx.fill()
  const wing = shade(c.shirt, -0.1)
  fill(ctx, [[g.cx - g.neckHalf * 0.9, shoulderY - g.hw * 0.12], [g.cx - g.hw * 0.05, shoulderY + g.hw * 0.62], [g.cx - g.neckHalf * 1.15, shoulderY + g.hw * 0.58]], wing)
  fill(ctx, [[g.cx + g.neckHalf * 0.9, shoulderY - g.hw * 0.12], [g.cx + g.hw * 0.05, shoulderY + g.hw * 0.62], [g.cx + g.neckHalf * 1.15, shoulderY + g.hw * 0.58]], wing)
  fill(ctx, [[g.cx - g.hw * 0.17, shoulderY + g.hw * 0.5], [g.cx + g.hw * 0.17, shoulderY + g.hw * 0.5], [g.cx + g.hw * 0.13, shoulderY + g.hw * 0.86], [g.cx - g.hw * 0.13, shoulderY + g.hw * 0.86]], c.tie)
  fill(ctx, [[g.cx - g.hw * 0.12, shoulderY + g.hw * 0.84], [g.cx + g.hw * 0.12, shoulderY + g.hw * 0.84], [g.cx + g.hw * 0.21, g.H * 0.93], [g.cx, g.H], [g.cx - g.hw * 0.21, g.H * 0.93]], shade(c.tie, -0.08))
  ctx.strokeStyle = shade(c.shirt, -0.14)
  ctx.lineWidth = Math.max(1, g.hw * 0.03)
  ctx.beginPath()
  ctx.moveTo(g.cx - g.shoulder * 0.6, shoulderY + g.hw * 0.2)
  ctx.lineTo(g.cx - g.shoulder * 0.55, g.H)
  ctx.moveTo(g.cx + g.shoulder * 0.6, shoulderY + g.hw * 0.2)
  ctx.lineTo(g.cx + g.shoulder * 0.55, g.H)
  ctx.stroke()
}

function waistcoat(ctx, g, c) {
  fill(ctx, [[g.cx - g.neckHalf * 1.1, g.shoulderY], [g.cx, g.chinY + g.hw * 1.4], [g.cx + g.neckHalf * 1.1, g.shoulderY], [g.cx + g.neckHalf * 0.5, g.chinY - g.hw * 0.1], [g.cx - g.neckHalf * 0.5, g.chinY - g.hw * 0.1]], c.shirt)
  ctx.beginPath()
  ctx.moveTo(g.cx - g.shoulder * 0.86, g.H + 2)
  ctx.lineTo(g.cx - g.shoulder * 0.86, g.shoulderY + g.hw * 0.34)
  ctx.quadraticCurveTo(g.cx - g.shoulder * 0.8, g.shoulderY, g.cx - g.neckHalf * 1.05, g.shoulderY - g.hw * 0.06)
  ctx.lineTo(g.cx, g.chinY + g.hw * 1.5)
  ctx.lineTo(g.cx + g.neckHalf * 1.05, g.shoulderY - g.hw * 0.06)
  ctx.quadraticCurveTo(g.cx + g.shoulder * 0.8, g.shoulderY, g.cx + g.shoulder * 0.86, g.shoulderY + g.hw * 0.34)
  ctx.lineTo(g.cx + g.shoulder * 0.86, g.H + 2)
  ctx.closePath()
  ctx.fillStyle = c.suit
  ctx.fill()
  ctx.fillStyle = shade(c.suit, 0.16)
  for (let i = 0; i < 3; i++) {
    const y = g.chinY + g.hw * (1.9 + i * 0.72)
    ctx.beginPath(); ctx.arc(g.cx, y, Math.max(1.4, g.hw * 0.05), 0, Math.PI * 2); ctx.fill()
  }
  sleeveSeams(ctx, g, shade(c.suit, -0.2))
}

function nehruJacket(ctx, g, c) {
  shoulderBody(ctx, g, 0.92, c.suit, 0.06)
  const bandTop = g.chinY + g.hw * 0.06
  ctx.beginPath()
  ctx.ellipse(g.cx, bandTop, g.neckHalf * 0.86, g.hw * 0.3, 0, 0, Math.PI * 2)
  ctx.fillStyle = shade(c.suit, 0.12)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(g.cx, bandTop, g.neckHalf * 0.62, g.hw * 0.2, 0, 0, Math.PI * 2)
  ctx.fillStyle = c.shirt
  ctx.fill()
  ctx.strokeStyle = shade(c.suit, -0.22)
  ctx.lineWidth = Math.max(1, g.hw * 0.035)
  ctx.beginPath(); ctx.moveTo(g.cx, bandTop + g.hw * 0.2); ctx.lineTo(g.cx, g.H); ctx.stroke()
  ctx.fillStyle = shade(c.tie, 0.1)
  for (let i = 0; i < 4; i++) {
    const y = bandTop + g.hw * (0.5 + i * 0.62)
    ctx.beginPath(); ctx.arc(g.cx, y, Math.max(1.3, g.hw * 0.045), 0, Math.PI * 2); ctx.fill()
  }
  sleeveSeams(ctx, g, shade(c.suit, -0.16))
}

function womensBlazer(ctx, g, c) {
  const narrow = g.shoulder * 0.94
  ctx.beginPath()
  ctx.moveTo(g.cx - narrow, g.H + 2)
  ctx.lineTo(g.cx - narrow, g.shoulderY + g.hw * 0.3)
  ctx.quadraticCurveTo(g.cx - narrow * 0.95, g.shoulderY, g.cx - g.neckHalf * 0.72, g.shoulderY - g.hw * 0.04)
  ctx.lineTo(g.cx + g.neckHalf * 0.72, g.shoulderY - g.hw * 0.04)
  ctx.quadraticCurveTo(g.cx + narrow * 0.95, g.shoulderY, g.cx + narrow, g.shoulderY + g.hw * 0.3)
  ctx.lineTo(g.cx + narrow, g.H + 2)
  ctx.closePath()
  ctx.fillStyle = c.suit
  ctx.fill()
  const vBottom = g.chinY + g.hw * 1.7
  fill(ctx, [[g.cx - g.neckHalf * 0.74, g.shoulderY], [g.cx, vBottom], [g.cx + g.neckHalf * 0.74, g.shoulderY]], c.shirt)
  ctx.strokeStyle = shade(c.suit, -0.18)
  ctx.lineWidth = Math.max(1.2, g.hw * 0.05)
  ctx.beginPath()
  ctx.moveTo(g.cx - g.neckHalf * 0.76, g.shoulderY - g.hw * 0.02)
  ctx.lineTo(g.cx, vBottom + g.hw * 0.05)
  ctx.lineTo(g.cx + g.neckHalf * 0.76, g.shoulderY - g.hw * 0.02)
  ctx.stroke()
  ctx.fillStyle = shade(c.suit, 0.2)
  ctx.beginPath(); ctx.arc(g.cx, vBottom + g.hw * 0.34, Math.max(1.5, g.hw * 0.06), 0, Math.PI * 2); ctx.fill()
}

function boatNeckDress(ctx, g, c) {
  const wide = g.shoulder * 1.02
  ctx.beginPath()
  ctx.moveTo(g.cx - wide, g.H + 2)
  ctx.lineTo(g.cx - wide, g.shoulderY + g.hw * 0.24)
  ctx.quadraticCurveTo(g.cx - wide * 0.9, g.shoulderY - g.hw * 0.05, g.cx - g.neckHalf * 1.5, g.shoulderY - g.hw * 0.12)
  ctx.quadraticCurveTo(g.cx, g.shoulderY + g.hw * 0.34, g.cx + g.neckHalf * 1.5, g.shoulderY - g.hw * 0.12)
  ctx.quadraticCurveTo(g.cx + wide * 0.9, g.shoulderY - g.hw * 0.05, g.cx + wide, g.shoulderY + g.hw * 0.24)
  ctx.lineTo(g.cx + wide, g.H + 2)
  ctx.closePath()
  ctx.fillStyle = c.suit
  ctx.fill()
  ctx.strokeStyle = shade(c.suit, 0.22)
  ctx.lineWidth = Math.max(1.2, g.hw * 0.055)
  ctx.beginPath()
  ctx.moveTo(g.cx - g.neckHalf * 1.5, g.shoulderY - g.hw * 0.1)
  ctx.quadraticCurveTo(g.cx, g.shoulderY + g.hw * 0.36, g.cx + g.neckHalf * 1.5, g.shoulderY - g.hw * 0.1)
  ctx.stroke()
}

function sareeDrape(ctx, g, c) {
  shoulderBody(ctx, g, 0.98, c.shirt, 0.04)
  const drape = c.suit
  ctx.beginPath()
  ctx.moveTo(g.cx - g.shoulder * 1.02, g.H + 2)
  ctx.lineTo(g.cx - g.shoulder * 1.02, g.shoulderY + g.hw * 0.5)
  ctx.quadraticCurveTo(g.cx - g.shoulder * 0.7, g.shoulderY - g.hw * 0.1, g.cx - g.neckHalf * 0.5, g.chinY + g.hw * 0.06)
  ctx.quadraticCurveTo(g.cx + g.shoulder * 0.5, g.chinY + g.hw * 0.6, g.cx + g.shoulder * 1.02, g.shoulderY + g.hw * 1.1)
  ctx.lineTo(g.cx + g.shoulder * 1.02, g.H + 2)
  ctx.closePath()
  ctx.fillStyle = drape
  ctx.fill()
  ctx.strokeStyle = shade(c.tie, 0.1)
  ctx.lineWidth = Math.max(1.4, g.hw * 0.09)
  ctx.beginPath()
  ctx.moveTo(g.cx - g.neckHalf * 0.5, g.chinY + g.hw * 0.14)
  ctx.quadraticCurveTo(g.cx + g.shoulder * 0.44, g.chinY + g.hw * 0.68, g.cx + g.shoulder * 1.0, g.shoulderY + g.hw * 1.16)
  ctx.stroke()
  fill(ctx, [[g.cx - g.neckHalf * 0.62, g.chinY - g.hw * 0.06], [g.cx + g.neckHalf * 0.2, g.chinY + g.hw * 0.34], [g.cx - g.neckHalf * 0.2, g.chinY + g.hw * 0.52]], shade(c.shirt, 0.1))
}

function kidsCollar(ctx, g, c) {
  const small = g.shoulder * 0.86
  ctx.beginPath()
  ctx.moveTo(g.cx - small, g.H + 2)
  ctx.lineTo(g.cx - small, g.shoulderY + g.hw * 0.42)
  ctx.quadraticCurveTo(g.cx - small * 0.92, g.shoulderY + g.hw * 0.1, g.cx - g.neckHalf * 0.7, g.shoulderY)
  ctx.lineTo(g.cx + g.neckHalf * 0.7, g.shoulderY)
  ctx.quadraticCurveTo(g.cx + small * 0.92, g.shoulderY + g.hw * 0.1, g.cx + small, g.shoulderY + g.hw * 0.42)
  ctx.lineTo(g.cx + small, g.H + 2)
  ctx.closePath()
  ctx.fillStyle = c.shirt
  ctx.fill()
  const wing = shade(c.shirt, -0.12)
  fill(ctx, [[g.cx - g.neckHalf * 0.8, g.shoulderY - g.hw * 0.02], [g.cx - g.hw * 0.04, g.shoulderY + g.hw * 0.6], [g.cx - g.neckHalf * 1.05, g.shoulderY + g.hw * 0.56]], wing)
  fill(ctx, [[g.cx + g.neckHalf * 0.8, g.shoulderY - g.hw * 0.02], [g.cx + g.hw * 0.04, g.shoulderY + g.hw * 0.6], [g.cx + g.neckHalf * 1.05, g.shoulderY + g.hw * 0.56]], wing)
  const bowY = g.shoulderY + g.hw * 0.62
  ctx.fillStyle = c.tie
  ctx.beginPath(); ctx.ellipse(g.cx - g.hw * 0.34, bowY, g.hw * 0.26, g.hw * 0.2, -0.3, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(g.cx + g.hw * 0.34, bowY, g.hw * 0.26, g.hw * 0.2, 0.3, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(g.cx, bowY, Math.max(1.6, g.hw * 0.11), 0, Math.PI * 2); ctx.fill()
}

function kidsBlazer(ctx, g, c) {
  suitWithTie(ctx, g, c)
  ctx.fillStyle = shade(c.suit, 0.24)
  ctx.beginPath(); ctx.ellipse(g.cx - g.neckHalf * 1.28, g.shoulderY + g.hw * 0.62, g.hw * 0.2, g.hw * 0.26, 0.2, 0, Math.PI * 2); ctx.fill()
}

function hijabScarf(ctx, g, c) {
  const cloth = c.suit
  const inner = shade(cloth, 0.18)
  shoulderBody(ctx, g, 1.08, cloth, 0.14)
  ctx.beginPath()
  ctx.ellipse(g.cx, g.headCenterY + g.hw * 0.1, g.hw * 1.24, g.headH * 0.62, 0, 0, Math.PI * 2)
  ctx.fillStyle = cloth
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(g.cx, g.headCenterY - g.hw * 0.02, g.hw * 0.9, g.headH * 0.5, 0, 0, Math.PI * 2)
  ctx.fillStyle = inner
  ctx.fill()
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = shade(cloth, -0.2)
  ctx.lineWidth = Math.max(1, g.hw * 0.05)
  ctx.beginPath(); ctx.moveTo(g.cx - g.hw * 1.1, g.headCenterY + g.headH * 0.5); ctx.quadraticCurveTo(g.cx, g.headCenterY + g.headH * 0.78, g.cx + g.hw * 1.1, g.headCenterY + g.headH * 0.5); ctx.stroke()
  ctx.restore()
}

function shoulderScarf(ctx, g, c) {
  suitOpenCollar(ctx, g, c)
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(g.cx - g.neckHalf * 1.0, g.chinY - g.hw * 0.1)
  ctx.quadraticCurveTo(g.cx - g.shoulder * 1.05, g.shoulderY + g.hw * 0.2, g.cx - g.shoulder * 1.05, g.H)
  ctx.lineTo(g.cx - g.shoulder * 0.55, g.H)
  ctx.quadraticCurveTo(g.cx - g.shoulder * 0.6, g.shoulderY + g.hw * 0.9, g.cx - g.neckHalf * 0.4, g.chinY + g.hw * 0.2)
  ctx.closePath()
  ctx.fillStyle = c.tie
  ctx.globalAlpha = 0.94
  ctx.fill()
  ctx.restore()
  ctx.beginPath()
  ctx.ellipse(g.cx, g.chinY - g.hw * 0.06, g.hw * 0.86, g.hw * 0.36, 0, Math.PI, Math.PI * 2)
  ctx.fillStyle = c.tie
  ctx.fill()
}

export const garments = [
  { id: 'suit-tie', label: 'Two-button suit & tie', group: 'Mens suits', roles: ['suit', 'shirt', 'tie'], draw: suitWithTie, dark: false },
  { id: 'suit-open', label: 'Suit, open collar', group: 'Mens suits', roles: ['suit', 'shirt'], draw: suitOpenCollar, dark: false },
  { id: 'shirt-tie', label: 'Formal shirt & tie', group: 'Mens suits', roles: ['shirt', 'tie'], draw: shirtAndTie, dark: false },
  { id: 'waistcoat', label: 'Waistcoat & shirt', group: 'Mens suits', roles: ['suit', 'shirt'], draw: waistcoat, dark: false },
  { id: 'nehru', label: 'Nehru / band collar', group: 'Mens suits', roles: ['suit', 'shirt', 'tie'], draw: nehruJacket, dark: false },
  { id: 'blazer-women', label: "Women's blazer", group: 'Womens blazers', roles: ['suit', 'shirt'], draw: womensBlazer, dark: false },
  { id: 'boat-dress', label: 'Boat-neck formal dress', group: 'Womens blazers', roles: ['suit'], draw: boatNeckDress, dark: false },
  { id: 'saree', label: 'Saree drape & blouse', group: 'Womens blazers', roles: ['suit', 'shirt', 'tie'], draw: sareeDrape, dark: false },
  { id: 'kids-shirt', label: "Kids' shirt & bow", group: 'Kids attire', roles: ['shirt', 'tie'], draw: kidsCollar, dark: false },
  { id: 'kids-blazer', label: "Kids' blazer", group: 'Kids attire', roles: ['suit', 'shirt', 'tie'], draw: kidsBlazer, dark: false },
  { id: 'hijab', label: 'Hijab & scarf', group: 'Hijab & scarf', roles: ['suit'], draw: hijabScarf, dark: true },
  { id: 'dupatta', label: 'Shoulder scarf / dupatta', group: 'Hijab & scarf', roles: ['suit', 'shirt', 'tie'], draw: shoulderScarf, dark: false },
]

/**
 * Wraps a user-supplied clothing picture as a garment, so it flows through the
 * same head-anchored geometry, fit sliders and destination-out neck punch as the
 * catalogue drafts. `hw` already carries the scale slider, and `cx`/`chinY` the
 * nudges, so the picture moves and resizes with the very same controls.
 */
export function uploadedGarment(img, { neckOpen = true } = {}) {
  return {
    id: 'custom',
    label: 'Your clothing photo',
    group: 'Your upload',
    roles: [],
    dark: false,
    punch: neckOpen ? 'neck' : 'none',
    draw: (ctx, g) => {
      const iw = img.naturalWidth || img.width
      const ih = img.naturalHeight || img.height
      if (!iw || !ih) return
      // The collar is set just below the chin, the way the drafted jackets sit,
      // so a chest-up clothing picture lands on the neck without any fitting.
      const w = g.shoulder * 2
      const h = w * (ih / iw)
      ctx.drawImage(img, g.cx - w / 2, g.chinY - h * 0.28, w, h)
    },
  }
}

export const garmentGroups = ['Mens suits', 'Womens blazers', 'Kids attire', 'Hijab & scarf']

export const garmentById = (id) => garments.find((item) => item.id === id) || garments[0]

export const garmentSwatches = {
  suit: ['#1f2735', '#2c3340', '#111318', '#44506b', '#5b4a3a', '#7d8590', '#c3b394', '#2f5d50', '#5a2330', '#f1f2f4'],
  shirt: ['#f6f7f9', '#dce8f4', '#f2dfe2', '#e6e3d6', '#cfe3d6', '#b9c6de', '#ffffff', '#2b2f36'],
  tie: ['#a32432', '#1f2735', '#5c2338', '#1f5b3a', '#b58a2b', '#4a2f74', '#8c93a0', '#111318'],
}

export const defaultGarmentColors = { suit: '#1f2735', shirt: '#f6f7f9', tie: '#a32432' }

/**
 * Paints the garment into a transparent layer and then clears the part that must
 * stay visible: the neck and chin for ordinary clothing, the face oval for head
 * coverings that are supposed to wrap the hair.
 */
export function drawGarment(ctx, garment, frame, head, options, colors) {
  const g = geometry(frame.w, frame.h, head, options)
  // Existing drafts describe themselves with `dark`, so that stays the default;
  // an uploaded picture can opt out entirely with `punch: 'none'`.
  const punch = garment.punch || (garment.dark ? 'face' : 'neck')
  ctx.save()
  garment.draw(ctx, g, colors)
  if (punch !== 'none') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    if (punch === 'face') {
      // A head covering keeps the face opening clear.
      ctx.ellipse(g.cx, g.headCenterY + g.headH * 0.02, g.hw * 0.78, g.headH * 0.44, 0, 0, Math.PI * 2)
    } else {
      // Only the jaw and neck column is punched out, so collars, lapels and the
      // tie knot below the chin all stay painted.
      ctx.ellipse(g.cx, g.chinY - g.headH * 0.06, g.neckHalf * 0.8, g.headH * 0.14, 0, 0, Math.PI * 2)
    }
    ctx.fill()
  }
  ctx.restore()
}
