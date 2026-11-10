import React, { useEffect, useMemo, useRef, useState } from 'react';
import { injectShortsStyles } from './styles';

const LENGTHS = [15, 18, 20];
const LAYOUTS = [
  { id: 'fill', label: 'Center Crop' },
  { id: 'blur', label: 'Blurred Bars' },
  { id: 'bars', label: 'Caption Bar' },
];
// The player never reports the source's shape, so the crop is driven by what you tell it the
// original frame is. Getting this wrong is the only way a black band can survive on the stage.
const SHAPES = [
  { id: '16:9', label: '16:9', asp: 16 / 9 },
  { id: '4:3', label: '4:3', asp: 4 / 3 },
  { id: '1:1', label: 'Square', asp: 1 },
  { id: '9:16', label: 'Vertical', asp: 9 / 16 },
];
const STAGE_PRESETS = [
  { id: '9:16', label: '9:16', sub: 'Shorts' },
  { id: '16:9', label: '16:9', sub: 'YouTube' },
  { id: '1:1', label: '1:1', sub: 'Instagram' },
];
const SIZES = [
  { id: 'hd', label: 'HD 720 × 1280', w: 720, h: 1280 },
  { id: 'fhd', label: 'Full HD 1080 × 1920', w: 1080, h: 1920 },
];
const ACCENTS = ['#6d28d9', '#07864f', '#e07a92', '#f2a30f', '#33415c', '#ffffff'];

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
const coverFit = (sw, sh, dw, dh, panX = 0, panY = 0) => {
  const s = Math.max(dw / sw, dh / sh);
  const rw = sw * s;
  const rh = sh * s;
  const maxX = Math.max(0, (rw - dw) / 2);
  const maxY = Math.max(0, (rh - dh) / 2);
  return {
    dw: rw,
    dh: rh,
    dx: (dw - rw) / 2 + clamp(panX, -1, 1) * maxX,
    dy: (dh - rh) / 2 + clamp(panY, -1, 1) * maxY,
  };
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
export function videoArea(layout, asp = VIDEO_ASP, panY = 0) {
  if (layout === 'fill') return { x: 0, y: 0, w: 100, h: 100, mode: 'cover' };
  const h = (BOX_ASP / asp) * 100;
  const baseY = layout === 'bars' ? (66 - h) / 2 : (100 - h) / 2;
  const maxShiftY = Math.max(0, (100 - h) / 2);
  const y = clamp(baseY + clamp(panY, -1, 1) * maxShiftY, 0, Math.max(0, 100 - h));
  return { x: 0, y, w: 100, h, mode: 'contain' };
}

/** The smallest box of the source's own shape that still covers the stage, centred on it. */
function coverBox(asp) {
  const k = Math.max(1, asp / BOX_ASP);
  return { w: k * 100, h: (k * BOX_ASP / asp) * 100 };
}

/** The YouTube frame is a real player, so the crop lives on its box instead of object-fit. */
export function ytBoxStyle(layout, asp = VIDEO_ASP, panX = 0, panY = 0) {
  const a = videoArea(layout, asp, panY);
  if (a.mode === 'cover') {
    const b = coverBox(asp);
    const w = b.w * BLEED * YT_OVERSCAN;
    const h = b.h * BLEED * YT_OVERSCAN;
    const maxShiftX = Math.max(0, (w - 100) / 2);
    const maxShiftY = Math.max(0, (h - 100) / 2);
    const left = (100 - w) / 2 + clamp(panX, -1, 1) * maxShiftX;
    const top = (100 - h) / 2 + clamp(panY, -1, 1) * maxShiftY;
    return { width: `${w}%`, height: `${h}%`, left: `${left}%`, top: `${top}%` };
  }
  const h = a.h * YT_OVERSCAN;
  const w = 100 * YT_OVERSCAN;
  const maxShiftX = Math.max(0, (w - 100) / 2);
  const left = (100 - w) / 2 + clamp(panX, -1, 1) * maxShiftX;
  return { width: `${w}%`, height: `${h}%`, left: `${left}%`, top: `${a.y + (a.h - h) / 2}%` };
}

const FONT_STACK = '"Roboto","Helvetica Neue",Arial,sans-serif';
const fontAt = (px) => `800 ${px}px ${FONT_STACK}`;

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

function drawSource(ctx, el, area, W, H, panX = 0, panY = 0) {
  if (!el || !el.videoWidth || !el.videoHeight) return false;
  const box = { x: (area.x / 100) * W, y: (area.y / 100) * H, w: (area.w / 100) * W, h: (area.h / 100) * H };
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  const fit = area.mode === 'contain'
    ? containFit(el.videoWidth, el.videoHeight, box.w, box.h)
    : coverFit(el.videoWidth, el.videoHeight, box.w, box.h, panX, panY);
  ctx.drawImage(el, box.x + fit.dx, box.y + fit.dy, fit.dw, fit.dh);
  ctx.restore();
  return true;
}

/** The one frame painter behind every file export, so a download matches the preview. */
export function paintShort(ctx, W, H, st) {
  const panX = st.panX || 0;
  const panY = st.panY || 0;
  const area = videoArea(st.layout, st.asp || VIDEO_ASP, panY);
  ctx.fillStyle = '#0b0f14';
  ctx.fillRect(0, 0, W, H);
  if (st.layout !== 'fill' && st.el) {
    ctx.save();
    ctx.filter = `blur(${Math.max(12, Math.round(W * 0.045))}px)`;
    ctx.globalAlpha = 0.92;
    drawSource(ctx, st.el, { x: -12, y: -12, w: 124, h: 124, mode: 'cover' }, W, H);
    ctx.restore();
  }
  drawSource(ctx, st.el, area, W, H, panX, panY);

  // Burned-in subtitles or watermarks live in the footage itself; defuse bottom, top, or both bands.
  const subMode = st.subRemoveMode || (st.cover ? 'bottom' : 'off');
  const bandRatio = clamp((Number(st.subRemoveHeight) || 22) / 100, 0.1, 0.38);
  if (subMode !== 'off' && st.el && st.el.videoWidth) {
    const ch = Math.round(H * bandRatio);
    const paintMaskBand = (y0) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y0, W, ch);
      ctx.clip();
      ctx.filter = `blur(${Math.max(10, Math.round(W * 0.036))}px)`;
      drawSource(ctx, st.el, area, W, H, panX, panY);
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(11,15,20,.48)';
      ctx.fillRect(0, y0, W, ch);
      ctx.restore();
    };
    if (subMode === 'bottom' || subMode === 'both') paintMaskBand(H - ch);
    if (subMode === 'top' || subMode === 'both') paintMaskBand(0);
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

const CheckBadge = () => (
  <span className="sc-check-badge" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
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
  if (!el || !el.seeking) { resolve(); return; }
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

  // Inject SEO Metadata, OpenGraph, Canonical Link, and JSON-LD Schema
  useEffect(() => {
    const prevTitle = document.title;
    const seoTitle = 'YouTube Shorts Builder — Free Online YouTube to Shorts Maker | ImgMojo';
    const seoDesc = 'Turn any YouTube video or local MP4/WebM into vertical 9:16 clips for YouTube Shorts, Instagram Reels, and TikTok in seconds. Free online Shorts maker with HD 1080×1920 export, captions, and no watermark.';
    const canonicalHref = 'https://www.imgmojo.com/shorts';

    document.title = seoTitle;

    const setMeta = (attr, key, content) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', seoDesc);
    setMeta('name', 'keywords', 'youtube shorts builder, youtube to shorts maker, convert youtube video to shorts, online shorts creator, vertical video maker 9:16, tiktok clip maker, instagram reels maker, free shorts generator no watermark');
    setMeta('name', 'robots', 'index, follow');
    setMeta('property', 'og:title', seoTitle);
    setMeta('property', 'og:description', seoDesc);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', canonicalHref);
    setMeta('property', 'og:site_name', 'ImgMojo');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', seoTitle);
    setMeta('name', 'twitter:description', seoDesc);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);

    const schemaId = 'sc-seo-jsonld';
    let scriptEl = document.getElementById(schemaId);
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = schemaId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'ImgMojo YouTube Shorts Builder',
          url: canonicalHref,
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description: seoDesc,
          featureList: [
            'Convert YouTube URLs or uploaded videos into 9:16 vertical Shorts',
            'Center Crop and Blurred Bars reframing modes',
            'Full HD 1080×1920 and HD 720×1280 WebM export',
            'Automatic SRT caption file and JSON cut sheet generation',
            '100% browser-based with no watermark and no signup required',
          ],
        },
        {
          '@type': 'HowTo',
          name: 'How to Turn a YouTube Video into Shorts Online',
          step: [
            { '@type': 'HowToStep', position: 1, name: 'Load Video Source', text: 'Paste any YouTube video URL and click Load, or upload a video file from your device.' },
            { '@type': 'HowToStep', position: 2, name: 'Choose Clip Settings & Style', text: 'Pick a 15s, 18s, or 20s clip duration, set the start time, and select Center Crop or Blurred Bars.' },
            { '@type': 'HowToStep', position: 3, name: 'Generate & Preview Shorts', text: 'Click Generate Shorts to create clip windows and preview your vertical 9:16 video on the interactive stage.' },
            { '@type': 'HowToStep', position: 4, name: 'Export in Full HD', text: 'Record or download your Short in Full HD 1080×1920 WebM along with SRT captions and a JSON cut sheet.' },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is the YouTube Shorts Builder completely free and watermark-free?',
              acceptedAnswer: { '@type': 'Answer', text: 'Yes! ImgMojo YouTube Shorts Builder is 100% free with unlimited usage and never adds watermarks to your exported Shorts.' },
            },
            {
              '@type': 'Question',
              name: 'What resolution are the exported Shorts?',
              acceptedAnswer: { '@type': 'Answer', text: 'You can export vertical 9:16 clips in either Full HD (1080 × 1920) or Standard HD (720 × 1280) WebM format ready for YouTube Shorts, Instagram Reels, and TikTok.' },
            },
            {
              '@type': 'Question',
              name: 'Can I upload my own video files as well as YouTube links?',
              acceptedAnswer: { '@type': 'Answer', text: 'Yes. Switch to Upload Video in the Video Source panel to reframe, caption, and render your own MP4, WebM, or MOV files directly in your browser.' },
            },
            {
              '@type': 'Question',
              name: 'Are my videos uploaded to a server?',
              acceptedAnswer: { '@type': 'Answer', text: 'No. Everything runs locally inside your browser—no video data is stored on any external server.' },
            },
          ],
        },
      ],
    });

    return () => {
      document.title = prevTitle;
    };
  }, []);

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
  const [stagePreset, setStagePreset] = useState('9:16');
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
  const [quiet, setQuiet] = useState(true);
  const [cover, setCover] = useState(false);
  const [subRemoveMode, setSubRemoveMode] = useState('off');
  const [subRemoveHeight, setSubRemoveHeight] = useState(22);
  const [clipThumbs, setClipThumbs] = useState({});
  const [tlHover, setTlHover] = useState(null);
  const [full, setFull] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [jobs, setJobs] = useState([]);
  const [showStudioExtras, setShowStudioExtras] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const hostRef = useRef(null);
  const bgRef = useRef(null);
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const fileRef = useRef(null);
  const urlInputRef = useRef(null);
  const fileUrlRef = useRef('');
  const sawPlayingRef = useRef(false);
  const userPausedRef = useRef(false);
  const panDragRef = useRef(null);
  const S = useRef({});
  const jobSeq = useRef(0);
  const jobHandles = useRef(new Map());
  const canceled = useRef(new Set());

  const caps = useMemo(() => splitCaptions(captionText, clipLen, wordsPerCap), [captionText, clipLen, wordsPerCap]);
  const sz = SIZES.find((s) => s.id === sizeId) || SIZES[1];
  const srcAsp = (SHAPES.find((s) => s.id === shapeId) || SHAPES[0]).asp;
  const area = videoArea(layout, srcAsp, panY);
  const endAt = duration ? Math.min(startAt + clipLen, duration) : startAt + clipLen;
  const windowLen = Math.max(1, endAt - startAt);
  const activeCap = caps.find((c) => elapsed >= c.at && elapsed < c.until);

  S.current = {
    layout,
    hook,
    caps,
    accent,
    len: windowLen,
    asp: srcAsp,
    cover: subRemoveMode !== 'off' || cover,
    subRemoveMode,
    subRemoveHeight,
    panX,
    panY,
  };

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
          setNotice('YouTube is holding this clip — click the video once, then press Play again.');
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
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            if (dead) return;
            try {
              e.target.unloadModule?.('captions');
              e.target.unloadModule?.('cc');
            } catch { /* ignore */ }
            const d = e.target.getDuration?.() || 0;
            const data = e.target.getVideoData?.() || {};
            if (d) { setDuration(d); setClips((prev) => (prev.length ? prev : planClips(d, clipLen))); }
            if (data.title) setTitle(data.title);
            setPoster(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
            e.target.seekTo?.(startAt, true);
          },
          onStateChange: (e) => {
            if (dead) return;
            try {
              e.target.unloadModule?.('captions');
              e.target.unloadModule?.('cc');
            } catch { /* ignore */ }
            const d = e.target.getDuration?.() || 0;
            if (d && Math.abs(d - duration) > 1) { setDuration(d); setClips((prev) => (prev.length ? prev : planClips(d, clipLen))); }
            if (e.data === 1) {
              sawPlayingRef.current = true;
              userPausedRef.current = false;
              setPlaying(true);
              setNotice((n) => (/YouTube (is holding|stopped this clip)/.test(n || '') ? '' : n));
            } else if (e.data === 2 || e.data === 0) {
              setPlaying(false);
              if (e.data === 2 && !userPausedRef.current && sawPlayingRef.current) {
                setNotice('YouTube stopped this clip on its own — click the video once, then press Play again.');
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

  // Background frame extractor: captures real 9:16 frame thumbnails for each Short window
  useEffect(() => {
    if (!clips.length) {
      setClipThumbs({});
      return undefined;
    }
    const streamSrc = srcMode === 'youtube' && videoId
      ? `/api/youtube-stream?id=${encodeURIComponent(videoId)}&kind=video`
      : srcMode === 'file' && bgUrl
        ? bgUrl
        : '';
    if (!streamSrc) return undefined;

    let cancelled = false;
    const tv = document.createElement('video');
    tv.crossOrigin = 'anonymous';
    tv.muted = true;
    tv.playsInline = true;
    tv.preload = 'metadata';
    tv.src = streamSrc;
    tv.load();

    const extractAll = async () => {
      try {
        await waitReady(tv, 8000);
        if (cancelled || !tv.videoWidth) return;
        const c = document.createElement('canvas');
        c.width = 135;
        c.height = 240;
        const x = c.getContext('2d');
        for (let i = 0; i < clips.length; i += 1) {
          if (cancelled) return;
          const clip = clips[i];
          const sampleTime = clamp(clip.start + Math.min(2, clip.len * 0.2), 0, Math.max(0, (duration || clip.start + clip.len) - 0.5));
          tv.currentTime = sampleTime;
          await waitSeek(tv, 1800);
          if (cancelled) return;
          paintShort(x, c.width, c.height, {
            ...S.current,
            el: tv,
            t: 0,
            len: clip.len,
          });
          const dataUrl = c.toDataURL('image/jpeg', 0.72);
          if (!cancelled && dataUrl) {
            setClipThumbs((prev) => ({ ...prev, [clip.index]: dataUrl }));
          }
        }
      } catch {
        // fallback thumbnails are used automatically
      } finally {
        tv.removeAttribute('src');
        try { tv.load(); } catch { /* ignore */ }
      }
    };

    void extractAll();

    return () => {
      cancelled = true;
      tv.removeAttribute('src');
      try { tv.load(); } catch { /* ignore */ }
    };
  }, [srcMode, videoId, bgUrl, clips, duration]);

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
    setPanX(0);
    setPanY(0);
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
    setPanX(0);
    setPanY(0);
    setVideoId(id);
    setTitle('');
  };

  // Drag inside the 9:16 frame to pan/reposition the visible portion of the video
  const startPanDrag = (e) => {
    if (capturing) return;
    if (e.button !== undefined && e.button !== 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    panDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: panX,
      origY: panY,
      moved: false,
    };
  };

  const movePanDrag = (e) => {
    const st = panDragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.moved && Math.hypot(dx, dy) > 3) {
      st.moved = true;
      setIsPanning(true);
    }
    if (!st.moved) return;
    const rect = stageRef.current?.getBoundingClientRect();
    const w = Math.max(120, rect?.width || 280);
    const h = Math.max(200, rect?.height || 500);
    setPanX(clamp(st.origX + dx / (w * 0.72), -1, 1));
    setPanY(clamp(st.origY + dy / (h * 0.65), -1, 1));
  };

  const endPanDrag = (e) => {
    const st = panDragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    panDragRef.current = null;
    setIsPanning(false);
    if (!st.moved && ready) {
      togglePlay();
    }
  };

  const handleStageDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      onFile(droppedFile);
    }
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
    if (!v || !v.videoWidth) { setError('Choose a video file under Video Source first — this export renders your own footage at full resolution.'); return; }
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

  // Programmatic direct YouTube-to-WebM renderer via /api/youtube-stream (no getDisplayMedia prompt!)
  const renderDirectYouTubeWebm = async (wins) => {
    setError('');
    setNotice('');
    const list = wins.filter((w) => w && w.len > 0);
    if (!list.length) {
      setError('Nothing to record yet — load a video and press Generate Shorts.');
      return;
    }
    const mime = pickMime();
    if (!mime) {
      setError('This browser has no video recording support.');
      return;
    }

    let offVideo = null;
    let offAudio = null;
    let audioCtx = null;
    let timer = 0;
    let abort = false;

    const cleanup = () => {
      clearInterval(timer);
      setCapturing(false);
      try { offVideo?.pause?.(); } catch { /* ignore */ }
      try { offAudio?.pause?.(); } catch { /* ignore */ }
      if (offVideo) {
        offVideo.removeAttribute('src');
        try { offVideo.load(); } catch { /* ignore */ }
      }
      if (offAudio) {
        offAudio.removeAttribute('src');
        try { offAudio.load(); } catch { /* ignore */ }
      }
      try { audioCtx?.close?.(); } catch { /* ignore */ }
    };

    // Pre-create first job immediately so the progress bar shows right away at 2%
    const first = list[0];
    const firstJobId = makeJob({
      kind: 'webm',
      label: list.length > 1 ? `Short 1 of ${list.length} · ${sz.w}×${sz.h}` : `Creating Reel · ${sz.w}×${sz.h}`,
      name: exportName(first.start, first.len),
      w: sz.w,
      h: sz.h,
      dur: first.len,
      progress: 0.02,
    });

    try {
      setCapturing(true);

      // Unlock AudioContext synchronously during user gesture
      let audioDest = null;
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) {
          audioCtx = new Ctx();
          void audioCtx.resume().catch(() => undefined);
          audioDest = audioCtx.createMediaStreamDestination();
        }
      } catch {
        // ignore if AudioContext unavailable
      }

      offVideo = document.createElement('video');
      offVideo.crossOrigin = 'anonymous';
      offVideo.muted = true;
      offVideo.playsInline = true;
      offVideo.preload = 'auto';
      offVideo.src = `/api/youtube-stream?id=${encodeURIComponent(videoId)}&kind=video`;
      offVideo.load();

      offAudio = document.createElement('audio');
      offAudio.crossOrigin = 'anonymous';
      offAudio.preload = 'auto';
      offAudio.src = `/api/youtube-stream?id=${encodeURIComponent(videoId)}&kind=audio`;
      offAudio.load();

      if (audioCtx && audioDest) {
        try {
          const sourceNode = audioCtx.createMediaElementSource(offAudio);
          sourceNode.connect(audioDest);
        } catch {
          // ignore audio routing error
        }
      }

      await new Promise((resolve, reject) => {
        const guard = setTimeout(() => reject(new Error('Stream timeout')), 15000);
        const onReady = () => {
          clearTimeout(guard);
          offVideo.removeEventListener('error', onErr);
          resolve();
        };
        const onErr = () => {
          clearTimeout(guard);
          offVideo.removeEventListener('loadeddata', onReady);
          offVideo.removeEventListener('canplay', onReady);
          reject(new Error('Stream unavailable'));
        };
        if (offVideo.readyState >= 2 && offVideo.videoWidth > 0) {
          clearTimeout(guard);
          resolve();
          return;
        }
        offVideo.addEventListener('loadeddata', onReady, { once: true });
        offVideo.addEventListener('canplay', onReady, { once: true });
        offVideo.addEventListener('error', onErr, { once: true });
      });

      if (!offVideo.videoWidth) throw new Error('Stream unavailable');

      await waitReady(offAudio, 3000).catch(() => undefined);

      const c = document.createElement('canvas');
      c.width = sz.w;
      c.height = sz.h;
      const x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';

      for (let i = 0; i < list.length; i += 1) {
        if (abort) break;
        const { start, len } = list[i];
        const name = exportName(start, len);
        const id = i === 0
          ? firstJobId
          : makeJob({
              kind: 'webm',
              label: `Short ${i + 1} of ${list.length} · ${sz.w}×${sz.h}`,
              name,
              w: sz.w,
              h: sz.h,
              dur: len,
              progress: 0.02,
            });

        pause();
        setStartAt(start);
        setElapsed(0);
        seek(start);

        offVideo.currentTime = start;
        if (offAudio) {
          try { offAudio.currentTime = start; } catch { /* ignore */ }
        }
        await waitReady(offVideo, 5000);
        await waitSeek(offVideo, 2500);
        if (offAudio) {
          await waitSeek(offAudio, 1200).catch(() => undefined);
        }

        const stream = c.captureStream(30);
        if (audioDest?.stream) {
          audioDest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        }

        const rec = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: Math.min(50e6, Math.max(6e6, Math.round(sz.w * sz.h * 30 * 0.12))),
        });

        jobHandles.current.set(id, () => {
          abort = true;
          clearInterval(timer);
          if (rec.state !== 'inactive') rec.stop();
        });

        const chunks = [];
        let natural = false;
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = () => {
          clearInterval(timer);
          jobHandles.current.delete(id);
          if (abort || canceled.current.has(id)) {
            patchJob(id, { status: 'canceled' });
            return;
          }
          if (!natural) {
            patchJob(id, { status: 'error', error: 'Recording stopped early.' });
            return;
          }
          finishJob(id, new Blob(chunks, { type: 'video/webm' }), name);
        };

        if (audioCtx?.state === 'suspended') {
          await audioCtx.resume().catch(() => undefined);
        }
        await offVideo.play();
        if (offAudio) {
          void offAudio.play().catch(() => undefined);
        }
        void play();
        rec.start(200);

        const t0 = Date.now();
        await new Promise((res) => {
          timer = setInterval(() => {
            const elapsedSec = clamp((Date.now() - t0) / 1000, 0, len);
            paintShort(x, sz.w, sz.h, { ...S.current, el: offVideo, t: elapsedSec, len });
            setElapsed(elapsedSec);
            patchJob(id, { progress: Math.min(0.99, (Date.now() - t0) / (len * 1000)) });
            if (rec.state === 'inactive') {
              clearInterval(timer);
              res();
            } else if (Date.now() - t0 >= len * 1000) {
              clearInterval(timer);
              natural = true;
              if (rec.state !== 'inactive') rec.stop();
              res();
            }
          }, 1000 / 30);
        });

        offVideo.pause();
        try { offAudio?.pause?.(); } catch { /* ignore */ }
        await delay(200);
      }

      cleanup();
      pause();
      if (!abort) {
        setNotice(list.length > 1 ? `${list.length} shorts created and downloaded!` : 'Short created and downloaded!');
      }
    } catch (reason) {
      cleanup();
      patchJob(firstJobId, {
        status: 'error',
        error: reason instanceof Error ? reason.message : 'Could not stream this YouTube video.',
      });
      setError('YouTube restricts automated downloads on cloud websites. Use 1-Click Download below to save the MP4, then upload it here for instant HD shorts generation!');
    }
  };

  // Old technique: record the exact 9:16 stage frame directly from the playing YouTube video
  const captureSession = async (wins) => {
    setError('');
    setNotice('');
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
      setError('This browser does not support frame capture. Switch to "Upload Video" to create your shorts.');
      return;
    }
    const list = wins.filter((w) => w && w.len > 0);
    if (!list.length) {
      setError('Nothing to create yet — load a video and click Generate Shorts.');
      return;
    }

    void play();
    let screen = null;
    let timer = 0;
    let pickerDone = false;
    let abort = false;
    const teardown = () => {
      clearInterval(timer);
      setCapturing(false);
      setZoom(false);
      try {
        screen?.getTracks().forEach((t) => t.stop());
      } catch { /* ignore */ }
    };

    try {
      setCapturing(true);
      if (!quiet) setZoom(true);
      else stageRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' });

      if (quiet) {
        let last = -1;
        for (let i = 0; i < 6; i += 1) {
          await delay(80);
          const y = Math.round(window.scrollY);
          if (y === last) break;
          last = y;
        }
      } else {
        await delay(350);
      }

      if (!stageRef.current) throw new Error('Stage frame is not ready — try again in a moment.');

      screen = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 }, cursor: 'never' },
        audio: true,
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
      });

      const track = screen.getVideoTracks()[0];
      const settings = track?.getSettings?.() || {};
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
        if (!stageRef.current) return;
        const r = stageRef.current.getBoundingClientRect();
        const sx = Math.max(0, Math.round((r.left + 1) * scale));
        const sy = Math.max(0, Math.round((r.top + 1) * scale));
        const sw = Math.max(8, Math.round((r.width - 2) * scale));
        const sh = Math.max(8, Math.round((r.height - 2) * scale));
        x.fillStyle = '#000';
        x.fillRect(0, 0, sz.w, sz.h);
        x.drawImage(cap, sx, sy, sw, sh, 0, 0, sz.w, sz.h);
      };
      timer = setInterval(() => {
        try { paint(); } catch { /* ignore dropped frame */ }
      }, 1000 / 30);

      for (let i = 0; i < list.length; i += 1) {
        if (abort) break;
        const { start, len } = list[i];
        const name = exportName(start, len);
        const id = makeJob({
          kind: 'webm',
          label: list.length > 1 ? `Short ${i + 1} of ${list.length} · ${sz.w}×${sz.h}` : `Creating Short · ${sz.w}×${sz.h}`,
          name,
          w: sz.w,
          h: sz.h,
          dur: len,
          progress: 0.02,
        });

        pause();
        setStartAt(start);
        setElapsed(0);
        seek(start);
        await delay(600);
        await play();
        await delay(250);

        const mime = pickMime();
        const stream = c.captureStream(30);
        screen.getAudioTracks().forEach((t) => stream.addTrack(t));
        const rec = new MediaRecorder(stream, {
          ...(mime ? { mimeType: mime } : {}),
          videoBitsPerSecond: Math.min(50e6, Math.max(6e6, Math.round(sz.w * sz.h * 30 * 0.12))),
        });

        jobHandles.current.set(id, () => {
          abort = true;
          if (rec.state !== 'inactive') rec.stop();
        });

        const chunks = [];
        let natural = false;
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size) chunks.push(e.data);
        };
        rec.onstop = () => {
          jobHandles.current.delete(id);
          if (abort) {
            patchJob(id, { status: 'canceled' });
            return;
          }
          if (!natural) {
            patchJob(id, { status: 'error', error: 'Creation was stopped early.' });
            return;
          }
          finishJob(id, new Blob(chunks, { type: 'video/webm' }), name);
        };

        rec.start(250);
        const t0 = Date.now();
        await new Promise((res) => {
          const poll = setInterval(() => {
            const elapsedSec = clamp((Date.now() - t0) / 1000, 0, len);
            setElapsed(elapsedSec);
            patchJob(id, { progress: Math.min(0.99, (Date.now() - t0) / (len * 1000)) });
            if (rec.state === 'inactive') {
              clearInterval(poll);
              res();
            } else if (Date.now() - t0 >= len * 1000) {
              clearInterval(poll);
              natural = true;
              if (rec.state !== 'inactive') rec.stop();
              res();
            }
          }, 100);
        });
        await delay(250);
      }

      teardown();
      pause();
      setNotice(list.length > 1 ? `${list.length} shorts created and downloaded!` : 'Short created and downloaded!');
    } catch (reason) {
      teardown();
      if (!pickerDone) pause();
      const msg = reason instanceof Error ? reason.message : String(reason);
      if (/Permission denied|denied|cancel|abort/i.test(msg)) {
        setError('Confirmation was cancelled. Click Download to create your short.');
      } else {
        setError(msg);
      }
    }
  };

  const exportCaptureWebm = (win) => {
    const list = [win || { start: startAt, len: windowLen }];
    return srcMode === 'file' ? renderPlanWebm(list) : captureSession(list);
  };

  const captureAll = () => {
    const list = clips.length ? clips.map(clipWindow) : [{ start: startAt, len: windowLen }];
    return srcMode === 'file' ? renderPlanWebm(list) : captureSession(list);
  };

  const exportSrt = () => {
    setError('');
    if (!caps.length) {
      setShowStudioExtras(true);
      setError('Type your caption lines under "Captions & Studio Options" first — that text becomes the subtitle cues.');
      return;
    }
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
    if (srcMode !== 'youtube' || !videoId) { setError('Clip links point at a YouTube video — load a link first.'); return; }
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

  const thumbUrlForClip = (c, idx = 0) => {
    if (c && clipThumbs[c.index]) return clipThumbs[c.index];
    if (srcMode === 'youtube' && videoId) {
      const variants = ['hq1.jpg', 'hq2.jpg', 'hq3.jpg', 'hqdefault.jpg'];
      return `https://i.ytimg.com/vi/${videoId}/${variants[idx % variants.length]}`;
    }
    return poster || '';
  };

  const thumbStyle = (c, idx = 0) => {
    if (c && clipThumbs[c.index]) {
      return {
        backgroundImage: `url(${clipThumbs[c.index]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    const fallbackUrl = thumbUrlForClip(c, idx);
    if (!fallbackUrl) return {};
    const shift = duration > (c?.len || 1) ? clamp((c?.start || 0) / (duration - (c?.len || 1)), 0, 1) : 0;
    return {
      backgroundImage: `linear-gradient(#0b0f1438,#0b0f1438), url(${fallbackUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: `${shift * 100}% center`,
    };
  };

  const handleTimelineMove = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = clamp(((e.clientX - rect.left) / Math.max(1, rect.width)) * 100, 6, 94);
    const hoverSec = clamp(((e.clientX - rect.left) / Math.max(1, rect.width)) * duration, 0, duration);
    const matchedIdx = clips.findIndex((c) => hoverSec >= c.start && hoverSec <= c.start + c.len);
    if (matchedIdx >= 0) {
      const mc = clips[matchedIdx];
      setTlHover({
        xPct,
        clipIndex: mc.index,
        idx: matchedIdx,
        start: mc.start,
        end: Math.min(duration, mc.start + mc.len),
        thumb: thumbUrlForClip(mc, matchedIdx),
      });
    } else {
      const nearestIdx = clips.length
        ? clips.reduce((best, c, i) => (Math.abs(c.start - hoverSec) < Math.abs(clips[best].start - hoverSec) ? i : best), 0)
        : 0;
      const nc = clips[nearestIdx];
      setTlHover({
        xPct,
        clipIndex: null,
        idx: nearestIdx,
        start: Math.floor(hoverSec),
        end: Math.min(duration, Math.floor(hoverSec + clipLen)),
        thumb: thumbUrlForClip(nc, nearestIdx),
      });
    }
  };

  const ready = Boolean(duration) && (srcMode === 'youtube' ? Boolean(videoId) : Boolean(title));
  const recording = jobs.some((j) => j.status === 'running');
  const activeJob = jobs.find((j) => j.status === 'running') || jobs[0] || null;

  return (
    <div className={`sc-page ${className}`} style={style}>
      {/* TOP FULL-WIDTH HERO BANNER */}
      <header className="sc-hero">
        <svg className="sc-hero-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="scHeroWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="65%" stopColor="#c084fc" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f472b6" stopOpacity="0.65" />
            </linearGradient>
          </defs>
          <path d="M920,120 C1080,115 1170,40 1310,35 C1375,32 1415,52 1440,68 L1440,120 Z" fill="url(#scHeroWaveGrad)" />
          <path d="M1080,120 C1190,95 1275,55 1440,20 L1440,120 Z" fill="rgba(255,255,255,0.12)" />
        </svg>

        <div className="sc-hero-left">
          <div className="sc-hero-yt-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="9.5,7.5 16.5,12 9.5,16.5" />
            </svg>
          </div>
          <div className="sc-hero-copy">
            <div className="sc-hero-title-row">
              <h1 className="sc-hero-title">YouTube Shorts Builder</h1>
              <span className="sc-hero-badge">Free Online Tool</span>
            </div>
            <p className="sc-hero-sub">
              Turn any YouTube video into short, engaging clips for YouTube Shorts, Reels, and TikTok in seconds.
            </p>
          </div>
        </div>

        <div className="sc-hero-features" aria-label="Key tool highlights">
          <div className="sc-hero-feat">
            <span className="sc-hero-feat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
              </svg>
            </span>
            <span>Fast &amp; Free</span>
          </div>
          <div className="sc-hero-feat">
            <span className="sc-hero-feat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <span>No Watermark</span>
          </div>
          <div className="sc-hero-feat">
            <span className="sc-hero-feat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            <span>HD Quality</span>
          </div>
          <div className="sc-hero-feat">
            <span className="sc-hero-feat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
              </svg>
            </span>
            <span>Unlimited Clips</span>
          </div>
        </div>
      </header>

      {/* MAIN 3-COLUMN WORKSPACE */}
      <div className="sc-body">
        {/* LEFT COLUMN: VIDEO SOURCE, CLIP SETTINGS, FRAME & STYLE */}
        <aside className="sc-side sc-left" aria-label="Video source and clip settings">
          <div className="sc-sidebody">
            {/* 1. Video Source */}
            <div className="sc-section">
              <h2 className="sc-sec-head">
                <span className="sc-sec-head-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="18" rx="3" />
                    <path d="M2 8h20" />
                    <path d="m7 3 3 5" />
                    <path d="m14 3 3 5" />
                  </svg>
                </span>
                Video Source
              </h2>

              <div className="sc-source-tabs">
                <button
                  type="button"
                  className={`sc-source-tab${srcMode === 'youtube' ? ' on' : ''}`}
                  onClick={() => setSrcMode('youtube')}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="4" fill="currentColor" opacity="0.22" />
                    <polygon points="10,8.5 16,12 10,15.5" />
                  </svg>
                  YouTube Link
                </button>
                <button
                  type="button"
                  className={`sc-source-tab${srcMode === 'file' ? ' on' : ''}`}
                  onClick={() => {
                    setSrcMode('file');
                    fileRef.current?.click();
                  }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m16 16-4-4-4 4" />
                  </svg>
                  Upload Video
                </button>
              </div>

              {srcMode === 'youtube' ? (
                <div className="sc-url-field">
                  <label className="sc-field-label" htmlFor="sc-yt-url">YouTube Video URL</label>
                  <div className="sc-url-group">
                    <div className="sc-url-input-wrap">
                      <span className="sc-url-input-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      </span>
                      <input
                        id="sc-yt-url"
                        ref={urlInputRef}
                        className="sc-input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') loadLink(); }}
                        placeholder="https://www.youtube.com/watch?v=..."
                        aria-label="YouTube video link"
                      />
                    </div>
                    <button type="button" className="sc-load-btn" onClick={loadLink}>Load</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="sc-output-btn" onClick={() => fileRef.current?.click()}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {title ? 'Change Video File' : 'Choose a Video File (MP4 / WebM)'}
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => onFile(e.target.files?.[0])}
              />

              {title && (
                <div className="sc-videoMeta">
                  {poster ? <img src={poster} alt="" /> : <span className="sc-thumbfile">FILE</span>}
                  <div>
                    <strong title={title}>{title}</strong>
                    <span>{duration ? `${fmtTime(duration)} long · ${clips.length || 1} clip window${clips.length === 1 ? '' : 's'}` : 'reading duration…'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Clip Settings */}
            <div className="sc-section">
              <h2 className="sc-sec-head">
                <span className="sc-sec-head-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                    <circle cx="9" cy="6" r="2" fill="currentColor" />
                    <circle cx="15" cy="12" r="2" fill="currentColor" />
                    <circle cx="10" cy="18" r="2" fill="currentColor" />
                  </svg>
                </span>
                Clip Settings
              </h2>

              <div className="sc-sub-label">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <polygon points="10 9 15 12 10 15 10 9" />
                </svg>
                Clip Length
              </div>

              <div className="sc-len-group" role="group" aria-label="Clip length in seconds">
                {LENGTHS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`sc-len-pill${clipLen === l ? ' on' : ''}`}
                    onClick={() => applyLen(l)}
                  >
                    {l}s
                  </button>
                ))}
              </div>

              <div className="sc-start-row">
                <label className="sc-sub-label" htmlFor="sc-start">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Start At (seconds)
                </label>
                <input
                  id="sc-start"
                  className="sc-input sc-start-input"
                  type="number"
                  min={0}
                  max={Math.max(0, Math.floor((duration || 0) - 1))}
                  value={Math.floor(startAt)}
                  onChange={(e) => {
                    const v = clamp(Number(e.target.value) || 0, 0, Math.max(0, (duration || 0) - 1));
                    setStartAt(v);
                    setElapsed(0);
                    seek(v);
                  }}
                />
              </div>
              {/* Generate Shorts Primary Button */}
              <button type="button" className="sc-generate-btn" onClick={() => generate()} style={{ marginTop: 4 }}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <line x1="20" y1="4" x2="8.12" y2="15.88" />
                  <line x1="14.47" y1="14.48" x2="20" y2="20" />
                  <line x1="8.12" y1="8.12" x2="12" y2="12" />
                </svg>
                Generate Shorts (HD)
              </button>

              {clips.length > 0 && (
                <div className="sc-clipList" style={{ marginTop: 6 }}>
                  <div className="sc-sub-label" style={{ marginBottom: 6 }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="3" width="20" height="18" rx="3" />
                      <polygon points="10 9 15 12 10 15 10 9" />
                    </svg>
                    Shorts Frame Previews ({clips.length})
                  </div>
                  <div className="sc-clips">
                    {clips.map((c, i) => (
                      <div key={c.index} className={`sc-clip${activeClip === i ? ' on' : ''}`}>
                        <button
                          type="button"
                          className="sc-clipMain"
                          onClick={() => {
                            useClip(i);
                            void play();
                          }}
                          title={`Click to preview Short ${c.index} (${fmtTime(c.start)} → ${fmtTime(Math.min(duration || c.start + c.len, c.start + c.len))})`}
                        >
                          <span className="sc-thumb" style={thumbStyle(c, i)}>
                            <i>#{c.index}</i>
                          </span>
                          <div>
                            <strong>Short {c.index} — {c.len}s</strong>
                            <span>{fmtTime(c.start)} → {fmtTime(Math.min(duration || c.start + c.len, c.start + c.len))} · Click to preview</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="sc-clipDl"
                          disabled={!ready || recording}
                          onClick={() => downloadClip(i)}
                          title={`Download Short ${c.index} in HD (${sz.w}×${sz.h} WebM)`}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 3v11" />
                            <path d="M7 10l5 5 5-5" />
                            <path d="M4 20h16" />
                          </svg>
                          <span>HD</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: 9:16 PHONE PREVIEW, ASPECT RATIO RAIL, TRANSPORT & TIMELINE */}
        <main className="sc-stage" aria-label="9:16 Shorts preview stage">
          <div className="sc-stage-glow" aria-hidden="true" />

          <div className="sc-stage-center">
            <div className="sc-phone-shell">
              {zoom && <div className="sc-wash" aria-hidden="true" />}
              <div
                ref={stageRef}
                className={`sc-phone${zoom || full ? ' is-live' : ''}${capturing ? ' is-quiet' : ''}${isDragOver ? ' is-dragover' : ''}`}
                style={{ '--sc-accent': accent }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleStageDrop}
              >
                <div className="sc-playerBox">
                  {layout !== 'fill' && (
                    poster ? (
                      <div className="sc-blurBg" style={{ backgroundImage: `url(${poster})` }} />
                    ) : srcMode === 'file' && bgUrl ? (
                      <video ref={bgRef} className="sc-blurVid" src={bgUrl} muted playsInline />
                    ) : null
                  )}

                  {srcMode === 'file' && bgUrl ? (
                    <video
                      ref={videoRef}
                      className="sc-srcVid"
                      playsInline
                      preload="metadata"
                      style={
                        area.mode === 'cover'
                          ? {
                              objectFit: 'cover',
                              objectPosition: `${50 - clamp(panX, -1, 1) * 50}% ${50 - clamp(panY, -1, 1) * 50}%`,
                            }
                          : {
                              objectFit: 'contain',
                              top: `${area.y}%`,
                              height: `${area.h}%`,
                              left: `${clamp(panX, -1, 1) * 18}%`,
                            }
                      }
                      onLoadedMetadata={async (e) => {
                        const d = await readDuration(e.currentTarget);
                        if (d) setDuration(d);
                        else setError('Could not read the duration of that file. Try re-saving it, or use a MP4/WebM with a complete header.');
                      }}
                      onEnded={() => { if (loop) { seek(startAt); void play(); } else setPlaying(false); }}
                    />
                  ) : srcMode === 'youtube' && videoId ? (
                    <div className="sc-ytLayer" style={ytBoxStyle(layout, srcAsp, panX, panY)}>
                      <div ref={hostRef} className="sc-ytHost" />
                    </div>
                  ) : (
                    <div className="sc-empty">
                      <button
                        type="button"
                        className="sc-empty-play"
                        aria-label="Load a video to play"
                        onClick={() => {
                          if (srcMode === 'youtube') {
                            if (url.trim()) loadLink();
                            else urlInputRef.current?.focus();
                          } else {
                            fileRef.current?.click();
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                          <polygon points="9,6.5 18,12 9,17.5" />
                        </svg>
                      </button>
                      <span className="sc-empty-hint">
                        {srcMode === 'youtube' ? 'Paste a YouTube URL on the left & click Load (or drop a video file here)' : 'Click or drop a video file here to load'}
                      </span>

                      <div className="sc-empty-hud" aria-hidden="true">
                        <div className="sc-empty-bar">
                          <div className="sc-empty-bar-fill">
                            <span className="sc-empty-bar-dot" />
                          </div>
                        </div>
                        <div className="sc-empty-controls">
                          <div className="sc-empty-controls-left">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                              <polygon points="7,5 18,12 7,19" />
                            </svg>
                            <span>00:00 / 0:{String(clipLen).padStart(2, '0')}</span>
                          </div>
                          <div className="sc-empty-controls-right">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive drag-to-pan surface inside the 9:16 frame */}
                  {((srcMode === 'file' && bgUrl) || (srcMode === 'youtube' && videoId)) &&
                    !capturing &&
                    !/YouTube (is holding|stopped this clip)/.test(notice || '') && (
                      <div
                        className={`sc-panSurface${isPanning ? ' is-panning' : ''}`}
                        title="Drag to adjust the video crop area inside the frame (double-click to center)"
                        onPointerDown={startPanDrag}
                        onPointerMove={movePanDrag}
                        onPointerUp={endPanDrag}
                        onPointerCancel={endPanDrag}
                        onDoubleClick={() => { setPanX(0); setPanY(0); }}
                      >
                        {isPanning && <div className="sc-panGrid" aria-hidden="true" />}
                      </div>
                    )}
                </div>

                {(subRemoveMode === 'bottom' || subRemoveMode === 'both' || cover) && (
                  <div className="sc-cover" style={{ '--sc-cover-h': `${subRemoveHeight}%` }} aria-hidden="true" />
                )}
                {(subRemoveMode === 'top' || subRemoveMode === 'both') && (
                  <div className="sc-cover top" style={{ '--sc-cover-h': `${subRemoveHeight}%` }} aria-hidden="true" />
                )}
                {ready && (
                  <>
                    {hook && <div className="sc-hook">{hook}</div>}
                    {activeCap && <div className="sc-cap" style={{ top: `${layout === 'bars' ? 70 : 74}%` }}>{activeCap.text}</div>}
                    <div className="sc-progress"><i style={{ width: `${clamp(elapsed / windowLen, 0, 1) * 100}%` }} /></div>
                  </>
                )}
              </div>

              {/* Helper Pill below Phone Frame (outside stageRef so it never appears in recordings) */}
              {((srcMode === 'file' && bgUrl) || (srcMode === 'youtube' && videoId)) && !zoom && (
                <div className="sc-panHintBar">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="5 9 2 12 5 15" />
                    <polyline points="9 5 12 2 15 5" />
                    <polyline points="15 19 12 22 9 19" />
                    <polyline points="19 9 22 12 19 15" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                  </svg>
                  <span>Drag video inside frame to adjust shot</span>
                  {(Math.abs(panX) > 0.01 || Math.abs(panY) > 0.01) && (
                    <button
                      type="button"
                      className="sc-panResetBtn"
                      onClick={() => { setPanX(0); setPanY(0); }}
                    >
                      Reset Center
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Aspect Ratio Selector Rail on the right of the Phone Preview */}
            <div className="sc-aspect-rail" role="group" aria-label="Target format & source shape">
              {STAGE_PRESETS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`sc-aspect-card${stagePreset === s.id ? ' on' : ''}`}
                  onClick={() => {
                    setStagePreset(s.id);
                    if (s.id === '1:1') setShapeId('1:1');
                    else setShapeId('16:9');
                  }}
                  title={`${s.label} ${s.sub}`}
                >
                  {s.id === '9:16' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="6" y="2" width="12" height="20" rx="2.5" />
                      <line x1="11" y1="18" x2="13" y2="18" />
                    </svg>
                  )}
                  {s.id === '16:9' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="14" rx="2.5" />
                      <polygon points="10,9.5 15,12 10,14.5" fill="currentColor" stroke="none" />
                    </svg>
                  )}
                  {s.id === '1:1' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="4" y="4" width="16" height="16" rx="3" />
                    </svg>
                  )}
                  <span className="sc-aspect-ratio">{s.label}</span>
                  <span className="sc-aspect-name">{s.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fullscreen Escape & Bar (Outside stageRef so it never appears in captures) */}
          {full && !zoom && (
            <>
              <button type="button" className="sc-fullClose" onClick={() => setFull(false)}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
                Exit full screen
              </button>
              <div className="sc-fullBar">
                <button type="button" className="sc-btn primary" onClick={togglePlay} disabled={!ready}>{playing ? 'Pause' : 'Play'}</button>
                <button type="button" className="sc-btn" onClick={restart} disabled={!ready}>Restart</button>
                <span className="sc-time">{fmtTime(elapsed)} / {Math.round(windowLen)}s</span>
              </div>
            </>
          )}

          {/* Prominent Reel Creation Progress Bar */}
          {activeJob && (activeJob.status === 'running' || activeJob.status === 'done') && !zoom && (
            <div className={`sc-reelProgressCard${activeJob.status === 'done' ? ' is-done' : ''}`} role="status" aria-live="polite">
              <div className="sc-reelProgressTop">
                <div className="sc-reelProgressTitle">
                  {activeJob.status === 'running' ? (
                    <span className="sc-reelSpinner" aria-hidden="true" />
                  ) : (
                    <span className="sc-reelDoneDot" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                  <span>
                    {activeJob.status === 'running'
                      ? `Creating HD Reel · ${activeJob.w} × ${activeJob.h}`
                      : `HD Reel Ready & Downloaded · ${activeJob.w} × ${activeJob.h}`}
                  </span>
                </div>
                <div className="sc-reelProgressRight">
                  <span className="sc-reelPercent">{Math.round((activeJob.progress || 0) * 100)}%</span>
                  {activeJob.status === 'running' ? (
                    <button
                      type="button"
                      className="sc-btn"
                      style={{ padding: '3px 10px', fontSize: 11 }}
                      onClick={() => cancelJob(activeJob.id)}
                    >
                      Cancel
                    </button>
                  ) : activeJob.url ? (
                    <a
                      href={activeJob.url}
                      download={activeJob.name}
                      className="sc-panResetBtn"
                      style={{ textDecoration: 'none', padding: '3px 10px' }}
                    >
                      Download HD Again
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="sc-reelProgressTrack">
                <div
                  className="sc-reelProgressFill"
                  style={{ width: `${Math.max(4, Math.round((activeJob.progress || 0) * 100))}%` }}
                />
              </div>
              <div className="sc-reelProgressSub">
                <span>
                  {activeJob.status === 'running'
                    ? `Rendering HD ${Math.min(Math.round(activeJob.dur), Math.round((activeJob.progress || 0) * activeJob.dur))}s of ${Math.round(activeJob.dur)}s clip`
                    : `${((activeJob.size || 0) / 1048576).toFixed(1)} MB HD WebM saved`}
                </span>
                <span>
                  {activeJob.status === 'running'
                    ? `~${Math.max(1, Math.ceil(activeJob.dur * (1 - (activeJob.progress || 0))))}s remaining`
                    : activeJob.name}
                </span>
              </div>
            </div>
          )}

          {/* Transport Bar */}
          <div className="sc-transport">
            <button type="button" className="sc-btn primary" onClick={togglePlay} disabled={!ready}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                {playing ? (
                  <>
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </>
                ) : (
                  <polygon points="7,5 19,12 7,19" />
                )}
              </svg>
              {playing ? 'Pause' : 'Play'}
            </button>

            <button type="button" className="sc-btn" onClick={restart} disabled={!ready}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Restart
            </button>

            <button type="button" className={`sc-btn${loop ? ' on' : ''}`} onClick={() => setLoop((v) => !v)}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
              </svg>
              Loop
            </button>

            <button type="button" className="sc-btn" onClick={() => setFull((v) => !v)} disabled={!ready}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
              Full Screen
            </button>

            <span className="sc-res-pill">
              <span className="sc-hd-mini">HD</span>
              {sz.w} × {sz.h}
            </span>
          </div>

          {/* Filmstrip Timeline Scrubber Card with Frame Previews */}
          <div className="sc-timelineWrap">
            <div className="sc-tlHeader">
              <span>{fmtTime(startAt)}</span>
              <span className="sc-tlDuration">
                {activeClip >= 0 && clips[activeClip]
                  ? `Short #${clips[activeClip].index} · Duration: ${Math.round(windowLen)}s`
                  : `Duration: ${Math.round(windowLen)}s`}
              </span>
              <span>{duration ? fmtTime(duration) : `00:${String(clipLen).padStart(2, '0')}`}</span>
            </div>
            <div
              className="sc-timeline"
              onPointerDown={scrub}
              onPointerMove={handleTimelineMove}
              onPointerLeave={() => setTlHover(null)}
              style={poster ? { backgroundImage: `url(${poster})` } : undefined}
              title={duration ? 'Hover to preview frames or click a Short block to jump straight to it' : 'Load a video to scrub the timeline'}
            >
              {tlHover && duration > 0 && (
                <div className="sc-tlPreviewPop" style={{ left: `${tlHover.xPct}%` }} aria-hidden="true">
                  <div
                    className="sc-tlPreviewImg"
                    style={tlHover.thumb ? { backgroundImage: `url(${tlHover.thumb})` } : undefined}
                  >
                    <span className="sc-tlPreviewTag">
                      {tlHover.clipIndex ? `Short #${tlHover.clipIndex}` : 'Frame'}
                    </span>
                  </div>
                  <div className="sc-tlPreviewMeta">
                    <strong>{tlHover.clipIndex ? `Short ${tlHover.clipIndex}` : 'Custom Clip'}</strong>
                    <span>{fmtTime(tlHover.start)} → {fmtTime(tlHover.end)}</span>
                  </div>
                </div>
              )}

              <span className="sc-tlHandle left" aria-hidden="true" />
              <span className="sc-tlHandle right" aria-hidden="true" />
              {duration > 0 && clips.map((c, i) => (
                <span
                  key={c.index}
                  role="button"
                  tabIndex={0}
                  className={`sc-tlClip${activeClip === i ? ' on' : ''}`}
                  title={`Preview Short #${c.index} (${fmtTime(c.start)} → ${fmtTime(Math.min(duration, c.start + c.len))})`}
                  style={{
                    left: `${(c.start / duration) * 100}%`,
                    width: `${Math.max(6.5, ((Math.min(duration, c.start + c.len) - c.start) / duration) * 100)}%`,
                    ...thumbStyle(c, i),
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    useClip(i);
                    void play();
                  }}
                  onPointerEnter={() => {
                    const centerPct = clamp((((c.start + c.len / 2) / duration) * 100), 8, 92);
                    setTlHover({
                      xPct: centerPct,
                      clipIndex: c.index,
                      idx: i,
                      start: c.start,
                      end: Math.min(duration, c.start + c.len),
                      thumb: thumbUrlForClip(c, i),
                    });
                  }}
                >
                  <span className="sc-tlClipBadge">#{c.index}</span>
                  <span className="sc-tlClipTime">{fmtTime(c.start)}</span>
                </span>
              ))}
              {duration > 0 && (
                <span
                  className="sc-tlHead"
                  style={{ left: `${clamp((startAt + elapsed) / duration, 0, 1) * 100}%` }}
                />
              )}
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: EXPORT & DOWNLOAD (ALL FRAME, SUBTITLE REMOVAL, RESOLUTION & HD DOWNLOAD SETTINGS) */}
        <aside className="sc-side sc-right" aria-label="Export and download options">
          <div className="sc-sidebody">
            {/* Export & Download Header + Frame & Style */}
            <div className="sc-section">
              <h2 className="sc-sec-head">
                <span className="sc-sec-head-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </span>
                Export &amp; Download
              </h2>

              <div className="sc-sub-label" style={{ marginTop: 2 }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                  <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                </svg>
                Frame &amp; Style
              </div>

              <div className="sc-style-grid">
                <button
                  type="button"
                  className={`sc-style-card${layout === 'fill' ? ' on' : ''}`}
                  onClick={() => setLayout('fill')}
                >
                  {layout === 'fill' && <CheckBadge />}
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                    <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                  </svg>
                  <span className="sc-style-card-title">Center Crop</span>
                </button>

                <button
                  type="button"
                  className={`sc-style-card${layout === 'blur' ? ' on' : ''}`}
                  onClick={() => setLayout('blur')}
                >
                  {layout === 'blur' && <CheckBadge />}
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" strokeDasharray="3 3" />
                  </svg>
                  <span className="sc-style-card-title">Blurred Bars</span>
                </button>
              </div>
            </div>

            {/* Remove Subtitle or Text on Video */}
            <div className="sc-section">
              <div className="sc-sub-label">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2.5" />
                  <path d="M6 15h4" />
                  <path d="M14 15h4" />
                  <path d="m3 3 18 18" />
                </svg>
                Remove Video Subtitles / Text
              </div>

              <div className="sc-subrem-grid" role="group" aria-label="Remove subtitle or text from video">
                {[
                  { id: 'off', label: 'Keep Original' },
                  { id: 'bottom', label: 'Hide Bottom Subtitles' },
                  { id: 'top', label: 'Hide Top Text' },
                  { id: 'both', label: 'Hide Top & Bottom' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`sc-subrem-btn${subRemoveMode === opt.id ? ' on' : ''}`}
                    onClick={() => {
                      setSubRemoveMode(opt.id);
                      setCover(opt.id !== 'off');
                    }}
                  >
                    {subRemoveMode === opt.id && <CheckBadge />}
                    {opt.label}
                  </button>
                ))}
              </div>

              {subRemoveMode !== 'off' && (
                <div className="sc-start-row" style={{ marginTop: 4 }}>
                  <label className="sc-label" style={{ margin: 0 }} htmlFor="sc-subrem-h">
                    Mask Height ({subRemoveHeight}%)
                  </label>
                  <input
                    id="sc-subrem-h"
                    type="range"
                    min={12}
                    max={35}
                    value={subRemoveHeight}
                    onChange={(e) => setSubRemoveHeight(Number(e.target.value) || 22)}
                    style={{ width: 120, accentColor: 'var(--sc-brand)' }}
                  />
                </div>
              )}

              {/* Optional Collapsible Hook & Custom Captions */}
              <button
                type="button"
                className="sc-adv-toggle"
                onClick={() => setShowStudioExtras((v) => !v)}
                aria-expanded={showStudioExtras}
              >
                <span>Add Hook Text &amp; Custom Captions</span>
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: showStudioExtras ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showStudioExtras && (
                <div className="sc-adv-body">
                  <div>
                    <span className="sc-label">Original Source Shape</span>
                    <div className="sc-chiprow">
                      {SHAPES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`sc-chip${shapeId === s.id ? ' on' : ''}`}
                          onClick={() => setShapeId(s.id)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="sc-label">Hook &amp; Captions</span>
                    <input
                      className="sc-input"
                      value={hook}
                      onChange={(e) => setHook(e.target.value)}
                      placeholder="Hook headline pinned at top"
                      maxLength={90}
                    />
                    <textarea
                      className="sc-textarea"
                      style={{ marginTop: 6 }}
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      placeholder="Paste spoken lines to burn caption cards..."
                    />
                    <div className="sc-start-row" style={{ marginTop: 6 }}>
                      <label className="sc-label" style={{ margin: 0 }} htmlFor="sc-words">Words / card</label>
                      <input
                        id="sc-words"
                        className="sc-input"
                        style={{ width: 68, padding: '5px 8px', textAlign: 'center' }}
                        type="number"
                        min={2}
                        max={8}
                        value={wordsPerCap}
                        onChange={(e) => setWordsPerCap(clamp(Number(e.target.value) || 4, 2, 8))}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="sc-label">Progress Bar Accent</span>
                    <div className="sc-chiprow">
                      {ACCENTS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`sc-swatch${accent === c ? ' on' : ''}`}
                          title={c}
                          aria-label={`Accent ${c}`}
                          style={{ background: c }}
                          onClick={() => setAccent(c)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* HD Resolution + Download Outputs */}
            <div className="sc-section">
              <div className="sc-sub-label">
                <span className="sc-hd-mini">HD</span>
                Download Quality (HD)
              </div>

              <div className="sc-res-grid" role="group" aria-label="Output resolution">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`sc-res-card${sizeId === s.id ? ' on' : ''}`}
                    onClick={() => setSizeId(s.id)}
                  >
                    {sizeId === s.id && <CheckBadge />}
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="sc-outputs-stack" style={{ marginTop: 6 }}>
                {srcMode === 'file' ? (
                  <button
                    type="button"
                    className="sc-output-btn primary"
                    onClick={() => void exportFileWebm()}
                    disabled={!ready || recording}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {recording ? 'Downloading HD Short…' : `Download Short in HD (${sz.w}×${sz.h})`}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sc-output-btn primary"
                    onClick={() => void exportCaptureWebm()}
                    disabled={!ready || recording}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {recording ? 'Generating & Downloading HD…' : `Download Short in HD (${sz.w}×${sz.h})`}
                  </button>
                )}

                {srcMode === 'youtube' && clips.length > 1 && (
                  <button
                    type="button"
                    className="sc-output-btn"
                    onClick={() => void captureAll()}
                    disabled={!ready || recording}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    {recording ? 'Generating HD Shorts…' : `Download All ${clips.length} Shorts in HD`}
                  </button>
                )}
              </div>

              {error && <p className="sc-err" role="alert">{error}</p>}
              {notice && <p className="sc-ok" role="status">{notice}</p>}

              {jobs.length > 0 && (
                <div className="sc-jobs" style={{ marginTop: 6 }}>
                  {jobs.map((j) => (
                    <div key={j.id} className={`sc-job${j.status === 'error' ? ' err' : ''}`}>
                      <div className="sc-jobHead">
                        <b>{j.label}</b>
                        {j.status === 'running' && (
                          <button
                            type="button"
                            className="sc-btn"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => cancelJob(j.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      {j.status === 'running' && (
                        <div className="sc-jobBar">
                          <i style={{ width: `${Math.round(j.progress * 100)}%` }} />
                        </div>
                      )}
                      <div className="sc-jobFoot">
                        <span>
                          {j.status === 'running'
                            ? `${Math.round(j.progress * 100)}% of ${Math.round(j.dur)}s`
                            : j.status === 'done'
                              ? `${(j.size / 1048576).toFixed(1)} MB · ${j.w}×${j.h}`
                              : j.status === 'canceled'
                                ? 'Canceled'
                                : (j.error || 'Failed')}
                        </span>
                        {j.status === 'done' && j.url && (
                          <a href={j.url} download={j.name}>Download</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* BOTTOM 4-COLUMN FEATURE STRIP */}
      <section className="sc-feature-strip" aria-label="Why use ImgMojo YouTube Shorts Builder">
        <div className="sc-feat-item">
          <div className="sc-feat-icon amber" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
          </div>
          <div className="sc-feat-text">
            <strong>Quick &amp; Easy</strong>
            <span>Create shorts in just a few clicks</span>
          </div>
        </div>

        <div className="sc-feat-item">
          <div className="sc-feat-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="sc-feat-text">
            <strong>No Data Stored</strong>
            <span>Your videos are processed securely</span>
          </div>
        </div>

        <div className="sc-feat-item">
          <div className="sc-feat-icon" aria-hidden="true">
            <span className="sc-hd-mini" style={{ fontSize: 10.5, padding: '2px 6px' }}>HD</span>
          </div>
          <div className="sc-feat-text">
            <strong>High-Quality Output</strong>
            <span>Export in HD up to 1080 × 1920</span>
          </div>
        </div>

        <div className="sc-feat-item">
          <div className="sc-feat-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
            </svg>
          </div>
          <div className="sc-feat-text">
            <strong>Unlimited Usage</strong>
            <span>No limits, completely free</span>
          </div>
        </div>
      </section>

      {/* SEO HOW-TO & FAQ CONTENT */}
      <div className="sc-seo-wrap">
        <section className="sc-seo-card" aria-labelledby="sc-howto-heading">
          <h2 id="sc-howto-heading" className="sc-seo-title">How to Create YouTube Shorts Online?</h2>
          <p className="sc-seo-sub">
            Convert long-form YouTube videos or local footage into vertical 9:16 clips for YouTube Shorts, Instagram Reels, and TikTok in four simple steps.
          </p>
          <div className="sc-steps-grid">
            <article className="sc-step-card">
              <span className="sc-step-num">1</span>
              <h3>Paste Link or Upload Video</h3>
              <p>Paste any YouTube watch, live, or Shorts link and click Load, or upload an MP4/WebM file directly from your computer.</p>
            </article>
            <article className="sc-step-card">
              <span className="sc-step-num">2</span>
              <h3>Set Clip Duration &amp; Crop</h3>
              <p>Choose a 15s, 18s, or 20s clip window, pick your start timestamp, and select Center Crop or Blurred Bars for a clean 9:16 frame.</p>
            </article>
            <article className="sc-step-card">
              <span className="sc-step-num">3</span>
              <h3>Generate &amp; Preview Shorts</h3>
              <p>Click Generate Shorts to slice the video into evenly spaced clip windows, add optional hooks or captions, and preview in real time.</p>
            </article>
            <article className="sc-step-card">
              <span className="sc-step-num">4</span>
              <h3>Export Full HD 1080 × 1920</h3>
              <p>Record or download your vertical clip in Full HD WebM, export synchronized SRT subtitles, or save a JSON cut sheet.</p>
            </article>
          </div>
        </section>

        <section className="sc-seo-card" aria-labelledby="sc-faq-heading">
          <h2 id="sc-faq-heading" className="sc-seo-title">Frequently Asked Questions</h2>
          <p className="sc-seo-sub">
            Everything you need to know about creating vertical clips with the ImgMojo YouTube Shorts Builder.
          </p>
          <div className="sc-faq-grid">
            <article className="sc-faq-item">
              <h3>Is the YouTube Shorts Builder free without watermarks?</h3>
              <p>Yes. You can generate and export unlimited vertical Shorts in HD 720p or Full HD 1080p with zero watermarks and no account required.</p>
            </article>
            <article className="sc-faq-item">
              <h3>What is the difference between Center Crop and Blurred Bars?</h3>
              <p>Center Crop scales the video to fill the entire 9:16 vertical screen, while Blurred Bars keeps the full horizontal frame centered over a soft, defocused background.</p>
            </article>
            <article className="sc-faq-item">
              <h3>How do Full-screen Take and In-place Take work for YouTube links?</h3>
              <p>Because YouTube streams inside a cross-origin iframe, the tool records the 9:16 stage directly from your browser tab. Full-screen Take maximizes sharpness, while In-place Take records the preview right where it sits.</p>
            </article>
            <article className="sc-faq-item">
              <h3>Can I export subtitles (.srt) and clip timestamps?</h3>
              <p>Yes! Open the Captions &amp; Studio Options drawer to add spoken text, burn dynamic caption cards onto the video, and download a standard .srt file or .json cut sheet.</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
