import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Camera, Download, Lock, Mic, MicOff, Monitor, Pause, Play, Square, Video, X } from 'lucide-react'
import { appConfig } from '../../config/app.config'
import { useCustomer } from '../../data/customer-auth'
import { WATERMARK_BENEFIT } from '../../domain/store'

function videoReady(video) {
  if (video.videoWidth) return Promise.resolve()
  return new Promise((resolve) => { video.onloadedmetadata = () => resolve() })
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
        const owner = (data.products ?? []).find((product) => product.features.some((feature) => feature.benefitKey === WATERMARK_BENEFIT))
        if (owner?.watermarkText) setWatermarkText(owner.watermarkText)
      })
      .catch(() => { /* the shipped product name is a fine fallback watermark */ })
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
    timerRef.current = window.setInterval(() => setSeconds((time) => time + 1), 1000)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [recording, paused])
  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    tracksRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
  }, [])

  const start = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || (!cameraOnly && !navigator.mediaDevices.getDisplayMedia) || !window.MediaRecorder) {
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
        ? await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60, max: 60 } }, audio: audioEnabled ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false })
        : await navigator.mediaDevices.getDisplayMedia({ video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60, max: 60 } }, audio: audioEnabled })
      if (cameraEnabled) camera = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60, max: 60 } }, audio: false })
      if (audioEnabled && !cameraOnly) {
        try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }) }
        catch { setError('Microphone access was unavailable. Recording will continue with shared-tab audio, if selected.') }
      }
      let videoTracks = screen.getVideoTracks()
      if (camera || !watermarkFree) {
        const displayVideo = document.createElement('video')
        const cameraVideo = document.createElement('video')
        displayVideo.muted = true; cameraVideo.muted = true
        displayVideo.srcObject = screen
        if (camera) cameraVideo.srcObject = camera
        await Promise.all([displayVideo.play(), camera ? cameraVideo.play() : Promise.resolve()])
        await Promise.all([videoReady(displayVideo), ...(camera ? [videoReady(cameraVideo)] : [])])
        const canvas = document.createElement('canvas')
        canvas.width = displayVideo.videoWidth || 1280; canvas.height = displayVideo.videoHeight || 720
        const context = canvas.getContext('2d')
        if (!context || !canvas.captureStream) throw new Error('This browser cannot composite the recording. Try another browser.')
        const paint = () => {
          const now = performance.now()
          if (now - lastPaint < 16) return
          lastPaint = now
          try {
            if (!displayVideo.videoWidth) return
            context.drawImage(displayVideo, 0, 0, canvas.width, canvas.height)
            if (camera && cameraVideo.videoWidth) {
              const diameter = Math.min(canvas.width, canvas.height) * 0.22
              const x = canvas.width - diameter - 28; const y = canvas.height - diameter - 28
              context.save(); context.beginPath(); context.arc(x + diameter / 2, y + diameter / 2, diameter / 2, 0, Math.PI * 2); context.clip()
              context.drawImage(cameraVideo, x, y, diameter, diameter)
            }
            if (!watermarkFree) paintWatermark(context, canvas, watermarkText)
          } catch { /* an interrupted or resized capture surface should cost a frame, not the whole recording */ }
          finally { context.restore() }
        }
        // rAF stops as soon as this tab stops painting (another tab, or the recorded window on top of
        // the browser), so a timer keeps compositing; paint() itself caps the rate at 60 fps.
        const loop = () => { paint(); rafFrame = requestAnimationFrame(loop) }
        loop()
        const watchdog = window.setInterval(paint, 100)
        haltCompositor = () => { cancelAnimationFrame(rafFrame); window.clearInterval(watchdog) }
        canvasStream = canvas.captureStream(60)
        videoTracks = canvasStream.getVideoTracks()
      }
      const composed = new MediaStream([...videoTracks, ...screen.getAudioTracks(), ...(mic?.getAudioTracks() ?? [])])
      const streams = [screen, ...(camera ? [camera] : []), ...(mic ? [mic] : []), ...(canvasStream ? [canvasStream] : [])]
      tracksRef.current = streams
      setPreviewStream(composed)
      chunksRef.current = []
      for (let count = 5; count >= 1; count -= 1) {
        setCountdown(count)
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
      }
      setCountdown(null)
      const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type))
      const surface = screen.getVideoTracks()[0]?.getSettings()
      const pixels = (surface?.width ?? 1920) * (surface?.height ?? 1080)
      // A flat 50 Mbps starves the encoder on a laptop-sized surface and the take stalls after a few
      // seconds, so scale the target with the captured resolution and keep 4K at the old ceiling.
      const videoBitsPerSecond = Math.min(50000000, Math.max(4000000, Math.round(pixels * 60 * 0.06)))
      const recorder = new MediaRecorder(composed, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond, audioBitsPerSecond: 192000 })
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${title.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-') || 'screen-recording'}.webm`
        anchor.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        streams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
        haltCompositor()
        setPreviewStream(null); setRecording(false); setPaused(false); setStarting(false); setCountdown(null)
      }
      screen.getVideoTracks()[0]?.addEventListener('ended', () => { if (recorder.state !== 'inactive') recorder.stop() }, { once: true })
      recorder.start(1000)
      recorderRef.current = recorder
      setSeconds(0); setRecording(true); setPaused(false); setStarting(false)
    } catch (reason) {
      ;[screen, camera, mic].filter(Boolean).forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
      canvasStream?.getTracks().forEach((track) => track.stop())
      haltCompositor()
      setPreviewStream(null)
      setStarting(false); setCountdown(null)
      setError(reason instanceof Error ? reason.message : 'Could not start screen recording. Check browser permissions and try again.')
    }
  }
  const stop = () => { if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop() }
  const togglePause = () => {
    const recorder = recorderRef.current
    if (!recorder) return
    if (recorder.state === 'recording') { recorder.pause(); setPaused(true) }
    else if (recorder.state === 'paused') { recorder.resume(); setPaused(false) }
  }
  const timeLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return <section className="home-photo-generator recorder-generator" aria-label="Screen recording controls">
    <div className="recorder-layout">
      <aside className="recorder-settings">
        <label>Recording title<input value={title} onChange={(event) => setTitle(event.target.value)} disabled={recording} placeholder="Recording title" /></label>
        <div className="recorder-setting-label">Capture</div>
        <div className="recorder-quality-badge"><span>4K</span><strong>Ultra HD</strong><small>Up to 2160p · 60 fps</small></div>
        <div className={`recorder-tier-badge ${watermarkFree ? 'pro' : 'free'}`}>{watermarkFree ? <BadgeCheck size={16} /> : <Lock size={16} />}<div><strong>{watermarkFree ? 'Watermark free' : 'Free version'}</strong><small>{watermarkFree ? 'Your downloads export clean.' : `Downloads carry a “${watermarkText}” watermark.`}</small></div>{!watermarkFree && <Link className="recorder-upgrade" to={customer.user ? '/store?type=software' : '/account'} onClick={() => { if (recording) setError('Start a clean recording after unlocking to remove the watermark.') }}>{customer.user ? 'Remove watermark' : 'Have a code? Redeem it'} <ArrowRight size={13} /></Link>}</div>
        <button className={`recorder-option ${!cameraEnabled && !cameraOnly ? 'active' : ''}`} onClick={() => { setCameraEnabled(false); setCameraOnly(false) }} disabled={recording}><Monitor size={17} />Screen</button>
        <button className={`recorder-option ${cameraEnabled ? 'active' : ''}`} onClick={() => { setCameraEnabled(true); setCameraOnly(false) }} disabled={recording}><Monitor size={17} /><Camera size={15} />Screen &amp; Camera</button>
        <button className={`recorder-option ${cameraOnly ? 'active' : ''}`} onClick={() => { setCameraEnabled(false); setCameraOnly(true) }} disabled={recording}><Camera size={17} />Camera only</button>
        <label className="recorder-mic"><span>{audioEnabled ? <Mic size={17} /> : <MicOff size={17} />} Microphone</span><input type="checkbox" checked={audioEnabled} onChange={(event) => setAudioEnabled(event.target.checked)} disabled={recording} /></label>
        {(cameraEnabled || cameraOnly) && <p className="recorder-hint">{cameraOnly ? 'Record from your webcam without sharing your screen.' : 'Your camera appears as a bubble over the shared screen.'}</p>}
      </aside>
      <div className="recorder-preview">
        {previewStream ? <video ref={videoRef} muted playsInline /> : <div className="recorder-preview-empty"><span><Monitor size={29} /></span><strong>{recording ? 'Recording in progress' : 'Ready to record'}</strong><p>Choose a screen or window after clicking Record.</p></div>}
        {countdown !== null && <div className="recorder-countdown" aria-live="assertive"><span>{countdown}</span><strong>Get ready</strong></div>}
        {recording && <span className="recorder-live"><i />{paused ? 'Paused' : 'Recording'} · {timeLabel}</span>}
        <div className="recorder-controls">{!recording ? <button className="recorder-record" onClick={() => void start()} disabled={starting}><span />{starting ? 'Starting…' : 'Start recording'}</button> : <><button className="recorder-pause" onClick={togglePause}>{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? 'Resume' : 'Pause'}</button><button className="recorder-stop" onClick={stop}><Square size={14} fill="currentColor" />Stop &amp; download <Download size={14} /></button></>}</div>
      </div>
    </div>
    {error && <p className="recorder-error" role="alert">{error}</p>}
  </section>
}

function RecorderFullscreen({ onClose }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event) => { if (event.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [])
  return <div className="recorder-fullscreen">
    <div className="recorder-fullscreen-bar"><div><Video size={17} /><strong>Screen Recorder</strong><small>Full screen while you capture</small></div><button className="recorder-fullscreen-close" type="button" onClick={onClose}><X size={15} />Exit full screen</button></div>
    <div className="recorder-fullscreen-body"><ScreenRecorder /></div>
  </div>
}

/** Home-page entry point: the recorder opens in full screen over the library. */
export default function ScreenRecorderTool({ onClose }) {
  return <RecorderFullscreen onClose={onClose ?? (() => undefined)} />
}
