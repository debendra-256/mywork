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
  ArrowRight,
  LoaderCircle,
} from 'lucide-react'
import type { CompressionSettings, ImageItem, OutputFormat } from './types'
import { compressSingleImage, formatBytes, getFileExtension } from './compressEngine'
import { createAndDownloadZip, downloadSingleFile } from './zipEngine'
import './CompressImage.css'


export default function CompressImage() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(0)
  const [isZipping, setIsZipping] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)
  const [hasCompressed, setHasCompressed] = useState(false)

  const [settings, setSettings] = useState<CompressionSettings>({
    preset: 'custom',
    quality: 75,
    format: 'original',
    maxDimension: 0,
    zipFolderName: 'compressed-images',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMoreInputRef = useRef<HTMLInputElement>(null)

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl)
      })
    }
  }, [])

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
    if (items.length === 0 || isProcessing) return

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

  return (
    <div className="compress-image-page">
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

      {/* Header */}
      <header className="compress-header">
        <h1>
          Compress <span>Images</span>
        </h1>
      </header>

      {/* EMPTY STATE: Hero Dropzone */}
      {items.length === 0 && (
        <>
          <div
            className={`compress-dropzone-hero ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="dropzone-icon-bubble">
              <Upload size={34} />
            </div>
            <button
              type="button"
              className="compress-select-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={20} /> Select Images
            </button>
            <p className="dropzone-hint">or drag and drop multiple images here</p>

            <div className="dropzone-formats">
              <span className="format-badge">JPG</span>
              <span className="format-badge">PNG</span>
              <span className="format-badge">WEBP</span>
              <span className="format-badge">SVG</span>
              <span className="format-badge">GIF</span>
              <span className="format-badge">AVIF</span>
            </div>
          </div>

          {/* Features Strip */}
          <div className="compress-features-strip">
            <div className="feature-pill">
              <div className="feature-pill-icon">
                <ShieldCheck size={18} />
              </div>
              <div className="feature-pill-text">
                <strong>100% Client-Side Privacy</strong>
                <span>Files never upload to any remote server</span>
              </div>
            </div>
            <div className="feature-pill">
              <div className="feature-pill-icon">
                <FolderArchive size={18} />
              </div>
              <div className="feature-pill-text">
                <strong>Zipped Folder Download</strong>
                <span>Extracts into an organized folder</span>
              </div>
            </div>
            <div className="feature-pill">
              <div className="feature-pill-icon">
                <Zap size={18} />
              </div>
              <div className="feature-pill-text">
                <strong>Instant Batch Processing</strong>
                <span>Compress multiple high-res photos at once</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* WORKSPACE STATE: Files Loaded */}
      {items.length > 0 && (
        <div className="compress-workspace-container">
          {/* Post-compression Celebration / Summary Banner */}
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

          <div className="compress-workspace">
            {/* Left: Images List & Grid */}
            <div className="compress-main">
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

            {/* Right: Settings & Action Panel */}
            <aside className="compress-sidebar">
              <div className="settings-card">
                <h3>
                  <SlidersHorizontal size={16} /> Compression Options
                </h3>

                {/* Quality Slider — always visible */}
                <div className="setting-group">
                  <label className="setting-label">Compression Level</label>
                  <div className="slider-container">
                    <div className="slider-header">
                      <span>Quality</span>
                      <span className="slider-value">{settings.quality}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="98"
                      step="1"
                      value={settings.quality}
                      onChange={(e) => handleQualityChange(Number(e.target.value))}
                      className="slider-input"
                      disabled={isProcessing}
                    />
                    <div className="slider-labels">
                      <span>Smallest</span>
                      <span>Best Quality</span>
                    </div>
                  </div>
                </div>

                {/* Output Format */}
                <div className="setting-group">
                  <label className="setting-label">Output Format</label>
                  <select
                    className="select-input"
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
                    <option value="original">Keep original format</option>
                    <option value="image/webp">Convert all to WebP (Smallest file size)</option>
                    <option value="image/jpeg">Convert all to JPG (Maximum compatibility)</option>
                    <option value="image/png">Convert all to PNG (Lossless)</option>
                  </select>
                </div>

                {/* Optional Max Dimension */}
                <div className="setting-group">
                  <label className="setting-label">Resize Dimensions</label>
                  <select
                    className="select-input"
                    value={settings.maxDimension}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        maxDimension: Number(e.target.value),
                      }))
                      setHasCompressed(false)
                    }}
                    disabled={isProcessing}
                  >
                    <option value={0}>Original resolution</option>
                    <option value={1920}>Max 1920px (Full HD)</option>
                    <option value={1280}>Max 1280px (HD)</option>
                    <option value={800}>Max 800px (Web standard)</option>
                  </select>
                </div>

                {/* ZIP Folder Name */}
                <div className="setting-group">
                  <label className="setting-label">Folder Name in ZIP</label>
                  <input
                    type="text"
                    className="text-input"
                    value={settings.zipFolderName}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        zipFolderName: e.target.value,
                      }))
                    }
                    placeholder="compressed-images"
                    disabled={isProcessing}
                  />
                  <span className="input-hint">
                    Images will be archived inside this folder in the ZIP download.
                  </span>
                </div>

                {/* Main Action Button */}
                {!hasCompressed ? (
                  <button
                    type="button"
                    className="compress-action-btn"
                    onClick={startCompression}
                    disabled={isProcessing || items.length === 0}
                  >
                    {isProcessing ? (
                      <>
                        <LoaderCircle size={18} className="spinning" />
                        Compressing {processingIndex} of {items.length}...
                      </>
                    ) : (
                      <>
                        Compress IMAGES ({items.length}) <ArrowRight size={18} />
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
                          Zipping... {zipProgress > 0 ? `${zipProgress}%` : ''}
                        </>
                      ) : (
                        <>
                          <HardDriveDownload size={18} /> Download ZIP Folder
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="recompress-btn"
                      onClick={startCompression}
                      disabled={isProcessing}
                    >
                      <RefreshCw size={14} /> Re-compress with Current Settings
                    </button>
                  </>
                )}

                {/* Progress bar during compression */}
                {isProcessing && (
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
        </div>
      )}
    </div>
  )
}
