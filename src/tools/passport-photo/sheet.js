/**
 * Print sheet layout: how many passport photos fit on a piece of paper, where
 * they sit, and the cut guides that go with them.
 */

import { mmToPx, paperById } from './sizes'

export function sheetPlan(options) {
  const paper = paperById(options.paperId)
  const dpi = options.dpi
  const margin = mmToPx(options.margin, dpi)
  const gap = mmToPx(options.gap, dpi)
  const pw = mmToPx(paper.w, dpi)
  const ph = mmToPx(paper.h, dpi)
  const usableW = Math.max(0, pw - margin * 2)
  const usableH = Math.max(0, ph - margin * 2)
  const cols = Math.max(0, Math.floor((usableW + gap) / (options.photoW + gap)))
  const rows = Math.max(0, Math.floor((usableH + gap) / (options.photoH + gap)))
  const perSheet = cols * rows
  const placed = Math.min(options.copies || perSheet, perSheet)
  const usedCols = Math.min(cols, placed)
  const usedRows = Math.ceil(placed / Math.max(1, usedCols))
  const gridW = usedCols * options.photoW + (usedCols - 1) * gap
  const gridH = usedRows * options.photoH + (usedRows - 1) * gap
  return {
    paper, dpi, pw, ph, margin, gap, cols, rows, perSheet, placed, usedCols, usedRows,
    photoW: options.photoW, photoH: options.photoH,
    offsetX: Math.round((pw - gridW) / 2),
    offsetY: Math.round((ph - gridH) / 2),
  }
}

function scissors(ctx, x, y, size) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = 'rgba(120, 130, 140, .85)'
  ctx.lineWidth = Math.max(1, size * 0.09)
  ctx.beginPath()
  ctx.moveTo(-size * 0.42, -size * 0.3)
  ctx.lineTo(size * 0.34, size * 0.26)
  ctx.moveTo(-size * 0.42, size * 0.3)
  ctx.lineTo(size * 0.34, -size * 0.26)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(-size * 0.44, -size * 0.34, size * 0.15, 0, Math.PI * 2)
  ctx.arc(-size * 0.44, size * 0.34, size * 0.15, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/** Tiling never re-encodes the photo: the finished canvas is drawn straight in. */
export function buildSheet(photoCanvas, plan, options) {
  const sheet = document.createElement('canvas')
  sheet.width = plan.pw
  sheet.height = plan.ph
  const ctx = sheet.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, plan.pw, plan.ph)

  let index = 0
  for (let row = 0; row < plan.usedRows && index < plan.placed; row++) {
    const inRow = Math.min(plan.usedCols, plan.placed - index)
    for (let col = 0; col < inRow; col++) {
      const x = plan.offsetX + col * (plan.photoW + plan.gap)
      const y = plan.offsetY + row * (plan.photoH + plan.gap)
      ctx.drawImage(photoCanvas, x, y, plan.photoW, plan.photoH)
      if (options.cutLines) {
        ctx.save()
        ctx.strokeStyle = 'rgba(150, 158, 168, .75)'
        ctx.lineWidth = Math.max(1, plan.photoW * 0.006)
        ctx.setLineDash([plan.photoW * 0.05, plan.photoW * 0.035])
        ctx.strokeRect(x - ctx.lineWidth / 2, y - ctx.lineWidth / 2, plan.photoW, plan.photoH)
        ctx.restore()
      }
      index++
    }
    if (options.cutLines) {
      const y = plan.offsetY + row * (plan.photoH + plan.gap)
      scissors(ctx, plan.offsetX - plan.photoW * 0.16, y + plan.photoH / 2, plan.photoW * 0.2)
    }
  }

  if (options.cutLines && plan.placed > 0) {
    const lastY = plan.offsetY + (plan.usedRows - 1) * (plan.photoH + plan.gap) + plan.photoH
    ctx.save()
    ctx.strokeStyle = 'rgba(150, 158, 168, .75)'
    ctx.lineWidth = Math.max(1, plan.photoW * 0.006)
    ctx.setLineDash([plan.photoW * 0.05, plan.photoW * 0.035])
    ctx.beginPath()
    ctx.moveTo(plan.offsetX, lastY)
    ctx.lineTo(plan.offsetX + plan.usedCols * plan.photoW + (plan.usedCols - 1) * plan.gap, lastY)
    ctx.stroke()
    scissors(ctx, plan.offsetX - plan.photoW * 0.16, lastY, plan.photoW * 0.2)
    ctx.restore()
  }

  return sheet
}
