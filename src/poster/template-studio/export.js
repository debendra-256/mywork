import { ASPECTS, fontStack, resolveColor } from './data/presets.js'
import { ornamentSvg } from './data/ornaments.js'
import { bannerFlourishSvg } from './data/banners.js'
import { socialSvg, brandSocialSvg, isDarkColor } from './data/socials.js'
import { contactSvg } from './data/namecards.js'
import { SHAPE_GEOMETRY, isPathShape } from './data/shapes.js'

const imageCache = new Map()

function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src)
  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
  imageCache.set(src, promise)
  return promise
}

function drawCover(ctx, img, W, H, fit, zoom = 1, posX = 50, posY = 50) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return
  const base = fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih)
  // Matches CSS object-fit + object-position, then scale() around the centre.
  const bw = iw * base
  const bh = ih * base
  const ox0 = (W - bw) * (posX / 100)
  const oy0 = (H - bh) * (posY / 100)
  const cx = W / 2
  const cy = H / 2
  const ox = cx + zoom * (ox0 - cx)
  const oy = cy + zoom * (oy0 - cy)
  ctx.drawImage(img, ox, oy, bw * zoom, bh * zoom)
}

async function paintBackground(ctx, doc, W, H) {
  if (doc.bg.type === 'image' && doc.bg.src) {
    ctx.fillStyle = resolveColor(doc, doc.bg.from || 'ink')
    ctx.fillRect(0, 0, W, H)
    try {
      const img = await loadImage(doc.bg.src)
      drawCover(ctx, img, W, H, doc.bg.fit, doc.bg.zoom ?? 1, doc.bg.posX ?? 50, doc.bg.posY ?? 50)
    } catch {
      /* keep the fill colour if the photo fails to load */
    }
    const shade = Number(doc.bg.overlay) || 0
    if (shade > 0) {
      ctx.save()
      ctx.globalAlpha = shade
      ctx.fillStyle = resolveColor(doc, doc.bg.tint || 'ink')
      ctx.fillRect(0, 0, W, H)
      ctx.restore()
    }
    return
  }
  const from = resolveColor(doc, doc.bg.from)
  const to = resolveColor(doc, doc.bg.to)
  if (doc.bg.type === 'solid') {
    ctx.fillStyle = from
    ctx.fillRect(0, 0, W, H)
    return
  }
  if (doc.bg.type === 'radial') {
    const g = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, Math.max(W, H) * 1.15)
    g.addColorStop(0, from)
    g.addColorStop(1, to)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    return
  }
  const rad = ((doc.bg.angle ?? 160) * Math.PI) / 180
  const dirX = Math.sin(rad)
  const dirY = -Math.cos(rad)
  const len = Math.abs(W * dirX) + Math.abs(H * dirY)
  const cx = W / 2
  const cy = H / 2
  const g = ctx.createLinearGradient(
    cx - (dirX * len) / 2,
    cy - (dirY * len) / 2,
    cx + (dirX * len) / 2,
    cy + (dirY * len) / 2
  )
  g.addColorStop(0, from)
  g.addColorStop(1, to)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function withRotation(ctx, cx, cy, deg, draw) {
  ctx.save()
  if (deg) {
    ctx.translate(cx, cy)
    ctx.rotate((deg * Math.PI) / 180)
    ctx.translate(-cx, -cy)
  }
  draw()
  ctx.restore()
}

function drawInk(ctx, doc, el, W, H) {
  const points = Array.isArray(el.points) ? el.points : []
  if (points.length < 2) return
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const w = (el.w / 100) * W
  const h = (el.h / 100) * W
  if (w <= 0 || h <= 0) return
  const scaleX = w / Math.max(0.01, el.w)
  const scaleY = h / Math.max(0.01, el.h)
  withRotation(ctx, x + w / 2, y + h / 2, el.rotation, () => {
    ctx.save()
    ctx.globalAlpha = el.opacity ?? 1
    ctx.translate(x, y)
    ctx.scale(scaleX, scaleY)
    ctx.beginPath()
    points.forEach((point, index) => {
      if (index) ctx.lineTo(point.x, point.y)
      else ctx.moveTo(point.x, point.y)
    })
    ctx.strokeStyle = resolveColor(doc, el.color)
    ctx.lineWidth = el.size || 1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.restore()
  })
}

function drawShape(ctx, doc, el, W, H) {
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const w = (el.w / 100) * W
  const h = (((el.h ?? el.w) / 100) * W)
  if (w <= 0 || h <= 0) return
  const fill = resolveColor(doc, el.fill)
  const fill2 = el.fill2 ? resolveColor(doc, el.fill2) : null
  const fill3 = el.fill3 ? resolveColor(doc, el.fill3) : null
  const stroke = resolveColor(doc, el.stroke)
  const sw = ((el.strokeWidth || 0) / 100) * W
  const cx = x + w / 2
  const cy = y + h / 2

  if (isPathShape(el.shape)) {
    const geo = SHAPE_GEOMETRY[el.shape]
    const path = new Path2D(geo.d)
    withRotation(ctx, cx, cy, el.rotation, () => {
      ctx.save()
      ctx.globalAlpha = el.opacity ?? 1
      ctx.translate(x, y)
      ctx.scale(w / 100, h / 100)
      if (!geo.open && fill !== 'none' && fill !== 'transparent') {
        ctx.fillStyle = fill
        ctx.fill(path)
      }
      if (stroke !== 'none' && stroke !== 'transparent' && sw > 0) {
        ctx.strokeStyle = stroke
        ctx.lineWidth = (sw * 100) / w
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.stroke(path)
      }
      ctx.restore()
    })
    return
  }

  withRotation(ctx, cx, cy, el.rotation, () => {
    ctx.save()
    ctx.globalAlpha = el.opacity ?? 1
    ctx.beginPath()
    if (el.shape === 'circle') {
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
    } else if (el.shape === 'arch') {
      ctx.moveTo(x, y + h)
      ctx.lineTo(x, y + w / 2)
      ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0, false)
      ctx.lineTo(x + w, y + h)
      ctx.closePath()
    } else if (el.radius > 0) {
      roundRectPath(ctx, x, y, w, h, (el.radius / 100) * W)
    } else {
      ctx.rect(x, y, w, h)
    }
    if (fill !== 'none' && fill !== 'transparent') {
      if (fill2) {
        const angle = ((el.angle ?? 90) * Math.PI) / 180
        const dirX = Math.sin(angle)
        const dirY = -Math.cos(angle)
        const half = (Math.abs(w * dirX) + Math.abs(h * dirY)) / 2
        const gradient = ctx.createLinearGradient(
          cx - dirX * half, cy - dirY * half,
          cx + dirX * half, cy + dirY * half
        )
        gradient.addColorStop(0, fill)
        if (fill3) {
          gradient.addColorStop((el.mix ?? 50) / 100, fill2)
          gradient.addColorStop(1, fill3)
        } else {
          gradient.addColorStop(1, fill2)
        }
        ctx.fillStyle = gradient
      } else {
        ctx.fillStyle = fill
      }
      ctx.fill()
    }
    if (stroke !== 'none' && stroke !== 'transparent' && sw > 0) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = sw
      ctx.stroke()
    }
    ctx.restore()
  })
}

function wrapLines(ctx, text, maxWidth) {
  const lines = []
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(' ')
    let current = ''
    for (const word of words) {
      const attempt = current ? `${current} ${word}` : word
      if (ctx.measureText(attempt).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = attempt
      }
    }
    lines.push(current)
  }
  return lines
}

function drawText(ctx, doc, el, W, H) {
  const sizePx = (el.size / 100) * W
  const lineHeight = sizePx * (el.lineHeight || 1.3)
  const font = `${el.italic ? 'italic ' : ''}${el.weight || 400} ${sizePx}px ${fontStack(el.font)}`
  ctx.save()
  ctx.font = font
  const supportsSpacing = 'letterSpacing' in ctx
  if (supportsSpacing) ctx.letterSpacing = `${(el.tracking || 0) * sizePx}px`
  const text = el.transform === 'uppercase' ? String(el.text).toUpperCase() : String(el.text)
  const w = (el.w / 100) * W
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const lines = wrapLines(ctx, text, w)
  const blockH = lines.length * lineHeight
  const cx = x + w / 2
  const cy = y + blockH / 2
  const anchorX = el.align === 'left' ? x : el.align === 'right' ? x + w : cx
  const boxFill = el.bg && el.bg !== 'none' ? resolveColor(doc, el.bg) : null
  const boxStrokePx = el.bgStroke && el.bgStroke !== 'none' && el.bgStrokeWidth > 0
    ? (el.bgStrokeWidth / 100) * W
    : 0
  const boxStroke = boxStrokePx ? resolveColor(doc, el.bgStroke) : null

  withRotation(ctx, cx, cy, el.rotation, () => {
    ctx.globalAlpha = el.opacity ?? 1
    if (boxFill || boxStroke) {
      const padX = sizePx * 0.4
      const padY = sizePx * 0.16
      const inset = boxStrokePx / 2
      const radius = Math.max(0, ((el.bgRadius ?? 0) / 100) * W - inset)
      roundRectPath(
        ctx,
        x - padX + inset,
        y - padY + inset,
        w + padX * 2 - boxStrokePx,
        blockH + padY * 2 - boxStrokePx,
        radius
      )
      if (boxFill) {
        ctx.fillStyle = boxFill
        ctx.fill()
      }
      if (boxStroke) {
        ctx.strokeStyle = boxStroke
        ctx.lineWidth = boxStrokePx
        ctx.stroke()
      }
    }
    ctx.fillStyle = resolveColor(doc, el.color)
    ctx.textAlign = el.align === 'left' ? 'left' : el.align === 'right' ? 'right' : 'center'
    ctx.textBaseline = 'top'
    lines.forEach((line, i) => {
      ctx.fillText(line, anchorX, y + i * lineHeight + sizePx * 0.12)
    })
  })
  ctx.restore()
}

async function drawBanner(ctx, doc, el, W, H) {
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const w = (el.w / 100) * W
  const h = ((el.h ?? 13) / 100) * W
  if (w <= 0 || h <= 0) return
  const plate = el.plate && el.plate !== 'none' ? resolveColor(doc, el.plate) : null
  const stroke = el.strokeColor && el.strokeColor !== 'none' ? resolveColor(doc, el.strokeColor) : null
  const color = resolveColor(doc, el.color)
  const radius = ((el.radius ?? 1.4) / 100) * W
  const borderPx = ((el.strokeWidth ?? 0.22) / 100) * W
  const alpha = el.opacity ?? 1
  const ornamentPx = el.ornaments ? h * 0.62 : 0
  const ornamentPad = w * 0.022

  let flourish = null
  if (el.ornaments) {
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bannerFlourishSvg(stroke || color))}`
    flourish = await loadImage(src).catch(() => null)
  }

  withRotation(ctx, x + w / 2, y + h / 2, el.rotation, () => {
    ctx.save()
    ctx.globalAlpha = alpha

    roundRectPath(ctx, x, y, w, h, radius)
    if (plate) {
      ctx.fillStyle = plate
      ctx.fill()
    }
    if (stroke && borderPx > 0) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = borderPx
      ctx.stroke()
    }

    if (el.inner) {
      const inset = Math.max(borderPx * 1.8, h * 0.05)
      if (w - inset * 2 > 0 && h - inset * 2 > 0) {
        roundRectPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, Math.max(0, radius - inset))
        ctx.strokeStyle = stroke || color
        ctx.lineWidth = Math.max(1, borderPx * 0.34)
        ctx.globalAlpha = alpha * 0.7
        ctx.stroke()
        ctx.globalAlpha = alpha
      }
    }

    if (flourish) {
      const oy = y + (h - ornamentPx) / 2
      ctx.drawImage(flourish, x + ornamentPad, oy, ornamentPx, ornamentPx)
      ctx.save()
      ctx.translate(x + w - ornamentPad, oy + ornamentPx / 2)
      ctx.scale(-1, 1)
      ctx.drawImage(flourish, 0, -ornamentPx / 2, ornamentPx, ornamentPx)
      ctx.restore()
    }

    const sizePx = (el.size / 100) * W
    const font = `${el.italic ? 'italic ' : ''}${el.weight || 600} ${sizePx}px ${fontStack(el.font)}`
    ctx.font = font
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${(el.tracking || 0) * sizePx}px`
    const text = el.transform === 'uppercase' ? String(el.text ?? '').toUpperCase() : String(el.text ?? '')
    const textPad = w * (el.ornaments ? 0.15 : 0.06)
    const label = ellipsize(ctx, text.replace(/\n/g, ' '), Math.max(0, w - textPad * 2))
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (label) ctx.fillText(label, x + w / 2, y + h / 2 + sizePx * 0.03)
    ctx.restore()
  })
}

async function drawNameCard(ctx, doc, el, W, H) {
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const w = (el.w / 100) * W
  const h = ((el.h ?? 24) / 100) * W
  if (w <= 0 || h <= 0) return
  const family = fontStack(el.font)
  const nameSize = ((el.nameSize ?? 5) / 100) * W
  const titleSize = ((el.titleSize ?? 2.1) / 100) * W
  const socialSize = ((el.socialSize ?? 2) / 100) * W
  const nameColor = resolveColor(doc, el.nameColor)
  const titleColor = resolveColor(doc, el.titleColor)
  const socialColor = resolveColor(doc, el.socialColor)
  const iconColor = resolveColor(doc, el.iconColor)
  const brand = el.icons === 'brand'
  const alpha = el.opacity ?? 1
  const align = el.align || 'left'
  const socials = Array.isArray(el.socials) ? el.socials : []
  const contacts = Array.isArray(el.contacts) ? el.contacts : []
  const bg = el.bg && el.bg !== 'none' ? resolveColor(doc, el.bg) : null
  const radius = Math.max(0, ((el.bgRadius ?? 0.9) / 100) * W)
  const contactBg = el.contactBg && el.contactBg !== 'none' ? resolveColor(doc, el.contactBg) : null
  const contactColor = resolveColor(doc, el.contactColor)
  const contactSize = ((el.contactSize ?? 1.7) / 100) * W
  const logoSize = ((el.logoSize ?? 7.5) / 100) * W
  const logoRing = el.logoRing && el.logoRing !== 'none' ? resolveColor(doc, el.logoRing) : null

  const socialsWithIcons = await Promise.all(socials.map(async (item) => {
    const platforms = [item.platform, item.platform2].filter((p) => p && p !== 'none')
    const imgs = await Promise.all(platforms.map(async (platform) => {
      const svg = brand
        ? brandSocialSvg(platform, { dark: false, gid: `nc${el.id}${item.id}${platform}` })
        : socialSvg(platform, iconColor, 1)
      const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
      return loadImage(src).catch(() => null)
    }))
    return { ...item, imgs: imgs.filter(Boolean) }
  }))

  const logoImg = el.logo ? await loadImage(el.logo).catch(() => null) : null
  const contactImgs = await Promise.all(contacts.map((item) => {
    const svg = contactSvg(item.kind, contactColor, 1)
    return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`).catch(() => null)
  }))

  // Mirrors the CSS box model: 2.6cqw body padding, 3cqw side padding,
  // 4.6cqw minimum bar height and 3cqw logo gap.
  const padX = (3 / 100) * W
  const padY = (2.6 / 100) * W
  const logoGap = (3 / 100) * W
  const barPadX = padX
  const barPadY = (0.9 / 100) * W
  const contactIcon = contactSize * 1.18
  const contactGap = (0.8 / 100) * W
  const barMinGap = (1.5 / 100) * W
  const contactRowH = Math.max(contactIcon, contactSize * 1.35)
  const barH = contacts.length ? Math.max((4.6 / 100) * W, contactRowH + barPadY * 2) : 0
  const bodyH = h - barH
  const logoX = x + padX
  const copyX = logoImg ? logoX + logoSize + logoGap : x + padX
  const copyW = Math.max(0, x + w - padX - copyX)

  ctx.save()
  ctx.font = `700 ${nameSize}px ${family}`
  const nameLines = wrapLines(ctx, String(el.name ?? ''), copyW)
  ctx.font = `600 ${titleSize}px ${family}`
  const titleLines = el.title ? wrapLines(ctx, String(el.title), copyW) : []
  const socialFont = `600 ${socialSize}px ${family}`
  ctx.font = socialFont

  const nameLH = nameSize * 1.12
  const titleLH = titleSize * 1.3
  const titleGap = (0.55 / 100) * W
  const socialGap = (1.05 / 100) * W
  const iconSize = socialSize * 1.18
  const iconGap = (0.38 / 100) * W
  const entryGap = (1.1 / 100) * W
  const rowGap = (0.5 / 100) * W
  const rowH = Math.max(iconSize, socialSize * 1.28)

  // Mirrors the flex row: icons then handle, wrapping at the copy width.
  const entries = socialsWithIcons.map((item) => {
    const iconsW = item.imgs.length ? item.imgs.length * (iconSize + iconGap) : 0
    const label = ellipsize(ctx, String(item.handle ?? ''), Math.max(0, copyW - iconsW))
    const textW = ctx.measureText(label).width
    return { imgs: item.imgs, label, textW, width: iconsW + textW }
  })
  const rows = []
  let row = { items: [], width: 0 }
  entries.forEach((entry) => {
    const next = row.items.length ? entryGap + entry.width : entry.width
    if (row.items.length && row.width + next > copyW) {
      rows.push(row)
      row = { items: [entry], width: entry.width }
    } else {
      row.items.push(entry)
      row.width += next
    }
  })
  if (row.items.length) rows.push(row)

  const socialH = rows.length ? rows.length * rowH + (rows.length - 1) * rowGap : 0
  const contentH =
    nameLines.length * nameLH +
    (titleLines.length ? titleGap + titleLines.length * titleLH : 0) +
    (rows.length ? socialGap + socialH : 0)
  const startY = y + (bodyH - contentH) / 2

  ctx.font = `600 ${contactSize}px ${family}`
  const barAvailable = Math.max(0, w - barPadX * 2)
  const contactSlot = contacts.length
    ? Math.max(0, (barAvailable - barMinGap * (contacts.length - 1)) / contacts.length)
    : 0
  const contactEntries = contacts.map((item, index) => {
    const label = ellipsize(
      ctx,
      String(item.text ?? ''),
      Math.max(0, contactSlot - contactIcon - contactGap)
    )
    return { label, textW: ctx.measureText(label).width, img: contactImgs[index] }
  })
  const contactTotal = contactEntries.reduce(
    (sum, entry) => sum + contactIcon + contactGap + entry.textW,
    0
  )
  const contactGroupW = contactTotal + barMinGap * Math.max(0, contactEntries.length - 1)
  const contactGapFill = contactEntries.length > 1
    ? Math.max(barMinGap, (barAvailable - contactTotal) / (contactEntries.length - 1))
    : 0

  withRotation(ctx, x + w / 2, y + h / 2, el.rotation, () => {
    ctx.save()
    ctx.globalAlpha = alpha
    roundRectPath(ctx, x, y, w, h, radius)
    ctx.clip()

    if (bg) {
      ctx.fillStyle = bg
      ctx.fillRect(x, y, w, h)
    }

    if (barH) {
      if (contactBg) {
        ctx.fillStyle = contactBg
        ctx.fillRect(x, y + h - barH, w, barH)
      }
      const barMid = y + h - barH + barH / 2
      const barGap = align === 'left' ? contactGapFill : barMinGap
      const barStart = align === 'left'
        ? x + barPadX
        : align === 'right' ? x + w - barPadX - contactGroupW : x + (w - contactGroupW) / 2
      let cx = barStart
      ctx.font = `600 ${contactSize}px ${family}`
      ctx.fillStyle = contactColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      contactEntries.forEach((entry) => {
        if (entry.img) {
          ctx.drawImage(entry.img, cx, barMid - contactIcon / 2, contactIcon, contactIcon)
        }
        cx += contactIcon + contactGap
        if (entry.label) ctx.fillText(entry.label, cx, barMid)
        cx += entry.textW + barGap
      })
    }

    if (logoImg) {
      const cx = logoX + logoSize / 2
      const cy = y + bodyH / 2
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(logoX, cy - logoSize / 2, logoSize, logoSize)
      const iw = logoImg.naturalWidth || logoImg.width
      const ih = logoImg.naturalHeight || logoImg.height
      if (iw && ih) {
        const scale = Math.max(logoSize / iw, logoSize / ih)
        ctx.drawImage(
          logoImg,
          cx - (iw * scale) / 2,
          cy - (ih * scale) / 2,
          iw * scale,
          ih * scale
        )
      }
      ctx.restore()
      if (logoRing) {
        ctx.beginPath()
        ctx.arc(cx, cy, Math.max(0, logoSize / 2 - (0.09 / 100) * W), 0, Math.PI * 2)
        ctx.strokeStyle = logoRing
        ctx.lineWidth = Math.max(1, (0.18 / 100) * W)
        ctx.stroke()
      }
    }

    const anchorX = align === 'left' ? copyX : align === 'right' ? copyX + copyW : copyX + copyW / 2
    ctx.textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center'
    ctx.textBaseline = 'top'

    let cursorY = startY
    ctx.font = `700 ${nameSize}px ${family}`
    ctx.fillStyle = nameColor
    nameLines.forEach((line, i) => {
      ctx.fillText(line, anchorX, cursorY + i * nameLH)
    })
    cursorY += nameLines.length * nameLH

    if (titleLines.length) {
      cursorY += titleGap
      ctx.font = `600 ${titleSize}px ${family}`
      ctx.fillStyle = titleColor
      titleLines.forEach((line, i) => {
        ctx.fillText(line, anchorX, cursorY + i * titleLH)
      })
      cursorY += titleLines.length * titleLH
    }

    if (rows.length) {
      cursorY += socialGap
      ctx.font = socialFont
      ctx.fillStyle = socialColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      rows.forEach((socialRow, index) => {
        const rowTop = cursorY + index * (rowH + rowGap)
        let cx = align === 'left'
          ? copyX
          : align === 'right' ? copyX + copyW - socialRow.width : copyX + (copyW - socialRow.width) / 2
        socialRow.items.forEach((entry) => {
          entry.imgs.forEach((img) => {
            ctx.drawImage(img, cx, rowTop + (rowH - iconSize) / 2, iconSize, iconSize)
            cx += iconSize + iconGap
          })
          if (entry.label) ctx.fillText(entry.label, cx, rowTop + rowH / 2)
          cx += entry.textW + entryGap
        })
      })
    }
    ctx.restore()
  })
  ctx.restore()
}

async function drawOrnament(ctx, doc, el, W, H) {
  const size = (el.w / 100) * W
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const color = resolveColor(doc, el.color)
  const svg = ornamentSvg(el.ornament, color, el.opacity ?? 1)
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  let img
  try {
    img = await loadImage(src)
  } catch {
    return
  }
  const cx = x + size / 2
  const cy = y + size / 2
  ctx.save()
  if (el.flipX) {
    ctx.translate(cx, cy)
    ctx.scale(-1, 1)
    ctx.translate(-cx, -cy)
  }
  withRotation(ctx, cx, cy, el.rotation, () => {
    ctx.drawImage(img, x, y, size, size)
  })
  ctx.restore()
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  if (!radius) {
    ctx.rect(x, y, w, h)
    return
  }
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function ellipsize(ctx, text, maxWidth) {
  if (!text || maxWidth <= 0) return ''
  // Sub-pixel slack: widths derived by subtraction can miss measureText by an ULP.
  if (ctx.measureText(text).width <= maxWidth + 0.5) return text
  let cut = text
  while (cut.length && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1)
  return cut ? `${cut}…` : ''
}

async function drawFooter(ctx, doc, el, W, H) {
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const w = (el.w / 100) * W
  const h = ((el.h ?? 7.2) / 100) * W
  if (w <= 0 || h <= 0) return
  const items = (Array.isArray(el.items) ? el.items : []).filter(Boolean)
  const bg = resolveColor(doc, el.bg)
  const color = resolveColor(doc, el.color)
  const radius = ((el.radius ?? 0) / 100) * W
  const iconPx = h * 0.54
  const fontPx = h * 0.36
  const iconGap = h * 0.126
  const pad = w * 0.04
  const contentW = Math.max(0, w - pad * 2)
  const betweenGap = items.length > 1 ? contentW * 0.015 : 0
  const brandIcons = el.icons === 'brand'
  const darkBar = isDarkColor(bg)
  const icons = await Promise.all(items.map((item, i) => {
    if (item.icon === 'image') {
      if (!item.src) return null
      return loadImage(item.src).catch(() => null)
    }
    const svg = brandIcons
      ? brandSocialSvg(item.icon, { dark: darkBar, gid: `tfb${i}` })
      : socialSvg(item.icon, color, 1)
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    return loadImage(src).catch(() => null)
  }))

  withRotation(ctx, x + w / 2, y + h / 2, el.rotation, () => {
    ctx.save()
    ctx.globalAlpha = el.opacity ?? 1
    roundRectPath(ctx, x, y, w, h, radius)
    ctx.fillStyle = bg
    ctx.fill()
    ctx.clip()
    ctx.font = `600 ${fontPx}px ${fontStack('sans')}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color

    if (!items.length) {
      ctx.restore()
      return
    }

    // Mirrors flex: 0 1 auto + space-between: natural widths, proportional
    // shrink on overflow, leftover space spread between items.
    const labels = items.map((item) => String(item.text ?? ''))
    const iconBoxW = icons.map((img) => (img ? iconPx + iconGap : 0))
    const natural = items.map((item, i) => iconBoxW[i] + ctx.measureText(labels[i]).width)
    const total = natural.reduce((a, b) => a + b, 0)
    const spaceForItems = Math.max(0, contentW - betweenGap * (items.length - 1))
    const shrink = total > spaceForItems && total > 0 ? spaceForItems / total : 1
    const boxW = natural.map((nw) => nw * shrink)
    const free = Math.max(0, spaceForItems - boxW.reduce((a, b) => a + b, 0))
    const spread = items.length > 1 ? free / (items.length - 1) : 0

    let boxX = x + pad
    items.forEach((item, i) => {
      const img = icons[i]
      const textMax = Math.max(0, boxW[i] - iconBoxW[i])
      const text = ellipsize(ctx, labels[i], textMax)
      const textW = ctx.measureText(text).width
      const innerW = iconBoxW[i] + textW
      let cursor = boxX + ((item.dx ?? 0) / 100) * contentW + Math.max(0, (boxW[i] - innerW) / 2)
      if (img) {
        const iw = img.naturalWidth || img.width
        const ih = img.naturalHeight || img.height
        const scale = Math.min(iconPx / iw, iconPx / ih)
        const dw = iw * scale
        const dh = ih * scale
        ctx.drawImage(img, cursor + (iconPx - dw) / 2, y + (h - dh) / 2, dw, dh)
        cursor += iconBoxW[i]
      }
      if (text) ctx.fillText(text, cursor, y + h / 2)
      boxX += boxW[i] + betweenGap + spread
    })
    ctx.restore()
  })
}

async function drawSticker(ctx, doc, el, W, H) {
  if (!el.src) return
  const w = (el.w / 100) * W
  const ratio = Number(el.aspect) > 0 ? Number(el.aspect) : 1
  const h = w / ratio
  if (w <= 0 || h <= 0) return
  let img
  try {
    img = await loadImage(el.src)
  } catch {
    return
  }
  const slots = Array.isArray(el.slots) ? el.slots : []
  const slotImages = new Map()
  for (const slot of slots) {
    if (slot.kind !== 'image' || !slot.src) continue
    try {
      slotImages.set(slot.id, await loadImage(slot.src))
    } catch {
      /* leave the area empty if that photo fails */
    }
  }
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const alpha = el.opacity ?? 1
  withRotation(ctx, x + w / 2, y + h / 2, el.rotation, () => {
    ctx.save()
    ctx.globalAlpha = alpha
    if (el.blend && el.blend !== 'normal') ctx.globalCompositeOperation = el.blend
    if (el.filters) {
      ctx.filter = `brightness(${el.filters.brightness ?? 100}%) contrast(${el.filters.contrast ?? 100}%) saturate(${el.filters.saturate ?? 100}%)`
    }
    if (el.flipX || el.flipY) {
      ctx.translate(x + w / 2, y + h / 2)
      ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1)
      ctx.translate(-(x + w / 2), -(y + h / 2))
    }
    ctx.drawImage(img, x, y, w, h)
    ctx.restore()
    for (const slot of slots) {
      const sw = (slot.w / 100) * w
      const sh = (slot.h / 100) * h
      if (sw <= 0 || sh <= 0) continue
      const sx = x + (slot.x / 100) * w
      const sy = y + (slot.y / 100) * h
      if (slot.kind === 'image') {
        const slotImg = slotImages.get(slot.id)
        if (!slotImg) continue
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(sx, sy)
        ctx.beginPath()
        ctx.rect(0, 0, sw, sh)
        ctx.clip()
        drawCover(ctx, slotImg, sw, sh, slot.fit === 'contain' ? 'contain' : 'cover')
        ctx.restore()
        continue
      }
      const text = String(slot.text || '').trim()
      if (!text) continue
      const size = Math.max(4, ((Number(slot.size) || 8) / 100) * w)
      const pad = size * 0.3
      const maxWidth = Math.max(1, sw - pad * 2)
      const align = slot.align === 'left' ? 'left' : slot.align === 'right' ? 'right' : 'center'
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = resolveColor(doc, slot.color || 'ink')
      ctx.font = `600 ${size}px ${fontStack(slot.font === 'display' ? 'display' : slot.font === 'serif' ? 'serif' : 'sans')}`
      ctx.textBaseline = 'middle'
      ctx.textAlign = align
      const lines = wrapLines(ctx, text, maxWidth)
      const lineHeight = size * 1.16
      const startY = sy + sh / 2 - ((lines.length - 1) * lineHeight) / 2
      const tx = align === 'left' ? sx + pad : align === 'right' ? sx + sw - pad : sx + sw / 2
      lines.forEach((line, index) => {
        ctx.fillText(line, tx, startY + index * lineHeight, maxWidth)
      })
      ctx.restore()
    }
  })
}

async function drawSocial(ctx, doc, el, W, H) {
  const size = (el.w / 100) * W
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const color = resolveColor(doc, el.color)
  const svg = socialSvg(el.platform, color, el.opacity ?? 1)
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  let img
  try {
    img = await loadImage(src)
  } catch {
    return
  }
  const cx = x + size / 2
  const cy = y + size / 2
  withRotation(ctx, cx, cy, el.rotation, () => {
    ctx.drawImage(img, x, y, size, size)
  })
}

function photoPath(ctx, shape, x, y, w, h, radiusPx) {
  ctx.beginPath()
  if (shape === 'circle') {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    return
  }
  if (shape === 'arch') {
    ctx.moveTo(x, y + h)
    ctx.lineTo(x, y + w / 2)
    ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0, false)
    ctx.lineTo(x + w, y + h)
    ctx.closePath()
    return
  }
  if (shape === 'rounded' && radiusPx > 0) {
    const r = Math.min(radiusPx, w / 2, h / 2)
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    return
  }
  ctx.rect(x, y, w, h)
}

function drawPhotoImage(ctx, img, x, y, w, h, fit, zoom, panX = 0, panY = 0) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return
  const scale = (fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)) * (Number(zoom) || 1)
  const dw = iw * scale
  const dh = ih * scale
  const ox = ((Number(panX) || 0) / 100) * w
  const oy = ((Number(panY) || 0) / 100) * h
  ctx.drawImage(img, x + (w - dw) / 2 + ox, y + (h - dh) / 2 + oy, dw, dh)
}

async function drawPhoto(ctx, doc, el, W, H) {
  const x = (el.x / 100) * W
  const y = (el.y / 100) * H
  const w = (el.w / 100) * W
  const h = ((el.h ?? el.w) / 100) * W
  if (w <= 0 || h <= 0) return
  const radiusPx = ((el.radius ?? 1.4) / 100) * W
  const backdrop = el.backdrop && el.backdrop !== 'none' ? resolveColor(doc, el.backdrop) : null
  const tint = el.tint && el.tint !== 'none' ? resolveColor(doc, el.tint) : null
  const border = el.borderWidth > 0 && el.borderColor && el.borderColor !== 'none'
    ? resolveColor(doc, el.borderColor)
    : null
  let img = null
  if (el.src) {
    try {
      img = await loadImage(el.src)
    } catch {
      img = null
    }
  }
  const cx = x + w / 2
  const cy = y + h / 2
  const alpha = el.opacity ?? 1

  withRotation(ctx, cx, cy, el.rotation, () => {
    ctx.save()
    ctx.globalAlpha = alpha
    photoPath(ctx, el.shape, x, y, w, h, radiusPx)
    ctx.clip()
    if (backdrop && backdrop !== 'transparent') {
      ctx.fillStyle = backdrop
      ctx.fillRect(x, y, w, h)
    }
    if (img) {
      ctx.save()
      if (el.blend && el.blend !== 'normal') ctx.globalCompositeOperation = el.blend
      if (el.filters) {
        ctx.filter = `brightness(${el.filters.brightness ?? 100}%) contrast(${el.filters.contrast ?? 100}%) saturate(${el.filters.saturate ?? 100}%)`
      }
      if (el.flipX || el.flipY) {
        ctx.translate(cx, cy)
        ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1)
        ctx.translate(-cx, -cy)
      }
      drawPhotoImage(ctx, img, x, y, w, h, el.fit, el.zoom, el.panX, el.panY)
      ctx.restore()
    }
    if (tint && el.tintStrength > 0) {
      ctx.globalAlpha = alpha * Number(el.tintStrength)
      ctx.fillStyle = tint
      ctx.fillRect(x, y, w, h)
    }
    ctx.restore()

    if (border) {
      ctx.save()
      ctx.globalAlpha = alpha
      photoPath(ctx, el.shape, x, y, w, h, radiusPx)
      ctx.strokeStyle = border
      ctx.lineWidth = (el.borderWidth / 100) * W
      ctx.stroke()
      ctx.restore()
    }
  })
}

const EXPORT_LONG_EDGE = 3600

export async function renderToCanvas(doc, width) {
  const ratio = (ASPECTS[doc.aspect] || ASPECTS.portrait).ratio
  let W
  let H
  if (width) {
    W = width
    H = Math.round(width / ratio)
  } else if (ratio >= 1) {
    W = EXPORT_LONG_EDGE
    H = Math.round(W / ratio)
  } else {
    H = EXPORT_LONG_EDGE
    W = Math.round(H * ratio)
  }
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  await paintBackground(ctx, doc, W, H)
  for (const el of doc.elements) {
    if (el.type === 'shape') drawShape(ctx, doc, el, W, H)
    else if (el.type === 'ink') drawInk(ctx, doc, el, W, H)
    else if (el.type === 'ornament') await drawOrnament(ctx, doc, el, W, H)
    else if (el.type === 'social') await drawSocial(ctx, doc, el, W, H)
    else if (el.type === 'footer') await drawFooter(ctx, doc, el, W, H)
    else if (el.type === 'banner') await drawBanner(ctx, doc, el, W, H)
    else if (el.type === 'namecard') await drawNameCard(ctx, doc, el, W, H)
    else if (el.type === 'photo') await drawPhoto(ctx, doc, el, W, H)
    else if (el.type === 'sticker') await drawSticker(ctx, doc, el, W, H)
  }
  for (const el of doc.elements) {
    if (el.type === 'text') drawText(ctx, doc, el, W, H)
  }
  return canvas
}

export async function downloadPng(doc) {
  const canvas = await renderToCanvas(doc)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not export image')
  const safeName = (doc.name || 'invitation').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeName || 'invitation'}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return { width: canvas.width, height: canvas.height }
}
