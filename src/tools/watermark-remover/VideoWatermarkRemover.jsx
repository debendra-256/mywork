import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Film, LoaderCircle, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Upload, Video, Wand2, X } from 'lucide-react'
import './VideoWatermarkRemover.css'

const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const VIDEO_TYPES = /^video\/(mp4|webm|quicktime|x-matroska)$/i

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function downloadName(name, ext = 'webm') {
  const base = String(name || 'video').replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48)
  return `${base || 'video'}-no-watermark.${ext}`
}

export default function VideoWatermarkRemover({ onSwitchToPhoto, initialFile = null }) {
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [previewClean, setPreviewClean] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Watermark box in relative units (0 to 1)
  const [box, setBox] = useState({ x: 0.72, y: 0.84, w: 0.24, h: 0.12 })
  const [activePreset, setActivePreset] = useState('br')

  // Removal parameters
  const [method, setMethod] = useState('smart') // 'smart' | 'blur' | 'mosaic'
  const [blurStrength, setBlurStrength] = useState(16)

  // Export state
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const frameIdRef = useRef(null)
  const recorderRef = useRef(null)
  const playerFrameRef = useRef(null)

  // Dragging box state
  const dragRef = useRef({ dragging: false, resizing: false, startX: 0, startY: 0, initialBox: null })

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  // Clear notice after 4s
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  // Load a video file
  const loadVideo = useCallback((file) => {
    if (!file) return
    setError('')
    setNotice('')
    if (!VIDEO_TYPES.test(file.type) && !/\.(mp4|webm|mov|mkv)$/i.test(file.name)) {
      setError('Please choose an MP4, WebM, or MOV video file.')
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError('Keep the video file under 100 MB.')
      return
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl)
    const url = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoUrl(url)
    setPlaying(false)
    setCurrentTime(0)
  }, [videoUrl])

  useEffect(() => {
    if (initialFile) loadVideo(initialFile)
  }, [initialFile, loadVideo])

  // Presets
  const applyPreset = (presetKey) => {
    setActivePreset(presetKey)
    if (presetKey === 'tl') setBox({ x: 0.04, y: 0.04, w: 0.24, h: 0.11 })
    else if (presetKey === 'tr') setBox({ x: 0.72, y: 0.04, w: 0.24, h: 0.11 })
    else if (presetKey === 'bl') setBox({ x: 0.04, y: 0.85, w: 0.24, h: 0.11 })
    else if (presetKey === 'br') setBox({ x: 0.72, y: 0.85, w: 0.24, h: 0.11 })
    else if (presetKey === 'banner') setBox({ x: 0.04, y: 0.84, w: 0.92, h: 0.13 })
  }

  // Draw frame with watermark removal
  const drawFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    const ctx = canvas.getContext('2d')
    const cw = canvas.width
    const ch = canvas.height

    // Draw raw video frame
    ctx.drawImage(video, 0, 0, cw, ch)

    // If previewClean is active, process the watermark bounding box
    if (previewClean) {
      const rx = Math.max(0, Math.round(box.x * cw))
      const ry = Math.max(0, Math.round(box.y * ch))
      const rw = Math.min(cw - rx, Math.round(box.w * cw))
      const rh = Math.min(ch - ry, Math.round(box.h * ch))

      if (rw > 2 && rh > 2) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(rx, ry, rw, rh)
        ctx.clip()

        if (method === 'mosaic') {
          const blockSize = Math.max(6, Math.round(Math.min(rw, rh) / 8))
          const temp = document.createElement('canvas')
          temp.width = Math.max(1, Math.floor(rw / blockSize))
          temp.height = Math.max(1, Math.floor(rh / blockSize))
          const tCtx = temp.getContext('2d')
          tCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, temp.width, temp.height)
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(temp, 0, 0, temp.width, temp.height, rx, ry, rw, rh)
          ctx.imageSmoothingEnabled = true
        } else {
          // smart / blur diffusion
          const blurPx = Math.max(8, Math.round(blurStrength * (Math.min(rw, rh) / 80)))
          ctx.filter = `blur(${blurPx}px)`
          ctx.drawImage(canvas, 0, 0)
        }
        ctx.restore()
      }
    }
  }, [box, previewClean, method, blurStrength])

  // Playback loop
  useEffect(() => {
    if (!playing) {
      drawFrame()
      return
    }

    let active = true
    const loop = () => {
      if (!active) return
      drawFrame()
      if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
      frameIdRef.current = requestAnimationFrame(loop)
    }
    frameIdRef.current = requestAnimationFrame(loop)

    return () => {
      active = false
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current)
    }
  }, [playing, drawFrame])

  // Toggle Play / Pause
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {})
    } else {
      video.pause()
      setPlaying(false)
      drawFrame()
    }
  }

  // Seek video
  const onSeek = (event) => {
    const time = Number(event.target.value)
    setCurrentTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      drawFrame()
    }
  }

  // Mouse / Touch handlers for box dragging & resizing
  const onBoxPointerDown = (event, isResize = false) => {
    event.stopPropagation()
    const frame = playerFrameRef.current
    if (!frame) return

    const rect = frame.getBoundingClientRect()
    dragRef.current = {
      dragging: !isResize,
      resizing: isResize,
      startX: event.clientX,
      startY: event.clientY,
      initialBox: { ...box },
      frameW: rect.width,
      frameH: rect.height,
    }

    const onPointerMove = (moveEvent) => {
      const d = dragRef.current
      if (!d.dragging && !d.resizing) return
      const dx = (moveEvent.clientX - d.startX) / d.frameW
      const dy = (moveEvent.clientY - d.startY) / d.frameH

      if (d.dragging) {
        const nextX = Math.max(0, Math.min(1 - d.initialBox.w, d.initialBox.x + dx))
        const nextY = Math.max(0, Math.min(1 - d.initialBox.h, d.initialBox.y + dy))
        setBox((prev) => ({ ...prev, x: nextX, y: nextY }))
        setActivePreset('custom')
      } else if (d.resizing) {
        const nextW = Math.max(0.05, Math.min(1 - d.initialBox.x, d.initialBox.w + dx))
        const nextH = Math.max(0.04, Math.min(1 - d.initialBox.y, d.initialBox.h + dy))
        setBox((prev) => ({ ...prev, w: nextW, h: nextH }))
        setActivePreset('custom')
      }
    }

    const onPointerUp = () => {
      dragRef.current = { dragging: false, resizing: false }
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      drawFrame()
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // Export video
  const exportCleanVideo = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || exporting) return

    setError('')
    setNotice('Preparing clean video export…')
    setExporting(true)
    setExportProgress(0)

    try {
      video.pause()
      setPlaying(false)
      video.currentTime = 0

      // Wait for seeked to 0
      await new Promise((res) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked)
          res()
        }
        video.addEventListener('seeked', onSeeked)
      })

      // Capture canvas stream
      const stream = canvas.captureStream(30)

      // Add audio tracks if available
      try {
        if (video.captureStream) {
          const vStream = video.captureStream()
          vStream.getAudioTracks().forEach((track) => stream.addTrack(track))
        } else if (video.mozCaptureStream) {
          const vStream = video.mozCaptureStream()
          vStream.getAudioTracks().forEach((track) => stream.addTrack(track))
        }
      } catch {
        // Audio capture not supported in this browser context, continue with video
      }

      const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder
      const chunks = []

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunks.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = downloadName(videoFile?.name, ext)
        link.click()
        setTimeout(() => URL.revokeObjectURL(link.href), 5000)
        setExporting(false)
        setNotice('Export complete! Clean video downloaded.')
      }

      recorder.start(100)

      // Play video to record frames
      video.muted = true
      await video.play()

      const checkInterval = setInterval(() => {
        if (!recorderRef.current) {
          clearInterval(checkInterval)
          return
        }
        drawFrame()
        if (video.duration) {
          const progress = Math.min(1, video.currentTime / video.duration)
          setExportProgress(progress)
        }
        if (video.ended || video.currentTime >= video.duration - 0.1) {
          clearInterval(checkInterval)
          video.pause()
          recorder.stop()
        }
      }, 33)
    } catch (err) {
      setExporting(false)
      setError(err instanceof Error ? err.message : 'Could not export video.')
    }
  }

  const cancelExport = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    setExporting(false)
    if (videoRef.current) videoRef.current.pause()
    setNotice('Export cancelled.')
  }

  const onFileInput = (event) => {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ''
    if (file) loadVideo(file)
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      if (file.type?.startsWith('image/')) {
        onSwitchToPhoto?.(file)
      } else {
        loadVideo(file)
      }
    }
  }

  return (
    <div className="wm-body">
      <div
        className={`wm-workspace ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {!videoFile ? (
          <label className={`wm-drop ${dragging ? 'is-dragging' : ''}`}>
            <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={onFileInput} hidden />
            <span className="wm-drop-mark"><Film size={30} /></span>
            <strong>Upload Video to Remove Watermark</strong>
            <span>or drag an MP4, WebM, or MOV video here</span>
            <span className="wm-drop-button"><Upload size={14} /> Choose video file</span>
            <small>MP4, WebM, or MOV · up to 100 MB · processed securely in your browser</small>
          </label>
        ) : (
          <div className="vwm-container">
            {/* Hidden video playback source */}
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration)
                  drawFrame()
                }
              }}
              onSeeked={drawFrame}
              onEnded={() => setPlaying(false)}
              playsInline
              style={{ display: 'none' }}
            />

            <div className="vwm-video-stage">
              <div className="vwm-player-frame" ref={playerFrameRef}>
                <canvas
                  ref={canvasRef}
                  className="vwm-player-canvas"
                  onClick={togglePlay}
                  aria-label="Video frame preview"
                />

                {/* Draggable Watermark Box overlay */}
                <div
                  className={`vwm-box-overlay ${previewClean ? 'is-preview' : ''}`}
                  style={{
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.w * 100}%`,
                    height: `${box.h * 100}%`,
                  }}
                  onPointerDown={(e) => onBoxPointerDown(e, false)}
                >
                  <span className="vwm-box-label">Watermark Area</span>
                  {!previewClean && (
                    <div
                      className="vwm-box-handle br"
                      onPointerDown={(e) => onBoxPointerDown(e, true)}
                    />
                  )}
                </div>

                {/* Exporting progress overlay */}
                {exporting && (
                  <div className="vwm-exporting" role="status">
                    <LoaderCircle size={28} className="wm-spin" />
                    <strong>Exporting Clean Video ({Math.round(exportProgress * 100)}%)</strong>
                    <div className="vwm-export-progress-bar">
                      <div className="vwm-export-progress-fill" style={{ width: `${Math.round(exportProgress * 100)}%` }} />
                    </div>
                    <small>Processing video frames without watermark…</small>
                    <button className="wm-busy-cancel" type="button" onClick={cancelExport}><X size={13} /> Cancel</button>
                  </div>
                )}
              </div>

              {/* Video Player Controls */}
              <div className="vwm-controls">
                <button className="vwm-play-btn" type="button" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                  {playing ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <span className="vwm-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
                <input
                  type="range"
                  className="vwm-scrubber"
                  min="0"
                  max={duration || 100}
                  step="0.05"
                  value={currentTime}
                  onChange={onSeek}
                  aria-label="Seek video timeline"
                />
                <button
                  type="button"
                  className={`vwm-preview-toggle ${previewClean ? 'is-active' : ''}`}
                  onClick={() => { setPreviewClean(!previewClean); setTimeout(drawFrame, 20) }}
                >
                  <Wand2 size={12} /> {previewClean ? 'Watermark Defused' : 'Show Cleaned'}
                </button>
              </div>
            </div>
          </div>
        )}

        {notice && <p className="wm-notice" role="status">{notice}</p>}
        {error && <p className="wm-error" role="alert">{error}</p>}
      </div>

      {/* Video Sidebar Controls */}
      <aside className="wm-sidebar">
        <section className="wm-panel">
          <div className="wm-panel-head"><h2>Video Tool</h2><span>On-device</span></div>
          <ol className="wm-steps">
            <li className={videoFile ? 'is-done' : ''}><b>1</b><div><strong>Upload video clip</strong><small>MP4, WebM or MOV file.</small></div></li>
            <li className={videoFile ? 'is-done' : ''}><b>2</b><div><strong>Position watermark box</strong><small>Drag the box over logo or handle.</small></div></li>
            <li className={exporting ? 'is-done' : ''}><b>3</b><div><strong>Export clean video</strong><small>Downloaded directly to your device.</small></div></li>
          </ol>
        </section>

        {videoFile && (
          <>
            <section className="wm-panel">
              <div className="wm-panel-head"><h2>Watermark Position</h2><span>Quick Presets</span></div>
              <div className="vwm-presets">
                <button type="button" className={`vwm-preset-btn ${activePreset === 'br' ? 'is-active' : ''}`} onClick={() => applyPreset('br')}>Bottom Right</button>
                <button type="button" className={`vwm-preset-btn ${activePreset === 'bl' ? 'is-active' : ''}`} onClick={() => applyPreset('bl')}>Bottom Left</button>
                <button type="button" className={`vwm-preset-btn ${activePreset === 'tr' ? 'is-active' : ''}`} onClick={() => applyPreset('tr')}>Top Right</button>
                <button type="button" className={`vwm-preset-btn ${activePreset === 'tl' ? 'is-active' : ''}`} onClick={() => applyPreset('tl')}>Top Left</button>
                <button type="button" className={`vwm-preset-btn ${activePreset === 'banner' ? 'is-active' : ''}`} style={{ gridColumn: 'span 2' }} onClick={() => applyPreset('banner')}>Full Bottom Banner</button>
              </div>
              <p className="wm-note">You can also drag and resize the box directly on the video player.</p>
            </section>

            <section className="wm-panel">
              <div className="wm-panel-head"><h2>Defuse Settings</h2><span>{method}</span></div>
              <div className="wm-setting">
                <label>Method
                  <select value={method} onChange={(e) => { setMethod(e.target.value); setTimeout(drawFrame, 20) }} disabled={exporting}>
                    <option value="smart">Smart Diffusion</option>
                    <option value="blur">Defocus Blur</option>
                    <option value="mosaic">Pixelate Mosaic</option>
                  </select>
                </label>
              </div>
              <div className="wm-setting">
                <label>Strength
                  <input
                    type="range"
                    min="6"
                    max="36"
                    step="2"
                    value={blurStrength}
                    onChange={(e) => { setBlurStrength(Number(e.target.value)); setTimeout(drawFrame, 20) }}
                    disabled={exporting}
                    aria-label="Blur strength"
                  />
                  <span className="wm-setting-value">{blurStrength}px</span>
                </label>
              </div>
            </section>

            <section className="wm-panel">
              <div className="wm-panel-head"><h2>Export Video</h2><span>Clean MP4 / WebM</span></div>
              <button
                type="button"
                className="wm-primary wide"
                onClick={exportCleanVideo}
                disabled={exporting}
              >
                {exporting ? <LoaderCircle size={15} className="wm-spin" /> : <Download size={15} />}
                {exporting ? 'Exporting…' : 'Export Clean Video'}
              </button>
              <button
                type="button"
                className="wm-chip wide"
                onClick={() => {
                  setVideoFile(null)
                  setVideoUrl('')
                  setPlaying(false)
                }}
                disabled={exporting}
              >
                <RotateCcw size={13} /> Choose Another Video
              </button>
              <p>Re-encodes the clip with the selected watermark defused.</p>
            </section>
          </>
        )}

        <p className="wm-privacy"><ShieldCheck size={14} /> Your video never leaves this browser tab.</p>
      </aside>
    </div>
  )
}
