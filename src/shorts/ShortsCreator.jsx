import React, { useEffect, useMemo, useRef, useState } from 'react';
import { injectShortsStyles } from './styles';

const LENGTHS = [15, 18, 20];
const LAYOUTS = [
  { id: 'fill', label: 'Center crop' },
  { id: 'blur', label: 'Blurred bars' },
  { id: 'bars', label: 'Caption bar' },
];
// The player never reports the source's shape, so the crop is driven by what you tell it the
// original frame is. Getting this wrong is the only way a black band can survive on the stage.
const SHAPES = [
  { id: '16:9', label: '16:9', asp: 16 / 9 },
  { id: '4:3', label: '4:3', asp: 4 / 3 },
  { id: '1:1', label: 'Square', asp: 1 },
  { id: '9:16', label: 'Vertical', asp: 9 / 16 },
];
const SIZES = [
  { id: 'hd', label: 'HD 720 × 1280', w: 720, h: 1280 },
  { id: 'fhd', label: 'Full HD 1080 × 1920', w: 1080, h: 1920 },
];
const ACCENTS = ['#07864f', '#e07a92', '#f2a30f', '#33415c', '#ffffff'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtTime = (s) => {
  const t = Math.max(0, Math.floor(s || 0));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
const srtTime = (sec) => {
  const ms = Math.max(0, Math.round((sec || 0) * 1000));
  const p = (n, l) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000), 2)}:${p(Math.floor(ms / 60000) % 60, 2)}:${p(Math.floor(ms / 1000) % 60, 2)},${p(ms % 1000, 3)}`;
};
const coverFit = (sw, sh, dw, dh) => {
  const s = Math.max(dw / sw, dh / sh);
  return { dw: sw * s, dh: sh * s, dx: (dw - sw * s) / 2, dy: (dh - sh * s) / 2 };
};
const containFit = (sw, sh, dw, dh) => {
  const s = Math.min(dw / sw, dh / sh);
  return { dw: sw * s, dh: sh * s, dx: (dw - sw * s) / 2, dy: (dh - sh * s) / 2 };
};

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Accepts a watch/shorts/embed/live URL, a youtu.be link, or a bare video id. */
export function parseYouTubeId(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (ID_RE.test(raw)) return raw;
  let u;
  try { u = new URL(/^https?:/i.test(raw) ? raw : `https://${raw}`); } catch { return null; }
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'youtu.be' && !/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return null;
  const fromPath = u.pathname.match(/\/(?:shorts|embed|live|v|e)\/([A-Za-z0-9_-]{11})/);
  const cand = host === 'youtu.be'
    ? u.pathname.split('/')[1] || ''
    : u.searchParams.get('v') || (fromPath ? fromPath[1] : '');
  return ID_RE.test(cand) ? cand : null;
}

/** A pasted paragraph becomes caption cards spread evenly over the clip window. */
export function splitCaptions(text, len, per = 4) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!words.length || len <= 0) return [];
  const groups = [];
  for (let i = 0; i < words.length; i += per) groups.push(words.slice(i, i + per).join(' '));
  const step = len / groups.length;
  return groups.map((t, i) => ({ text: t, at: i * step, until: (i + 1) * step }));
}

/** Evenly spaced windows across the whole runtime — the clip plan the stage plays and exports. */
export function planClips(duration, len, max = 10) {
  const d = Math.max(0, Number(duration) || 0);
  if (!d) return [];
  if (d <= len) return [{ index: 1, start: 0, len: Math.max(1, d) }];
  const count = clamp(Math.floor(d / len), 2, max);
  const stride = (d - len) / (count - 1);
  return Array.from({ length: count }, (_, i) => ({ index: i + 1, start: Math.round(i * stride), len }));
}

const BOX_ASP = 9 / 16;
const VIDEO_ASP = 16 / 9;
const HOOK_PX = 0.068;
const CAP_PX = 0.082;
// A hair of overfill so sub-pixel rounding in the iframe can never leave a dark seam on an edge.
const BLEED = 1.008;
// The embed paints its own title at the top of its frame and suggestion cards at the bottom, and
// no playerVars option turns those off. Overscaling the box pushes both edges outside the stage.
const YT_OVERSCAN = 1.18;
// Height of the bottom band, as a share of the stage, that gets defocused to bury burned-in text.
const COVER_H = 0.21;

/** Where the source sits inside the 9:16 stage — the same numbers drive the DOM and the canvas. */
export function videoArea(layout, asp = VIDEO_ASP) {
  if (layout === 'fill') return { x: 0, y: 0, w: 100, h: 100, mode: 'cover' };
  const h = (BOX_ASP / asp) * 100;
  if (layout === 'bars') return { x: 0, y: (66 - h) / 2, w: 100, h, mode: 'contain' };
  return { x: 0, y: (100 - h) / 2, w: 100, h, mode: 'contain' };
}

/** The smallest box of the source's own shape that still covers the stage, centred on it. */
function coverBox(asp) {
  const k = Math.max(1, asp / BOX_ASP);
  return { w: k * 100, h: (k * BOX_ASP / asp) * 100 };
}

/** The YouTube frame is a real player, so the crop lives on its box instead of object-fit. */
export function ytBoxStyle(layout, asp = VIDEO_ASP) {
  const a = videoArea(layout, asp);
  if (a.mode === 'cover') {
    const b = coverBox(asp);
    const w = b.w * BLEED * YT_OVERSCAN;
    const h = b.h * BLEED * YT_OVERSCAN;
    return { width: `${w}%`, height: `${h}%`, left: `${(100 - w) / 2}%`, top: `${(100 - h) / 2}%` };
  }
  const h = a.h * YT_OVERSCAN;
  const w = 100 * YT_OVERSCAN;
  return { width: `${w}%`, height: `${h}%`, left: `${(100 - w) / 2}%`, top: `${a.y + (a.h - h) / 2}%` };
}

const FONT_STACK = '"Roboto","Helvetica Neue",Arial,sans-serif';const fontAt = (px) => `800 ${px}px ${FONT_STACK}`;

function wrapLines(ctx, text, maxW) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) { lines.push(line); line = w; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawSource(ctx, el, area, W, H) {
  if (!el || !el.videoWidth || !el.videoHeight) return false;
  const box = { x: (area.x / 100) * W, y: (area.y / 100) * H, w: (area.w / 100) * W, h: (area.h / 100) * H };
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  const fit = (area.mode === 'contain' ? containFit : coverFit)(el.videoWidth, el.videoHeight, box.w, box.h);
  ctx.drawImage(el, box.x + fit.dx, box.y + fit.dy, fit.dw, fit.dh);
  ctx.restore();
  return true;
}

/** The one frame painter behind every file export, so a download matches the preview. */
export function paintShort(ctx, W, H, st) {
  const area = videoArea(st.layout, st.asp || VIDEO_ASP);
  ctx.fillStyle = '#0b0f14';
  ctx.fillRect(0, 0, W, H);
  if (st.layout !== 'fill' && st.el) {
    ctx.save();
    ctx.filter = `blur(${Math.max(12, Math.round(W * 0.045))}px)`;
    ctx.globalAlpha = 0.92;
    drawSource(ctx, st.el, { x: -12, y: -12, w: 124, h: 124, mode: 'cover' }, W, H);
    ctx.restore();
  }
  drawSource(ctx, st.el, area, W, H);

  // Burned-in subtitles live in the footage itself, so the only fix is to defuse that band.
  if (st.cover && st.el && st.el.videoWidth) {
    const ch = Math.round(H * COVER_H);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, H - ch, W, ch);
    ctx.clip();
    ctx.filter = `blur(${Math.max(6, Math.round(W * 0.028))}px)`;
    drawSource(ctx, st.el, area, W, H);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(11,15,20,.42)';
    ctx.fillRect(0, H - ch, W, ch);
    ctx.restore();
  }

  const hook = String(st.hook || '').trim();
  if (hook) {
    const px = Math.round(W * HOOK_PX);
    ctx.font = fontAt(px);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,.7)';
    ctx.shadowBlur = px * 0.55;
    ctx.shadowOffsetY = px * 0.05;
    ctx.fillStyle = '#ffffff';
    wrapLines(ctx, hook.toUpperCase(), W * 0.86).forEach((line, i) => {
      ctx.fillText(line, W / 2, H * 0.045 + i * px * 1.2);
    });
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  const t = st.t || 0;
  const cap = (st.caps || []).find((c) => t >= c.at && t < c.until);
  if (cap) {
    const px = Math.round(W * CAP_PX);
    ctx.font = fontAt(px);
    const lines = wrapLines(ctx, cap.text.toUpperCase(), W * 0.74);
    const lh = px * 1.18;
    const bw = Math.max(px, ...lines.map((l) => ctx.measureText(l).width)) + px * 1.1;
    const bh = lines.length * lh + px * 0.68;
    const by = st.layout === 'bars' ? H * 0.7 : H * 0.74;
    const pop = clamp((t - cap.at) / 0.16, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.6 * pop;
    ctx.translate(W / 2, by + bh / 2);
    ctx.scale(0.93 + 0.07 * pop, 0.93 + 0.07 * pop);
    ctx.fillStyle = 'rgba(11,15,20,.8)';
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, px * 0.3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = Math.max(1, px * 0.03);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    lines.forEach((line, i) => ctx.fillText(line, 0, -bh / 2 + px * 0.34 + i * lh));
    ctx.restore();
  }

  const barH = Math.max(3, Math.round(H * 0.0035));
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.fillRect(0, H - barH, W, barH);
  ctx.fillStyle = st.accent || '#07864f';
  ctx.fillRect(0, H - barH, W * clamp(t / (st.len || 1), 0, 1), barH);
}

const Section = ({ title, children }) => (
  <div>
    <h4 className="sc-h4">{title}</h4>
    {children}
  </div>
);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const waitReady = (el, ms = 4000) => new Promise((resolve) => {
  if (el.readyState >= 2) { resolve(); return; }
  const done = () => { clearTimeout(guard); resolve(); };
  const guard = setTimeout(done, ms);
  el.addEventListener('canplay', done, { once: true });
  el.addEventListener('loadeddata', done, { once: true });
});

const waitSeek = (el, ms = 1500) => new Promise((resolve) => {
  const done = () => { clearTimeout(guard); resolve(); };
  const guard = setTimeout(done, ms);
  el.addEventListener('seeked', done, { once: true });
});

/**
 * A WebM written by MediaRecorder has no duration in its header, so Chrome reports Infinity
 * until a seek past the end forces it to scan the file. Recordings from our own screen
 * recorder arrive exactly like that.
 */
const readDuration = (el) => new Promise((resolve) => {
  const value = () => (Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0);
  if (value()) { resolve(value()); return; }
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(guard);
    el.removeEventListener('durationchange', finish);
    const d = value();
    try { el.currentTime = 0; } catch { /* back to the top either way */ }
    resolve(d);
  };
  const guard = setTimeout(finish, 2000);
  el.addEventListener('durationchange', finish);
  try { el.currentTime = 1e9; } catch { finish(); }
});

let ytPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => { ytPromise = null; reject(new Error('Could not reach YouTube. Check the connection and try again.')); };
    document.head.appendChild(script);
  });
  return ytPromise;
}

export default function ShortsCreator({ className = '', style }) {
  injectShortsStyles();

  const [srcMode, setSrcMode] = useState('youtube');
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [title, setTitle] = useState('');
  const [poster, setPoster] = useState('');
  const [duration, setDuration] = useState(0);
  const [clips, setClips] = useState([]);
  const [clipLen, setClipLen] = useState(18);
  const [startAt, setStartAt] = useState(0);
  const [activeClip, setActiveClip] = useState(0);
  const [layout, setLayout] = useState('fill');
  const [shapeId, setShapeId] = useState('16:9');
  const [accent, setAccent] = useState('#07864f');
  const [hook, setHook] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [wordsPerCap, setWordsPerCap] = useState(4);
  const [sizeId, setSizeId] = useState('fhd');
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [cover, setCover] = useState(false);
  const [full, setFull] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [jobs, setJobs] = useState([]);

  const hostRef = useRef(null);
  const bgRef = useRef(null);
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const fileRef = useRef(null);
  const fileUrlRef = useRef('');
  const sawPlayingRef = useRef(false);
  const userPausedRef = useRef(false);
  const S = useRef({});
  const jobSeq = useRef(0);
  const jobHandles = useRef(new Map());
  const canceled = useRef(new Set());

  const caps = useMemo(() => splitCaptions(captionText, clipLen, wordsPerCap), [captionText, clipLen, wordsPerCap]);
  const sz = SIZES.find((s) => s.id === sizeId) || SIZES[1];
  const srcAsp = (SHAPES.find((s) => s.id === shapeId) || SHAPES[0]).asp;
  const area = videoArea(layout, srcAsp);
  const endAt = duration ? Math.min(startAt + clipLen, duration) : startAt + clipLen;
  const windowLen = Math.max(1, endAt - startAt);
  const activeCap = caps.find((c) => elapsed >= c.at && elapsed < c.until);

  S.current = { layout, hook, caps, accent, len: windowLen, asp: srcAsp, cover };

  const currentTime = () => {
    if (srcMode === 'youtube') return playerRef.current?.getCurrentTime?.() ?? 0;
    return videoRef.current?.currentTime ?? 0;
  };
  const seek = (sec) => {
    if (srcMode === 'youtube') { playerRef.current?.seekTo?.(sec, true); return; }
    if (videoRef.current) { try { videoRef.current.currentTime = sec; } catch { /* before metadata */ } }
    if (bgRef.current) { try { bgRef.current.currentTime = sec; } catch { /* backdrop only */ } }
  };
  const pause = () => {
    userPausedRef.current = true;
    setPlaying(false);
    if (srcMode === 'youtube') playerRef.current?.pauseVideo?.();
    else { videoRef.current?.pause?.(); bgRef.current?.pause?.(); }
  };
  const play = async () => {
    setError('');
    const t = currentTime();
    if (t < startAt - 0.4 || t >= endAt - 0.1) seek(startAt);
    sawPlayingRef.current = false;
    userPausedRef.current = false;
    try {
      if (srcMode === 'youtube') playerRef.current?.playVideo?.();
      else {
        await waitReady(videoRef.current);
        await videoRef.current.play();
        if (bgRef.current) { bgRef.current.currentTime = videoRef.current.currentTime; void bgRef.current.play().catch(() => undefined); }
      }
      setPlaying(true);
      if (srcMode === 'youtube') {
        // YouTube can hold a clip that no real click unlocked, which leaves the transport
        // frozen with no clue, so say so when the player never settles into playing.
        setTimeout(() => {
          if (sawPlayingRef.current || userPausedRef.current) return;
          setNotice('YouTube is holding this clip — click the video once, then press Play short again.');
        }, 2000);
      }
    } catch {
      setError('The browser blocked playback — press Play once more.');
    }
  };

  const makeJob = (job) => {
    const id = ++jobSeq.current;
    setJobs((prev) => [{ id, progress: 0, status: 'running', ...job }, ...prev].slice(0, 12));
    return id;
  };
  const patchJob = (id, patch) => setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  const finishJob = (id, blob, name) => {
    if (canceled.current.has(id)) { patchJob(id, { status: 'canceled' }); return; }
    const href = URL.createObjectURL(blob);
    patchJob(id, { status: 'done', progress: 1, url: href, size: blob.size });
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
  };
  const cancelJob = (id) => {
    canceled.current.add(id);
    jobHandles.current.get(id)?.();
  };
  const downloadText = (text, name, type) => {
    const href = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 2000);
  };

  // One transport loop drives both sources: it keeps playback inside the clip window
  // and feeds the caption and progress overlays the same clock the exporter paints with.
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      const t = currentTime();
      setElapsed(clamp(t - startAt, 0, windowLen));
      if (t >= endAt - 0.05 || t < startAt - 0.8) {
        if (loop) { seek(startAt); setElapsed(0); }
        else { pause(); seek(startAt); setElapsed(0); }
      }
    }, 100);
    return () => clearInterval(id);
  }, [playing, startAt, endAt, windowLen, loop, srcMode, caps.length]);

  const togglePlay = () => { if (playing) pause(); else void play(); };
  const restart = () => { seek(startAt); setElapsed(0); };

  const generate = (len = clipLen) => {
    setError('');
    if (!(srcMode === 'youtube' ? videoId : title)) { setError('Load a YouTube link or a video file first.'); return; }
    if (!duration) {
      // The runtime arrives asynchronously from the player, and pressing Generate during that
      // window used to leave the list empty with no clue why, so say what is still happening.
      setError('Still reading the runtime of this video — press Generate Shorts again in a second.');
      return;
    }
    const plan = planClips(duration, len);
    setClips(plan);
    setActiveClip(0);
    setStartAt(plan[0]?.start ?? 0);
    setElapsed(0);
    seek(plan[0]?.start ?? 0);
    setNotice(`${plan.length} clip${plan.length === 1 ? '' : 's'} of ${len}s spread over ${fmtTime(duration)}. Pick one, then play it or download it.`);
  };

  const useClip = (i) => {
    const c = clips[i];
    if (!c) return;
    setActiveClip(i);
    setStartAt(c.start);
    setElapsed(0);
    seek(c.start);
  };

  // The card buttons export their own window, so a clip never waits on the selection re-render.
  const downloadClip = (i) => {
    const win = clipWindow(clips[i]);
    if (!win) return;
    useClip(i);
    if (srcMode === 'file') void exportFileWebm(win);
    else void exportCaptureWebm(win);
  };

  const applyLen = (len) => {
    setClipLen(len);
    if (duration) {
      const plan = planClips(duration, len);
      setClips(plan);
      setActiveClip(0);
      setStartAt(plan[0]?.start ?? 0);
      seek(plan[0]?.start ?? 0);
    }
  };

  // YouTube IFrame player — rebuilt per video id, driven by the transport loop above.
  useEffect(() => {
    if (srcMode !== 'youtube' || !videoId) return undefined;
    const host = hostRef.current;
    if (!host) return undefined;
    let dead = false;
    host.innerHTML = '';
    const mount = document.createElement('div');
    host.appendChild(mount);
    loadYouTubeApi().then((YT) => {
      if (dead) return;
      playerRef.current = new YT.Player(mount, {
        videoId,
        playerVars: { controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, disablekb: 1, fs: 0, playsinline: 1 },
        events: {
          onReady: (e) => {
            if (dead) return;
            const d = e.target.getDuration?.() || 0;
            const data = e.target.getVideoData?.() || {};
            if (d) { setDuration(d); setClips((prev) => (prev.length ? prev : planClips(d, clipLen))); }
            if (data.title) setTitle(data.title);
            setPoster(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
            e.target.seekTo?.(startAt, true);
          },
          onStateChange: (e) => {
            if (dead) return;
            const d = e.target.getDuration?.() || 0;
            if (d && Math.abs(d - duration) > 1) { setDuration(d); setClips((prev) => (prev.length ? prev : planClips(d, clipLen))); }
            if (e.data === 1) {
              sawPlayingRef.current = true;
              userPausedRef.current = false;
              setPlaying(true);
              setNotice((n) => (/YouTube (is holding|stopped this clip)/.test(n || '') ? '' : n));
            } else if (e.data === 2 || e.data === 0) {
              setPlaying(false);
              // A clip YouTube stops on its own is the age-gate, ad-blocker or autoplay case,
              // so name it instead of leaving the transport frozen with no explanation.
              if (e.data === 2 && !userPausedRef.current && sawPlayingRef.current) {
                setNotice('YouTube stopped this clip on its own — click the video once, then press Play short again.');
              }
            }
          },
        },
      });
    }).catch((reason) => { if (!dead) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => {
      dead = true;
      try { playerRef.current?.destroy?.(); } catch { /* already gone */ }
      playerRef.current = null;
    };
  }, [srcMode, videoId]);

  useEffect(() => {
    if (srcMode === 'youtube' || !duration || clips.length) return;
    setClips(planClips(duration, clipLen));
  }, [srcMode, duration, clips.length, clipLen]);

  useEffect(() => {
    if (srcMode !== 'file') return;
    const el = videoRef.current;
    if (!el) return;
    try { el.currentTime = startAt; } catch { /* metadata not read yet */ }
    setElapsed(0);
  }, [srcMode, startAt]);

  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full]);

  const onFile = (file) => {
    if (!file) return;
    pause();
    setError('');
    setNotice('');
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    const href = URL.createObjectURL(file);
    fileUrlRef.current = href;
    const name = file.name.replace(/\.[a-z0-9]+$/i, '');
    setSrcMode('file');
    setVideoId('');
    setBgUrl(href);
    setTitle(name);
    setPoster('');
    setDuration(0);
    setClips([]);
    setStartAt(0);
    setActiveClip(0);
    setElapsed(0);
    setTimeout(() => { const el = videoRef.current; if (el) { el.src = href; el.load(); } }, 0);
  };

  const loadLink = () => {
    setError('');
    setNotice('');
    const id = parseYouTubeId(url);
    if (!id) { setError('That does not look like a YouTube link. Paste a youtube.com/watch, /shorts or youtu.be address.'); return; }
    pause();
    if (fileUrlRef.current) { URL.revokeObjectURL(fileUrlRef.current); fileUrlRef.current = ''; }
    setSrcMode('youtube');
    setDuration(0);
    setClips([]);
    setStartAt(0);
    setActiveClip(0);
    setElapsed(0);
    setVideoId(id);
    setTitle('');
  };

  // ---- Exports -------------------------------------------------------------

  const slug = (title || 'short').slice(0, 40).replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
  const exportName = (start = startAt, len = windowLen) => `short-${fmtTime(start).replace(':', '')}-${Math.round(len)}s-${sz.w}x${sz.h}.webm`;

  const pickMime = () => ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));

  const clipWindow = (c) => (c ? { start: c.start, len: Math.max(1, Math.min(c.len, (duration || c.start + c.len) - c.start)) } : null);

  const exportFileWebm = async (win) => {
    const start = win?.start ?? startAt;
    const len = Math.max(1, Math.round(win?.len ?? windowLen));
    setError('');
    const v = videoRef.current;
    if (!v || !v.videoWidth) { setError('Choose a video file under Source first — this export renders your own footage at full resolution.'); return; }
    const mime = pickMime();
    if (!mime) { setError('This browser has no video recording support.'); return; }
    let rec;
    let timer = 0;
    try {
      const c = document.createElement('canvas');
      c.width = sz.w;
      c.height = sz.h;
      const x = c.getContext('2d');
      const name = exportName(start, len);
      const id = makeJob({ kind: 'webm', label: `HD short · ${sz.w}×${sz.h}`, name, w: sz.w, h: sz.h, dur: len });
      v.currentTime = start;
      await waitReady(v);
      await waitSeek(v);
      const stream = c.captureStream(30);
      const media = v.captureStream ? v.captureStream() : v.mozCaptureStream?.();
      (media?.getAudioTracks?.() || []).forEach((t) => stream.addTrack(t));
      rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.min(50e6, Math.max(6e6, Math.round(sz.w * sz.h * 30 * 0.12))) });
      const chunks = [];
      let natural = false;
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        clearInterval(timer);
        jobHandles.current.delete(id);
        pause();
        if (!natural) { patchJob(id, { status: 'error', error: 'Recording stopped early.' }); return; }
        finishJob(id, new Blob(chunks, { type: 'video/webm' }), name);
      };
      await v.play();
      setPlaying(true);
      rec.start(250);
      const t0 = Date.now();
      timer = setInterval(() => {
        const t = clamp((Date.now() - t0) / 1000, 0, len);
        paintShort(x, sz.w, sz.h, { ...S.current, el: v, t, len });
        setElapsed(t);
        patchJob(id, { progress: Math.min(0.99, (Date.now() - t0) / (len * 1000)) });
        if (Date.now() - t0 >= len * 1000) {
          natural = true;
          if (rec.state !== 'inactive') rec.stop();
        }
      }, 1000 / 30);
      jobHandles.current.set(id, () => { clearInterval(timer); pause(); if (rec.state !== 'inactive') rec.stop(); });
    } catch (reason) {
      clearInterval(timer);
      try { if (rec && rec.state !== 'inactive') rec.stop(); } catch { /* nothing to stop */ }
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  // One share session can carry any number of clips, so the dialog opens once and every take is
  // cropped from a freshly measured stage rect each frame — a layout shift mid-recording can never
  // drag the page behind the stage into the frame.
  const captureSession = async (wins) => {
    setError('');
    setNotice('');
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
      setError('This browser cannot capture its own tab. Load the video file under Source instead, and download at full resolution.');
      return;
    }
    const list = wins.filter((w) => w && w.len > 0);
    if (!list.length) { setError('Nothing to record yet — load a video and press Generate Shorts.'); return; }
    // Kicked off in the click itself so YouTube keeps its user-gesture credit.
    void play();
    let screen;
    let timer = 0;
    let pickerDone = false;
    let abort = false;
    const teardown = () => { clearInterval(timer); setCapturing(false); setZoom(false); screen?.getTracks().forEach((t) => t.stop()); };
    try {
      setCapturing(true);
      // A quiet take records the stage exactly where it sits in the editor: the page never changes
      // appearance. The trade is detail — the crop is the stage's own on-screen size, so the
      // full-screen take stays the sharper option and stays the default.
      if (!quiet) setZoom(true);
      // In-place takes crop whatever the screen shows, so make sure the stage is actually on screen.
      else stageRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' });
      if (quiet) {
        // The scroll animates; wait briefly for it to settle so the take starts on a steady crop,
        // but stay well inside the user-activation window that getDisplayMedia needs.
        let last = -1;
        for (let i = 0; i < 6; i += 1) {
          await delay(80);
          const y = Math.round(window.scrollY);
          if (y === last) break;
          last = y;
        }
      } else {
        await delay(420);
      }
      if (!stageRef.current) throw new Error('The stage is not ready yet — try again in a second.');
      screen = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 }, cursor: 'never' },
        audio: true,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
      });
      const track = screen.getVideoTracks()[0];
      const settings = track?.getSettings?.() || {};
      if (settings.displaySurface && settings.displaySurface !== 'browser') {
        throw new Error('In the share dialog pick "This tab" — not a window or the whole screen.');
      }
      pickerDone = true;
      const cap = document.createElement('video');
      cap.muted = true;
      cap.srcObject = screen;
      await cap.play().catch(() => undefined);

      const c = document.createElement('canvas');
      c.width = sz.w;
      c.height = sz.h;
      const x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';
      const scale = (settings.width || window.innerWidth) / (document.documentElement.clientWidth || window.innerWidth);
      const paint = () => {
        const r = stageRef.current.getBoundingClientRect();
        const sx = Math.max(0, Math.round((r.left + 1) * scale));
        const sy = Math.max(0, Math.round((r.top + 1) * scale));
        const sw = Math.max(8, Math.round((r.width - 2) * scale));
        const sh = Math.max(8, Math.round((r.height - 2) * scale));
        x.fillStyle = '#000';
        x.fillRect(0, 0, sz.w, sz.h);
        x.drawImage(cap, sx, sy, sw, sh, 0, 0, sz.w, sz.h);
      };
      timer = setInterval(() => { try { paint(); } catch { /* a dropped frame costs nothing */ } }, 1000 / 30);

      for (let i = 0; i < list.length; i += 1) {
        if (abort) break;
        const { start, len } = list[i];
        const name = exportName(start, len);
        const id = makeJob({
          kind: 'webm',
          label: list.length > 1 ? `Short ${i + 1} of ${list.length} · ${sz.w}×${sz.h}` : `Short · ${sz.w}×${sz.h}`,
          name, w: sz.w, h: sz.h, dur: len,
        });
        pause();
        setStartAt(start);
        setElapsed(0);
        seek(start);
        await delay(650);
        await play();
        await delay(280);

        const mime = pickMime();
        const stream = c.captureStream(30);
        screen.getAudioTracks().forEach((t) => stream.addTrack(t));
        const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: Math.min(50e6, Math.max(6e6, Math.round(sz.w * sz.h * 30 * 0.12))) });
        jobHandles.current.set(id, () => { abort = true; if (rec.state !== 'inactive') rec.stop(); });
        const chunks = [];
        let natural = false;
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = () => {
          jobHandles.current.delete(id);
          if (abort) { patchJob(id, { status: 'canceled' }); return; }
          if (!natural) { patchJob(id, { status: 'error', error: 'Recording stopped early — keep this tab in front while it records.' }); return; }
          finishJob(id, new Blob(chunks, { type: 'video/webm' }), name);
        };
        rec.start(250);
        const t0 = Date.now();
        await new Promise((res) => {
          const poll = setInterval(() => {
            patchJob(id, { progress: Math.min(0.99, (Date.now() - t0) / (len * 1000)) });
            if (rec.state === 'inactive') { clearInterval(poll); res(); }
            else if (Date.now() - t0 >= len * 1000) { clearInterval(poll); natural = true; rec.stop(); res(); }
          }, 200);
        });
        await delay(250);
      }
      teardown();
      pause();
      setNotice(list.length > 1 ? `${list.length} shorts recorded from one share session.` : 'Short recorded from the stage and downloaded.');
    } catch (reason) {
      teardown();
      if (!pickerDone) pause();
      setError(reason instanceof Error ? (/Permission denied|denied|cancel|abort/i.test(String(reason?.message)) ? 'Capture was cancelled. Press the button again and choose "This tab".' : String(reason?.message || reason)) : String(reason));
    }
  };

  const exportCaptureWebm = (win) => captureSession([win || { start: startAt, len: windowLen }]);
  const captureAll = () => captureSession(clips.length ? clips.map(clipWindow) : [{ start: startAt, len: windowLen }]);

  const exportSrt = () => {
    setError('');
    if (!caps.length) { setError('Type the line under "Hook & captions" first — that text becomes the subtitle cues.'); return; }
    const body = caps.map((c, i) => `${i + 1}\n${srtTime(startAt + c.at)} --> ${srtTime(startAt + c.until)}\n${c.text}\n`).join('\n');
    downloadText(body, `${slug}.srt`, 'text/plain');
    setNotice(`Caption file written with ${caps.length} cue${caps.length === 1 ? '' : 's'}.`);
  };

  const exportPlan = () => {
    setError('');
    const list = clips.length ? clips : [{ index: 1, start: startAt, len: windowLen }];
    const sheet = {
      source: srcMode === 'youtube' ? `https://www.youtube.com/watch?v=${videoId}` : fileUrlRef.current ? 'local video file' : '',
      title,
      videoId,
      duration,
      clipLength: clipLen,
      exportSize: `${sz.w}x${sz.h}`,
      layout,
      accent,
      hook,
      clips: list.map((c) => {
        const end = Math.min(duration || c.start + c.len, c.start + c.len);
        return {
          clip: c.index,
          start: c.start,
          end,
          startClock: fmtTime(c.start),
          endClock: fmtTime(end),
          clipLink: videoId ? `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(c.start)}s` : '',
        };
      }),
      captions: caps.map((c) => ({ at: +(startAt + c.at).toFixed(2), text: c.text })),
    };
    downloadText(JSON.stringify(sheet, null, 2), `${slug}-shorts.json`, 'application/json');
    setNotice('Cut sheet downloaded — every clip window, link and caption cue.');
  };

  const copyLink = async () => {
    setError('');
    if (srcMode !== 'youtube') { setError('Clip links point at a YouTube video — load a link first.'); return; }
    const link = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startAt)}s`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice(`Clip link copied — opens straight at ${fmtTime(startAt)}.`);
    } catch {
      setNotice(link);
    }
  };

  const scrub = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const v = clamp(Math.round(frac * duration - clipLen / 2), 0, Math.max(0, duration - 1));
    setActiveClip(-1);
    setStartAt(v);
    setElapsed(0);
    seek(v);
  };

  const thumbStyle = (c) => {
    if (srcMode !== 'youtube' || !poster) return {};
    const shift = duration > c.len ? clamp(c.start / (duration - c.len), 0, 1) : 0;
    return {
      backgroundImage: `linear-gradient(#0b0f1459,#0b0f1459), url(${poster})`,
      backgroundSize: `cover`,
      backgroundPosition: `${shift * 100}% center`,
    };
  };

  const ready = Boolean(duration) && (srcMode === 'youtube' ? Boolean(videoId) : Boolean(title));
  const recording = jobs.some((j) => j.status === 'running');

  return (
    <div className={`sc-page ${className}`} style={style}>
      <div className="sc-body">
        <aside className="sc-side">
          <div className="sc-sidehead">Shorts builder</div>
          <div className="sc-sidebody">
            <Section title="Source">
              <div className="sc-chiprow" style={{ marginBottom: 8 }}>
                <button type="button" className={`sc-chip${srcMode === 'youtube' ? ' on' : ''}`} onClick={() => setSrcMode('youtube')}>YouTube link</button>
                <button type="button" className={`sc-chip${srcMode === 'file' ? ' on' : ''}`} onClick={() => setSrcMode('file')}>My video file</button>
              </div>
              {srcMode === 'youtube' ? (
                <div className="sc-row">
                  <input className="sc-input" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadLink(); }} placeholder="https://www.youtube.com/watch?v=…" aria-label="YouTube video link" />
                  <button type="button" className="sc-btn primary" onClick={loadLink}>Load</button>
                </div>
              ) : (
                <button type="button" className="sc-btn block" onClick={() => fileRef.current?.click()}>Choose a video file</button>
              )}
              <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])} />
              {title && (
                <div className="sc-videoMeta">
                  {poster ? <img src={poster} alt="" /> : <span className="sc-thumbfile">FILE</span>}
                  <div>
                    <strong title={title}>{title}</strong>
                    <span>{duration ? `${fmtTime(duration)} long · ${clips.length || 1} clip window${clips.length === 1 ? '' : 's'}` : 'reading duration…'}</span>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Clip length">
              <div className="sc-chiprow">
                {LENGTHS.map((l) => (
                  <button key={l} type="button" className={`sc-chip${clipLen === l ? ' on' : ''}`} onClick={() => applyLen(l)}>{l}s</button>
                ))}
              </div>
              <div className="sc-row" style={{ marginTop: 8 }}>
                <label className="sc-label" style={{ margin: 0, flex: 1 }} htmlFor="sc-start">Start at</label>
                <input id="sc-start" className="sc-input" style={{ width: 96 }} type="number" min={0} max={Math.max(0, Math.floor((duration || 0) - 1))} value={Math.floor(startAt)} onChange={(e) => { const v = clamp(Number(e.target.value) || 0, 0, Math.max(0, (duration || 0) - 1)); setStartAt(v); setElapsed(0); seek(v); }} />
              </div>
            </Section>

            <Section title="Generate Shorts">
              <button type="button" className="sc-btn primary block" onClick={() => generate()}>Generate Shorts</button>
              <p className="sc-note">Windows are spread evenly over the runtime. The browser player exposes video and audio but no transcript, so this plan is positional — it does not claim to rank moments by content.</p>
              <div className="sc-clipList">
                {clips.length === 0 ? (
                  <p className="sc-note" style={{ marginTop: 8 }}>No clips yet. Load a video, then press Generate Shorts.</p>
                ) : (
                  <>
                    <div className="sc-clips" style={{ marginTop: 8 }}>
                      {clips.map((c, i) => (
                        <div key={c.index} className={`sc-clip${activeClip === i ? ' on' : ''}`}>
                          <button type="button" className="sc-clipMain" onClick={() => useClip(i)}>
                            <span className="sc-thumb" style={thumbStyle(c)}><i>{c.index}</i></span>
                            <div>
                              <strong>Short {c.index} — {c.len}s</strong>
                              <span>{fmtTime(c.start)} → {fmtTime(Math.min(duration || c.start + c.len, c.start + c.len))}</span>
                            </div>
                          </button>
                          <button type="button" className="sc-clipDl" disabled={!ready || recording} onClick={() => downloadClip(i)} title={srcMode === 'file' ? `Download Short ${c.index} as a ${sz.w}×${sz.h} WebM` : `Record Short ${c.index} from the 9:16 stage as a WebM`}>
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v11" /><path d="M7 10l5 5 5-5" /><path d="M4 20h16" /></svg>
                            <span>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="sc-note" style={{ marginTop: 8 }}>
                      {srcMode === 'file'
                        ? 'Each Download renders just that window from your own footage at full resolution.'
                        : 'Each Download records just that window off the stage — the share dialog opens once per clip, so keep this tab in front while it runs.'}
                    </p>
                  </>
                )}
              </div>
            </Section>

            <Section title="Reframe">
              <div className="sc-chiprow">
                {LAYOUTS.map((l) => (
                  <button key={l.id} type="button" className={`sc-chip${layout === l.id ? ' on' : ''}`} onClick={() => setLayout(l.id)}>{l.label}</button>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <span className="sc-label">Original shape</span>
                <div className="sc-chiprow">
                  {SHAPES.map((s) => (
                    <button key={s.id} type="button" className={`sc-chip${shapeId === s.id ? ' on' : ''}`} onClick={() => setShapeId(s.id)}>{s.label}</button>
                  ))}
                </div>
                <p className="sc-note" style={{ marginTop: 6 }}>
                  {layout === 'fill'
                    ? 'Center crop scales the frame to cover the whole 9:16 stage, so nothing is left black. Pick the shape the source really is — a mismatch is what shows as black bars.'
                    : 'The band sits on a blurred copy of the same frame, so the stage never falls back to black.'}
                </p>
              </div>
              <div style={{ marginTop: 10 }}>
                <span className="sc-label">Clean plate</span>
                <div className="sc-chiprow">
                  <button type="button" className={`sc-chip${!cover ? ' on' : ''}`} onClick={() => setCover(false)}>Keep bottom</button>
                  <button type="button" className={`sc-chip${cover ? ' on' : ''}`} onClick={() => setCover(true)}>Defuse bottom text</button>
                </div>
                <p className="sc-note" style={{ marginTop: 6 }}>
                  {srcMode === 'youtube'
                    ? 'The player draws its title and suggestion cards on its own frame, so the embed is scaled past the stage edges and both fall outside the shot. Text baked into the footage itself is not YouTube’s to remove — “Defuse bottom text” defocuses the lower band so hard-subtitled lines stop reading.'
                    : 'Text baked into your own footage is not something a reframe can delete — “Defuse bottom text” defocuses the lower band so hard-subtitled lines stop reading.'}
                </p>
              </div>
              <div style={{ marginTop: 10 }}>
                <span className="sc-label">Accent</span>
                <div className="sc-chiprow">
                  {ACCENTS.map((c) => (
                    <button key={c} type="button" className={`sc-swatch${accent === c ? ' on' : ''}`} title={c} aria-label={`Accent ${c}`} style={{ background: c }} onClick={() => setAccent(c)} />
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Hook &amp; captions">
              <input className="sc-input" value={hook} onChange={(e) => setHook(e.target.value)} placeholder="Hook line pinned at the top" maxLength={90} />
              <textarea className="sc-textarea" style={{ marginTop: 7 }} value={captionText} onChange={(e) => setCaptionText(e.target.value)} placeholder="Paste what is said in this window — it is cut into caption cards and burned into the export." />
              <div className="sc-row" style={{ marginTop: 7 }}>
                <label className="sc-label" style={{ margin: 0, flex: 1 }} htmlFor="sc-words">Words per caption</label>
                <input id="sc-words" className="sc-input" style={{ width: 70 }} type="number" min={2} max={8} value={wordsPerCap} onChange={(e) => setWordsPerCap(clamp(Number(e.target.value) || 4, 2, 8))} />
              </div>
              <p className="sc-note">{caps.length ? `${caps.length} caption cards, one every ${(windowLen / caps.length).toFixed(1)}s of this clip.` : 'Caption cards appear only where text is pasted above.'}</p>
            </Section>
          </div>
        </aside>

        <main className="sc-stage">
          {/* A stage capture takes the whole tab surface, so anything off the 9:16 box must be solid
              black — never the editor bleeding into the fringe of the crop. */}
          {zoom && <div className="sc-wash" aria-hidden="true" />}
          <div ref={stageRef} className={`sc-phone${zoom || full ? ' is-live' : ''}${capturing ? ' is-quiet' : ''}`} style={{ '--sc-accent': accent }}>
            <div className="sc-playerBox">
              {layout !== 'fill' && (poster ? <div className="sc-blurBg" style={{ backgroundImage: `url(${poster})` }} /> : srcMode === 'file' && bgUrl ? <video ref={bgRef} className="sc-blurVid" src={bgUrl} muted playsInline /> : null)}
              {srcMode === 'file' ? (
                <video
                  ref={videoRef}
                  className="sc-srcVid"
                  playsInline
                  preload="metadata"
                  style={{ objectFit: area.mode }}
                  onLoadedMetadata={async (e) => {
                    const d = await readDuration(e.currentTarget);
                    if (d) setDuration(d);
                    else setError('Could not read the duration of that file. Try re-saving it, or use a MP4/WebM with a complete header.');
                  }}
                  onEnded={() => { if (loop) { seek(startAt); void play(); } else setPlaying(false); }}
                />
              ) : videoId ? (
                <div className="sc-ytLayer" style={ytBoxStyle(layout, srcAsp)}>
                  <div ref={hostRef} className="sc-ytHost" />
                </div>
              ) : (
                <div className="sc-empty">Paste a YouTube link on the left and press Load.</div>
              )}
            </div>
            {cover && <div className="sc-cover" aria-hidden="true" />}
            {ready && (
              <>
                {hook && <div className="sc-hook">{hook}</div>}
                {activeCap && <div className="sc-cap" style={{ top: `${layout === 'bars' ? 70 : 74}%` }}>{activeCap.text}</div>}
                <div className="sc-progress"><i style={{ width: `${clamp(elapsed / windowLen, 0, 1) * 100}%` }} /></div>
              </>
            )}
          </div>

          {/* Outside the stage box on purpose: anything inside it lands in a stage capture. */}
          {full && !zoom && (
            <>
              <button type="button" className="sc-fullClose" onClick={() => setFull(false)}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>
                Exit full screen
              </button>
              <div className="sc-fullBar">
                <button type="button" className="sc-btn primary" onClick={togglePlay} disabled={!ready}>{playing ? 'Pause' : 'Play short'}</button>
                <button type="button" className="sc-btn" onClick={restart} disabled={!ready}>Restart</button>
                <span className="sc-time">{fmtTime(elapsed)} / {Math.round(windowLen)}s</span>
              </div>
            </>
          )}

          <div className="sc-transport">
            <button type="button" className="sc-btn primary" onClick={togglePlay} disabled={!ready}>{playing ? 'Pause' : 'Play short'}</button>
            <button type="button" className="sc-btn" onClick={restart} disabled={!ready}>Restart</button>
            <button type="button" className={`sc-btn${loop ? ' primary' : ''}`} onClick={() => setLoop((v) => !v)}>Loop {loop ? 'on' : 'off'}</button>
            <button type="button" className="sc-btn" onClick={() => setFull((v) => !v)} disabled={!ready}>Full screen</button>
            <span className="sc-time">{fmtTime(elapsed)} / {Math.round(windowLen)}s</span>
            <span className="sc-time">{sz.w} × {sz.h}</span>
          </div>
          {duration > 0 && (
            <div className="sc-timelineWrap">
              <div className="sc-timeline" onPointerDown={scrub}>
                {clips.map((c, i) => (
                  <span
                    key={c.index}
                    className={`sc-tlClip${activeClip === i ? ' on' : ''}`}
                    title={`Short ${c.index} — ${fmtTime(c.start)}`}
                    style={{ left: `${(c.start / duration) * 100}%`, width: `${(Math.min(duration, c.start + c.len) - c.start) / duration * 100}%` }}
                  />
                ))}
                <span className="sc-tlHead" style={{ left: `${clamp((startAt + elapsed) / duration, 0, 1) * 100}%` }} />
              </div>
              <div className="sc-tlScale"><span>00:00</span><span>{clips.length} clip windows · click anywhere to move the cut</span><span>{fmtTime(duration)}</span></div>
            </div>
          )}
          <p className="sc-note" style={{ textAlign: 'center', maxWidth: 580 }}>
            The stage is the short — 9:16 reframe, hook, caption cards and progress bar. What plays here is what the download carries.
          </p>
        </main>

        <aside className="sc-side sc-right">
          <div className="sc-sidehead">Export &amp; files</div>
          <div className="sc-sidebody">
            <Section title="Resolution">
              <div className="sc-chiprow">
                {SIZES.map((s) => (
                  <button key={s.id} type="button" className={`sc-chip${sizeId === s.id ? ' on' : ''}`} onClick={() => setSizeId(s.id)}>{s.label}</button>
                ))}
              </div>
            </Section>

            <Section title="Play &amp; download">
              <div className="sc-stack">
                {srcMode === 'file' ? (
                  <button type="button" className="sc-btn primary block" onClick={() => void exportFileWebm()} disabled={!ready || recording}>
                    {recording ? 'Rendering…' : 'Download HD WebM'}
                  </button>
                ) : (
                  <button type="button" className="sc-btn primary block" onClick={() => void exportCaptureWebm()} disabled={!ready || recording}>
                    {recording ? 'Recording the stage…' : 'Record this short (WebM)'}
                  </button>
                )}
                {srcMode === 'youtube' && clips.length > 1 && (
                  <button type="button" className="sc-btn block" onClick={() => void captureAll()} disabled={!ready || recording}>
                    {recording ? 'Recording the stage…' : `Record all ${clips.length} shorts · one share`}
                  </button>
                )}
                <button type="button" className="sc-btn block" onClick={exportSrt}>Download captions (.srt)</button>
                <button type="button" className="sc-btn block" onClick={exportPlan}>Download cut sheet (.json)</button>
                <button type="button" className="sc-btn block" onClick={() => void copyLink()}>Copy clip link</button>
              </div>
              {srcMode === 'youtube' && (
                <>
                  <div className="sc-chiprow" style={{ marginTop: 10 }}>
                    <button type="button" className={`sc-chip${!quiet ? ' on' : ''}`} onClick={() => setQuiet(false)} disabled={recording}>Full-screen take</button>
                    <button type="button" className={`sc-chip${quiet ? ' on' : ''}`} onClick={() => setQuiet(true)} disabled={recording}>In-place take</button>
                  </div>
                  <p className="sc-note">
                    {quiet
                      ? 'In-place take: the editor keeps its normal look and only scrolls the stage into view — the short is recorded from the stage right where it sits. Nothing here hides Chrome’s own capture prompt or its “tab is being shared” notice, which no page code can suppress. Detail is the stage’s on-screen size, so this mode is softer than a full-screen take.'
                      : 'Full-screen take: the stage fills the viewport while recording, which is what gives the sharpest file.'}
                  </p>
                </>
              )}
              <p className="sc-note">Runs on the public YouTube player only — no API key, no backend, nothing to paste in Vercel.</p>
              {srcMode === 'youtube' && (
                <p className="sc-note">
                  <strong>YouTube will not hand a browser its video pixels.</strong>{' '}
                  The stream stays inside a cross-origin player frame, so no front-end code can re-encode it into a file.
                  These buttons record the 9:16 stage itself — in the share dialog choose <strong>This tab</strong>.
                  <strong> Record all shorts</strong> opens that dialog <strong>once</strong> and then runs every clip
                  back to back, so the sharing prompt is a single interruption for the whole batch, and site settings
                  for this page → <strong>Screen capture</strong> → Allow makes later takes start without asking.
                  The one thing no page can remove is Chrome’s own capture dialog and its “tab is being shared”
                  indicator — that notice is browser UI, deliberately out of reach of web code, so it is not something
                  this tool can hide or work around.
                  What <em>is</em> in our control is the page: in either mode the recorded frames carry no editor
                  overlay, no timer badge, no player hover chrome and no mouse cursor, and the crop is remeasured
                  every frame so nothing behind the stage bleeds in. Only the <strong>downloaded file</strong> is
                  guaranteed to look like a native short — a person watching this screen while it records will still
                  see the browser’s sharing notice, and the clip’s audio plays out loud while it runs.
                  Detail is bounded by what your screen can draw at that size, so {sz.w} × {sz.h} is an upscale on a
                  small window. For the source at full resolution with no capture step at all, switch Source to{' '}
                  <strong>My video file</strong> and download from there.
                </p>
              )}
              {error && <p className="sc-err" role="alert">{error}</p>}
              {notice && <p className="sc-ok" role="status">{notice}</p>}
            </Section>

            <Section title="Exports">
              {jobs.length === 0 ? (
                <p className="sc-note">Nothing rendered yet. Jobs appear here with progress and a download link.</p>
              ) : (
                <div className="sc-jobs">
                  {jobs.map((j) => (
                    <div key={j.id} className={`sc-job${j.status === 'error' ? ' err' : ''}`}>
                      <div className="sc-jobHead">
                        <b>{j.label}</b>
                        {j.status === 'running' && <button type="button" className="sc-btn" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => cancelJob(j.id)}>Cancel</button>}
                      </div>
                      {j.status === 'running' && <div className="sc-jobBar"><i style={{ width: `${Math.round(j.progress * 100)}%` }} /></div>}
                      <div className="sc-jobFoot">
                        <span>{j.status === 'running' ? `${Math.round(j.progress * 100)}% of ${Math.round(j.dur)}s` : j.status === 'done' ? `${(j.size / 1048576).toFixed(1)} MB · ${j.w}×${j.h}` : j.status === 'canceled' ? 'Canceled' : (j.error || 'Failed')}</span>
                        {j.status === 'done' && j.url && <a href={j.url} download={j.name}>Download</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </aside>
      </div>
    </div>
  );
}
