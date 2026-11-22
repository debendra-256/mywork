import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  Download,
  Trash2,
  RefreshCw,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Lock,
  Clock3,
  Wand2,
  Mail,
  Grid3X3,
  SlidersHorizontal,
  Maximize2,
  Crop,
  Check,
} from 'lucide-react'
import type { CropArea, CropSettings } from './types'
import {
  CROP_PRESETS,
  loadImage,
  exportCroppedImage,
  downloadSingleFile,
  formatBytes,
} from './cropEngine'
import './ImageCropper.css'

const CROPPER_FAQS = [
  {
    question: 'How does cropping an image differ from resizing it?',
    answer:
      'Cropping removes unwanted outer areas of an image to change its composition or framing without squishing or altering the scale of the subject. Resizing changes the overall pixel dimensions of the entire image.',
  },
  {
    question: 'What is the Rule of Thirds and how does it help?',
    answer:
      'The Rule of Thirds is a classic photography composition guideline. By aligning focal points along the 3×3 grid lines or their intersections, your image feels more balanced, natural, and visually engaging.',
  },
  {
    question: 'Will cropping reduce the quality of my photo?',
    answer:
      'No. ImgMojo performs lossless coordinate cropping directly from your original high-resolution pixels. The remaining area retains 100% of its native clarity and sharpness.',
  },
  {
    question: 'Are my photos ever uploaded to a server?',
    answer:
      'Never. All cropping and canvas manipulations are processed 100% in your local web browser using HTML5 Canvas. Your images are never transmitted over the internet or stored anywhere.',
  },
  {
    question: 'What aspect ratio is best for Instagram and social media?',
    answer:
      'For Instagram feed posts, 1:1 (Square) or 4:5 (Vertical Portrait) work best. For Instagram Stories, Reels, YouTube Shorts, and TikTok, use 9:16 (Full Portrait). For YouTube thumbnails, 16:9 is standard.',
  },
]

type HandleDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move'

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [imgUrl, setImgUrl] = useState<string>('')
  const [origDims, setOrigDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number>(0)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Split-button dropdown menu state
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [isUrlMode, setIsUrlMode] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState('')
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)

  // Crop Area in original image pixel units
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 })

  // Custom aspect ratio numbers
  const [customRatioW, setCustomRatioW] = useState<number>(1)
  const [customRatioH, setCustomRatioH] = useState<number>(1)

  // Settings
  const [settings, setSettings] = useState<CropSettings>({
    aspectRatioPreset: 'free',
    format: 'jpeg',
    quality: 92,
    rotation: 0,
    flipH: false,
    flipV: false,
    showGrid: true,
  })

  // Display scaling refs & drag interaction state
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dragState, setDragState] = useState<{
    action: HandleDirection
    startX: number
    startY: number
    startCrop: CropArea
  } | null>(null)

  // Returns active numerical aspect ratio (or null for freeform)
  const getActiveRatio = useCallback((): number | null => {
    if (settings.aspectRatioPreset === 'free') return null
    if (settings.aspectRatioPreset === 'original') {
      return origDims.width && origDims.height ? origDims.width / origDims.height : null
    }
    if (settings.aspectRatioPreset === 'custom') {
      const w = Math.max(0.01, customRatioW)
      const h = Math.max(0.01, customRatioH)
      return w / h
    }
    const found = CROP_PRESETS.find((p) => p.id === settings.aspectRatioPreset)
    return found?.ratio ?? null
  }, [settings.aspectRatioPreset, customRatioW, customRatioH, origDims])

  // Center & fit crop box whenever a new ratio or image is set
  const fitCropToRatio = useCallback(
    (ratio: number | null, origW: number, origH: number) => {
      if (!origW || !origH) return
      let w: number
      let h: number
      if (ratio === null) {
        // Freeform default: 75% of image, perfectly centered in the middle
        w = Math.round(origW * 0.75)
        h = Math.round(origH * 0.75)
      } else {
        w = origW * 0.8
        h = w / ratio
        if (h > origH * 0.8) {
          h = origH * 0.8
          w = h * ratio
        }
        w = Math.max(10, Math.round(w))
        h = Math.max(10, Math.round(h))
      }
      // Always place selector exactly in the middle
      const x = Math.max(0, Math.round((origW - w) / 2))
      const y = Math.max(0, Math.round((origH - h) / 2))
      setCrop({ x, y, width: w, height: h })
    },
    []
  )

  // File loading
  const handleFile = useCallback(
    async (selectedFile: File) => {
      try {
        const loaded = await loadImage(selectedFile)
        setFile(selectedFile)
        setLoadedImg(loaded.img)
        setImgUrl(loaded.url)
        setOrigDims({ width: loaded.width, height: loaded.height })
        setSettings((prev) => ({
          ...prev,
          format: selectedFile.type === 'image/png' ? 'png' : selectedFile.type === 'image/webp' ? 'webp' : 'jpeg',
          rotation: 0,
          flipH: false,
          flipV: false,
        }))
        fitCropToRatio(null, loaded.width, loaded.height)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to load image')
      }
    },
    [fitCropToRatio]
  )

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  // URL Image Loader
  const handleLoadFromUrl = async () => {
    if (!urlInputValue.trim()) return
    setIsLoadingUrl(true)
    try {
      const resp = await fetch(urlInputValue)
      if (!resp.ok) throw new Error('Could not fetch image from the provided URL')
      const blob = await resp.blob()
      const ext = blob.type.split('/')[1] || 'jpg'
      const remoteFile = new File([blob], `image-url.${ext}`, { type: blob.type })
      await handleFile(remoteFile)
      setIsUrlMode(false)
      setUrlInputValue('')
    } catch {
      // Fallback: direct Image src
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            canvas.toBlob((b) => {
              if (b) {
                const f = new File([b], 'image-url.jpg', { type: 'image/jpeg' })
                handleFile(f)
                setIsUrlMode(false)
                setUrlInputValue('')
              }
            }, 'image/jpeg', 0.95)
          }
        }
        img.onerror = () => alert('Unable to load image from URL. The host may block cross-origin access.')
        img.src = urlInputValue
      } catch (err) {
        alert('Failed to load image from URL')
      }
    } finally {
      setIsLoadingUrl(false)
    }
  }

  // Drag and Drop handlers on Landing View
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  // Ratio Preset Changer
  const handlePresetChange = (presetId: string) => {
    setSettings((prev) => ({ ...prev, aspectRatioPreset: presetId }))
    let ratio: number | null = null
    if (presetId === 'free') {
      ratio = null
    } else if (presetId === 'original') {
      ratio = origDims.width && origDims.height ? origDims.width / origDims.height : null
    } else if (presetId === 'custom') {
      ratio = customRatioW / customRatioH
    } else {
      const match = CROP_PRESETS.find((p) => p.id === presetId)
      ratio = match?.ratio ?? null
    }
    fitCropToRatio(ratio, origDims.width, origDims.height)
  }

  // Handle custom ratio input changes
  const handleCustomRatioWChange = (val: number) => {
    const safeVal = Math.max(1, val)
    setCustomRatioW(safeVal)
    fitCropToRatio(safeVal / customRatioH, origDims.width, origDims.height)
  }

  const handleCustomRatioHChange = (val: number) => {
    const safeVal = Math.max(1, val)
    setCustomRatioH(safeVal)
    fitCropToRatio(customRatioW / safeVal, origDims.width, origDims.height)
  }

  // Direct numeric input adjustments for Width, Height, Position X, Position Y
  const handleWidthInputChange = (val: number) => {
    const newW = Math.max(10, Math.min(origDims.width, val))
    const ratio = getActiveRatio()
    let newH = crop.height
    if (ratio !== null) {
      newH = Math.max(10, Math.min(origDims.height, Math.round(newW / ratio)))
    }
    // Always keep selector centered in the middle
    const newX = Math.max(0, Math.round((origDims.width - newW) / 2))
    const newY = Math.max(0, Math.round((origDims.height - newH) / 2))
    setCrop({ x: newX, y: newY, width: newW, height: newH })
  }

  const handleHeightInputChange = (val: number) => {
    const newH = Math.max(10, Math.min(origDims.height, val))
    const ratio = getActiveRatio()
    let newW = crop.width
    if (ratio !== null) {
      newW = Math.max(10, Math.min(origDims.width, Math.round(newH * ratio)))
    }
    // Always keep selector centered in the middle
    const newX = Math.max(0, Math.round((origDims.width - newW) / 2))
    const newY = Math.max(0, Math.round((origDims.height - newH) / 2))
    setCrop({ x: newX, y: newY, width: newW, height: newH })
  }

  const centerSelector = () => {
    if (!origDims.width || !origDims.height) return
    const x = Math.max(0, Math.round((origDims.width - crop.width) / 2))
    const y = Math.max(0, Math.round((origDims.height - crop.height) / 2))
    setCrop((prev) => ({ ...prev, x, y }))
  }

  const handlePositionXChange = (val: number) => {
    const maxX = Math.max(0, origDims.width - crop.width)
    const newX = Math.max(0, Math.min(maxX, val))
    setCrop((prev) => ({ ...prev, x: newX }))
  }

  const handlePositionYChange = (val: number) => {
    const maxY = Math.max(0, origDims.height - crop.height)
    const newY = Math.max(0, Math.min(maxY, val))
    setCrop((prev) => ({ ...prev, y: newY }))
  }

  // Pointer dragging on Crop Box & 8 Handles
  const startDrag = (e: React.PointerEvent, action: HandleDirection) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDragState({
      action,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState || !imgRef.current) return
    e.preventDefault()

    const imgEl = imgRef.current
    const rect = imgEl.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const scaleX = origDims.width / rect.width
    const scaleY = origDims.height / rect.height

    const deltaX = (e.clientX - dragState.startX) * scaleX
    const deltaY = (e.clientY - dragState.startY) * scaleY
    const { action, startCrop } = dragState
    const ratio = getActiveRatio()

    const origW = origDims.width
    const origH = origDims.height

    if (action === 'move') {
      const maxX = origW - startCrop.width
      const maxY = origH - startCrop.height
      const nextX = Math.round(Math.max(0, Math.min(maxX, startCrop.x + deltaX)))
      const nextY = Math.round(Math.max(0, Math.min(maxY, startCrop.y + deltaY)))
      setCrop({
        ...startCrop,
        x: nextX,
        y: nextY,
      })
      return
    }

    let nextX = startCrop.x
    let nextY = startCrop.y
    let nextW = startCrop.width
    let nextH = startCrop.height

    if (action.includes('e')) {
      nextW = Math.max(20, Math.min(origW - startCrop.x, startCrop.width + deltaX))
    }
    if (action.includes('s')) {
      nextH = Math.max(20, Math.min(origH - startCrop.y, startCrop.height + deltaY))
    }
    if (action.includes('w')) {
      const maxW = startCrop.x + startCrop.width
      nextW = Math.max(20, Math.min(maxW, startCrop.width - deltaX))
      nextX = startCrop.x + (startCrop.width - nextW)
    }
    if (action.includes('n')) {
      const maxH = startCrop.y + startCrop.height
      nextH = Math.max(20, Math.min(maxH, startCrop.height - deltaY))
      nextY = startCrop.y + (startCrop.height - nextH)
    }

    // Apply aspect ratio constraints if locked
    if (ratio !== null) {
      if (action === 'e' || action === 'w') {
        nextH = Math.max(20, Math.min(origH, Math.round(nextW / ratio)))
        nextY = Math.max(0, Math.min(origH - nextH, Math.round(startCrop.y + (startCrop.height - nextH) / 2)))
      } else if (action === 's' || action === 'n') {
        nextW = Math.max(20, Math.min(origW, Math.round(nextH * ratio)))
        nextX = Math.max(0, Math.min(origW - nextW, Math.round(startCrop.x + (startCrop.width - nextW) / 2)))
      } else {
        // Corner handles
        if (nextW / ratio > origH - nextY) {
          nextW = Math.round((origH - nextY) * ratio)
        }
        nextH = Math.round(nextW / ratio)

        if (action.includes('n')) {
          nextY = startCrop.y + (startCrop.height - nextH)
        }
        if (action.includes('w')) {
          nextX = startCrop.x + (startCrop.width - nextW)
        }
      }
    }

    setCrop({
      x: Math.round(Math.max(0, Math.min(origW - nextW, nextX))),
      y: Math.round(Math.max(0, Math.min(origH - nextH, nextY))),
      width: Math.round(nextW),
      height: Math.round(nextH),
    })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragState) {
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {}
      setDragState(null)
    }
  }

  // Execute Crop & Immediate Download
  const handleCropAndDownload = async () => {
    if (!loadedImg || !file) return
    setIsExporting(true)
    try {
      const result = await exportCroppedImage(loadedImg, crop, settings, file.name)
      downloadSingleFile(result.blob, result.filename)
      setToastMsg(`Cropped successfully! Saved ${result.filename} (${formatBytes(result.size)})`)
      setShowToast(true)
      window.setTimeout(() => setShowToast(false), 3800)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cropping failed')
    } finally {
      setIsExporting(false)
    }
  }

  // Clear / Reset workspace
  const handleReset = () => {
    const ratio = getActiveRatio()
    fitCropToRatio(ratio, origDims.width, origDims.height)
  }

  const handleClear = () => {
    if (imgUrl) URL.revokeObjectURL(imgUrl)
    setFile(null)
    setLoadedImg(null)
    setImgUrl('')
    setOrigDims({ width: 0, height: 0 })
    setCrop({ x: 0, y: 0, width: 0, height: 0 })
  }

  // Rotation & Flip Toolbar actions
  const handleRotateCw = () => {
    setSettings((s) => ({ ...s, rotation: (s.rotation + 90) % 360 }))
  }

  const handleRotateCcw = () => {
    setSettings((s) => ({ ...s, rotation: (s.rotation - 90 + 360) % 360 }))
  }

  const handleFlipH = () => {
    setSettings((s) => ({ ...s, flipH: !s.flipH }))
  }

  const handleFlipV = () => {
    setSettings((s) => ({ ...s, flipV: !s.flipV }))
  }

  // Calculate box display coordinates in exact percentage of image container
  const pctLeft = origDims.width ? (crop.x / origDims.width) * 100 : 0
  const pctTop = origDims.height ? (crop.y / origDims.height) * 100 : 0
  const pctWidth = origDims.width ? (crop.width / origDims.width) * 100 : 0
  const pctHeight = origDims.height ? (crop.height / origDims.height) * 100 : 0

  return (
    <div className="image-cropper-page">
      {/* =========================================================================
          LANDING / DROPZONE VIEW (When no image is loaded)
          ========================================================================= */}
      {!file && (
        <div className="icr-landing-hero">
          <div className="icr-landing-header">
            <h1>Crop Image</h1>
            <p>Quickly crop image files online for free!</p>
          </div>

          <div
            className={`icr-dropzone-box ${isDragging ? 'drag-over' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="icr-dropzone-icon">
              <Crop size={36} />
            </div>

            {/* In-place URL mode or Standard Split-Button */}
            {isUrlMode ? (
              <div className="icr-url-box">
                <button
                  type="button"
                  className="icr-url-btn-back"
                  onClick={() => setIsUrlMode(false)}
                >
                  &larr; Back
                </button>
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadFromUrl()}
                  autoFocus
                />
                <button
                  type="button"
                  className="icr-url-btn-go"
                  onClick={handleLoadFromUrl}
                  disabled={isLoadingUrl}
                >
                  {isLoadingUrl ? 'Loading...' : 'Go'}
                </button>
              </div>
            ) : (
              <div className="icr-dropzone-btn-split">
                <button
                  type="button"
                  className="icr-dropzone-btn-main"
                  data-testid="device-upload-direct"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={18} />
                  <span>Select Image</span>
                </button>
                <button
                  type="button"
                  className="icr-dropzone-btn-arrow"
                  aria-label="Upload options"
                  onClick={() => setShowUploadMenu((prev) => !prev)}
                >
                  <ChevronDown size={18} />
                </button>

                {showUploadMenu && (
                  <div className="icr-upload-menu">
                    <button
                      type="button"
                      className="icr-upload-menu-item"
                      onClick={() => {
                        setShowUploadMenu(false)
                        fileInputRef.current?.click()
                      }}
                    >
                      <Upload size={15} />
                      <span>From Device</span>
                    </button>
                    <button
                      type="button"
                      className="icr-upload-menu-item"
                      onClick={() => {
                        setShowUploadMenu(false)
                        setIsUrlMode(true)
                      }}
                    >
                      <Link to="#" onClick={(e) => e.preventDefault()} style={{ display: 'none' }} />
                      <SlidersHorizontal size={15} />
                      <span>From URL</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="icr-dropzone-hint">or, drag and drop an image here</div>
            <div className="icr-dropzone-limits">
              Max file size: 100 MB · 100% private in-browser processing
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileInputChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          EDITOR WORKSPACE (When image is loaded)
          ========================================================================= */}
      {file && (
        <div className="icr-studio-wrapper">
          <div className="icr-studio-container">
            {/* Left Sidebar Controls */}
            <aside className="icr-sidebar">
              <div className="icr-sidebar-header">
                <h2 className="icr-sidebar-title" data-testid="crop-settings-title">
                  Crop Rectangle
                </h2>
                <span className="icr-sidebar-badge">
                  {origDims.width} × {origDims.height} px
                </span>
              </div>

              {/* Crop Rectangle Width & Height (Side-by-Side) */}
              <div className="icr-form-group">
                <div className="icr-input-row">
                  <div className="icr-input-col">
                    <label className="icr-form-label" data-testid="width-input-label">
                      Width
                    </label>
                    <input
                      type="number"
                      className="icr-text-input"
                      data-testid="width-input"
                      min={10}
                      max={origDims.width}
                      value={crop.width}
                      onChange={(e) => handleWidthInputChange(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="icr-input-col">
                    <label className="icr-form-label" data-testid="height-input-label">
                      Height
                    </label>
                    <input
                      type="number"
                      className="icr-text-input"
                      data-testid="height-input"
                      min={10}
                      max={origDims.height}
                      value={crop.height}
                      onChange={(e) => handleHeightInputChange(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Aspect Ratio Presets Selector */}
              <div className="icr-form-group">
                <label className="icr-form-label" data-testid="crop-settings-crop-ratio-label">
                  Aspect Ratio
                </label>
                <div className="icr-select-wrap">
                  <select
                    className="icr-select"
                    id="crop-settings-crop-ratio"
                    value={settings.aspectRatioPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                  >
                    <optgroup label="Standard Modes">
                      <option value="free">FreeForm</option>
                      <option value="original">Original ({origDims.width}:{origDims.height})</option>
                      <option value="custom">Custom Ratio</option>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="4:3">4:3 (Monitor)</option>
                      <option value="14:9">14:9</option>
                      <option value="16:9">16:9 (Widescreen)</option>
                      <option value="16:10">16:10</option>
                      <option value="2:1">2:1</option>
                      <option value="3:1">3:1 (Panorama)</option>
                      <option value="4:1">4:1</option>
                      <option value="3:2">3:2 (35mm film)</option>
                      <option value="5:4">5:4</option>
                      <option value="7:5">7:5</option>
                      <option value="4:5">4:5 (Vertical Portrait)</option>
                      <option value="9:16">9:16 (Story / Reel)</option>
                      <option value="19:10">19:10</option>
                      <option value="21:9">21:9 (Cinemascope)</option>
                      <option value="32:9">32:9 (Super Ultra Wide)</option>
                    </optgroup>
                    <optgroup label="Social Media">
                      <option value="fb-profile">Facebook profile 170x170</option>
                      <option value="fb-cover">Facebook cover 820x312</option>
                      <option value="fb-post">Facebook post 1200x900</option>
                      <option value="fb-ad">Facebook ad 1280x720</option>
                      <option value="ig-profile">Instagram profile 110x110</option>
                      <option value="ig-post">Instagram post 1080x1080</option>
                      <option value="ig-story">Instagram story 1080x1920</option>
                      <option value="twitter-profile">Twitter profile 400x400</option>
                      <option value="twitter-header">Twitter header 1500x500</option>
                      <option value="twitter-image">Twitter image 1024x512</option>
                      <option value="twitter-card">Twitter card 1200x628</option>
                      <option value="twitter-ad">Twitter ad 1200x675</option>
                      <option value="youtube-profile">Youtube profile 800x800</option>
                      <option value="youtube-channel-art">Youtube channel art 2560x1440</option>
                      <option value="youtube-thumb">Youtube thumb 1280x720</option>
                    </optgroup>
                    <optgroup label="Web &amp; Screen">
                      <option value="web-mini">Web mini 1024x768</option>
                      <option value="web-small">Web small 1280x800</option>
                      <option value="web-common">Web common 1366x768</option>
                      <option value="web-medium">Web medium 1440x900</option>
                      <option value="fll-hd">Full HD 1920x1080</option>
                      <option value="ultra-hd-4k">Ultra HD 4x 3840x2160</option>
                    </optgroup>
                    <optgroup label="Paper Formats">
                      <option value="paper-a4">Paper A4 2480x3508</option>
                      <option value="paper-a5">Paper A5 1748x2480</option>
                      <option value="paper-a6">Paper A6 1280x1748</option>
                      <option value="paper-letter">Paper letter 2400x3300</option>
                    </optgroup>
                  </select>
                  <ChevronDown size={16} className="icr-select-chevron" />
                </div>

                {/* Custom Ratio Inputs (Revealed when Custom is selected) */}
                {settings.aspectRatioPreset === 'custom' && (
                  <div className="icr-custom-ratio-box">
                    <label>Custom Aspect Ratio</label>
                    <div className="icr-input-row">
                      <div className="icr-input-col">
                        <span className="icr-input-sublabel">Ratio (X)</span>
                        <input
                          type="number"
                          className="icr-text-input"
                          data-testid="crop-settings-left"
                          min={1}
                          value={customRatioW}
                          onChange={(e) => handleCustomRatioWChange(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="icr-input-col">
                        <span className="icr-input-sublabel">Ratio (Y)</span>
                        <input
                          type="number"
                          className="icr-text-input"
                          data-testid="crop-settings-top"
                          min={1}
                          value={customRatioH}
                          onChange={(e) => handleCustomRatioHChange(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Crop Position Inputs (Position Y and Position X) */}
              <div className="icr-form-group">
                <label className="icr-form-label">Crop Position</label>
                <div className="icr-input-row">
                  <div className="icr-input-col">
                    <span className="icr-input-sublabel">Position · (Y)</span>
                    <input
                      type="number"
                      className="icr-text-input"
                      data-testid="top-input"
                      min={0}
                      max={Math.max(0, origDims.height - crop.height)}
                      value={crop.y}
                      onChange={(e) => handlePositionYChange(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="icr-input-col">
                    <span className="icr-input-sublabel">Position · (X)</span>
                    <input
                      type="number"
                      className="icr-text-input"
                      data-testid="left-input"
                      min={0}
                      max={Math.max(0, origDims.width - crop.width)}
                      value={crop.x}
                      onChange={(e) => handlePositionXChange(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Output Format & Quality (Compact inline row) */}
              <div className="icr-form-group">
                <label className="icr-form-label">Format &amp; Quality</label>
                <div className="icr-format-quality-row">
                  <div className="icr-select-wrap">
                    <select
                      className="icr-select"
                      value={settings.format}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, format: e.target.value as CropSettings['format'] }))
                      }
                    >
                      <option value="jpeg">JPG / JPEG</option>
                      <option value="png">PNG (Lossless)</option>
                      <option value="webp">WebP</option>
                    </select>
                    <ChevronDown size={15} className="icr-select-chevron" />
                  </div>
                  {settings.format !== 'png' && (
                    <div className="icr-quality-mini-box">
                      <div className="icr-quality-mini-header">
                        <span>Quality</span>
                        <strong>{settings.quality}%</strong>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={100}
                        className="icr-range-slider"
                        value={settings.quality}
                        onChange={(e) => setSettings((s) => ({ ...s, quality: parseInt(e.target.value) }))}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Reset & Crop CTA */}
              <div className="icr-sidebar-actions">
                <button
                  type="button"
                  className="icr-btn-reset"
                  data-testid="crop-reset-button"
                  onClick={handleReset}
                >
                  <RefreshCw size={14} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  className="icr-btn-crop-primary"
                  data-testid="crop-button"
                  onClick={handleCropAndDownload}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw size={18} className="spinning" />
                      <span>Cropping...</span>
                    </>
                  ) : (
                    <>
                      <span>Crop &amp; Download</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </aside>

            {/* Right Interactive Canvas Workspace */}
            <main className="icr-canvas-area">
              <div className="icr-canvas-topbar">
                <div className="icr-canvas-meta">
                  <div className="icr-crop-badge">
                    <Crop size={14} />
                    <span>{crop.width} × {crop.height} px</span>
                  </div>
                  <span className="icr-canvas-orig-meta">
                    {file.name} ({formatBytes(file.size)})
                  </span>
                </div>

                {/* Transform, Grid, Center & Canvas Tools */}
                <div className="icr-canvas-tools">
                  <button
                    type="button"
                    className="icr-canvas-btn"
                    title="Rotate 90° Clockwise"
                    onClick={handleRotateCw}
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    type="button"
                    className="icr-canvas-btn"
                    title="Rotate 90° Counter-Clockwise"
                    onClick={handleRotateCcw}
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    type="button"
                    className={`icr-canvas-btn ${settings.flipH ? 'active' : ''}`}
                    title="Flip Horizontally"
                    onClick={handleFlipH}
                  >
                    <FlipHorizontal size={14} />
                  </button>
                  <button
                    type="button"
                    className={`icr-canvas-btn ${settings.flipV ? 'active' : ''}`}
                    title="Flip Vertically"
                    onClick={handleFlipV}
                  >
                    <FlipVertical size={14} />
                  </button>
                  <button
                    type="button"
                    className={`icr-canvas-btn ${settings.showGrid ? 'active' : ''}`}
                    title="Toggle 3x3 Grid"
                    onClick={() => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
                  >
                    <Grid3X3 size={14} />
                  </button>
                  <button
                    type="button"
                    className="icr-canvas-btn"
                    title="Center selector in the middle"
                    onClick={centerSelector}
                  >
                    <Maximize2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="icr-canvas-btn"
                    title="Choose a different image"
                    onClick={handleClear}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Viewport Box */}
              <div
                className="icr-viewport-box"
                ref={containerRef}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                <div className="icr-image-container">
                  <img
                    ref={imgRef}
                    src={imgUrl}
                    alt="The image to crop"
                    className="icr-stage-img"
                    style={{
                      transform: `rotate(${settings.rotation}deg) scale(${settings.flipH ? -1 : 1}, ${settings.flipV ? -1 : 1})`,
                    }}
                  />

                  {/* Dimmed Overlay outside Crop Area */}
                  <div className="icr-mask-overlay" />

                  {/* Interactive Crop Bounding Box */}
                  <div
                    className="icr-crop-box"
                    style={{
                      left: `${pctLeft}%`,
                      top: `${pctTop}%`,
                      width: `${pctWidth}%`,
                      height: `${pctHeight}%`,
                    }}
                    onPointerDown={(e) => startDrag(e, 'move')}
                  >
                    {/* Floating size badge */}
                    <div className="icr-floating-size">
                      {crop.width} × {crop.height} px
                    </div>

                    {/* Rule of Thirds Grid Lines & Crosshair */}
                    {settings.showGrid && (
                      <>
                        <div className="icr-grid-line-v1" />
                        <div className="icr-grid-line-v2" />
                        <div className="icr-grid-line-h1" />
                        <div className="icr-grid-line-h2" />
                        <div className="icr-grid-crosshair" />
                      </>
                    )}

                    {/* 8 Drag Handles */}
                    <div className="icr-handle icr-handle-nw" onPointerDown={(e) => startDrag(e, 'nw')} />
                    <div className="icr-handle icr-handle-n"  onPointerDown={(e) => startDrag(e, 'n')} />
                    <div className="icr-handle icr-handle-ne" onPointerDown={(e) => startDrag(e, 'ne')} />
                    <div className="icr-handle icr-handle-e"  onPointerDown={(e) => startDrag(e, 'e')} />
                    <div className="icr-handle icr-handle-se" onPointerDown={(e) => startDrag(e, 'se')} />
                    <div className="icr-handle icr-handle-s"  onPointerDown={(e) => startDrag(e, 's')} />
                    <div className="icr-handle icr-handle-sw" onPointerDown={(e) => startDrag(e, 'sw')} />
                    <div className="icr-handle icr-handle-w"  onPointerDown={(e) => startDrag(e, 'w')} />
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {showToast && (
        <div className="icr-success-toast">
          <Check size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* =========================================================================
          CONTENT SECTIONS DOWN TO THE TOOL (Preserved 100%)
          ========================================================================= */}
      <div className="icr-content-wrapper">
        {/* Step-by-Step Instructions */}
        <section className="icr-section" aria-labelledby="icr-howto-heading">
          <div className="icr-section-head">
            <span className="icr-section-kicker">STEP-BY-STEP WORKFLOW</span>
            <h2 id="icr-howto-heading">How to Crop Images Online?</h2>
            <p>Frame and crop any photo in four simple steps:</p>
          </div>

          <div className="icr-steps-grid">
            <div className="icr-step-card">
              <span className="icr-step-num">01</span>
              <div className="icr-step-icon">
                <Upload size={20} />
              </div>
              <h3>Upload Photo</h3>
              <p>Drag and drop your image file or browse from your device.</p>
            </div>

            <div className="icr-step-card">
              <span className="icr-step-num">02</span>
              <div className="icr-step-icon">
                <SlidersHorizontal size={20} />
              </div>
              <h3>Choose Ratio</h3>
              <p>Pick a preset like 1:1, 4:5, 16:9, or keep it custom freeform.</p>
            </div>

            <div className="icr-step-card">
              <span className="icr-step-num">03</span>
              <div className="icr-step-icon">
                <Wand2 size={20} />
              </div>
              <h3>Adjust Bounding Box</h3>
              <p>Drag the crop handles and reposition the frame over your subject.</p>
            </div>

            <div className="icr-step-card">
              <span className="icr-step-num">04</span>
              <div className="icr-step-icon">
                <Download size={20} />
              </div>
              <h3>Download Result</h3>
              <p>Click "Crop &amp; Download" to save the high-resolution cropped file.</p>
            </div>
          </div>
        </section>

        {/* Educational Content: Composition Rules */}
        <section className="icr-section" aria-labelledby="icr-edu-heading">
          <div className="icr-section-head">
            <span className="icr-section-kicker">EDUCATIONAL GUIDE</span>
            <h2 id="icr-edu-heading">Why Proper Image Cropping Matters</h2>
            <p>
              Cropping isn't just about trimming edges—it's an essential storytelling technique that directs viewer focus:
            </p>
          </div>

          <div className="icr-cards-grid">
            <div className="icr-feature-card">
              <h3>Rule of Thirds Alignment</h3>
              <p>
                By positioning subjects along the 3×3 intersection lines, your photo immediately gains narrative depth and visual interest compared to simple dead-center framing.
              </p>
            </div>

            <div className="icr-feature-card">
              <h3>Eliminate Background Distractions</h3>
              <p>
                Trim away photobombers, stray signs, power lines, and unnecessary clutter to ensure the viewer's eyes immediately lock onto your central subject.
              </p>
            </div>

            <div className="icr-feature-card">
              <h3>Platform-Specific Framing</h3>
              <p>
                Social feeds crop content dynamically. By cropping to standard aspect ratios (like 4:5 on Instagram or 16:9 on YouTube) beforehand, you ensure key details never get sliced off.
              </p>
            </div>
          </div>
        </section>

        {/* Real Before-and-After Example */}
        <section className="icr-section" aria-labelledby="icr-example-heading">
          <div className="icr-section-head">
            <span className="icr-section-kicker">REAL-WORLD BENCHMARK</span>
            <h2 id="icr-example-heading">Before-and-After: Wide Landscape to 1:1 Profile Avatar</h2>
            <p>
              See how cropping transforms a distant landscape shot into an impactful personal profile portrait:
            </p>
          </div>

          <div className="icr-example-box">
            <div className="icr-example-metrics">
              <div className="icr-metric-card">
                <span className="icr-metric-tag">Original Shot (16:9 Wide)</span>
                <div className="icr-metric-size">3840 × 2160</div>
                <ul>
                  <li><strong>Subject Size:</strong> Only 15% of frame</li>
                  <li><strong>Background:</strong> Distracting empty skies and trees</li>
                  <li><strong>Avatar Preview:</strong> Face too tiny to recognize</li>
                  <li><strong>Focus:</strong> Diluted</li>
                </ul>
              </div>

              <div className="icr-metric-arrow">
                <span className="ir-arrow-badge">Tight 1:1 Focus</span>
              </div>

              <div className="icr-metric-card">
                <span className="icr-metric-tag success">Cropped Avatar (1:1 Square)</span>
                <div className="icr-metric-size success">1600 × 1600</div>
                <ul>
                  <li><strong>Subject Size:</strong> 85% of frame</li>
                  <li><strong>Background:</strong> Clean, focused portrait framing</li>
                  <li><strong>Avatar Preview:</strong> Instantly recognizable across feeds</li>
                  <li><strong>Focus:</strong> Professional &amp; clear</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Practical Use Cases */}
        <section className="icr-section" aria-labelledby="icr-usecases-heading">
          <div className="icr-section-head">
            <span className="icr-section-kicker">APPLICATIONS</span>
            <h2 id="icr-usecases-heading">Practical Use Cases for Image Cropping</h2>
            <p>Every digital creator relies on cropping for polished presentations:</p>
          </div>

          <div className="icr-cards-grid">
            <div className="icr-feature-card">
              <h3>Social Media Profile Avatars</h3>
              <p>
                Crop portraits into exact 1:1 squares for LinkedIn, Instagram, X (Twitter), and Discord profile circles without awkward off-center auto-cuts.
              </p>
            </div>

            <div className="icr-feature-card">
              <h3>E-Commerce Product Framing</h3>
              <p>
                Center shoes, jewelry, and products uniformly within square or 4:5 bounding boxes to create sleek catalog grids that boost sales conversion.
              </p>
            </div>

            <div className="icr-feature-card">
              <h3>Passport &amp; Official ID Standards</h3>
              <p>
                Crop government and visa passport photos to standard 2×2 inch (600×600 px) squares with accurate head-to-chin proportions.
              </p>
            </div>

            <div className="icr-feature-card">
              <h3>YouTube &amp; Blog Hero Banners</h3>
              <p>
                Frame panoramic shots to strict 16:9 widescreen dimensions for crisp video thumbnails and responsive blog hero headers.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="icr-section" aria-labelledby="icr-faqs-heading">
          <div className="icr-section-head">
            <span className="icr-section-kicker">COMMON QUESTIONS</span>
            <h2 id="icr-faqs-heading">Frequently Asked Questions</h2>
            <p>Common questions about cropping pictures with ImgMojo:</p>
          </div>

          <div className="icr-faq-grid">
            {CROPPER_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={faq.question} className="icr-faq-item">
                  <button
                    type="button"
                    className="icr-faq-btn"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div className="icr-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Privacy & File Security */}
        <section className="icr-section" aria-labelledby="icr-security-heading">
          <div className="icr-section-head">
            <span className="icr-section-kicker" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
              <ShieldCheck size={14} /> PRIVACY &amp; FILE SECURITY
            </span>
            <h2 id="icr-security-heading">Is It Safe to Crop Photos Online?</h2>
            <p>
              Yes, ImgMojo's Image Cropper works 100% on your local machine inside your browser. No files are ever sent to our servers.
            </p>
          </div>

          <div className="icr-cards-grid">
            <div className="icr-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Client-Side Browser Execution</h3>
              </div>
              <p>
                All canvas slicing, rotation, and transformation runs locally in your device's memory. No network uploads occur.
              </p>
            </div>

            <div className="icr-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Lock size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Zero Cloud Storage</h3>
              </div>
              <p>
                We do not maintain server storage. Your private pictures exist solely in your active browser session.
              </p>
            </div>

            <div className="icr-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock3 size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Zero Retention Duration</h3>
              </div>
              <p>
                Server retention is strictly 0 seconds. Once you close this window or change images, memory buffers are permanently freed.
              </p>
            </div>

            <div className="icr-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Mail size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Privacy Inquiries</h3>
              </div>
              <p>
                For details on our client-side architecture, read our <Link to="/privacy" style={{ color: 'var(--icr-brand)', textDecoration: 'underline' }}>Privacy Policy</Link> or reach out through our <Link to="/contact" style={{ color: 'var(--icr-brand)', textDecoration: 'underline' }}>Contact Page</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Related Tools Internal Navigation */}
        <section className="icr-section" aria-labelledby="icr-related-heading">
          <div className="icr-section-head">
            <span className="icr-section-kicker">EXPLORE MORE TOOLS</span>
            <h2 id="icr-related-heading">Explore More Image Tools</h2>
            <p>Discover other free browser-based creative tools from ImgMojo:</p>
          </div>

          <div className="icr-tools-nav-grid">
            {/* Tool: Compressor */}
            <div className="icr-tool-card">
              <div className="icr-tool-card-img-wrap">
                <img
                  src="https://images.openai.com/static-rsc-4/VFaspxX-JR677tnZRlkDdOGGHmPghimBwmPk3Xsw_NZ1LWnKoAXLCEIYevklP5PbejGW7TNyT3h0fO4oQ6Xa4wnxuqdhWX5Dqa3zXqxPN-IsttpfwigQg80q-QimpXUIsBWA-ImXlOdN8jBd8LP7hHkOJqD3U9Q_m9AJecqER10wz5iAhdagxuL2jNtlEsp7?purpose=inline"
                  alt="Compress Images Online"
                  className="icr-tool-card-img"
                  loading="lazy"
                />
              </div>
              <div className="icr-tool-card-body">
                <h3>Image Compressor</h3>
                <p>Reduce image file sizes by up to 80% without losing visible quality.</p>
                <Link to="/compress-image" className="icr-tool-card-link">
                  <span>Compress Images</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Tool: Resizer */}
            <div className="icr-tool-card">
              <div className="icr-tool-card-img-wrap">
                <img
                  src="https://images.openai.com/static-rsc-4/NsZfPIKBQoa62Rwu0OuMLX-bBWUHCyi2DRP1Xq7TU7It15XtMqgmCKQYnu_2q_GKmzvDggxfwHY7vPq31qUHqWmyBSBAlO6aTLBHCGaGl47HO39TZSwxSPX_cYRpIDow4UXU0uBZ6npwcQhhWPDBgtB4DPZivZaRX6fGieXbNV_OYp0iYEF9nHUWrPpNvUyG?purpose=inline"
                  alt="Resize Images Online"
                  className="icr-tool-card-img"
                  loading="lazy"
                />
              </div>
              <div className="icr-tool-card-body">
                <h3>Image Resizer</h3>
                <p>Resize pixel dimensions or scale images by percentage with aspect ratio lock.</p>
                <Link to="/image-resizer" className="icr-tool-card-link">
                  <span>Resize Image</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Tool: Converter */}
            <div className="icr-tool-card">
              <div className="icr-tool-card-img-wrap">
                <img
                  src="https://images.openai.com/static-rsc-4/wnAra42oxkRFPJE-OaW5JWW01ussZngQ1s19oQOpFh3JihpG983AkbCNOKvvNnzuaiZjUQ3V65JIw0cPsHbFEE5jAUDnIpiynVOkXwTehoLRF3vh1x1mwLcAtbN1uNakb--jM4NZtQtAxwCzWXgJXIWuZj9993y6qTp9IFweycc?purpose=inline"
                  alt="Convert Image Format Online Free — JPG, PNG, WebP"
                  className="icr-tool-card-img"
                  loading="lazy"
                />
              </div>
              <div className="icr-tool-card-body">
                <h3>Image Converter</h3>
                <p>Convert images between JPG, PNG, WebP, AVIF, and GIF formats instantly.</p>
                <Link to="/image-converter" className="icr-tool-card-link">
                  <span>Convert Format</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
