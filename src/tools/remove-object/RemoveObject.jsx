import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Eraser, ImagePlus, LoaderCircle, Paintbrush, RotateCcw, ShieldCheck, Trash2, Undo2, Upload, Wand2 } from 'lucide-react'
import './RemoveObject.css'

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
  context.fillStyle = '#eb4034'
  context.strokeStyle = '#eb4034'
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
  return `${base || 'photo'}-no-object.png`
}

export default function RemoveObject() {
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
  }, [])

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

  const removeObject = () => {
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
      setError('Paint over the object you want to remove first.')
      return
    }
    if (painted > mask.length * 0.9) {
      setError('The painted area covers almost the whole photo. Leave some background visible.')
      return
    }
    setError('')
    setNotice('')
    setBusy(true)
    setProgress(0)
    setStage('Preparing the photo')
    setShowOriginal(false)

    const worker = new Worker(new URL('./inpainting.worker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event) => {
      const message = event.data
      if (message.type === 'progress') {
        setProgress(Math.max(0, Math.min(1, message.value)))
        setStage(message.label || 'Removing the object')
      } else if (message.type === 'done') {
        resultRef.current = new ImageData(new Uint8ClampedArray(message.rgba), message.width, message.height)
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
        setBusy(false)
        setProgress(1)
        setStage('Done')
        setMode('result')
        setNotice('Object removed. Hold “Compare” to check the original, or download the PNG.')
      } else if (message.type === 'error') {
        worker.terminate()
        if (workerRef.current === worker) workerRef.current = null
        setBusy(false)
        setStage('')
        setError(message.message || 'Could not remove the object. Try a smaller painted area.')
      }
    }
    worker.onerror = () => {
      worker.terminate()
      if (workerRef.current === worker) workerRef.current = null
      setBusy(false)
      setStage('')
      setError('The retouch engine stopped unexpectedly. Try again with a smaller painted area.')
    }

    const pixels = new Uint8ClampedArray(source.data)
    worker.postMessage({ type: 'run', width: source.width, height: source.height, rgba: pixels.buffer, mask: mask.buffer }, [pixels.buffer, mask.buffer])
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

  return <section className="ro-tool" aria-label="Remove an object from an image">
    <header className="ro-topbar">
      <div className="ro-brand">
        <span className="ro-brand-mark"><Eraser size={17} /></span>
        <div>
          <h1>Remove Object from Image</h1>
          <p>Paint over anything. The background is rebuilt from the rest of the photo.</p>
        </div>
      </div>
      <div className="ro-top-actions">
        {image && <button className="ro-ghost" type="button" onClick={newPhoto} disabled={busy}><ImagePlus size={14} /> New photo</button>}
        {mode === 'result'
          ? <button className="ro-primary" type="button" onClick={downloadPng}><Download size={15} /> Download PNG</button>
          : <button className="ro-primary" type="button" onClick={removeObject} disabled={!hasMask || busy || !image}><Wand2 size={15} /> {busy ? 'Removing…' : 'Remove object'}</button>}
      </div>
    </header>

    <div className="ro-body">
      <div className={`ro-workspace ${dragging ? 'is-dragging' : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {!image
          ? <label className={`ro-drop ${dragging ? 'is-dragging' : ''}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileInput} hidden />
            <span className="ro-drop-mark"><ImagePlus size={30} /></span>
            <strong>Upload from PC or Mobile</strong>
            <span>or drag a photo here, or paste one with Ctrl+V</span>
            <span className="ro-drop-button"><Upload size={14} /> Choose image</span>
            <small>JPG, PNG, or WebP · up to 25 MB · nothing leaves this device</small>
          </label>
          : <>
            <div className="ro-stage-bar">
              {mode === 'result'
                ? <>
                  <span className="ro-result-badge"><Wand2 size={13} /> Object removed</span>
                  <div className="ro-stage-actions">
                    <button className="ro-chip" type="button" onPointerDown={compareStart} onPointerUp={compareEnd} onPointerLeave={compareEnd} onPointerCancel={compareEnd} disabled={busy}>Hold to compare</button>
                    <button className="ro-chip" type="button" onClick={editMask} disabled={busy}><Eraser size={13} /> Edit mask</button>
                  </div>
                </>
                : <>
                  <div className="ro-segmented" role="group" aria-label="Brush mode">
                    <button type="button" className={erasing ? '' : 'is-active'} onClick={() => setErasing(false)}><Paintbrush size={13} /> Brush</button>
                    <button type="button" className={erasing ? 'is-active' : ''} onClick={() => setErasing(true)}><Eraser size={13} /> Eraser</button>
                  </div>
                  <label className="ro-size">
                    <span>Size</span>
                    <input type="range" min="12" max="140" step="2" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} aria-label="Brush size" />
                    <span className="ro-size-value">{brushSize}px</span>
                  </label>
                  <div className="ro-stage-actions">
                    <button className="ro-chip" type="button" onClick={undoMask} disabled={!undoDepth || busy}><Undo2 size={13} /> Undo</button>
                    <button className="ro-chip danger" type="button" onClick={clearMask} disabled={!hasMask || busy}><Trash2 size={13} /> Clear</button>
                  </div>
                </>}
            </div>

            <div className="ro-canvas-wrap">
              <div className="ro-canvas-frame">
                <canvas
                  ref={displayRef}
                  className={`ro-canvas ${mode === 'edit' && !busy ? 'is-painting' : ''}`}
                  width={image.width}
                  height={image.height}
                  aria-label="Photo to retouch"
                  onPointerDown={startStroke}
                  onPointerMove={moveStroke}
                  onPointerUp={endStroke}
                  onPointerCancel={endStroke}
                  onPointerLeave={() => setCursor(null)}
                  onDragStart={(event) => event.preventDefault()}
                />
                {cursor && mode === 'edit' && !busy && <span className="ro-brush-ring" style={{ left: cursor.x, top: cursor.y, width: brushSize * (cursor.scale || 1), height: brushSize * (cursor.scale || 1), borderStyle: erasing ? 'dashed' : 'solid' }} />}
                {busy && <div className="ro-busy" role="status" aria-live="polite">
                  <LoaderCircle size={26} className="ro-spin" />
                  <strong>{stage || 'Removing the object…'}</strong>
                  <div className="ro-progress"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
                  <small>{Math.round(progress * 100)}%</small>
                </div>}
              </div>
            </div>

            <p className="ro-hint">{mode === 'result' ? 'Compare with the original, edit the mask, or download the PNG.' : 'Brush over the object. Cover it completely, then press Remove object.'}</p>
          </>}
        {notice && <p className="ro-notice" role="status">{notice}</p>}
        {error && <p className="ro-error" role="alert">{error}</p>}
      </div>

      <aside className="ro-sidebar">
        <section className="ro-panel">
          <div className="ro-panel-head"><h2>How it works</h2><span>{processing === 'processing' ? 'Working' : 'On-device'}</span></div>
          <ol className="ro-steps">
            <li className={image ? 'is-done' : ''}><b>1</b><div><strong>Upload a photo</strong><small>Drop it, paste it, or browse.</small></div></li>
            <li className={hasMask ? 'is-done' : ''}><b>2</b><div><strong>Paint over the object</strong><small>A slightly larger brush hides its edges.</small></div></li>
            <li className={mode === 'result' ? 'is-done' : ''}><b>3</b><div><strong>Remove and download</strong><small>Nearby texture fills the gap.</small></div></li>
          </ol>
        </section>

        {image && <section className="ro-panel">
          <div className="ro-panel-head"><h2>Photo</h2><span>{image.width} × {image.height}</span></div>
          <p className="ro-file" title={image.name}>{image.name}</p>
          {scaledDown && <p className="ro-note">Large photos are processed at up to {MAX_EDGE}px so the retouch stays quick.</p>}
        </section>}

        {mode === 'result' && <section className="ro-panel">
          <div className="ro-panel-head"><h2>Export</h2><span>PNG</span></div>
          <button type="button" className="ro-primary wide" onClick={downloadPng}><Download size={15} /> Download PNG</button>
          <div className="ro-export-row">
            <button type="button" onClick={editMask}><Eraser size={14} /> Edit mask</button>
            <button type="button" onClick={startOver}><RotateCcw size={14} /> Start over</button>
          </div>
          <p>Saved at {image?.width} × {image?.height}px. Transparency in the original is kept.</p>
        </section>}

        <p className="ro-privacy"><ShieldCheck size={14} /> Your photo never leaves this browser tab.</p>
      </aside>
    </div>
  </section>
}
