import { useState, useRef, useEffect, useCallback, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  Download,
  Trash2,
  Plus,
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
} from 'lucide-react'
import type { CropArea, CropSettings, AspectRatioPreset } from './types'
import {
  CROP_PRESETS,
  loadImage,
  exportCroppedImage,
  downloadSingleFile,
  formatBytes,
  getFileExtension,
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

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [imgUrl, setImgUrl] = useState<string>('')
  const [origDims, setOrigDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number>(0)

  // Crop Box in normalized coordinates [0, 1] relative to the image
  const [normCrop, setNormCrop] = useState<CropArea>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })

  // Active interaction drag state
  const [dragAction, setDragAction] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [initialCrop, setInitialCrop] = useState<CropArea>(normCrop)

  const [settings, setSettings] = useState<CropSettings>({
    aspectRatioPreset: 'free',
    format: 'jpeg',
    quality: 90,
    rotation: 0,
    flipH: false,
    flipV: false,
    showGrid: true,
  })

  // Exported result
  const [result, setResult] = useState<{
    blob: Blob
    url: string
    size: number
    width: number
    height: number
    filename: string
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = 'Free Online Image Cropper – Crop & Frame Photos | ImgMojo'
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Crop photos online to exact social media aspect ratios (1:1, 4:5, 16:9, 9:16) with ImgMojo. 100% free, private browser-based cropping with zero quality loss.'
      )
    }

    // Preload default sample portrait so cropper is never empty and image is clearly shown
    let cancelled = false
    const loadDefault = async () => {
      try {
        const resp = await fetch('/sample-portrait.jpg')
        if (!resp.ok) return
        const blob = await resp.blob()
        if (cancelled) return
        const sampleFile = new File([blob], 'sample-portrait.jpg', { type: 'image/jpeg' })
        const data = await loadImage(sampleFile)
        if (cancelled) return
        setFile(sampleFile)
        setLoadedImg(data.img)
        setImgUrl(data.url)
        setOrigDims({ width: data.width, height: data.height })
        setNormCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })
        setResult(null)
      } catch (err) {
        console.error('Error preloading cropper image', err)
      }
    }

    void loadDefault()
    return () => {
      cancelled = true
    }
  }, [])

  const handleFile = async (selected: File) => {
    if (!selected.type.startsWith('image/')) return
    try {
      const data = await loadImage(selected)
      setFile(selected)
      setLoadedImg(data.img)
      setImgUrl(data.url)
      setOrigDims({ width: data.width, height: data.height })
      setNormCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })
      setResult(null)
    } catch (err) {
      console.error('Error loading image', err)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files[0]) void handleFile(e.dataTransfer.files[0])
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) void handleFile(e.target.files[0])
    if (e.target) e.target.value = ''
  }

  const clearImage = () => {
    if (imgUrl) URL.revokeObjectURL(imgUrl)
    if (result?.url) URL.revokeObjectURL(result.url)
    setFile(null)
    setLoadedImg(null)
    setImgUrl('')
    setResult(null)
  }

  // Preset Ratio Adjustment
  const setPresetRatio = (presetId: AspectRatioPreset) => {
    const preset = CROP_PRESETS.find((p) => p.id === presetId)
    setSettings((s) => ({ ...s, aspectRatioPreset: presetId }))

    if (!preset || preset.ratio === null || origDims.width === 0) return

    const imgRatio = origDims.width / origDims.height
    const targetRatio = preset.ratio

    // Calculate crop dimensions maintaining target aspect ratio inside image
    let normW = 0.8
    let normH = normW * (imgRatio / targetRatio)

    if (normH > 0.9) {
      normH = 0.8
      normW = normH * (targetRatio / imgRatio)
    }

    normW = Math.min(0.95, Math.max(0.1, normW))
    normH = Math.min(0.95, Math.max(0.1, normH))

    setNormCrop({
      x: (1 - normW) / 2,
      y: (1 - normH) / 2,
      width: normW,
      height: normH,
    })
  }

  // Pointer drag events for crop box
  const startDrag = (action: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragAction(action)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialCrop(normCrop)
  }

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragAction || !imgRef.current) return
      const rect = imgRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const deltaX = (e.clientX - dragStart.x) / rect.width
      const deltaY = (e.clientY - dragStart.y) / rect.height

      let { x, y, width, height } = initialCrop

      if (dragAction === 'move') {
        x = Math.max(0, Math.min(1 - width, initialCrop.x + deltaX))
        y = Math.max(0, Math.min(1 - height, initialCrop.y + deltaY))
      } else {
        // Handle resizing
        if (dragAction.includes('e')) width = Math.max(0.05, Math.min(1 - x, initialCrop.width + deltaX))
        if (dragAction.includes('s')) height = Math.max(0.05, Math.min(1 - y, initialCrop.height + deltaY))
        if (dragAction.includes('w')) {
          const newW = Math.max(0.05, initialCrop.width - deltaX)
          const newX = initialCrop.x + (initialCrop.width - newW)
          if (newX >= 0) {
            x = newX
            width = newW
          }
        }
        if (dragAction.includes('n')) {
          const newH = Math.max(0.05, initialCrop.height - deltaY)
          const newY = initialCrop.y + (initialCrop.height - newH)
          if (newY >= 0) {
            y = newY
            height = newH
          }
        }
      }

      setNormCrop({ x, y, width, height })
    },
    [dragAction, dragStart, initialCrop]
  )

  const onPointerUp = useCallback(() => {
    setDragAction(null)
  }, [])

  useEffect(() => {
    if (dragAction) {
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      return () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
      }
    }
  }, [dragAction, onPointerMove, onPointerUp])

  // Actual pixel dimensions of current crop
  const pixelCrop: CropArea = {
    x: Math.round(normCrop.x * origDims.width),
    y: Math.round(normCrop.y * origDims.height),
    width: Math.round(normCrop.width * origDims.width),
    height: Math.round(normCrop.height * origDims.height),
  }

  const handleExport = async () => {
    if (!loadedImg || !file || isExporting) return
    setIsExporting(true)
    try {
      const res = await exportCroppedImage(loadedImg, pixelCrop, settings, file.name)
      setResult(res)
      downloadSingleFile(res.blob, res.filename)
    } catch (err) {
      console.error('Failed to export cropped image', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="image-cropper-page">
      <div className="icr-container">
        {/* Hero Head */}
        <div className="icr-hero-head">
          <span className="icr-hero-kicker">
            <Wand2 size={14} /> FREE PHOTO FRAMING TOOL
          </span>
          <h1>Free Online Image Cropper</h1>
          <p className="icr-hero-subhead">
            Crop and Frame Photos to Exact Aspect Ratios Online
          </p>
          <p className="icr-hero-intro">
            Cut out distractions, re-frame compositions, and crop photos for Instagram, YouTube, TikTok, or passports with pixel-level precision. 100% private in-browser cropping with zero quality degradation.
          </p>
        </div>

        {/* Dropzone */}
        {!file ? (
          <div
            className={`icr-dropzone ${isDragging ? 'dragging' : ''}`}
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
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            <div className="icr-dropzone-inner">
              <div className="icr-dropzone-icon">
                <Upload size={28} />
              </div>
              <h2 className="icr-dropzone-title">Drop your image here, or browse files</h2>
              <p className="icr-dropzone-sub">
                Supports JPG, PNG, WebP up to 50MB
              </p>
              <button type="button" className="icr-browse-btn">
                <Plus size={16} /> Choose Image to Crop
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Active Uploaded Image Overview Bar (Clearly shows uploaded image) */}
            {file && (
              <div className="icr-active-image-bar">
                <div className="icr-active-meta-left">
                  <img src={imgUrl} alt={file.name} className="icr-active-mini-thumb" />
                  <div>
                    <div className="icr-active-name-row">
                      <strong className="icr-active-name" title={file.name}>
                        {file.name}
                      </strong>
                      <span className="icr-active-fmt-chip">
                        {getFileExtension(file.name).toUpperCase() || 'IMAGE'}
                      </span>
                    </div>
                    <span className="icr-active-details">
                      Original: {origDims.width} × {origDims.height} px · {formatBytes(file.size)} · Crop Target: {pixelCrop.width} × {pixelCrop.height} px
                    </span>
                  </div>
                </div>
                <div className="icr-active-meta-right">
                  <button
                    type="button"
                    className="icr-active-change-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload or switch image"
                  >
                    <Upload size={14} /> Upload New Photo
                  </button>
                </div>
              </div>
            )}

            {/* Workspace */}
            <div className="icr-workspace">
            {/* Left Crop Stage */}
            <div className="icr-stage-box">
              <div className="icr-stage-toolbar">
                <div className="icr-tool-btn-group">
                  <button
                    type="button"
                    className="icr-icon-btn"
                    onClick={() => setSettings((s) => ({ ...s, rotation: (s.rotation - 90) % 360 }))}
                    title="Rotate Counter-Clockwise 90°"
                  >
                    <RotateCcw size={14} /> -90°
                  </button>
                  <button
                    type="button"
                    className="icr-icon-btn"
                    onClick={() => setSettings((s) => ({ ...s, rotation: (s.rotation + 90) % 360 }))}
                    title="Rotate Clockwise 90°"
                  >
                    <RotateCw size={14} /> +90°
                  </button>
                  <button
                    type="button"
                    className="icr-icon-btn"
                    onClick={() => setSettings((s) => ({ ...s, flipH: !s.flipH }))}
                    title="Flip Horizontally"
                  >
                    <FlipHorizontal size={14} /> Flip H
                  </button>
                  <button
                    type="button"
                    className="icr-icon-btn"
                    onClick={() => setSettings((s) => ({ ...s, flipV: !s.flipV }))}
                    title="Flip Vertically"
                  >
                    <FlipVertical size={14} /> Flip V
                  </button>
                  <button
                    type="button"
                    className={`icr-icon-btn ${settings.showGrid ? 'active' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
                    title="Toggle Rule of Thirds Grid"
                  >
                    <Grid3X3 size={14} /> Grid
                  </button>
                </div>

                <button
                  type="button"
                  className="icr-icon-btn"
                  onClick={clearImage}
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={14} /> Change Image
                </button>
              </div>

              {/* Interactive Canvas Container */}
              <div className="icr-canvas-wrap" ref={containerRef}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    ref={imgRef}
                    src={imgUrl}
                    alt="Source to crop"
                    className="icr-canvas-stage"
                    style={{
                      transform: `rotate(${settings.rotation}deg) scaleX(${settings.flipH ? -1 : 1}) scaleY(${settings.flipV ? -1 : 1})`,
                      transition: 'transform 0.2s ease',
                    }}
                  />

                  {/* Crop Box */}
                  <div
                    className="icr-crop-box"
                    style={{
                      left: `${normCrop.x * 100}%`,
                      top: `${normCrop.y * 100}%`,
                      width: `${normCrop.width * 100}%`,
                      height: `${normCrop.height * 100}%`,
                    }}
                    onPointerDown={(e) => startDrag('move', e)}
                  >
                    {/* Grid */}
                    {settings.showGrid && (
                      <>
                        <div className="icr-grid-line icr-grid-h1" />
                        <div className="icr-grid-line icr-grid-h2" />
                        <div className="icr-grid-line icr-grid-v1" />
                        <div className="icr-grid-line icr-grid-v2" />
                      </>
                    )}

                    {/* Resize handles */}
                    <div className="icr-handle nw" onPointerDown={(e) => startDrag('nw', e)} />
                    <div className="icr-handle ne" onPointerDown={(e) => startDrag('ne', e)} />
                    <div className="icr-handle sw" onPointerDown={(e) => startDrag('sw', e)} />
                    <div className="icr-handle se" onPointerDown={(e) => startDrag('se', e)} />
                    <div className="icr-handle n" onPointerDown={(e) => startDrag('n', e)} />
                    <div className="icr-handle s" onPointerDown={(e) => startDrag('s', e)} />
                    <div className="icr-handle w" onPointerDown={(e) => startDrag('w', e)} />
                    <div className="icr-handle e" onPointerDown={(e) => startDrag('e', e)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Settings Sidebar */}
            <aside className="icr-sidebar">
              <h3 className="icr-sidebar-title">
                <Wand2 size={18} /> Crop Settings
              </h3>

              {/* Aspect Ratio Presets */}
              <div className="icr-control-group">
                <label className="icr-control-label">Aspect Ratio</label>
                <div className="icr-ratio-grid">
                  {CROP_PRESETS.map((p) => {
                    const isActive = settings.aspectRatioPreset === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`icr-ratio-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setPresetRatio(p.id)}
                      >
                        <span className="icr-ratio-name">{p.name}</span>
                        <span className="icr-ratio-tag">{p.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Crop Dimensions Display */}
              <div className="icr-control-group">
                <label className="icr-control-label">Cropped Dimensions</label>
                <div className="icr-dims-display">
                  <span>Selected Area:</span>
                  <strong>{pixelCrop.width} × {pixelCrop.height} px</strong>
                </div>
              </div>

              {/* Format & Quality */}
              <div className="icr-control-group">
                <label className="icr-control-label">Output Format</label>
                <select
                  value={settings.format}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, format: e.target.value as CropSettings['format'] }))
                  }
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--icr-line)', background: 'var(--icr-surface)', color: 'var(--icr-ink)', fontWeight: 600 }}
                >
                  <option value="jpeg">JPG / JPEG (Universal)</option>
                  <option value="png">PNG (Lossless)</option>
                  <option value="webp">WebP (Modern &amp; Lightweight)</option>
                </select>
              </div>

              {settings.format !== 'png' && (
                <div className="icr-control-group">
                  <label className="icr-control-label">Output Quality: {settings.quality}%</label>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={settings.quality}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, quality: parseInt(e.target.value) }))
                    }
                  />
                </div>
              )}

              {/* Export Button */}
              <button
                type="button"
                className="icr-action-btn-main"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <RefreshCw size={16} className="spinning" /> Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Crop &amp; Download Image
                  </>
                )}
              </button>

              {/* Cropped Result Card (Shown clearly to user) */}
              {result && (
                <div className="icr-result-card">
                  <div className="icr-result-tag">✓ CROPPED IMAGE READY</div>
                  <div className="icr-result-img-box">
                    <img src={result.url} alt="Cropped output" className="icr-result-img" />
                  </div>
                  <div className="icr-result-meta">
                    <strong>{result.width} × {result.height} px</strong> · {formatBytes(result.size)}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </>
      )}

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
