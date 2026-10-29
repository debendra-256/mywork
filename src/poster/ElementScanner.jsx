import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, Image as ImageIcon, ImagePlus, Loader2, Plus, ShieldCheck, Trash2, Type } from 'lucide-react'
import { addElement, deleteElement, detectScript, elementNameFromFile, loadElements, maxElements, normalizeSlot, scanElementImage, SLOT_SCRIPTS } from './elements.js'
import './ElementScanner.css'

export default function ElementScanner() {
  const [elements, setElements] = useState(() => loadElements())
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [name, setName] = useState('')
  const [removeBackground, setRemoveBackground] = useState(true)
  const [tolerance, setTolerance] = useState(26)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [slots, setSlots] = useState([])
  const [markKind, setMarkKind] = useState('text')
  const [activeSlotId, setActiveSlotId] = useState(null)
  const [draft, setDraft] = useState(null)
  const runRef = useRef(0)
  const stageRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    if (!file) return undefined
    const run = ++runRef.current
    const timer = setTimeout(async () => {
      setBusy(true)
      setError('')
      try {
        const result = await scanElementImage(file, { removeBackground, tolerance })
        if (runRef.current !== run) return
        setPreview(result)
      } catch (err) {
        if (runRef.current !== run) return
        setPreview(null)
        setError(err?.message || 'Could not scan that image')
      } finally {
        if (runRef.current === run) setBusy(false)
      }
    }, 240)
    return () => clearTimeout(timer)
  }, [file, removeBackground, tolerance])

  const acceptFile = (next) => {
    if (!next) return
    setMessage('')
    setError('')
    setPreview(null)
    setSlots([])
    setActiveSlotId(null)
    setDraft(null)
    setName(elementNameFromFile(next))
    setFile(next)
  }

  const clampPct = (value, min, max) => Math.min(max, Math.max(min, value))
  const pointOf = (event) => {
    const rect = stageRef.current.getBoundingClientRect()
    return {
      x: clampPct(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clampPct(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    }
  }
  const round1 = (value) => Math.round(value * 10) / 10

  const addArea = (rect) => {
    if (slots.length >= 12) return
    const kind = markKind
    const count = slots.filter((slot) => slot.kind === kind).length + 1
    const slot = normalizeSlot({
      id: `sl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      kind,
      label: `${kind === 'text' ? 'Text' : 'Image'} ${count}`,
      x: round1(rect.x),
      y: round1(rect.y),
      w: round1(rect.w),
      h: round1(rect.h),
      text: kind === 'text' ? 'Sample text' : '',
    })
    setSlots((list) => [...list, slot])
    setActiveSlotId(slot.id)
  }

  const addDefaultArea = () => {
    if (slots.length >= 12) return
    const offset = (slots.length % 5) * 11
    addArea({ x: 25, y: 28 + offset, w: 50, h: 13 })
  }

  const onStageDown = (event) => {
    if (event.button !== 0 || !preview) return
    const point = pointOf(event)
    dragRef.current = { mode: 'draw', start: point }
    setActiveSlotId(null)
    setDraft({ x: point.x, y: point.y, w: 0, h: 0 })
    stageRef.current.setPointerCapture(event.pointerId)
  }

  const onSlotDown = (event, slot) => {
    event.stopPropagation()
    if (event.button !== 0) return
    setActiveSlotId(slot.id)
    dragRef.current = {
      mode: 'move',
      start: pointOf(event),
      origin: { x: slot.x, y: slot.y },
      id: slot.id,
    }
    stageRef.current.setPointerCapture(event.pointerId)
  }

  const onResizeDown = (event, slot) => {
    event.stopPropagation()
    if (event.button !== 0) return
    setActiveSlotId(slot.id)
    dragRef.current = {
      mode: 'resize',
      start: pointOf(event),
      origin: { w: slot.w, h: slot.h },
      id: slot.id,
    }
    stageRef.current.setPointerCapture(event.pointerId)
  }

  const onStageMove = (event) => {
    const drag = dragRef.current
    if (!drag) return
    const point = pointOf(event)
    if (drag.mode === 'draw') {
      setDraft({
        x: Math.min(drag.start.x, point.x),
        y: Math.min(drag.start.y, point.y),
        w: Math.abs(point.x - drag.start.x),
        h: Math.abs(point.y - drag.start.y),
      })
      return
    }
    setSlots((list) => list.map((slot) => {
      if (slot.id !== drag.id) return slot
      if (drag.mode === 'move') {
        return {
          ...slot,
          x: round1(clampPct(drag.origin.x + point.x - drag.start.x, 0, 100 - slot.w)),
          y: round1(clampPct(drag.origin.y + point.y - drag.start.y, 0, 100 - slot.h)),
        }
      }
      return {
        ...slot,
        w: round1(clampPct(drag.origin.w + point.x - drag.start.x, 3, 100 - slot.x)),
        h: round1(clampPct(drag.origin.h + point.y - drag.start.y, 3, 100 - slot.y)),
      }
    }))
  }

  const onStageUp = (event) => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    if (drag.mode !== 'draw') return
    setDraft(null)
    const point = pointOf(event)
    const rect = {
      x: Math.min(drag.start.x, point.x),
      y: Math.min(drag.start.y, point.y),
      w: Math.abs(point.x - drag.start.x),
      h: Math.abs(point.y - drag.start.y),
    }
    if (rect.w >= 3 && rect.h >= 3) addArea(rect)
  }

  const updateSlot = (id, patch) => {
    setSlots((list) => list.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)))
  }

  const setSlotKind = (id, kind) => {
    updateSlot(id, kind === 'text' ? { kind, text: 'Sample text' } : { kind, text: '' })
  }

  const removeSlot = (id) => {
    setSlots((list) => list.filter((slot) => slot.id !== id))
    setActiveSlotId((current) => (current === id ? null : current))
  }

  const save = (event) => {
    event.preventDefault()
    if (!preview || !name.trim()) return
    try {
      setElements(addElement({
        name,
        src: preview.src,
        aspect: preview.aspect,
        width: preview.width,
        height: preview.height,
        slots,
      }))
      runRef.current += 1
      setFile(null)
      setPreview(null)
      setSlots([])
      setActiveSlotId(null)
      setName('')
      setBusy(false)
      setMessage('Saved — it now appears under Add elements in the poster editor.')
    } catch (err) {
      setError(err?.message || 'Could not save that element')
    }
  }

  const remove = (item) => {
    try {
      setElements(deleteElement(item.id))
      setMessage(`“${item.name}” removed from the poster editor.`)
    } catch (err) {
      setError(err?.message || 'Could not delete that element')
    }
  }

  const full = elements.length >= maxElements

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">PROMPTSEEN / POSTER ELEMENTS</span>
          <h1>Element scanner</h1>
          <p>Upload an image of an element, then mark which parts can be edited later — text areas and image areas.</p>
        </div>
        <Link to="/poster" className="admin-secondary"><ArrowUpRight size={15} /> Open Create Poster</Link>
      </div>
      <div className="menu-manager-notice">
        <ShieldCheck size={16} />
        <span>Scanned elements are saved in this browser and appear under <strong>Add elements</strong> in the Create Poster editor. Up to {maxElements} elements can be stored.</span>
      </div>

      <div className="es-workbench">
        <section className="editor-panel">
          <div className="editor-panel-heading">
            <div><span className="admin-kicker">NEW ELEMENT</span><h2>Scan an image</h2></div>
            <span className="es-counter">{elements.length} / {maxElements}</span>
          </div>

          <label
            className={`es-drop${dragging ? ' is-dragging' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              acceptFile(event.dataTransfer.files?.[0] ?? null)
            }}
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                acceptFile(event.target.files?.[0] ?? null)
                event.target.value = ''
              }}
            />
            <span className="es-drop-icon">
              {busy ? <Loader2 size={22} className="es-spin" /> : preview ? <Check size={22} /> : <ImagePlus size={22} />}
            </span>
            <strong>
              {busy ? 'Scanning…' : preview ? (file?.name || 'Image ready') : 'Drop an element image or click to choose'}
            </strong>
            <small>PNG, JPG, WebP or GIF · transparent PNG works best · up to 20 MB</small>
          </label>

          <div className="es-options">
            <label className="es-switch">
              <input type="checkbox" checked={removeBackground} onChange={(event) => setRemoveBackground(event.target.checked)} />
              <span>
                <strong>Cut out the plain background</strong>
                <small>Makes a flat backdrop transparent and trims empty edges.</small>
              </span>
            </label>
            {removeBackground && (
              <label className="es-tolerance">
                <span>Background tolerance <b>{tolerance}</b></span>
                <input type="range" min={8} max={60} step={1} value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} />
              </label>
            )}
          </div>

          {preview && (
            <div className="es-preview">
              <span className="es-preview-stage"><img src={preview.src} alt={`${name || 'Element'} preview`} /></span>
              <span className="es-preview-meta">
                <strong>{name || 'Scanned element'}</strong>
                <small>
                  {preview.width} × {preview.height} px · {preview.backgroundRemoved ? 'background cut out' : 'original framing'}
                </small>
              </span>
            </div>
          )}

          {preview && (
            <div className="es-area-editor">
              <div className="es-area-head">
                <div>
                  <span className="admin-kicker">EDITABLE AREAS</span>
                  <strong>Mark what can change</strong>
                </div>
                <div className="es-kind-toggle" role="group" aria-label="Area type">
                  <button type="button" className={markKind === 'text' ? 'is-active' : ''} onClick={() => setMarkKind('text')}>
                    <Type size={12} /> Text
                  </button>
                  <button type="button" className={markKind === 'image' ? 'is-active' : ''} onClick={() => setMarkKind('image')}>
                    <ImageIcon size={12} /> Image
                  </button>
                </div>
              </div>
              <p className="es-area-hint">
                Drag on the element to mark a part. Text areas become editable text in the font and language you pick; image areas take a photo, and its background can be removed later in the editor.
              </p>
              <div className="es-area-frame">
                <div
                  className="es-area-stage"
                  ref={stageRef}
                  onPointerDown={onStageDown}
                  onPointerMove={onStageMove}
                  onPointerUp={onStageUp}
                  onPointerCancel={onStageUp}
                >
                  <img src={preview.src} alt="" draggable={false} />
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      data-slot={slot.id}
                      className={`es-area es-area--${slot.kind}${slot.id === activeSlotId ? ' is-active' : ''}`}
                      style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }}
                      onPointerDown={(event) => onSlotDown(event, slot)}
                    >
                      <span className="es-area-tag"><b>{slot.kind === 'text' ? 'T' : 'IMG'}</b>{slot.label}</span>
                      {slot.id === activeSlotId && (
                        <span className="es-area-handle" title="Drag to resize" onPointerDown={(event) => onResizeDown(event, slot)} />
                      )}
                    </div>
                  ))}
                  {draft && (
                    <span
                      className={`es-area es-area--${markKind} is-draft`}
                      style={{ left: `${draft.x}%`, top: `${draft.y}%`, width: `${draft.w}%`, height: `${draft.h}%` }}
                    />
                  )}
                </div>
              </div>
              {slots.length > 0 ? (
                <div className="es-area-list">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`es-area-row${slot.id === activeSlotId ? ' is-active' : ''}`}
                      onPointerDown={() => setActiveSlotId(slot.id)}
                    >
                      <span className={`es-area-dot es-area-dot--${slot.kind}`} />
                      <input
                        className="es-area-name"
                        value={slot.label}
                        onChange={(event) => updateSlot(slot.id, { label: event.target.value })}
                        maxLength={40}
                        aria-label="Area label"
                      />
                      <div className="es-kind-toggle es-kind-toggle--mini" role="group" aria-label={`${slot.label} type`}>
                        <button type="button" className={slot.kind === 'text' ? 'is-active' : ''} onClick={() => setSlotKind(slot.id, 'text')} title="Editable text">
                          <Type size={11} />
                        </button>
                        <button type="button" className={slot.kind === 'image' ? 'is-active' : ''} onClick={() => setSlotKind(slot.id, 'image')} title="Replaceable image">
                          <ImageIcon size={11} />
                        </button>
                      </div>
                      <button type="button" className="es-delete" onClick={() => removeSlot(slot.id)} aria-label={`Delete ${slot.label}`}>
                        <Trash2 size={14} />
                      </button>
                      {slot.kind === 'text' && (
                        <div className="es-area-options">
                          <input
                            className="es-area-sample"
                            value={slot.text}
                            onChange={(event) => {
                              const text = event.target.value
                              const patch = { text }
                              if (slot.script === 'latin') {
                                const detected = detectScript(text)
                                if (detected !== 'latin') patch.script = detected
                              }
                              updateSlot(slot.id, patch)
                            }}
                            maxLength={120}
                            placeholder="Text shown in this area"
                            aria-label={`${slot.label} sample text`}
                          />
                          <select
                            className="es-area-select"
                            value={slot.font}
                            onChange={(event) => updateSlot(slot.id, { font: event.target.value })}
                            aria-label={`${slot.label} font`}
                            title="Font used for this area"
                          >
                            <option value="sans">Sans font</option>
                            <option value="serif">Serif font</option>
                            <option value="display">Display font</option>
                          </select>
                          <select
                            className="es-area-select"
                            value={slot.script}
                            onChange={(event) => updateSlot(slot.id, { script: event.target.value })}
                            aria-label={`${slot.label} language`}
                            title="Language allowed in this area"
                          >
                            {SLOT_SCRIPTS.map((item) => (
                              <option key={item.id} value={item.id}>{item.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="es-area-empty">No areas marked yet — the element will be placed as a fixed image.</p>
              )}
              <div className="es-area-actions">
                <button type="button" className="admin-secondary" onClick={addDefaultArea} disabled={slots.length >= 12}>
                  <Plus size={13} /> Add {markKind} area
                </button>
                <span className="es-area-count">
                  {slots.filter((slot) => slot.kind === 'text').length} text · {slots.filter((slot) => slot.kind === 'image').length} image
                </span>
              </div>
            </div>
          )}

          <form className="es-save" onSubmit={save}>
            <label className="editor-field">
              Element name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
                placeholder="e.g. Golden laurel"
                required
              />
            </label>
            <button className="admin-primary" type="submit" disabled={!preview || busy || !name.trim() || full}>
              <Plus size={15} /> Save to Add elements
            </button>
            {full && <p className="es-note">The library is full. Delete an element below to scan another.</p>}
          </form>

          {error && <p className="editor-error" role="alert">{error}</p>}
          {message && <p className="es-message" role="status"><Check size={14} />{message}</p>}
        </section>

        <section className="admin-table-card">
          <div className="admin-table-head">
            <div>
              <span className="admin-kicker">SAVED ELEMENTS</span>
              <h2>{elements.length} of {maxElements}</h2>
            </div>
          </div>
          {elements.length ? (
            <div className="es-list">
              {elements.map((item) => (
                <div className="es-item" key={item.id}>
                  <span className="es-thumb"><img src={item.src} alt="" /></span>
                  <span className="es-item-copy">
                    <strong>{item.name}</strong>
                    <small>
                      {item.width} × {item.height} px
                      {item.slots?.length ? ` · ${item.slots.length} editable ${item.slots.length === 1 ? 'area' : 'areas'}` : ' · fixed image'}
                    </small>
                  </span>
                  <button type="button" className="es-delete" title={`Delete ${item.name}`} onClick={() => remove(item)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="es-empty">
              <ImagePlus size={22} />
              <p>No scanned elements yet.</p>
              <small>Your first scan will appear here and in the poster editor’s Add elements panel.</small>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
