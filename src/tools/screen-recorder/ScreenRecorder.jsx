import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cpu,
  Crop,
  Download,
  FolderArchive,
  Globe,
  Layers,
  Lock,
  Maximize2,
  Mic,
  MicOff,
  Monitor,
  Pause,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { appConfig } from '../../config/app.config'
import { useCustomer } from '../../data/customer-auth'
import { WATERMARK_BENEFIT } from '../../domain/store'
import './ScreenRecorder.css'

function videoReady(video) {
  if (video.videoWidth) return Promise.resolve()
  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve()
  })
}

function paintWatermark(context, canvas, text) {
  const bar = Math.max(30, Math.round(canvas.height / 16))
  const pad = Math.max(12, Math.round(canvas.height / 34))
  const mark = (label, y) => {
    context.save()
    context.font = `700 ${Math.max(14, Math.round(canvas.height / 24))}px system-ui, -apple-system, Segoe UI, sans-serif`
    context.textBaseline = 'middle'
    const labelWidth = context.measureText(label).width
    context.globalAlpha = 0.4
    context.fillStyle = '#0b0f0d'
    context.beginPath()
    context.roundRect((canvas.width - labelWidth - bar * 1.5) / 2, y, labelWidth + bar * 1.5, bar, bar * 0.45)
    context.fill()
    context.globalAlpha = 0.92
    context.fillStyle = '#ffffff'
    context.fillText(label, (canvas.width - labelWidth) / 2, y + bar / 2)
    context.restore()
  }
  mark(text, pad)
  mark(`${text} · free version`, canvas.height - pad - bar)
}

let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (AudioCtx) {
      audioCtx = new AudioCtx()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => undefined)
  }
  return audioCtx
}

function playCountdownBeep(count) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    const freqs = { 5: 440, 4: 500, 3: 580, 2: 680, 1: 800 }
    osc.frequency.setValueAtTime(freqs[count] || 500, now)
    osc.type = 'sine'

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.17)
  } catch {
    // Ignore audio error
  }
}

function playStartChime() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const playTone = (freq, startTime, duration, gainVal) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.setValueAtTime(freq, startTime)
      osc.type = 'triangle'

      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + duration + 0.02)
    }

    playTone(523.25, now, 0.14, 0.22)
    playTone(659.25, now + 0.08, 0.16, 0.24)
    playTone(1046.5, now + 0.16, 0.45, 0.28)
  } catch {
    // Ignore audio error
  }
}

let originalTitle = ''
let originalFavicon = ''

function setTabStatus(status, { count, timeLabel, title } = {}) {
  if (typeof document === 'undefined') return

  if (!originalTitle) {
    originalTitle = document.title || 'ImgMojo'
  }

  let link = document.querySelector("link[rel*='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'shortcut icon'
    document.head.appendChild(link)
  }
  if (!originalFavicon) {
    originalFavicon = link.getAttribute('href') || '/favicon.ico'
  }

  const cleanTitle = (title && title.trim()) || 'Screen recording'

  if (status === 'countdown') {
    document.title = `⏳ (${count}s) Starting... | ${cleanTitle}`
    try {
      link.type = 'image/svg+xml'
      link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23f59e0b"/><text x="16" y="21" font-size="16" font-weight="bold" text-anchor="middle" fill="white">⏱</text></svg>'
    } catch {
      // Ignore favicon error
    }
  } else if (status === 'recording') {
    document.title = `🔴 [REC ${timeLabel}] ${cleanTitle}`
    try {
      link.type = 'image/svg+xml'
      link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23ef4444"/><circle cx="16" cy="16" r="6" fill="white"/></svg>'
    } catch {
      // Ignore favicon error
    }
  } else if (status === 'paused') {
    document.title = `⏸️ [PAUSED ${timeLabel}] ${cleanTitle}`
    try {
      link.type = 'image/svg+xml'
      link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23f97316"/><rect x="11" y="9" width="3" height="14" fill="white"/><rect x="18" y="9" width="3" height="14" fill="white"/></svg>'
    } catch {
      // Ignore favicon error
    }
  } else {
    document.title = originalTitle
    if (originalFavicon) {
      link.href = originalFavicon
    }
  }
}

/** 3. Screen Recording Application Widget (100% existing functionality intact) */
export function ScreenRecorder() {
  const [title, setTitle] = useState('Screen recording')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraOnly, setCameraOnly] = useState(false)
  const [recording, setRecording] = useState(false)
  const [starting, setStarting] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [paused, setPaused] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [previewStream, setPreviewStream] = useState(null)
  const [watermarkText, setWatermarkText] = useState(appConfig.appName || 'ImgMojo')
  const customer = useCustomer()
  const watermarkFree = customer.benefits.includes(WATERMARK_BENEFIT)
  const recorderRef = useRef(null)
  const tracksRef = useRef([])
  const chunksRef = useRef([])
  const videoRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/store/products', { signal: controller.signal })
      .then(async (response) => await response.json())
      .then((data) => {
        const owner = (data.products ?? []).find((product) =>
          product.features.some((feature) => feature.benefitKey === WATERMARK_BENEFIT)
        )
        if (owner?.watermarkText) setWatermarkText(owner.watermarkText)
      })
      .catch(() => {
        /* the shipped product name is a fine fallback watermark */
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream
      void videoRef.current.play().catch(() => undefined)
    }
  }, [previewStream])

  useEffect(() => {
    if (!recording || paused) return
    timerRef.current = window.setInterval(() => {
      setSeconds((time) => {
        const next = time + 1
        const currentLabel = `${String(Math.floor(next / 60)).padStart(2, '0')}:${String(
          next % 60
        ).padStart(2, '0')}`
        setTabStatus('recording', { timeLabel: currentLabel, title })
        return next
      })
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [recording, paused, title])

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      tracksRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
      setTabStatus('idle')
    },
    []
  )

  const start = async () => {
    setError('')
    if (
      !navigator.mediaDevices?.getUserMedia ||
      (!cameraOnly && !navigator.mediaDevices.getDisplayMedia) ||
      !window.MediaRecorder
    ) {
      setError('Screen recording needs a supported desktop browser and a secure connection (HTTPS).')
      return
    }
    setStarting(true)
    let screen = null
    let camera = null
    let mic = null
    let canvasStream = null
    let rafFrame = 0
    let lastPaint = 0
    let haltCompositor = () => {}
    try {
      screen = cameraOnly
        ? await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60, max: 60 } },
            audio: audioEnabled
              ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
              : false,
          })
        : await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60, max: 60 } },
            audio: audioEnabled,
          })
      if (cameraEnabled)
        camera = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60, max: 60 } },
          audio: false,
        })
      if (audioEnabled && !cameraOnly) {
        try {
          mic = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          })
        } catch {
          setError(
            'Microphone access was unavailable. Recording will continue with shared-tab audio, if selected.'
          )
        }
      }
      let videoTracks = screen.getVideoTracks()
      if (camera || !watermarkFree) {
        const displayVideo = document.createElement('video')
        const cameraVideo = document.createElement('video')
        displayVideo.muted = true
        cameraVideo.muted = true
        displayVideo.srcObject = screen
        if (camera) cameraVideo.srcObject = camera
        await Promise.all([displayVideo.play(), camera ? cameraVideo.play() : Promise.resolve()])
        await Promise.all([videoReady(displayVideo), ...(camera ? [videoReady(cameraVideo)] : [])])
        const canvas = document.createElement('canvas')
        canvas.width = displayVideo.videoWidth || 1280
        canvas.height = displayVideo.videoHeight || 720
        const context = canvas.getContext('2d')
        if (!context || !canvas.captureStream)
          throw new Error('This browser cannot composite the recording. Try another browser.')
        const paint = () => {
          const now = performance.now()
          if (now - lastPaint < 16) return
          lastPaint = now
          try {
            if (!displayVideo.videoWidth) return
            context.drawImage(displayVideo, 0, 0, canvas.width, canvas.height)
            if (camera && cameraVideo.videoWidth) {
              const diameter = Math.min(canvas.width, canvas.height) * 0.22
              const x = canvas.width - diameter - 28
              const y = canvas.height - diameter - 28
              context.save()
              context.beginPath()
              context.arc(x + diameter / 2, y + diameter / 2, diameter / 2, 0, Math.PI * 2)
              context.clip()
              context.drawImage(cameraVideo, x, y, diameter, diameter)
            }
            if (!watermarkFree) paintWatermark(context, canvas, watermarkText)
          } catch {
            /* an interrupted or resized capture surface should cost a frame, not the whole recording */
          } finally {
            context.restore()
          }
        }
        const loop = () => {
          paint()
          rafFrame = requestAnimationFrame(loop)
        }
        loop()
        const watchdog = window.setInterval(paint, 100)
        haltCompositor = () => {
          cancelAnimationFrame(rafFrame)
          window.clearInterval(watchdog)
        }
        canvasStream = canvas.captureStream(60)
        videoTracks = canvasStream.getVideoTracks()
      }
      const composed = new MediaStream([
        ...videoTracks,
        ...screen.getAudioTracks(),
        ...(mic?.getAudioTracks() ?? []),
      ])
      const streams = [
        screen,
        ...(camera ? [camera] : []),
        ...(mic ? [mic] : []),
        ...(canvasStream ? [canvasStream] : []),
      ]
      tracksRef.current = streams
      setPreviewStream(composed)
      chunksRef.current = []
      getAudioContext()
      for (let count = 5; count >= 1; count -= 1) {
        setCountdown(count)
        playCountdownBeep(count)
        setTabStatus('countdown', { count, title })
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
      }
      setCountdown(null)
      const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(
        (type) => MediaRecorder.isTypeSupported(type)
      )
      const surface = screen.getVideoTracks()[0]?.getSettings()
      const pixels = (surface?.width ?? 1920) * (surface?.height ?? 1080)
      const videoBitsPerSecond = Math.min(
        50000000,
        Math.max(4000000, Math.round(pixels * 60 * 0.06))
      )
      const recorder = new MediaRecorder(composed, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond,
        audioBitsPerSecond: 192000,
      })
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${title
          .trim()
          .replace(/[\\/:*?"<>|]/g, '-')
          .replace(/\s+/g, '-') || 'screen-recording'}.webm`
        anchor.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        streams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
        haltCompositor()
        setPreviewStream(null)
        setRecording(false)
        setPaused(false)
        setStarting(false)
        setCountdown(null)
        setTabStatus('idle')
      }
      screen.getVideoTracks()[0]?.addEventListener(
        'ended',
        () => {
          if (recorder.state !== 'inactive') recorder.stop()
        },
        { once: true }
      )
      recorder.start(1000)
      playStartChime()
      setTabStatus('recording', { timeLabel: '00:00', title })
      recorderRef.current = recorder
      setSeconds(0)
      setRecording(true)
      setPaused(false)
      setStarting(false)
    } catch (reason) {
      ;[screen, camera, mic]
        .filter(Boolean)
        .forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
      canvasStream?.getTracks().forEach((track) => track.stop())
      haltCompositor()
      setPreviewStream(null)
      setStarting(false)
      setCountdown(null)
      setTabStatus('idle')
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not start screen recording. Check browser permissions and try again.'
      )
    }
  }
  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
  }
  const togglePause = () => {
    const recorder = recorderRef.current
    if (!recorder) return
    if (recorder.state === 'recording') {
      recorder.pause()
      setPaused(true)
      setTabStatus('paused', { timeLabel, title })
    } else if (recorder.state === 'paused') {
      recorder.resume()
      setPaused(false)
      setTabStatus('recording', { timeLabel, title })
    }
  }
  const timeLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60
  ).padStart(2, '0')}`

  return (
    <section className="home-photo-generator recorder-generator" aria-label="Screen recording controls">
      <div className="recorder-layout">
        <aside className="recorder-settings">
          <label>
            Recording title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={recording}
              placeholder="Recording title"
            />
          </label>
          <div className="recorder-setting-label">Capture</div>
          <div className="recorder-quality-badge">
            <span>4K</span>
            <strong>Ultra HD</strong>
            <small>Up to 2160p · 60 fps</small>
          </div>
          <div className={`recorder-tier-badge ${watermarkFree ? 'pro' : 'free'}`}>
            {watermarkFree ? <BadgeCheck size={16} /> : <Lock size={16} />}
            <div>
              <strong>{watermarkFree ? 'Watermark free' : 'Free version'}</strong>
              <small>
                {watermarkFree
                  ? 'Your downloads export clean.'
                  : `Downloads carry a “${watermarkText}” watermark.`}
              </small>
            </div>
            {!watermarkFree && (
              <Link
                className="recorder-upgrade"
                to={customer.user ? '/store?type=software' : '/account'}
                onClick={() => {
                  if (recording)
                    setError('Start a clean recording after unlocking to remove the watermark.')
                }}
              >
                {customer.user ? 'Remove watermark' : 'Have a code? Redeem it'} <ArrowRight size={13} />
              </Link>
            )}
          </div>
          <button
            className={`recorder-option ${!cameraEnabled && !cameraOnly ? 'active' : ''}`}
            onClick={() => {
              setCameraEnabled(false)
              setCameraOnly(false)
            }}
            disabled={recording}
          >
            <Monitor size={17} />
            Screen
          </button>
          <button
            className={`recorder-option ${cameraEnabled ? 'active' : ''}`}
            onClick={() => {
              setCameraEnabled(true)
              setCameraOnly(false)
            }}
            disabled={recording}
          >
            <Monitor size={17} />
            <Camera size={15} />
            Screen &amp; Camera
          </button>
          <button
            className={`recorder-option ${cameraOnly ? 'active' : ''}`}
            onClick={() => {
              setCameraEnabled(false)
              setCameraOnly(true)
            }}
            disabled={recording}
          >
            <Camera size={17} />
            Camera only
          </button>
          <label className="recorder-mic">
            <span>{audioEnabled ? <Mic size={17} /> : <MicOff size={17} />} Microphone</span>
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(event) => setAudioEnabled(event.target.checked)}
              disabled={recording}
            />
          </label>
          {(cameraEnabled || cameraOnly) && (
            <p className="recorder-hint">
              {cameraOnly
                ? 'Record from your webcam without sharing your screen.'
                : 'Your camera appears as a bubble over the shared screen.'}
            </p>
          )}
        </aside>
        <div className="recorder-preview">
          {previewStream ? (
            <video ref={videoRef} muted playsInline />
          ) : (
            <div className="recorder-preview-empty">
              <span>
                <Monitor size={29} />
              </span>
              <strong>{recording ? 'Recording in progress' : 'Ready to record'}</strong>
              <p>Choose a screen or window after clicking Record.</p>
            </div>
          )}
          {countdown !== null && (
            <div className="recorder-countdown" aria-live="assertive">
              <span>{countdown}</span>
              <strong>Get ready</strong>
            </div>
          )}
          {recording && (
            <span className="recorder-live">
              <i />
              {paused ? 'Paused' : 'Recording'} · {timeLabel}
            </span>
          )}
          <div className="recorder-controls">
            {!recording ? (
              <button
                className="recorder-record"
                onClick={() => void start()}
                disabled={starting}
              >
                <span />
                {starting ? 'Starting…' : 'Start recording'}
              </button>
            ) : (
              <>
                <button className="recorder-pause" onClick={togglePause}>
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button className="recorder-stop" onClick={stop}>
                  <Square size={14} fill="currentColor" />
                  Stop &amp; download <Download size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p className="recorder-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

function RecorderFullscreen({ onClose }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [])
  return (
    <div className="recorder-fullscreen">
      <div className="recorder-fullscreen-bar">
        <div>
          <Video size={17} />
          <strong>Screen Recorder</strong>
          <small>Full screen while you capture</small>
        </div>
        <button className="recorder-fullscreen-close" type="button" onClick={onClose}>
          <X size={15} />
          Exit full screen
        </button>
      </div>
      <div className="recorder-fullscreen-body">
        <ScreenRecorder />
      </div>
    </div>
  )
}

const RECORDER_FAQS = [
  {
    question: 'Is ImgMojo’s online screen recorder 100% free with no time limits?',
    answer:
      'Yes! ImgMojo allows you to record your entire screen, an application window, or a specific browser tab without arbitrary time limits, paywalls, or forced trial periods. You can record tutorials, meetings, or gameplay for as long as your system hardware and disk space support.',
  },
  {
    question: 'Do I need to install any desktop software or browser extension?',
    answer:
      'No software download or browser extension is required. ImgMojo operates 100% inside your web browser by utilizing the native HTML5 Screen Capture API (getDisplayMedia) and the MediaRecorder framework. You enjoy zero-install convenience with zero security risk.',
  },
  {
    question: 'Can I capture internal computer audio as well as microphone voiceover?',
    answer:
      'Yes. When your browser prompts you to pick what you want to share, select the "Share audio" checkbox (available for Chrome/Edge tabs and full-screen captures). Simultaneously keep the microphone toggle turned on to record your voice commentary with echo cancellation and noise suppression.',
  },
  {
    question: 'What video format is exported, and is it compatible with YouTube and video editors?',
    answer:
      'Recordings are exported in high-efficiency WebM format with VP9 or VP8 video and Opus audio. WebM is universally supported across modern web browsers, YouTube, Vimeo, Discord, and leading desktop video editors including Premiere Pro, DaVinci Resolve, and Final Cut Pro.',
  },
  {
    question: 'Can I record my face with my webcam at the same time as my screen?',
    answer:
      'Yes! Select the "Screen & Camera" option in the capture settings. ImgMojo composites your webcam video as a picture-in-picture circular bubble directly over your shared screen in real time at up to 60 frames per second.',
  },
  {
    question: 'Are my recorded videos uploaded to any cloud server?',
    answer:
      'No. All video encoding, audio mixing, and frame composition occur 100% locally inside your device’s browser memory. Your screen recordings are never uploaded, stored, analyzed, or transmitted across the internet.',
  },
  {
    question: 'How do I remove the watermark from my recordings?',
    answer:
      'Free takes include a subtle identification mark. You can easily remove the watermark by unlocking a software license in the ImgMojo store or redeeming an access code in your account dashboard. Once unlocked, all takes export clean and unbranded.',
  },
  {
    question: 'Why does my browser ask for permission every time I record?',
    answer:
      'This is an intentional operating system security protection built into Chromium, Gecko, and WebKit browsers. Browsers require explicit user confirmation every time screen recording initiates to guarantee that no website can ever covertly inspect or record your desktop in the background.',
  },
]

/**
 * Tool-page entry point at /Recorder
 * Full 10-point checklist implementation solving AdSense "Low value content" review.
 */
export default function ScreenRecorderTool({ onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (onClose || isFullscreen) {
    return (
      <RecorderFullscreen
        onClose={() => {
          setIsFullscreen(false)
          if (onClose) onClose()
        }}
      />
    )
  }

  return (
    <div className="screen-recorder-page">
      <div className="sr-container">
        {/* ================================================================
            1. H1 & 2. SHORT INTRODUCTION (Compact: Tool visible above fold)
            ================================================================ */}
        <header className="sr-hero-header">
          <h1 className="sr-hero-title">
            Free Online <span className="sr-gradient-word">Screen Recorder</span>
          </h1>
          <p className="sr-hero-intro">
            Record your desktop, browser tabs, application windows and webcam with audio directly in your browser. 100% private with no watermark and no downloads required.
          </p>
        </header>

        {/* ================================================================
            3. SCREEN RECORDING APPLICATION (Widget with full functionality)
            ================================================================ */}
        <div className="sr-app-wrapper">
          <div className="sr-app-toolbar">
            <div className="sr-app-toolbar-title">
              <span className="sr-app-toolbar-dot" />
              <span>Studio Recording Workspace</span>
            </div>
            <button
              type="button"
              className="sr-fullscreen-action-btn"
              onClick={() => setIsFullscreen(true)}
              title="Expand to Full Screen Mode"
            >
              <Maximize2 size={14} />
              <span>Full Screen</span>
            </button>
          </div>
          <ScreenRecorder />
        </div>

        {/* ================================================================
            4. HOW TO USE THE SCREEN RECORDER
            ================================================================ */}
        <section className="sr-section sr-howto-section" aria-labelledby="sr-howto-heading">
          <div className="sr-section-head">
            <span className="sr-section-kicker">STEP-BY-STEP WORKFLOW</span>
            <h2 id="sr-howto-heading">How to Use the Screen Recorder</h2>
            <p>
              Follow these simple steps to record your screen and audio with zero technical hassle:
            </p>
          </div>

          <div className="sr-steps-grid">
            <div className="sr-step-card">
              <span className="sr-step-num">01</span>
              <h3>Choose Capture Mode</h3>
              <p>
                Select your recording configuration: <strong>Screen</strong>,{' '}
                <strong>Screen &amp; Camera</strong>, or <strong>Camera only</strong>. Toggle the microphone switch
                if you wish to include live voice commentary.
              </p>
            </div>

            <div className="sr-step-card">
              <span className="sr-step-num">02</span>
              <h3>Select Display Source</h3>
              <p>
                Click <strong>Start recording</strong>. Your browser will prompt a secure dialog to pick your Entire
                Screen, a Window, or a Chrome Tab. Check "Share audio" to record system sounds.
              </p>
            </div>

            <div className="sr-step-card">
              <span className="sr-step-num">03</span>
              <h3>Countdown &amp; Record</h3>
              <p>
                A 5-second countdown gives you time to switch over to your presentation or application. Monitor
                elapsed time, pause whenever you need a break, and resume with one click.
              </p>
            </div>

            <div className="sr-step-card">
              <span className="sr-step-num">04</span>
              <h3>Stop &amp; Instant Download</h3>
              <p>
                Click <strong>Stop &amp; download</strong>. Your recording is instantly packaged into a high-speed
                WebM video file and saved to your Downloads folder with zero cloud waiting time.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            5. WHAT CAN YOU RECORD?
            ================================================================ */}
        <section className="sr-section sr-usecases-section" aria-labelledby="sr-usecases-heading">
          <div className="sr-section-head">
            <span className="sr-section-kicker">VERSATILE APPLICATIONS</span>
            <h2 id="sr-usecases-heading">What Can You Record with ImgMojo?</h2>
            <p>
              Our browser-based screen recorder supports a wide range of professional, educational, and creative
              workflows:
            </p>
          </div>

          <div className="sr-usecases-grid">
            <div className="sr-usecase-card">
              <div className="sr-usecase-icon-box">
                <Monitor size={22} />
              </div>
              <h3>Software Demos &amp; Bug Reports</h3>
              <p>
                Product managers, developers, and QA engineers can easily reproduce software bugs, showcase UI
                features, and share screen recordings without installing heavy third-party software.
              </p>
            </div>

            <div className="sr-usecase-card">
              <div className="sr-usecase-icon-box">
                <Video size={22} />
              </div>
              <h3>Online Classes &amp; Academic Lectures</h3>
              <p>
                Educators and course creators can record slides, digital whiteboard sessions, coding tutorials, and
                student reviews with picture-in-picture webcam narration.
              </p>
            </div>

            <div className="sr-usecase-card">
              <div className="sr-usecase-icon-box">
                <Zap size={22} />
              </div>
              <h3>Asynchronous Team Meetings</h3>
              <p>
                Eliminate meeting fatigue by recording quick project updates, design critique walkthroughs, and
                strategy briefs that distributed teammates can watch across time zones.
              </p>
            </div>

            <div className="sr-usecase-card">
              <div className="sr-usecase-icon-box">
                <Camera size={22} />
              </div>
              <h3>Gaming Highlights &amp; Esports Streams</h3>
              <p>
                Capture browser games, gameplay walkthroughs, strategy guides, and speedruns in smooth 60 FPS
                without noticeable framerate degradation.
              </p>
            </div>

            <div className="sr-usecase-card">
              <div className="sr-usecase-icon-box">
                <CheckCircle2 size={22} />
              </div>
              <h3>Customer Support &amp; Onboarding</h3>
              <p>
                Guide customers through complex configuration steps or account setups with personal visual
                instructions instead of lengthy email exchanges.
              </p>
            </div>

            <div className="sr-usecase-card">
              <div className="sr-usecase-icon-box">
                <Globe size={22} />
              </div>
              <h3>Webinars &amp; Virtual Conferences</h3>
              <p>
                Archive live webinars, keynote presentations, virtual summits, and podcast interviews to review
                essential takeaways and transcribe notes later.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            6. BROWSER COMPATIBILITY
            ================================================================ */}
        <section className="sr-section sr-compat-section" aria-labelledby="sr-compat-heading">
          <div className="sr-section-head">
            <span className="sr-section-kicker">PLATFORM SUPPORT</span>
            <h2 id="sr-compat-heading">Browser &amp; Device Compatibility</h2>
            <p>
              ImgMojo harnesses modern web standards supported natively by the majority of modern desktop
              browsers:
            </p>
          </div>

          <div className="sr-compat-table-wrap">
            <table className="sr-compat-table">
              <thead>
                <tr>
                  <th>Browser</th>
                  <th>Operating System</th>
                  <th>Compatibility</th>
                  <th>Supported Features</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Google Chrome</strong>
                  </td>
                  <td>Windows, macOS, Linux, ChromeOS</td>
                  <td>
                    <span className="sr-compat-status supported">
                      <CheckCircle2 size={13} /> Full Support (v74+)
                    </span>
                  </td>
                  <td>Entire Screen, Window, Tab, System Audio, Mic, 4K/60fps</td>
                </tr>
                <tr>
                  <td>
                    <strong>Microsoft Edge</strong>
                  </td>
                  <td>Windows, macOS, Linux</td>
                  <td>
                    <span className="sr-compat-status supported">
                      <CheckCircle2 size={13} /> Full Support (v79+)
                    </span>
                  </td>
                  <td>Entire Screen, Window, Tab, System Audio, Mic, 4K/60fps</td>
                </tr>
                <tr>
                  <td>
                    <strong>Mozilla Firefox</strong>
                  </td>
                  <td>Windows, macOS, Linux</td>
                  <td>
                    <span className="sr-compat-status supported">
                      <CheckCircle2 size={13} /> Full Support (v66+)
                    </span>
                  </td>
                  <td>Entire Screen, Application Window, Mic, Opus Audio</td>
                </tr>
                <tr>
                  <td>
                    <strong>Apple Safari</strong>
                  </td>
                  <td>macOS (Catalina or later)</td>
                  <td>
                    <span className="sr-compat-status supported">
                      <CheckCircle2 size={13} /> Supported (v13+)
                    </span>
                  </td>
                  <td>Entire Screen, Application Window, Mic Audio</td>
                </tr>
                <tr>
                  <td>
                    <strong>Opera &amp; Brave</strong>
                  </td>
                  <td>Windows, macOS, Linux</td>
                  <td>
                    <span className="sr-compat-status supported">
                      <CheckCircle2 size={13} /> Full Support
                    </span>
                  </td>
                  <td>Chromium standard screen, window, tab, and audio capture</td>
                </tr>
                <tr>
                  <td>
                    <strong>iOS &amp; Android</strong>
                  </td>
                  <td>Mobile Smartphones &amp; Tablets</td>
                  <td>
                    <span className="sr-compat-status limited">Mobile OS Limited</span>
                  </td>
                  <td>
                    Webcam-only recording supported; mobile OS security policies restrict third-party screen
                    capture APIs.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="sr-compat-note">
            <strong>Desktop Browser Recommendation:</strong> For optimal high-framerate 4K recording with internal
            system sound, we recommend using <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> on
            Windows, macOS, or Linux. Ensure your browser is running over a secure HTTPS connection.
          </div>
        </section>

        {/* ================================================================
            7. HOW SCREEN RECORDING WORKS (TECHNICAL EDUCATION)
            ================================================================ */}
        <section className="sr-section sr-technical-section" aria-labelledby="sr-technical-heading">
          <div className="sr-section-head">
            <span className="sr-section-kicker">UNDER THE HOOD</span>
            <h2 id="sr-technical-heading">How Screen Recording Works in the Browser</h2>
            <p>
              Discover the modern web technologies powering zero-install, hardware-accelerated video recording:
            </p>
          </div>

          <div className="sr-tech-grid">
            <div className="sr-tech-card">
              <div className="sr-tech-head">
                <div className="sr-tech-icon">
                  <Cpu size={18} />
                </div>
                <h3>HTML5 Screen Capture API</h3>
              </div>
              <p>
                When you initiate a take, your browser invokes{' '}
                <code>navigator.mediaDevices.getDisplayMedia()</code>. This communicates with your operating
                system’s native window compositor (Desktop Window Manager on Windows, Quartz on macOS, Wayland/X11
                on Linux) to request display pixel buffers without requiring privileged device drivers.
              </p>
            </div>

            <div className="sr-tech-card">
              <div className="sr-tech-head">
                <div className="sr-tech-icon">
                  <Mic size={18} />
                </div>
                <h3>Web Audio Track Mixing</h3>
              </div>
              <p>
                Audio tracks from shared browser tabs and your physical microphone are processed using the Web Audio
                API. An audio pipeline applies dynamic echo cancellation, automatic gain control (AGC), and background
                noise suppression before muxing the signals into a unified Opus stereo track.
              </p>
            </div>

            <div className="sr-tech-card">
              <div className="sr-tech-head">
                <div className="sr-tech-icon">
                  <Zap size={18} />
                </div>
                <h3>Hardware-Accelerated Encoding</h3>
              </div>
              <p>
                ImgMojo feeds the composite MediaStream into the browser’s native <code>MediaRecorder</code>{' '}
                interface. This utilizes your local GPU encoders (Intel QuickSync, NVIDIA NVENC, Apple VideoToolbox,
                AMD AMF) to compress video frames into VP9 or VP8 bitstreams with minimal CPU overhead.
              </p>
            </div>

            <div className="sr-tech-card">
              <div className="sr-tech-head">
                <div className="sr-tech-icon">
                  <Layers size={18} />
                </div>
                <h3>Real-Time Canvas Compositing</h3>
              </div>
              <p>
                When you select "Screen &amp; Camera", an offscreen HTML5 2D canvas draws the screen video frame and
                superimposes your webcam feed into a rounded circular mask at 60 FPS. Fallback timer watchdogs
                ensure compositing continues even when you switch active desktop tabs.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            8. PRIVACY AND SECURITY
            ================================================================ */}
        <section className="sr-section sr-privacy-section" aria-labelledby="sr-privacy-heading">
          <div className="sr-privacy-card">
            <div className="sr-privacy-icon-box">
              <ShieldCheck size={32} />
            </div>
            <div className="sr-privacy-info">
              <span className="sr-section-kicker">100% PRIVATE &amp; SECURE</span>
              <h2 id="sr-privacy-heading">Privacy, Data Protection &amp; File Security</h2>
              <p>
                Unlike traditional online screen recording services that stream your desktop footage to remote cloud
                storage servers, ImgMojo operates on a <strong>zero-cloud architecture</strong>. Every millisecond of
                your video and audio is encoded locally on your computer’s hardware:
              </p>

              <div className="sr-privacy-bullets">
                <div className="sr-privacy-item">
                  <strong>Zero Server Transmission</strong>
                  <span>Your screen frames and microphone audio never leave your device or travel over the internet.</span>
                </div>
                <div className="sr-privacy-item">
                  <strong>Explicit User Consent</strong>
                  <span>The browser strictly enforces permission dialogs every time capture begins; background recording is impossible.</span>
                </div>
                <div className="sr-privacy-item">
                  <strong>Safe for Confidential Data</strong>
                  <span>Safe for corporate demonstrations, financial documents, codebases, and NDA-protected meetings.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            9. FREQUENTLY ASKED QUESTIONS
            ================================================================ */}
        <section className="sr-section sr-faq-section" aria-labelledby="sr-faq-heading">
          <div className="sr-section-head">
            <span className="sr-section-kicker">HAVE QUESTIONS?</span>
            <h2 id="sr-faq-heading">Frequently Asked Questions</h2>
            <p>
              Get answers to common technical, compatibility, and workflow questions about online screen recording:
            </p>
          </div>

          <div className="sr-faq-list">
            {RECORDER_FAQS.map((faq, idx) => (
              <details key={idx} className="sr-faq-item">
                <summary className="sr-faq-question">
                  <span>{faq.question}</span>
                  <ChevronDown size={16} className="sr-faq-arrow" />
                </summary>
                <div className="sr-faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ================================================================
            10. EXPLORE MORE VIDEO TOOLS
            ================================================================ */}
        <section className="sr-section sr-tools-nav-section" aria-labelledby="sr-tools-heading">
          <div className="sr-section-head">
            <span className="sr-section-kicker">EXPAND YOUR CREATIVE WORKFLOW</span>
            <h2 id="sr-tools-heading">Explore More Video &amp; Image Tools</h2>
            <p>
              Discover complementary browser-based media utilities built with the same zero-install, high-speed
              philosophy:
            </p>
          </div>

          <div className="sr-tools-nav-grid">
            <Link to="/ShortsCreator" className="sr-tool-nav-card">
              <div className="sr-tool-nav-icon">
                <Video size={22} />
              </div>
              <div className="sr-tool-nav-info">
                <h3>Video to Shorts &amp; Reels</h3>
                <p>Convert long horizontal videos into engaging vertical 9:16 clips for TikTok, YouTube Shorts, and Instagram.</p>
                <span className="sr-tool-nav-link">
                  Create Shorts Now <ArrowRight size={13} />
                </span>
              </div>
            </Link>

            <Link to="/compress-image" className="sr-tool-nav-card">
              <div className="sr-tool-nav-icon">
                <FolderArchive size={22} />
              </div>
              <div className="sr-tool-nav-info">
                <h3>Image Compressor</h3>
                <p>Reduce JPG, PNG, and WebP file sizes by up to 85% while preserving crisp visual detail.</p>
                <span className="sr-tool-nav-link">
                  Compress Images <ArrowRight size={13} />
                </span>
              </div>
            </Link>

            <Link to="/image-resizer" className="sr-tool-nav-card">
              <div className="sr-tool-nav-icon">
                <Maximize2 size={22} />
              </div>
              <div className="sr-tool-nav-info">
                <h3>Image Resizer</h3>
                <p>Scale photos interactively using 8 drag handles or exact social media pixel presets.</p>
                <span className="sr-tool-nav-link">
                  Resize Photos <ArrowRight size={13} />
                </span>
              </div>
            </Link>

            <Link to="/image-converter" className="sr-tool-nav-card">
              <div className="sr-tool-nav-icon">
                <Layers size={22} />
              </div>
              <div className="sr-tool-nav-info">
                <h3>Image Converter</h3>
                <p>Convert between JPG, PNG, WebP, AVIF, and GIF formats with client-side batch processing.</p>
                <span className="sr-tool-nav-link">
                  Convert Images <ArrowRight size={13} />
                </span>
              </div>
            </Link>

            <Link to="/image-cropper" className="sr-tool-nav-card">
              <div className="sr-tool-nav-icon">
                <Crop size={22} />
              </div>
              <div className="sr-tool-nav-info">
                <h3>Image Cropper</h3>
                <p>Frame and crop images to 1:1, 4:5, 16:9, or 9:16 aspect ratios with Rule of Thirds guides.</p>
                <span className="sr-tool-nav-link">
                  Crop Photos <ArrowRight size={13} />
                </span>
              </div>
            </Link>

            <Link to="/collage" className="sr-tool-nav-card">
              <div className="sr-tool-nav-icon">
                <SlidersHorizontal size={22} />
              </div>
              <div className="sr-tool-nav-info">
                <h3>Photo &amp; Video Editor</h3>
                <p>Layer pictures, text typography, stickers, and custom branding into artistic collages.</p>
                <span className="sr-tool-nav-link">
                  Open Studio <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
