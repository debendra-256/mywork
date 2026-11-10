const W = 720
const STATUS_H = 34
const HEADER_H = 96
const INPUT_H = 84
const MIN_H = 1280
const SIDE = 18
const BUBBLE_MAX = 500
const PAD_X = 14
const PAD_Y = 9
const LINE_H = 21
const META_H = 16
const BUBBLE_GAP = 10
const DATE_H = 24
const DATE_GAP = 14
const PAD_TOP = 16
const PAD_BOTTOM = 16

const FONT_TEXT = '15px "Inter", "Segoe UI", system-ui, sans-serif'
const FONT_TIME = '500 10.5px "Inter", "Segoe UI", system-ui, sans-serif'
const FONT_SMALL = '500 11.5px "Inter", "Segoe UI", system-ui, sans-serif'

export const STYLE_OPTIONS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'messenger', label: 'Messenger' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'imessage', label: 'iMessage' },
  { id: 'custom', label: 'Custom' },
]

export const STATUS_OPTIONS = [
  { id: 'sent', label: 'Sent' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'read', label: 'Read' },
]

const THEMES = {
  whatsapp: {
    light: {
      accent: '#00a884',
      headerBg: '#075e54',
      headerBorder: 'rgba(0,0,0,.14)',
      headerText: '#ffffff',
      headerSub: 'rgba(255,255,255,.78)',
      headerIcon: '#ffffff',
      statusColor: '#ffffff',
      bodyBg: '#efeae2',
      doodle: 'rgba(112,92,62,.13)',
      incomingBg: '#ffffff',
      incomingText: '#111b21',
      outgoingBg: '#d9fdd3',
      outgoingText: '#111b21',
      metaIn: '#667781',
      metaOut: '#667781',
      readTick: '#53bdeb',
      dividerBg: 'rgba(255,255,255,.94)',
      dividerText: '#54656f',
      barBg: '#f0f2f5',
      barBorder: '#d9d6cf',
      fieldBg: '#ffffff',
      fieldText: '#8696a0',
      barIcon: '#54656f',
      sendBg: '#00a884',
      sendIcon: '#ffffff',
    },
    dark: {
      accent: '#00a884',
      headerBg: '#1f2c34',
      headerBorder: 'rgba(255,255,255,.06)',
      headerText: '#e9edef',
      headerSub: 'rgba(233,237,239,.7)',
      headerIcon: '#aebac1',
      statusColor: '#e9edef',
      bodyBg: '#0b141a',
      doodle: 'rgba(233,237,239,.05)',
      incomingBg: '#202c33',
      incomingText: '#e9edef',
      outgoingBg: '#005c4b',
      outgoingText: '#e9edef',
      metaIn: '#8696a0',
      metaOut: 'rgba(233,237,239,.65)',
      readTick: '#53bdeb',
      dividerBg: '#182229',
      dividerText: '#8696a0',
      barBg: '#1f2c34',
      barBorder: '#2a3942',
      fieldBg: '#2a3942',
      fieldText: '#8696a0',
      barIcon: '#8696a0',
      sendBg: '#00a884',
      sendIcon: '#ffffff',
    },
  },
  telegram: {
    light: {
      accent: '#2481cc',
      headerBg: '#527da3',
      headerBorder: 'rgba(0,0,0,.08)',
      headerText: '#ffffff',
      headerSub: 'rgba(255,255,255,.78)',
      headerIcon: '#ffffff',
      statusColor: '#ffffff',
      bodyBg: '#99b3c6',
      doodle: null,
      incomingBg: '#ffffff',
      incomingText: '#182533',
      outgoingBg: '#eeffde',
      outgoingText: '#182533',
      metaIn: '#8a9aa7',
      metaOut: '#4fae4e',
      readTick: '#4fae4e',
      dividerBg: 'rgba(0,0,0,.2)',
      dividerText: '#ffffff',
      barBg: '#ffffff',
      barBorder: '#d9dce0',
      fieldBg: '#f4f4f5',
      fieldText: '#8a9aa7',
      barIcon: '#82868a',
      sendBg: '#2481cc',
      sendIcon: '#ffffff',
    },
    dark: {
      accent: '#5288c1',
      headerBg: '#212d3b',
      headerBorder: 'rgba(255,255,255,.06)',
      headerText: '#f5f5f5',
      headerSub: 'rgba(245,245,245,.7)',
      headerIcon: '#6c7883',
      statusColor: '#f5f5f5',
      bodyBg: '#0e1621',
      doodle: null,
      incomingBg: '#182533',
      incomingText: '#f5f5f5',
      outgoingBg: '#2b5278',
      outgoingText: '#f5f5f5',
      metaIn: '#6c7883',
      metaOut: '#7aa3cb',
      readTick: '#7aa3cb',
      dividerBg: '#182229',
      dividerText: '#6c7883',
      barBg: '#182533',
      barBorder: '#242f3d',
      fieldBg: '#242f3d',
      fieldText: '#6c7883',
      barIcon: '#6c7883',
      sendBg: '#5288c1',
      sendIcon: '#ffffff',
    },
  },
  messenger: {
    light: {
      accent: '#0084ff',
      headerBg: '#ffffff',
      headerBorder: '#e4e6eb',
      headerText: '#050505',
      headerSub: '#65676b',
      headerIcon: '#0084ff',
      statusColor: '#050505',
      bodyBg: '#ffffff',
      doodle: null,
      incomingBg: '#e4e6eb',
      incomingText: '#050505',
      outgoingBg: '#0084ff',
      outgoingText: '#ffffff',
      metaIn: '#8a8d91',
      metaOut: 'rgba(255,255,255,.82)',
      readTick: '#ffffff',
      dividerBg: '#f0f2f5',
      dividerText: '#65676b',
      barBg: '#ffffff',
      barBorder: '#e4e6eb',
      fieldBg: '#f0f2f5',
      fieldText: '#8a8d91',
      barIcon: '#0084ff',
      sendBg: '#0084ff',
      sendIcon: '#ffffff',
    },
    dark: {
      accent: '#0084ff',
      headerBg: '#242526',
      headerBorder: '#3e4042',
      headerText: '#e4e6eb',
      headerSub: '#b0b3b8',
      headerIcon: '#0084ff',
      statusColor: '#e4e6eb',
      bodyBg: '#18191a',
      doodle: null,
      incomingBg: '#3a3b3c',
      incomingText: '#e4e6eb',
      outgoingBg: '#0084ff',
      outgoingText: '#ffffff',
      metaIn: '#b0b3b8',
      metaOut: 'rgba(255,255,255,.82)',
      readTick: '#ffffff',
      dividerBg: '#3e4042',
      dividerText: '#b0b3b8',
      barBg: '#242526',
      barBorder: '#3e4042',
      fieldBg: '#3a3b3c',
      fieldText: '#8a8d91',
      barIcon: '#0084ff',
      sendBg: '#0084ff',
      sendIcon: '#ffffff',
    },
  },
  instagram: {
    light: {
      accent: '#e1306c',
      headerBg: '#ffffff',
      headerBorder: '#dbdbdb',
      headerText: '#262626',
      headerSub: '#8e8e8e',
      headerIcon: '#262626',
      statusColor: '#262626',
      bodyBg: '#ffffff',
      doodle: null,
      incomingBg: '#efefef',
      incomingText: '#262626',
      outgoingBg: '#3797f0',
      outgoingText: '#ffffff',
      metaIn: '#8e8e8e',
      metaOut: 'rgba(255,255,255,.82)',
      readTick: '#ffffff',
      dividerBg: '#efefef',
      dividerText: '#8e8e8e',
      barBg: '#ffffff',
      barBorder: '#dbdbdb',
      fieldBg: '#efefef',
      fieldText: '#8e8e8e',
      barIcon: '#262626',
      sendBg: '#3797f0',
      sendIcon: '#ffffff',
    },
    dark: {
      accent: '#e1306c',
      headerBg: '#000000',
      headerBorder: '#262626',
      headerText: '#fafafa',
      headerSub: '#a8a8a8',
      headerIcon: '#fafafa',
      statusColor: '#fafafa',
      bodyBg: '#000000',
      doodle: null,
      incomingBg: '#262626',
      incomingText: '#fafafa',
      outgoingBg: '#3797f0',
      outgoingText: '#ffffff',
      metaIn: '#a8a8a8',
      metaOut: 'rgba(255,255,255,.82)',
      readTick: '#ffffff',
      dividerBg: '#262626',
      dividerText: '#a8a8a8',
      barBg: '#000000',
      barBorder: '#262626',
      fieldBg: '#262626',
      fieldText: '#a8a8a8',
      barIcon: '#fafafa',
      sendBg: '#3797f0',
      sendIcon: '#ffffff',
    },
  },
  imessage: {
    light: {
      accent: '#007aff',
      headerBg: '#f6f6f6',
      headerBorder: '#d1d1d6',
      headerText: '#000000',
      headerSub: '#8e8e93',
      headerIcon: '#007aff',
      statusColor: '#000000',
      bodyBg: '#ffffff',
      doodle: null,
      incomingBg: '#e9e9eb',
      incomingText: '#000000',
      outgoingBg: '#007aff',
      outgoingText: '#ffffff',
      metaIn: '#8e8e93',
      metaOut: 'rgba(255,255,255,.82)',
      readTick: '#007aff',
      dividerBg: '#e5e5ea',
      dividerText: '#8e8e93',
      barBg: '#f6f6f6',
      barBorder: '#d1d1d6',
      fieldBg: '#ffffff',
      fieldText: '#8e8e93',
      barIcon: '#007aff',
      sendBg: '#007aff',
      sendIcon: '#ffffff',
    },
    dark: {
      accent: '#0a84ff',
      headerBg: '#1c1c1e',
      headerBorder: '#38383a',
      headerText: '#ffffff',
      headerSub: '#8e8e93',
      headerIcon: '#0a84ff',
      statusColor: '#ffffff',
      bodyBg: '#000000',
      doodle: null,
      incomingBg: '#26252a',
      incomingText: '#ffffff',
      outgoingBg: '#0a84ff',
      outgoingText: '#ffffff',
      metaIn: '#8e8e93',
      metaOut: 'rgba(255,255,255,.82)',
      readTick: '#0a84ff',
      dividerBg: '#2c2c2e',
      dividerText: '#8e8e93',
      barBg: '#1c1c1e',
      barBorder: '#38383a',
      fieldBg: '#2c2c2e',
      fieldText: '#8e8e93',
      barIcon: '#0a84ff',
      sendBg: '#0a84ff',
      sendIcon: '#ffffff',
    },
  },
  custom: {
    light: {
      accent: '#7c3aed',
      headerBg: '#6d28d9',
      headerBorder: 'rgba(0,0,0,.1)',
      headerText: '#ffffff',
      headerSub: 'rgba(255,255,255,.78)',
      headerIcon: '#ffffff',
      statusColor: '#ffffff',
      bodyBg: '#f5f3ff',
      doodle: null,
      incomingBg: '#ffffff',
      incomingText: '#1e1b4b',
      outgoingBg: '#ddd6fe',
      outgoingText: '#1e1b4b',
      metaIn: '#6b7280',
      metaOut: '#6b7280',
      readTick: '#7c3aed',
      dividerBg: '#ede9fe',
      dividerText: '#6d28d9',
      barBg: '#ffffff',
      barBorder: '#e2e8f0',
      fieldBg: '#f1f5f9',
      fieldText: '#64748b',
      barIcon: '#7c3aed',
      sendBg: '#7c3aed',
      sendIcon: '#ffffff',
    },
    dark: {
      accent: '#8b5cf6',
      headerBg: '#1e1b4b',
      headerBorder: '#312e81',
      headerText: '#f5f3ff',
      headerSub: 'rgba(245,243,255,.7)',
      headerIcon: '#a78bfa',
      statusColor: '#f5f5ff',
      bodyBg: '#0f172a',
      doodle: null,
      incomingBg: '#1e293b',
      incomingText: '#f8fafc',
      outgoingBg: '#6d28d9',
      outgoingText: '#ffffff',
      metaIn: '#94a3b8',
      metaOut: 'rgba(255,255,255,.8)',
      readTick: '#a78bfa',
      dividerBg: '#1e293b',
      dividerText: '#94a3b8',
      barBg: '#1e1b4b',
      barBorder: '#312e81',
      fieldBg: '#1e293b',
      fieldText: '#94a3b8',
      barIcon: '#a78bfa',
      sendBg: '#8b5cf6',
      sendIcon: '#ffffff',
    },
  },
}

const ICONS = {
  back: 'm15 18-6-6 6-6',
  video: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5M2 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  smile: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
  send: 'm22 2-7 20-4-9-9-4zM22 2 11 13',
}

export function formatChatTime(date = new Date()) {
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const suffix = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${minutes} ${suffix}`
}

function themeFor(style, dark) {
  const mode = dark ? 'dark' : 'light'
  const chosen = THEMES[style] || THEMES.whatsapp
  return chosen[mode] || THEMES.whatsapp[mode]
}

function roundedRectPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function fillRoundRect(ctx, x, y, w, h, radius, fill) {
  ctx.fillStyle = fill
  roundedRectPath(ctx, x, y, w, h, radius)
  ctx.fill()
}

function wrapText(ctx, text, maxWidth) {
  const lines = []
  const paragraphs = String(text ?? '').split('\n')
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) { lines.push(''); continue }
    const words = paragraph.trim().split(/\s+/)
    let line = ''
    for (const word of words) {
      if (ctx.measureText(word).width > maxWidth) {
        if (line) { lines.push(line); line = '' }
        let chunk = ''
        for (const char of word) {
          if (chunk && ctx.measureText(chunk + char).width > maxWidth) { lines.push(chunk); chunk = char }
          else chunk += char
        }
        line = chunk
        continue
      }
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width <= maxWidth) line = test
      else { lines.push(line); line = word }
    }
    if (line) lines.push(line)
  }
  return lines
}

function fitText(ctx, text, maxWidth) {
  const value = String(text ?? '')
  if (ctx.measureText(value).width <= maxWidth) return value
  let trimmed = value
  while (trimmed.length && ctx.measureText(`${trimmed}…`).width > maxWidth) trimmed = trimmed.slice(0, -1)
  return `${trimmed}…`
}

function strokeIcon(ctx, name, cx, cy, size, color, width = 1.9) {
  const path = ICONS[name]
  if (!path) return
  ctx.save()
  ctx.translate(cx - size / 2, cy - size / 2)
  ctx.scale(size / 24, size / 24)
  ctx.strokeStyle = color
  ctx.lineWidth = (width * 24) / size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke(new Path2D(path))
  ctx.restore()
}

function drawAvatar(ctx, image, name, cx, cy, radius, accent) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()
  if (image) {
    const scale = Math.max((radius * 2) / image.width, (radius * 2) / image.height)
    const w = image.width * scale
    const h = image.height * scale
    ctx.drawImage(image, cx - w / 2, cy - h / 2, w, h)
  } else {
    ctx.fillStyle = accent
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 18px "Inter", "Segoe UI", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const initial = String(name ?? '').trim().slice(0, 1).toUpperCase() || '?'
    ctx.fillText(initial, cx, cy + 1)
  }
  ctx.restore()
}

function drawCover(ctx, image, x, y, w, h, radius, placeholder) {
  ctx.save()
  roundedRectPath(ctx, x, y, w, h, radius)
  ctx.clip()
  if (image) {
    const scale = Math.max(w / image.width, h / image.height)
    const dw = image.width * scale
    const dh = image.height * scale
    ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  } else {
    ctx.fillStyle = placeholder
    ctx.fillRect(x, y, w, h)
  }
  ctx.restore()
}

function drawSignalBars(ctx, x, baseline, color) {
  ctx.fillStyle = color
  for (let i = 0; i < 4; i += 1) {
    const height = 4.5 + i * 2.6
    ctx.fillRect(x + i * 5.1, baseline - height, 2.9, height)
  }
}

function drawStatusBar(ctx, theme) {
  const color = theme.statusColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '600 12.5px "Inter", "Segoe UI", system-ui, sans-serif'
  ctx.fillStyle = color
  ctx.fillText('9:41', 26, 23)

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineCap = 'round'

  // Two SIM signal meters sit side by side, as on a dual-SIM Android phone.
  drawSignalBars(ctx, W - 170, 23, color)
  drawSignalBars(ctx, W - 142, 23, color)

  const wifiX = W - 102
  const wifiY = 22
  ctx.lineWidth = 1.5
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath()
    ctx.arc(wifiX, wifiY, 4 + i * 4, -Math.PI * 0.78, -Math.PI * 0.22)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(wifiX, wifiY, 1.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.font = '600 11px "Inter", "Segoe UI", system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('84%', W - 55, 22.5)

  ctx.lineWidth = 1.4
  roundedRectPath(ctx, W - 48, 10.5, 25, 13, 3)
  ctx.stroke()
  ctx.fillRect(W - 22, 14.5, 2, 5)
  ctx.save()
  roundedRectPath(ctx, W - 46, 12.5, 21, 9, 1.6)
  ctx.clip()
  ctx.fillRect(W - 46, 12.5, 21 * 0.84, 9)
  ctx.restore()

  // Punch-hole camera keeps the screenshot looking like a real phone.
  ctx.beginPath()
  ctx.arc(W / 2, 17, 6.2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,.62)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(W / 2 - 1.7, 15.3, 1.7, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,.14)'
  ctx.fill()
  ctx.restore()
}

function drawHeader(ctx, chat, theme, images) {
  ctx.fillStyle = theme.headerBg
  ctx.fillRect(0, 0, W, STATUS_H + HEADER_H)
  drawStatusBar(ctx, theme)

  const centerY = STATUS_H + HEADER_H / 2
  strokeIcon(ctx, 'back', 24, centerY, 22, theme.headerIcon, 2)

  const avatarImage = chat.contact?.avatar ? images.get(chat.contact.avatar) : null
  drawAvatar(ctx, avatarImage, chat.contact?.name, 64, centerY, 21, theme.accent)

  const iconStart = W - 132
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = theme.headerText
  ctx.font = '700 17px "Inter", "Segoe UI", system-ui, sans-serif'
  ctx.fillText(fitText(ctx, chat.contact?.name || 'Contact', iconStart - 100), 96, centerY - 4)
  ctx.fillStyle = theme.headerSub
  ctx.font = '400 11.5px "Inter", "Segoe UI", system-ui, sans-serif'
  ctx.fillText(fitText(ctx, chat.contact?.lastSeen || 'online', iconStart - 100), 96, centerY + 15)

  if (chat.style === 'messenger' || chat.style === 'instagram') {
    strokeIcon(ctx, 'info', W - 28, centerY, 21, theme.headerIcon, 1.9)
    strokeIcon(ctx, 'video', W - 68, centerY, 21, theme.headerIcon, 1.9)
    strokeIcon(ctx, 'phone', W - 108, centerY, 20, theme.headerIcon, 1.9)
  } else {
    ctx.fillStyle = theme.headerIcon
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath()
      ctx.arc(W - 28, centerY + i * 6, 1.7, 0, Math.PI * 2)
      ctx.fill()
    }
    strokeIcon(ctx, 'phone', W - 68, centerY, 20, theme.headerIcon, 1.9)
    strokeIcon(ctx, 'video', W - 108, centerY, 21, theme.headerIcon, 1.9)
  }

  if (theme.headerBorder) {
    ctx.fillStyle = theme.headerBorder
    ctx.fillRect(0, STATUS_H + HEADER_H - 1, W, 1)
  }
}

function layoutMessages(ctx, messages, images) {
  return messages.map((message) => {
    ctx.font = FONT_TEXT
    const hasImage = Boolean(message.image)
    const textLines = message.text ? wrapText(ctx, message.text, BUBBLE_MAX - PAD_X * 2) : []
    let textWidth = 0
    for (const line of textLines) textWidth = Math.max(textWidth, ctx.measureText(line).width)

    let imageWidth = 0
    let imageHeight = 0
    if (hasImage) {
      imageWidth = BUBBLE_MAX - PAD_X * 2
      const image = images.get(message.image)
      const ratio = image ? image.height / image.width : 0.75
      imageHeight = Math.min(300, Math.round(imageWidth * Math.min(2.1, Math.max(0.55, ratio))))
    }

    ctx.font = FONT_TIME
    const metaWidth = message.time ? ctx.measureText(message.time).width + (message.side === 'me' && message.status ? 20 : 0) : 0
    const innerWidth = Math.max(textWidth, imageWidth, metaWidth, 54)
    const bubbleWidth = Math.min(BUBBLE_MAX, Math.ceil(innerWidth) + PAD_X * 2)
    const textHeight = textLines.length * LINE_H
    const metaHeight = message.time ? META_H : 0
    const imageBlock = hasImage ? imageHeight + (textLines.length ? 8 : 0) : 0
    const bubbleHeight = PAD_Y * 2 + imageBlock + textHeight + metaHeight

    return { message, textLines, bubbleWidth, bubbleHeight, imageWidth, imageHeight }
  })
}

function drawChecks(ctx, x, baseline, status, color) {
  const drawOne = (offset) => {
    ctx.beginPath()
    ctx.moveTo(x + offset, baseline - 4)
    ctx.lineTo(x + offset + 3.2, baseline - 0.8)
    ctx.lineTo(x + offset + 8.4, baseline - 7.6)
    ctx.stroke()
  }
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  drawOne(0)
  if (status && status !== 'sent') drawOne(5)
  ctx.restore()
}

function drawBubble(ctx, item, theme, images, x, y) {
  const { message, textLines, bubbleWidth, bubbleHeight, imageWidth, imageHeight } = item
  const outgoing = message.side === 'me'
  const fill = outgoing ? theme.outgoingBg : theme.incomingBg
  const textColor = outgoing ? theme.outgoingText : theme.incomingText
  const radius = theme === THEMES.messenger.light || theme === THEMES.messenger.dark ? 18 : 14

  ctx.fillStyle = fill
  roundedRectPath(ctx, x, y, bubbleWidth, bubbleHeight, radius)
  ctx.fill()

  ctx.beginPath()
  if (outgoing) {
    ctx.moveTo(x + bubbleWidth - 22, y + bubbleHeight - 1)
    ctx.lineTo(x + bubbleWidth, y + bubbleHeight + 7)
    ctx.lineTo(x + bubbleWidth - 8, y + bubbleHeight - 1)
  } else {
    ctx.moveTo(x + 22, y + bubbleHeight - 1)
    ctx.lineTo(x, y + bubbleHeight + 7)
    ctx.lineTo(x + 8, y + bubbleHeight - 1)
  }
  ctx.closePath()
  ctx.fill()

  let cursorY = y + PAD_Y
  if (message.image) {
    drawCover(ctx, images.get(message.image), x + PAD_X, cursorY, imageWidth, imageHeight, 10, theme.dividerBg)
    cursorY += imageHeight + (textLines.length ? 8 : 0)
  }

  if (textLines.length) {
    ctx.fillStyle = textColor
    ctx.font = FONT_TEXT
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    for (const line of textLines) {
      ctx.fillText(line, x + PAD_X, cursorY + 15)
      cursorY += LINE_H
    }
  }

  if (message.time) {
    const meta = outgoing ? theme.metaOut : theme.metaIn
    const metaY = y + bubbleHeight - PAD_Y - 1
    ctx.font = FONT_TIME
    ctx.textAlign = 'right'
    ctx.fillStyle = meta
    if (outgoing && message.status) {
      const tickWidth = message.status === 'sent' ? 9 : 14
      drawChecks(ctx, x + bubbleWidth - PAD_X - tickWidth, metaY, message.status, message.status === 'read' ? theme.readTick : meta)
      ctx.fillText(message.time, x + bubbleWidth - PAD_X - tickWidth - 4, metaY)
    } else {
      ctx.fillText(message.time, x + bubbleWidth - PAD_X, metaY)
    }
  }
}

function drawDoodle(ctx, top, bottom, color) {
  let seed = 23
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let row = top - 10; row < bottom + 20; row += 82) {
    for (let col = 0; col < W + 40; col += 78) {
      const x = col + random() * 34
      const y = row + random() * 34
      const kind = Math.floor(random() * 6)
      ctx.beginPath()
      if (kind === 0) {
        ctx.arc(x, y, 5, 0, Math.PI * 2)
      } else if (kind === 1) {
        ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y)
        ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5)
      } else if (kind === 2) {
        ctx.moveTo(x, y + 5)
        ctx.bezierCurveTo(x - 9, y - 2, x - 1, y - 8, x, y - 3)
        ctx.bezierCurveTo(x + 1, y - 8, x + 9, y - 2, x, y + 5)
      } else if (kind === 3) {
        ctx.moveTo(x - 7, y)
        ctx.bezierCurveTo(x - 3, y - 6, x + 1, y + 6, x + 7, y)
      } else if (kind === 4) {
        ctx.moveTo(x, y - 6); ctx.lineTo(x + 2, y - 1); ctx.lineTo(x + 7, y)
        ctx.lineTo(x + 2, y + 2); ctx.lineTo(x, y + 7); ctx.lineTo(x - 2, y + 2)
        ctx.lineTo(x - 7, y); ctx.lineTo(x - 2, y - 1)
        ctx.closePath()
      } else {
        ctx.arc(x, y, 3.5, 0, Math.PI * 2)
        ctx.moveTo(x + 9, y - 6)
        ctx.lineTo(x + 9, y + 2)
      }
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawInputBar(ctx, theme, style, top) {
  const barY = top - INPUT_H
  ctx.fillStyle = theme.barBg
  ctx.fillRect(0, barY, W, INPUT_H)
  ctx.fillStyle = theme.barBorder
  ctx.fillRect(0, barY, W, 1)

  const fieldX = 18
  const fieldY = barY + 16
  const fieldW = W - 110
  const fieldH = 52
  fillRoundRect(ctx, fieldX, fieldY, fieldW, fieldH, 26, theme.fieldBg)

  strokeIcon(ctx, 'smile', fieldX + 28, fieldY + fieldH / 2, 21, theme.barIcon, 1.8)
  ctx.fillStyle = theme.fieldText
  ctx.font = '400 15px "Inter", "Segoe UI", system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Message', fieldX + 50, fieldY + fieldH / 2 + 1)

  strokeIcon(ctx, 'camera', fieldX + fieldW - 26, fieldY + fieldH / 2, 20, theme.barIcon, 1.8)

  const sendX = W - 42
  const sendY = barY + INPUT_H / 2
  ctx.beginPath()
  ctx.arc(sendX, sendY, 24, 0, Math.PI * 2)
  ctx.fillStyle = theme.sendBg
  ctx.fill()
  const isSendIcon = style === 'messenger' || style === 'telegram' || style === 'imessage' || style === 'instagram' || style === 'custom'
  strokeIcon(ctx, isSendIcon ? 'send' : 'mic', sendX, sendY, isSendIcon ? 21 : 22, theme.sendIcon, 2)
}

export function drawChat(canvas, chat, images = new Map(), exportWidth = 1080) {
  const theme = themeFor(chat.style, chat.dark)
  const messages = Array.isArray(chat.messages) ? chat.messages : []
  const ctx = canvas.getContext('2d')
  ctx.font = FONT_TEXT
  const laidOut = layoutMessages(ctx, messages, images)
  const totalMessages = laidOut.reduce((sum, item) => sum + item.bubbleHeight + BUBBLE_GAP, 0)
  const hasDate = Boolean(chat.dateLabel)
  const dateBlock = hasDate ? DATE_H + DATE_GAP : 0
  const blockHeight = PAD_TOP + dateBlock + Math.max(0, totalMessages - BUBBLE_GAP) + PAD_BOTTOM
  const height = Math.max(MIN_H, STATUS_H + HEADER_H + INPUT_H + blockHeight)

  const scale = Math.max(1, Number(exportWidth) || 1080) / W
  canvas.width = Math.round(W * scale)
  canvas.height = Math.round(height * scale)

  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, W, height)
  ctx.fillStyle = theme.bodyBg
  ctx.fillRect(0, 0, W, height)
  if (theme.doodle) drawDoodle(ctx, STATUS_H + HEADER_H, height - INPUT_H, theme.doodle)

  drawHeader(ctx, chat, theme, images)

  const bodyTop = STATUS_H + HEADER_H
  const bodyBottom = height - INPUT_H
  const available = bodyBottom - bodyTop
  const offset = Math.max(10, available - blockHeight)
  let cursorY = bodyTop + offset + PAD_TOP

  if (hasDate) {
    ctx.font = '600 11.5px "Inter", "Segoe UI", system-ui, sans-serif'
    const label = String(chat.dateLabel)
    const width = ctx.measureText(label).width + 24
    fillRoundRect(ctx, (W - width) / 2, cursorY, width, DATE_H, 12, theme.dividerBg)
    ctx.fillStyle = theme.dividerText
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, W / 2, cursorY + DATE_H / 2 + 1)
    cursorY += DATE_H + DATE_GAP
  }

  for (const item of laidOut) {
    const x = item.message.side === 'me' ? W - SIDE - item.bubbleWidth : SIDE
    drawBubble(ctx, item, theme, images, x, cursorY)
    cursorY += item.bubbleHeight + BUBBLE_GAP
  }

  drawInputBar(ctx, theme, chat.style, height)

  return { width: Math.round(W * scale), height: Math.round(height * scale) }
}
