import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Images,
  Sparkles,
  Square,
  Trash2,
  X,
  UploadCloud,
  FileText,
  Layers,
  Zap,
  BookOpen,
  Cloud,
  Gift,
  Play,
  Save,
} from 'lucide-react'
import Editor from './template-studio/components/Editor.jsx'
import TemplateCanvas from './template-studio/components/TemplateCanvas.jsx'
import { CATEGORY_COUNTS, TEMPLATES, docFromTemplate } from './template-studio/data/templates.js'
import { ASPECTS, CATEGORIES, PALETTES } from './template-studio/data/presets.js'
import { aspectOf, cloneDoc, makePhoto } from './template-studio/model.js'
import { css as studioCss } from './template-studio/styles.js'
import { deleteDraft, loadDrafts, saveDraft } from './drafts.js'
import './CreatePoster.css'

if (typeof document !== 'undefined' && !document.getElementById('qoder-template-studio-css')) {
  const style = document.createElement('style')
  style.id = 'qoder-template-studio-css'
  style.textContent = studioCss
  document.head.appendChild(style)
}

class EditorErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Poster Editor Error Boundary caught:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px 24px', textAlign: 'center', background: '#1c1f24', color: '#fff', borderRadius: '12px', margin: '32px auto', maxWidth: '540px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Editor recovered from a glitch</h3>
          <p style={{ opacity: 0.8, fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
            A rendering glitch was safely contained to keep your poster work intact. You can resume editing immediately.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="cp-btn cp-btn--primary"
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Resume editing
            </button>
            <button
              type="button"
              className="cp-btn cp-btn--ghost"
              style={{ background: 'transparent', color: '#ccc', border: '1px solid #444', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => this.props.onReset?.()}
            >
              Back to posts
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_EDGE = 1700
const MAX_BYTES = 25 * 1024 * 1024
const MAX_IMAGES = 12

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file))
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')) }
    img.src = url
  })
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read that image'))
    reader.readAsDataURL(blob)
  })
}

async function preparePosterImage(file) {
  if (!ACCEPTED.includes(file.type)) throw new Error('Use a PNG, JPG, WebP or GIF image')
  if (file.size > MAX_BYTES) throw new Error('That image is larger than 25 MB')
  const bitmap = await loadBitmap(file)
  const width = bitmap.width || bitmap.naturalWidth
  const height = bitmap.height || bitmap.naturalHeight
  if (!width || !height) throw new Error('Could not read that image')
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  if (bitmap.close) bitmap.close()
  let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9))
  if (!blob) blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not prepare that image')
  return { src: await blobToDataUrl(blob), ratio: canvas.width / canvas.height }
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const mainPhotoSlots = (doc) => doc.elements.filter((el) => el.type === 'photo' && el.role !== 'logo')

const isPhotoReady = (template) => mainPhotoSlots(template).length > 0

function withUploadedImage(doc, src) {
  if (!src) return doc
  const slots = mainPhotoSlots(doc)
  if (slots.length) {
    const ids = new Set(slots.map((slot) => slot.id))
    return {
      ...doc,
      elements: doc.elements.map((el) => (
        ids.has(el.id) ? { ...el, src, fit: 'cover', zoom: 1, panX: 0, panY: 0 } : el
      )),
    }
  }
  const heightUnits = 100 / aspectOf(doc)
  const w = 74
  const h = Math.min(w, heightUnits * 0.52)
  const photo = makePhoto({
    x: (100 - w) / 2,
    y: (heightUnits - h) / 2,
    w,
    h,
    src,
    shape: 'rounded',
    radius: 1.6,
    backdrop: 'paper',
    borderColor: 'paper',
    borderWidth: 0.8,
  })
  const elements = [...doc.elements]
  const firstText = elements.findIndex((el) => el.type === 'text')
  if (firstText < 0) elements.push(photo)
  else elements.splice(firstText, 0, photo)
  return { ...doc, elements }
}

function blankPosterDoc(src, ratio) {
  const custom = Number(ratio) > 0 ? Math.round(Number(ratio) * 1000) / 1000 : null
  return {
    templateId: null,
    name: 'My photo poster',
    category: 'Custom',
    tag: 'Photo poster',
    aspect: custom || 'portrait',
    paletteId: 'monochrome',
    colors: { ...PALETTES.monochrome },
    bg: { type: 'image', src, fit: 'cover', zoom: 1, posX: 50, posY: 50, overlay: 0, tint: 'ink', from: 'paper', texture: false },
    elements: [],
  }
}

const BLANK_PAGES = [
  { id: 'white', name: 'White', color: '#ffffff' },
  { id: 'ivory', name: 'Ivory', color: '#f6f1e7' },
  { id: 'sand', name: 'Sand', color: '#e6dac4' },
  { id: 'blush', name: 'Blush', color: '#f2d8d4' },
  { id: 'sage', name: 'Sage', color: '#dbe6d7' },
  { id: 'sky', name: 'Sky', color: '#d8e6ef' },
  { id: 'terracotta', name: 'Terracotta', color: '#d9a58f' },
  { id: 'ink', name: 'Ink', color: '#23282a' },
]

const START_OPTIONS = [
  {
    id: 'photo',
    index: '01',
    title: 'Upload a photo',
    icon: ImagePlus,
    copy: 'Turn your own picture into a poster. Upload several and each one gets its own post.',
    points: ['Batch upload', 'Auto photo slot', 'Save drafts'],
    cta: 'Upload photo',
  },
  {
    id: 'blank',
    index: '02',
    title: 'Blank poster',
    icon: Square,
    copy: 'Start from an empty coloured page and build it with text, shapes and elements.',
    points: ['8 page colours', 'Shapes & text', 'HD export'],
    cta: 'Pick a blank page',
  },
  {
    id: 'template',
    index: '03',
    title: 'Predefined template',
    icon: Images,
    copy: 'Choose a ready-made layout, then make every detail yours in the editor.',
    points: ['29 layouts', '8 categories', 'Photo-ready slots'],
    cta: 'Browse templates',
  },
]

const START_CARDS = [
  {
    id: 'photo',
    variant: 'blue',
    icon: UploadCloud,
    image: '/images/poster-card-upload.png',
    title: 'Upload a photo',
    copy: 'Turn your own photo into a poster. Upload an image and add text, stickers, effects and more.',
    pills: [
      { label: 'Basic editing', icon: '✨' },
      { label: 'Auto photo edit', icon: '🎨' },
      { label: 'Save draft', icon: '💾' },
    ],
    cta: 'Upload photo',
    route: '/poster/upload',
  },
  {
    id: 'blank',
    variant: 'amber',
    icon: FileText,
    image: '/images/poster-card-blank.png',
    title: 'Blank poster',
    copy: 'Start from an empty canvas and build it with text, shapes, stickers and elements.',
    pills: [
      { label: 'Page size (A4, etc.)', icon: '📄' },
      { label: 'Shapes & text', icon: '📐' },
      { label: 'HD export', icon: '✨' },
    ],
    cta: 'Pick a blank page',
    route: '/poster/blank',
  },
  {
    id: 'template',
    variant: 'magenta',
    icon: Layers,
    image: '/images/poster-card-template.png',
    title: 'Predefined template',
    copy: 'Choose a ready-made layout. Then make it yours with your photo, text and colors.',
    pills: [
      { label: '250+ layouts', icon: '🗂' },
      { label: '8+ categories', icon: '🏷' },
      { label: 'Photo-ready picks', icon: '🏆' },
    ],
    cta: 'Browse templates',
    route: '/poster/templates',
  },
]

const HOW_IT_WORKS_STEPS = [
  {
    num: '01',
    color: 'purple',
    icon: Images,
    title: 'Upload many photos',
    desc: 'Select a batch of photos — portrait, event or product shots all at once.',
  },
  {
    num: '02',
    color: 'pink',
    icon: Layers,
    title: 'One post per image',
    desc: 'Each upload is split into its own post, ready for its own template.',
  },
  {
    num: '03',
    color: 'cyan',
    icon: FileText,
    title: 'Edit each post',
    desc: 'Pick a template, add text, change colors, apply stickers and more.',
  },
  {
    num: '04',
    color: 'green',
    icon: Save,
    title: 'Save a draft',
    desc: 'Resume from the browser or download a high-resolution PNG.',
  },
]

const START_ROUTES = { photo: '/poster/upload', blank: '/poster/blank', template: '/poster/templates' }
const POSTER_MODES = { upload: 'photo', blank: 'blank', templates: 'template' }

function StartOptionPreview({ id }) {
  if (id === 'photo') {
    return (
      <span className="cp-anim cp-anim--photo">
        <span className="cp-anim-poster">
          <span className="cp-anim-slot">
            <span className="cp-anim-slot-photo" />
            <span className="cp-anim-slot-icon"><ImagePlus size={11} /></span>
          </span>
          <span className="cp-anim-line cp-anim-line--lg" />
          <span className="cp-anim-line" />
        </span>
        <span className="cp-anim-photo cp-anim-photo--ghost"><span className="cp-anim-photo-art" /></span>
        <span className="cp-anim-photo"><span className="cp-anim-photo-art" /></span>
        <span className="cp-anim-spark"><Sparkles size={11} /></span>
      </span>
    )
  }
  if (id === 'blank') {
    return (
      <span className="cp-anim cp-anim--blank">
        <span className="cp-anim-poster">
          <span className="cp-anim-fill" />
          <span className="cp-anim-block cp-anim-block--a" />
          <span className="cp-anim-block cp-anim-block--b" />
          <span className="cp-anim-block cp-anim-block--c" />
        </span>
        <span className="cp-anim-dots">
          {['#ffffff', '#f6f1e7', '#e6dac4', '#f2d8d4', '#dbe6d7', '#d8e6ef', '#d9a58f', '#23282a'].map((color, index) => (
            <span key={color} className="cp-anim-dot" style={{ background: color, animationDelay: `${index * 0.17}s` }} />
          ))}
        </span>
      </span>
    )
  }
  return (
    <span className="cp-anim cp-anim--deck">
      <span className="cp-anim-card cp-anim-card--back" />
      <span className="cp-anim-card cp-anim-card--mid" />
      <span className="cp-anim-card cp-anim-card--front">
        <span className="cp-anim-photo-art cp-anim-photo-art--wide" />
        <span className="cp-anim-line cp-anim-line--lg" />
        <span className="cp-anim-line" />
        <span className="cp-anim-shine" />
      </span>
    </span>
  )
}

export const POSTER_SIZES = [
  { id: 'story', name: 'Instagram Reels / Story', ratioLabel: '9:16', desc: '1080 × 1920', ratio: 9 / 16 },
  { id: 'square', name: 'Instagram / FB Post', ratioLabel: '1:1', desc: '1080 × 1080', ratio: 1 },
  { id: 'portrait45', name: 'Instagram Portrait', ratioLabel: '4:5', desc: '1080 × 1350', ratio: 4 / 5 },
  { id: 'landscape169', name: 'Facebook / YouTube', ratioLabel: '16:9', desc: '1920 × 1080', ratio: 16 / 9 },
  { id: 'portrait', name: 'Poster / Flyer', ratioLabel: '5:7', desc: 'Standard flyer', ratio: 5 / 7 },
  { id: 'banner', name: 'Banner Header', ratioLabel: '4:1', desc: 'Cover banner', ratio: 4 },
]

function blankColorDoc(page, aspect = 'story') {
  return {
    templateId: null,
    name: `Blank ${page.name.toLowerCase()} page`,
    category: 'Custom',
    tag: 'Blank page',
    aspect: aspect || 'story',
    paletteId: 'monochrome',
    colors: { ...PALETTES.monochrome },
    bg: { type: 'solid', from: page.color, to: page.color, angle: 160, fit: 'cover', zoom: 1, posX: 50, posY: 50, overlay: 0, tint: 'ink', texture: false },
    elements: [],
  }
}

const formatWhen = (timestamp) => {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp))
  } catch {
    return 'Saved draft'
  }
}

function TemplateCard({ doc, template, onOpen }) {
  return (
    <article
      className="cp-tpl-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onOpen()}
    >
      <div className="cp-tpl-view">
        <TemplateCanvas doc={doc} />
        {isPhotoReady(template) && <span className="cp-tpl-badge">Photo slot</span>}
      </div>
      <div className="cp-tpl-meta">
        <div>
          <strong>{template.name}</strong>
          <small>{template.category} · {ASPECTS[template.aspect]?.label || template.aspect}</small>
        </div>
        <span className="cp-tpl-arrow"><ArrowRight size={14} /></span>
      </div>
    </article>
  )
}

function DraftCard({ draft, onOpen, onDelete }) {
  return (
    <article
      className="cp-tpl-card cp-draft-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => event.key === 'Enter' && onOpen()}
    >
      <div className="cp-tpl-view">
        <TemplateCanvas doc={draft.doc} />
        <span className="cp-tpl-badge cp-tpl-badge--draft">Draft</span>
      </div>
      <div className="cp-tpl-meta">
        <div>
          <strong>{draft.name || 'Untitled poster'}</strong>
          <small>Saved {formatWhen(draft.updatedAt)}</small>
        </div>
        <div className="cp-draft-actions">
          <button type="button" onClick={(event) => { event.stopPropagation(); onOpen() }}>Resume</button>
          <button
            type="button"
            className="cp-draft-delete"
            title="Delete draft"
            aria-label={`Delete ${draft.name || 'draft'}`}
            onClick={(event) => { event.stopPropagation(); onDelete() }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function CreatePoster() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mode = POSTER_MODES[pathname.replace(/\/+$/, '').split('/').pop()] || null
  const [images, setImages] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [touched, setTouched] = useState({})
  const [preparing, setPreparing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('All')
  const [posterSize, setPosterSize] = useState('story')
  const [sizeFilter, setSizeFilter] = useState('All')
  const [drafts, setDrafts] = useState(() => loadDrafts())
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [showIntake, setShowIntake] = useState(false)
  const inputRef = useRef(null)
  const templatesRef = useRef(null)
  const toastTimer = useRef(null)

  const notify = useCallback((message) => {
    if (!message) return
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }, [])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  useEffect(() => {
    if (editing) window.scrollTo({ top: 0, behavior: 'auto' })
  }, [editing])

  // A deep-linked photo arrives before the template grid is on the page.
  useEffect(() => {
    if (!showIntake) return
    setShowIntake(false)
    templatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showIntake])

  const pickFile = () => inputRef.current?.click()

  // Each start option is its own page, so switching between them starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [mode])

  // The Blogger "Edit this template" button lands here with ?photo=<image url>.
  const photoParam = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('photo') || ''
    try {
      const url = new URL(value)
      return url.protocol === 'https:' || url.protocol === 'http:' ? value : ''
    } catch {
      return ''
    }
  }, [])

  useEffect(() => {
    if (!photoParam) return undefined
    if (mode !== 'photo') {
      navigate(`/poster/upload${window.location.search}`, { replace: true })
      return undefined
    }
    let cancelled = false
    const name = decodeURIComponent(photoParam.split('/').pop()?.split('?')[0] || '') || 'photo.jpg'
    const addPost = (src, label, ratio) => {
      if (cancelled) return
      const entry = { id: uid(), src, name: label, ratio }
      setImages([entry])
      setActiveId(entry.id)
      setShowIntake(true)
    }
    setPreparing(true)
    ;(async () => {
      try {
        // Google's image host sends no CORS headers, so remote photos come through the read-only proxy.
        const sameOrigin = new URL(photoParam).origin === window.location.origin
        const response = await fetch(sameOrigin ? photoParam : `/api/poster-photo?photo=${encodeURIComponent(photoParam)}`)
        if (!response.ok) throw new Error('Could not download that image')
        const blob = await response.blob()
        const file = new File([blob], name, { type: ACCEPTED.includes(blob.type) ? blob.type : 'image/jpeg' })
        const prepared = await preparePosterImage(file)
        addPost(prepared.src, name || 'Photo from Blogger', prepared.ratio)
        notify('Your photo is ready — pick a template for this post')
      } catch {
        addPost(photoParam, name || 'Photo from Blogger')
        notify('Using the Blogger image link — pick a template for this post')
      } finally {
        if (!cancelled) setPreparing(false)
      }
    })()
    return () => { cancelled = true }
  }, [photoParam, mode, navigate, notify])

  const startEditing = (doc, designId = null, imageId = null) => {
    if (imageId) setTouched((prev) => ({ ...prev, [imageId]: prev[imageId] || 'opened' }))
    setEditing({ doc, designId, imageId, key: `${designId || 'new'}-${Date.now()}` })
  }

  const openPostPhoto = (img) => {
    setActiveId(img.id)
    startEditing(blankPosterDoc(img.src, img.ratio), null, img.id)
  }

  const handleFiles = useCallback(async (fileList) => {
    const files = [...(fileList || [])]
    if (!files.length) return
    setError('')
    setPreparing(true)
    const accepted = files.filter((file) => ACCEPTED.includes(file.type))
    const skipped = files.length - accepted.length
    const batch = accepted.slice(0, Math.max(0, MAX_IMAGES - images.length))
    const overflow = accepted.length - batch.length
    const ready = []
    let failure = ''
    for (const file of batch) {
      try {
        if (file.size > MAX_BYTES) throw new Error(`${file.name || 'An image'} is larger than 25 MB`)
        const { src, ratio } = await preparePosterImage(file)
        ready.push({ id: uid(), src, ratio, name: file.name || `Photo ${ready.length + 1}` })
      } catch (reason) {
        failure = reason instanceof Error ? reason.message : 'Could not read that image'
      }
    }
    setPreparing(false)
    const wasEmpty = images.length === 0
    if (ready.length) {
      setImages((prev) => [...prev, ...ready])
      if (wasEmpty) openPostPhoto(ready[0])
      else setActiveId((prev) => prev || ready[0].id)
    }
    const notes = []
    if (ready.length) {
      notes.push(wasEmpty
        ? (ready.length === 1
          ? 'Your photo is ready — editing it now'
          : `${ready.length} photos ready — editing Post 1, the rest wait in your queue`)
        : `${ready.length} photo${ready.length > 1 ? 's' : ''} ready — each is its own post`)
    }
    if (skipped) notes.push(`${skipped} skipped (not an image)`)
    if (overflow) notes.push(`${overflow} over the ${MAX_IMAGES}-image limit`)
    if (notes.length) notify(notes.join(' · '))
    if (!ready.length && failure) setError(failure)
  }, [images.length, notify, openPostPhoto])

  const onInputChange = (event) => {
    // Copy first: resetting input.value empties the live FileList we are handed.
    const files = [...event.target.files]
    event.target.value = ''
    void handleFiles(files)
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    void handleFiles(event.dataTransfer.files)
  }

  const removeImage = (id) => {
    const next = images.filter((item) => item.id !== id)
    setImages(next)
    setActiveId((prev) => {
      if (prev !== id) return next.some((item) => item.id === prev) ? prev : (next[0]?.id ?? null)
      return next[0]?.id ?? null
    })
    notify('Post removed')
  }

  const clearImages = () => {
    setImages([])
    setActiveId(null)
    setTouched({})
    setError('')
    notify('All posts cleared')
  }

  const askForTemplate = (img) => {
    setActiveId(img.id)
    templatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    notify(`Pick a template for “${img.name}”`)
  }

  const activeImage = images.find((item) => item.id === activeId) || images[0] || null

  const categories = useMemo(
    () => CATEGORIES.filter((item) => item.id === 'All' || CATEGORY_COUNTS[item.id] > 0),
    []
  )

  const previews = useMemo(() => {
    let list = TEMPLATES.map((template) => ({ template, doc: docFromTemplate(template.id) }))
    if (category !== 'All') {
      list = list.filter((item) => item.template.category === category)
    }
    if (sizeFilter !== 'All') {
      list = list.filter((item) => {
        if (sizeFilter === 'story') return item.template.aspect === 'story'
        if (sizeFilter === 'square') return item.template.aspect === 'square'
        if (sizeFilter === 'portrait' || sizeFilter === 'portrait45') return item.template.aspect === 'portrait' || item.template.aspect === 'portrait45'
        if (sizeFilter === 'landscape' || sizeFilter === 'landscape169') return item.template.aspect === 'landscape' || item.template.aspect === 'landscape169'
        return String(item.template.aspect) === String(sizeFilter)
      })
    }
    return list
  }, [category, sizeFilter])

  const showTemplates = mode === 'template' || (mode === 'photo' && images.length > 0)

  const openTemplate = (template) => {
    const base = docFromTemplate(template.id)
    if (activeImage) {
      startEditing(withUploadedImage({ ...base, name: `${base.name} poster` }, activeImage.src), null, activeImage.id)
    } else {
      startEditing(base, null, null)
    }
  }

  const openBlankPage = (page) => startEditing(blankColorDoc(page, posterSize))

  const openDraft = (draft) => startEditing(cloneDoc(draft.doc), draft.id)

  const removeDraft = (id) => {
    const draft = drafts.find((item) => item.id === id)
    if (!window.confirm(`Delete “${draft?.name || 'this draft'}”? This cannot be undone.`)) return
    setDrafts(deleteDraft(id))
    notify('Draft deleted')
  }

  const handleSave = async (doc, designId) => {
    const { entry, drafts: next } = saveDraft(doc, designId)
    setDrafts(next)
    if (editing?.imageId) setTouched((prev) => ({ ...prev, [editing.imageId]: 'saved' }))
    return { id: entry.id }
  }

  const leaveEditor = () => {
    setEditing(null)
    const pending = images.filter((item) => !touched[item.id])
    if (pending.length) {
      setActiveId(pending[0].id)
      notify(
        pending.length === 1
          ? `Next post: choose a template for “${pending[0].name}”`
          : `${pending.length} posts still need a template — starting with “${pending[0].name}”`
      )
    }
  }

  if (editing) {
    return (
      <div className="cp-shell cp-shell--editor">
        <div className="ts-root cp-editor-stage">
          <EditorErrorBoundary
            onError={(err) => notify(`Notice: ${err?.message || 'Display glitch recovered'}`)}
            onReset={leaveEditor}
          >
            <Editor
              key={editing.key}
              initialDoc={editing.doc}
              designId={editing.designId}
              onSave={handleSave}
              onBack={leaveEditor}
              onClose={leaveEditor}
              onToast={notify}
              backLabel="Create Poster"
              apiBase=""
            />
          </EditorErrorBoundary>
        </div>
        {toast && <div className="cp-toast" role="status"><Check size={14} /><span>{toast}</span></div>}
      </div>
    )
  }

  return (
    <div className="cp-shell">
      <main className="cp-page">
        {!mode ? (
          <header className="cp-hero">
            <div className="cp-hero-body">
              <div className="cp-hero-content">
                <Link to="/" className="cp-back"><ArrowLeft size={13} /> Back to the library</Link>
                <div className="cp-hero-kicker">
                  <Sparkles size={12} className="cp-sparkle-icon" /> CREATE POSTER
                </div>
                <h1 className="cp-hero-title">
                  Turn any photo into a<br />
                  stunning <span className="cp-title-accent">Poster</span>
                </h1>
                <p className="cp-hero-desc">
                  Start with your own photo, a blank canvas or a ready-made template. Pick a route below, then edit, save a draft and download a print-ready poster whenever you like.
                </p>
                <div className="cp-hero-actions">
                  <a href="#three-ways" className="cp-hero-btn cp-hero-btn--primary">
                    <span>Get Started</span>
                    <ArrowRight size={15} />
                  </a>
                  <a href="#how-it-works" className="cp-hero-btn cp-hero-btn--secondary">
                    <span className="cp-hero-play-icon">▶</span>
                    <span>Watch How It Works</span>
                  </a>
                </div>
                <div className="cp-hero-values">
                  <span className="cp-hero-val"><Zap size={14} className="cp-val-icon cp-val-icon--yellow" fill="currentColor" /> Easy to Use</span>
                  <span className="cp-hero-val"><BookOpen size={14} className="cp-val-icon cp-val-icon--teal" /> Ready Templates</span>
                  <span className="cp-hero-val"><Cloud size={14} className="cp-val-icon cp-val-icon--purple" /> High-Resolution</span>
                  <span className="cp-hero-val"><Gift size={14} className="cp-val-icon cp-val-icon--pink" /> Free to Create</span>
                </div>
              </div>
              <div className="cp-hero-visual" aria-hidden="true">
                <div className="cp-hero-showcase-stage">
                  <img
                    src="/images/poster-hero-showcase.png"
                    alt="Poster showcases"
                    className="cp-hero-showcase-img"
                  />
                </div>
              </div>
            </div>
          </header>
        ) : (
          <header className="cp-head cp-head--submode">
            <Link to="/poster" className="cp-back"><ArrowLeft size={13} /> Back to poster options</Link>
            <div className="cp-hero-kicker"><Sparkles size={12} /> CREATE POSTER</div>
            <h1>Turn any photo into <em>a poster.</em></h1>
          </header>
        )}

        {!mode && (
          <section className="cp-start" id="three-ways" aria-label="Choose how to start">
            <div className="cp-three-ways-head">
              <div className="cp-three-ways-title-wrap">
                <h2 className="cp-three-ways-title">
                  <span className="cp-sparkle-decor">✨</span> Three ways <span className="cp-title-accent">to make a poster</span> <span className="cp-sparkle-decor">✨</span>
                </h2>
              </div>
              <span className="cp-count">3 options</span>
            </div>

            <div className="cp-cards-grid" aria-label="Poster start options">
              {START_CARDS.map((card) => {
                const Icon = card.icon
                return (
                  <article key={card.id} className={`cp-mock-card cp-mock-card--${card.variant}`}>
                    <div className="cp-mock-top">
                      <span className={`cp-mock-icon-badge cp-mock-icon-badge--${card.variant}`}>
                        <Icon size={18} />
                      </span>
                    </div>

                    <div className="cp-mock-art-wrap">
                      <img src={card.image} alt={card.title} className="cp-mock-art-img" />
                    </div>

                    <div className="cp-mock-body">
                      <h3 className="cp-mock-title">{card.title}</h3>
                      <p className="cp-mock-desc">{card.copy}</p>
                    </div>

                    <div className="cp-mock-pills">
                      {card.pills.map((pill) => (
                        <span key={pill.label} className="cp-mock-pill">
                          <span className="cp-mock-pill-emoji">{pill.icon}</span>
                          <span>{pill.label}</span>
                        </span>
                      ))}
                    </div>

                    <Link to={card.route} className={`cp-mock-cta-btn cp-mock-cta-btn--${card.variant}`}>
                      <span>{card.cta}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {mode && (
        <nav className="cp-route-bar" aria-label="Poster start options">
          <Link to="/poster" className="cp-route-back"><ArrowLeft size={13} /> All start options</Link>
          <div className="cp-route-links">
            {START_OPTIONS.map((option) => {
              const Icon = option.icon
              const current = mode === option.id
              return (
                <Link
                  key={option.id}
                  to={START_ROUTES[option.id]}
                  className={`cp-route-link${current ? ' is-active' : ''}`}
                  aria-current={current ? 'page' : undefined}
                >
                  <Icon size={13} /> {option.title}
                </Link>
              )
            })}
          </div>
        </nav>
        )}

        <div className="cp-mode-content">
        {mode === 'photo' && (
        <section
          className={`cp-uploader${images.length ? ' has-image' : ''}${dragOver ? ' is-dragging' : ''}`}
          aria-label="Upload images"
          onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragOver(false) }}
          onDrop={onDrop}
        >
          <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} multiple hidden onChange={onInputChange} />
          {images.length ? (
            <div className="cp-queue">
              <div className="cp-queue-head">
                <div>
                  <span className="cp-kicker">
                    {images.length} IMAGE{images.length > 1 ? 'S' : ''} UPLOADED · SPLIT INTO {images.length} POST{images.length > 1 ? 'S' : ''}
                  </span>
                  <h2>One photo, one post</h2>
                  <small>Choose a template for each post below, edit it, save, then come back for the next one.</small>
                </div>
                <div className="cp-queue-actions">
                  <button type="button" className="cp-button cp-button--ghost" onClick={pickFile}><ImagePlus size={13} /> Add images</button>
                  <button type="button" className="cp-button cp-button--quiet" onClick={clearImages}><X size={13} /> Clear all</button>
                </div>
              </div>
              <div className="cp-post-grid">
                {images.map((img, index) => {
                  const state = touched[img.id] === 'saved' ? 'Saved' : touched[img.id] ? 'Edited · unsaved' : 'Needs a template'
                  return (
                    <article
                      key={img.id}
                      className={`cp-post-card${activeImage?.id === img.id ? ' is-active' : ''}${touched[img.id] === 'saved' ? ' is-done' : ''}`}
                    >
                      <button type="button" className="cp-post-thumb" onClick={() => askForTemplate(img)} title={`Choose a template for ${img.name}`}>
                        <img src={img.src} alt="" />
                        <span className="cp-post-no">Post {index + 1}</span>
                      </button>
                      <div className="cp-post-meta">
                        <strong title={img.name}>{img.name}</strong>
                        <span className="cp-post-state">{state}</span>
                      </div>
                      <div className="cp-post-actions">
                        <button type="button" className="cp-post-plain" onClick={() => openPostPhoto(img)}>Open as plain photo</button>
                        <button type="button" className="cp-post-remove" onClick={() => removeImage(img.id)} aria-label={`Remove ${img.name}`} title="Remove this post">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="cp-drop"
              onClick={pickFile}
            >
              <span className="cp-drop-icon"><ImagePlus size={24} /></span>
              <strong>{preparing ? 'Preparing your images…' : 'Drag & drop one or many images, or browse'}</strong>
              <small>JPG, PNG, WebP or GIF · up to 25 MB each · up to {MAX_IMAGES} at once</small>
              <span className="cp-drop-cta">Choose images <ArrowRight size={14} /></span>
            </button>
          )}
          {error && <p className="cp-error" role="alert">{error}</p>}
          {preparing && images.length < MAX_IMAGES && <p className="cp-note">Preparing your images…</p>}
        </section>
        )}
        {mode === 'photo' && !images.length && <p className="cp-mode-hint">Upload a photo and the template gallery appears here, ready to turn it into a poster.</p>}

        {mode === 'blank' && (
        <section className="cp-blanks" aria-label="Blank colour pages">
          <div className="cp-size-section">
            <div className="cp-section-head">
              <div>
                <span className="cp-kicker">STEP 1 · CHOOSE POSTER SIZE</span>
                <h2>Select poster size & aspect ratio</h2>
              </div>
              <span className="cp-count">{POSTER_SIZES.length} sizes</span>
            </div>
            <div className="cp-size-grid" role="radiogroup" aria-label="Poster size presets">
              {POSTER_SIZES.map((size) => {
                const active = posterSize === size.id
                return (
                  <button
                    key={size.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`cp-size-card${active ? ' is-active' : ''}`}
                    onClick={() => setPosterSize(size.id)}
                    title={`Use ${size.name} (${size.ratioLabel})`}
                  >
                    <span className="cp-size-aspect-preview">
                      <span className="cp-size-ratio-badge">{size.ratioLabel}</span>
                    </span>
                    <div className="cp-size-meta">
                      <strong>{size.name}</strong>
                      <small>{size.desc}</small>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="cp-section-head" style={{ marginTop: 24 }}>
            <div>
              <span className="cp-kicker">STEP 2 · PICK A COLOUR</span>
              <h2>Start with a background colour</h2>
            </div>
            <span className="cp-count">{BLANK_PAGES.length} colours</span>
          </div>
          <div className="cp-blank-row">
            {BLANK_PAGES.map((page) => (
              <button
                key={page.id}
                type="button"
                className="cp-blank"
                onClick={() => openBlankPage(page)}
                title={`Open a ${page.name.toLowerCase()} blank page in ${POSTER_SIZES.find((s) => s.id === posterSize)?.name || 'selected size'}`}
              >
                <span className="cp-blank-swatch" style={{ background: page.color }} />
                <span className="cp-blank-name">{page.name}</span>
                <ArrowRight size={13} className="cp-blank-arrow" />
              </button>
            ))}
          </div>
          <p className="cp-blank-note">
            Opens the editor in <strong>{POSTER_SIZES.find((s) => s.id === posterSize)?.name} ({POSTER_SIZES.find((s) => s.id === posterSize)?.ratioLabel})</strong> with that colour — add text, name plates, shapes and scanned elements on top.
          </p>
        </section>
        )}

        {showTemplates && (
        <section className="cp-templates" id="poster-templates" ref={templatesRef} aria-label="Poster templates">
          <div className="cp-section-head">
            <div>
              <span className="cp-kicker">{images.length > 1 ? 'TEMPLATE FOR THIS POST' : 'CHOOSE A TEMPLATE'}</span>
              <h2>Choose a poster template</h2>
            </div>
            <span className="cp-count">{previews.length} layouts</span>
          </div>

          {activeImage && (
            <div className="cp-post-target">
              <img src={activeImage.src} alt="" />
              <div>
                <strong>
                  Editing Post {images.findIndex((item) => item.id === activeImage.id) + 1}
                  <span> · {activeImage.name}</span>
                </strong>
                <small>Each layout below is its own design. Click one to drop this photo into it in the editor.</small>
              </div>
              {images.length > 1 && (
                <div className="cp-post-switch" role="group" aria-label="Switch post">
                  {images.map((img, index) => (
                    <button
                      key={img.id}
                      type="button"
                      className={`cp-post-chip${activeImage.id === img.id ? ' is-active' : ''}`}
                      onClick={() => setActiveId(img.id)}
                      title={`${img.name} — Post ${index + 1}`}
                      aria-current={activeImage.id === img.id}
                    >
                      <img src={img.src} alt="" />
                      <span>{index + 1}</span>
                      {touched[img.id] === 'saved' && <i className="cp-post-tick"><Check size={9} /></i>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <div className="cp-chips" role="tablist" aria-label="Size filter">
              {[{ id: 'All', label: 'All Sizes' }, ...POSTER_SIZES].map((s) => {
                const active = sizeFilter === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`cp-chip${active ? ' is-active' : ''}`}
                    onClick={() => setSizeFilter(s.id)}
                    style={{ fontSize: '10.5px' }}
                  >
                    {s.ratioLabel ? `${s.name} (${s.ratioLabel})` : s.label}
                  </button>
                )
              })}
            </div>
            <div className="cp-chips" role="tablist" aria-label="Template categories">
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={category === item.id}
                  className={`cp-chip${category === item.id ? ' is-active' : ''}`}
                  onClick={() => setCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="cp-grid">
            {previews.map(({ template, doc }) => (
              <TemplateCard key={template.id} template={template} doc={doc} onOpen={() => openTemplate(template)} />
            ))}
          </div>
        </section>
        )}
        </div>

        {!mode && (
          <section className="cp-how-row" id="how-it-works" aria-label="How it works">
            {HOW_IT_WORKS_STEPS.map((step) => {
              const StepIcon = step.icon
              return (
                <div key={step.num} className={`cp-how-card cp-how-card--${step.color}`}>
                  <div className="cp-how-card-head">
                    <span className={`cp-how-num cp-how-num--${step.color}`}>{step.num}</span>
                    <div className="cp-how-icon-title">
                      <StepIcon size={15} className={`cp-how-icon cp-how-icon--${step.color}`} />
                      <strong>{step.title}</strong>
                    </div>
                  </div>
                  <p>{step.desc}</p>
                </div>
              )
            })}
          </section>
        )}

        {drafts.length > 0 && (
          <section className="cp-drafts" aria-label="Saved drafts">
            <div className="cp-section-head">
              <div>
                <span className="cp-kicker">MY DRAFTS</span>
                <h2>Continue where you left off</h2>
              </div>
              <span className="cp-count">{drafts.length} saved</span>
            </div>
            <div className="cp-grid">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onOpen={() => openDraft(draft)}
                  onDelete={() => removeDraft(draft.id)}
                />
              ))}
            </div>
          </section>
        )}

        <p className="cp-foot-note">Drafts are stored in this browser. Use <strong>PNG · HD</strong> in the editor to download a print-ready copy.</p>
      </main>
      {toast && <div className="cp-toast" role="status"><Check size={14} /><span>{toast}</span></div>}
    </div>
  )
}
