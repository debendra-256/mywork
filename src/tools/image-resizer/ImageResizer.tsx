import { useState, useRef, useEffect, useCallback, type ChangeEvent, type DragEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Upload,
  Download,
  Trash2,
  Plus,
  RotateCcw,
  Maximize2,
  Crop,
  RotateCw,
  FlipHorizontal,
  SlidersHorizontal,
  Undo2,
  Redo2,
  ScanLine,
  Monitor,
  LayoutGrid,
  Layers,
  ShieldCheck,
  FolderArchive,
  ChevronDown,
  ArrowRight,
  Clock3,
  Lock,
  Check,
} from 'lucide-react'
import type { ResizedItem, ResizeSettings, DimensionPreset } from './types'
import {
  formatBytes,
  getFileExtension,
  loadImageDimensions,
  resizeSingleImage,
  downloadSingleFile,
  createAndDownloadZip,
} from './resizeEngine'
import './ImageResizer.css'

interface HistoryEntry {
  width: number
  height: number
  percentage: number
  rotation: number
  flipH: boolean
}

const POPULAR_PRESETS: DimensionPreset[] = [
  { id: 'insta-square', name: 'Instagram Square', width: 1080, height: 1080, tag: '1080 × 1080 (1:1)' },
  { id: 'insta-portrait', name: 'Instagram Portrait', width: 1080, height: 1350, tag: '1080 × 1350 (4:5)' },
  { id: 'tiktok-story', name: 'Story / Reel / TikTok', width: 1080, height: 1920, tag: '1080 × 1920 (9:16)' },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', width: 1280, height: 720, tag: '1280 × 720 (16:9)' },
  { id: 'full-hd', name: 'Full HD Wallpaper', width: 1920, height: 1080, tag: '1920 × 1080 (1080p)' },
  { id: 'web-banner', name: 'Website Hero / Banner', width: 1920, height: 600, tag: '1920 × 600 (~3:1)' },
]

const RESIZER_FAQS = [
  {
    question: 'How do I resize an image using the interactive handles?',
    answer:
      'Upload an image to the canvas studio. Eight interactive handles appear on the dashed bounding box (4 corners and 4 edge centers). Click and drag any handle to scale width and height dynamically. The image itself smoothly resizes on the canvas in real time.',
  },
  {
    question: 'How does the color adapt to the applied site theme?',
    answer:
      'The resizer workbench directly inherits ImgMojo’s active design tokens (Premium Purple, Dark Neon, Ocean Cyan, and Sunset Gradient). The handles, dashed bounding box, preset highlights, banner glow, and action buttons dynamically match your selected theme.',
  },
  {
    question: 'What is the difference between image resizing and image compression?',
    answer:
      'Resizing alters the actual pixel dimensions (width and height in pixels), directly changing how large the photo renders. Compression reduces file size (in KB or MB) by optimizing image encoding and stripping redundant metadata without necessarily changing dimensions.',
  },
  {
    question: 'How does "Maintain Aspect Ratio" protect image proportions?',
    answer:
      'When "Maintain Aspect Ratio" is enabled, dragging a corner handle or typing a width automatically recalculates the height proportionally, guaranteeing your image subject never appears squashed or stretched.',
  },
  {
    question: 'Are my images uploaded to any cloud server?',
    answer:
      'No. Resizing takes place 100% inside your web browser using HTML5 Canvas. Your private photos never leave your device, ensuring complete privacy, zero upload stalls, and instant performance.',
  },
  {
    question: 'Can I batch resize multiple images at once?',
    answer:
      'Yes! You can drop multiple JPG, PNG, and WebP images. You can fine-tune each one individually or batch-resize them with one click and download a clean ZIP archive.',
  },
]

export default function ImageResizer() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ResizedItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)

  // Transformation states
  const [rotation, setRotation] = useState<number>(0)
  const [flipH, setFlipH] = useState<boolean>(false)

  // Zoom / Viewport scale
  const [zoomLevel, setZoomLevel] = useState<number>(0.28)

  // Settings
  const [settings, setSettings] = useState<ResizeSettings>({
    mode: 'dimensions',
    width: 150,
    height: 150,
    percentage: 14,
    maintainAspectRatio: true,
    format: 'original',
    quality: 92,
    zipFolderName: 'ImgMojo-Resized-Images',
  })

  // Selected preset id
  const [activePresetId, setActivePresetId] = useState<string>('insta-square')

  // Undo / Redo History
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIdx, setHistoryIdx] = useState<number>(-1)

  // Dragging handle state
  const [dragHandle, setDragHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<{
    x: number
    y: number
    initialW: number
    initialH: number
  }>({ x: 0, y: 0, initialW: 0, initialH: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMoreRef = useRef<HTMLInputElement>(null)
  const canvasViewportRef = useRef<HTMLDivElement>(null)

  // Active item lookup
  const activeItem = items.find((it) => it.id === activeId) || items[0]

  // SEO & Title
  useEffect(() => {
    document.title = 'Free Online Image Resizer – Resize JPG, PNG & WebP | ImgMojo'
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Resize JPG, PNG and WebP images quickly online with ImgMojo. Change dimensions visually with drag handles or by percentage without losing quality. 100% free and client-side safe.'
      )
    }
  }, [])

  // Auto-preload sample image if items is empty so the studio is immediately displayed like reference image
  useEffect(() => {
    let isCancelled = false
    const loadSample = async () => {
      try {
        const resp = await fetch('/sample-portrait.jpg')
        if (!resp.ok) return
        const blob = await resp.blob()
        if (isCancelled) return
        const file = new File([blob], 'sample-portrait.jpg', { type: 'image/jpeg' })
        const { width, height, url } = await loadImageDimensions(file)
        if (isCancelled) return

        const initialItem: ResizedItem = {
          id: 'sample-portrait',
          file,
          name: 'sample-portrait.jpg',
          originalWidth: width,
          originalHeight: height,
          originalSize: file.size,
          originalUrl: url,
          aspectRatio: width / height,
          isProcessing: false,
        }

        setItems([initialItem])
        setActiveId(initialItem.id)

        // Set initial dimensions matching reference image: 150x150 (14%)
        const initW = 150
        const initH = 150
        setSettings((s) => ({
          ...s,
          width: initW,
          height: initH,
          percentage: Math.round((initW / width) * 100),
        }))

        // Push initial history entry
        setHistory([
          {
            width: initW,
            height: initH,
            percentage: Math.round((initW / width) * 100),
            rotation: 0,
            flipH: false,
          },
        ])
        setHistoryIdx(0)
      } catch (err) {
        console.error('Failed to preload sample', err)
      }
    }

    if (items.length === 0) {
      void loadSample()
    }

    return () => {
      isCancelled = true
    }
  }, [items.length])

  // Push to history helper
  const pushHistory = useCallback(
    (entry: HistoryEntry) => {
      setHistory((prev) => {
        const truncated = prev.slice(0, historyIdx + 1)
        return [...truncated, entry]
      })
      setHistoryIdx((prev) => prev + 1)
    },
    [historyIdx]
  )

  const handleUndo = () => {
    if (historyIdx > 0) {
      const target = history[historyIdx - 1]
      setSettings((s) => ({
        ...s,
        width: target.width,
        height: target.height,
        percentage: target.percentage,
      }))
      setRotation(target.rotation)
      setFlipH(target.flipH)
      setHistoryIdx((idx) => idx - 1)
    }
  }

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const target = history[historyIdx + 1]
      setSettings((s) => ({
        ...s,
        width: target.width,
        height: target.height,
        percentage: target.percentage,
      }))
      setRotation(target.rotation)
      setFlipH(target.flipH)
      setHistoryIdx((idx) => idx + 1)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newItems: ResizedItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue

      try {
        const { width, height, url } = await loadImageDimensions(file)
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          originalWidth: width,
          originalHeight: height,
          originalSize: file.size,
          originalUrl: url,
          aspectRatio: width / height,
          isProcessing: false,
        })
      } catch (err) {
        console.error('Failed to load image', err)
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => {
        // filter out sample default placeholder if user uploaded real files
        const filtered = prev.filter((p) => p.id !== 'sample-portrait')
        return [...filtered, ...newItems]
      })
      setActiveId(newItems[0].id)
      const targetW = newItems[0].originalWidth
      const targetH = newItems[0].originalHeight
      setSettings((s) => ({
        ...s,
        width: targetW,
        height: targetH,
        percentage: 100,
      }))
      setRotation(0)
      setFlipH(false)
      pushHistory({
        width: targetW,
        height: targetH,
        percentage: 100,
        rotation: 0,
        flipH: false,
      })
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    void handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files)
    if (e.target) e.target.value = ''
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target?.originalUrl && target.id !== 'sample-portrait') URL.revokeObjectURL(target.originalUrl)
      if (target?.resizedUrl) URL.revokeObjectURL(target.resizedUrl)
      const remaining = prev.filter((item) => item.id !== id)
      if (activeId === id && remaining.length > 0) {
        setActiveId(remaining[0].id)
        setSettings((s) => ({
          ...s,
          width: remaining[0].originalWidth,
          height: remaining[0].originalHeight,
          percentage: 100,
        }))
      }
      return remaining
    })
  }

  const clearAll = () => {
    items.forEach((item) => {
      if (item.originalUrl && item.id !== 'sample-portrait') URL.revokeObjectURL(item.originalUrl)
      if (item.resizedUrl) URL.revokeObjectURL(item.resizedUrl)
    })
    setItems([])
    setActiveId('')
  }

  const selectActiveItem = (item: ResizedItem) => {
    setActiveId(item.id)
    const w = item.resizedWidth || item.originalWidth
    const h = item.resizedHeight || item.originalHeight
    setSettings((s) => ({
      ...s,
      width: w,
      height: h,
      percentage: Math.round((w / item.originalWidth) * 100),
    }))
    setRotation(0)
    setFlipH(false)
  }

  const applyPreset = (preset: DimensionPreset) => {
    setActivePresetId(preset.id)
    setSettings((prev) => ({
      ...prev,
      mode: 'dimensions',
      width: preset.width,
      height: preset.height,
      percentage: activeItem ? Math.round((preset.width / activeItem.originalWidth) * 100) : 100,
      maintainAspectRatio: false,
    }))
    pushHistory({
      width: preset.width,
      height: preset.height,
      percentage: activeItem ? Math.round((preset.width / activeItem.originalWidth) * 100) : 100,
      rotation,
      flipH,
    })
  }

  const resetToOriginal = () => {
    if (!activeItem) return
    const origW = activeItem.originalWidth
    const origH = activeItem.originalHeight
    setSettings((s) => ({
      ...s,
      width: origW,
      height: origH,
      percentage: 100,
    }))
    setRotation(0)
    setFlipH(false)
    pushHistory({
      width: origW,
      height: origH,
      percentage: 100,
      rotation: 0,
      flipH: false,
    })
  }

  // Handle Dragging Logic
  const startHandleDrag = (handle: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!activeItem) return

    setDragHandle(handle)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialW: settings.width || activeItem.originalWidth,
      initialH: settings.height || activeItem.originalHeight,
    })
  }

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragHandle || !activeItem) return
      const { x, y, initialW, initialH } = dragStart

      // In canvas viewport, scaleFactor matches zoomLevel
      const effectiveZoom = Math.max(0.05, zoomLevel)
      const deltaX = (e.clientX - x) / effectiveZoom
      const deltaY = (e.clientY - y) / effectiveZoom

      let newW = initialW
      let newH = initialH

      if (dragHandle.includes('e')) {
        newW = Math.round(initialW + deltaX)
      } else if (dragHandle.includes('w')) {
        newW = Math.round(initialW - deltaX)
      }

      if (dragHandle.includes('s')) {
        newH = Math.round(initialH + deltaY)
      } else if (dragHandle.includes('n')) {
        newH = Math.round(initialH - deltaY)
      }

      newW = Math.max(20, Math.min(10000, newW))
      newH = Math.max(20, Math.min(10000, newH))

      if (settings.maintainAspectRatio) {
        const ratio = activeItem.aspectRatio || 1
        if (dragHandle === 'e' || dragHandle === 'w' || dragHandle.length === 2) {
          newH = Math.max(20, Math.round(newW / ratio))
        } else if (dragHandle === 'n' || dragHandle === 's') {
          newW = Math.max(20, Math.round(newH * ratio))
        }
      }

      setSettings((s) => ({
        ...s,
        width: newW,
        height: newH,
        percentage: Math.round((newW / activeItem.originalWidth) * 100),
      }))
    },
    [dragHandle, dragStart, activeItem, zoomLevel, settings.maintainAspectRatio]
  )

  const onPointerUp = useCallback(() => {
    if (dragHandle && activeItem) {
      pushHistory({
        width: settings.width,
        height: settings.height,
        percentage: settings.percentage,
        rotation,
        flipH,
      })
    }
    setDragHandle(null)
  }, [dragHandle, activeItem, settings.width, settings.height, settings.percentage, rotation, flipH, pushHistory])

  useEffect(() => {
    if (dragHandle) {
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      return () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
      }
    }
  }, [dragHandle, onPointerMove, onPointerUp])

  // Left strip toolbar actions
  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360
    setRotation(nextRot)
    pushHistory({
      width: settings.width,
      height: settings.height,
      percentage: settings.percentage,
      rotation: nextRot,
      flipH,
    })
  }

  const handleFlip = () => {
    const nextFlip = !flipH
    setFlipH(nextFlip)
    pushHistory({
      width: settings.width,
      height: settings.height,
      percentage: settings.percentage,
      rotation,
      flipH: nextFlip,
    })
  }

  // Dimension inputs change
  const handleWidthChange = (val: number) => {
    if (!activeItem) return
    const w = Math.max(1, val)
    let h = settings.height
    if (settings.maintainAspectRatio) {
      h = Math.max(1, Math.round(w / activeItem.aspectRatio))
    }
    setSettings((s) => ({
      ...s,
      width: w,
      height: h,
      percentage: Math.round((w / activeItem.originalWidth) * 100),
    }))
  }

  const handleHeightChange = (val: number) => {
    if (!activeItem) return
    const h = Math.max(1, val)
    let w = settings.width
    if (settings.maintainAspectRatio) {
      w = Math.max(1, Math.round(h * activeItem.aspectRatio))
    }
    setSettings((s) => ({
      ...s,
      width: w,
      height: h,
      percentage: Math.round((w / activeItem.originalWidth) * 100),
    }))
  }

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(1.5, Number((prev + 0.05).toFixed(2))))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.1, Number((prev - 0.05).toFixed(2))))
  }

  const handleZoomFit = () => {
    if (!activeItem) return
    // Fit image nicely into stage
    const fitScale = Math.min(420 / settings.width, 380 / settings.height, 0.5)
    setZoomLevel(Math.max(0.1, Number(fitScale.toFixed(2))))
  }

  // Resize & Download Action
  const processActiveImage = async () => {
    if (!activeItem || isProcessing) return
    setIsProcessing(true)

    try {
      const res = await resizeSingleImage(activeItem, settings, { rotation, flipH })
      setItems((prev) =>
        prev.map((it) =>
          it.id === activeItem.id
            ? {
                ...it,
                resizedBlob: res.blob,
                resizedUrl: res.url,
                resizedSize: res.size,
                resizedWidth: res.width,
                resizedHeight: res.height,
                outputName: res.outputName,
              }
            : it
        )
      )
      // Instant download of the resized file
      downloadSingleFile(res.blob, res.outputName)
    } catch (err) {
      console.error('Resize failed', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((item) => item.resizedBlob)
    if (readyItems.length === 0) return
    setZipProgress(1)
    try {
      await createAndDownloadZip(readyItems, settings.zipFolderName, (pct) => setZipProgress(pct))
    } catch (err) {
      console.error('Zip creation error', err)
    } finally {
      setZipProgress(0)
    }
  }

  // Visual aspect scale factor for the handler box
  const scalePercent = activeItem
    ? Math.round(((settings.width || activeItem.originalWidth) / activeItem.originalWidth) * 100)
    : 100

  // Generous, clear display dimensions so uploaded image is ALWAYS prominently shown
  const baseStageDim = 350
  const aspect = activeItem ? activeItem.aspectRatio || 1 : 1
  const baseW = aspect >= 1 ? baseStageDim : Math.round(baseStageDim * aspect)
  const baseH = aspect >= 1 ? Math.round(baseStageDim / aspect) : baseStageDim

  const scaleFactor = activeItem && activeItem.originalWidth > 0
    ? settings.width / activeItem.originalWidth
    : 1

  // Display size scaled gracefully in range [220px to 500px]
  const displayW = Math.max(
    220,
    Math.min(500, Math.round(baseW * Math.pow(Math.max(0.1, scaleFactor), 0.32) * (zoomLevel / 0.28)))
  )
  const displayH = Math.max(
    220,
    Math.min(500, Math.round(baseH * Math.pow(Math.max(0.1, scaleFactor), 0.32) * (zoomLevel / 0.28)))
  )

  return (
    <div className="image-resizer-page">
      <div className="ir-container">
        {/* TOP HERO BANNER: Matches media_1795243424607_8391b10f.jpg */}
        <div className="ir-banner">
          <div className="ir-banner-left">
            <div className="ir-banner-icon">
              <Maximize2 size={24} color="#ffffff" strokeWidth={2.2} />
            </div>
            <div className="ir-banner-text">
              <h1 className="ir-banner-title">
                Image <span className="ir-banner-gradient-text">Resizer</span>
              </h1>
              <p className="ir-banner-subtitle">
                Resize your images to any dimension or percentage while keeping high quality.
              </p>
            </div>
          </div>

          <div className="ir-banner-right">
            <div className="ir-floating-card">
              <div className="ir-card-screen">
                <div className="ir-card-sun" />
                <div className="ir-card-mountains" />
              </div>
            </div>
            <span className="ir-sparkle s1">✦</span>
            <span className="ir-sparkle s2">✧</span>
            <span className="ir-sparkle s3">✦</span>
          </div>
        </div>

        {/* Dropzone (When items are cleared) */}
        {items.length === 0 ? (
          <div
            className={`ir-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            <div className="ir-dropzone-inner">
              <div className="ir-dropzone-icon">
                <Upload size={30} />
              </div>
              <h2 className="ir-dropzone-title">Drop your images here, or browse files</h2>
              <p className="ir-dropzone-sub">
                Supports high-res JPG, PNG, and WebP up to 50MB. Drag handles appear automatically upon upload!
              </p>
              <button type="button" className="ir-browse-btn">
                <Plus size={16} /> Choose Images to Resize
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Active Uploaded Image Overview Bar */}
            {activeItem && (
              <div className="ir-active-image-bar">
                <div className="ir-active-meta-left">
                  <img src={activeItem.originalUrl} alt={activeItem.name} className="ir-active-mini-thumb" />
                  <div>
                    <div className="ir-active-name-row">
                      <strong className="ir-active-name" title={activeItem.name}>
                        {activeItem.name}
                      </strong>
                      <span className="ir-active-fmt-chip">
                        {getFileExtension(activeItem.name).toUpperCase() || 'IMAGE'}
                      </span>
                    </div>
                    <span className="ir-active-details">
                      Original: {activeItem.originalWidth} × {activeItem.originalHeight} px · {formatBytes(activeItem.originalSize)}
                    </span>
                  </div>
                </div>
                <div className="ir-active-meta-right">
                  <button
                    type="button"
                    className="ir-active-change-btn"
                    onClick={() => addMoreRef.current?.click()}
                    title="Upload or switch image"
                  >
                    <Upload size={14} /> Upload New Image
                  </button>
                </div>
              </div>
            )}

            {/* WORKBENCH STUDIO: Matches media_1795243424607_8391b10f.jpg */}
            <div className="ir-studio">
            {/* 1. LEFT VERTICAL TOOLBAR */}
            <div className="ir-tool-strip">
              <button
                type="button"
                className="ir-tool-btn active"
                title="Resize (Interactive Drag Handler Active)"
              >
                <div className="ir-tool-icon">
                  <Maximize2 size={20} />
                </div>
                <span className="ir-tool-label">Resize</span>
              </button>

              <button
                type="button"
                className="ir-tool-btn"
                title="Switch to Image Cropper"
                onClick={() => navigate('/image-cropper')}
              >
                <div className="ir-tool-icon">
                  <Crop size={20} />
                </div>
                <span className="ir-tool-label">Crop</span>
              </button>

              <button
                type="button"
                className="ir-tool-btn"
                title="Rotate 90° Clockwise"
                onClick={handleRotate}
              >
                <div className="ir-tool-icon">
                  <RotateCw size={20} />
                </div>
                <span className="ir-tool-label">Rotate</span>
              </button>

              <button
                type="button"
                className="ir-tool-btn"
                title="Flip Horizontally"
                onClick={handleFlip}
              >
                <div className="ir-tool-icon">
                  <FlipHorizontal size={20} />
                </div>
                <span className="ir-tool-label">Flip</span>
              </button>

              <button
                type="button"
                className="ir-tool-btn"
                title="Toggle Aspect Ratio Adjust"
                onClick={() =>
                  setSettings((s) => ({ ...s, maintainAspectRatio: !s.maintainAspectRatio }))
                }
              >
                <div className="ir-tool-icon">
                  <SlidersHorizontal size={20} />
                </div>
                <span className="ir-tool-label">Adjust</span>
              </button>
            </div>

            {/* 2. CENTER CANVAS STAGE */}
            <div className="ir-canvas-area" ref={canvasViewportRef}>
              <div className="ir-canvas-stage">
                {activeItem && (
                  <div
                    className={`ir-resizable-box ${dragHandle ? 'dragging' : ''}`}
                    style={{
                      width: `${displayW}px`,
                      height: `${displayH}px`,
                    }}
                  >
                    {/* Live floating dimensions badge */}
                    <div className="ir-live-badge">
                      {settings.width} × {settings.height} px ({scalePercent}%)
                    </div>

                    {/* Image with real-time scaling and rotation/flip */}
                    <img
                      src={activeItem.originalUrl}
                      alt={activeItem.name}
                      className="ir-canvas-img"
                      style={{
                        transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                      }}
                      draggable={false}
                    />

                    {/* Dashed selection border with 8 handles */}
                    <div className="ir-dashed-border">
                      {/* 4 Corners */}
                      <div
                        className="ir-handle nw"
                        onPointerDown={(e) => startHandleDrag('nw', e)}
                        title="Resize Top-Left"
                      />
                      <div
                        className="ir-handle ne"
                        onPointerDown={(e) => startHandleDrag('ne', e)}
                        title="Resize Top-Right"
                      />
                      <div
                        className="ir-handle se"
                        onPointerDown={(e) => startHandleDrag('se', e)}
                        title="Resize Bottom-Right"
                      />
                      <div
                        className="ir-handle sw"
                        onPointerDown={(e) => startHandleDrag('sw', e)}
                        title="Resize Bottom-Left"
                      />

                      {/* 4 Edges */}
                      <div
                        className="ir-handle n"
                        onPointerDown={(e) => startHandleDrag('n', e)}
                        title="Resize Top Edge"
                      />
                      <div
                        className="ir-handle s"
                        onPointerDown={(e) => startHandleDrag('s', e)}
                        title="Resize Bottom Edge"
                      />
                      <div
                        className="ir-handle w"
                        onPointerDown={(e) => startHandleDrag('w', e)}
                        title="Resize Left Edge"
                      />
                      <div
                        className="ir-handle e"
                        onPointerDown={(e) => startHandleDrag('e', e)}
                        title="Resize Right Edge"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Canvas Toolbar */}
              <div className="ir-canvas-bottom-bar">
                <div className="ir-canvas-history-group">
                  <button
                    type="button"
                    className="ir-canvas-icon-btn"
                    onClick={handleUndo}
                    disabled={historyIdx <= 0}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="ir-canvas-icon-btn"
                    onClick={handleRedo}
                    disabled={historyIdx >= history.length - 1}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 size={16} />
                  </button>
                </div>

                <div className="ir-canvas-zoom-pill">
                  <button
                    type="button"
                    className="ir-zoom-btn"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <span className="ir-zoom-val">{scalePercent}%</span>
                  <button
                    type="button"
                    className="ir-zoom-btn"
                    onClick={handleZoomIn}
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ir-zoom-fit-btn"
                    onClick={handleZoomFit}
                    title="Fit to Screen"
                  >
                    <Maximize2 size={13} />
                  </button>
                </div>

                <div className="ir-canvas-reset-group">
                  <button
                    type="button"
                    className="ir-canvas-reset-btn"
                    onClick={resetToOriginal}
                    title="Reset to Original Dimensions"
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. RIGHT SIDEBAR CONTROLS */}
            <div className="ir-sidebar-panel">
              {/* SECTION 1: Resize Mode */}
              <div className="ir-control-section">
                <div className="ir-section-head">
                  <ScanLine size={16} className="ir-section-icon" />
                  <span>Resize Mode</span>
                </div>
                <div className="ir-mode-toggle-group">
                  <button
                    type="button"
                    className={`ir-mode-tab ${settings.mode === 'dimensions' ? 'active' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, mode: 'dimensions' }))}
                  >
                    <Maximize2 size={13} /> By Dimensions
                  </button>
                  <button
                    type="button"
                    className={`ir-mode-tab ${settings.mode === 'percentage' ? 'active' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, mode: 'percentage' }))}
                  >
                    % By Percentage
                  </button>
                </div>
              </div>

              {/* SECTION 2: Target Dimensions (Pixels) */}
              <div className="ir-control-section">
                <div className="ir-section-head">
                  <Monitor size={16} className="ir-section-icon" />
                  <span>Target Dimensions (Pixels)</span>
                </div>
                <div className="ir-dims-inputs-row">
                  <div className="ir-dim-field">
                    <label htmlFor="ir-width-input">WIDTH (PX)</label>
                    <div className="ir-input-stepper-wrap">
                      <input
                        id="ir-width-input"
                        type="number"
                        min={1}
                        max={10000}
                        value={settings.width}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                      />
                      <div className="ir-stepper-btns">
                        <button
                          type="button"
                          onClick={() => handleWidthChange(settings.width + 10)}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWidthChange(Math.max(1, settings.width - 10))}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="ir-dim-field">
                    <label htmlFor="ir-height-input">HEIGHT (PX)</label>
                    <div className="ir-input-stepper-wrap">
                      <input
                        id="ir-height-input"
                        type="number"
                        min={1}
                        max={10000}
                        value={settings.height}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                      />
                      <div className="ir-stepper-btns">
                        <button
                          type="button"
                          onClick={() => handleHeightChange(settings.height + 10)}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHeightChange(Math.max(1, settings.height - 10))}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <label className="ir-aspect-checkbox-row">
                  <input
                    type="checkbox"
                    checked={settings.maintainAspectRatio}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, maintainAspectRatio: e.target.checked }))
                    }
                  />
                  <span className="ir-checkbox-custom">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="ir-checkbox-text">Maintain Aspect Ratio</span>
                </label>
              </div>

              {/* SECTION 3: Popular Presets */}
              <div className="ir-control-section">
                <div className="ir-section-head">
                  <LayoutGrid size={16} className="ir-section-icon" />
                  <span>Popular Presets</span>
                </div>
                <div className="ir-presets-grid">
                  {POPULAR_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`ir-preset-card ${isSelected ? 'active' : ''}`}
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="ir-preset-icon-col">
                          {preset.id.startsWith('insta') ? (
                            /* Instagram Gradient Icon */
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" fill="url(#ig-grad)" />
                              <path
                                stroke="#fff"
                                strokeWidth="1.8"
                                d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
                              />
                              <circle cx="17.5" cy="6.5" r="1" fill="#fff" />
                              <defs>
                                <linearGradient id="ig-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#f09433" />
                                  <stop offset="0.5" stopColor="#e6683c" />
                                  <stop offset="1" stopColor="#bc1888" />
                                </linearGradient>
                              </defs>
                            </svg>
                          ) : preset.id === 'tiktok-story' ? (
                            /* TikTok Icon */
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                              <path
                                d="M16.6 5.82a4.28 4.28 0 0 1-2.9-2.82h-2.73v11.83a2.38 2.38 0 1 1-1.68-2.28V9.78a5.15 5.15 0 1 0 4.41 5.05V8.16a7.07 7.07 0 0 0 4.15 1.34V6.73a4.34 4.34 0 0 1-1.25-.91z"
                                fill="#25F4EE"
                              />
                              <path
                                d="M17.1 5.32a4.28 4.28 0 0 1-2.9-2.82h-2.73v11.83a2.38 2.38 0 1 1-1.68-2.28V9.78a5.15 5.15 0 1 0 4.41 5.05V8.16a7.07 7.07 0 0 0 4.15 1.34V6.73a4.34 4.34 0 0 1-1.25-.91z"
                                fill="#FE2C55"
                                style={{ mixBlendMode: 'screen' }}
                              />
                            </svg>
                          ) : preset.id === 'yt-thumb' ? (
                            /* YouTube Red Icon */
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <rect width="22" height="16" x="1" y="4" rx="4" fill="#FF0000" />
                              <polygon points="9.5,8.5 15.5,12 9.5,15.5" fill="#FFFFFF" />
                            </svg>
                          ) : preset.id === 'full-hd' ? (
                            /* Full HD Monitor Icon */
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                          ) : (
                            /* Website Hero / Banner Icon */
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="5" width="20" height="14" rx="2" />
                              <circle cx="8" cy="10" r="2" />
                              <path d="m21 15-5-5L5 21" />
                            </svg>
                          )}
                        </div>
                        <div className="ir-preset-text-col">
                          <span className="ir-preset-title">{preset.name}</span>
                          <span className="ir-preset-sub">{preset.tag}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* SECTION 4: Output Format */}
              <div className="ir-control-section">
                <div className="ir-section-head">
                  <Layers size={16} className="ir-section-icon" />
                  <span>Output Format</span>
                </div>
                <div className="ir-select-wrap">
                  <select
                    value={settings.format}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        format: e.target.value as ResizeSettings['format'],
                      }))
                    }
                  >
                    <option value="original">Keep Original Format</option>
                    <option value="jpeg">JPG / JPEG (.jpg)</option>
                    <option value="png">PNG (.png)</option>
                    <option value="webp">WebP (.webp)</option>
                  </select>
                  <ChevronDown size={14} className="ir-select-arrow" />
                </div>
              </div>

              {/* SECTION 5: Resize & Download Action Button */}
              <div className="ir-action-col">
                <button
                  type="button"
                  className="ir-download-action-btn"
                  onClick={processActiveImage}
                  disabled={isProcessing}
                >
                  <Download size={18} strokeWidth={2.5} />
                  <span>{isProcessing ? 'Processing...' : 'Resize & Download'}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

        {/* UPLOAD / MULTI-IMAGE MANAGEMENT STRIP */}
        {items.length > 0 && (
          <div className="ir-image-selector-strip">
            <div className="ir-strip-label">
              <span>Uploaded Images ({items.length}):</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="ir-strip-add-btn"
                  onClick={() => addMoreRef.current?.click()}
                >
                  <Plus size={13} /> Add more
                </button>
                <button
                  type="button"
                  className="ir-strip-add-btn"
                  style={{ color: '#ef4444' }}
                  onClick={clearAll}
                >
                  <Trash2 size={13} /> Clear all
                </button>
              </div>
              <input
                ref={addMoreRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
            </div>
            <div className="ir-strip-pills">
              {items.map((it) => {
                const isSelected = it.id === activeItem?.id
                return (
                  <button
                    key={it.id}
                    type="button"
                    className={`ir-strip-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => selectActiveItem(it)}
                  >
                    <img src={it.originalUrl} alt={it.name} className="ir-strip-thumb" />
                    <span className="ir-strip-name">{it.name}</span>
                    <button
                      type="button"
                      className="ir-strip-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(it.id)
                      }}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* REQUIREMENT 2: STRUCTURE AFTER RESIZE COMPARISON */}
        {activeItem && (
          <div className="ir-structure-panel">
            <div className="ir-structure-head">
              <div className="ir-structure-title-row">
                <span className="ir-structure-badge">STRUCTURE COMPARISON</span>
                <h2>Image Structure: Original vs. Resized</h2>
              </div>
              <p>
                Inspect the structural breakdown of resolution, pixel count, aspect ratio, file size, and data optimization.
              </p>
            </div>

            <div className="ir-structure-comparison">
              {/* Before: Original Structure */}
              <div className="ir-structure-card before">
                <div className="ir-structure-card-header">
                  <span className="ir-structure-tag">ORIGINAL STRUCTURE</span>
                  <span className="ir-structure-format">
                    {getFileExtension(activeItem.name).toUpperCase() || 'IMAGE'}
                  </span>
                </div>
                <div className="ir-structure-preview-box">
                  <img
                    src={activeItem.originalUrl}
                    alt={activeItem.name}
                    className="ir-structure-img"
                  />
                  <span className="ir-structure-dims-pill">
                    {activeItem.originalWidth} × {activeItem.originalHeight} px
                  </span>
                </div>
                <div className="ir-structure-specs">
                  <div className="ir-spec-row">
                    <span>Resolution:</span>
                    <strong>
                      {activeItem.originalWidth} × {activeItem.originalHeight} px
                    </strong>
                  </div>
                  <div className="ir-spec-row">
                    <span>Total Pixels:</span>
                    <strong>
                      {((activeItem.originalWidth * activeItem.originalHeight) / 1000000).toFixed(2)} MP
                    </strong>
                  </div>
                  <div className="ir-spec-row">
                    <span>Aspect Ratio:</span>
                    <strong>{activeItem.aspectRatio.toFixed(2)}:1</strong>
                  </div>
                  <div className="ir-spec-row">
                    <span>File Size:</span>
                    <strong>{formatBytes(activeItem.originalSize)}</strong>
                  </div>
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="ir-structure-arrow-wrap">
                <div className="ir-structure-arrow">➔</div>
                <span className="ir-structure-arrow-label">
                  {scalePercent === 100
                    ? '100% Dimensions'
                    : scalePercent < 100
                    ? `${scalePercent}% Scaled Down`
                    : `${scalePercent}% Scaled Up`}
                </span>
              </div>

              {/* After: Resized Structure */}
              <div className="ir-structure-card after">
                <div className="ir-structure-card-header">
                  <span className="ir-structure-tag ready">TARGET STRUCTURE</span>
                  <span className="ir-structure-format">
                    {settings.format === 'original'
                      ? getFileExtension(activeItem.name).toUpperCase() || 'IMAGE'
                      : settings.format.toUpperCase()}
                  </span>
                </div>
                <div className="ir-structure-preview-box">
                  <img
                    src={activeItem.resizedUrl || activeItem.originalUrl}
                    alt="Resized preview"
                    className="ir-structure-img"
                  />
                  <span className="ir-structure-dims-pill target">
                    {settings.width} × {settings.height} px
                  </span>
                </div>
                <div className="ir-structure-specs">
                  <div className="ir-spec-row">
                    <span>Resolution:</span>
                    <strong className="ir-highlight">
                      {settings.width} × {settings.height} px
                    </strong>
                  </div>
                  <div className="ir-spec-row">
                    <span>Total Pixels:</span>
                    <strong className="ir-highlight">
                      {((settings.width * settings.height) / 1000000).toFixed(2)} MP
                    </strong>
                  </div>
                  <div className="ir-spec-row">
                    <span>Aspect Ratio:</span>
                    <strong>{(settings.width / settings.height).toFixed(2)}:1</strong>
                  </div>
                  <div className="ir-spec-row">
                    <span>Status:</span>
                    <strong>
                      {activeItem.resizedBlob ? (
                        <span style={{ color: '#10b981' }}>
                          ✓ Resized ({formatBytes(activeItem.resizedSize || 0)})
                        </span>
                      ) : (
                        'Ready to download'
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BATCH DOWNLOAD ALL AS ZIP (When multiple images ready) */}
        {items.filter((it) => it.resizedBlob).length > 1 && (
          <div className="ir-batch-bar">
            <div>
              <h3>Batch Resizing Ready</h3>
              <p>
                {items.filter((it) => it.resizedBlob).length} of {items.length} images resized.
              </p>
            </div>
            <button
              type="button"
              className="ir-batch-zip-btn"
              onClick={handleDownloadAllZip}
              disabled={zipProgress > 0}
            >
              <FolderArchive size={16} />
              <span>
                {zipProgress > 0 ? `Zipping (${zipProgress}%)...` : 'Download All as ZIP'}
              </span>
            </button>
          </div>
        )}

        {/* SECTION: STEP-BY-STEP USAGE INSTRUCTIONS */}
        <section className="ir-content-section">
          <h2>How to Resize Images Step-by-Step</h2>
          <p className="ir-section-lead">
            Follow these simple steps to resize your digital photos visually or to exact specifications:
          </p>

          <div className="ir-steps-grid">
            <div className="ir-step-card">
              <span className="ir-step-num">1</span>
              <h3>Upload Your Image</h3>
              <p>
                Drag and drop your JPG, PNG, or WebP photo into the workspace or choose a sample image.
              </p>
            </div>

            <div className="ir-step-card">
              <span className="ir-step-num">2</span>
              <h3>Drag Handles or Set Dimensions</h3>
              <p>
                Click and drag any of the 8 interactive handles to visually resize the image, or type exact pixels in the sidebar.
              </p>
            </div>

            <div className="ir-step-card">
              <span className="ir-step-num">3</span>
              <h3>Inspect Structure & Download</h3>
              <p>
                Review the structural before-and-after breakdown, verify resolution and aspect ratio, and click "Resize & Download".
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: RESIZING VS COMPRESSION */}
        <section className="ir-content-section">
          <h2>Understanding Image Resizing vs. Image Compression</h2>
          <p>
            While resizing and compression both reduce digital payload, they serve distinct technical functions in modern web optimization:
          </p>
          <div className="ir-compare-grid">
            <div className="ir-compare-col">
              <h3>Image Resizing (Dimensions)</h3>
              <ul>
                <li>Changes the physical pixel matrix (e.g. 4000 × 3000 px to 1200 × 900 px).</li>
                <li>Directly determines how large or small an image appears on screen or prints.</li>
                <li>Prevents web browsers from downloading massive desktop-sized hero images onto mobile phones.</li>
                <li>Provides instant reduction in memory footprint when rendering in web pages.</li>
              </ul>
            </div>
            <div className="ir-compare-col">
              <h3>Image Compression (Bitrate & Quality)</h3>
              <ul>
                <li>Optimizes binary file encoding and strips unnecessary camera EXIF metadata.</li>
                <li>Retains original width and height while discarding non-essential color data.</li>
                <li>Can be lossy (perceptible reduction for massive size savings) or lossless.</li>
                <li>Best paired with resizing for maximum web performance and SEO Core Web Vitals.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION: SUPPORTED FORMATS */}
        <section className="ir-content-section">
          <h2>Supported Image Formats</h2>
          <p>ImgMojo's Image Resizer fully supports the web's three primary digital raster standards:</p>
          <div className="ir-formats-grid">
            <div className="ir-format-card">
              <div className="ir-format-chip">JPG / JPEG</div>
              <h4>Joint Photographic Experts Group</h4>
              <p>
                The universal standard for photography. Resizing photographs removes excess camera sensor resolution, dramatically improving load times.
              </p>
            </div>
            <div className="ir-format-card">
              <div className="ir-format-chip">PNG</div>
              <h4>Portable Network Graphics</h4>
              <p>
                Ideal for graphics, logos, illustrations, and UI screenshots requiring lossless transparency. Resizes with complete alpha-channel preservation.
              </p>
            </div>
            <div className="ir-format-card">
              <div className="ir-format-chip">WebP</div>
              <h4>Google WebP Format</h4>
              <p>
                Modern next-gen image standard offering 25-35% superior compression efficiency compared to JPG while retaining full transparency.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: PRACTICAL USE CASES */}
        <section className="ir-content-section">
          <h2>Practical Use Cases for Image Resizing</h2>
          <div className="ir-usecases-grid">
            <div className="ir-usecase-item">
              <h4>Social Media Optimization</h4>
              <p>
                Scale your profile pictures, stories, and feed posts to exact platform dimensions like Instagram (1080×1080), TikTok (1080×1920), and YouTube (1280×720).
              </p>
            </div>
            <div className="ir-usecase-item">
              <h4>E-Commerce Product Galleries</h4>
              <p>
                Standardize all product catalog listings to uniform square proportions (such as 1000×1000 px) for Shopify, Amazon, and WooCommerce stores.
              </p>
            </div>
            <div className="ir-usecase-item">
              <h4>Web & Mobile App Development</h4>
              <p>
                Generate multi-resolution responsive assets (1x, 2x, 3x) for retina screens and responsive picture elements.
              </p>
            </div>
            <div className="ir-usecase-item">
              <h4>Government & Job Application Portals</h4>
              <p>
                Easily resize passport photos, exam admit signatures, and identity cards to strict dimension and kilobyte specifications.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: FAQS */}
        <section className="ir-content-section">
          <h2>Frequently Asked Questions</h2>
          <div className="ir-faq-list">
            {RESIZER_FAQS.map((faq, idx) => (
              <details key={idx} className="ir-faq-item">
                <summary className="ir-faq-question">
                  <span>{faq.question}</span>
                  <ChevronDown size={16} className="ir-faq-arrow" />
                </summary>
                <div className="ir-faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* SECTION: PRIVACY & SECURITY */}
        <section className="ir-content-section ir-privacy-section">
          <div className="ir-privacy-card">
            <div className="ir-privacy-icon">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2>Is It Safe to Resize Images Online?</h2>
              <p>
                Yes, completely. Unlike traditional cloud photo tools that upload your files to remote servers, ImgMojo processes <strong>100% of your images locally in your web browser</strong> using client-side HTML5 Canvas.
              </p>
              <ul className="ir-privacy-bullets">
                <li>
                  <Clock3 size={15} /> <strong>Zero Cloud Upload:</strong> Your photos never leave your device.
                </li>
                <li>
                  <Lock size={15} /> <strong>Total Privacy:</strong> No photos are stored, cataloged, or retained.
                </li>
                <li>
                  <ShieldCheck size={15} /> <strong>No Third-Party Sharing:</strong> Zero telemetry or AI training on your private images.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION: EXPLORE MORE TOOLS */}
        <section className="ir-content-section ir-tools-nav-section">
          <h2>Explore More Image Tools</h2>
          <p className="ir-section-lead">
            Discover our complementary browser-based digital image utilities:
          </p>
          <div className="ir-tools-nav-grid">
            <Link to="/compress-image" className="ir-nav-tool-card">
              <div className="ir-nav-icon">
                <Maximize2 size={24} />
              </div>
              <div className="ir-nav-info">
                <h3>Image Compressor</h3>
                <p>Reduce file size in KB or MB without visible loss of quality.</p>
                <span className="ir-nav-link-text">
                  Compress Images Now <ArrowRight size={13} />
                </span>
              </div>
            </Link>

            <Link to="/image-converter" className="ir-nav-tool-card">
              <div className="ir-nav-icon">
                <Layers size={24} />
              </div>
              <div className="ir-nav-info">
                <h3>Image Converter</h3>
                <p>Convert seamlessly between JPG, PNG, and WebP raster standards.</p>
                <span className="ir-nav-link-text">
                  Convert Formats <ArrowRight size={13} />
                </span>
              </div>
            </Link>

            <Link to="/image-cropper" className="ir-nav-tool-card">
              <div className="ir-nav-icon">
                <Crop size={24} />
              </div>
              <div className="ir-nav-info">
                <h3>Image Cropper</h3>
                <p>Crop images to exact aspect ratios with grid guides and angle rotation.</p>
                <span className="ir-nav-link-text">
                  Crop Images Now <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
