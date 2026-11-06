const STORAGE_KEY = 'promptseen.poster.elements.v1'
const MAX_ELEMENTS = 16
const MAX_FILE_BYTES = 20 * 1024 * 1024
const MAX_EDGE = 1000
const SCAN_EDGE = 1200
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const storageAvailable = () => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
const SLOT_KINDS = ['text', 'image']
const SLOT_FONTS = ['sans', 'serif', 'display']
export const SLOT_SCRIPTS = [
  { id: 'latin', label: 'English / Latin' },
  { id: 'devanagari', label: 'Hindi / Devanagari' },
  { id: 'tamil', label: 'Tamil' },
  { id: 'telugu', label: 'Telugu' },
  { id: 'bengali', label: 'Bengali' },
  { id: 'gujarati', label: 'Gujarati' },
  { id: 'kannada', label: 'Kannada' },
  { id: 'malayalam', label: 'Malayalam' },
  { id: 'gurmukhi', label: 'Punjabi / Gurmukhi' },
  { id: 'arabic', label: 'Arabic / Urdu' },
  { id: 'any', label: 'Any language' },
]
const SCRIPT_IDS = SLOT_SCRIPTS.map((item) => item.id)
const SCRIPT_PROPERTIES = {
  latin: 'Latin',
  devanagari: 'Devanagari',
  tamil: 'Tamil',
  telugu: 'Telugu',
  bengali: 'Bengali',
  gujarati: 'Gujarati',
  kannada: 'Kannada',
  malayalam: 'Malayalam',
  gurmukhi: 'Gurmukhi',
  arabic: 'Arabic',
}
const scriptProperty = (script) => SCRIPT_PROPERTIES[script] || null
const stripPattern = (script) => {
  const property = scriptProperty(script)
  if (!property) return null
  return new RegExp(`[^\\p{Script=${property}}\\p{Nd}\\p{P}\\p{S}\\s\\u200c\\u200d]`, 'gu')
}

export function detectScript(text) {
  const value = String(text ?? '')
  for (const script of Object.keys(SCRIPT_PROPERTIES)) {
    if (script === 'latin') continue
    if (new RegExp(`\\p{Script=${SCRIPT_PROPERTIES[script]}}`, 'u').test(value)) return script
  }
  return 'latin'
}

export function filterTextToScript(text, script) {
  const pattern = stripPattern(script)
  return pattern ? String(text ?? '').replace(pattern, '') : String(text ?? '')
}

export function scriptLabel(script) {
  return SLOT_SCRIPTS.find((item) => item.id === script)?.label || SLOT_SCRIPTS[0].label
}

export function normalizeSlot(slot = {}) {
  const kind = SLOT_KINDS.includes(slot.kind) ? slot.kind : 'text'
  const w = clamp(slot.w, 2, 100)
  const h = clamp(slot.h, 2, 100)
  return {
    id: String(slot.id || `sl_${Math.random().toString(36).slice(2, 8)}`),
    kind,
    label: String(slot.label || (kind === 'text' ? 'Text' : 'Image')).slice(0, 40),
    x: clamp(slot.x, 0, 100 - w),
    y: clamp(slot.y, 0, 100 - h),
    w,
    h,
    text: kind === 'text' ? String(slot.text ?? 'Text').slice(0, 120) : '',
    size: kind === 'text' ? clamp(slot.size || 8, 3, 40) : 8,
    color: typeof slot.color === 'string' && slot.color ? slot.color : '#1c2025',
    align: ['left', 'center', 'right'].includes(slot.align) ? slot.align : 'center',
    font: SLOT_FONTS.includes(slot.font) ? slot.font : 'sans',
    fit: kind === 'image' && slot.fit === 'contain' ? 'contain' : 'cover',
    script: kind === 'text'
      ? (SCRIPT_IDS.includes(slot.script) ? slot.script : detectScript(slot.text))
      : 'any',
  }
}

export function normalizeSlots(slots) {
  if (!Array.isArray(slots)) return []
  const seen = new Set()
  return slots.slice(0, 12).map(normalizeSlot).map((slot) => {
    while (seen.has(slot.id)) slot.id = `sl_${Math.random().toString(36).slice(2, 8)}`
    seen.add(slot.id)
    return slot
  })
}

export function loadElements() {
  if (!storageAvailable()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item.src === 'string' && item.src.startsWith('data:'))
      .map((item) => ({
        id: String(item.id || ''),
        name: String(item.name || 'Element').slice(0, 40),
        src: item.src,
        aspect: Number(item.aspect) > 0 ? Number(item.aspect) : 1,
        width: Number(item.width) > 0 ? Number(item.width) : 1,
        height: Number(item.height) > 0 ? Number(item.height) : 1,
        slots: normalizeSlots(item.slots),
        createdAt: Number(item.createdAt) || Date.now(),
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

function persist(elements) {
  if (!storageAvailable()) {
    throw new Error('This browser cannot store elements — keep the image file instead.')
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(elements))
  } catch {
    throw new Error('The element library is full. Delete an element and try again.')
  }
}

export function addElement(entry) {
  const elements = loadElements()
  if (elements.length >= MAX_ELEMENTS) {
    throw new Error(`You can save up to ${MAX_ELEMENTS} scanned elements. Delete one first.`)
  }
  const saved = {
    id: `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: String(entry.name || 'Element').trim().slice(0, 40) || 'Element',
    src: entry.src,
    aspect: Number(entry.aspect) > 0 ? Number(entry.aspect) : 1,
    width: Number(entry.width) || 1,
    height: Number(entry.height) || 1,
    slots: normalizeSlots(entry.slots),
    createdAt: Date.now(),
  }
  const next = [saved, ...elements]
  persist(next)
  return next
}

export function deleteElement(id) {
  const next = loadElements().filter((item) => item.id !== id)
  persist(next)
  return next
}

export const maxElements = MAX_ELEMENTS

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')) }
    img.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read that image'))
    reader.readAsDataURL(blob)
  })
}

const median = (values) => {
  values.sort((a, b) => a - b)
  return values[values.length >> 1]
}

function alphaBounds(data, w, h) {
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

// Flood-fills the plain backdrop from the image border and makes it transparent,
// so a photographed or exported element drops onto any poster.
function cutBackdrop(data, w, h, tolerance) {
  const edge = []
  const ring = []
  for (let x = 0; x < w; x++) { ring.push(x, (h - 1) * w + x) }
  for (let y = 0; y < h; y++) { ring.push(y * w, y * w + w - 1) }
  const channels = [[], [], []]
  for (const index of ring) {
    const p = index * 4
    channels[0].push(data[p])
    channels[1].push(data[p + 1])
    channels[2].push(data[p + 2])
  }
  const bg = [median(channels[0]), median(channels[1]), median(channels[2])]
  const limit = 3 * tolerance * tolerance
  const isBg = new Uint8Array(w * h)
  const queue = new Int32Array(w * h)
  let head = 0
  let tail = 0
  const near = (index) => {
    const p = index * 4
    const dr = data[p] - bg[0]
    const dg = data[p + 1] - bg[1]
    const db = data[p + 2] - bg[2]
    return dr * dr + dg * dg + db * db <= limit
  }
  const seed = (index) => {
    if (!isBg[index] && near(index)) {
      isBg[index] = 1
      queue[tail++] = index
    }
  }
  for (let x = 0; x < w; x++) {
    seed(x)
    seed((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    seed(y * w)
    seed(y * w + w - 1)
  }
  while (head < tail) {
    const index = queue[head++]
    const x = index % w
    const y = (index / w) | 0
    if (x > 0) seed(index - 1)
    if (x < w - 1) seed(index + 1)
    if (y > 0) seed(index - w)
    if (y < h - 1) seed(index + w)
  }
  const coverage = tail / (w * h)
  if (coverage >= 0.03 && coverage < 0.92) {
    for (let i = 0; i < isBg.length; i++) if (isBg[i]) data[i * 4 + 3] = 0
    return alphaBounds(data, w, h)
  }
  return null
}

export async function scanElementImage(file, { removeBackground = true, tolerance = 26 } = {}) {
  if (!file) throw new Error('Choose an image to scan')
  if (!ACCEPTED.includes(file.type)) throw new Error('Use a PNG, JPG, WebP or GIF image')
  if (file.size > MAX_FILE_BYTES) throw new Error('That image is larger than 20 MB')

  const bitmap = await loadBitmap(file)
  const width = bitmap.width || bitmap.naturalWidth
  const height = bitmap.height || bitmap.naturalHeight
  if (!width || !height) throw new Error('Could not read that image')

  const scale = Math.min(1, SCAN_EDGE / Math.max(width, height))
  const scanW = Math.max(1, Math.round(width * scale))
  const scanH = Math.max(1, Math.round(height * scale))
  const scan = document.createElement('canvas')
  scan.width = scanW
  scan.height = scanH
  const scanCtx = scan.getContext('2d', { willReadFrequently: true })
  scanCtx.drawImage(bitmap, 0, 0, scanW, scanH)
  if (bitmap.close) bitmap.close()

  const imageData = scanCtx.getImageData(0, 0, scanW, scanH)
  const data = imageData.data
  let hasAlpha = false
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) { hasAlpha = true; break }
  }

  let bounds = hasAlpha ? alphaBounds(data, scanW, scanH) : null
  let backgroundRemoved = false
  if (!hasAlpha && removeBackground) {
    bounds = cutBackdrop(data, scanW, scanH, tolerance)
    backgroundRemoved = Boolean(bounds)
  }
  if (!bounds) bounds = { x: 0, y: 0, w: scanW, h: scanH }
  if (bounds.w < 4 || bounds.h < 4) throw new Error('No element found — try a clearer image')

  if (backgroundRemoved) scanCtx.putImageData(imageData, 0, 0)

  const pad = 2
  const cropX = Math.max(0, bounds.x - pad)
  const cropY = Math.max(0, bounds.y - pad)
  const cropW = Math.min(scanW - cropX, bounds.w + pad * 2)
  const cropH = Math.min(scanH - cropY, bounds.h + pad * 2)

  const outScale = Math.min(1, MAX_EDGE / Math.max(cropW, cropH))
  const outW = Math.max(1, Math.round(cropW * outScale))
  const outH = Math.max(1, Math.round(cropH * outScale))
  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const outCtx = out.getContext('2d')
  outCtx.drawImage(scan, cropX, cropY, cropW, cropH, 0, 0, outW, outH)

  let blob = await canvasToBlob(out, 'image/webp', 0.9)
  if (!blob) blob = await canvasToBlob(out, 'image/png')
  if (!blob) throw new Error('Could not prepare that element')

  return {
    src: await blobToDataUrl(blob),
    width: outW,
    height: outH,
    aspect: outW / outH,
    backgroundRemoved,
  }
}

export function elementNameFromFile(file, fallback = 'Scanned element') {
  const base = String(file?.name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim()
  if (!base) return fallback
  return base.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 40)
}
