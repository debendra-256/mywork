import { PALETTES, paletteColors, ASPECTS } from './data/presets.js'
import { socialName } from './data/socials.js'
import { footerPreset } from './data/footers.js'
import { NAME_CARD_LOGO } from './data/namecards.js'

export const uid = (prefix = 'd') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

export const cloneDoc = (doc) => JSON.parse(JSON.stringify(doc))

export const aspectOf = (doc) => (ASPECTS[doc.aspect] || ASPECTS.portrait).ratio

export function applyPalette(doc, paletteId) {
  const palette = PALETTES[paletteId]
  if (!palette) return doc
  return { ...doc, paletteId, colors: { ...palette } }
}

export const resolve = (doc, color) => {
  if (!color) return 'transparent'
  if (color === 'none' || color === 'transparent') return color
  if (color.startsWith('#') || color.startsWith('rgb')) return color
  return (doc.colors && doc.colors[color]) || '#333'
}

export function makeText(overrides = {}) {
  return {
    id: uid('t'),
    type: 'text',
    text: 'Your text here',
    x: 20,
    y: 45,
    w: 60,
    size: 4,
    font: 'display',
    color: 'ink',
    weight: 400,
    italic: false,
    align: 'center',
    tracking: 0,
    lineHeight: 1.3,
    transform: 'none',
    bg: 'none',
    bgStroke: 'none',
    bgStrokeWidth: 0.12,
    bgRadius: 0.4,
    rotation: 0,
    opacity: 1,
    ...overrides,
  }
}

export function makeShape(shape = 'rect', overrides = {}) {
  return {
    id: uid('s'),
    type: 'shape',
    shape,
    x: 30,
    y: 50,
    w: 40,
    h: 20,
    fill: 'none',
    stroke: 'accent',
    strokeWidth: 0.3,
    opacity: 1,
    rotation: 0,
    ...overrides,
  }
}

export function makeInk(overrides = {}) {
  return {
    id: uid('ink'),
    type: 'ink',
    x: 30,
    y: 40,
    w: 40,
    h: 20,
    points: [],
    size: 1.8,
    color: '#1c2025',
    opacity: 0.9,
    rotation: 0,
    ...overrides,
  }
}

export function makeBanner(overrides = {}) {
  return {
    id: uid('bn'),
    type: 'banner',
    text: 'Mr. Arjun Kapoor',
    x: 12,
    y: 45,
    w: 76,
    h: 13,
    font: 'display',
    size: 5,
    weight: 600,
    italic: false,
    tracking: 0.01,
    transform: 'none',
    color: '#f4d98b',
    plate: '#6a1015',
    strokeColor: '#c9a227',
    strokeWidth: 0.22,
    radius: 1.4,
    inner: true,
    ornaments: true,
    opacity: 1,
    rotation: 0,
    ...overrides,
  }
}

export function makeNameCard(overrides = {}) {
  return {
    id: uid('nc'),
    type: 'namecard',
    name: 'Joshua Peter De souza',
    title: 'Dy. Speaker - Goa Legislative Assembly | MLA - Mapusa Constituency',
    socials: [
      { id: uid('ncs'), platform: 'facebook', platform2: 'instagram', handle: 'Joshuadesouzaofficial' },
      { id: uid('ncs'), platform: 'x', platform2: '', handle: 'Joshua_de_souza' },
    ],
    x: 8,
    y: 50,
    w: 84,
    h: 24,
    font: 'sans',
    align: 'left',
    bg: '#ffffff',
    bgRadius: 0.9,
    logo: '',
    logoSize: 7.5,
    logoRing: 'none',
    contacts: [],
    contactBg: '#0e5b5e',
    contactColor: '#ffffff',
    contactSize: 1.7,
    nameSize: 5,
    titleSize: 2.1,
    socialSize: 2,
    nameColor: '#0e5b5e',
    titleColor: '#14696b',
    socialColor: '#0f4f50',
    iconColor: '#0f4f50',
    icons: 'brand',
    opacity: 1,
    rotation: 0,
    ...overrides,
  }
}

export function makeContactItem(overrides = {}) {
  return {
    id: uid('ncc'),
    kind: 'phone',
    text: '',
    ...overrides,
  }
}

export function makeContactCard(overrides = {}) {
  return makeNameCard({
    logo: NAME_CARD_LOGO,
    logoSize: 8.5,
    contacts: [
      makeContactItem({ kind: 'phone', text: '+91 98906 35788' }),
      makeContactItem({ kind: 'email', text: 'officialjoshuadesouza@gmail.com' }),
    ],
    h: 30,
    ...overrides,
  })
}

export function makeOrnament(ornament = 'sprig', overrides = {}) {  return {
    id: uid('o'),
    type: 'ornament',
    ornament,
    x: 40,
    y: 45,
    w: 20,
    rotation: 0,
    color: 'accent',
    opacity: 1,
    flipX: false,
    ...overrides,
  }
}

const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<rect width="600" height="600" fill="#efe6d6"/>
<circle cx="300" cy="228" r="92" fill="#c9b99a"/>
<path d="M300 338c-118 0-192 76-200 198h400c-8-122-82-198-200-198Z" fill="#c9b99a"/>
</svg>`

export const PLACEHOLDER_PHOTO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg)}`

export const PHOTO_BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'soft-light']

export function makePhoto(overrides = {}) {
  return {
    id: uid('p'),
    type: 'photo',
    x: 62,
    y: 52,
    w: 28,
    h: 28,
    src: PLACEHOLDER_PHOTO,
    fit: 'cover',
    zoom: 1,
    panX: 0,
    panY: 0,
    shape: 'rounded',
    radius: 1.4,
    backdrop: 'paper',
    tint: 'none',
    tintStrength: 0,
    blend: 'normal',
    borderColor: 'accent',
    borderWidth: 0,
    opacity: 1,
    rotation: 0,
    ...overrides,
  }
}

export function makeSocial(platform = 'facebook', overrides = {}) {
  return {
    id: uid('sc'),
    type: 'social',
    platform,
    x: 46,
    y: 92,
    w: 3.4,
    color: 'ink',
    opacity: 1,
    rotation: 0,
    ...overrides,
  }
}

export function makeSticker({ src, name = 'Element', aspect = 1, slots = [] } = {}, overrides = {}) {
  const ratio = Number(aspect) > 0 ? Number(aspect) : 1
  const w = Math.round(Math.min(30, Math.max(8, 40 * ratio)) * 10) / 10
  return {
    id: uid('st'),
    type: 'sticker',
    src,
    name,
    aspect: ratio,
    x: Math.round(((100 - w) / 2) * 10) / 10,
    y: 40,
    w,
    opacity: 1,
    rotation: 0,
    blend: 'normal',
    slots: (Array.isArray(slots) ? slots : []).map((slot) => ({
      ...slot,
      src: '',
      text: slot.kind === 'text' ? String(slot.text ?? '') : '',
    })),
    ...overrides,
  }
}

export function makeFooterItem(overrides = {}) {
  return {
    id: uid('fi'),
    icon: 'x',
    text: '@yourhandle',
    src: '',
    dx: 0,
    ...overrides,
  }
}

export function makeFooter(presetId = 'night', overrides = {}) {
  const preset = footerPreset(presetId)
  return {
    id: uid('f'),
    type: 'footer',
    blank: !!preset.blank,
    x: preset.w >= 100 ? 0 : 18,
    y: 92,
    w: preset.w,
    h: preset.h,
    bg: preset.bg,
    color: preset.color,
    radius: preset.radius,
    icons: 'brand',
    opacity: 1,
    rotation: 0,
    items: preset.blank
      ? []
      : [
          makeFooterItem({ icon: 'x', text: '@yourhandle' }),
          makeFooterItem({ icon: 'instagram', text: '@yourhandle' }),
          makeFooterItem({ icon: 'facebook', text: 'Your Name' }),
        ],
    ...overrides,
  }
}

export function layerLabel(el) {
  if (el.type === 'text') return el.text.split('\n')[0].slice(0, 28) || 'Text'
  if (el.type === 'banner') return el.text.split('\n')[0].slice(0, 28) || 'Name plate'
  if (el.type === 'namecard') return (el.name || '').split('\n')[0].slice(0, 28) || 'Name card'
  if (el.type === 'photo') return el.role === 'logo' ? 'Party logo' : 'Photo'
  if (el.type === 'sticker') return (el.name || 'Element').slice(0, 28)
  if (el.type === 'social') return socialName(el.platform)
  if (el.type === 'footer') return el.blank ? 'Blank footer' : 'Social footer'
  if (el.type === 'shape') return el.shape === 'line' ? 'Line' : el.shape
  return el.ornament
}

const storageAvailable = () => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

export function loadDesigns(storageKey) {
  if (!storageAvailable()) return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(storageKey, designs) {
  if (!storageAvailable()) return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(designs))
  } catch {
    /* quota exceeded — keep the in-memory copy alive */
  }
}

export function saveDesign(storageKey, designs, doc, designId) {
  const now = Date.now()
  const id = designId || uid('design')
  const entry = {
    id,
    name: doc.name || 'Untitled design',
    templateId: doc.templateId || null,
    category: doc.category || 'Custom',
    aspect: doc.aspect,
    updatedAt: now,
    colors: { ...doc.colors },
    doc: cloneDoc(doc),
  }
  const existing = designs.filter((d) => d.id !== id)
  const next = [entry, ...existing]
  persist(storageKey, next)
  return { entry, designs: next }
}

export function deleteDesign(storageKey, designs, id) {
  const next = designs.filter((d) => d.id !== id)
  persist(storageKey, next)
  return next
}

export function storeDesigns(storageKey, designs) {
  persist(storageKey, designs)
  return designs
}

export const newDesignId = () => uid('design')
export const paletteFor = (id) => paletteColors(id)
