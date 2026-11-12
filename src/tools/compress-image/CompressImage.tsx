import { useState, useRef, useEffect, useMemo, type ChangeEvent, type DragEvent } from 'react'
import {
  Upload,
  Image as ImageIcon,
  FolderArchive,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  CircleCheck,
  Zap,
  SlidersHorizontal,
  ShieldCheck,
  HardDriveDownload,
  X,
  LoaderCircle,
  Layers,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import type { CompressionSettings, ImageItem, OutputFormat } from './types'
import { compressSingleImage, formatBytes, getFileExtension } from './compressEngine'
import { createAndDownloadZip, downloadSingleFile } from './zipEngine'
import './CompressImage.css'

const HOW_TO_STEPS = [
  {
    step: 1,
    title: 'Upload Images',
    description: 'Select or drag & drop your images.',
    icon: 'upload',
  },
  {
    step: 2,
    title: 'Set Options',
    description: 'Choose compression level and format.',
    icon: 'options',
  },
  {
    step: 3,
    title: 'Compress',
    description: 'Click the compress button to reduce size.',
    icon: 'compress',
  },
  {
    step: 4,
    title: 'Download',
    description: 'Save your compressed images.',
    icon: 'download',
  },
]

const COMPRESS_FAQS = [
  {
    question: 'How does ImgMojo compress images without losing visible quality?',
    answer:
      'ImgMojo uses smart client-side canvas encoding and chroma subsampling to remove redundant metadata and optimize pixel data. At 70%–80% compression level, file sizes drop by up to 80% while keeping photos visually indistinguishable from the original.',
  },
  {
    question: 'Are my photos uploaded to any server during compression?',
    answer:
      'No. Every image is processed 100% locally inside your web browser. Your personal or commercial images never leave your device, guaranteeing complete privacy and instant speed.',
  },
  {
    question: 'Which image formats are supported?',
    answer:
      'You can upload and compress JPG, JPEG, PNG, WEBP, SVG, GIF, BMP, and AVIF images. You can keep the original file format or convert all images in bulk to WebP, JPG, or PNG.',
  },
  {
    question: 'Can I compress multiple images at the same time?',
    answer:
      'Yes! Drag and drop dozens of high-resolution photos at once, adjust your compression level, and download them individually or packaged neatly in a single ZIP archive.',
  },
  {
    question: 'What does the Resize Image (Optional) setting do?',
    answer:
      'If your camera photos have huge dimensions (such as 4000×3000 px), setting a maximum width or height scales the image proportionally before encoding, dramatically reducing file size for web and social media use.',
  },
  {
    question: 'Is this online image compressor completely free?',
    answer:
      'Yes, ImgMojo Image Compressor is 100% free with no daily limits, no watermarks, and no account registration required.',
  },
]

function InwardArrowsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <path d="m14 10 7-7" />
      <path d="m3 21 7-7" />
      <path d="M4 10h6V4" />
      <path d="M20 14h-6v6" />
      <path d="m14 14 7 7" />
      <path d="m3 3 7 7" />
    </svg>
  )
}

export default function CompressImage() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(0)
  const [isZipping, setIsZipping] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)
  const [hasCompressed, setHasCompressed] = useState(false)

  // UI-only controls for optional resize & FAQ accordion
  const [resizeEnabled, setResizeEnabled] = useState(true)
  const [resizeWidth, setResizeWidth] = useState<string>('')
  const [resizeHeight, setResizeHeight] = useState<string>('')
  const [openFaq, setOpenFaq] = useState<number>(0)

  const [settings, setSettings] = useState<CompressionSettings>({
    preset: 'custom',
    quality: 75,
    format: 'original',
    maxDimension: 0,
    zipFolderName: 'ImageMojo-CompressedImage',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMoreInputRef = useRef<HTMLInputElement>(null)

  // SEO Meta Tags & JSON-LD Structured Data (WebApplication, HowTo, FAQPage)
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const previousTitle = document.title
    const seoTitle = 'Compress Images Online Free – Reduce JPG, PNG, WEBP File Size | ImgMojo'
    const seoDescription =
      'Reduce image file size without losing quality. Compress JPG, PNG, WEBP, SVG, GIF, and AVIF images online quickly and for free with 100% browser privacy on ImgMojo.'
    const seoKeywords =
      'compress images online, free image compressor, reduce image size without losing quality, compress JPG, compress PNG, compress WEBP, bulk image optimizer, resize and compress photo, ImgMojo'
    const canonicalUrl = "https://imgmojo.com/image-compressor";

    document.title = seoTitle

    const managedMeta: Array<{ element: Element; created: boolean; prevContent: string | null }> = []
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`)
      const created = !element
      const prevContent = element ? element.getAttribute('content') : null
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attrName, attrValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
      managedMeta.push({ element, created, prevContent })
    }

    setMetaTag('name', 'description', seoDescription)
    setMetaTag('name', 'keywords', seoKeywords)
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large')
    setMetaTag('name', 'author', 'ImgMojo')
    setMetaTag('property', 'og:title', seoTitle)
    setMetaTag('property', 'og:description', seoDescription)
    setMetaTag('property', 'og:type', 'website')
    setMetaTag('property', 'og:url', canonicalUrl)
    setMetaTag('property', 'og:site_name', 'ImgMojo')
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', seoTitle)
    setMetaTag('name', 'twitter:description', seoDescription)

    let canonicalLink = document.head.querySelector('link[rel="canonical"]')
    const createdCanonical = !canonicalLink
    const prevCanonicalHref = canonicalLink ? canonicalLink.getAttribute('href') : null
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonicalUrl)

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'ImgMojo Online Image Compressor',
          url: canonicalUrl,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'All',
          description: seoDescription,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
        {
          '@type': 'HowTo',
          name: 'How to Compress Images Online',
          description: 'Compress JPG, PNG, WEBP, SVG, GIF, and AVIF images in 4 easy steps.',
          step: HOW_TO_STEPS.map((item) => ({
            '@type': 'HowToStep',
            position: item.step,
            name: item.title,
            text: item.description,
          })),
        },
        {
          '@type': 'FAQPage',
          mainEntity: COMPRESS_FAQS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    }

    const scriptId = 'compress-image-seo-jsonld'
    let jsonLdScript = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script')
      jsonLdScript.id = scriptId
      jsonLdScript.type = 'application/ld+json'
      document.head.appendChild(jsonLdScript)
    }
    jsonLdScript.textContent = JSON.stringify(structuredData)

    return () => {
      document.title = previousTitle
      managedMeta.forEach(({ element, created, prevContent }) => {
        if (created) {
          element.remove()
        } else if (prevContent !== null) {
          element.setAttribute('content', prevContent)
        }
      })
      if (createdCanonical && canonicalLink) {
        canonicalLink.remove()
      } else if (canonicalLink && prevCanonicalHref !== null) {
        canonicalLink.setAttribute('href', prevCanonicalHref)
      }
      const existingScript = document.getElementById(scriptId)
      if (existingScript) existingScript.remove()
    }
  }, [])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl)
      })
    }
  }, [])

  const syncMaxDimension = (enabled: boolean, wStr: string, hStr: string) => {
    const w = parseInt(wStr, 10)
    const h = parseInt(hStr, 10)
    const maxDim =
      enabled
        ? Math.max(!Number.isNaN(w) && w > 0 ? w : 0, !Number.isNaN(h) && h > 0 ? h : 0)
        : 0
    setSettings((prev) => ({
      ...prev,
      maxDimension: maxDim,
    }))
    setHasCompressed(false)
  }

  const handleFilesAdded = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (validFiles.length === 0) return

    const newItems: ImageItem[] = validFiles.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const previewUrl = URL.createObjectURL(file)
      return {
        id,
        file,
        name: file.name,
        originalSize: file.size,
        previewUrl,
        status: 'pending',
      }
    })

    setItems((prev) => [...prev, ...newItems])
    setHasCompressed(false)
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesAdded(e.target.files)
      e.target.value = ''
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files)
    }
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const clearAll = () => {
    items.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl)
    })
    setItems([])
    setHasCompressed(false)
  }

  const handleQualityChange = (quality: number) => {
    setSettings((prev) => ({
      ...prev,
      preset: 'custom',
      quality,
    }))
    setHasCompressed(false)
  }

  // Perform compression batch
  const startCompression = async () => {
    if (items.length === 0) {
      fileInputRef.current?.click()
      return
    }
    if (isProcessing) return

    setIsProcessing(true)
    setHasCompressed(false)

    const updated = [...items]

    for (let i = 0; i < updated.length; i++) {
      setProcessingIndex(i + 1)
      const current = updated[i]

      // Mark status compressing
      updated[i] = { ...current, status: 'compressing' }
      setItems([...updated])

      try {
        const result = await compressSingleImage(current, settings)
        updated[i] = {
          ...current,
          status: 'done',
          compressedBlob: result.blob,
          compressedUrl: result.url,
          compressedSize: result.size,
          outputName: result.outputName,
          reductionPercent: result.reductionPercent,
          width: result.width,
          height: result.height,
        }
      } catch (err) {
        updated[i] = {
          ...current,
          status: 'error',
          error: err instanceof Error ? err.message : 'Compression failed',
        }
      }

      setItems([...updated])
      // Small pause to yield UI rendering
      await new Promise((r) => setTimeout(r, 16))
    }

    setIsProcessing(false)
    setHasCompressed(true)
  }

  // Trigger ZIP download
  const handleDownloadZip = async () => {
    const completedItems = items.filter((i) => i.status === 'done' && i.compressedBlob)
    if (completedItems.length === 0 || isZipping) return

    setIsZipping(true)
    setZipProgress(0)

    try {
      await createAndDownloadZip(completedItems, settings.zipFolderName, (pct) => {
        setZipProgress(pct)
      })
    } catch (err) {
      console.error('Failed to generate ZIP archive:', err)
      alert('Could not generate ZIP archive. You can download images individually.')
    } finally {
      setIsZipping(false)
    }
  }

  // Calculations for summary stats
  const summary = useMemo(() => {
    const completed = items.filter((i) => i.status === 'done' && i.compressedSize !== undefined)
    const totalOriginal = completed.reduce((sum, i) => sum + i.originalSize, 0)
    const totalCompressed = completed.reduce((sum, i) => sum + (i.compressedSize || 0), 0)
    const saved = Math.max(0, totalOriginal - totalCompressed)
    const percent = totalOriginal > 0 ? Math.round((saved / totalOriginal) * 100) : 0

    const overallOriginal = items.reduce((sum, i) => sum + i.originalSize, 0)

    return {
      totalOriginal,
      totalCompressed,
      saved,
      percent,
      completedCount: completed.length,
      totalCount: items.length,
      overallOriginal,
    }
  }, [items])

  const sliderPercent = Math.round(((settings.quality - 5) / (98 - 5)) * 100)

  return (
    <div className="compress-image-page">
      {/* Decorative Corner Waves */}
      <svg className="ci-wave ci-wave-tl" viewBox="0 0 420 200" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="ciWaveTl1" x1="0%" y1="0%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="var(--ci-brand)" stopOpacity="0.88" />
            <stop offset="55%" stopColor="var(--ci-accent)" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="ciWaveTl2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ci-brand-dark)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--ci-brand-soft)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,0 L420,0 C340,35 280,105 185,120 C95,135 45,95 0,165 Z" fill="url(#ciWaveTl1)" />
        <path d="M0,0 L300,0 C230,55 160,70 90,115 C40,145 15,175 0,200 Z" fill="url(#ciWaveTl2)" />
      </svg>

      <svg className="ci-wave ci-wave-tr" viewBox="0 0 380 180" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="ciWaveTr" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ci-brand-soft)" stopOpacity="0.4" />
            <stop offset="55%" stopColor="var(--ci-accent)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--ci-brand)" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path d="M80,0 L380,0 L380,165 C315,105 265,135 195,90 C130,48 115,15 80,0 Z" fill="url(#ciWaveTr)" />
      </svg>

      {/* Hidden file pickers */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/bmp,image/avif"
        className="visually-hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/bmp,image/avif"
        className="visually-hidden"
        onChange={handleFileInputChange}
      />

      <div className="ci-container">
        {/* Top Hero Header */}
        <header className="compress-header">
          <div className="compress-kicker">
            <ImageIcon size={14} />
            <span>Free Online Tool</span>
          </div>
          <h1>
            Compress Images <span>Online</span>
          </h1>
          <p>
            Reduce image file size without losing quality. Compress JPG, PNG, WEBP and more, quickly and for free.
          </p>
        </header>

        {/* Main Hero Studio Grid: Left/Center Dropzone + Features & Right Settings Card */}
        <div className="ci-hero-workspace">
          {/* Left & Center Column */}
          <div className="ci-left-column">
            {items.length === 0 ? (
              <div className="ci-dropzone-stage">
                {/* Left 3D Stacked Photo Illustration */}
                <div className="ci-floating-art" aria-hidden="true">
                  <svg viewBox="0 0 210 210" fill="none" className="ci-art-svg">
                    <defs>
                      <linearGradient id="ciArtSky" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--ci-brand-soft)" />
                        <stop offset="100%" stopColor="#dbeafe" />
                      </linearGradient>
                      <linearGradient id="ciArtMount1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--ci-brand)" />
                        <stop offset="100%" stopColor="var(--ci-brand-dark)" />
                      </linearGradient>
                      <linearGradient id="ciArtBadge" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--ci-accent)" />
                        <stop offset="100%" stopColor="var(--ci-brand)" />
                      </linearGradient>
                      <filter id="ciCardShadow" x="-15%" y="-15%" width="135%" height="135%">
                        <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#4c1d95" floodOpacity="0.16" />
                      </filter>
                    </defs>

                    {/* Sparkle ticks top-left */}
                    <path d="M52 26 L46 14" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M65 22 L66 9" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M76 28 L85 18" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Back tilted card */}
                    <g transform="rotate(-14 95 110)" filter="url(#ciCardShadow)">
                      <rect x="26" y="48" width="124" height="104" rx="18" fill="#ffffff" stroke="var(--ci-brand-line)" strokeWidth="2" />
                      <rect x="36" y="58" width="104" height="84" rx="12" fill="var(--ci-brand-soft)" />
                    </g>

                    {/* Front tilted photo card */}
                    <g transform="rotate(-6 108 106)" filter="url(#ciCardShadow)">
                      <rect x="38" y="42" width="128" height="108" rx="18" fill="#ffffff" />
                      <rect x="48" y="52" width="108" height="88" rx="12" fill="url(#ciArtSky)" />
                      {/* Sun */}
                      <circle cx="128" cy="74" r="11" fill="#fbbf24" />
                      {/* Mountains */}
                      <path d="M48 132 L84 82 L122 132 Z" fill="url(#ciArtMount1)" />
                      <path d="M84 82 L97 100 L73 100 Z" fill="#ffffff" opacity="0.9" />
                      <path d="M96 132 L128 96 L156 132 Z" fill="var(--ci-brand-ink)" opacity="0.88" />
                      <rect x="48" y="128" width="108" height="12" rx="4" fill="var(--ci-brand-dark)" />
                    </g>

                    {/* Circular Compress Badge bottom-right */}
                    <g filter="url(#ciCardShadow)">
                      <circle cx="164" cy="134" r="27" fill="#ffffff" />
                      <circle cx="164" cy="134" r="23" fill="url(#ciArtBadge)" />
                      {/* Left arrow pointing right & right arrow pointing left */}
                      <path d="M150 134 H160 M156 129 L161 134 L156 139" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M178 134 H168 M172 129 L167 134 L172 139" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                </div>

                {/* Dashed Dropzone Card */}
                <div
                  className={`compress-dropzone-hero ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="dropzone-cloud-icon" aria-hidden="true">
                    <svg width="64" height="52" viewBox="0 0 64 52" fill="none">
                      <path
                        d="M20 44H46C53.18 44 59 38.18 59 31C59 24.32 53.96 18.82 47.46 18.08C45.42 9.98 38.12 4 29.4 4C19.12 4 10.8 12.32 10.8 22.6C10.8 23.22 10.84 23.84 10.9 24.44C6.34 26.2 3.1 30.62 3.1 35.8C3.1 42.54 8.56 48 15.3 48"
                        stroke="currentColor"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M32 39V21M32 21L25 28M32 21L39 28"
                        stroke="currentColor"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <h2 className="dropzone-title">Drag &amp; Drop Images Here</h2>
                  <p className="dropzone-hint">or click the button below to select images</p>

                  <button
                    type="button"
                    className="compress-select-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={19} />
                    <span>Select Images</span>
                  </button>

                  <div className="dropzone-formats">
                    <span className="format-badge">JPG</span>
                    <span className="format-badge">PNG</span>
                    <span className="format-badge">WEBP</span>
                    <span className="format-badge">SVG</span>
                    <span className="format-badge">GIF</span>
                    <span className="format-badge">AVIF</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Loaded Images Workspace inside Left/Center Column */
              <div className="compress-loaded-panel">
                {hasCompressed && summary.completedCount > 0 && (
                  <div className="summary-banner">
                    <div className="summary-headline">
                      <div className="summary-title">
                        <div className="summary-badge-icon">
                          <CircleCheck size={20} />
                        </div>
                        <div>
                          <h2>Images Compressed Successfully!</h2>
                          <p>
                            Your files have been optimized and are ready to download in a ZIP folder.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleDownloadZip}
                        disabled={isZipping}
                      >
                        <Download size={14} /> {isZipping ? 'Creating ZIP...' : 'Download ZIP'}
                      </button>
                    </div>

                    <div className="summary-stats-grid">
                      <div className="stat-box">
                        <span>Total Original</span>
                        <strong>{formatBytes(summary.totalOriginal)}</strong>
                      </div>
                      <div className="stat-box">
                        <span>Compressed Size</span>
                        <strong>{formatBytes(summary.totalCompressed)}</strong>
                      </div>
                      <div className="stat-box highlight">
                        <span>Total Space Saved</span>
                        <strong>
                          {formatBytes(summary.saved)} (-{summary.percent}%)
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="workspace-topbar">
                  <div className="workspace-stats">
                    <h3>
                      {items.length} {items.length === 1 ? 'image' : 'images'} selected
                    </h3>
                    <span className="size-pill">{formatBytes(summary.overallOriginal)}</span>
                  </div>
                  <div className="workspace-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => addMoreInputRef.current?.click()}
                      disabled={isProcessing}
                    >
                      <Plus size={14} /> Add more
                    </button>
                    <button
                      type="button"
                      className="btn-ghost-danger"
                      onClick={clearAll}
                      disabled={isProcessing}
                    >
                      <Trash2 size={14} /> Clear all
                    </button>
                  </div>
                </div>

                <div
                  className="image-grid"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {items.map((item) => {
                    const ext = getFileExtension(item.name).toUpperCase() || 'IMG'
                    return (
                      <div
                        key={item.id}
                        className={`image-card ${item.status === 'done' ? 'done' : ''}`}
                      >
                        <div className="card-preview">
                          <img src={item.previewUrl} alt={item.name} />
                          <span className="card-format-tag">{ext}</span>
                          <button
                            type="button"
                            className="card-remove-btn"
                            title="Remove image"
                            onClick={() => removeItem(item.id)}
                            disabled={isProcessing}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="card-info">
                          <span className="card-filename" title={item.name}>
                            {item.name}
                          </span>

                          <div className="card-sizes">
                            <span className="size-original">
                              {formatBytes(item.originalSize)}
                            </span>
                            {item.status === 'done' && item.compressedSize !== undefined && (
                              <span className="size-compressed">
                                {formatBytes(item.compressedSize)}
                              </span>
                            )}
                          </div>

                          <div className="card-status">
                            {item.status === 'pending' && (
                              <span className="status-indicator pending">Ready</span>
                            )}
                            {item.status === 'compressing' && (
                              <span className="status-indicator compressing">
                                <LoaderCircle size={13} className="spinning" /> Optimizing...
                              </span>
                            )}
                            {item.status === 'done' && (
                              <>
                                <span className="savings-badge">
                                  -{item.reductionPercent}%
                                </span>
                                {item.compressedBlob && (
                                  <button
                                    type="button"
                                    className="single-download-btn"
                                    title="Download this compressed file"
                                    onClick={() =>
                                      downloadSingleFile(
                                        item.compressedBlob!,
                                        item.outputName || item.name
                                      )
                                    }
                                  >
                                    <Download size={15} />
                                  </button>
                                )}
                              </>
                            )}
                            {item.status === 'error' && (
                              <span className="status-indicator error" title={item.error}>
                                Failed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 4 Feature Highlights Strip */}
            <div className="compress-features-strip">
              <div className="feature-pill">
                <div className="feature-pill-icon is-amber">
                  <Zap size={20} />
                </div>
                <div className="feature-pill-text">
                  <strong>Fast &amp; Free</strong>
                  <span>Compress images in seconds</span>
                </div>
              </div>

              <div className="feature-pill">
                <div className="feature-pill-icon">
                  <ShieldCheck size={20} />
                </div>
                <div className="feature-pill-text">
                  <strong>Privacy Secured</strong>
                  <span>Images stay in your browser</span>
                </div>
              </div>

              <div className="feature-pill">
                <div className="feature-pill-icon">
                  <Layers size={20} />
                </div>
                <div className="feature-pill-text">
                  <strong>Multiple Formats</strong>
                  <span>JPG, PNG, WEBP, GIF, SVG, AVIF</span>
                </div>
              </div>

              <div className="feature-pill">
                <div className="feature-pill-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
                  </svg>
                </div>
                <div className="feature-pill-text">
                  <strong>No Quality Loss</strong>
                  <span>Keep the best visual quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Compression Settings Card */}
          <aside className="compress-sidebar">
            <div className="settings-card">
              <h3>
                <span className="settings-title-icon" aria-hidden="true">
                  <SlidersHorizontal size={16} />
                </span>
                <span>Compression Settings</span>
              </h3>

              {/* Compression Level Slider */}
              <div className="setting-group">
                <div className="setting-label-row">
                  <label className="setting-label" htmlFor="ci-quality-range">
                    Compression Level
                  </label>
                  <span className="slider-value-pill">{settings.quality}%</span>
                </div>
                <div className="ci-range-wrap">
                  <input
                    id="ci-quality-range"
                    type="range"
                    min="5"
                    max="98"
                    step="1"
                    value={settings.quality}
                    onChange={(e) => handleQualityChange(Number(e.target.value))}
                    className="ci-range-input"
                    style={{ '--ci-progress': `${sliderPercent}%` } as React.CSSProperties}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Output Format */}
              <div className="setting-group">
                <label className="setting-label" htmlFor="ci-output-format">
                  Output Format
                </label>
                <div className="ci-select-box">
                  <span className="ci-select-icon" aria-hidden="true">
                    <ImageIcon size={15} />
                  </span>
                  <select
                    id="ci-output-format"
                    className="select-input has-icon"
                    value={settings.format}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        format: e.target.value as OutputFormat,
                      }))
                      setHasCompressed(false)
                    }}
                    disabled={isProcessing}
                  >
                    <option value="original">Keep Original Format</option>
                    <option value="image/webp">Convert to WebP (Smallest size)</option>
                    <option value="image/jpeg">Convert to JPG (Best compatibility)</option>
                    <option value="image/png">Convert to PNG (Lossless)</option>
                  </select>
                </div>
              </div>

              {/* Resize Image (Optional) */}
              <div className="setting-group">
                <label className="ci-checkbox-row">
                  <input
                    type="checkbox"
                    checked={resizeEnabled}
                    onChange={(e) => {
                      const next = e.target.checked
                      setResizeEnabled(next)
                      syncMaxDimension(next, resizeWidth, resizeHeight)
                    }}
                    disabled={isProcessing}
                  />
                  <span className="ci-checkbox-mark" aria-hidden="true">
                    ✓
                  </span>
                  <span className="ci-checkbox-text">
                    <strong>Resize Image</strong> <em>(Optional)</em>
                  </span>
                </label>

                <div className={`ci-resize-grid ${!resizeEnabled ? 'is-disabled' : ''}`}>
                  <div className="ci-resize-field">
                    <label htmlFor="ci-resize-w">Width (px)</label>
                    <div className="ci-number-box">
                      <input
                        id="ci-resize-w"
                        type="number"
                        min="0"
                        max="8000"
                        step="10"
                        placeholder="Auto"
                        value={resizeWidth}
                        disabled={!resizeEnabled || isProcessing}
                        onChange={(e) => {
                          const val = e.target.value
                          setResizeWidth(val)
                          syncMaxDimension(resizeEnabled, val, resizeHeight)
                        }}
                      />
                    </div>
                  </div>

                  <div className="ci-resize-field">
                    <label htmlFor="ci-resize-h">Height (px)</label>
                    <div className="ci-number-box">
                      <input
                        id="ci-resize-h"
                        type="number"
                        min="0"
                        max="8000"
                        step="10"
                        placeholder="Auto"
                        value={resizeHeight}
                        disabled={!resizeEnabled || isProcessing}
                        onChange={(e) => {
                          const val = e.target.value
                          setResizeHeight(val)
                          syncMaxDimension(resizeEnabled, resizeWidth, val)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ZIP Folder Name when multiple files loaded */}
              {items.length > 1 && (
                <div className="setting-group">
                  <label className="setting-label" htmlFor="ci-zip-folder">
                    ZIP Folder Name
                  </label>
                  <div className="ci-select-box">
                    <span className="ci-select-icon" aria-hidden="true">
                      <FolderArchive size={15} />
                    </span>
                    <input
                      id="ci-zip-folder"
                      type="text"
                      className="text-input has-icon"
                      value={settings.zipFolderName}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          zipFolderName: e.target.value,
                        }))
                      }
                      placeholder="ImageMojo-CompressedImage"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              )}

              {/* Primary Action Button */}
              {!hasCompressed ? (
                <button
                  type="button"
                  className="compress-action-btn"
                  onClick={startCompression}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <LoaderCircle size={18} className="spinning" />
                      <span>
                        Compressing {processingIndex} of {items.length}...
                      </span>
                    </>
                  ) : (
                    <>
                      <InwardArrowsIcon size={18} />
                      <span>
                        Compress Images{items.length > 0 ? ` (${items.length})` : ''}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="compress-action-btn download-action-btn"
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                  >
                    {isZipping ? (
                      <>
                        <LoaderCircle size={18} className="spinning" />
                        <span>Zipping... {zipProgress > 0 ? `${zipProgress}%` : ''}</span>
                      </>
                    ) : (
                      <>
                        <HardDriveDownload size={18} />
                        <span>Download ZIP Folder</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="recompress-btn"
                    onClick={startCompression}
                    disabled={isProcessing}
                  >
                    <RefreshCw size={14} />
                    <span>Re-compress with Current Settings</span>
                  </button>
                </>
              )}

              {isProcessing && items.length > 0 && (
                <div className="progress-strip">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.round((processingIndex / items.length) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* How to Compress Images? 4-Step Horizontal Section */}
        <section className="ci-howto-section" aria-labelledby="ci-howto-heading">
          <h2 id="ci-howto-heading" className="ci-howto-title">
            How to Compress Images?
          </h2>

          <ol className="ci-howto-steps">
            {HOW_TO_STEPS.map((item, idx) => (
              <li key={item.step} className="ci-howto-step-wrap">
                <div className="ci-howto-card">
                  <span className="ci-step-num">{item.step}</span>
                  <div className="ci-step-icon" aria-hidden="true">
                    {item.icon === 'upload' && <Upload size={22} />}
                    {item.icon === 'options' && <SlidersHorizontal size={22} />}
                    {item.icon === 'compress' && <InwardArrowsIcon size={22} />}
                    {item.icon === 'download' && <Download size={22} />}
                  </div>
                  <div className="ci-step-copy">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
                {idx < HOW_TO_STEPS.length - 1 && (
                  <span className="ci-step-arrow" aria-hidden="true">
                    <ChevronRight size={20} />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Below-the-Fold SEO FAQ Section */}
        <section className="ci-faq-section" aria-labelledby="ci-faq-heading">
          <div className="ci-faq-header">
            <span className="ci-faq-eyebrow">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              <span>Frequently Asked Questions</span>
            </span>
            <h2 id="ci-faq-heading">Everything About Online Image Compression</h2>
            <p>
              Learn how ImgMojo optimizes JPG, PNG, WEBP, SVG, GIF, and AVIF files locally in your browser with zero quality loss.
            </p>
          </div>

          <div className="ci-faq-grid">
            {COMPRESS_FAQS.map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={item.question} className={`ci-faq-item ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="ci-faq-question"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  >
                    <span>{item.question}</span>
                    <ChevronDown size={18} className="ci-faq-chevron" />
                  </button>
                  {isOpen && (
                    <div className="ci-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
