import { useState, useRef, useEffect, useCallback, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  Trash2,
  Plus,
  RotateCw,
  Crop,
  X,
  Lock,
  ChevronDown,
  ArrowRight,
  Check,
  FolderArchive,
  SlidersHorizontal,
  Maximize2,
  Globe,
  Store,
  Mail,
  Sparkles,
  ShieldCheck,
  Layers,
  Wand2,
  FileText,
  Zap,
} from 'lucide-react'

function CameraIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function PrinterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
    </svg>
  )
}

function HelpIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function LinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}
import type {
  ResizedItem,
  ResizeSettings,
  DimensionUnit,
  DpiOption,
  SocialPlatform,
  OutputFormat,
  TargetSizeUnit,
  CropRect,
} from './types'
import {
  formatBytes,
  getFileExtension,
  loadImageDimensions,
  calculateTargetDimensions,
  convertUnitToPx,
  convertPxToUnit,
  resizeSingleImage,
  downloadSingleFile,
  createAndDownloadZip,
  SOCIAL_PRESETS,
} from './resizeEngine'
import './ImageResizer.css'

const RESIZER_FAQS = [
  {
    question: 'What is the difference between image resizing and image compression?',
    answer:
      'Resizing directly changes the physical pixel dimensions (width and height in pixels, inches, or centimeters) of an image, altering how large or small it renders on screens and in print. Compression, on the other hand, reduces the file size (in KB or MB) by optimizing image encoding algorithms and stripping redundant metadata without necessarily changing the pixel dimensions.',
  },
  {
    question: 'Will resizing an image reduce its visual sharpness or make it blurry?',
    answer:
      'Downscaling (reducing dimensions from large to small) retains exceptional visual sharpness because our HTML5 canvas resampling uses high-precision multi-pass bicubic smoothing. Upscaling (enlarging a low-resolution photo beyond its native capture dimensions) must synthesize new pixels through interpolation, which can introduce slight softness if enlarged too far beyond the original.',
  },
  {
    question: 'What does "Lock Aspect Ratio" do, and should I keep it enabled?',
    answer:
      'Keeping "Lock Aspect Ratio" checked guarantees that when you enter a width, the height is automatically recalculated proportionally according to the original image ratio (and vice versa). This completely prevents unwanted distortion, stretching, or squishing of faces, logos, typography, and subjects.',
  },
  {
    question: 'How does the DPI selector work when resizing in inches or centimeters?',
    answer:
      'DPI (Dots Per Inch) determines the density of pixels required for crisp physical paper printing. For commercial publishing, marketing flyers, and photo lab prints, 300 DPI is the universal high-definition standard. When you specify 4 × 6 inches at 300 DPI, ImgMojo calculates an exact 1200 × 1800 pixel canvas so your prints appear sharp and grain-free.',
  },
  {
    question: 'How do I resize an image to a specific maximum file size (e.g. under 100 KB)?',
    answer:
      'Expand the "Export Settings" accordion in the sidebar and enter your maximum threshold (e.g., 100) under "Target file size" with the unit set to KB. When exporting to JPG or WebP, our engine dynamically optimizes the compression quality using iterative binary search to guarantee your file meets or undercuts your target file size.',
  },
  {
    question: 'Can I batch resize multiple images at once and download a ZIP?',
    answer:
      'Yes! You can select or drop up to 50 images simultaneously. Every image in your queue will automatically inherit your chosen scaling dimensions, aspect ratios, or percentage adjustments. Once processed, you can download each image individually or download the complete batch packaged into an organized ZIP folder.',
  },
  {
    question: 'Are there any hidden watermarks, fees, or account requirements?',
    answer:
      'No. ImgMojo is 100% free with no watermarks added, no account signups required, and no hidden subscriptions. All image operations execute directly on your device in your web browser sandbox.',
  },
]

export default function ImageResizer() {
  const [items, setItems] = useState<ResizedItem[]>([])
  const [activeItemId, setActiveItemId] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [exportProgress, setExportProgress] = useState<number>(0)
  const [exportCompleteModal, setExportCompleteModal] = useState(false)
  const [processedResults, setProcessedResults] = useState<ResizedItem[]>([])

  // Split button dropdown state
  const [showUploadDropdown, setShowUploadDropdown] = useState(false)

  // Filter / Sort dropdown
  const [sortOption, setSortOption] = useState<'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'>('name-asc')
  const [showSortMenu, setShowSortMenu] = useState(false)

  // Modals state
  const [cropModalItem, setCropModalItem] = useState<ResizedItem | null>(null)
  const [infoModalItem, setInfoModalItem] = useState<ResizedItem | null>(null)
  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  // Crop configuration state inside Crop modal
  const [cropAspect, setCropAspect] = useState<'free' | '1:1' | '4:5' | '16:9' | '4:3'>('free')
  const [cropCoords, setCropCoords] = useState<CropRect>({ x: 0, y: 0, width: 100, height: 100 })

  // Accordion state
  const [exportSettingsOpen, setExportSettingsOpen] = useState(true)

  // Mobile sidebar drawer
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // FAQ accordion open index
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0)

  // Settings
  const [settings, setSettings] = useState<ResizeSettings>({
    mode: 'by-size',
    width: 200,
    height: 150,
    percentage: 100,
    maintainAspectRatio: true,
    unit: 'px',
    dpi: 300,
    socialPlatform: 'Facebook',
    socialPreset: 'Profile (170 X 170)',
    backgroundFill: {
      enabled: false,
      color: '#000000',
      transparent: true,
    },
    targetFileSizeEnabled: false,
    targetFileSize: undefined,
    targetSizeUnit: 'KB',
    format: 'original',
    quality: 90,
    zipFolderName: 'ImgMojo-Resized-Images',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMoreRef = useRef<HTMLInputElement>(null)

  // SEO
  useEffect(() => {
    document.title = 'Free Online Image Resizer – Resize JPG, PNG & WebP | ImgMojo'
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Easily resize JPG, PNG, and WebP images online for free. Set dimensions in pixels, inches, cm, or mm. Reduce file size to target KB/MB.'
      )
    }
  }, [])

  // Auto-preload sample image if items is empty so the editor is immediately visible and interactive
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
          rotation: 0,
        }

        setItems([initialItem])
        setActiveItemId(initialItem.id)

        setSettings((s) => ({
          ...s,
          width,
          height,
          percentage: 100,
        }))
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

  // Handle uploaded files
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
          rotation: 0,
        })
      } catch (err) {
        console.error('Failed to load image', err)
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => {
        const filtered = prev.filter((p) => p.id !== 'sample-portrait')
        return [...filtered, ...newItems]
      })
      setActiveItemId(newItems[0].id)
      setSettings((s) => ({
        ...s,
        width: newItems[0].originalWidth,
        height: newItems[0].originalHeight,
        percentage: 100,
      }))
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

  // Remove single item
  const removeItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setItems((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target?.originalUrl && target.id !== 'sample-portrait') URL.revokeObjectURL(target.originalUrl)
      if (target?.resizedUrl) URL.revokeObjectURL(target.resizedUrl)
      const remaining = prev.filter((item) => item.id !== id)
      if (activeItemId === id && remaining.length > 0) {
        setActiveItemId(remaining[0].id)
      }
      return remaining
    })
  }

  // Clear all items
  const clearAll = () => {
    if (items.length > 1 && !window.confirm('Are you sure you want to remove all images?')) {
      return
    }
    items.forEach((item) => {
      if (item.originalUrl && item.id !== 'sample-portrait') URL.revokeObjectURL(item.originalUrl)
      if (item.resizedUrl) URL.revokeObjectURL(item.resizedUrl)
    })
    setItems([])
    setActiveItemId('')
  }

  // Rotate single item 90 degrees clockwise
  const rotateItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newRot = ((item.rotation || 0) + 90) % 360
          return { ...item, rotation: newRot }
        }
        return item
      })
    )
  }

  // Open Crop modal for an item
  const openCropModal = (item: ResizedItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setCropModalItem(item)
    setCropAspect('free')
    setCropCoords({
      x: 0,
      y: 0,
      width: item.originalWidth,
      height: item.originalHeight,
    })
  }

  const applyCrop = () => {
    if (!cropModalItem) return
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === cropModalItem.id) {
          return {
            ...item,
            crop: cropCoords,
          }
        }
        return item
      })
    )
    setCropModalItem(null)
  }

  // Open Info modal
  const openInfoModal = (item: ResizedItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setInfoModalItem(item)
  }

  // Load from URL
  const handleLoadFromUrl = async () => {
    if (!urlInput.trim()) return
    try {
      const resp = await fetch(urlInput.trim())
      if (!resp.ok) throw new Error('Failed to fetch image from URL')
      const blob = await resp.blob()
      const filename = urlInput.split('/').pop()?.split('?')[0] || 'web-image.jpg'
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
      const { width, height, url } = await loadImageDimensions(file)

      const newItem: ResizedItem = {
        id: `${filename}-${Date.now()}`,
        file,
        name: filename,
        originalWidth: width,
        originalHeight: height,
        originalSize: file.size,
        originalUrl: url,
        aspectRatio: width / height,
        isProcessing: false,
        rotation: 0,
      }

      setItems((prev) => {
        const filtered = prev.filter((p) => p.id !== 'sample-portrait')
        return [...filtered, newItem]
      })
      setActiveItemId(newItem.id)
      setUrlModalOpen(false)
      setUrlInput('')
    } catch (err) {
      alert('Unable to load image from that URL. Ensure the URL allows cross-origin requests.')
    }
  }

  // Active item reference
  const activeItem = items.find((it) => it.id === activeItemId) || items[0]

  // Dimension calculations for an item
  const getItemTargetDimensions = useCallback(
    (item: ResizedItem) => {
      const srcW = item.crop ? item.crop.width : item.originalWidth
      const srcH = item.crop ? item.crop.height : item.originalHeight
      const rot = (item.rotation || 0) % 360
      const swapped = rot === 90 || rot === 270
      const effW = swapped ? srcH : srcW
      const effH = swapped ? srcW : srcH
      return calculateTargetDimensions(effW, effH, settings)
    },
    [settings]
  )

  // Change width handler (with aspect ratio lock)
  const handleWidthChange = (valStr: string) => {
    const val = parseFloat(valStr) || 0
    if (!settings.maintainAspectRatio || !activeItem) {
      setSettings((s) => ({ ...s, width: val }))
      return
    }
    const ratio = activeItem.aspectRatio || 1
    const newHeight = val > 0 ? Math.round(val / ratio) : 0
    setSettings((s) => ({ ...s, width: val, height: newHeight }))
  }

  // Change height handler (with aspect ratio lock)
  const handleHeightChange = (valStr: string) => {
    const val = parseFloat(valStr) || 0
    if (!settings.maintainAspectRatio || !activeItem) {
      setSettings((s) => ({ ...s, height: val }))
      return
    }
    const ratio = activeItem.aspectRatio || 1
    const newWidth = val > 0 ? Math.round(val * ratio) : 0
    setSettings((s) => ({ ...s, width: newWidth, height: val }))
  }

  // Handle Social preset pick
  const handleSocialPresetSelect = (presetLabel: string) => {
    const preset = SOCIAL_PRESETS.find(
      (p) => p.platform === settings.socialPlatform && p.label === presetLabel
    )
    if (!preset) return
    setSettings((s) => ({
      ...s,
      socialPreset: preset.label,
      width: preset.width,
      height: preset.height,
    }))
  }

  // Switch Social platform
  const handleSocialPlatformSelect = (platform: SocialPlatform) => {
    const presetsForPlat = SOCIAL_PRESETS.filter((p) => p.platform === platform)
    const firstPreset = presetsForPlat[0]
    setSettings((s) => ({
      ...s,
      socialPlatform: platform,
      socialPreset: firstPreset ? firstPreset.label : '',
      width: firstPreset ? firstPreset.width : s.width,
      height: firstPreset ? firstPreset.height : s.height,
    }))
  }

  // Unit switch
  const handleUnitChange = (newUnit: DimensionUnit) => {
    const currentUnit = settings.unit
    if (newUnit === currentUnit) return
    const pxW = convertUnitToPx(settings.width, currentUnit, settings.dpi)
    const pxH = convertUnitToPx(settings.height, currentUnit, settings.dpi)
    const convertedW = convertPxToUnit(pxW, newUnit, settings.dpi)
    const convertedH = convertPxToUnit(pxH, newUnit, settings.dpi)
    setSettings((s) => ({
      ...s,
      unit: newUnit,
      width: convertedW,
      height: convertedH,
    }))
  }

  // DPI switch
  const handleDpiChange = (newDpi: DpiOption) => {
    setSettings((s) => ({ ...s, dpi: newDpi }))
  }

  // Export process
  const handleExport = async () => {
    if (items.length === 0) return
    setIsProcessing(true)
    setExportProgress(10)

    try {
      const results: ResizedItem[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const res = await resizeSingleImage(item, settings)
        results.push({
          ...item,
          resizedBlob: res.blob,
          resizedUrl: res.url,
          resizedWidth: res.width,
          resizedHeight: res.height,
          resizedSize: res.size,
          outputName: res.outputName,
        })
        setExportProgress(Math.round(((i + 1) / items.length) * 80) + 10)
      }

      setProcessedResults(results)
      setExportProgress(100)

      if (results.length === 1 && results[0].resizedBlob) {
        downloadSingleFile(results[0].resizedBlob, results[0].outputName || results[0].name)
      } else if (results.length > 1) {
        setExportCompleteModal(true)
      }
    } catch (err) {
      console.error('Export failed', err)
      alert('An error occurred during resizing. Please check your settings.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (processedResults.length === 0) return
    await createAndDownloadZip(processedResults, settings.zipFolderName)
  }

  // Sorted items
  const sortedItems = [...items].sort((a, b) => {
    if (sortOption === 'name-asc') return a.name.localeCompare(b.name)
    if (sortOption === 'name-desc') return b.name.localeCompare(a.name)
    if (sortOption === 'size-desc') return b.originalSize - a.originalSize
    if (sortOption === 'size-asc') return a.originalSize - b.originalSize
    return 0
  })

  const presetsForCurrentPlatform = SOCIAL_PRESETS.filter((p) => p.platform === settings.socialPlatform)

  return (
    <div className="ir-page-container">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />
      <input
        ref={addMoreRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {items.length === 0 ? (
        /* ====================================================================
           Empty State / Landing Dropzone
           ==================================================================== */
        <div className="ir-landing-hero">
          <div className="ir-landing-header">
            <h1>Image Resizer</h1>
            <p>Easily resize images online for free.</p>
          </div>

          <div
            className={`ir-dropzone-box ${isDragging ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="ir-dropzone-icon-wrap">
              <Upload size={32} />
            </div>

            <div className="ir-split-btn-group" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ir-btn-primary-main"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} />
                Select Images
              </button>
              <button
                type="button"
                className="ir-btn-primary-split"
                onClick={() => setShowUploadDropdown((prev) => !prev)}
                title="Upload sources"
              >
                <ChevronDown size={16} />
              </button>

              {showUploadDropdown && (
                <div className="ir-split-dropdown-menu">
                  <button
                    type="button"
                    className="ir-split-dropdown-item"
                    onClick={() => {
                      setShowUploadDropdown(false)
                      fileInputRef.current?.click()
                    }}
                  >
                    <Upload size={16} /> From Device
                  </button>
                  <button
                    type="button"
                    className="ir-split-dropdown-item"
                    onClick={() => {
                      setShowUploadDropdown(false)
                      setUrlModalOpen(true)
                    }}
                  >
                    <LinkIcon size={16} /> From URL
                  </button>
                </div>
              )}
            </div>

            <p className="ir-drop-subtext">or, drag and drop images here</p>
            <span className="ir-drop-limit-badge">Max file size: 50 MB. Sign up for more.</span>
          </div>

          {/* Feature Highlights Grid */}
          <div className="ir-landing-features">
            <div className="ir-feature-card">
              <h3>
                <Check size={18} color="#3b82f6" /> Perfect Quality
              </h3>
              <p>The best online image resizer to resize your JPG, PNG, and WebP images at the highest quality.</p>
            </div>
            <div className="ir-feature-card">
              <h3>
                <Check size={18} color="#3b82f6" /> Lightning Fast
              </h3>
              <p>Client-side HTML5 canvas acceleration scales and resizes your images instantaneously without server lag.</p>
            </div>
            <div className="ir-feature-card">
              <h3>
                <Check size={18} color="#3b82f6" /> Supported Units
              </h3>
              <p>Resize dimensions can be specified in pixels, inches, centimeters, or millimeters with print DPI support.</p>
            </div>
            <div className="ir-feature-card">
              <h3>
                <Check size={18} color="#3b82f6" /> Reduce File Size
              </h3>
              <p>Optionally specify a target max file size in KB or MB to compress files down to your required limit.</p>
            </div>
            <div className="ir-feature-card">
              <h3>
                <Check size={18} color="#3b82f6" /> Social Media Ready
              </h3>
              <p>One-click dimensions for Facebook, Instagram, Twitter/X, and YouTube profile, banner, and posts.</p>
            </div>
            <div className="ir-feature-card">
              <h3>
                <Check size={18} color="#3b82f6" /> Privacy Guaranteed
              </h3>
              <p>All resizing runs entirely inside your browser sandbox. Your photos are never stored on external clouds.</p>
            </div>
          </div>
        </div>
      ) : (
        /* ====================================================================
           Editor Mode (Left Sidebar + Right Image Cards Grid)
           ==================================================================== */
        <div className="ir-editor-layout">
          {/* Left Sidebar */}
          <aside className={`ir-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
            <div className="ir-sidebar-body">
              {/* Top Toolbar */}
              <div className="ir-sidebar-toolbar">
                <div className="ir-toolbar-actions">
                  <button
                    type="button"
                    className="ir-tool-btn"
                    title="Add Images"
                    onClick={() => addMoreRef.current?.click()}
                  >
                    <Plus size={18} />
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="ir-tool-btn"
                      title="Filter / Sort"
                      onClick={() => setShowSortMenu((prev) => !prev)}
                    >
                      <SlidersHorizontal size={16} />
                    </button>
                    {showSortMenu && (
                      <div className="ir-split-dropdown-menu" style={{ left: 0, right: 'auto' }}>
                        <button
                          type="button"
                          className="ir-split-dropdown-item"
                          onClick={() => {
                            setSortOption('name-asc')
                            setShowSortMenu(false)
                          }}
                        >
                          Name (A - Z)
                        </button>
                        <button
                          type="button"
                          className="ir-split-dropdown-item"
                          onClick={() => {
                            setSortOption('name-desc')
                            setShowSortMenu(false)
                          }}
                        >
                          Name (Z - A)
                        </button>
                        <button
                          type="button"
                          className="ir-split-dropdown-item"
                          onClick={() => {
                            setSortOption('size-desc')
                            setShowSortMenu(false)
                          }}
                        >
                          Size (Largest)
                        </button>
                        <button
                          type="button"
                          className="ir-split-dropdown-item"
                          onClick={() => {
                            setSortOption('size-asc')
                            setShowSortMenu(false)
                          }}
                        >
                          Size (Smallest)
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="ir-tool-btn danger"
                    title="Clear All"
                    onClick={clearAll}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <span className="ir-max-size-pill">Max file size : 50 MB</span>
              </div>

              {/* Title */}
              <h2 className="ir-section-heading">Resize Settings</h2>

              {/* Segmented 3 Tabs */}
              <div className="ir-tabs-segmented">
                <button
                  type="button"
                  className={`ir-tab-btn ${settings.mode === 'by-size' || settings.mode === 'dimensions' ? 'active' : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, mode: 'by-size' }))}
                >
                  By Size
                </button>
                <button
                  type="button"
                  className={`ir-tab-btn ${settings.mode === 'percentage' ? 'active' : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, mode: 'percentage' }))}
                >
                  As Percentage
                </button>
                <button
                  type="button"
                  className={`ir-tab-btn ${settings.mode === 'social-media' ? 'active' : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, mode: 'social-media' }))}
                >
                  Social Media
                </button>
              </div>

              {/* Tab 1: By Size */}
              {(settings.mode === 'by-size' || settings.mode === 'dimensions') && (
                <div>
                  <div className="ir-row-inputs">
                    <div>
                      <label className="ir-label">width</label>
                      <input
                        type="number"
                        className="ir-input-text"
                        placeholder="Enter Width"
                        value={settings.width || ''}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="ir-label">height</label>
                      <div className="ir-input-with-unit">
                        <input
                          type="number"
                          className="ir-input-text"
                          placeholder="Enter Height"
                          value={settings.height || ''}
                          onChange={(e) => handleHeightChange(e.target.value)}
                          min={1}
                        />
                        <select
                          className="ir-unit-select-inline"
                          value={settings.unit}
                          onChange={(e) => handleUnitChange(e.target.value as DimensionUnit)}
                        >
                          <option value="px">px</option>
                          <option value="in">inch</option>
                          <option value="cm">cm</option>
                          <option value="mm">mm</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <label className="ir-checkbox-row">
                    <input
                      type="checkbox"
                      checked={settings.maintainAspectRatio}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, maintainAspectRatio: e.target.checked }))
                      }
                    />
                    <span className="ir-checkbox-icon">
                      {settings.maintainAspectRatio ? <Lock size={14} /> : <Lock size={14} style={{ opacity: 0.35 }} />}
                    </span>
                    Lock Aspect Ratio
                  </label>

                  {/* DPI field if unit is in/cm/mm */}
                  {settings.unit !== 'px' && (
                    <div className="ir-form-group">
                      <label className="ir-label">DPI</label>
                      <select
                        className="ir-select"
                        value={settings.dpi}
                        onChange={(e) => handleDpiChange(Number(e.target.value) as DpiOption)}
                      >
                        <option value={300}>300 DPI (inkjet)</option>
                        <option value={150}>150 DPI (standard print)</option>
                        <option value={96}>96 DPI (standard screen)</option>
                        <option value={72}>72 DPI (web screen)</option>
                      </select>
                      <p className="ir-helper-note">DPI (dots per inch) is for printing. Choose 300 if unsure.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: As Percentage */}
              {settings.mode === 'percentage' && (
                <div>
                  <div className="ir-slider-box">
                    <div className="ir-slider-header">
                      <span className="ir-label" style={{ margin: 0 }}>
                        Size
                      </span>
                      <span className="ir-slider-badge">{settings.percentage}%</span>
                    </div>
                    <input
                      type="range"
                      className="ir-range-slider"
                      min={1}
                      max={500}
                      step={1}
                      value={settings.percentage}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, percentage: Number(e.target.value) }))
                      }
                    />
                    <p className="ir-slider-subtext">
                      Make my image {settings.percentage}% of original size
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Social Media */}
              {settings.mode === 'social-media' && (
                <div>
                  <div className="ir-form-group">
                    <label className="ir-label">Choose the Social Media Platform</label>
                    <select
                      className="ir-select"
                      value={settings.socialPlatform}
                      onChange={(e) => handleSocialPlatformSelect(e.target.value as SocialPlatform)}
                    >
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Twitter">Twitter</option>
                      <option value="YouTube">YouTube</option>
                    </select>
                  </div>

                  <div className="ir-form-group">
                    <label className="ir-label">Preset Type</label>
                    <select
                      className="ir-select"
                      value={settings.socialPreset}
                      onChange={(e) => handleSocialPresetSelect(e.target.value)}
                    >
                      {presetsForCurrentPlatform.map((p) => (
                        <option key={p.id} value={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ir-row-inputs">
                    <div>
                      <label className="ir-label">width</label>
                      <input
                        type="number"
                        className="ir-input-text"
                        value={settings.width || ''}
                        onChange={(e) => handleWidthChange(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="ir-label">height</label>
                      <input
                        type="number"
                        className="ir-input-text"
                        value={settings.height || ''}
                        onChange={(e) => handleHeightChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <label className="ir-checkbox-row">
                    <input
                      type="checkbox"
                      checked={settings.maintainAspectRatio}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, maintainAspectRatio: e.target.checked }))
                      }
                    />
                    <span className="ir-checkbox-icon">
                      {settings.maintainAspectRatio ? <Lock size={14} /> : <Lock size={14} style={{ opacity: 0.35 }} />}
                    </span>
                    Lock Aspect Ratio
                  </label>

                  {/* Background Fill */}
                  <div className="ir-bg-fill-box">
                    <div className="ir-bg-fill-header">
                      <label
                        className="ir-checkbox-row"
                        style={{ margin: 0, fontWeight: 600 }}
                      >
                        <input
                          type="checkbox"
                          checked={settings.backgroundFill.enabled}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              backgroundFill: {
                                ...s.backgroundFill,
                                enabled: e.target.checked,
                              },
                            }))
                          }
                        />
                        Background Fill
                      </label>
                      <span title="Fills excess letterboxed background when aspect ratios differ">
                        <HelpIcon size={14} color="#94a3b8" />
                      </span>
                    </div>

                    {settings.backgroundFill.enabled && (
                      <div className="ir-color-swatch-row">
                        <span style={{ fontSize: 13, color: '#64748b' }}>Pick a color:</span>
                        <input
                          type="color"
                          className="ir-color-picker-input"
                          value={settings.backgroundFill.color}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              backgroundFill: {
                                ...s.backgroundFill,
                                color: e.target.value,
                              },
                            }))
                          }
                        />
                        <span className="ir-color-hex-text">{settings.backgroundFill.color}</span>

                        {settings.format !== 'jpeg' && (
                          <label
                            className="ir-checkbox-row"
                            style={{ margin: 0, marginLeft: 'auto', fontSize: 12 }}
                            title="Only works with PNG images"
                          >
                            <input
                              type="checkbox"
                              checked={settings.backgroundFill.transparent}
                              onChange={(e) =>
                                setSettings((s) => ({
                                  ...s,
                                  backgroundFill: {
                                    ...s.backgroundFill,
                                    transparent: e.target.checked,
                                  },
                                }))
                              }
                            />
                            Transparent
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ir-form-group">
                    <label className="ir-label">Unit</label>
                    <select
                      className="ir-select"
                      value={settings.unit}
                      onChange={(e) => handleUnitChange(e.target.value as DimensionUnit)}
                    >
                      <option value="px">Pixels</option>
                      <option value="in">Inch</option>
                      <option value="cm">Cm</option>
                      <option value="mm">Mm</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Export Settings Accordion */}
              <div
                className="ir-accordion-header"
                onClick={() => setExportSettingsOpen((prev) => !prev)}
              >
                <span>Export Settings</span>
                {exportSettingsOpen ? (
                  <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>

              {exportSettingsOpen && (
                <div className="ir-accordion-body">
                  {/* Target File Size */}
                  <div className="ir-form-group">
                    <label className="ir-label">Target file size (optional)</label>
                    <div className="ir-input-with-unit">
                      <input
                        type="number"
                        className="ir-input-text"
                        placeholder="e.g. 200"
                        value={settings.targetFileSize || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          setSettings((s) => ({
                            ...s,
                            targetFileSizeEnabled: !isNaN(val) && val > 0,
                            targetFileSize: !isNaN(val) && val > 0 ? val : undefined,
                          }))
                        }}
                        min={1}
                      />
                      <select
                        className="ir-unit-select-inline"
                        value={settings.targetSizeUnit}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            targetSizeUnit: e.target.value as TargetSizeUnit,
                          }))
                        }
                      >
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                      </select>
                    </div>
                    <p className="ir-helper-note">Set a max output file size. Only works for JPG files</p>
                  </div>

                  {/* Save Image As */}
                  <div className="ir-form-group">
                    <label className="ir-label">Save Image As</label>
                    <select
                      className="ir-select"
                      value={settings.format}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, format: e.target.value as OutputFormat }))
                      }
                    >
                      <option value="original">Original</option>
                      <option value="jpeg">JPG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WEBP</option>
                    </select>
                  </div>

                  {/* Quality Slider (for JPG or WEBP) */}
                  {(settings.format === 'jpeg' || settings.format === 'webp') && (
                    <div className="ir-form-group" style={{ marginTop: 12 }}>
                      <div className="ir-slider-header" style={{ marginBottom: 4 }}>
                        <span className="ir-label" style={{ margin: 0, fontSize: 12 }}>
                          Quality
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>
                          {settings.quality}%
                        </span>
                      </div>
                      <input
                        type="range"
                        className="ir-range-slider"
                        min={10}
                        max={100}
                        value={settings.quality}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, quality: Number(e.target.value) }))
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pinned Bottom CTA */}
            <div className="ir-sidebar-footer">
              <button
                type="button"
                className="ir-export-cta"
                onClick={handleExport}
                disabled={isProcessing || items.length === 0}
              >
                {isProcessing ? (
                  <>Processing ({exportProgress}%) ...</>
                ) : (
                  <>
                    Export {items.length > 1 ? `(${items.length}) ` : ''}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </aside>

          {/* Right Main Workspace (Image Cards Grid) */}
          <main className="ir-main-workspace">
            <div className="ir-cards-grid">
              {sortedItems.map((item) => {
                const targetDim = getItemTargetDimensions(item)
                const isSwapped = (item.rotation || 0) % 180 !== 0
                const origW = isSwapped ? item.originalHeight : item.originalWidth
                const origH = isSwapped ? item.originalWidth : item.originalHeight

                return (
                  <div
                    key={item.id}
                    className="ir-image-card"
                    onClick={() => setActiveItemId(item.id)}
                  >
                    <div className="ir-card-preview-area">
                      <img
                        src={item.originalUrl}
                        alt={item.name}
                        className="ir-card-img-preview"
                        style={{
                          transform: `rotate(${item.rotation || 0}deg) ${item.flipH ? 'scaleX(-1)' : ''}`,
                        }}
                      />

                      {/* 4 Circular Action Buttons: Crop, Rotate, Info, Delete */}
                      <div className="ir-card-overlays">
                        <button
                          type="button"
                          className="ir-card-overlay-btn"
                          title="Crop Image"
                          onClick={(e) => openCropModal(item, e)}
                        >
                          <Crop size={14} />
                        </button>
                        <button
                          type="button"
                          className="ir-card-overlay-btn"
                          title="Rotate 90°"
                          onClick={(e) => rotateItem(item.id, e)}
                        >
                          <RotateCw size={14} />
                        </button>
                        <button
                          type="button"
                          className="ir-card-overlay-btn"
                          title="Image Info"
                          onClick={(e) => openInfoModal(item, e)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="ir-card-overlay-btn danger"
                          title="Remove Image"
                          onClick={(e) => removeItem(item.id, e)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="ir-card-info-row">
                      <div className="ir-card-filename" title={item.name}>
                        {item.name}
                      </div>

                      <div className="ir-dimension-pills">
                        <span className="ir-pill-orig">
                          {settings.unit === 'px'
                            ? `${origW} X ${origH}`
                            : `${convertPxToUnit(origW, settings.unit, settings.dpi)} X ${convertPxToUnit(origH, settings.unit, settings.dpi)}`}
                        </span>
                        <span className="ir-pill-arrow">→</span>
                        <span className="ir-pill-target">
                          {settings.unit === 'px'
                            ? `${targetDim.targetW} X ${targetDim.targetH}`
                            : `${convertPxToUnit(targetDim.targetW, settings.unit, settings.dpi)} X ${convertPxToUnit(targetDim.targetH, settings.unit, settings.dpi)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add More Images Card in Grid */}
              <div
                className="ir-add-card-dashed"
                onClick={() => addMoreRef.current?.click()}
                title="Add more images"
              >
                <div className="ir-add-card-icon-wrap">
                  <Plus size={24} />
                </div>
                <span className="ir-add-card-text">Add More Images</span>
              </div>
            </div>
          </main>

          {/* Mobile Bottom Fixed Bar */}
          <div className="ir-mobile-bottom-bar">
            <button
              type="button"
              className="ir-mobile-bottom-btn"
              onClick={() => addMoreRef.current?.click()}
            >
              <Plus size={20} /> Add
            </button>
            <button
              type="button"
              className="ir-mobile-bottom-btn"
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
            >
              Resize Settings
            </button>
            <button type="button" className="ir-mobile-bottom-btn" onClick={clearAll}>
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
         Crop Modal
         ==================================================================== */}
      {cropModalItem && (
        <div className="ir-modal-backdrop" onClick={() => setCropModalItem(null)}>
          <div className="ir-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ir-modal-header">
              <h2>Crop: {cropModalItem.name}</h2>
              <button
                type="button"
                className="ir-modal-close-btn"
                onClick={() => setCropModalItem(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ir-modal-content">
              <div className="ir-crop-canvas-wrapper">
                <img
                  src={cropModalItem.originalUrl}
                  alt={cropModalItem.name}
                  className="ir-crop-source-img"
                  style={{
                    transform: `rotate(${cropModalItem.rotation || 0}deg)`,
                  }}
                />
              </div>

              <div className="ir-crop-aspect-selector">
                <span style={{ fontSize: 13, fontWeight: 600, alignSelf: 'center' }}>
                  Aspect Ratio:
                </span>
                {(['free', '1:1', '4:5', '16:9', '4:3'] as const).map((asp) => (
                  <button
                    key={asp}
                    type="button"
                    className={`ir-crop-aspect-pill ${cropAspect === asp ? 'active' : ''}`}
                    onClick={() => {
                      setCropAspect(asp)
                      const origW = cropModalItem.originalWidth
                      const origH = cropModalItem.originalHeight
                      if (asp === '1:1') {
                        const dim = Math.min(origW, origH)
                        setCropCoords({
                          x: Math.round((origW - dim) / 2),
                          y: Math.round((origH - dim) / 2),
                          width: dim,
                          height: dim,
                        })
                      } else if (asp === '16:9') {
                        const newH = Math.round(origW * (9 / 16))
                        setCropCoords({
                          x: 0,
                          y: Math.max(0, Math.round((origH - newH) / 2)),
                          width: origW,
                          height: Math.min(origH, newH),
                        })
                      } else if (asp === '4:5') {
                        const newW = Math.round(origH * (4 / 5))
                        setCropCoords({
                          x: Math.max(0, Math.round((origW - newW) / 2)),
                          y: 0,
                          width: Math.min(origW, newW),
                          height: origH,
                        })
                      } else {
                        setCropCoords({ x: 0, y: 0, width: origW, height: origH })
                      }
                    }}
                  >
                    {asp}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 14, fontSize: 13, color: '#64748b' }}>
                Crop bounds: {cropCoords.width} X {cropCoords.height} px
              </div>
            </div>

            <div className="ir-modal-footer">
              <button
                type="button"
                className="ir-btn-secondary"
                onClick={() => setCropModalItem(null)}
              >
                Cancel
              </button>
              <button type="button" className="ir-btn-primary" onClick={applyCrop}>
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         Info Modal
         ==================================================================== */}
      {infoModalItem && (
        <div className="ir-modal-backdrop" onClick={() => setInfoModalItem(null)}>
          <div
            className="ir-modal-dialog"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ir-modal-header">
              <h2>Image Details</h2>
              <button
                type="button"
                className="ir-modal-close-btn"
                onClick={() => setInfoModalItem(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ir-modal-content">
              <table className="ir-info-table">
                <tbody>
                  <tr>
                    <td>File Name</td>
                    <td>{infoModalItem.name}</td>
                  </tr>
                  <tr>
                    <td>Original Resolution</td>
                    <td>
                      {infoModalItem.originalWidth} × {infoModalItem.originalHeight} px
                    </td>
                  </tr>
                  <tr>
                    <td>Target Resolution</td>
                    <td>
                      {getItemTargetDimensions(infoModalItem).targetW} ×{' '}
                      {getItemTargetDimensions(infoModalItem).targetH} px
                    </td>
                  </tr>
                  <tr>
                    <td>Original File Size</td>
                    <td>{formatBytes(infoModalItem.originalSize)}</td>
                  </tr>
                  <tr>
                    <td>Rotation</td>
                    <td>{infoModalItem.rotation || 0}°</td>
                  </tr>
                  <tr>
                    <td>File Type</td>
                    <td>{infoModalItem.file.type || 'image/jpeg'}</td>
                  </tr>
                  <tr>
                    <td>Export Format</td>
                    <td>
                      {settings.format === 'original'
                        ? getFileExtension(infoModalItem.name).toUpperCase()
                        : settings.format.toUpperCase()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="ir-modal-footer">
              <button
                type="button"
                className="ir-btn-primary"
                onClick={() => setInfoModalItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         URL Upload Modal
         ==================================================================== */}
      {urlModalOpen && (
        <div className="ir-modal-backdrop" onClick={() => setUrlModalOpen(false)}>
          <div
            className="ir-modal-dialog"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ir-modal-header">
              <h2>Upload from URL</h2>
              <button
                type="button"
                className="ir-modal-close-btn"
                onClick={() => setUrlModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ir-modal-content">
              <label className="ir-label">Image Web Address (URL)</label>
              <input
                type="url"
                className="ir-input-text"
                placeholder="https://example.com/photo.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                autoFocus
              />
              <p className="ir-helper-note">Enter direct image link ending in .jpg, .png, or .webp</p>
            </div>

            <div className="ir-modal-footer">
              <button
                type="button"
                className="ir-btn-secondary"
                onClick={() => setUrlModalOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="ir-btn-primary" onClick={handleLoadFromUrl}>
                Fetch Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         Batch Export Complete Modal
         ==================================================================== */}
      {exportCompleteModal && (
        <div className="ir-modal-backdrop" onClick={() => setExportCompleteModal(false)}>
          <div
            className="ir-modal-dialog"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ir-modal-header">
              <h2>Images Resized Successfully!</h2>
              <button
                type="button"
                className="ir-modal-close-btn"
                onClick={() => setExportCompleteModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ir-modal-content">
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                All {processedResults.length} images have been processed with your chosen settings.
              </p>

              <div className="ir-download-list">
                {processedResults.map((res) => (
                  <div key={res.id} className="ir-download-item">
                    <div>
                      <div className="ir-download-item-title">{res.outputName || res.name}</div>
                      <div className="ir-download-item-meta">
                        {res.resizedWidth} × {res.resizedHeight} px •{' '}
                        {res.resizedSize ? formatBytes(res.resizedSize) : ''}
                      </div>
                    </div>
                    {res.resizedBlob && (
                      <button
                        type="button"
                        className="ir-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 13 }}
                        onClick={() =>
                          downloadSingleFile(res.resizedBlob!, res.outputName || res.name)
                        }
                      >
                        <Upload size={14} style={{ transform: 'rotate(180deg)', marginRight: 6 }} /> Download
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="ir-modal-footer">
              <button
                type="button"
                className="ir-btn-secondary"
                onClick={() => setExportCompleteModal(false)}
              >
                Close
              </button>
              <button type="button" className="ir-btn-primary" onClick={handleDownloadZip}>
                <FolderArchive size={16} style={{ marginRight: 6 }} /> Download All as ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         Content Sections Down Below the Tool
         ==================================================================== */}
      <div className="ir-content-wrap">
        {/* ------------------------------------------------------------------
           Section 1: Image Structure: Original vs. Resized
           ------------------------------------------------------------------ */}
        <section className="ir-content-section" aria-labelledby="ir-structure-heading">
          <div className="ir-content-head">
            <span className="ir-kicker">ANATOMY & MATRIX</span>
            <h2 id="ir-structure-heading" className="ir-content-title">
              Image Structure: Original vs. Resized
            </h2>
            <p className="ir-content-subtitle">
              Understand the core mechanics of raster pixels, aspect ratios, file weight, and resampling algorithms when transforming digital images.
            </p>
          </div>

          <div className="ir-structure-prose">
            <p>
              Every digital raster image (whether formatted as JPG, PNG, or WebP) is fundamentally an organized two-dimensional grid of color pixels. The dimensions of this grid—measured by width and height in pixels—determine how much visual information the image contains and how large it renders on desktop monitors, smartphone displays, and printed media.
            </p>
            <p>
              When you resize an image, you modify the total number of pixels in this grid. Scaling down reduces the total pixel count by intelligently consolidating color samples (downsampling), which drastically lowers file weight without compromising visual sharpness. Conversely, enlarging an image (upsampling) requires interpolation algorithms to synthesize new pixels between existing ones.
            </p>
          </div>

          <div className="ir-structure-grid">
            <div className="ir-structure-card">
              <div className="ir-structure-card-icon">
                <Maximize2 size={22} />
              </div>
              <h3>Pixel Matrix & Dimension Scaling</h3>
              <h4>Width × Height Coordinate Arrays</h4>
              <p>
                A high-resolution 4K photo contains over 8.2 million individual pixels. When resized to standard Full HD (1920 × 1080), the grid drops to approximately 2 million pixels—a 75% reduction in data points that immediately improves browser rendering and mobile loading.
              </p>
            </div>

            <div className="ir-structure-card">
              <div className="ir-structure-card-icon">
                <Lock size={22} />
              </div>
              <h3>Aspect Ratio Integrity</h3>
              <h4>Proportional Scaling vs. Geometric Distortion</h4>
              <p>
                The aspect ratio represents the proportional relationship between image width and height (e.g., 16:9 widescreen or 1:1 square). Locking the aspect ratio guarantees your subject never appears squashed or stretched when adjusting dimensions.
              </p>
            </div>

            <div className="ir-structure-card">
              <div className="ir-structure-card-icon">
                <Layers size={22} />
              </div>
              <h3>Resampling & Bicubic Interpolation</h3>
              <h4>Multi-Pass Mathematical Pixel Blending</h4>
              <p>
                ImgMojo employs HTML5 Canvas hardware-accelerated bicubic interpolation. Instead of harsh pixel drops, adjacent color values are smoothly blended across neighbor matrices, preserving sharp edge contrast and fine gradients.
              </p>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="ir-table-card">
            <div className="ir-table-card-head">
              <h3>Structural Comparison: Original Master vs. Resized Web Asset</h3>
              <p>How physical and digital attributes transform across a typical 4K to HD web optimization workflow</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="ir-structure-table">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    <th>Original Image (Camera Raw / Master)</th>
                    <th>Resized Image (Web & Social Optimized)</th>
                    <th>Practical Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Pixel Dimensions</strong></td>
                    <td><span className="ir-tag-orig">3840 × 2160 px (4K)</span></td>
                    <td><span className="ir-tag-target">1280 × 720 px (HD)</span></td>
                    <td>Fits standard display containers perfectly</td>
                  </tr>
                  <tr>
                    <td><strong>Total Pixel Count</strong></td>
                    <td>8,294,400 pixels</td>
                    <td>921,600 pixels (-88.9%)</td>
                    <td>Requires 88% less GPU rendering memory</td>
                  </tr>
                  <tr>
                    <td><strong>File Size Footprint</strong></td>
                    <td>~4.8 MB to 8.5 MB</td>
                    <td>~140 KB to 280 KB (-95%)</td>
                    <td>Instant loading over cellular networks</td>
                  </tr>
                  <tr>
                    <td><strong>Web Load Speed (4G)</strong></td>
                    <td>~1.8 to 2.4 seconds</td>
                    <td>&lt; 0.05 seconds (Instant)</td>
                    <td>Passes Google Core Web Vitals (LCP)</td>
                  </tr>
                  <tr>
                    <td><strong>Primary Purpose</strong></td>
                    <td>Archival, photography masters, editing</td>
                    <td>Websites, email newsletters, social media</td>
                    <td>Optimal balance of quality and performance</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
           Section 2: How to Resize Images Step-by-Step
           ------------------------------------------------------------------ */}
        <section className="ir-content-section" aria-labelledby="ir-howto-heading">
          <div className="ir-content-head">
            <span className="ir-kicker">STEP-BY-STEP WORKFLOW</span>
            <h2 id="ir-howto-heading" className="ir-content-title">
              How to Resize Images Step-by-Step
            </h2>
            <p className="ir-content-subtitle">
              Follow four simple steps to scale, crop, rotate, and export your photos with pixel-perfect precision.
            </p>
          </div>

          <div className="ir-steps-grid">
            <div className="ir-step-card">
              <div className="ir-step-top">
                <span className="ir-step-badge">01</span>
                <Upload size={22} className="ir-step-icon" />
              </div>
              <h3>Select or Drop Images</h3>
              <h4>Batch Upload JPG, PNG, or WebP Files</h4>
              <p>
                Click "Select Images" or drag and drop single or multiple photos directly into the resizer studio. You can also import images directly from a web URL.
              </p>
            </div>

            <div className="ir-step-card">
              <div className="ir-step-top">
                <span className="ir-step-badge">02</span>
                <SlidersHorizontal size={22} className="ir-step-icon" />
              </div>
              <h3>Choose Resizing Mode</h3>
              <h4>By Size, Percentage, or Social Media</h4>
              <p>
                Select "By Size" to enter custom dimensions in pixels or inches, "As Percentage" for smooth scaling (1%–500%), or "Social Media" for instant platform presets.
              </p>
            </div>

            <div className="ir-step-card">
              <div className="ir-step-top">
                <span className="ir-step-badge">03</span>
                <Crop size={22} className="ir-step-icon" />
              </div>
              <h3>Adjust Ratios & Options</h3>
              <h4>Lock Aspect Ratio, Crop, or Set Max KB</h4>
              <p>
                Keep "Lock Aspect Ratio" checked to preserve proportions. Use the card action buttons to rotate or crop, and optionally specify a target maximum file size in KB.
              </p>
            </div>

            <div className="ir-step-card">
              <div className="ir-step-top">
                <span className="ir-step-badge">04</span>
                <FolderArchive size={22} className="ir-step-icon" />
              </div>
              <h3>Export & Download</h3>
              <h4>Single File Download or Bulk ZIP Folder</h4>
              <p>
                Click the blue "Export" button. Single images download immediately to your device, while multi-image batches can be downloaded individually or in a packaged ZIP archive.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
           Section 3: Supported Image Formats
           ------------------------------------------------------------------ */}
        <section className="ir-content-section" aria-labelledby="ir-formats-heading">
          <div className="ir-content-head">
            <span className="ir-kicker">FORMAT COMPATIBILITY</span>
            <h2 id="ir-formats-heading" className="ir-content-title">
              Supported Image Formats
            </h2>
            <p className="ir-content-subtitle">
              ImgMojo provides native, high-performance resizing and conversion across the most widely used raster image formats on the internet.
            </p>
          </div>

          <div className="ir-formats-grid">
            <div className="ir-format-card">
              <div className="ir-format-badge-wrap">
                <span className="ir-format-badge">.jpg / .jpeg</span>
                <CameraIcon size={18} />
              </div>
              <h3>JPG / JPEG Format</h3>
              <h4>Photographic Web Standard</h4>
              <p>
                The gold standard for real-world photography and complex color gradients. ImgMojo supports custom quality thresholds and optional target file size capping in KB/MB.
              </p>
            </div>

            <div className="ir-format-card">
              <div className="ir-format-badge-wrap">
                <span className="ir-format-badge">.png</span>
                <Sparkles size={18} color="#3b82f6" />
              </div>
              <h3>PNG Format</h3>
              <h4>Lossless Detail with Alpha Transparency</h4>
              <p>
                Ideal for logos, UI icons, graphic illustrations, and screenshots. Resizing maintains razor-sharp line art and completely preserves transparent background channels.
              </p>
            </div>

            <div className="ir-format-card">
              <div className="ir-format-badge-wrap">
                <span className="ir-format-badge">.webp</span>
                <Globe size={18} color="#3b82f6" />
              </div>
              <h3>WebP Format</h3>
              <h4>Modern High-Efficiency Web Standard</h4>
              <p>
                Created by Google to supercharge website speeds. Delivers 25%–35% smaller file sizes than comparable JPGs and PNGs while supporting both 24-bit rich color and transparency.
              </p>
            </div>

            <div className="ir-format-card">
              <div className="ir-format-badge-wrap">
                <span className="ir-format-badge">Physical / Print</span>
                <PrinterIcon size={18} />
              </div>
              <h3>Print Units & DPI</h3>
              <h4>Inches, Centimeters, and Millimeters</h4>
              <p>
                Specify physical dimensions in inches, cm, or mm with selectable print DPI (72, 96, 150, or 300 DPI). Perfectly calculates exact pixel counts for lab printing and flyers.
              </p>
            </div>
          </div>

          {/* Conversion Banner */}
          <div className="ir-conversion-banner">
            <div className="ir-conversion-banner-icon">
              <Layers size={22} />
            </div>
            <div>
              <h3>Keep Original Format or Transcode in Bulk</h3>
              <p>
                ImgMojo gives you total export control. By default, your images retain their original format (JPG remains JPG, PNG remains PNG, WebP remains WebP). You can also use the <strong>"Save Image As"</strong> selector in Export Settings to instantly convert your entire batch to WebP for modern web delivery, JPG for universal software compatibility, or PNG for lossless transparency.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
           Section 4: Practical Use Cases for Image Resizing
           ------------------------------------------------------------------ */}
        <section className="ir-content-section" aria-labelledby="ir-usecases-heading">
          <div className="ir-content-head">
            <span className="ir-kicker">REAL-WORLD APPLICATIONS</span>
            <h2 id="ir-usecases-heading" className="ir-content-title">
              Practical Use Cases for Image Resizing
            </h2>
            <p className="ir-content-subtitle">
              Explore how creators, businesses, developers, and photographers use custom image scaling to solve everyday digital workflow challenges.
            </p>
          </div>

          <div className="ir-usecases-grid">
            <div className="ir-usecase-card">
              <div className="ir-usecase-icon-box">
                <Zap size={20} />
              </div>
              <div className="ir-usecase-body">
                <h3>Web Design & SEO Optimization</h3>
                <h4>Core Web Vitals & Fast Page Loading</h4>
                <p>
                  Serving unscaled 4000px camera photos on a 600px mobile card wastes megabytes of bandwidth and slows Largest Contentful Paint (LCP). Resizing to exact container dimensions speeds up page loads and boosts Google search rankings.
                </p>
              </div>
            </div>

            <div className="ir-usecase-card">
              <div className="ir-usecase-icon-box">
                <Globe size={20} />
              </div>
              <div className="ir-usecase-body">
                <h3>Social Media Graphics & Stories</h3>
                <h4>Tailored Ratios for Instagram, TikTok & YouTube</h4>
                <p>
                  Prevent awkward automated cropping and blurry re-encoding. Scale images to official platform dimensions: Instagram Square (1080 × 1080), Stories/Reels (1080 × 1920), YouTube Thumbnails (1280 × 720), and Facebook Covers.
                </p>
              </div>
            </div>

            <div className="ir-usecase-card">
              <div className="ir-usecase-icon-box">
                <Store size={20} />
              </div>
              <div className="ir-usecase-body">
                <h3>E-Commerce Product Catalogs</h3>
                <h4>Consistent Listings for Amazon, Shopify & Etsy</h4>
                <p>
                  Online storefronts look clean and trustworthy when every product thumbnail shares identical square proportions (e.g. 1000 × 1000 px or 1200 × 1200 px). Batch resize your entire catalog in seconds with zero distortion.
                </p>
              </div>
            </div>

            <div className="ir-usecase-card">
              <div className="ir-usecase-icon-box">
                <Mail size={20} />
              </div>
              <div className="ir-usecase-body">
                <h3>Email Attachments & Newsletters</h3>
                <h4>Bypass Attachment Limits and Inbox Quotas</h4>
                <p>
                  Corporate mail servers routinely reject email attachments larger than 20 MB. Downscaling photos to standard email widths (600px–1200px) reduces file sizes by up to 90%, ensuring fast inbox delivery without bounce-backs.
                </p>
              </div>
            </div>

            <div className="ir-usecase-card">
              <div className="ir-usecase-icon-box">
                <PrinterIcon size={20} />
              </div>
              <div className="ir-usecase-body">
                <h3>High-Resolution Print Production</h3>
                <h4>Exact Physical Sizes in Inches & CM with 300 DPI</h4>
                <p>
                  Whether printing photo lab portraits (4 × 6 or 8 × 10 inches), business brochures, or posters, our physical unit selector calculates the exact pixel matrix required at 300 DPI for crisp, professional print shop output.
                </p>
              </div>
            </div>

            <div className="ir-usecase-card">
              <div className="ir-usecase-icon-box">
                <FileText size={20} />
              </div>
              <div className="ir-usecase-body">
                <h3>Government Forms & Visa Applications</h3>
                <h4>Strict Pixel & Maximum KB File Size Constraints</h4>
                <p>
                  Government portals, passport authorities, and job boards often enforce strict rules like "photo must be 600 × 600 px and under 240 KB". Use our combined dimension controls and target file size feature to meet strict upload guidelines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
           Section 5: Frequently Asked Questions
           ------------------------------------------------------------------ */}
        <section className="ir-content-section" aria-labelledby="ir-faq-heading">
          <div className="ir-content-head">
            <span className="ir-kicker">FREQUENTLY ASKED QUESTIONS</span>
            <h2 id="ir-faq-heading" className="ir-content-title">
              Frequently Asked Questions
            </h2>
            <p className="ir-content-subtitle">
              Get answers to the most common questions about image dimensions, print DPI, aspect ratios, and safe browser resizing.
            </p>
          </div>

          <div className="ir-faq-list">
            {RESIZER_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div key={faq.question} className={`ir-faq-item ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="ir-faq-question"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={18} className="ir-faq-chevron" />
                  </button>
                  {isOpen && (
                    <div className="ir-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ------------------------------------------------------------------
           Section 6: Is It Safe to Resize Images Online?
           ------------------------------------------------------------------ */}
        <section className="ir-content-section" aria-labelledby="ir-safety-heading">
          <div className="ir-content-head">
            <span className="ir-kicker">SECURITY & PRIVACY GUARANTEE</span>
            <h2 id="ir-safety-heading" className="ir-content-title">
              Is It Safe to Resize Images Online?
            </h2>
            <p className="ir-content-subtitle">
              Why ImgMojo's client-side architecture provides unmatched privacy compared to traditional cloud-based resizing tools.
            </p>
          </div>

          <div className="ir-safety-card">
            <div className="ir-safety-main">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#3b82f6', marginBottom: 12 }}>
                <ShieldCheck size={28} />
                <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client-Side Sandbox</span>
              </div>
              <h3>100% In-Browser Client-Side Processing</h3>
              <h4>Your Private Photos Never Touch Any Remote Cloud Server</h4>
              <p>
                Most traditional online image resizers require you to upload your personal files to a remote cloud server. This exposes your sensitive photos, contracts, family pictures, and documents to third-party servers, data retention policies, and potential data leaks.
              </p>
              <p>
                <strong>ImgMojo works completely differently:</strong> All image decoding, resampling, dimension scaling, and ZIP bundling occur 100% locally inside your web browser using HTML5 Canvas and JavaScript Web APIs. Your images are never transmitted across the network, never stored in any database, and never used to train external AI models.
              </p>
              <p>
                As soon as you close or refresh your browser tab, all allocated canvas memory is immediately released. You enjoy instant, private processing with enterprise-grade confidentiality.
              </p>
            </div>

            <div className="ir-safety-badges">
              <div className="ir-safety-badge-item">
                <span className="ir-safety-badge-icon">
                  <Check size={14} />
                </span>
                <span>Zero Cloud Server Uploads</span>
              </div>
              <div className="ir-safety-badge-item">
                <span className="ir-safety-badge-icon">
                  <Check size={14} />
                </span>
                <span>Local HTML5 Canvas Sandbox</span>
              </div>
              <div className="ir-safety-badge-item">
                <span className="ir-safety-badge-icon">
                  <Check size={14} />
                </span>
                <span>No User Account or Registration</span>
              </div>
              <div className="ir-safety-badge-item">
                <span className="ir-safety-badge-icon">
                  <Check size={14} />
                </span>
                <span>Zero Watermarks or Hidden Fees</span>
              </div>
              <div className="ir-safety-badge-item">
                <span className="ir-safety-badge-icon">
                  <Check size={14} />
                </span>
                <span>Instant Local Memory Cleanup</span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
           Section 7: Explore More Image Tools
           ------------------------------------------------------------------ */}
        <section className="ir-content-section" aria-labelledby="ir-tools-heading" style={{ marginBottom: 0 }}>
          <div className="ir-content-head">
            <span className="ir-kicker">DISCOVER OUR CREATIVE SUITE</span>
            <h2 id="ir-tools-heading" className="ir-content-title">
              Explore More Image Tools
            </h2>
            <p className="ir-content-subtitle">
              Expand your creative workflow with ImgMojo's complete collection of free, high-speed, browser-based utilities.
            </p>
          </div>

          <div className="ir-tools-grid">
            {/* Image Compressor */}
            <div className="ir-tool-card">
              <div>
                <div className="ir-tool-icon-wrap">
                  <FolderArchive size={22} />
                </div>
                <h3>Image Compressor</h3>
                <h4>Reduce File Size Without Quality Loss</h4>
                <p>
                  Compress JPG, PNG, and WebP images by up to 80% while retaining pristine visual fidelity. Ideal for web performance and email delivery.
                </p>
              </div>
              <Link to="/compress-image" className="ir-tool-link-btn" title="Open Image Compressor">
                <span>Compress Images</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Image Converter */}
            <div className="ir-tool-card">
              <div>
                <div className="ir-tool-icon-wrap">
                  <Layers size={22} />
                </div>
                <h3>Image Converter</h3>
                <h4>Transcode Across All Image Formats</h4>
                <p>
                  Batch convert images between JPG, PNG, WebP, SVG, AVIF, and GIF with custom compression settings and zero software downloads.
                </p>
              </div>
              <Link to="/image-converter" className="ir-tool-link-btn" title="Open Image Converter">
                <span>Convert Formats</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Image Cropper */}
            <div className="ir-tool-card">
              <div>
                <div className="ir-tool-icon-wrap">
                  <Crop size={22} />
                </div>
                <h3>Image Cropper</h3>
                <h4>Precision Framing & Aspect Ratio Ratios</h4>
                <p>
                  Crop photos visually with pixel grids, freeform handles, and fixed aspect ratio presets for avatars, banners, and circular profile pictures.
                </p>
              </div>
              <Link to="/image-cropper" className="ir-tool-link-btn" title="Open Image Cropper">
                <span>Crop Visuals</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Watermark Remover */}
            <div className="ir-tool-card">
              <div>
                <div className="ir-tool-icon-wrap">
                  <Wand2 size={22} />
                </div>
                <h3>Watermark Remover</h3>
                <h4>Clean Object & Text Inpainting</h4>
                <p>
                  Erase unwanted logos, timestamps, text, and overlays from photos cleanly using local canvas-based inpainting brushes.
                </p>
              </div>
              <Link to="/watermark-remover" className="ir-tool-link-btn" title="Open Watermark Remover">
                <span>Remove Watermark</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Remove Object */}
            <div className="ir-tool-card">
              <div>
                <div className="ir-tool-icon-wrap">
                  <Sparkles size={22} />
                </div>
                <h3>Remove Object</h3>
                <h4>Erase Unwanted Photobombers & Items</h4>
                <p>
                  Brush over distracting background objects, power lines, or blemishes and watch them disappear with seamless texture synthesis.
                </p>
              </div>
              <Link to="/remove-object" className="ir-tool-link-btn" title="Open Remove Object">
                <span>Erase Objects</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Collage Studio */}
            <div className="ir-tool-card">
              <div>
                <div className="ir-tool-icon-wrap">
                  <Maximize2 size={22} />
                </div>
                <h3>Collage Studio</h3>
                <h4>Combine Multiple Photos into Grids</h4>
                <p>
                  Create stunning photo collages with customizable borders, rounded corners, spacing grids, filters, and background gradients.
                </p>
              </div>
              <Link to="/collage" className="ir-tool-link-btn" title="Open Collage Studio">
                <span>Create Collage</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Passport Photo Maker */}
            <div className="ir-tool-card">
              <div>
                <div className="ir-tool-icon-wrap">
                  <FileText size={22} />
                </div>
                <h3>Passport Photo Maker</h3>
                <h4>Bio-Metric Document Sizing</h4>
                <p>
                  Generate official 2 × 2 inch passport and visa photos with white backdrops and print-ready multi-cut sheets compliant with government rules.
                </p>
              </div>
              <Link to="/passport-photo" className="ir-tool-link-btn" title="Open Passport Photo Maker">
                <span>Create Passport Photo</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* QR Code Generator */}
            <div className="ir-tool-card">
              <div>
                <div className="ir-tool-icon-wrap">
                  <Globe size={22} />
                </div>
                <h3>QR Code Generator</h3>
                <h4>Branded Custom Scannable QR Codes</h4>
                <p>
                  Generate custom high-resolution QR codes for websites, Wi-Fi networks, contact cards, and text with custom colors and embedded logo icons.
                </p>
              </div>
              <Link to="/qr-code" className="ir-tool-link-btn" title="Open QR Code Generator">
                <span>Generate QR Code</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
