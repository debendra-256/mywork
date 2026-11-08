import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Droplets, Eraser, ImagePlus, LoaderCircle, Paintbrush, RotateCcw, ShieldCheck, Trash2, Undo2, Upload, Wand2, X } from 'lucide-react'
import { ENGINE_DEFAULTS } from './engine'
import './WatermarkRemover.css'

const MAX_EDGE = 1400
const MAX_FILE_BYTES = 25 * 1024 * 1024
const MAX_UNDO = 5
const IMAGE_TYPES = /^image\/(jpeg|png|webp)$/i

function maskHasPixels(imageData) {
  const data = imageData.data
  for (let index = 3; index < data.length; index += 4) if (data[index] > 8) return true
  return false
}

function drawMaskStroke(context, from, to, width, erasing) {
  context.save()
  context.globalCompositeOperation = erasing ? 'destination-out' : 'source-over'
  context.fillStyle = '#818cf8'
  context.strokeStyle = '#818cf8'
  context.lineWidth = Math.max(1, width)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.beginPath()
  context.moveTo(from.x, from.y)
  context.lineTo(to.x, to.y)
  context.stroke()
  context.beginPath()
  context.arc(to.x, to.y, Math.max(0.5, width / 2), 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function downloadName(name) {
  const base = String(name || 'photo').replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48)
  return `${base || 'photo'}-no-watermark.png`
}

export default function WatermarkRemover() {
  const [image, setImage] = useState(null)
  const [mode, setMode] = useState('empty')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [brushSize, setBrushSize] = useState(42)
  const [erasing, setErasing] = useState(false)
  const [hasMask, setHasMask] = useState(false)
  const [undoDepth, setUndoDepth] = useState(0)
  const [showOriginal, setShowOriginal] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Engine settings
  const [quality, setQuality] = useState(ENGINE_DEFAULTS.quality)
  const [strength, setStrength] = useState(ENGINE_DEFAULTS.strength)
  const [feather, setFeather] = useState(ENGINE_DEFAULTS.feather)

  const displayRef = useRef(null)
  const workerRef = useRef(null)
  const sourceRef = useRef(null)
  const maskRef = useRef(null)
  const resultRef = useRef(null)
  const strokeRef = useRef(null)
  const undoRef = useRef([])

  const paint = useCallback(() => {
    const canvas = displayRef.current
    const source = sourceRef.current
    if (!canvas || !source) return
    const context = canvas.getContext('2d')
    if (canvas.width !== source.width || canvas.height !== source.height) {
      canvas.width = source.width
      canvas.height = source.height
    }
    const base = mode === 'result' && !showOriginal && resultRef.current ? resultRef.current : source
    context.putImageData(base, 0, 0)
    if (mode !== 'result' && maskRef.current) {
      context.globalAlpha = 0.55
      context.drawImage(maskRef.current, 0, 0)
      context.globalAlpha = 1
    }
  }, [mode, showOriginal])

  useEffect(() => { paint() }, [paint, image])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => () => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  const cancelWork = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    setBusy(false)
    setStage('')
    setProgress(0)
  }, [])

  const cancelRemoval = () => {
    if (!busy) return
    cancelWork()
    setNotice('Removal cancelled.')
  }

  useEffect(() => {
    if (!busy) return
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelRemoval()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, cancelWork])

  const loadFile = useCallback(async (file) => {
    if (!file) return
    setError('')
    setNotice('')
    if (!IMAGE_TYPES.test(file.type)) {
      setError('Use a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Keep the image under 25 MB.')
      return
    }
    cancelWork()
    try {
      const bitmap = await createImageBitmap(file)
      try {
        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
        const width = Math.max(1, Math.round(bitmap.width * scale))
        const height = Math.max(1, Math.round(bitmap.height * scale))
        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = width
        sourceCanvas.height = height
        const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
        sourceContext.imageSmoothingQuality = 'high'
        sourceContext.drawImage(bitmap, 0, 0, width, height)
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = width
        maskCanvas.height = height
        maskCanvas.getContext('2d', { willReadFrequently: true })
        sourceRef.current = sourceContext.getImageData(0, 0, width, height)
        maskRef.current = maskCanvas
        resultRef.current = null
        undoRef.current = []
        strokeRef.current = null
        setUndoDepth(0)
        setHasMask(false)
        setShowOriginal(false)
        setProgress(0)
        setStage('')
        setImage({ name: file.name || 'Pasted photo', width, height, originalWidth: bitmap.width, originalHeight: bitmap.height })
        setMode('edit')
      } finally {
        bitmap.close?.()
      }
    } catch {
      setError('That image could not be opened. Try a different file.')
    }
  }, [cancelWork])

  useEffect(() => {
    const onPaste = (event) => {
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (!item.type?.startsWith('image/')) continue
        const file = item.getAsFile()
        if (file) {
          event.preventDefault()
          void loadFile(file)
        }
        return
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [loadFile])

  const newPhoto = () => {
    cancelWork()
    sourceRef.current = null
    maskRef.current = null
    resultRef.current = null
    undoRef.current = []
    strokeRef.current = null
    setImage(null)
    setMode('empty')
    setHasMask(false)
    setUndoDepth(0)
    setShowOriginal(false)
    setNotice('')
    setError('')
    setCursor(null)
  }

  const startOver = () => {
    cancelWork()
    resultRef.current = null
    undoRef.current = []
    setUndoDepth(0)
    setHasMask(false)
    setShowOriginal(false)
    setMode('edit')
    setNotice('')
    setError('')
    const maskCanvas = maskRef.current
    maskCanvas?.getContext('2d')?.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    paint()
  }

  const editMask = () => {
    setShowOriginal(false)
    setMode('edit')
    setNotice('')
    paint()
  }

  const continueOnResult = () => {
    const result = resultRef.current
    if (!result) return
    sourceRef.current = new ImageData(new Uint8ClampedArray(result.data), result.width, result.height)
    resultRef.current = null
    const maskCanvas = maskRef.current
    maskCanvas?.getContext('2d')?.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    undoRef.current = []
    setUndoDepth(0)
    setHasMask(false)
    setShowOriginal(false)
    setMode('edit')
    setNotice('Paint the next watermark on the cleaned photo.')
  }

  const pointFromEvent = (event) => {
    const canvas = displayRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
      scale: canvas.width / rect.width,
    }
  }

  const startStroke = (event) => {
    if (mode !== 'edit' || busy) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const canvas = displayRef.current
    const maskCanvas = maskRef.current
    if (!canvas || !maskCanvas) return
    event.preventDefault()
    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      /* Synthetic pointers may not support capture. */
    }
    const point = pointFromEvent(event)
    const context = maskCanvas.getContext('2d')
    undoRef.current = [...undoRef.current.slice(-(MAX_UNDO - 1)), context.getImageData(0, 0, maskCanvas.width, maskCanvas.height)]
    setUndoDepth(undoRef.current.length)
    strokeRef.current = { last: point, erasing }
    drawMaskStroke(context, point, point, brushSize * point.scale, erasing)
    setHasMask(true)
    paint()
  }

  const moveStroke = (event) => {
    const canvas = displayRef.current
    if (event.pointerType === 'mouse' && canvas) {
      const rect = canvas.getBoundingClientRect()
      setCursor({ x: event.clientX - rect.left, y: event.clientY - rect.top, scale: rect.width / canvas.width })
    }
    const stroke = strokeRef.current
    if (!stroke) return
    const point = pointFromEvent(event)
    const maskCanvas = maskRef.current
    if (!maskCanvas) return
    drawMaskStroke(maskCanvas.getContext('2d'), stroke.last, point, brushSize * point.scale, stroke.erasing)
    stroke.last = point
    paint()
  }

  const endStroke = (event) => {
    if (!strokeRef.current) return
    strokeRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* Capture is released automatically. */
    }
    const maskCanvas = maskRef.current
    if (!maskCanvas) return
    setHasMask(maskHasPixels(maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height)))
  }

  const undoMask = () => {
    const maskCanvas = maskRef.current
    if (!maskCanvas || !undoRef.current.length) return
    const previous = undoRef.current.pop()
    maskCanvas.getContext('2d').putImageData(previous, 0, 0)
    setUndoDepth(undoRef.current.length)
    setHasMask(maskHasPixels(previous))
    paint()
  }

  const clearMask = () => {
    const maskCanvas = maskRef.current
    if (!maskCanvas) return
    const context = maskCanvas.getContext('2d')
    undoRef.current = [...undoRef.current.slice(-(MAX_UNDO - 1)), context.getImageData(0, 0, maskCanvas.width, maskCanvas.height)]
    setUndoDepth(undoRef.current.length)
    context.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    setHasMask(false)
    setError('')
    paint()
  }

  const removeWatermark = () => {
    const source = sourceRef.current
    const maskCanvas = maskRef.current
    if (!source || !maskCanvas || busy) return
    const maskData = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height).data
    const mask = new Uint8Array(source.width * source.height)
    let painted = 0
    for (let index = 0; index < mask.length; index += 1) {
      if (maskData[index * 4 + 3] > 8) {
        mask[index] = 1
        painted += 1
      }
    }
    if (painted < 12) {
      setError('Paint over the watermark you want to remove first.')
      return
    }
    if (painted > mask.length * 0.9) {
      setError('The painted area covers almost the whole photo. Paint only over the watermark.')
      return
    }
    setError('')
    setNotice('')
    setBusy(true)
    setProgress(0)
    setStage('Preparing the photo')
    setShowOriginal(false)

    const worker = new Worker(new URL('./watermark.worker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event) => {
      const message = event.data
      if (message.type === 'progress') {
        setProgress(Math.max(0, Math.min(1, message.value)))
        setStage(message.label || 'Removing watermark')
      } else if (message.type === 'done') {
        resultRef.current = new ImageData(new Uint8ClampedArray(message.rgba), message.width, message.height)
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
        setBusy(false)
        setProgress(1)
        setStage('Done')
        setMode('result')
        setNotice('Watermark removed. Hold "Compare" to check the original, or download the PNG.')
      } else if (message.type === 'error') {
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
        setBusy(false)
        setStage('')
        setError(message.message || 'Could not remove the watermark. Try a smaller painted area.')
      }
    }
    worker.onerror = () => {
      worker.terminate()
      if (workerRef.current === worker) workerRef.current = null
      setBusy(false)
      setStage('')
      setError('The removal engine stopped unexpectedly. Try again with a smaller painted area.')
    }

    const pixels = new Uint8ClampedArray(source.data)
    worker.postMessage({
      type: 'run',
      width: source.width,
      height: source.height,
      rgba: pixels.buffer,
      mask: mask.buffer,
      quality,
      strength,
      feather,
      passes: ENGINE_DEFAULTS.passes,
      patchRadius: ENGINE_DEFAULTS.patchRadius,
    }, [pixels.buffer, mask.buffer])
  }

  const downloadPng = () => {
    const result = resultRef.current
    if (!result) return
    const canvas = document.createElement('canvas')
    canvas.width = result.width
    canvas.height = result.height
    canvas.getContext('2d').putImageData(result, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Could not create the PNG.')
        return
      }
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = downloadName(image?.name)
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(link.href), 4000)
      setNotice(`Saved ${result.width} × ${result.height}px PNG.`)
    }, 'image/png')
  }

  const compareStart = () => setShowOriginal(true)
  const compareEnd = () => setShowOriginal(false)

  const onFileInput = (event) => {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ''
    if (file) void loadFile(file)
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    if (busy) return
    const file = event.dataTransfer?.files?.[0]
    if (file) void loadFile(file)
  }

  const onDragOver = (event) => {
    event.preventDefault()
    if (!busy) setDragging(true)
  }

  const onDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
  }

  const processing = busy ? 'processing' : mode
  const scaledDown = image ? Math.max(image.originalWidth, image.originalHeight) > MAX_EDGE : false

  return <section className="wm-tool" aria-label="Remove watermark from an image">
    <header className="wm-topbar">
      <div className="wm-brand">
        <span className="wm-brand-mark"><Droplets size={17} /></span>
        <div>
          <h1>Watermark Remover</h1>
          <p>Paint over the watermark. The area is rebuilt from the surrounding photo.</p>
        </div>
      </div>
      <div className="wm-top-actions">
        {image && <button className="wm-ghost" type="button" onClick={newPhoto} disabled={busy}><ImagePlus size={14} /> New photo</button>}
        {busy
          ? <button className="wm-ghost" type="button" onClick={cancelRemoval}><X size={14} /> Cancel</button>
          : mode === 'result'
            ? <button className="wm-primary" type="button" onClick={downloadPng}><Download size={15} /> Download PNG</button>
            : <button className="wm-primary" type="button" onClick={removeWatermark} disabled={!hasMask || !image}><Wand2 size={15} /> Remove watermark</button>}
      </div>
    </header>

    <div className="wm-body">
      <div className={`wm-workspace ${dragging ? 'is-dragging' : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {!image
          ? <label className={`wm-drop ${dragging ? 'is-dragging' : ''}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileInput} hidden />
            <span className="wm-drop-mark"><ImagePlus size={30} /></span>
            <strong>Upload from PC or Mobile</strong>
            <span>or drag a photo here, or paste one with Ctrl+V</span>
            <span className="wm-drop-button"><Upload size={14} /> Choose image</span>
            <small>JPG, PNG, or WebP · up to 25 MB · nothing leaves this device</small>
          </label>
          : <>
            <div className="wm-stage-bar">
              {mode === 'result'
                ? <>
                  <span className="wm-result-badge"><Wand2 size={13} /> Watermark removed</span>
                  <div className="wm-stage-actions">
                    <button className="wm-chip" type="button" onPointerDown={compareStart} onPointerUp={compareEnd} onPointerLeave={compareEnd} onPointerCancel={compareEnd} disabled={busy}>Hold to compare</button>
                    <button className="wm-chip" type="button" onClick={editMask} disabled={busy}><Eraser size={13} /> Edit mask</button>
                  </div>
                </>
                : <>
                  <div className="wm-segmented" role="group" aria-label="Brush mode">
                    <button type="button" className={erasing ? '' : 'is-active'} onClick={() => setErasing(false)}><Paintbrush size={13} /> Brush</button>
                    <button type="button" className={erasing ? 'is-active' : ''} onClick={() => setErasing(true)}><Eraser size={13} /> Eraser</button>
                  </div>
                  <label className="wm-size">
                    <span>Size</span>
                    <input type="range" min="12" max="140" step="2" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} aria-label="Brush size" />
                    <span className="wm-size-value">{brushSize}px</span>
                  </label>
                  <div className="wm-stage-actions">
                    <button className="wm-chip" type="button" onClick={undoMask} disabled={!undoDepth || busy}><Undo2 size={13} /> Undo</button>
                    <button className="wm-chip danger" type="button" onClick={clearMask} disabled={!hasMask || busy}><Trash2 size={13} /> Clear</button>
                  </div>
                </>}
            </div>

            <div className="wm-canvas-wrap">
              <div className="wm-canvas-frame">
                <canvas
                  ref={displayRef}
                  className={`wm-canvas ${mode === 'edit' && !busy ? 'is-painting' : ''}`}
                  width={image.width}
                  height={image.height}
                  aria-label="Photo with watermark"
                  onPointerDown={startStroke}
                  onPointerMove={moveStroke}
                  onPointerUp={endStroke}
                  onPointerCancel={endStroke}
                  onPointerLeave={() => setCursor(null)}
                  onDragStart={(event) => event.preventDefault()}
                />
                {cursor && mode === 'edit' && !busy && <span className="wm-brush-ring" style={{ left: cursor.x, top: cursor.y, width: brushSize * (cursor.scale || 1), height: brushSize * (cursor.scale || 1), borderStyle: erasing ? 'dashed' : 'solid' }} />}
                {busy && <div className="wm-busy" role="status" aria-live="polite">
                  <LoaderCircle size={26} className="wm-spin" />
                  <strong>{stage || 'Removing the watermark…'}</strong>
                  <div className="wm-progress"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
                  <small>{Math.round(progress * 100)}%</small>
                  <button className="wm-busy-cancel" type="button" onClick={cancelRemoval}><X size={13} /> Cancel</button>
                </div>}
              </div>
            </div>

            <p className="wm-hint">{mode === 'result' ? 'Compare with the original, edit the mask, or download the PNG.' : 'Brush over the watermark. Cover it completely, then press Remove watermark.'}</p>
          </>}
        {notice && <p className="wm-notice" role="status">{notice}</p>}
        {error && <p className="wm-error" role="alert">{error}</p>}
      </div>

      <aside className="wm-sidebar">
        <section className="wm-panel">
          <div className="wm-panel-head"><h2>How it works</h2><span>{processing === 'processing' ? 'Working' : 'On-device'}</span></div>
          <ol className="wm-steps">
            <li className={image ? 'is-done' : ''}><b>1</b><div><strong>Upload a photo</strong><small>Drop it, paste it, or browse.</small></div></li>
            <li className={hasMask ? 'is-done' : ''}><b>2</b><div><strong>Paint over the watermark</strong><small>Cover text, logos, or stamps completely.</small></div></li>
            <li className={mode === 'result' ? 'is-done' : ''}><b>3</b><div><strong>Remove and download</strong><small>Surrounding texture fills the gap.</small></div></li>
          </ol>
        </section>

        <section className="wm-panel">
          <div className="wm-panel-head"><h2>Settings</h2><span>{quality === 'detailed' ? 'High quality' : 'Fast mode'}</span></div>
          <div className="wm-setting">
            <label>Quality
              <select value={quality} onChange={(event) => setQuality(event.target.value)} disabled={busy}>
                <option value="fast">Fast</option>
                <option value="detailed">Detailed</option>
              </select>
            </label>
          </div>
          <div className="wm-setting">
            <label>Strength
              <input type="range" min="0.1" max="1" step="0.05" value={strength} onChange={(event) => setStrength(Number(event.target.value))} disabled={busy} aria-label="Removal strength" />
              <span className="wm-setting-value">{Math.round(strength * 100)}%</span>
            </label>
          </div>
          <div className="wm-setting">
            <label>Feather
              <input type="range" min="0" max="12" step="1" value={feather} onChange={(event) => setFeather(Number(event.target.value))} disabled={busy} aria-label="Edge feather" />
              <span className="wm-setting-value">{feather}px</span>
            </label>
          </div>
          <p>Lower strength for semi-transparent watermarks. Increase feather for smoother edges.</p>
        </section>

        {image && <section className="wm-panel">
          <div className="wm-panel-head"><h2>Photo</h2><span>{image.width} × {image.height}</span></div>
          <p className="wm-file" title={image.name}>{image.name}</p>
          {scaledDown && <p className="wm-note">Large photos are processed at up to {MAX_EDGE}px so removal stays quick.</p>}
        </section>}

        {mode === 'result' && <section className="wm-panel">
          <div className="wm-panel-head"><h2>Export</h2><span>PNG</span></div>
          <button type="button" className="wm-primary wide" onClick={downloadPng}><Download size={15} /> Download PNG</button>
          <div className="wm-export-row">
            <button type="button" onClick={editMask}><Eraser size={14} /> Edit mask</button>
            <button type="button" onClick={startOver}><RotateCcw size={14} /> Start over</button>
          </div>
          <button type="button" className="wm-chip wide" onClick={continueOnResult}><Wand2 size={13} /> Remove another</button>
          <p>Saved at {image?.width} × {image?.height}px. Transparency in the original is kept.</p>
        </section>}

        <p className="wm-privacy"><ShieldCheck size={14} /> Your photo never leaves this browser tab.</p>
      </aside>
    </div>
  </section>
}
