import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  FolderArchive,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Lock,
  Clock3,
  Layers,
  Zap,
  Mail,
} from 'lucide-react'
import type { ConvertItem, ConvertSettings } from './types'
import {
  FORMAT_CATALOG,
  formatBytes,
  loadImageData,
  convertSingleImage,
  downloadSingleFile,
  createAndDownloadZip,
} from './convertEngine'
import './ImageConverter.css'

const CONVERTER_FAQS = [
  {
    question: 'Why should I convert my images to WebP?',
    answer:
      'WebP is a modern web format developed by Google that reduces file sizes by 25% to 35% compared to JPG and PNG at equivalent visual quality. It also supports transparency, making it the ideal choice for websites and web applications.',
  },
  {
    question: 'What happens to transparency when converting PNG to JPG?',
    answer:
      'The JPG format does not support alpha transparency. When converting a transparent PNG to JPG, ImgMojo automatically replaces transparent pixels with a clean solid background (white by default, or your chosen custom color), preventing ugly black pixel blocks.',
  },
  {
    question: 'Are my images uploaded to any cloud server during conversion?',
    answer:
      'No. All file decoding and re-encoding is performed 100% client-side inside your web browser using HTML5 Canvas. Your files are never uploaded, stored, or transmitted across the network.',
  },
  {
    question: 'Can I batch convert multiple image formats at the same time?',
    answer:
      'Yes! You can upload a mixed batch of JPG, PNG, WebP, GIF, BMP, and AVIF files. With one click, ImgMojo will convert all of them to your target format and let you download them as individual files or in a unified ZIP archive.',
  },
  {
    question: 'Does converting formats cause loss of visual quality?',
    answer:
      'Converting between lossless formats (such as PNG to lossless WebP) produces zero quality loss. When converting to lossy formats like JPG, ImgMojo defaults to 90% high fidelity, keeping the result visually indistinguishable from the source.',
  },
]

export default function ImageConverter() {
  const [items, setItems] = useState<ConvertItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number>(0)
  const [zipProgress, setZipProgress] = useState(0)

  const [settings, setSettings] = useState<ConvertSettings>({
    targetFormat: 'webp',
    quality: 90,
    backgroundColor: '#ffffff',
    removeTransparency: false,
    zipFolderName: 'ImgMojo-Converted-Images',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMoreRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = 'Free Online Image Converter – Convert JPG, PNG & WebP | ImgMojo'
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Convert JPG, PNG, WebP, AVIF, and GIF images online for free with ImgMojo. 100% browser-based conversion with high visual fidelity and zero server uploads.'
      )
    }

    // Preload default sample portrait so converter is never empty and image is clearly shown
    let cancelled = false
    const loadDefault = async () => {
      try {
        const resp = await fetch('/sample-portrait.jpg')
        if (!resp.ok) return
        const blob = await resp.blob()
        if (cancelled) return
        const sampleFile = new File([blob], 'sample-portrait.jpg', { type: 'image/jpeg' })
        const data = await loadImageData(sampleFile)
        if (cancelled) return
        const initialItem: ConvertItem = {
          id: 'sample-portrait',
          file: sampleFile,
          name: 'sample-portrait.jpg',
          originalSize: sampleFile.size,
          originalFormat: 'JPG',
          originalUrl: data.url,
          originalWidth: data.width,
          originalHeight: data.height,
          isConverting: false,
        }
        setItems([initialItem])
        setActiveId(initialItem.id)
      } catch (err) {
        console.error('Error preloading converter image', err)
      }
    }

    if (items.length === 0) {
      void loadDefault()
    }

    return () => {
      cancelled = true
    }
  }, [items.length])

  // Active item lookup
  const activeItem = items.find((it) => it.id === activeId) || items[0]

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newItems: ConvertItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue

      try {
        const { width, height, url } = await loadImageData(file)
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          originalSize: file.size,
          originalFormat: file.type.replace('image/', '').toUpperCase() || 'UNKNOWN',
          originalUrl: url,
          originalWidth: width,
          originalHeight: height,
          isConverting: false,
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
      setActiveId(newItems[0].id)
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
      if (target?.originalUrl) URL.revokeObjectURL(target.originalUrl)
      if (target?.convertedUrl) URL.revokeObjectURL(target.convertedUrl)
      return prev.filter((item) => item.id !== id)
    })
  }

  const clearAll = () => {
    items.forEach((item) => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl)
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl)
    })
    setItems([])
  }

  const processAll = async () => {
    if (items.length === 0 || isConverting) return
    setIsConverting(true)

    const updated = [...items]
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i]
      try {
        const res = await convertSingleImage(item, settings)
        updated[i] = {
          ...item,
          convertedBlob: res.blob,
          convertedUrl: res.url,
          convertedSize: res.size,
          convertedName: res.convertedName,
          convertedWidth: res.width,
          convertedHeight: res.height,
        }
      } catch (err) {
        console.error('Conversion failed for item', item.name, err)
        updated[i] = {
          ...item,
          error: (err as Error).message || 'Conversion failed',
        }
      }
      setItems([...updated])
    }

    setIsConverting(false)
  }

  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((item) => item.convertedBlob)
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

  const hasConvertedAny = items.some((item) => item.convertedBlob)

  return (
    <div className="image-converter-page">
      <div className="ic-container">
        {/* Hero Head */}
        <div className="ic-hero-head">
          <span className="ic-hero-kicker">
            <Layers size={14} /> FREE FORMAT CONVERTER
          </span>
          <h1>Free Online Image Converter</h1>
          <p className="ic-hero-subhead">
            Convert JPG, PNG, WebP and More Instantly in Your Browser
          </p>
          <p className="ic-hero-intro">
            Effortlessly switch image formats to optimize load times, enable transparency, or ensure legacy compatibility. Fast, 100% private client-side conversion with zero file uploads.
          </p>
        </div>

        {/* Dropzone */}
        {items.length === 0 ? (
          <div
            className={`ic-dropzone ${isDragging ? 'dragging' : ''}`}
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
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            <div className="ic-dropzone-inner">
              <div className="ic-dropzone-icon">
                <Upload size={28} />
              </div>
              <h2 className="ic-dropzone-title">Drop your images here, or browse files</h2>
              <p className="ic-dropzone-sub">
                Supports JPG, PNG, WebP, AVIF, GIF, SVG, BMP up to 50MB
              </p>
              <button type="button" className="ic-browse-btn">
                <Plus size={16} /> Choose Images
              </button>
            </div>
          </div>
        ) : (
          /* Workspace */
          <div className="ic-workspace">
            {/* Left Items Column */}
            <div className="ic-items-col">
              {/* Active Uploaded Image Overview Bar (Clearly shows uploaded image) */}
              {activeItem && (
                <div className="ic-active-image-bar">
                  <div className="ic-active-meta-left">
                    <img src={activeItem.originalUrl} alt={activeItem.name} className="ic-active-mini-thumb" />
                    <div>
                      <div className="ic-active-name-row">
                        <strong className="ic-active-name" title={activeItem.name}>
                          {activeItem.name}
                        </strong>
                        <span className="ic-active-fmt-chip">
                          {activeItem.originalFormat}
                        </span>
                      </div>
                      <span className="ic-active-details">
                        Resolution: {activeItem.originalWidth} × {activeItem.originalHeight} px · Size: {formatBytes(activeItem.originalSize)}
                      </span>
                    </div>
                  </div>
                  <div className="ic-active-meta-right">
                    <button
                      type="button"
                      className="ic-active-change-btn"
                      onClick={() => addMoreRef.current?.click()}
                      title="Upload or add more images"
                    >
                      <Upload size={14} /> Upload Images
                    </button>
                  </div>
                </div>
              )}

              {/* DEDICATED LARGE UPLOADED IMAGE PREVIEW STAGE */}
              {activeItem && (
                <div className="ic-main-preview-card">
                  <div className="ic-preview-header">
                    <div className="ic-preview-title-col">
                      <span className="ic-preview-badge">ACTIVE IMAGE PREVIEW</span>
                      <h4 className="ic-preview-filename" title={activeItem.name}>
                        {activeItem.name}
                      </h4>
                    </div>
                    <div className="ic-preview-meta-chips">
                      <span className="ic-fmt-badge original">{activeItem.originalFormat}</span>
                      <span className="ic-arrow-badge">➔</span>
                      <span className="ic-fmt-badge target">{settings.targetFormat.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="ic-preview-stage-wrap">
                    <img
                      src={activeItem.convertedUrl || activeItem.originalUrl}
                      alt={activeItem.name}
                      className="ic-large-preview-img"
                    />
                    <div className="ic-preview-tag-overlay">
                      {activeItem.convertedUrl ? (
                        <span className="ic-converted-pill">
                          ✓ Converted to {settings.targetFormat.toUpperCase()} ({formatBytes(activeItem.convertedSize || 0)})
                        </span>
                      ) : (
                        <span className="ic-original-pill">
                          Original {activeItem.originalFormat} ({activeItem.originalWidth} × {activeItem.originalHeight} px)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Image Batch Management */}
              <div className="ic-items-header">
                <h3>Uploaded Batch List ({items.length})</h3>
                <div className="ic-items-actions">
                  <button
                    type="button"
                    className="ic-text-btn"
                    onClick={() => addMoreRef.current?.click()}
                  >
                    <Plus size={14} /> Add more
                  </button>
                  <input
                    ref={addMoreRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                  />
                  <button type="button" className="ic-text-btn" onClick={clearAll}>
                    <Trash2 size={14} /> Clear list
                  </button>
                </div>
              </div>

              <div className="ic-items-grid">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`ic-item-card ${item.id === activeItem?.id ? 'active' : ''}`}
                    onClick={() => setActiveId(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={item.originalUrl} alt={item.name} className="ic-item-thumb" />
                    <div className="ic-item-info">
                      <p className="ic-item-name" title={item.name}>
                        {item.name}
                      </p>
                      <div className="ic-item-meta">
                        <span>
                          Source: <strong>{item.originalFormat}</strong> ({formatBytes(item.originalSize)})
                        </span>
                        {item.convertedName && item.convertedSize && (
                          <span className="success">
                            Converted: <strong>{item.convertedName}</strong> ({formatBytes(item.convertedSize)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ic-item-actions">
                      {item.convertedBlob && (
                        <button
                          type="button"
                          className="ic-download-btn"
                          onClick={() => downloadSingleFile(item.convertedBlob!, item.convertedName || 'converted')}
                          title="Download converted file"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="ic-remove-btn"
                        onClick={() => removeItem(item.id)}
                        title="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Settings Sidebar */}
            <aside className="ic-sidebar">
              <h3 className="ic-sidebar-title">
                <Layers size={18} /> Target Format
              </h3>

              <div className="ic-control-group">
                <label className="ic-control-label">Convert To</label>
                <div className="ic-format-pills">
                  {FORMAT_CATALOG.map((f) => {
                    const isActive = settings.targetFormat === f.id
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={`ic-format-pill ${isActive ? 'active' : ''}`}
                        onClick={() => setSettings((s) => ({ ...s, targetFormat: f.id }))}
                      >
                        <span className="ic-format-pill-name">{f.name}</span>
                        <span className="ic-format-pill-desc">{f.badge}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quality Slider (for JPG, WebP, AVIF) */}
              {(settings.targetFormat === 'jpeg' || settings.targetFormat === 'webp' || settings.targetFormat === 'avif') && (
                <div className="ic-control-group">
                  <label className="ic-control-label">Target Quality: {settings.quality}%</label>
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

              {/* Background Color for Transparency Removal */}
              {settings.targetFormat === 'jpeg' && (
                <div className="ic-control-group">
                  <label className="ic-control-label">Background Fill Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, backgroundColor: e.target.value }))
                      }
                      style={{ width: '40px', height: '36px', padding: 0, borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--ic-line)' }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--ic-muted)' }}>
                      Replaces transparent PNG backgrounds
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                className="ic-action-btn-main"
                onClick={processAll}
                disabled={isConverting}
              >
                {isConverting ? (
                  <>
                    <RefreshCw size={16} className="spinning" /> Converting...
                  </>
                ) : (
                  <>
                    <Zap size={16} /> Convert All Images
                  </>
                )}
              </button>

              {hasConvertedAny && (
                <button
                  type="button"
                  className="ic-action-btn-zip"
                  onClick={handleDownloadAllZip}
                >
                  <FolderArchive size={16} />
                  <span>Download All as ZIP {zipProgress > 0 ? `(${zipProgress}%)` : ''}</span>
                </button>
              )}
            </aside>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        <section className="ic-section" aria-labelledby="ic-howto-heading">
          <div className="ic-section-head">
            <span className="ic-section-kicker">STEP-BY-STEP WORKFLOW</span>
            <h2 id="ic-howto-heading">How to Convert Images Online?</h2>
            <p>Convert your image formats in four straightforward steps:</p>
          </div>

          <div className="ic-steps-grid">
            <div className="ic-step-card">
              <span className="ic-step-num">01</span>
              <div className="ic-step-icon">
                <Upload size={20} />
              </div>
              <h3>Upload Images</h3>
              <p>Drag and drop your JPG, PNG, WebP, GIF, or BMP files into the tool.</p>
            </div>

            <div className="ic-step-card">
              <span className="ic-step-num">02</span>
              <div className="ic-step-icon">
                <Layers size={20} />
              </div>
              <h3>Select Target Format</h3>
              <p>Pick WebP, JPG, PNG, AVIF, or GIF depending on your platform needs.</p>
            </div>

            <div className="ic-step-card">
              <span className="ic-step-num">03</span>
              <div className="ic-step-icon">
                <Zap size={20} />
              </div>
              <h3>Convert Instantly</h3>
              <p>Click "Convert All Images" to re-encode canvas buffers locally.</p>
            </div>

            <div className="ic-step-card">
              <span className="ic-step-num">04</span>
              <div className="ic-step-icon">
                <Download size={20} />
              </div>
              <h3>Download Output</h3>
              <p>Download converted files individually or together in a neat ZIP archive.</p>
            </div>
          </div>
        </section>

        {/* Educational Content: Understanding Image Formats */}
        <section className="ic-section" aria-labelledby="ic-edu-heading">
          <div className="ic-section-head">
            <span className="ic-section-kicker">EDUCATIONAL GUIDE</span>
            <h2 id="ic-edu-heading">Understanding Image Formats: When to Use Which?</h2>
            <p>
              Different image formats serve distinct purposes across web development, graphic design, and photography:
            </p>
          </div>

          <div className="ic-matrix-table-wrap">
            <table className="ic-matrix-table">
              <thead>
                <tr>
                  <th>Format</th>
                  <th>Type</th>
                  <th>Transparency</th>
                  <th>Best For</th>
                  <th>Compression Efficiency</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>WebP</strong></td>
                  <td>Lossy &amp; Lossless</td>
                  <td>Yes (Alpha)</td>
                  <td>Modern websites, blogs, apps</td>
                  <td>Exceptional (25–35% smaller than JPG/PNG)</td>
                </tr>
                <tr>
                  <td><strong>JPG / JPEG</strong></td>
                  <td>Lossy</td>
                  <td>No</td>
                  <td>Photographs, digital cameras, print</td>
                  <td>High compatibility, moderate size</td>
                </tr>
                <tr>
                  <td><strong>PNG</strong></td>
                  <td>Lossless</td>
                  <td>Yes (Alpha)</td>
                  <td>Logos, icons, screenshots, vector art</td>
                  <td>Large file size, pixel-perfect</td>
                </tr>
                <tr>
                  <td><strong>AVIF</strong></td>
                  <td>Lossy &amp; Lossless</td>
                  <td>Yes (Alpha)</td>
                  <td>Next-gen high-efficiency web delivery</td>
                  <td>Industry-leading (up to 50% smaller)</td>
                </tr>
                <tr>
                  <td><strong>GIF</strong></td>
                  <td>Indexed (256 colors)</td>
                  <td>Yes (Binary)</td>
                  <td>Simple graphics, retro compatibility</td>
                  <td>Low efficiency for rich colors</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Real Before-and-After Example */}
        <section className="ic-section" aria-labelledby="ic-example-heading">
          <div className="ic-section-head">
            <span className="ic-section-kicker">REAL-WORLD BENCHMARK</span>
            <h2 id="ic-example-heading">Before-and-After: Transparent PNG to Modern WebP</h2>
            <p>
              Converting a transparent website graphic from PNG to WebP dramatically reduces data payload while preserving transparency:
            </p>
          </div>

          <div className="ic-example-box">
            <div className="ic-example-metrics">
              <div className="ic-metric-card">
                <span className="ic-metric-tag">Source Format (PNG)</span>
                <div className="ic-metric-size">2.8 MB</div>
                <ul>
                  <li><strong>Transparency:</strong> Full Alpha Channel</li>
                  <li><strong>Compression:</strong> Lossless DEFLATE</li>
                  <li><strong>Mobile Load Time:</strong> ~2.2 seconds</li>
                  <li><strong>Bandwidth Impact:</strong> Heavy page payload</li>
                </ul>
              </div>

              <div className="ic-metric-arrow">
                <span className="ir-arrow-badge">88.5% Size Reduction</span>
              </div>

              <div className="ic-metric-card">
                <span className="ic-metric-tag success">Converted Format (WebP)</span>
                <div className="ic-metric-size success">320 KB</div>
                <ul>
                  <li><strong>Transparency:</strong> Fully Preserved</li>
                  <li><strong>Compression:</strong> Predictive Coding + VP8</li>
                  <li><strong>Mobile Load Time:</strong> ~0.2 seconds (10× faster)</li>
                  <li><strong>Bandwidth Impact:</strong> Google Core Web Vitals optimized</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Practical Use Cases */}
        <section className="ic-section" aria-labelledby="ic-usecases-heading">
          <div className="ic-section-head">
            <span className="ic-section-kicker">APPLICATIONS</span>
            <h2 id="ic-usecases-heading">Practical Use Cases for Image Conversion</h2>
            <p>How creators and developers use ImgMojo's Image Converter every day:</p>
          </div>

          <div className="ic-cards-grid">
            <div className="ic-feature-card">
              <h3>Next-Gen Web Optimization</h3>
              <p>
                Convert legacy JPG and PNG catalogs into WebP to reduce server bandwidth costs, accelerate page rendering, and improve SEO scores.
              </p>
            </div>

            <div className="ic-feature-card">
              <h3>Universal Sharing &amp; Compatibility</h3>
              <p>
                Convert iPhone HEIC or uncommon AVIF photos into universal JPG so clients, government portals, and legacy apps can view them effortlessly.
              </p>
            </div>

            <div className="ic-feature-card">
              <h3>Graphic Design &amp; Transparent Logos</h3>
              <p>
                Convert opaque images into transparent PNG or WebP files for clean overlays on presentation slides, pitch decks, and website headers.
              </p>
            </div>

            <div className="ic-feature-card">
              <h3>Email Newsletter Size Limits</h3>
              <p>
                Convert heavy PNG screenshots into lightweight JPG attachments to stay well under Gmail and Outlook's 20MB file threshold.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="ic-section" aria-labelledby="ic-faqs-heading">
          <div className="ic-section-head">
            <span className="ic-section-kicker">COMMON QUESTIONS</span>
            <h2 id="ic-faqs-heading">Frequently Asked Questions</h2>
            <p>Everything you need to know about converting images online:</p>
          </div>

          <div className="ic-faq-grid">
            {CONVERTER_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={faq.question} className="ic-faq-item">
                  <button
                    type="button"
                    className="ic-faq-btn"
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
                    <div className="ic-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Privacy & File Security */}
        <section className="ic-section" aria-labelledby="ic-security-heading">
          <div className="ic-section-head">
            <span className="ic-section-kicker" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
              <ShieldCheck size={14} /> PRIVACY &amp; FILE SECURITY
            </span>
            <h2 id="ic-security-heading">Is It Safe to Convert Images Online?</h2>
            <p>
              Yes, ImgMojo's Image Converter is completely private and secure. All conversions run locally in your web browser.
            </p>
          </div>

          <div className="ic-cards-grid">
            <div className="ic-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Client-Side Browser Execution</h3>
              </div>
              <p>
                Your files are decoded and re-encoded using the HTML5 Canvas API in local memory. No files are ever sent to remote cloud servers.
              </p>
            </div>

            <div className="ic-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Lock size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Zero Cloud Storage</h3>
              </div>
              <p>
                We do not maintain any server storage for converted images. Your files exist only in your browser tab's active session.
              </p>
            </div>

            <div className="ic-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock3 size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Zero Retention Duration</h3>
              </div>
              <p>
                Server retention is exactly 0 seconds. Once you close this window or clear your list, memory buffers are permanently erased.
              </p>
            </div>

            <div className="ic-feature-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Mail size={20} color="#059669" />
                <h3 style={{ margin: 0 }}>Privacy Inquiries</h3>
              </div>
              <p>
                Have questions regarding our privacy architecture? Review our <Link to="/privacy" style={{ color: 'var(--ic-brand)', textDecoration: 'underline' }}>Privacy Policy</Link> or reach out via our <Link to="/contact" style={{ color: 'var(--ic-brand)', textDecoration: 'underline' }}>Contact Page</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Related Tools Internal Navigation */}
        <section className="ic-section" aria-labelledby="ic-related-heading">
          <div className="ic-section-head">
            <span className="ic-section-kicker">EXPLORE MORE TOOLS</span>
            <h2 id="ic-related-heading">Explore More Image Tools</h2>
            <p>Discover other free browser-based creative tools from ImgMojo:</p>
          </div>

          <div className="ic-tools-nav-grid">
            {/* Tool: Compressor */}
            <div className="ic-tool-card">
              <div className="ic-tool-card-img-wrap">
                <img
                  src="https://images.openai.com/static-rsc-4/VFaspxX-JR677tnZRlkDdOGGHmPghimBwmPk3Xsw_NZ1LWnKoAXLCEIYevklP5PbejGW7TNyT3h0fO4oQ6Xa4wnxuqdhWX5Dqa3zXqxPN-IsttpfwigQg80q-QimpXUIsBWA-ImXlOdN8jBd8LP7hHkOJqD3U9Q_m9AJecqER10wz5iAhdagxuL2jNtlEsp7?purpose=inline"
                  alt="Compress Images Online"
                  className="ic-tool-card-img"
                  loading="lazy"
                />
              </div>
              <div className="ic-tool-card-body">
                <h3>Image Compressor</h3>
                <p>Reduce image file sizes by up to 80% without losing visible quality.</p>
                <Link to="/compress-image" className="ic-tool-card-link">
                  <span>Compress Images</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Tool: Resizer */}
            <div className="ic-tool-card">
              <div className="ic-tool-card-img-wrap">
                <img
                  src="https://images.openai.com/static-rsc-4/NsZfPIKBQoa62Rwu0OuMLX-bBWUHCyi2DRP1Xq7TU7It15XtMqgmCKQYnu_2q_GKmzvDggxfwHY7vPq31qUHqWmyBSBAlO6aTLBHCGaGl47HO39TZSwxSPX_cYRpIDow4UXU0uBZ6npwcQhhWPDBgtB4DPZivZaRX6fGieXbNV_OYp0iYEF9nHUWrPpNvUyG?purpose=inline"
                  alt="Resize Images Online"
                  className="ic-tool-card-img"
                  loading="lazy"
                />
              </div>
              <div className="ic-tool-card-body">
                <h3>Image Resizer</h3>
                <p>Resize pixel dimensions or scale images by percentage with aspect ratio lock.</p>
                <Link to="/image-resizer" className="ic-tool-card-link">
                  <span>Resize Image</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Tool: Cropper */}
            <div className="ic-tool-card">
              <div className="ic-tool-card-img-wrap">
                <img
                  src="https://images.openai.com/static-rsc-4/uKit9wbOytp1gYTj0mdrjDrA1kKm_ZgVNKmwDsI1T3E5bfiumeV6u-z7n8p-UHQncgzrAihQpgwDdLHc8iQZIrhcmfjx7y_2_nKqN1wVTIMhmVlIFQEtbkX1qqFm22AJLsvtZaSAteCkRfOTg-Ld7u3pRP8YKihGaBl72H6HPUK_qu8L7fhtfSi7fH3LXjeZ?purpose=inline"
                  alt="Crop Icon"
                  className="ic-tool-card-img"
                  loading="lazy"
                />
              </div>
              <div className="ic-tool-card-body">
                <h3>Image Cropper</h3>
                <p>Crop images to exact social media aspect ratios and custom dimensions.</p>
                <Link to="/image-cropper" className="ic-tool-card-link">
                  <span>Crop Image</span>
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
