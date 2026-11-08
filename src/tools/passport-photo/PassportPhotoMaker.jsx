import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Crop, Download, FileText, FlipHorizontal2, Frame, Grid3x3, ImagePlus, LoaderCircle, Maximize2, Palette, Printer, RotateCcw, RotateCw, Ruler, ScanFace, Scissors, Shirt, SlidersHorizontal, Sparkles, Trash2, Upload, Wand2, X, ZoomIn, ZoomOut } from 'lucide-react'
import { preparePhotoFile, removePhotoBackground } from '../poster/template-studio/photo'
import { backgrounds, customPreset, dpiOptions, framePixels, mmToUnit, paperById, papers, passportSizes, sizeById, sizeRegions, sizeUnits, unitToMm } from './sizes'
import { defaultGarmentColors, drawGarment, garmentById, garmentGroups, garmentSwatches, garments, uploadedGarment } from './garments'
import { DEFAULT_ADJUSTMENTS, canvasBlob, coverScale, downloadBlob, drawGuides, drawPhoto, headLines, loadImage } from './render'
import { buildSheet, sheetPlan } from './sheet'
import { buildPdf } from './pdf'
import './PassportPhotoMaker.css'

const STAGES = [
  { id: 1, label: 'Size', note: 'Country preset or your own millimetres', Icon: Frame },
  { id: 2, label: 'Crop', note: 'Fit the face between the guide lines', Icon: Crop },
  { id: 3, label: 'Background', note: 'Remove the backdrop and colour it', Icon: Palette },
  { id: 4, label: 'Clothes', note: 'Built-in suits, or drop your own clothing photo', Icon: Shirt },
  { id: 5, label: 'Print', note: 'Single photo, cut sheet or PDF', Icon: Printer },
]

const ADJUSTMENT_ROWS = [
  { key: 'brightness', label: 'Brightness', min: 60, max: 150, step: 1, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: 60, max: 150, step: 1, unit: '%' },
  { key: 'saturate', label: 'Saturation', min: 0, max: 160, step: 1, unit: '%' },
  { key: 'warmth', label: 'Skin warmth', min: -40, max: 40, step: 1, unit: '' },
  { key: 'gamma', label: 'Exposure', min: -40, max: 40, step: 1, unit: '' },
  { key: 'sharpen', label: 'Detail', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'smooth', label: 'Skin smoothing', min: 0, max: 100, step: 1, unit: '%' },
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round2 = (value) => Math.round(value * 100) / 100

function Slider({ label, value, min, max, step = 1, unit = '', onChange, onReset, hint }) {
  return <label className="pp-slider">
    <span className="pp-slider-head">
      <span>{label}</span>
      <b>{value}{unit}</b>
      {onReset && <button type="button" className="pp-mini" onClick={onReset}>Reset</button>}
    </span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={label} />
    {hint && <em className="pp-hint">{hint}</em>}
  </label>
}

function Switch({ checked, onChange, label, note }) {
  return <button type="button" role="switch" aria-checked={checked} className={`pp-switch ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
    <span className="pp-switch-track"><span className="pp-switch-knob" /></span>
    <span className="pp-switch-copy"><b>{label}</b>{note && <em>{note}</em>}</span>
  </button>
}

/** Small live preview of every garment, painted with the chosen colours. */
function GarmentThumb({ garment, colors, active }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const W = 108
    const H = 128
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = active ? '#e8f5ee' : '#f1f2f4'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#d8ab8c'
    ctx.beginPath()
    ctx.ellipse(W / 2, H * 0.37, W * 0.21, H * 0.27, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3a2b22'
    ctx.beginPath()
    ctx.ellipse(W / 2, H * 0.2, W * 0.23, H * 0.14, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    drawGarment(ctx, garment, { w: W, h: H }, { top: 0.1, bottom: 0.66, eye: 0.4 }, { scale: 1, dx: 0, dy: 0 }, colors)
  }, [garment, colors, active])
  return <canvas className="pp-garment-thumb" ref={ref} aria-hidden="true" />
}

export default function PassportPhotoMaker() {
  const [stage, setStage] = useState(1)
  const [presetId, setPresetId] = useState('35x45')
  const [region, setRegion] = useState('popular')
  const [unit, setUnit] = useState('mm')
  const [dpi, setDpi] = useState(300)
  const [useCustom, setUseCustom] = useState(false)
  const [customMm, setCustomMm] = useState({ w: 35, h: 45 })

  const [crop, setCrop] = useState({ zoom: 1, dx: 0, dy: 0, rotation: 0, mirror: false })
  const [head, setHead] = useState(() => headLines(sizeById('35x45')))
  const [bg, setBg] = useState({ mode: 'original', backgroundId: 'white', tolerance: 30 })
  const [adj, setAdj] = useState(DEFAULT_ADJUSTMENTS)
  const [clothes, setClothes] = useState({ on: false, id: 'suit-tie', scale: 1, dx: 0, dy: 0, colors: defaultGarmentColors })
  const [print, setPrint] = useState({ paperId: '4x6', copies: 8, margin: 8, gap: 2, cutLines: true, quality: 92 })
  const [guidesOn, setGuidesOn] = useState(true)

  const [photo, setPhoto] = useState(null)
  const [cut, setCut] = useState(null)
  const [cloth, setCloth] = useState(null)
  const [clothNeck, setClothNeck] = useState(true)
  const [clothDragging, setClothDragging] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const baseRef = useRef(null)
  const cutRef = useRef(null)
  const photoCanvasRef = useRef(null)
  const guideCanvasRef = useRef(null)
  const stackRef = useRef(null)
  const dragRef = useRef(null)
  const fileRef = useRef(null)
  const clothFileRef = useRef(null)

  const preset = useCustom ? customPreset : sizeById(presetId)
  const frame = useMemo(() => framePixels(preset, dpi, useCustom ? customMm : null), [preset, dpi, useCustom, customMm])
  const bgChoice = useMemo(() => backgroundOf(bg.backgroundId), [bg.backgroundId])
  // An uploaded clothing picture is dressed through the same garment contract, so
  // the existing fit sliders and every export path keep working unchanged.
  const garment = useMemo(
    () => (cloth && clothes.id === 'custom' ? uploadedGarment(cloth.img, { neckOpen: clothNeck }) : garmentById(clothes.id)),
    [cloth, clothes.id, clothNeck],
  )
  const isPxPreset = Boolean(preset.px)
  const isCustom = clothes.id === 'custom' && Boolean(cloth)

  const panLimit = useCallback(() => {
    const source = bg.mode === 'cut' && cutRef.current ? cutRef.current : baseRef.current
    if (!source) return { x: 0, y: 0 }
    const scale = coverScale(source, frame.w, frame.h, crop.rotation) * crop.zoom
    const dw = (source.naturalWidth || source.width) * scale
    const dh = (source.naturalHeight || source.height) * scale
    // Floored, not rounded: a limit rounded up would let the rounded offset sit
    // past the image edge and uncover a strip of the frame.
    const floor2 = (value) => Math.floor(value * 100) / 100
    return { x: floor2(Math.max(0, (dw - frame.w) / (frame.w * 2))), y: floor2(Math.max(0, (dh - frame.h) / (frame.h * 2))) }
  }, [bg.mode, crop.rotation, crop.zoom, frame.h, frame.w])

  const panBy = useCallback((dx, dy) => {
    const pan = panLimit()
    setCrop((current) => ({ ...current, dx: round2(clamp(current.dx + dx, -pan.x, pan.x)), dy: round2(clamp(current.dy + dy, -pan.y, pan.y)) }))
  }, [panLimit])

  const state = useMemo(() => {
    // Dragging must never uncover the frame, so the pan offset is clamped to the
    // overflow the cover fit actually leaves in each axis.
    const pan = panLimit()
    return {
      frame,
      crop: { ...crop, dx: round2(clamp(crop.dx, -pan.x, pan.x)), dy: round2(clamp(crop.dy, -pan.y, pan.y)) },
      bg: { mode: bg.mode, color: bgChoice.color, transparent: bgChoice.color === null },
      adj,
      head,
      clothes: { on: clothes.on, garment, scale: clothes.scale, dx: clothes.dx, dy: clothes.dy, colors: clothes.colors },
      guidesOn,
      baseLoaded: Boolean(photo),
    }
  }, [frame, crop, bg, bgChoice, adj, head, clothes, garment, guidesOn, photo, cut, panLimit])

  const paint = useCallback(() => {
    if (photoCanvasRef.current) drawPhoto(photoCanvasRef.current, state, { base: baseRef.current, cut: cutRef.current })
    if (guideCanvasRef.current) drawGuides(guideCanvasRef.current, state)
  }, [state])

  useEffect(() => { paint() }, [paint])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 5200)
    return () => window.clearTimeout(timer)
  }, [notice])

  // React registers wheel as a passive listener, so zooming needs a native one.
  useEffect(() => {
    const el = stackRef.current
    if (!el) return
    const onWheel = (event) => {
      event.preventDefault()
      setCrop((current) => ({ ...current, zoom: clamp(round2(current.zoom * (1 - event.deltaY * 0.0016)), 0.6, 4) }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [photo])

  const acceptFile = useCallback(async (file) => {
    if (!file) return
    setError('')
    setBusy('Reading the photo')
    try {
      const src = await preparePhotoFile(file, '')
      const img = await loadImage(src)
      baseRef.current = img
      cutRef.current = null
      setCut(null)
      setPhoto({ name: file.name || 'passport-photo', src, width: img.naturalWidth, height: img.naturalHeight })
      setCrop({ zoom: 1, dx: 0, dy: -0.04, rotation: 0, mirror: false })
      setBg((current) => ({ ...current, mode: 'original' }))
      setStage(2)
      setNotice(`Photo loaded at ${img.naturalWidth} × ${img.naturalHeight}px. Drag it inside the ${frame.w} × ${frame.h}px frame.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not read that image.')
    } finally {
      setBusy('')
    }
  }, [frame.w, frame.h])

  const acceptClothFile = useCallback(async (file) => {
    if (!file) return
    setError('')
    setBusy('Reading the clothing photo')
    try {
      const src = await preparePhotoFile(file, '')
      const img = await loadImage(src)
      setCloth({ src, name: file.name || 'clothing photo', img })
      setClothes((current) => ({ ...current, id: 'custom', on: true }))
      setNotice(`Clothing photo ready at ${img.naturalWidth} × ${img.naturalHeight}px. Use the fit sliders to place the neckline under the chin.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not read that clothing photo.')
    } finally {
      setBusy('')
    }
  }, [])

  useEffect(() => {
    const onPaste = (event) => {
      const item = Array.from(event.clipboardData?.items || []).find((entry) => entry.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (file) void acceptFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [acceptFile])

  const onPointerDown = (event) => {
    if (!photo) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, w: event.currentTarget.clientWidth || 1, h: event.currentTarget.clientHeight || 1 }
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = (event.clientX - drag.x) / drag.w
    const dy = (event.clientY - drag.y) / drag.h
    drag.x = event.clientX
    drag.y = event.clientY
    panBy(dx, dy)
  }

  const endDrag = () => { dragRef.current = null }

  const runBackgroundRemoval = async (tolerance = bg.tolerance) => {
    if (!photo) {
      setError('Upload a photo first.')
      return
    }
    setError('')
    setBusy('Removing the background')
    try {
      const src = await removePhotoBackground(photo.src, { apiBase: '', tolerance })
      cutRef.current = await loadImage(src)
      setCut({ src })
      setBg((current) => ({ ...current, mode: 'cut' }))
      setNotice('Background removed. Choose the colour behind the cut-out below.')
    } catch (reason) {
      setBg((current) => ({ ...current, mode: 'original' }))
      setError(reason instanceof Error ? reason.message : 'Could not remove the background.')
    } finally {
      setBusy('')
    }
  }

  const resetAdjustments = () => setAdj(DEFAULT_ADJUSTMENTS)

  const renderOffscreen = useCallback(() => {
    const canvas = document.createElement('canvas')
    drawPhoto(canvas, state, { base: baseRef.current, cut: cutRef.current })
    return canvas
  }, [state])

  const sheets = useCallback((count) => {
    const single = renderOffscreen()
    const list = []
    let remaining = count
    for (let index = 0; index < 60 && remaining > 0; index++) {
      const plan = sheetPlan({ paperId: print.paperId, photoW: frame.w, photoH: frame.h, dpi, margin: print.margin, gap: print.gap, copies: remaining })
      if (!plan.perSheet) break
      list.push(buildSheet(single, plan, { cutLines: print.cutLines }))
      remaining -= plan.perSheet
    }
    return { list, plan: sheetPlan({ paperId: print.paperId, photoW: frame.w, photoH: frame.h, dpi, margin: print.margin, gap: print.gap, copies: count }) }
  }, [dpi, frame.h, frame.w, print.cutLines, print.gap, print.margin, print.paperId, renderOffscreen])

  const requirePhoto = () => {
    if (photo) return true
    setError('Upload a photo first.')
    return false
  }

  const downloadSingle = async (type) => {
    if (!requirePhoto()) return
    let source = renderOffscreen()
    setError('')
    if (type === 'jpg') {
      const flat = document.createElement('canvas')
      flat.width = source.width
      flat.height = source.height
      const ctx = flat.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, flat.width, flat.height)
      ctx.drawImage(source, 0, 0)
      source = flat
    }
    const blob = await canvasBlob(source, type === 'jpg' ? 'image/jpeg' : 'image/png', type === 'jpg' ? print.quality / 100 : undefined)
    if (!blob) {
      setError('Could not create the image file.')
      return
    }
    downloadBlob(blob, `imgmojo-passport-${preset.id}${useCustom ? `-${frame.w}x${frame.h}` : ''}.${type === 'jpg' ? 'jpg' : 'png'}`)
    setNotice(`Saved one ${source.width} × ${source.height}px ${type.toUpperCase()} photo.`)
  }

  const downloadSheets = async (type) => {
    if (!requirePhoto()) return
    const { list, plan } = sheets(print.copies)
    if (!list.length) {
      setError('This photo is larger than the selected paper. Choose a bigger paper size.')
      return
    }
    setError('')
    for (let index = 0; index < list.length; index++) {
      const blob = await canvasBlob(list[index], type === 'jpg' ? 'image/jpeg' : 'image/png', type === 'jpg' ? print.quality / 100 : undefined)
      if (blob) downloadBlob(blob, `imgmojo-passport-sheet${list.length > 1 ? `-${index + 1}` : ''}.${type === 'jpg' ? 'jpg' : 'png'}`)
    }
    setNotice(`Printed ${plan.placed} photo${plan.placed > 1 ? 's' : ''} on ${list.length} ${paperById(print.paperId).label} sheet${list.length > 1 ? 's' : ''}.`)
  }

  const downloadSheetPdf = async () => {
    if (!requirePhoto()) return
    setBusy('Building the PDF')
    try {
      const { list, plan } = sheets(print.copies)
      if (!list.length) throw new Error('This photo is larger than the selected paper. Choose a bigger paper size.')
      const paper = paperById(print.paperId)
      const blob = await buildPdf(list.map((canvas) => ({ canvas, page: { w: paper.w, h: paper.h } })), { quality: print.quality / 100, title: `ImgMojo passport ${preset.label}` })
      downloadBlob(blob, `imgmojo-passport-${preset.id}-${plan.placed}up.pdf`)
      setNotice(`PDF ready: ${list.length} page${list.length > 1 ? 's' : ''}, ${plan.placed} photo${plan.placed > 1 ? 's' : ''} at ${dpi} DPI.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not build the PDF.')
    } finally {
      setBusy('')
    }
  }

  const printSheets = () => {
    if (!requirePhoto()) return
    const { list } = sheets(print.copies)
    if (!list.length) {
      setError('This photo is larger than the selected paper. Choose a bigger paper size.')
      return
    }
    const paper = paperById(print.paperId)
    const frameEl = document.createElement('iframe')
    frameEl.className = 'pp-print-frame'
    document.body.appendChild(frameEl)
    const doc = frameEl.contentWindow?.document
    if (!doc) {
      frameEl.remove()
      setError('The print preview is blocked in this browser.')
      return
    }
    const images = list.map((canvas) => `<img src="${canvas.toDataURL('image/png')}" alt="">`).join('')
    doc.open()
    doc.write(`<!doctype html><html><head><title>ImgMojo passport sheet</title><style>@page{size:${round2(paper.w)}mm ${round2(paper.h)}mm;margin:0}html,body{margin:0;padding:0}img{display:block;width:${round2(paper.w)}mm;height:${round2(paper.h)}mm;page-break-after:always}</style></head><body>${images}</body></html>`)
    doc.close()
    const start = () => {
      frameEl.contentWindow?.focus()
      frameEl.contentWindow?.print()
      window.setTimeout(() => frameEl.remove(), 40000)
    }
    if (doc.readyState === 'complete') window.setTimeout(start, 260)
    else frameEl.onload = () => window.setTimeout(start, 260)
  }

  const plan = sheetPlan({ paperId: print.paperId, photoW: frame.w, photoH: frame.h, dpi, margin: print.margin, gap: print.gap, copies: print.copies })
  const sizesForRegion = passportSizes.filter((item) => item.region === region)
  const customUnit = { w: mmToUnit(customMm.w, unit, dpi), h: mmToUnit(customMm.h, unit, dpi) }

  const customMaxMm = (key) => (key === 'h' ? 297 : 210)
  // Spinner bounds travel with the unit, so they can never disagree with the clamp.
  const customBounds = (maxMm) => ({
    min: mmToUnit(5, unit, dpi),
    max: mmToUnit(maxMm, unit, dpi),
    step: unit === 'px' ? 1 : unit === 'in' ? 0.05 : 0.5,
  })

  const setCustomUnitValue = (key, value) => {
    setCustomMm((current) => ({ ...current, [key]: round2(clamp(unitToMm(value, unit, dpi), 5, customMaxMm(key))) }))
  }

  return <section className="pp-tool" aria-label="Passport photo maker">
    <header className="pp-top">
      <div className="pp-top-copy">
        <span className="pp-kicker"><ScanFace size={13} /> Passport &amp; ID photo</span>
        <h1>Passport Photo Maker</h1>
        <p>Size presets for 40+ countries, face guides, background removal, formal clothes and a print-ready sheet — all in the browser.</p>
      </div>
      <div className="pp-top-actions">
        {photo && <button type="button" className="pp-ghost" onClick={() => fileRef.current?.click()}><ImagePlus size={14} /> Change photo</button>}
        {photo && <button type="button" className="pp-ghost danger" onClick={() => { baseRef.current = null; cutRef.current = null; setPhoto(null); setCut(null); setCloth(null); setStage(1) }}><Trash2 size={14} /> Clear</button>}
      </div>
    </header>

    <nav className="pp-steps" aria-label="Stages">
      {STAGES.map((item) => <button type="button" key={item.id} className={`pp-step ${stage === item.id ? 'is-active' : ''}`} onClick={() => setStage(item.id)}>
        <span className="pp-step-index">{item.id}</span>
        <span className="pp-step-copy"><b><item.Icon size={14} /> {item.label}</b><em>{item.note}</em></span>
      </button>)}
    </nav>

    <div className="pp-body">
      <div className="pp-left">
        <div className={`pp-stage ${dragging ? 'is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void acceptFile(event.dataTransfer?.files?.[0]) }}>
          <input ref={fileRef} id="pp-photo-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="visually-hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void acceptFile(file) }} />
          {!photo
            ? <label className="pp-drop" htmlFor="pp-photo-input">
              <span className="pp-drop-mark"><ImagePlus size={28} /></span>
              <strong>Upload a face photo</strong>
              <span>or drag it here, or paste with Ctrl+V</span>
              <span className="pp-drop-button"><Upload size={14} /> Choose image</span>
              <small>JPG, PNG, WebP or GIF · up to 25 MB · the photo never leaves this device</small>
            </label>
            : <div className="pp-canvas-stack" ref={stackRef} style={{ '--pp-ar': String(round2(frame.w / frame.h)) }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
              <canvas className="pp-photo" ref={photoCanvasRef} width={frame.w} height={frame.h} />
              <canvas className="pp-guides" ref={guideCanvasRef} width={frame.w} height={frame.h} aria-hidden="true" />
              {busy && <span className="pp-busy"><LoaderCircle size={15} className="pp-spin" /> {busy}…</span>}
            </div>}
          <div className="pp-stagebar">
            <span className="pp-readout">{frame.w} × {frame.h}px · {preset.label} @ {isPxPreset ? 'native px' : `${dpi} DPI`}</span>
            <div className="pp-stage-tools">
              <button type="button" className={`pp-chip ${guidesOn ? 'is-on' : ''}`} onClick={() => setGuidesOn((current) => !current)}><Maximize2 size={13} /> {guidesOn ? 'Guides on' : 'Guides off'}</button>
              {photo && <button type="button" className="pp-chip" onClick={() => setCrop({ zoom: 1, dx: 0, dy: 0, rotation: 0, mirror: false })}><RotateCcw size={13} /> Reset crop</button>}
            </div>
          </div>
        </div>

        <div className="pp-compliance">
          <h2><Check size={13} /> {preset.label}</h2>
          <p>{preset.note}</p>
          <ul>
            <li><span>Head size</span><b>{Math.round((head.bottom - head.top) * preset.h * (preset.px ? 0 : 1))} mm of {preset.h} mm</b></li>
            <li><span>Eye line</span><b>{Math.round(head.eye * 100)}% from the top</b></li>
            <li><span>Background</span><b>{bg.mode === 'cut' ? `${bgChoice.label} cut-out` : 'Original photo kept'}</b></li>
            <li><span>Clothes</span><b>{clothes.on ? garment.label : 'As photographed'}</b></li>
          </ul>
        </div>
      </div>

      <div className="pp-panel">
        {error && <p className="editor-error"><X size={14} /> {error}</p>}
        {notice && <p className="menu-manager-message"><Check size={14} /> {notice}</p>}

        {stage === 1 && <div className="pp-block">
          <div className="pp-block-head"><Ruler size={15} /><h2>Choose a size</h2></div>
          <div className="pp-region-row">
            {sizeRegions.map((item) => <button type="button" key={item.id} className={`pp-pill ${region === item.id && !useCustom ? 'is-on' : ''}`} onClick={() => { setRegion(item.id); setUseCustom(false) }}>{item.label}</button>)}
          </div>
          <div className="pp-size-grid">
            {sizesForRegion.map((item) => <button type="button" key={item.id} className={`pp-size ${!useCustom && presetId === item.id ? 'is-on' : ''}`} onClick={() => {
              setPresetId(item.id)
              setUseCustom(false)
              setHead(headLines(item))
              setBg((current) => ({ ...current, backgroundId: item.bg || 'white' }))
              setStage(2)
            }}>
              <b>{item.label}</b>
              <span>{item.note}</span>
              <em>{item.px ? `${item.px.w} × ${item.px.h} px` : `${item.w} × ${item.h} mm`}</em>
            </button>)}
          </div>

          <div className="pp-field">
            <Switch checked={useCustom} onChange={(next) => { setUseCustom(next); if (next) setHead(headLines(customPreset)) }} label="Custom size" note="Set your own width and height" />
          </div>

          {useCustom && <div className="pp-row">
            <label className="pp-input"><span>Width ({sizeUnits.find((item) => item.id === unit)?.label})</span><input type="number" {...customBounds(210)} value={customUnit.w} onChange={(event) => setCustomUnitValue('w', Number(event.target.value) || 0)} /></label>
            <label className="pp-input"><span>Height</span><input type="number" {...customBounds(297)} value={customUnit.h} onChange={(event) => setCustomUnitValue('h', Number(event.target.value) || 0)} /></label>
            <label className="pp-input"><span>Unit</span><select value={unit} onChange={(event) => setUnit(event.target.value)}>{sizeUnits.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          </div>}

          <div className="pp-row">
            <div className="pp-input"><span>Resolution</span>
              <div className="pp-dpi-row">{dpiOptions.map((item) => <button type="button" key={item.id} className={`pp-pill small ${dpi === item.id ? 'is-on' : ''}`} disabled={isPxPreset} onClick={() => setDpi(item.id)} title={item.note}>{item.id}</button>)}</div>
            </div>
          </div>
          {isPxPreset && <p className="pp-hint">This online-upload preset is fixed in pixels, so DPI and custom size do not apply.</p>}
        </div>}

        {stage === 2 && <div className="pp-block">
          <div className="pp-block-head"><Crop size={15} /><h2>Crop &amp; position</h2></div>
          {!photo && <p className="pp-hint">Upload a photo to move it inside the frame.</p>}
          <div className="pp-move-grid">
            {[-1, 1].map((sign) => <button type="button" key={`x${sign}`} className="pp-arrow" disabled={!photo} onClick={() => panBy(sign * 0.03, 0)} aria-label={sign < 0 ? 'Move left' : 'Move right'}><ArrowRight size={15} style={sign < 0 ? { transform: 'rotate(180deg)' } : undefined} /></button>)}
            {[-1, 1].map((sign) => <button type="button" key={`y${sign}`} className="pp-arrow" disabled={!photo} onClick={() => panBy(0, sign * 0.03)} aria-label={sign < 0 ? 'Move up' : 'Move down'}><ArrowRight size={15} style={{ transform: sign < 0 ? 'rotate(-90deg)' : 'rotate(90deg)' }} /></button>)}
          </div>
          <div className="pp-seg">
            <button type="button" className="pp-chip" disabled={!photo} onClick={() => setCrop((c) => ({ ...c, zoom: round2(clamp(c.zoom + 0.05, 0.6, 4)) }))}><ZoomIn size={13} /> Zoom in</button>
            <button type="button" className="pp-chip" disabled={!photo} onClick={() => setCrop((c) => ({ ...c, zoom: round2(clamp(c.zoom - 0.05, 0.6, 4)) }))}><ZoomOut size={13} /> Zoom out</button>
            <button type="button" className="pp-chip" disabled={!photo} onClick={() => setCrop((c) => ({ ...c, rotation: (c.rotation + 360 - 90) % 360 }))}><RotateCcw size={13} /> −90°</button>
            <button type="button" className="pp-chip" disabled={!photo} onClick={() => setCrop((c) => ({ ...c, rotation: (c.rotation + 90) % 360 }))}><RotateCw size={13} /> +90°</button>
            <button type="button" className={`pp-chip ${crop.mirror ? 'is-on' : ''}`} disabled={!photo} onClick={() => setCrop((c) => ({ ...c, mirror: !c.mirror }))}><FlipHorizontal2 size={13} /> Mirror</button>
          </div>
          <Slider label="Zoom" value={crop.zoom} min={0.6} max={4} step={0.01} unit="×" onChange={(value) => setCrop((c) => ({ ...c, zoom: value }))} hint="Drag the photo in the preview, or use the mouse wheel" />
          <Slider label="Fine rotate" value={crop.rotation} min={-20} max={20} step={1} unit="°" onChange={(value) => setCrop((c) => ({ ...c, rotation: value }))} />
          <div className="pp-divider" />
          <h3 className="pp-sub"><SlidersHorizontal size={13} /> Head guide</h3>
          <Slider label="Crown line" value={Math.round(head.top * 100)} min={2} max={40} unit="%" onChange={(value) => setHead((h) => ({ ...h, top: value / 100 }))} />
          <Slider label="Chin line" value={Math.round(head.bottom * 100)} min={40} max={96} unit="%" onChange={(value) => setHead((h) => ({ ...h, bottom: value / 100 }))} />
          <Slider label="Eye line" value={Math.round(head.eye * 100)} min={25} max={65} unit="%" onChange={(value) => setHead((h) => ({ ...h, eye: value / 100 }))} />
          <p className="pp-hint">Line the face up with the blue dashed rules and the red head oval. The guides never print.</p>
        </div>}

        {stage === 3 && <div className="pp-block">
          <div className="pp-block-head"><Palette size={15} /><h2>Background &amp; adjustments</h2></div>
          <div className="pp-mode-row">
            <button type="button" className={`pp-mode ${bg.mode === 'cut' ? 'is-on' : ''}`} disabled={!photo || Boolean(busy)} onClick={() => (cut ? setBg((c) => ({ ...c, mode: 'cut' })) : runBackgroundRemoval())}>
              <Sparkles size={15} /><b>Remove background</b><em>{cut ? 'Cut-out ready' : 'Plain studio backdrop'}</em>
            </button>
            <button type="button" className={`pp-mode ${bg.mode === 'original' ? 'is-on' : ''}`} onClick={() => setBg((c) => ({ ...c, mode: 'original' }))}>
              <ImagePlus size={15} /><b>Keep original</b><em>Nothing removed</em>
            </button>
          </div>

          {bg.mode === 'cut' && <div className="pp-sub-panel">
            <Slider label="Removal strength" value={bg.tolerance} min={10} max={70} unit="" onChange={(value) => setBg((c) => ({ ...c, tolerance: value }))} onReset={() => setBg((c) => ({ ...c, tolerance: 30 }))} hint="Higher removes more of a busy backdrop — re-run to apply" />
            <button type="button" className="pp-chip wide" disabled={Boolean(busy) || !photo} onClick={() => runBackgroundRemoval()}><Wand2 size={13} /> Re-run removal</button>
          </div>}

          <h3 className="pp-sub"><Grid3x3 size={13} /> Backdrop colour</h3>
          <div className="pp-swatch-row">
            {backgrounds.map((item) => <button type="button" key={item.id} className={`pp-swatch ${bg.backgroundId === item.id ? 'is-on' : ''}`} disabled={bg.mode !== 'cut'} title={item.label} onClick={() => setBg((c) => ({ ...c, backgroundId: item.id }))}>
              <span className={item.color ? '' : 'pp-checker'} style={item.color ? { background: item.color } : undefined} />
              <em>{item.label}</em>
            </button>)}
          </div>

          <div className="pp-divider" />
          <h3 className="pp-sub"><SlidersHorizontal size={13} /> Adjustments</h3>
          {ADJUSTMENT_ROWS.map((row) => <Slider key={row.key} label={row.label} value={adj[row.key]} min={row.min} max={row.max} step={row.step} unit={row.unit} onChange={(value) => setAdj((a) => ({ ...a, [row.key]: value }))} />)}
          <div className="pp-seg">
            <button type="button" className={`pp-chip ${adj.grayscale ? 'is-on' : ''}`} onClick={() => setAdj((a) => ({ ...a, grayscale: !a.grayscale }))}>{adj.grayscale ? 'Colour mode' : 'Black & white'}</button>
            <button type="button" className="pp-chip" onClick={resetAdjustments}><RotateCcw size={13} /> Reset all</button>
          </div>
        </div>}

        {stage === 4 && <div className="pp-block">
          <div className="pp-block-head"><Shirt size={15} /><h2>Formal clothes &amp; suits</h2></div>
          <Switch checked={clothes.on} onChange={(next) => setClothes((c) => ({ ...c, on: next }))} label="Wear digital clothing" note="Off shows the clothes as photographed" />
          <div className="pp-garment-groups">
            {garmentGroups.map((group) => <div className="pp-garment-group" key={group}>
              <h3 className="pp-sub">{group}</h3>
              <div className="pp-garment-grid">
                {garments.filter((item) => item.group === group).map((item) => <button type="button" key={item.id} className={`pp-garment ${clothes.id === item.id && clothes.on ? 'is-on' : ''}`} onClick={() => setClothes((c) => ({ ...c, id: item.id, on: true }))}>
                  <GarmentThumb garment={item} colors={clothes.colors} active={clothes.id === item.id && clothes.on} />
                  <em>{item.label}</em>
                </button>)}
              </div>
            </div>)}
          </div>

          <div className={`pp-cloth ${clothDragging ? 'is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setClothDragging(true) }} onDragLeave={() => setClothDragging(false)} onDrop={(event) => { event.preventDefault(); setClothDragging(false); void acceptClothFile(event.dataTransfer?.files?.[0]) }}>
            <input ref={clothFileRef} id="pp-cloth-input" type="file" accept="image/png,image/webp,image/jpeg,image/gif" className="visually-hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void acceptClothFile(file) }} />
            {cloth
              ? <div className="pp-cloth-loaded">
                <img className="pp-cloth-thumb" src={cloth.src} alt={cloth.name} />
                <div className="pp-cloth-info">
                  <b>{cloth.name}</b>
                  <span>{cloth.img.naturalWidth} × {cloth.img.naturalHeight}px{cloth.name.toLowerCase().endsWith('.png') ? '' : ' · a PNG cut-out keeps the edges clean'}</span>
                </div>
                <div className="pp-cloth-actions">
                  <button type="button" className="pp-mini" onClick={() => clothFileRef.current?.click()}><Upload size={12} /> Replace</button>
                  <button type="button" className="pp-mini" onClick={() => { setCloth(null); setClothes((current) => ({ ...current, id: 'suit-tie' })) }}><Trash2 size={12} /> Remove</button>
                </div>
              </div>
              : <label className="pp-cloth-drop" htmlFor="pp-cloth-input">
                <span className="pp-cloth-mark"><Shirt size={17} /></span>
                <strong>Drop or choose your own clothing photo</strong>
                <span>A dress, suit, saree or blouse picture — transparent PNG works best</span>
              </label>}
            {cloth && <Switch checked={clothNeck} onChange={setClothNeck} label="Neck opening" note="Off paints the garment straight over the neckline" />}
            {cloth && clothes.id !== 'custom' && <button type="button" className="pp-chip" onClick={() => setClothes((current) => ({ ...current, id: 'custom', on: true }))}><Shirt size={13} /> Wear my photo</button>}
          </div>

          <h3 className="pp-sub"><SlidersHorizontal size={13} /> Fit</h3>
          <Slider label="Shoulder scale" value={round2(clothes.scale * 100)} min={isCustom ? 30 : 60} max={isCustom ? 320 : 170} unit="%" onChange={(value) => setClothes((c) => ({ ...c, scale: value / 100 }))} />
          <Slider label="Vertical position" value={round2(clothes.dy * 100)} min={isCustom ? -40 : -12} max={isCustom ? 40 : 16} unit="%" onChange={(value) => setClothes((c) => ({ ...c, dy: value / 100 }))} />
          <Slider label="Horizontal nudge" value={round2(clothes.dx * 100)} min={isCustom ? -30 : -12} max={isCustom ? 30 : 12} unit="%" onChange={(value) => setClothes((c) => ({ ...c, dx: value / 100 }))} />
          {isCustom && <p className="pp-hint">Scale sizes the picture across both shoulders, so a head-and-chest clothing photo lands at the neckline on its own.</p>}

          {!isCustom && <div className="pp-divider" />}
          {!isCustom && <h3 className="pp-sub"><Palette size={13} /> Colours</h3>}
          {!isCustom && garment.roles.map((role) => <div className="pp-colour-row" key={role}>
            <span className="pp-colour-name">{role}</span>
            <div className="pp-swatch-row tight">
              {(garmentSwatches[role] || []).map((hex) => <button type="button" key={hex} className={`pp-swatch dot ${clothes.colors[role] === hex ? 'is-on' : ''}`} title={hex} onClick={() => setClothes((c) => ({ ...c, colors: { ...c.colors, [role]: hex } }))}><span style={{ background: hex }} /></button>)}
              <label className="pp-colour-pick" title="Pick any colour">
                <input type="color" value={clothes.colors[role] || '#000000'} onChange={(event) => setClothes((c) => ({ ...c, colors: { ...c.colors, [role]: event.target.value } }))} />
              </label>
            </div>
          </div>)}
          <button type="button" className="pp-chip" onClick={() => setClothes((c) => ({ ...c, colors: defaultGarmentColors, scale: 1, dx: 0, dy: 0 }))}><RotateCcw size={13} /> Reset clothing</button>
        </div>}

        {stage === 5 && <div className="pp-block">
          <div className="pp-block-head"><Printer size={15} /><h2>Print &amp; download</h2></div>
          <div className="pp-out">
            <button type="button" className="pp-primary" disabled={!photo} onClick={() => downloadSingle('jpg')}><Download size={15} /> JPEG photo</button>
            <button type="button" className="pp-secondary" disabled={!photo} onClick={() => downloadSingle('png')}><Download size={15} /> PNG photo</button>
          </div>

          <h3 className="pp-sub"><Grid3x3 size={13} /> Print sheet</h3>
          <div className="pp-swatch-row">
            {papers.map((item) => <button type="button" key={item.id} className={`pp-swatch ${print.paperId === item.id ? 'is-on' : ''}`} onClick={() => setPrint((c) => ({ ...c, paperId: item.id }))}><span className="pp-paper" /><em>{item.label}</em></button>)}
          </div>
          <div className="pp-row">
            <label className="pp-input"><span>Copies</span><input type="number" min="1" max="120" value={print.copies} onChange={(event) => setPrint((c) => ({ ...c, copies: clamp(Number(event.target.value) || 1, 1, 120) }))} /></label>
            <label className="pp-input"><span>Margin mm</span><input type="number" min="0" max="25" value={print.margin} onChange={(event) => setPrint((c) => ({ ...c, margin: clamp(Number(event.target.value) || 0, 0, 25) }))} /></label>
            <label className="pp-input"><span>Gap mm</span><input type="number" min="0" max="15" value={print.gap} onChange={(event) => setPrint((c) => ({ ...c, gap: clamp(Number(event.target.value) || 0, 0, 15) }))} /></label>
          </div>
          <Slider label="JPEG quality" value={print.quality} min={60} max={100} unit="%" onChange={(value) => setPrint((c) => ({ ...c, quality: value }))} />
          <Switch checked={print.cutLines} onChange={(next) => setPrint((c) => ({ ...c, cutLines: next }))} label="Scissor cutting lines" note="Dashed rules and marks around every photo" />
          <p className="pp-hint">{plan.perSheet} photo{plan.perSheet === 1 ? '' : 's'} fit on {paperById(print.paperId).label} at {dpi} DPI · {Math.ceil(print.copies / Math.max(1, plan.perSheet))} sheet{print.copies > plan.perSheet ? 's' : ''} needed</p>

          <div className="pp-out">
            <button type="button" className="pp-primary" disabled={!photo} onClick={() => downloadSheets('jpg')}><Download size={15} /> Sheet JPEG</button>
            <button type="button" className="pp-secondary" disabled={!photo} onClick={() => downloadSheets('png')}><Download size={15} /> Sheet PNG</button>
            <button type="button" className="pp-secondary" disabled={!photo || Boolean(busy)} onClick={downloadSheetPdf}><FileText size={15} /> {busy === 'Building the PDF' ? 'Building…' : 'Sheet PDF'}</button>
            <button type="button" className="pp-secondary" disabled={!photo} onClick={printSheets}><Scissors size={15} /> Print now</button>
          </div>
          <p className="pp-hint"><Check size={12} /> Set the printer to 100% / “actual size” with no scaling, and print on photo paper for the sharpest result.</p>
        </div>}

        <div className="pp-nav">
          <button type="button" className="pp-ghost" disabled={stage === 1} onClick={() => setStage((s) => Math.max(1, s - 1))}>Back</button>
          <span className="pp-nav-count">Stage {stage} of 5</span>
          <button type="button" className="pp-primary small" disabled={stage === 5} onClick={() => setStage((s) => Math.min(5, s + 1))}>Next <ArrowRight size={14} /></button>
        </div>
      </div>
    </div>
  </section>
}

function backgroundOf(id) {
  return backgrounds.find((item) => item.id === id) || backgrounds[0]
}
