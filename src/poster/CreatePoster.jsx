import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Trash2, X } from 'lucide-react'
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
  return blobToDataUrl(blob)
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

function blankPosterDoc(src) {
  return {
    templateId: null,
    name: 'My photo poster',
    category: 'Custom',
    tag: 'Photo poster',
    aspect: 'portrait',
    paletteId: 'monochrome',
    colors: { ...PALETTES.monochrome },
    bg: { type: 'image', src, fit: 'cover', zoom: 1, posX: 50, posY: 50, overlay: 0, tint: 'ink', texture: false },
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

function blankColorDoc(page) {
  return {
    templateId: null,
    name: `Blank ${page.name.toLowerCase()} page`,
    category: 'Custom',
    tag: 'Blank page',
    aspect: 'portrait',
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
  const [images, setImages] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [touched, setTouched] = useState({})
  const [preparing, setPreparing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('All')
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
    let cancelled = false
    const name = decodeURIComponent(photoParam.split('/').pop()?.split('?')[0] || '') || 'photo.jpg'
    const addPost = (src, label) => {
      if (cancelled) return
      const entry = { id: uid(), src, name: label }
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
        addPost(await preparePosterImage(file), name || 'Photo from Blogger')
        notify('Your photo is ready — pick a template for this post')
      } catch {
        addPost(photoParam, name || 'Photo from Blogger')
        notify('Using the Blogger image link — pick a template for this post')
      } finally {
        if (!cancelled) setPreparing(false)
      }
    })()
    return () => { cancelled = true }
  }, [photoParam, notify])

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
        const src = await preparePosterImage(file)
        ready.push({ id: uid(), src, name: file.name || `Photo ${ready.length + 1}` })
      } catch (reason) {
        failure = reason instanceof Error ? reason.message : 'Could not read that image'
      }
    }
    setPreparing(false)
    if (ready.length) {
      setImages((prev) => [...prev, ...ready])
      setActiveId((prev) => prev || ready[0].id)
    }
    const notes = []
    if (ready.length) notes.push(`${ready.length} photo${ready.length > 1 ? 's' : ''} ready — each is its own post`)
    if (skipped) notes.push(`${skipped} skipped (not an image)`)
    if (overflow) notes.push(`${overflow} over the ${MAX_IMAGES}-image limit`)
    if (notes.length) notify(notes.join(' · '))
    if (!ready.length && failure) setError(failure)
  }, [images.length, notify])

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
    if (!activeImage) return []
    const list = TEMPLATES.map((template) => ({ template, doc: docFromTemplate(template.id) }))
    return category === 'All' ? list : list.filter((item) => item.template.category === category)
  }, [activeImage, category])

  const startEditing = (doc, designId = null, imageId = null) => {
    if (imageId) setTouched((prev) => ({ ...prev, [imageId]: prev[imageId] || 'opened' }))
    setEditing({ doc, designId, imageId, key: `${designId || 'new'}-${Date.now()}` })
  }

  const openTemplate = (template) => {
    if (!activeImage) return
    const base = docFromTemplate(template.id)
    startEditing(withUploadedImage({ ...base, name: `${base.name} poster` }, activeImage.src), null, activeImage.id)
  }

  const openPostPhoto = (img) => {
    setActiveId(img.id)
    startEditing(blankPosterDoc(img.src), null, img.id)
  }

  const openBlankPage = (page) => startEditing(blankColorDoc(page))

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
        </div>
        {toast && <div className="cp-toast" role="status"><Check size={14} /><span>{toast}</span></div>}
      </div>
    )
  }

  return (
    <div className="cp-shell">
      <main className="cp-page">
        <header className="cp-head">
          <Link to="/" className="cp-back"><ArrowLeft size={14} /> Back to the library</Link>
          <span className="cp-kicker">CREATE POSTER</span>
          <h1>Turn any photo into <em>a poster.</em></h1>
          <p>Upload one photo or a whole batch in a single go — every image becomes its own post. Pick a template for each post, edit it, and save whenever you want to finish later. Blank colour pages work too.</p>
        </header>

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

        <section className="cp-blanks" aria-label="Blank colour pages">
          <div className="cp-section-head">
            <div>
              <span className="cp-kicker">NO PHOTO? START WITH A PAGE</span>
              <h2>Pick a blank page colour</h2>
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
                title={`Open a ${page.name.toLowerCase()} blank page`}
              >
                <span className="cp-blank-swatch" style={{ background: page.color }} />
                <span className="cp-blank-name">{page.name}</span>
                <ArrowRight size={13} className="cp-blank-arrow" />
              </button>
            ))}
          </div>
          <p className="cp-blank-note">Opens the editor with an empty page in that colour — add text, name plates, shapes and scanned elements on top.</p>
        </section>

        {images.length ? (
          <section className="cp-templates" id="poster-templates" ref={templatesRef} aria-label="Poster templates">
            <div className="cp-section-head">
              <div>
                <span className="cp-kicker">{images.length > 1 ? 'TEMPLATE FOR THIS POST' : 'OPTIONAL · START FROM A LAYOUT'}</span>
                <h2>Choose a poster template</h2>
              </div>
              <span className="cp-count">{previews.length} layouts</span>
            </div>

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
            <div className="cp-grid">
              {previews.map(({ template, doc }) => (
                <TemplateCard key={template.id} template={template} doc={doc} onOpen={() => openTemplate(template)} />
              ))}
            </div>
          </section>
        ) : (
          <section className="cp-how" aria-label="How it works">
            <div className="cp-step"><span>01</span><strong>Upload many photos</strong><p>Select a batch at once — portrait, event or product shots all work.</p></div>
            <div className="cp-step"><span>02</span><strong>One post per image</strong><p>Each upload is split into its own post, ready for its own template.</p></div>
            <div className="cp-step"><span>03</span><strong>Edit each post</strong><p>Pick a template, then add text, name plates, shapes and your scanned elements.</p></div>
            <div className="cp-step"><span>04</span><strong>Save a draft</strong><p>Resume from this browser or download a high-resolution PNG.</p></div>
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
