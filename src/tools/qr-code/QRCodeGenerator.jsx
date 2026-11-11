import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Copy, Download, HelpCircle, Image, QrCode, Sparkles, Upload, X } from 'lucide-react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import './QRCodeGenerator.css'

const FRAMES = [
  { id: 'none', label: 'Square' },
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

const QR_TYPES = [
  { id: 'url', label: 'Website (URL)', fieldLabel: 'Website URL', placeholder: 'https://www.imgmojo.com/' },
  { id: 'wifi', label: 'Wi-Fi', fieldLabel: 'Wi-Fi Network Details', placeholder: 'WIFI:S:MyNetwork;T:WPA;P:password;;' },
  { id: 'vcard', label: 'Contact (vCard)', fieldLabel: 'Contact Details (vCard)', placeholder: 'MECARD:N:John Doe;TEL:+1234567890;EMAIL:john@imgmojo.com;;' },
  { id: 'location', label: 'Location', fieldLabel: 'Location URL or Coordinates', placeholder: 'https://maps.google.com/?q=28.6139,77.2090' },
]

const THEME_DEFAULT_QR_COLORS = {
  'premium-purple': '#6A00FF',
  'dark-neon': '#7C3AED',
  'ocean-cyan': '#0891B2',
  'sunset-gradient': '#EA580C',
}

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: '1. Select the QR code type.',
    description:
      'Choose from Website (URL), Wi-Fi network credentials, Contact (vCard) business card, or Google Maps Location depending on what you want scanners to open.',
    badge: 'Step 01',
  },
  {
    step: 2,
    title: '2. Enter your URL, text or other information.',
    description:
      'Paste your destination website link, Wi-Fi details, vCard contact info, or map coordinates into the smart input box. Your QR code updates in real time.',
    badge: 'Step 02',
  },
  {
    step: 3,
    title: '3. Generate your QR code.',
    description:
      'Personalize your QR code with custom foreground & background colors, decorative Scan Me frames, a quiet-zone margin, and your own brand logo in the center.',
    badge: 'Step 03',
  },
  {
    step: 4,
    title: '4. Download and share your QR code.',
    description:
      'Export your finished QR code instantly in high-resolution PNG, scalable vector SVG, or print-ready JPG format, or copy it directly to your clipboard.',
    badge: 'Step 04',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Is this online QR Code Generator completely free to use?',
    answer:
      'Yes! ImgMojo QR Code Generator is 100% free for both personal and commercial use. There are no watermarks, scan limits, or sign-up requirements.',
  },
  {
    question: 'Do the QR codes created here ever expire?',
    answer:
      'No. All QR codes generated with this tool are static QR codes that encode your URL, Wi-Fi, Contact, or Location data directly into the pattern. They never expire and work forever as long as your destination link remains active.',
  },
  {
    question: 'Can I customize my QR code with a company logo and brand colors?',
    answer:
      'Absolutely. In Step 3 (Customize), you can pick any foreground and background hex colors, choose from 21+ decorative frames, and upload your custom PNG, JPG, or SVG logo. High error correction (Level H) keeps your code scannable.',
  },
  {
    question: 'Which format should I download: PNG, SVG, or JPG?',
    answer:
      'Use PNG for websites, social media, emails, and digital documents. Choose SVG for professional printing (flyers, billboards, packaging, business cards) because vector graphics scale to any size without losing sharpness. Use JPG when a compact file with a solid background is needed.',
  },
  {
    question: 'Why should I keep "Add Margin" enabled on my QR code?',
    answer:
      'The margin (also known as the "quiet zone") creates a clean border around the QR modules so smartphone cameras and barcode scanners can immediately distinguish the QR code from surrounding text or graphics.',
  },
  {
    question: 'How do I make sure my custom-colored QR code scans reliably?',
    answer:
      'Always maintain strong contrast between the Foreground Color and Background Color—typically a darker foreground color on a lighter background—and test your QR code with your phone camera before printing in bulk.',
  },
]

const DEFAULT_M_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs>
    <linearGradient id="mLeft" x1="0%" y1="100%" x2="60%" y2="0%">
      <stop offset="0%" stop-color="#5600E8"/>
      <stop offset="100%" stop-color="#9B30FF"/>
    </linearGradient>
    <linearGradient id="mMid" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B2CF5"/>
      <stop offset="55%" stop-color="#F03276"/>
      <stop offset="100%" stop-color="#FF6B3D"/>
    </linearGradient>
    <linearGradient id="mRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF4769"/>
      <stop offset="100%" stop-color="#FF9E2C"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="92" height="92" rx="22" fill="#ffffff"/>
  <path d="M18 69 L32 27 C34.5 20.5 41.5 20.5 44 27 L49 41 L35 69 C32.5 74 20.5 74 18 69 Z" fill="url(#mLeft)"/>
  <path d="M34 30 C37 22 44 22 47.5 29 L59 54 C61.5 60 56 66 49.5 60 L34 30 Z" fill="url(#mMid)"/>
  <path d="M53 55 L64 27 C66.8 20.5 74.5 21 76.5 28 L80 65 C80.8 72.5 70.5 75 68 67.5 L62 46 L53 55 Z" fill="url(#mRight)"/>
</svg>`

const DEFAULT_M_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(DEFAULT_M_LOGO_SVG)}`

// Constant 1x1 transparent GIF used only by hidden QRCodeCanvas so qrcode.react excavates the center modules synchronously
const EXCAVATE_PLACEHOLDER_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const BANDED_FRAMES = {
  blueband: { border: '#2f7fd0', band: '#d6ecfd', text: '#1d5c9e', label: 'Scan Me.', hairline: true },
  orange: { border: '#ef7c1a', band: '#ef7c1a', text: '#ffffff', label: 'SCAN ME' },
  green: { border: '#2ea44f', band: '#2ea44f', text: '#ffffff', label: 'Scan me!' },
  red: { border: '#d32f2f', band: '#d32f2f', text: '#ffffff', label: 'SCAN ME' },
}

const SANS = '"Inter", "Segoe UI", system-ui, sans-serif'
const SCRIPT = '"Segoe Script", "Comic Sans MS", cursive'

function TypeIcon({ type, size = 16 }) {
  if (type === 'url') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    )
  }
  if (type === 'wifi') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h.01" />
        <path d="M2 8.82a15 15 0 0 1 20 0" />
        <path d="M5 12.859a10 10 0 0 1 14 0" />
        <path d="M8.5 16.429a5 5 0 0 1 7 0" />
      </svg>
    )
  }
  if (type === 'vcard') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function TutorialStepIllustration({ step }) {
  if (step === 1) {
    return (
      <svg viewBox="0 0 280 160" fill="none" className="qr-tutorial-svg" aria-hidden="true">
        <rect x="18" y="18" width="244" height="124" rx="18" className="qr-illus-card" />
        <rect x="34" y="34" width="98" height="38" rx="10" className="qr-illus-pill-active" />
        <circle cx="52" cy="53" r="8" className="qr-illus-accent-dot" />
        <rect x="66" y="49" width="52" height="8" rx="4" fill="currentColor" opacity="0.85" />
        <rect x="148" y="34" width="98" height="38" rx="10" className="qr-illus-pill" />
        <circle cx="166" cy="53" r="7" className="qr-illus-muted-dot" />
        <rect x="180" y="49" width="48" height="8" rx="4" className="qr-illus-bar" />
        <rect x="34" y="84" width="98" height="38" rx="10" className="qr-illus-pill" />
        <circle cx="52" cy="103" r="7" className="qr-illus-muted-dot" />
        <rect x="66" y="99" width="54" height="8" rx="4" className="qr-illus-bar" />
        <rect x="148" y="84" width="98" height="38" rx="10" className="qr-illus-pill" />
        <circle cx="166" cy="103" r="7" className="qr-illus-muted-dot" />
        <rect x="180" y="99" width="44" height="8" rx="4" className="qr-illus-bar" />
        {/* Pointer cursor badge */}
        <g transform="translate(112, 56)">
          <circle cx="14" cy="14" r="14" className="qr-illus-badge-bg" />
          <path d="M10 8L19 13.5L14.2 15.2L12.5 20L10 8Z" fill="#ffffff" />
        </g>
      </svg>
    )
  }
  if (step === 2) {
    return (
      <svg viewBox="0 0 280 160" fill="none" className="qr-tutorial-svg" aria-hidden="true">
        <rect x="18" y="18" width="244" height="124" rx="18" className="qr-illus-card" />
        <rect x="34" y="34" width="84" height="10" rx="5" className="qr-illus-bar-strong" />
        <rect x="34" y="54" width="212" height="68" rx="12" className="qr-illus-input" />
        <circle cx="54" cy="76" r="9" className="qr-illus-accent-dot" />
        <path d="M51 76h6M54 73v6" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="72" y="70" width="128" height="9" rx="4.5" className="qr-illus-bar-brand" />
        <rect x="72" y="87" width="92" height="7" rx="3.5" className="qr-illus-bar" />
        <rect x="170" y="84" width="2.5" height="14" rx="1.25" className="qr-illus-bar-brand" />
        <circle cx="228" cy="74" r="9" className="qr-illus-pill" />
      </svg>
    )
  }
  if (step === 3) {
    return (
      <svg viewBox="0 0 280 160" fill="none" className="qr-tutorial-svg" aria-hidden="true">
        <rect x="18" y="18" width="244" height="124" rx="18" className="qr-illus-card" />
        {/* Left mini swatches */}
        <rect x="34" y="36" width="96" height="36" rx="10" className="qr-illus-pill" />
        <rect x="42" y="44" width="20" height="20" rx="6" className="qr-illus-swatch-primary" />
        <rect x="68" y="44" width="20" height="20" rx="6" className="qr-illus-swatch-accent" />
        <rect x="94" y="44" width="20" height="20" rx="6" className="qr-illus-swatch-dark" />
        <rect x="34" y="82" width="96" height="40" rx="10" className="qr-illus-pill-active" />
        <rect x="46" y="97" width="72" height="9" rx="4.5" fill="currentColor" opacity="0.85" />
        {/* Right mini QR preview */}
        <rect x="152" y="30" width="92" height="92" rx="16" className="qr-illus-qr-box" />
        <rect x="164" y="42" width="22" height="22" rx="5" className="qr-illus-qr-finder" />
        <rect x="210" y="42" width="22" height="22" rx="5" className="qr-illus-qr-finder" />
        <rect x="164" y="88" width="22" height="22" rx="5" className="qr-illus-qr-finder" />
        <rect x="189" y="67" width="18" height="18" rx="5" className="qr-illus-swatch-accent" />
        <rect x="192" y="44" width="10" height="10" rx="2.5" className="qr-illus-bar-brand" />
        <rect x="212" y="72" width="10" height="10" rx="2.5" className="qr-illus-bar-brand" />
        <rect x="194" y="94" width="14" height="14" rx="3" className="qr-illus-bar-brand" />
        <rect x="214" y="94" width="16" height="16" rx="3.5" className="qr-illus-bar-brand" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 280 160" fill="none" className="qr-tutorial-svg" aria-hidden="true">
      <rect x="18" y="18" width="244" height="124" rx="18" className="qr-illus-card" />
      <rect x="42" y="34" width="84" height="84" rx="16" className="qr-illus-qr-box" />
      <rect x="54" y="46" width="18" height="18" rx="4" className="qr-illus-qr-finder" />
      <rect x="96" y="46" width="18" height="18" rx="4" className="qr-illus-qr-finder" />
      <rect x="54" y="88" width="18" height="18" rx="4" className="qr-illus-qr-finder" />
      <rect x="76" y="68" width="16" height="16" rx="4" className="qr-illus-swatch-primary" />
      <rect x="94" y="88" width="18" height="18" rx="4" className="qr-illus-bar-brand" />
      {/* Export format pills */}
      <rect x="142" y="36" width="100" height="26" rx="8" className="qr-illus-badge-bg" />
      <text x="192" y="53" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
        PNG • HD
      </text>
      <rect x="142" y="68" width="100" height="24" rx="8" className="qr-illus-pill-active" />
      <text x="192" y="84" textAnchor="middle" fill="currentColor" fontSize="10.5" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
        SVG Vector
      </text>
      <rect x="142" y="98" width="100" height="24" rx="8" className="qr-illus-pill" />
      <text x="192" y="114" textAnchor="middle" fill="currentColor" opacity="0.78" fontSize="10.5" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
        JPG Print
      </text>
    </svg>
  )
}

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

function createNormalizedLogoCanvas(img) {
  const size = 192
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, size, size)
  const iw = img.naturalWidth || img.width || size
  const ih = img.naturalHeight || img.height || size
  const scale = Math.min(size / iw, size / ih)
  const dw = Math.round(iw * scale)
  const dh = Math.round(ih * scale)
  const dx = Math.round((size - dw) / 2)
  const dy = Math.round((size - dh) / 2)
  ctx.drawImage(img, dx, dy, dw, dh)
  return canvas
}

function drawFramedQr(canvas, qrImage, frameId, baseSize, logoElement) {
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

  const isLogoReady =
    logoElement &&
    (logoElement instanceof HTMLCanvasElement
      ? logoElement.width > 0
      : Boolean(logoElement.complete && (logoElement.naturalWidth > 0 || logoElement.width > 0)))

  const drawQr = (x, y) => {
    ctx.drawImage(qrImage, x, y, S, S)
    if (isLogoReady) {
      const logoSize = Math.round(S * 0.22)
      const lx = x + Math.round((S - logoSize) / 2)
      const ly = y + Math.round((S - logoSize) / 2)
      const padBox = Math.max(4, Math.round(logoSize * 0.1))
      ctx.save()
      roundRectPath(ctx, lx - padBox, ly - padBox, logoSize + padBox * 2, logoSize + padBox * 2, Math.round(logoSize * 0.24))
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      roundRectPath(ctx, lx, ly, logoSize, logoSize, Math.round(logoSize * 0.18))
      ctx.clip()
      ctx.drawImage(logoElement, lx, ly, logoSize, logoSize)
      ctx.restore()
    }
  }

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

export function FrameThumb({ frame, sample }) {
  const ref = useRef(null)
  useEffect(() => {
    drawFramedQr(ref.current, sample, frame)
  }, [frame, sample])
  return <canvas ref={ref} aria-hidden="true" />
}

export default function QRCodeGenerator() {
  const [qrType, setQrType] = useState('url')
  const [value, setValue] = useState('https://www.imgmojo.com/')
  const [qrColor, setQrColor] = useState(() => {
    if (typeof document !== 'undefined') {
      const currentTheme = document.documentElement.dataset.theme
      if (currentTheme && THEME_DEFAULT_QR_COLORS[currentTheme]) {
        return THEME_DEFAULT_QR_COLORS[currentTheme]
      }
    }
    return '#6A00FF'
  })
  const [userPickedColor, setUserPickedColor] = useState(false)
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [size] = useState(320)
  const [frame, setFrame] = useState('none')
  const [includeMargin, setIncludeMargin] = useState(true)
  const [customLogo, setCustomLogo] = useState('')
  const [customLogoName, setCustomLogoName] = useState('')
  const [logoImg, setLogoImg] = useState(null)
  const [copied, setCopied] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [, setDims] = useState({ width: 320, height: 320 })

  const qrCanvasRef = useRef(null)
  const qrSvgRef = useRef(null)
  const composedRef = useRef(null)
  const logoInputRef = useRef(null)
  const detailInputRef = useRef(null)
  useMemo(makeSampleQr, [])

  const activeLogoSrc = customLogo || DEFAULT_M_LOGO_DATA_URL

  // Sync default QR foreground color with active site theme unless user manually customized it
  useEffect(() => {
    if (typeof document === 'undefined' || userPickedColor) return undefined
    const root = document.documentElement
    const syncThemeColor = () => {
      const themeId = root.dataset.theme
      if (themeId && THEME_DEFAULT_QR_COLORS[themeId]) {
        setQrColor(THEME_DEFAULT_QR_COLORS[themeId])
      }
    }
    syncThemeColor()
    const observer = new MutationObserver(syncThemeColor)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [userPickedColor])

  // SEO Meta Tags & JSON-LD Structured Data (SoftwareApplication, HowTo, FAQPage)
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const previousTitle = document.title
    const seoTitle = 'Free QR Code Generator Online – Create Custom QR Codes | ImgMojo'
    const seoDescription =
      'Create free QR codes online with ImgMojo. Generate QR codes for URLs, text, Wi-Fi and more. Customize your QR code and download it instantly.'
    const ogTitle = 'Free QR Code Generator Online | ImgMojo'
    const ogDescription =
      'Generate custom QR codes for websites, text and Wi-Fi. Create and download QR codes online with ImgMojo.'
    const twitterTitle = 'Free QR Code Generator Online | ImgMojo'
    const twitterDescription =
      'Create, customize and download free QR codes online with ImgMojo.'
    const seoKeywords =
      'QR code generator, create QR code online, free QR code maker, custom QR code with logo, URL to QR code, Wi-Fi QR code generator, vCard QR code, location QR code, SVG QR code download, ImgMojo'
    const canonicalUrl = 'https://www.imgmojo.com/qr-code'
    const ogImageUrl = 'https://www.imgmojo.com/images/qr-code-generator-og.png'

    document.title = seoTitle

    const managedMeta = []
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`)
      const created = !element
      const prevContent = element ? element.getAttribute('content') : null
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attrName, attrValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
      managedMeta.push({ element, created, prevContent })
    }

    setMetaTag('name', 'description', seoDescription)
    setMetaTag('name', 'keywords', seoKeywords)
    setMetaTag('name', 'author', 'ImgMojo')
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large')
    setMetaTag('property', 'og:type', 'website')
    setMetaTag('property', 'og:site_name', 'ImgMojo')
    setMetaTag('property', 'og:title', ogTitle)
    setMetaTag('property', 'og:description', ogDescription)
    setMetaTag('property', 'og:url', canonicalUrl)
    setMetaTag('property', 'og:image', ogImageUrl)
    setMetaTag('property', 'og:image:width', '1200')
    setMetaTag('property', 'og:image:height', '630')
    setMetaTag('property', 'og:image:alt', 'ImgMojo Free Online QR Code Generator')
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', twitterTitle)
    setMetaTag('name', 'twitter:description', twitterDescription)
    setMetaTag('name', 'twitter:image', ogImageUrl)

    let canonicalLink = document.head.querySelector('link[rel="canonical"]')
    const createdCanonical = !canonicalLink
    const prevCanonicalHref = canonicalLink ? canonicalLink.getAttribute('href') : null
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonicalUrl)

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'ImgMojo QR Code Generator',
          url: canonicalUrl,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'All',
          description: seoDescription,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
        {
          '@type': 'HowTo',
          name: 'How to Create a QR Code Online',
          description: 'Follow these 4 simple steps to create, customize, and download a free QR code online.',
          step: TUTORIAL_STEPS.map((item) => ({
            '@type': 'HowToStep',
            position: item.step,
            name: item.title,
            text: item.description,
          })),
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    }

    const scriptId = 'qr-generator-seo-jsonld'
    let jsonLdScript = document.getElementById(scriptId)
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script')
      jsonLdScript.id = scriptId
      jsonLdScript.type = 'application/ld+json'
      document.head.appendChild(jsonLdScript)
    }
    jsonLdScript.textContent = JSON.stringify(structuredData)

    return () => {
      document.title = previousTitle
      managedMeta.forEach(({ element, created, prevContent }) => {
        if (created) {
          element.remove()
        } else if (prevContent !== null) {
          element.setAttribute('content', prevContent)
        }
      })
      if (createdCanonical && canonicalLink) {
        canonicalLink.remove()
      } else if (canonicalLink && prevCanonicalHref !== null) {
        canonicalLink.setAttribute('href', prevCanonicalHref)
      }
      const existingScript = document.getElementById(scriptId)
      if (existingScript) existingScript.remove()
    }
  }, [])

  // Load default logo on mount or when reset
  useEffect(() => {
    if (customLogo) return
    const img = new window.Image()
    img.onload = () => {
      const normalized = createNormalizedLogoCanvas(img)
      setLogoImg(normalized || img)
    }
    img.src = DEFAULT_M_LOGO_DATA_URL
  }, [customLogo])

  const renderComposed = useCallback(() => {
    if (!value.trim()) return
    const composed = drawFramedQr(composedRef.current, qrCanvasRef.current, frame, size, logoImg)
    if (composed) setDims(composed)
  }, [value, frame, size, logoImg])

  useEffect(() => {
    renderComposed()
    const raf = window.requestAnimationFrame(() => renderComposed())
    return () => window.cancelAnimationFrame(raf)
  }, [value, qrColor, bgColor, size, frame, includeMargin, logoImg, renderComposed])

  const download = () => {
    const canvas = composedRef.current
    if (!canvas || !value.trim()) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'imgmojo-qr-code.png'
    link.click()
  }

  const downloadJpg = () => {
    const canvas = composedRef.current
    if (!canvas || !value.trim()) return
    const jpgCanvas = document.createElement('canvas')
    jpgCanvas.width = canvas.width
    jpgCanvas.height = canvas.height
    const ctx = jpgCanvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgColor || '#ffffff'
    ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height)
    ctx.drawImage(canvas, 0, 0)
    const link = document.createElement('a')
    link.href = jpgCanvas.toDataURL('image/jpeg', 0.95)
    link.download = 'imgmojo-qr-code.jpg'
    link.click()
  }

  const downloadSvg = () => {
    if (!value.trim() || !qrSvgRef.current) return
    const serializer = new XMLSerializer()
    let svgString = serializer.serializeToString(qrSvgRef.current)
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    }
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'imgmojo-qr-code.svg'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const copyQrCode = async () => {
    const canvas = composedRef.current
    if (!canvas || !value.trim()) return
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (blob) {
          await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })])
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1800)
          return
        }
      }
      await navigator.clipboard.writeText(value.trim())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      const normalizedCanvas = createNormalizedLogoCanvas(img)
      if (normalizedCanvas) {
        setLogoImg(normalizedCanvas)
        setCustomLogo(normalizedCanvas.toDataURL('image/png'))
      } else {
        setLogoImg(img)
        setCustomLogo(objectUrl)
      }
      setCustomLogoName(file.name)
      URL.revokeObjectURL(objectUrl)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
    event.target.value = ''
  }

  const activeTypeConfig = QR_TYPES.find((item) => item.id === qrType) || QR_TYPES[0]
  const frameLabel = FRAMES.find((item) => item.id === frame)?.label || 'Square'
  const logoSizePx = Math.round(size * 0.22)

  return (
    <article className="home-photo-generator qr-generator" aria-label="QR Code Generator Online">
      {/* First-Screen Full Viewport Workspace */}
      <div className="qr-top-viewport">
        {/* Top Full-Width Hero Banner */}
        <header className="qr-hero-banner">
          <svg className="qr-hero-wave" viewBox="0 0 500 160" preserveAspectRatio="none" aria-hidden="true">
            <path d="M120,160 C210,70 310,130 410,35 C450,-2 480,10 500,0 L500,160 Z" fill="currentColor" opacity="0.22" />
            <path d="M220,160 C300,95 380,135 500,50 L500,160 Z" fill="currentColor" opacity="0.12" />
          </svg>

          <div className="qr-hero-left">
            <div className="qr-hero-icon-box" aria-hidden="true">
              <QrCode size={30} strokeWidth={2.1} />
            </div>
            <div className="qr-hero-copy">
              <h1>QR Code Generator</h1>
              <p>Create custom QR codes for URLs, Wi-Fi, contacts and locations — for free.</p>
            </div>
          </div>

          <div className="qr-hero-art" aria-hidden="true">
            <svg className="qr-hero-sparks-left" width="20" height="24" viewBox="0 0 22 28" fill="none">
              <path d="M16 4L6 1M14 13L3 13M16 22L7 26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <div className="qr-hero-floating-card">
              <QrCode size={44} strokeWidth={2} />
            </div>
            <svg className="qr-hero-sparks-right" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 10L10 3M10 14L19 9M12 20L21 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </header>

        {/* Main Full-Screen Workspace */}
        <div className="qr-generator-layout">
          {/* Builder Card: Left (Steps 1 & 2) + Right (Step 3 Customize) */}
          <div className="qr-generator-settings">
            <div className="qr-settings-columns">
              {/* Left Side: Step 1 & Step 2 */}
              <div className="qr-settings-left">
                {/* Step 1: Choose QR Type */}
                <div className="qr-step-section">
                  <div className="qr-step-header">
                    <span className="qr-step-badge">1</span>
                    <h2 className="qr-step-title">Choose QR Type</h2>
                  </div>
                  <div className="qr-type-grid" role="tablist" aria-label="QR Code Type">
                    {QR_TYPES.map((item) => (
                      <button
                        type="button"
                        role="tab"
                        key={item.id}
                        aria-selected={qrType === item.id}
                        className={`qr-type-btn${qrType === item.id ? ' is-active' : ''}`}
                        onClick={() => {
                          setQrType(item.id)
                          detailInputRef.current?.focus()
                        }}
                      >
                        <TypeIcon type={item.id} size={15} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Enter Details */}
                <div className="qr-step-section">
                  <div className="qr-step-header">
                    <span className="qr-step-badge">2</span>
                    <h2 className="qr-step-title">Enter Details</h2>
                  </div>
                  <div className="qr-detail-field">
                    <label className="qr-field-label" htmlFor="qr-generator-value">
                      {activeTypeConfig.fieldLabel}
                    </label>
                    <div className="qr-input-wrapper">
                      <span className="qr-input-icon">
                        <TypeIcon type={qrType} size={18} />
                      </span>
                      <textarea
                        ref={detailInputRef}
                        id="qr-generator-value"
                        rows={3}
                        className="qr-detail-input"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder={activeTypeConfig.placeholder}
                      />
                      {value && (
                        <button
                          type="button"
                          className="qr-input-clear"
                          onClick={() => setValue('')}
                          aria-label="Clear input"
                          title="Clear"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Step 3 Customize (Optional) */}
              <div className="qr-settings-right">
                <div className="qr-step-section qr-customize-section">
                  <div className="qr-step-header">
                    <span className="qr-step-badge">3</span>
                    <h2 className="qr-step-title">
                      Customize <span className="qr-step-optional">(Optional)</span>
                    </h2>
                  </div>

                  <div className="qr-customize-body">
                    <div className="qr-customize-grid">
                      {/* Foreground Color */}
                      <div className="qr-custom-item">
                        <span className="qr-field-label">Foreground Color</span>
                        <label className="qr-color-picker-box" title="Choose foreground color">
                          <span className="qr-color-swatch" style={{ backgroundColor: qrColor }} />
                          <span className="qr-color-hex">{qrColor.toUpperCase()}</span>
                          <input
                            type="color"
                            className="qr-color-native"
                            value={qrColor}
                            onChange={(event) => {
                              setUserPickedColor(true)
                              setQrColor(event.target.value)
                            }}
                            aria-label="Foreground Color"
                          />
                        </label>
                      </div>

                      {/* Background Color */}
                      <div className="qr-custom-item">
                        <span className="qr-field-label">Background Color</span>
                        <label className="qr-color-picker-box" title="Choose background color">
                          <span className="qr-color-swatch" style={{ backgroundColor: bgColor }} />
                          <span className="qr-color-hex">{bgColor.toUpperCase()}</span>
                          <input
                            type="color"
                            className="qr-color-native"
                            value={bgColor}
                            onChange={(event) => setBgColor(event.target.value)}
                            aria-label="Background Color"
                          />
                        </label>
                      </div>

                      {/* QR Style */}
                      <div className="qr-custom-item">
                        <label className="qr-field-label" htmlFor="qr-style-select">
                          QR Style
                        </label>
                        <div className="qr-style-select-wrap">
                          <span className="qr-style-icon">
                            <QrCode size={16} />
                          </span>
                          <select
                            id="qr-style-select"
                            className="qr-style-select"
                            value={frame}
                            onChange={(event) => setFrame(event.target.value)}
                          >
                            {FRAMES.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                          <span className="qr-style-chevron">
                            <ChevronDown size={15} />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Logo Upload Box */}
                    <div className="qr-logo-group">
                      <span className="qr-field-label">Logo (Optional)</span>
                      <div className="qr-logo-controls">
                        <label className="qr-upload-logo-btn" htmlFor="qr-logo-upload-input">
                          <input
                            id="qr-logo-upload-input"
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                            className="qr-visually-hidden"
                            onChange={handleLogoUpload}
                          />
                          {customLogo ? (
                            <img src={customLogo} alt="" className="qr-uploaded-logo-thumb" />
                          ) : (
                            <Upload size={15} />
                          )}
                          <span>{customLogoName ? 'Change Logo' : 'Upload Logo'}</span>
                        </label>
                        {customLogo && (
                          <button
                            type="button"
                            className="qr-remove-logo-btn"
                            onClick={() => {
                              setCustomLogo('')
                              setCustomLogoName('')
                            }}
                          >
                            <X size={13} /> Remove
                          </button>
                        )}
                        <span className="qr-logo-hint">{customLogoName || 'PNG, JPG (max 2 MB)'}</span>
                      </div>
                    </div>

                    {/* Quiet Zone / Add Margin Bar */}
                    <div className="qr-margin-card">
                      <div
                        className="qr-margin-copy"
                        onClick={() => setIncludeMargin((prev) => !prev)}
                      >
                        <span className="qr-margin-label">Add Margin</span>
                        <span className="qr-margin-sub">Include clean quiet-zone border for faster scanning</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={includeMargin}
                        aria-label="Add Margin"
                        className={`qr-margin-switch${includeMargin ? ' is-on' : ''}`}
                        onClick={() => setIncludeMargin((prev) => !prev)}
                      >
                        <span className="qr-margin-switch-thumb" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Generate CTA */}
            <button
              type="button"
              className="qr-generate-btn"
              onClick={renderComposed}
              disabled={!value.trim()}
            >
              <QrCode size={19} />
              <span>Generate QR Code</span>
            </button>
          </div>

          {/* Right Card: QR Code Preview */}
          <div className="qr-generator-preview">
            <h2 className="qr-preview-title">QR Code Preview</h2>

            <div className="qr-preview-frame" style={{ backgroundColor: bgColor }}>
              {value.trim() ? (
                <>
                  <QRCodeCanvas
                    ref={qrCanvasRef}
                    value={value.trim()}
                    size={size}
                    fgColor={qrColor}
                    bgColor={bgColor}
                    level="H"
                    marginSize={includeMargin ? 2 : 0}
                    imageSettings={{
                      src: EXCAVATE_PLACEHOLDER_SRC,
                      height: logoSizePx,
                      width: logoSizePx,
                      excavate: true,
                    }}
                    style={{ display: 'none' }}
                  />
                  <div className="qr-visually-hidden" aria-hidden="true">
                    <QRCodeSVG
                      ref={qrSvgRef}
                      value={value.trim()}
                      size={size}
                      fgColor={qrColor}
                      bgColor={bgColor}
                      level="H"
                      marginSize={includeMargin ? 2 : 0}
                      imageSettings={{
                        src: activeLogoSrc,
                        height: logoSizePx,
                        width: logoSizePx,
                        excavate: true,
                      }}
                    />
                  </div>
                  <canvas
                    ref={composedRef}
                    className="qr-framed-canvas"
                    role="img"
                    aria-label={`QR code with ${frameLabel} style`}
                  />
                </>
              ) : (
                <div className="qr-preview-empty">
                  <QrCode size={58} strokeWidth={1.3} />
                  <span>Your QR code will appear here</span>
                </div>
              )}
            </div>

            {/* Ready to download status pill */}
            <div className={`qr-ready-pill${value.trim() ? '' : ' is-idle'}`}>
              {value.trim() ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.59L6 12l1.41-1.41L10.59 13.76l6-6L18 9.17l-7.41 7.42z" />
                  </svg>
                  <span>Ready to download</span>
                </>
              ) : (
                <span>Enter details to generate</span>
              )}
            </div>

            {/* 2x2 Action Buttons Grid */}
            <div className="qr-preview-actions-grid">
              <button
                type="button"
                className="qr-action-btn is-primary"
                onClick={download}
                disabled={!value.trim()}
              >
                <Download size={15} />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                className="qr-action-btn is-secondary"
                onClick={downloadSvg}
                disabled={!value.trim()}
              >
                <Download size={15} />
                <span>Download SVG</span>
              </button>
              <button
                type="button"
                className="qr-action-btn is-secondary"
                onClick={downloadJpg}
                disabled={!value.trim()}
              >
                <Image size={15} />
                <span>Download JPG</span>
              </button>
              <button
                type="button"
                className="qr-action-btn is-secondary"
                onClick={() => void copyQrCode()}
                disabled={!value.trim()}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? 'Copied!' : 'Copy QR Code'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Below-the-Fold SEO Content: Tutorial & FAQ */}
      <div className="qr-below-fold">
        {/* Tutorial Section */}
        <section className="qr-tutorial-section" aria-labelledby="qr-how-to-heading">
          <div className="qr-section-header">
            <span className="qr-section-eyebrow">
              <Sparkles size={14} />
              <span>Quick Step-by-Step Guide</span>
            </span>
            <h2 id="qr-how-to-heading" className="qr-section-title">
              How to Create a QR Code Online
            </h2>
            <p className="qr-section-subtitle">
              Generate, customize, and download high-resolution QR codes in seconds—no design skills or registration required.
            </p>
          </div>

          <ol className="qr-tutorial-grid">
            {TUTORIAL_STEPS.map((item) => (
              <li key={item.step} className="qr-tutorial-card">
                <div className="qr-tutorial-media">
                  <span className="qr-tutorial-badge">{item.badge}</span>
                  <TutorialStepIllustration step={item.step} />
                </div>
                <div className="qr-tutorial-content">
                  <h3 className="qr-tutorial-card-title">{item.title}</h3>
                  <p className="qr-tutorial-card-desc">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ Section */}
        <section className="qr-faq-section" aria-labelledby="qr-faq-heading">
          <div className="qr-faq-layout">
            {/* Left Visual Showcase Card */}
            <aside className="qr-faq-aside">
              <span className="qr-section-eyebrow">
                <HelpCircle size={14} />
                <span>Got Questions?</span>
              </span>
              <h2 id="qr-faq-heading" className="qr-section-title">
                Frequently Asked Questions
              </h2>
              <p className="qr-section-subtitle">
                Everything you need to know about creating custom, print-ready QR codes with logos, colors, and frames on ImgMojo.
              </p>

              <div className="qr-faq-illustration-card" aria-hidden="true">
                <svg viewBox="0 0 320 190" fill="none" className="qr-faq-svg">
                  <rect x="16" y="16" width="288" height="158" rx="20" className="qr-illus-card" />
                  <rect x="36" y="36" width="118" height="118" rx="18" className="qr-illus-qr-box" />
                  <rect x="50" y="50" width="26" height="26" rx="6" className="qr-illus-qr-finder" />
                  <rect x="114" y="50" width="26" height="26" rx="6" className="qr-illus-qr-finder" />
                  <rect x="50" y="114" width="26" height="26" rx="6" className="qr-illus-qr-finder" />
                  <rect x="83" y="83" width="24" height="24" rx="7" className="qr-illus-swatch-primary" />
                  <rect x="114" y="86" width="12" height="12" rx="3" className="qr-illus-bar-brand" />
                  <rect x="86" y="118" width="18" height="18" rx="4" className="qr-illus-bar-brand" />
                  <rect x="112" y="112" width="26" height="26" rx="5" className="qr-illus-bar-brand" />
                  {/* Right side feature badges */}
                  <rect x="172" y="42" width="112" height="30" rx="10" className="qr-illus-pill-active" />
                  <circle cx="188" cy="57" r="6" className="qr-illus-accent-dot" />
                  <rect x="202" y="53" width="66" height="8" rx="4" fill="currentColor" opacity="0.85" />
                  <rect x="172" y="82" width="112" height="30" rx="10" className="qr-illus-pill" />
                  <circle cx="188" cy="97" r="6" className="qr-illus-muted-dot" />
                  <rect x="202" y="93" width="60" height="8" rx="4" className="qr-illus-bar" />
                  <rect x="172" y="122" width="112" height="30" rx="10" className="qr-illus-pill" />
                  <circle cx="188" cy="137" r="6" className="qr-illus-muted-dot" />
                  <rect x="202" y="133" width="54" height="8" rx="4" className="qr-illus-bar" />
                </svg>
                <div className="qr-faq-highlights">
                  <span>✓ 100% Free Forever</span>
                  <span>✓ High-Res Vector SVG</span>
                  <span>✓ No Scan Limits</span>
                </div>
              </div>
            </aside>

            {/* Right Accordion List */}
            <div className="qr-faq-list">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={item.question}
                    className={`qr-faq-item${isOpen ? ' is-open' : ''}`}
                  >
                    <button
                      type="button"
                      className="qr-faq-question"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown size={18} className="qr-faq-chevron" />
                    </button>
                    {isOpen && (
                      <div className="qr-faq-answer">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </article>
  )
}
