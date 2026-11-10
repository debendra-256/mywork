import React, { useEffect, useRef, useState } from 'react';
import {
  TEMPLATES, WEDDING_TEMPLATES, PREMIUM_TEMPLATES, PREMIUM_CATS, RATIOS, QUALITIES,
  tplById, ratioById, qualityById, exportDims,
  slotRects, slotPath, heartPath, heartSquare, toFrame, HEART_PATH_D,
  coverFit, containFit, clamp, FONT_GROUPS, TEXT_COLORS, fontCss, textPx,
} from './templates';
import { injectCollageStyles } from './styles';
import AddElementsPanel from '../poster/template-studio/components/AddElementsPanel';
import {
  drawElements, elementBox, elementHasText, elementLabel, makeElement,
} from './elements';

const BG_SWATCHES = ['#ffffff', '#101418', '#f7f0e4', '#eaf2fd', '#ecf7ef', '#fdeeee'];

const RATIO_DISPLAY_NAMES = {
  '1:1': 'Square',
  '4:5': 'Instagram',
  '3:4': 'Classic',
  '9:16': 'Reel',
  '4:3': 'Landscape',
  '16:9': 'Wide',
};

const COLLAGE_TUTORIAL_STEPS = [
  {
    step: 1,
    badge: 'Step 01',
    title: '1. Select a collage layout & aspect ratio.',
    description:
      'Pick from 20+ classic grids, heart frames, radial fan templates, or seasonal cards, and set your canvas size for Instagram (4:5), Reels (9:16), Square (1:1), or Widescreen (16:9).',
  },
  {
    step: 2,
    badge: 'Step 02',
    title: '2. Add your photos and videos.',
    description:
      'Click any numbered box, use the + Add Media button, or drag and drop multiple photos and video clips directly from your device into the collage slots.',
  },
  {
    step: 3,
    badge: 'Step 03',
    title: '3. Customize position, text & elements.',
    description:
      'Drag inside any box to pan, switch between Fill and Fit, zoom or flip media, change background colors, and layer custom typography, stickers, or shapes.',
  },
  {
    step: 4,
    badge: 'Step 04',
    title: '4. Export in Full HD PNG or WebM video.',
    description:
      'Choose Draft, Full HD, or Ultra HD quality and download a crisp PNG photo collage or render an animated WebM video collage in seconds—with zero watermarks.',
  },
];

const COLLAGE_FAQ_ITEMS = [
  {
    question: 'Is the ImgMojo Photo & Video Collage Editor free to use?',
    answer:
      'Yes! You can create and download both photo collages (PNG) and video collages (WebM) completely free online with no watermarks and no account signup required.',
  },
  {
    question: 'Can I combine photos and videos in the same collage?',
    answer:
      'Absolutely. Each slot in your collage template accepts either an image (JPG, PNG, WebP, SVG) or a video clip (MP4, WebM, MOV). When you click "Create Video (WebM)", all video slots play simultaneously alongside your photos and text overlays.',
  },
  {
    question: 'What aspect ratios and export resolutions are supported?',
    answer:
      'ImgMojo supports 1:1 Square, 4:5 Instagram Portrait, 3:4 Classic, 9:16 Reels/TikTok Story, 4:3 Landscape, and 16:9 Widescreen in Draft, Full HD (1080p), and Ultra HD (up to 4K) resolutions.',
  },
  {
    question: 'How do I pan, zoom, or fit a photo inside a collage box?',
    answer:
      'Click any slot on the canvas to select it, then drag directly on the image to reposition it. Use the top floating toolbar to toggle between Fill (cover) and Fit (contain), rotate/zoom, flip, or recenter.',
  },
  {
    question: 'Can I add custom text captions, stickers, and decorative frames?',
    answer:
      'Yes. Open the "Text" tab in the left sidebar to add and style multiple text layers with curated fonts and colors, or open the "Elements" tab to add ribbons, badges, shapes, and custom photo stickers.',
  },
  {
    question: 'Are my photos and videos uploaded to a server?',
    answer:
      'No. All collage rendering and video encoding happen 100% locally inside your browser using HTML5 Canvas and MediaRecorder—your personal photos and videos never leave your device.',
  },
];

function CollageStepIllustration({ step }) {
  if (step === 1) {
    return (
      <svg viewBox="0 0 240 130" fill="none" className="cj-tutorial-svg" aria-hidden="true">
        <rect x="16" y="12" width="208" height="106" rx="14" className="cj-illus-card" />
        <rect x="34" y="24" width="48" height="38" rx="7" className="cj-illus-slot-active" />
        <rect x="88" y="24" width="48" height="38" rx="7" className="cj-illus-slot" />
        <rect x="34" y="68" width="48" height="38" rx="7" className="cj-illus-slot" />
        <rect x="88" y="68" width="48" height="38" rx="7" className="cj-illus-slot-active" opacity="0.75" />
        <rect x="150" y="28" width="58" height="20" rx="6" className="cj-illus-pill-active" />
        <rect x="150" y="55" width="58" height="20" rx="6" className="cj-illus-pill" />
        <rect x="150" y="82" width="58" height="20" rx="6" className="cj-illus-pill" />
      </svg>
    );
  }
  if (step === 2) {
    return (
      <svg viewBox="0 0 240 130" fill="none" className="cj-tutorial-svg" aria-hidden="true">
        <rect x="16" y="12" width="208" height="106" rx="14" className="cj-illus-card" />
        <rect x="34" y="26" width="78" height="78" rx="12" className="cj-illus-slot" />
        <circle cx="73" cy="56" r="13" className="cj-illus-slot-active" />
        <path d="M73 50v12M67 56h12" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="52" y="78" width="42" height="7" rx="3.5" className="cj-illus-bar-brand" />
        <rect x="126" y="26" width="78" height="36" rx="9" className="cj-illus-pill-active" />
        <polygon points="158,38 172,44 158,50" className="cj-illus-slot-active" />
        <rect x="126" y="68" width="78" height="36" rx="9" className="cj-illus-slot" />
      </svg>
    );
  }
  if (step === 3) {
    return (
      <svg viewBox="0 0 240 130" fill="none" className="cj-tutorial-svg" aria-hidden="true">
        <rect x="16" y="12" width="208" height="106" rx="14" className="cj-illus-card" />
        <rect x="34" y="24" width="172" height="24" rx="8" className="cj-illus-pill" />
        <rect x="44" y="30" width="36" height="12" rx="4" className="cj-illus-slot-active" />
        <rect x="86" y="30" width="36" height="12" rx="4" className="cj-illus-bar" />
        <rect x="128" y="30" width="66" height="12" rx="4" className="cj-illus-pill-active" />
        <rect x="34" y="56" width="172" height="50" rx="10" className="cj-illus-slot" />
        <rect x="64" y="72" width="112" height="18" rx="6" className="cj-illus-card" />
        <rect x="80" y="78" width="80" height="6" rx="3" className="cj-illus-bar-brand" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 130" fill="none" className="cj-tutorial-svg" aria-hidden="true">
      <rect x="16" y="12" width="208" height="106" rx="14" className="cj-illus-card" />
      <rect x="36" y="28" width="168" height="32" rx="16" className="cj-illus-slot-active" />
      <rect x="66" y="40" width="90" height="8" rx="4" fill="#ffffff" opacity="0.92" />
      <path d="M180 38v10M176 44l4 4 4-4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="36" y="68" width="168" height="32" rx="16" className="cj-illus-pill-active" />
      <circle cx="56" cy="84" r="8" className="cj-illus-slot-active" />
      <polygon points="54,80 60,84 54,88" fill="#ffffff" />
      <rect x="72" y="80" width="94" height="8" rx="4" className="cj-illus-bar-brand" />
    </svg>
  );
}

const SAMPLE_SCENIC_THUMBS = [
  {
    name: 'mountain-lake.svg',
    label: 'Mountain Lake',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140"><defs><linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="60%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs><rect width="160" height="140" fill="url(#sky1)"/><polygon points="10,95 55,32 105,95" fill="#1e3a8a"/><polygon points="55,32 72,56 42,56" fill="#f8fafc"/><polygon points="65,95 115,40 160,95" fill="#0f172a"/><rect y="92" width="160" height="48" fill="#0369a1"/><path d="M0 105 Q80 95 160 108 L160 140 L0 140 Z" fill="#0c4a6e" opacity="0.65"/></svg>`,
  },
  {
    name: 'sunset-ocean.svg',
    label: 'Sunset Horizon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140"><defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7c2d12"/><stop offset="45%" stop-color="#f97316"/><stop offset="75%" stop-color="#fde047"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs><rect width="160" height="140" fill="url(#sky2)"/><circle cx="82" cy="76" r="18" fill="#fef08a"/><rect y="88" width="160" height="52" fill="#1e1b4b" opacity="0.78"/><ellipse cx="82" cy="104" rx="34" ry="4" fill="#fb923c" opacity="0.75"/><ellipse cx="82" cy="116" rx="22" ry="3" fill="#fde047" opacity="0.65"/></svg>`,
  },
  {
    name: 'forest-sunlight.svg',
    label: 'Forest Path',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140"><defs><linearGradient id="sky3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#bef264"/><stop offset="55%" stop-color="#15803d"/><stop offset="100%" stop-color="#052e16"/></linearGradient></defs><rect width="160" height="140" fill="url(#sky3)"/><circle cx="46" cy="34" r="24" fill="#fef9c3" opacity="0.55"/><rect x="18" y="0" width="12" height="140" fill="#14532d"/><rect x="122" y="0" width="14" height="140" fill="#052e16"/><rect x="88" y="0" width="9" height="140" fill="#166534"/><path d="M0 112 Q80 88 160 116 L160 140 L0 140 Z" fill="#14532d"/></svg>`,
  },
  {
    name: 'pink-blossom.svg',
    label: 'Pink Blossom',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140"><rect width="160" height="140" fill="#fce7f3"/><g transform="translate(80,70)"><ellipse rx="22" ry="48" fill="#ec4899" transform="rotate(0)"/><ellipse rx="22" ry="48" fill="#f472b6" transform="rotate(45)"/><ellipse rx="22" ry="48" fill="#db2777" transform="rotate(90)"/><ellipse rx="22" ry="48" fill="#f472b6" transform="rotate(135)"/><circle r="15" fill="#facc15"/><circle r="8" fill="#ca8a04"/></g></svg>`,
  },
  {
    name: 'tropical-beach.svg',
    label: 'Tropical Beach',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140"><rect width="160" height="90" fill="#38bdf8"/><rect y="78" width="160" height="32" fill="#06b6d4"/><path d="M0 104 Q75 94 160 112 L160 140 L0 140 Z" fill="#fde68a"/><path d="M126 115 Q108 65 92 34" stroke="#78350f" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M92 34 Q60 26 48 44" stroke="#15803d" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M92 34 Q118 14 142 28" stroke="#16a34a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M92 34 Q72 48 58 68" stroke="#15803d" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`,
  },
].map((item) => ({
  ...item,
  url: `data:image/svg+xml;utf8,${encodeURIComponent(item.svg)}`,
}));

const defAdj = () => ({ dx: 0, dy: 0, zoom: 1, mode: 'fill' });

const LINE_H = 1.22;

const defText = () => ({
  id: 0, text: 'Add your text', x: 0.5, y: 0.5,
  size: 48, color: '#1c2025', opacity: 100, font: 'sans',
});

// Canvas measureText is the only way the editor's selection box can hug a text
// layer the same way the painted glyphs do, so one off-screen context is shared.
let measureCtx = null;
const textWidth = (line, px, font) => {
  if (typeof document === 'undefined') return line.length * px * 0.55;
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `${px}px ${fontCss(font)}`;
  return measureCtx.measureText(line).width;
};

const textLines = (t) => String(t.text ?? '').split('\n');

/** The layer's painted bounding box in canvas px. */
function textBox(t, W, H) {
  const px = textPx(t.size, W, H);
  const lines = textLines(t);
  const w = Math.max(px * 0.6, ...lines.map((l) => textWidth(l, px, t.font)));
  return { x: t.x * W - w / 2, y: t.y * H - (lines.length * px * LINE_H) / 2, w, h: lines.length * px * LINE_H, px };
}

/** Area centroid of a polygon slot — where its number and add button sit. */
function polyCentroid(r) {
  const pts = r.points.map(([px, py]) => [r.x + px * r.w, r.y + py * r.h]);
  let a = 0; let cx = 0; let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    const cross = x0 * y1 - x1 * y0;
    a += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  a *= 0.5;
  if (Math.abs(a) < 1) return { x: pts[0][0], y: pts[0][1] };
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

function drawTextLayer(ctx, W, H, t) {
  const { px } = textBox(t, W, H);
  const lines = textLines(t);
  ctx.save();
  ctx.globalAlpha = clamp((t.opacity ?? 100) / 100, 0, 1);
  ctx.font = `${px}px ${fontCss(t.font)}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.color;
  const lh = px * LINE_H;
  const y0 = t.y * H - ((lines.length - 1) * lh) / 2;
  lines.forEach((line, k) => ctx.fillText(line, t.x * W, y0 + k * lh));
  ctx.restore();
}

// Deterministic procedural ornaments for premium templates — seed from the
// template id so preview and every export frame paint the identical scene.
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function leafPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.9, -s * 0.25, 0, s);
  ctx.quadraticCurveTo(-s * 0.9, -s * 0.25, 0, -s);
  ctx.closePath();
}

function starPath(ctx, x, y, r, pinch = 0.42) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * pinch;
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.quadraticCurveTo(x + Math.cos(a - Math.PI / 8) * r * 1.18, y + Math.sin(a - Math.PI / 8) * r * 1.18, px, py);
  }
  ctx.closePath();
}

function tiePath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s * 0.5, y + s * 0.35);
  ctx.lineTo(x + s * 0.38, y + s * 0.62);
  ctx.lineTo(x + s * 0.62, y + s * 1.6);
  ctx.lineTo(x, y + s * 2.05);
  ctx.lineTo(x - s * 0.62, y + s * 1.6);
  ctx.lineTo(x - s * 0.38, y + s * 0.62);
  ctx.lineTo(x - s * 0.5, y + s * 0.35);
  ctx.closePath();
}

function mustachePath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - s * 0.35, y - s * 0.5, x - s * 1.1, y - s * 0.35, x - s * 1.15, y + s * 0.05);
  ctx.bezierCurveTo(x - s * 1.18, y + s * 0.4, x - s * 0.7, y + s * 0.55, x - s * 0.35, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.18, y + s * 0.18, x - s * 0.06, y + s * 0.12, x, y + s * 0.12);
  ctx.bezierCurveTo(x + s * 0.06, y + s * 0.12, x + s * 0.18, y + s * 0.18, x + s * 0.35, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.7, y + s * 0.55, x + s * 1.18, y + s * 0.4, x + s * 1.15, y + s * 0.05);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 0.35, x + s * 0.35, y - s * 0.5, x, y);
  ctx.closePath();
}

function treePath(ctx, x, y, s) {
  ctx.beginPath();
  for (let t = 0; t < 3; t++) {
    const ty = y + t * s * 0.55;
    const tw = s * (1 - t * 0.22);
    ctx.moveTo(x, ty - s * 0.7);
    ctx.lineTo(x + tw * 0.5, ty + s * 0.12);
    ctx.lineTo(x - tw * 0.5, ty + s * 0.12);
    ctx.closePath();
  }
}

function drawDeco(ctx, W, H, kind) {
  const m = Math.min(W, H);
  const u = m * 0.022;
  const rnd = mulberry(hashSeed(kind));
  ctx.save();

  if (kind === 'autumn') {
    const cols = ['#d9731f', '#e8a13c', '#b64a1e', '#cf8b2e'];
    const spots = [
      [u * 1.2, u * 1.2], [W - u * 1.2, u * 1.2], [u * 1.2, H - u * 1.2], [W - u * 1.2, H - u * 1.2],
      [W / 2, u * 1.1], [W / 2, H - u * 1.1],
    ];
    spots.forEach(([sx, sy]) => {
      for (let i = 0; i < 4; i++) {
        const s = m * (0.012 + rnd() * 0.011);
        const ox = (rnd() - 0.5) * u * 2.2;
        const oy = (rnd() - 0.5) * u * 2.2;
        ctx.save();
        ctx.translate(sx + ox, sy + oy);
        ctx.rotate(rnd() * Math.PI * 2);
        ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
        ctx.globalAlpha = 0.85;
        leafPath(ctx, s);
        ctx.fill();
        ctx.restore();
      }
    });
  } else if (kind === 'christmas-snow' || kind === 'christmas-tree' || kind === 'christmas-garland') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const n = kind === 'christmas-snow' ? 90 : 50;
    for (let i = 0; i < n; i++) {
      const r = m * (0.0016 + rnd() * 0.0026);
      ctx.beginPath();
      ctx.arc(rnd() * W, rnd() * H, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const flake = (x, y, s) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(1, m * 0.0016);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
        ctx.moveTo(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55);
        ctx.lineTo(x + Math.cos(a) * s * 0.55 + Math.cos(a + 0.7) * s * 0.3, y + Math.sin(a) * s * 0.55 + Math.sin(a + 0.7) * s * 0.3);
        ctx.moveTo(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55);
        ctx.lineTo(x + Math.cos(a) * s * 0.55 + Math.cos(a - 0.7) * s * 0.3, y + Math.sin(a) * s * 0.55 + Math.sin(a - 0.7) * s * 0.3);
      }
      ctx.stroke();
    };
    const tree = (x, y, s) => {
      ctx.fillStyle = '#2f6b4a';
      treePath(ctx, x, y, s);
      ctx.fill();
      ctx.fillStyle = '#6b4a2f';
      ctx.fillRect(x - s * 0.09, y + s * 1.65, s * 0.18, s * 0.4);
      ctx.fillStyle = '#e8c85a';
      starPath(ctx, x, y - s * 0.82, s * 0.16);
      ctx.fill();
      const baubles = ['#c94f4f', '#e8c85a', '#dfe8f0'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = baubles[i % baubles.length];
        ctx.beginPath();
        ctx.arc(x + (rnd() - 0.5) * s * 0.7, y + s * (0.1 + rnd() * 1.3), s * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    if (kind === 'christmas-tree') {
      tree(u * 3.4, u * 3.6, m * 0.03);
      tree(W - u * 3.4, u * 3.6, m * 0.03);
      flake(u * 2.2, H - u * 2.4, m * 0.016);
      flake(W - u * 2.2, H - u * 2.4, m * 0.016);
    } else if (kind === 'christmas-garland') {
      const cols = ['#c94f4f', '#e8c85a', '#dfe8f0'];
      ctx.strokeStyle = '#2f6b4a';
      ctx.lineWidth = Math.max(2, m * 0.004);
      ctx.beginPath();
      ctx.moveTo(u * 0.8, u * 1.6);
      const bumps = 7;
      for (let i = 0; i <= bumps; i++) {
        const bx = u * 0.8 + ((W - u * 1.6) / bumps) * i;
        ctx.quadraticCurveTo(bx - (W - u * 1.6) / bumps / 2, u * 3.4, bx, u * 1.6);
      }
      ctx.stroke();
      for (let i = 0; i <= bumps; i++) {
        const bx = u * 0.8 + ((W - u * 1.6) / bumps) * i;
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath();
        ctx.arc(bx, u * 3.55, m * 0.007, 0, Math.PI * 2);
        ctx.fill();
      }
      flake(u * 2.2, H - u * 2.4, m * 0.016);
      flake(W - u * 2.2, H - u * 2.4, m * 0.016);
    } else {
      flake(u * 2.2, u * 2.4, m * 0.016);
      flake(W - u * 2.2, u * 2.4, m * 0.016);
      flake(u * 2.2, H - u * 2.4, m * 0.016);
      flake(W - u * 2.2, H - u * 2.4, m * 0.016);
    }
  } else if (kind === 'love-hearts') {
    const cols = ['#e07a92', '#f2a9ba', '#0a9f62', '#f7cbd6'];
    const spots = [
      [u * 1.5, u * 1.5], [W - u * 1.5, u * 1.5], [u * 1.5, H - u * 1.5], [W - u * 1.5, H - u * 1.5],
      [W / 2, u * 1.2], [W / 2, H - u * 1.2],
    ];
    spots.forEach(([sx, sy], i) => {
      for (let k = 0; k < 3; k++) {
        const s = m * (0.011 + rnd() * 0.012);
        ctx.save();
        ctx.translate(sx + (rnd() - 0.5) * u * 2.6, sy + (rnd() - 0.5) * u * 2.6);
        ctx.rotate((rnd() - 0.5) * 0.7);
        ctx.fillStyle = cols[(i + k) % cols.length];
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        heartPath(ctx, -s / 2, -s / 2, s, s);
        ctx.fill();
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;
  } else if (kind === 'dad-tie') {
    ctx.fillStyle = '#2e3d59';
    tiePath(ctx, W / 2, u * 0.7, m * 0.024);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,200,90,0.75)';
    ctx.lineWidth = Math.max(1, m * 0.0018);
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(W / 2 - m * 0.012, u * 0.7 + m * 0.024 * (0.4 + i * 0.42));
      ctx.lineTo(W / 2 + m * 0.012, u * 0.7 + m * 0.024 * (0.4 + i * 0.42));
      ctx.stroke();
    }
    ctx.fillStyle = '#c9a13b';
    [[u * 1.6, u * 1.6], [W - u * 1.6, u * 1.6], [u * 1.6, H - u * 1.6], [W - u * 1.6, H - u * 1.6]].forEach(([sx, sy]) => {
      starPath(ctx, sx, sy, m * 0.012);
      ctx.fill();
    });
  } else if (kind === 'dad-stars') {
    const cols = ['#33415c', '#c9a13b', '#7d8cab'];
    const spots = [
      [u * 1.6, u * 1.6], [W - u * 1.6, u * 1.6], [u * 1.6, H - u * 1.6], [W - u * 1.6, H - u * 1.6],
      [W / 2, u * 1.3], [W / 2, H - u * 1.3],
    ];
    spots.forEach(([sx, sy], i) => {
      ctx.fillStyle = cols[i % cols.length];
      ctx.globalAlpha = 0.9;
      starPath(ctx, sx, sy, m * (0.01 + (i % 3) * 0.003));
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  } else if (kind === 'dad-mustache') {
    ctx.fillStyle = '#33383f';
    mustachePath(ctx, W / 2, H - u * 2.2, m * 0.02);
    ctx.fill();
    ctx.fillStyle = '#c9a13b';
    starPath(ctx, u * 2, u * 2, m * 0.013);
    ctx.fill();
    starPath(ctx, W - u * 2, u * 2, m * 0.013);
    ctx.fill();
  }

  ctx.restore();
}

function paintScene(ctx, W, H, st) {
  const { tpl: tp, items: its, adjusts: adjs, bg: bgc, frames: frs } = st;
  ctx.fillStyle = bgc;
  ctx.fillRect(0, 0, W, H);
  const rects = slotRects(tp, W, H, frs);
  const rad = Math.min(W, H) * 0.012;
  rects.forEach((r, i) => {
    const it = its[i];
    const adj = adjs[i] || {};
    const mode = adj.mode || 'fill';
    ctx.save();
    slotPath(ctx, r, rad);
    ctx.clip();
    ctx.fillStyle = '#eef1f6';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (it && it.el) {
      const el = it.el;
      const sw = it.kind === 'video' ? el.videoWidth : el.naturalWidth;
      const sh = it.kind === 'video' ? el.videoHeight : el.naturalHeight;
      if (sw > 0 && sh > 0) {
        const zoom = clamp(adj.zoom || 1, 1, 3);
        const cf = mode === 'fit'
          ? containFit(sw, sh, r.w * zoom, r.h * zoom)
          : coverFit(sw, sh, r.w * zoom, r.h * zoom);
        let ox, oy;
        if (mode === 'fit') {
          ox = clamp((adj.dx || 0) * r.w, -r.w * 1.5, r.w * 1.5);
          oy = clamp((adj.dy || 0) * r.h, -r.h * 1.5, r.h * 1.5);
        } else {
          const mx = Math.max(0, (cf.dw - r.w) / 2);
          const my = Math.max(0, (cf.dh - r.h) / 2);
          ox = clamp((adj.dx || 0) * r.w, -mx, mx);
          oy = clamp((adj.dy || 0) * r.h, -my, my);
        }
        ctx.drawImage(el, r.x + cf.dx + ox, r.y + cf.dy + oy, cf.dw, cf.dh);
      }
    }
    ctx.restore();
    slotPath(ctx, r, rad);
    ctx.strokeStyle = 'rgba(15,23,42,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  if (tp && tp.deco) drawDeco(ctx, W, H, tp.deco);
  // Text sits above ornaments and photos so what the panel shows is what exports.
  drawElements(ctx, W, H, st.els);
  (st.texts || []).forEach((t) => drawTextLayer(ctx, W, H, t));
}

function makeItem(file) {
  const url = URL.createObjectURL(file);
  if (/^video\//.test(file.type)) {
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.src = url;
    v.play().catch(() => {});
    return { kind: 'video', el: v, url, name: file.name };
  }
  const img = new Image();
  img.src = url;
  return { kind: 'image', el: img, url, name: file.name };
}

const Section = ({ title, children }) => (
  <div>
    <h4 className="cj-h4">{title}</h4>
    {children}
  </div>
);

// Picker thumbnails use the same cell maths and heart path as the canvas, so a
// thumbnail is a true miniature of what picking it will paint.
function TemplateCells({ cells }) {
  return cells.map(([l, tp, r, b, shape, points], k) => {
    const P = 3.2, G = 2.2;
    if (shape === 'poly' && points) {
      const style = { left: `${l * 100}%`, top: `${tp * 100}%`, width: `${(r - l) * 100}%`, height: `${(b - tp) * 100}%` };
      return (
        <svg key={k} className="cj-tplcell cj-tplpoly" viewBox="0 0 100 100" preserveAspectRatio="none" style={style} aria-hidden="true">
          <polygon points={points.map(([x, y]) => `${x * 100},${y * 100}`).join(' ')} />
        </svg>
      );
    }
    const x0 = l <= 0 ? P : l * 100 + G;
    const x1 = r >= 1 ? 100 - P : r * 100 - G;
    const y0 = tp <= 0 ? P : tp * 100 + G;
    const y1 = b >= 1 ? 100 - P : b * 100 - G;
    const style = { left: `${x0}%`, top: `${y0}%`, width: `${x1 - x0}%`, height: `${y1 - y0}%` };
    return shape === 'heart'
      ? <svg key={k} className="cj-tplcell cj-tplheart" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={style} aria-hidden="true"><path d={HEART_PATH_D} /></svg>
      : <span key={k} className="cj-tplcell" style={style} />;
  });
}

export default function CollageStudio({ className = '', style }) {
  injectCollageStyles();

  const [tplId, setTplId] = useState('grid2x2');
  const [premCat, setPremCat] = useState('all');
  const [ratioId, setRatioId] = useState('4:5');
  const [items, setItems] = useState([null, null, null, null]);
  const [adjusts, setAdjusts] = useState([defAdj(), defAdj(), defAdj(), defAdj()]);
  const [sel, setSel] = useState(-1);
  const [bg, setBg] = useState('#ffffff');
  const [frames, setFrames] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selText, setSelText] = useState(null);
  const [els, setEls] = useState([]);
  const [selEl, setSelEl] = useState(null);
  const [recDur, setRecDur] = useState(5);
  const [qualityId, setQualityId] = useState('hd');
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState('');

  // UI-only tab & filter state for the redesigned left panel
  const [leftTab, setLeftTab] = useState('templates');
  const [boxFilter, setBoxFilter] = useState('all');
  const [openFaq, setOpenFaq] = useState(0);

  // SEO Meta Tags & JSON-LD Structured Data (WebApplication, HowTo, FAQPage)
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const previousTitle = document.title;
    const seoTitle = 'Free Photo & Video Collage Maker Online – Collage Editor | ImgMojo';
    const seoDescription =
      'Create stunning photo and video collages online for free with ImgMojo Collage Editor. Choose from 20+ grid, heart, and fan templates, add photos or videos, customize text & stickers, and export in Full HD PNG or WebM video—no signup required.';
    const seoKeywords =
      'photo collage maker, video collage editor, free online collage maker, photo grid maker, Instagram collage maker, video grid maker, heart photo collage, combine photos and videos online, HD collage export, ImgMojo';
    const canonicalUrl = window.location.href.split('#')[0];
    const ogImageUrl = `${window.location.origin}/sample-portrait.jpg`;

    document.title = seoTitle;

    const managedMeta = [];
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
      const created = !element;
      const prevContent = element ? element.getAttribute('content') : null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
      managedMeta.push({ element, created, prevContent });
    };

    setMetaTag('name', 'description', seoDescription);
    setMetaTag('name', 'keywords', seoKeywords);
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large');
    setMetaTag('name', 'author', 'ImgMojo');
    setMetaTag('property', 'og:title', seoTitle);
    setMetaTag('property', 'og:description', seoDescription);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:site_name', 'ImgMojo');
    setMetaTag('property', 'og:image', ogImageUrl);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', seoTitle);
    setMetaTag('name', 'twitter:description', seoDescription);
    setMetaTag('name', 'twitter:image', ogImageUrl);

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    const createdCanonical = !canonicalLink;
    const prevCanonicalHref = canonicalLink ? canonicalLink.getAttribute('href') : null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'ImgMojo Photo & Video Collage Editor',
          url: canonicalUrl,
          applicationCategory: 'MultimediaApplication',
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
          name: 'How to Make a Photo or Video Collage Online',
          description: 'Follow these 4 simple steps to create, customize, and export a photo or video collage online for free.',
          step: COLLAGE_TUTORIAL_STEPS.map((item) => ({
            '@type': 'HowToStep',
            position: item.step,
            name: item.title,
            text: item.description,
          })),
        },
        {
          '@type': 'FAQPage',
          mainEntity: COLLAGE_FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    };

    const scriptId = 'collage-studio-seo-jsonld';
    let jsonLdScript = document.getElementById(scriptId);
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = scriptId;
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(structuredData);

    return () => {
      document.title = previousTitle;
      managedMeta.forEach(({ element, created, prevContent }) => {
        if (created) {
          element.remove();
        } else if (prevContent !== null) {
          element.setAttribute('content', prevContent);
        }
      });
      if (createdCanonical && canonicalLink) {
        canonicalLink.remove();
      } else if (canonicalLink && prevCanonicalHref !== null) {
        canonicalLink.setAttribute('href', prevCanonicalHref);
      }
      const existingScript = document.getElementById(scriptId);
      if (existingScript) existingScript.remove();
    };
  }, []);

  const canvasRef = useRef(null);
  const fillRef = useRef(null);
  const slotFileRef = useRef(null);
  const textFieldRef = useRef(null);
  const pendingSlotRef = useRef(-1);
  const dragRef = useRef(null);
  const frameDragRef = useRef(null);
  const textDragRef = useRef(null);
  const elDragRef = useRef(null);
  const elFileRef = useRef(null);
  const pendingElPhotoRef = useRef(null);
  const elSeq = useRef(0);
  const textSeq = useRef(0);
  const jobSeq = useRef(0);
  const jobHandles = useRef(new Map());
  const canceledJobs = useRef(new Set());

  const tpl = tplById(tplId);
  const ratio = ratioById(ratioId);
  const quality = qualityById(qualityId);
  const dims = { w: ratio.w, h: ratio.h };
  const ed = exportDims(ratio, quality);
  const rects = slotRects(tpl, dims.w, dims.h, frames);
  const filled = items.filter(Boolean).length;
  const filledNames = items.filter(Boolean).map((it) => it.name);
  const runningJob = jobs.find((j) => j.status === 'running') || null;
  const runningCount = runningJob ? 1 : 0;
  const premiumShown = PREMIUM_TEMPLATES.filter((t) => premCat === 'all' || t.cat === premCat);
  const templatesShown = TEMPLATES.filter((t) => {
    if (boxFilter === 'all') return true;
    if (boxFilter === '5+') return t.slots >= 5;
    return String(t.slots) === boxFilter;
  });

  const pickTemplate = (t) => {
    setTplId(t.id);
    if (t.ratio) setRatioId(t.ratio);
    if (t.bg) setBg(t.bg);
    // Template headings belong to their layout: swapping layouts drops the old
    // heading but leaves anything the user typed themselves untouched.
    setTexts((prev) => {
      const kept = prev.filter((x) => !x.tpl || x.tpl === t.id);
      if (!t.texts || kept.some((x) => x.tpl === t.id)) return kept;
      const added = t.texts.map((tx) => ({ ...defText(), ...tx, id: ++textSeq.current, tpl: t.id }));
      return [...kept, ...added];
    });
    setSelText(null);
    setSelEl(null);
  };

  const pickPremium = (t) => {
    setTplId(t.id);
    setBg(t.bg);
    setTexts((prev) => prev.filter((x) => !x.tpl));
    setSel(-1);
    setSelText(null);
    setSelEl(null);
  };

  const S = useRef({});
  S.current = { tpl, items, adjusts, bg, frames, texts, els };

  useEffect(() => {
    setItems((prev) => Array.from({ length: tpl.slots }, (_, i) => prev[i] || null));
    setAdjusts((prev) => Array.from({ length: tpl.slots }, (_, i) => prev[i] || defAdj()));
    setFrames([]);
    setSel(-1);
  }, [tplId]);

  useEffect(() => {
    const c = canvasRef.current;
    if (c) { c.width = dims.w; c.height = dims.h; }
  }, [ratioId]);

  useEffect(() => {
    let raf;
    const loop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        paintScene(canvas.getContext('2d'), canvas.width, canvas.height, S.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const loadFiles = (fileList, slotIdx = null) => {
    const files = Array.from(fileList || []).filter((f) => /^(video|image)\//.test(f.type));
    if (!files.length) return;
    setErr('');
    setItems((prev) => {
      const next = prev.slice();
      if (slotIdx != null && slotIdx >= 0) {
        if (next[slotIdx]) URL.revokeObjectURL(next[slotIdx].url);
        next[slotIdx] = makeItem(files[0]);
      } else {
        let k = 0;
        for (let i = 0; i < next.length && k < files.length; i++) {
          if (!next[i]) next[i] = makeItem(files[k++]);
        }
      }
      return next;
    });
  };

  const loadScenicThumb = (scenicItem) => {
    const img = new Image();
    img.src = scenicItem.url;
    setItems((prev) => {
      const next = prev.slice();
      const targetIdx = sel >= 0 ? sel : next.findIndex((x) => !x);
      const idx = targetIdx >= 0 ? targetIdx : 0;
      next[idx] = { kind: 'image', el: img, url: scenicItem.url, name: scenicItem.name };
      return next;
    });
  };

  const openSlotFile = (i) => {
    pendingSlotRef.current = i;
    if (slotFileRef.current) { slotFileRef.current.value = ''; slotFileRef.current.click(); }
  };

  const hitSlot = (e) => {
    const canvas = canvasRef.current;
    const b = canvas.getBoundingClientRect();
    const px = ((e.clientX - b.left) / b.width) * dims.w;
    const py = ((e.clientY - b.top) / b.height) * dims.h;
    const ctx = canvas.getContext('2d');
    // Walked back to front because dragged hearts may overlap: the silhouette
    // the pointer is really on belongs to the top-most slot.
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (px < r.x || px > r.x + r.w || py < r.y || py > r.y + r.h) continue;
      if (r.shape === 'box') return i;
      // Hearts and fan wedges own only their silhouette: the empty corners of
      // their box (and the gaps between wedges) fall through to what's behind.
      const path = new Path2D();
      slotPath(path, r, 0);
      if (ctx.isPointInPath(path, px, py)) return i;
    }
    return -1;
  };

  const frameOf = (i) => frames[i] || toFrame(rects[i], dims.w, dims.h);

  const putFrame = (i, f) => setFrames((prev) => {
    const next = prev.slice();
    const fw = clamp(f.fw, 0.03, 1.8);
    const fh = clamp(f.fh, 0.03, 1.8);
    // The centre is what must stay on the canvas, so a big heart can hang over
    // an edge without vanishing from reach.
    const cx = clamp(f.fx + fw / 2, 0, 1);
    const cy = clamp(f.fy + fh / 2, 0, 1);
    next[i] = { fx: cx - fw / 2, fy: cy - fh / 2, fw, fh };
    return next;
  });

  const moveFrame = (i, dxf, dyf) => {
    const f = frameOf(i);
    putFrame(i, { ...f, fx: f.fx + dxf, fy: f.fy + dyf });
  };

  /** Size a heart as a percentage of the width the template gave it. */
  const heartPct = (i) => {
    const base = slotRects(tpl, dims.w, dims.h)[i];
    return Math.round((frameOf(i).fw / (base.w / dims.w)) * 100);
  };

  const scaleHeartTo = (i, pct) => {
    const base = slotRects(tpl, dims.w, dims.h)[i];
    const f = frameOf(i);
    const k = ((base.w / dims.w) * (pct / 100)) / f.fw;
    putFrame(i, { fx: f.fx + (f.fw - f.fw * k) / 2, fy: f.fy + (f.fh - f.fh * k) / 2, fw: f.fw * k, fh: f.fh * k });
  };

  const startFrameDrag = (i, mode) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    const b = canvasRef.current.getBoundingClientRect();
    frameDragRef.current = { i, mode, sx: e.clientX, sy: e.clientY, f: frameOf(i), b };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
  };

  const onFrameDragMove = (e) => {
    const d = frameDragRef.current;
    if (!d) return;
    if (d.mode === 'move') {
      putFrame(d.i, { ...d.f, fx: d.f.fx + (e.clientX - d.sx) / d.b.width, fy: d.f.fy + (e.clientY - d.sy) / d.b.height });
      return;
    }
    // Resizing pulls the heart outward from its own centre, so the shape grows
    // evenly instead of shearing inside a wide cell.
    const sq = heartSquare(rects[d.i]);
    const cx = d.b.left + ((sq.x + sq.s / 2) / dims.w) * d.b.width;
    const cy = d.b.top + ((sq.y + sq.s / 2) / dims.h) * d.b.height;
    const from = Math.max(10, Math.hypot(d.sx - cx, d.sy - cy));
    const k = clamp(Math.hypot(e.clientX - cx, e.clientY - cy) / from, 0.15, 6);
    putFrame(d.i, { fx: d.f.fx + (d.f.fw - d.f.fw * k) / 2, fy: d.f.fy + (d.f.fh - d.f.fh * k) / 2, fw: d.f.fw * k, fh: d.f.fh * k });
  };

  const endFrameDrag = (e) => {
    frameDragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (er) { /* noop */ }
  };

  const patchText = (id, p) => setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const startTextDrag = (t, e) => {
    const b = canvasRef.current.getBoundingClientRect();
    textDragRef.current = { id: t.id, sx: e.clientX, sy: e.clientY, x: t.x, y: t.y, b };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
  };

  const onTextDragMove = (e) => {
    const d = textDragRef.current;
    if (!d) return;
    patchText(d.id, {
      x: clamp(d.x + (e.clientX - d.sx) / d.b.width, 0, 1),
      y: clamp(d.y + (e.clientY - d.sy) / d.b.height, 0, 1),
    });
  };

  const endTextDrag = (e) => {
    textDragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (er) { /* noop */ }
  };

  const addText = (at) => {
    const id = ++textSeq.current;
    setTexts((prev) => [...prev, {
      ...defText(),
      id,
      x: at ? at.x : 0.5,
      y: at ? at.y : clamp(0.5 + prev.length * 0.07, 0, 0.93),
    }]);
    setSelText(id);
    setSel(-1);
    setSelEl(null);
    setLeftTab('text');
    setTimeout(() => { const el = textFieldRef.current; if (el) { el.focus(); el.select(); } }, 40);
  };

  const removeText = (id) => {
    setTexts((prev) => prev.filter((t) => t.id !== id));
    setSelText((cur) => (cur === id ? null : cur));
  };

  const clearAllTexts = () => { setTexts([]); setSelText(null); };

  const patchEl = (id, p) => setEls((prev) => prev.map((el) => (el.id === id ? { ...el, ...p } : el)));

  const addElement = (kind, ref, at) => {
    if (kind === 'text') { addText(at); return; }
    const id = ++elSeq.current;
    const n = els.length;
    const x = at ? at.x : clamp(0.5 + ((n % 5) - 2) * 0.07, 0.08, 0.92);
    const y = at ? at.y : clamp(0.5 + ((n % 5) - 2) * 0.07, 0.08, 0.92);
    setEls((prev) => [...prev, makeElement({ id, kind, ref, x, y })]);
    setSelEl(id);
    setSelText(null);
    setSel(-1);
    setLeftTab('elements');
  };

  const removeEl = (id) => {
    setEls((prev) => prev.filter((el) => el.id !== id));
    setSelEl((cur) => (cur === id ? null : cur));
  };

  const clearAllEls = () => { setEls([]); setSelEl(null); };

  const chooseElPhoto = () => {
    if (selEl == null) return;
    pendingElPhotoRef.current = selEl;
    if (elFileRef.current) { elFileRef.current.value = ''; elFileRef.current.click(); }
  };

  const loadElPhoto = (fileList) => {
    const file = Array.from(fileList || []).find((f) => /^image\//.test(f.type));
    if (!file || pendingElPhotoRef.current == null) return;
    const item = makeItem(file);
    patchEl(pendingElPhotoRef.current, { image: item.el });
  };

  const startElDrag = (el, e) => {
    const b = canvasRef.current.getBoundingClientRect();
    elDragRef.current = { id: el.id, sx: e.clientX, sy: e.clientY, x: el.x, y: el.y, b };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
  };

  const onElDragMove = (e) => {
    const d = elDragRef.current;
    if (!d) return;
    patchEl(d.id, {
      x: clamp(d.x + (e.clientX - d.sx) / d.b.width, 0, 1),
      y: clamp(d.y + (e.clientY - d.sy) / d.b.height, 0, 1),
    });
  };

  const endElDrag = (e) => {
    elDragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (er) { /* noop */ }
  };

  const resetFrame = (i) => setFrames((prev) => {
    const next = prev.slice();
    next[i] = null;
    return next;
  });

  const onDown = (e) => {
    const i = hitSlot(e);
    setSel(i);
    setSelText(null);
    setSelEl(null);
    const it = i >= 0 ? items[i] : null;
    const adj = i >= 0 ? adjusts[i] || {} : {};
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
    // An empty heart has no photo to pan, so dragging it moves the heart itself.
    dragRef.current = (i >= 0 && rects[i].shape === 'heart' && !it)
      ? { i, mode: 'frame', sx: e.clientX, sy: e.clientY, f: frameOf(i), moved: false, has: true }
      : { i, mode: 'photo', sx: e.clientX, sy: e.clientY, sdx: adj.dx || 0, sdy: adj.dy || 0, moved: false, has: !!it };
  };

  const onMove = (e) => {
    const d = dragRef.current;
    if (!d || d.i < 0 || !d.has) return;
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 3) d.moved = true;
    if (!d.moved) return;
    const canvas = canvasRef.current;
    const b = canvas.getBoundingClientRect();
    if (d.mode === 'frame') {
      putFrame(d.i, { ...d.f, fx: d.f.fx + (e.clientX - d.sx) / b.width, fy: d.f.fy + (e.clientY - d.sy) / b.height });
      return;
    }
    const r = rects[d.i];
    const dxf = ((e.clientX - d.sx) / b.width) / (r.w / dims.w);
    const dyf = ((e.clientY - d.sy) / b.height) / (r.h / dims.h);
    setAdjusts((prev) => prev.map((a, k) => (
      k === d.i ? { ...a, dx: clamp(d.sdx + dxf, -1.5, 1.5), dy: clamp(d.sdy + dyf, -1.5, 1.5) } : a
    )));
  };

  const onUp = (e) => {
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (er) { /* noop */ }
  };

  const clearSlot = (i) => {
    setItems((prev) => {
      const next = prev.slice();
      if (next[i]) URL.revokeObjectURL(next[i].url);
      next[i] = null;
      return next;
    });
    setAdjusts((prev) => prev.map((a, k) => (k === i ? defAdj() : a)));
    setSel(-1);
  };

  const clearAll = () => {
    setItems((prev) => {
      prev.forEach((it) => it && URL.revokeObjectURL(it.url));
      return Array.from({ length: tpl.slots }, () => null);
    });
    setAdjusts(Array.from({ length: tpl.slots }, () => defAdj()));
    setSel(-1);
  };

  const setAdjMode = (i, mode) => setAdjusts((prev) => prev.map((a, k) => (k === i ? { ...a, mode } : a)));
  const nudge = (i, ddx, ddy) => setAdjusts((prev) => prev.map((a, k) => (
    k === i ? { ...a, dx: clamp((a.dx || 0) + ddx, -1.5, 1.5), dy: clamp((a.dy || 0) + ddy, -1.5, 1.5) } : a
  )));
  const centerAdj = (i) => setAdjusts((prev) => prev.map((a, k) => (k === i ? { ...a, dx: 0, dy: 0 } : a)));
  const resetAdj = (i) => setAdjusts((prev) => prev.map((a, k) => (k === i ? defAdj() : a)));

  const loadSample = async () => {
    const img = new Image();
    img.src = '/sample-portrait.jpg';
    try { await img.decode(); } catch (e) { /* draw anyway when ready */ }
    setItems((prev) => prev.map(() => ({ kind: 'image', el: img, url: img.src, name: 'sample-portrait.jpg' })));
    setAdjusts((prev) => prev.map((_, i) => ({
      dx: i % 2 ? 0.1 : -0.1,
      dy: i > 1 ? 0.08 : -0.06,
      zoom: 1 + (i % 3) * 0.3,
    })));
    setSel(-1);
  };

  const patchJob = (id, p) => setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...p } : j)));

  const makeJob = (patch) => {
    const id = ++jobSeq.current;
    setJobs((prev) => [{ id, progress: 0, status: 'running', ...patch }, ...prev]);
    return id;
  };

  const removeJob = (j) => {
    if (j.url) URL.revokeObjectURL(j.url);
    setJobs((prev) => prev.filter((x) => x.id !== j.id));
  };

  const cancelJob = (j) => {
    canceledJobs.current.add(j.id);
    const h = jobHandles.current.get(j.id);
    if (h) h();
    setJobs((prev) => prev.map((x) => (x.id === j.id && x.status === 'running' ? { ...x, status: 'canceled' } : x)));
  };

  const exportPng = () => {
    setErr('');
    const name = `collage-${ed.w}x${ed.h}.png`;
    const id = makeJob({ kind: 'png', label: 'Photo PNG', w: ed.w, h: ed.h, name });
    setTimeout(() => {
      try {
        const c = document.createElement('canvas');
        c.width = ed.w; c.height = ed.h;
        paintScene(c.getContext('2d'), ed.w, ed.h, S.current);
        patchJob(id, { progress: 0.55 });
        c.toBlob((blob) => {
          if (canceledJobs.current.has(id)) { patchJob(id, { status: 'canceled' }); return; }
          if (!blob) { patchJob(id, { status: 'error', error: 'PNG encoding failed' }); return; }
          const url = URL.createObjectURL(blob);
          patchJob(id, { status: 'done', progress: 1, url, size: blob.size });
          const a = document.createElement('a');
          a.href = url; a.download = name; a.click();
        }, 'image/png');
      } catch (e) {
        patchJob(id, { status: 'error', error: String(e.message || e) });
      }
    }, 30);
  };

  const exportVideo = () => {
    setErr('');
    try {
      const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
      if (!mime) throw new Error('Video recording is not supported in this browser');
      const c = document.createElement('canvas');
      c.width = ed.w; c.height = ed.h;
      const x = c.getContext('2d');
      paintScene(x, ed.w, ed.h, S.current);
      const stream = c.captureStream(30);
      const bitrate = Math.min(50e6, Math.max(8e6, Math.round(ed.w * ed.h * 30 * 0.12)));
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
      const chunks = [];
      let finishedNaturally = false;
      const durMs = recDur * 1000;
      const name = `collage-${ed.w}x${ed.h}-${recDur}s.webm`;
      const id = makeJob({ kind: 'webm', label: 'Video WebM', w: ed.w, h: ed.h, dur: recDur, name });
      items.forEach((it) => {
        if (it && it.kind === 'video') {
          try { it.el.currentTime = 0; it.el.play().catch(() => {}); } catch (e) { /* noop */ }
        }
      });
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.start(200);
      rec.onstop = () => {
        jobHandles.current.delete(id);
        if (canceledJobs.current.has(id)) { patchJob(id, { status: 'canceled' }); return; }
        if (!finishedNaturally) { patchJob(id, { status: 'error', error: 'Recording stopped early — keep this tab visible while exporting' }); return; }
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        patchJob(id, { status: 'done', progress: 1, url, size: blob.size });
        const a = document.createElement('a');
        a.href = url; a.download = name; a.click();
      };
      const started = Date.now();
      const timer = setInterval(() => {
        paintScene(x, ed.w, ed.h, S.current);
        patchJob(id, { progress: Math.min(0.99, (Date.now() - started) / durMs) });
        if (Date.now() - started >= durMs) {
          finishedNaturally = true;
          clearInterval(timer);
          if (rec.state !== 'inactive') rec.stop();
        }
      }, 1000 / 30);
      jobHandles.current.set(id, () => {
        canceledJobs.current.add(id);
        clearInterval(timer);
        if (rec.state !== 'inactive') rec.stop();
      });
    } catch (e) {
      setErr(String(e.message || e));
    }
  };

  const makeReelPreset = () => {
    setRatioId('9:16');
    setQualityId('uhd');
  };

  const pctStyle = (x, y, w, h) => ({
    left: `${(x / dims.w) * 100}%`,
    top: `${(y / dims.h) * 100}%`,
    width: `${(w / dims.w) * 100}%`,
    height: `${(h / dims.h) * 100}%`,
  });

  const rectsPct = rects.map((r) => {
    const c = r.shape === 'poly' ? polyCentroid(r) : null;
    const left = c ? `${((c.x - r.x) / r.w) * 100}%` : null;
    const top = c ? `${((c.y - r.y) / r.h) * 100}%` : null;
    return {
      shape: r.shape,
      points: r.points,
      style: pctStyle(r.x, r.y, r.w, r.h),
      centroid: c ? { left, top } : null,
      numberStyle: c ? { left, top: `${((c.y - r.y) / r.h) * 100 + 6}%` } : null,
    };
  });

  // The move and resize grips anchor to the square the selected heart actually
  // fills, so they read as part of the shape instead of its invisible cell.
  const selRect = sel >= 0 ? rects[sel] : null;
  const grips = (() => {
    if (!selRect || selRect.shape !== 'heart') return null;
    const sq = heartSquare(selRect);
    const at = (x, y) => ({ left: `${(x / dims.w) * 100}%`, top: `${(y / dims.h) * 100}%` });
    return { move: at(sq.x, sq.y), size: at(sq.x + sq.s, sq.y + sq.s) };
  })();

  const textPct = texts.map((t) => {
    const bx = textBox(t, dims.w, dims.h);
    return { t, style: pctStyle(bx.x, bx.y, bx.w, bx.h) };
  });

  const elementPct = els.map((el) => {
    const bx = elementBox(el, dims.w, dims.h);
    return { el, style: pctStyle(bx.x, bx.y, bx.w, bx.h) };
  });

  const activeSlot = sel >= 0 ? sel : 0;
  const selItem = sel >= 0 ? items[sel] : null;
  const selAdj = sel >= 0 ? adjusts[sel] || {} : (adjusts[0] || {});
  const selMode = selAdj.mode || 'fill';
  const selTextObj = texts.find((t) => t.id === selText) || null;
  const selElObj = els.find((el) => el.id === selEl) || null;
  const selKind = selRect ? (selRect.shape === 'heart' ? 'Heart' : selRect.shape === 'poly' ? 'Segment' : 'Box') : 'Box';

  return (
    <div className={`cj-page ${className}`} style={style}>
      {/* Top Full-Width Hero Banner */}
      <header className="cj-hero">
        <svg className="cj-hero-wave" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M720,160 C910,40 1120,130 1320,20 C1380,-10 1415,15 1440,0 L1440,160 Z" fill="rgba(255,255,255,0.14)" />
          <path d="M920,160 C1080,80 1240,135 1440,35 L1440,160 Z" fill="rgba(255,255,255,0.08)" />
        </svg>

        <div className="cj-hero-left">
          <div className="cj-hero-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="3" ry="3" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
          <div className="cj-hero-copy">
            <h1>Photo &amp; Video Collage Editor</h1>
            <p>Create stunning photo and video collages online for free. Use ready templates, add media, customize and export in high quality.</p>
          </div>
        </div>

        <div className="cj-hero-badges" aria-hidden="true">
          <div className="cj-hero-badge-item">
            <span className="cj-hero-badge-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <span className="cj-hero-badge-text">
              <span>No Signup</span>
              <span>Required</span>
            </span>
          </div>

          <div className="cj-hero-badge-item">
            <span className="cj-hero-badge-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M7 9v6M11 9v6M7 12h4M14 9h2.5a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H14V9z" />
              </svg>
            </span>
            <span className="cj-hero-badge-text">
              <span>Full HD</span>
              <span>Export</span>
            </span>
          </div>

          <div className="cj-hero-badge-item">
            <span className="cj-hero-badge-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            </span>
            <span className="cj-hero-badge-text">
              <span>Video</span>
              <span>Collage</span>
            </span>
          </div>

          <div className="cj-hero-badge-item">
            <span className="cj-hero-badge-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            <span className="cj-hero-badge-text">
              <span>Multiple</span>
              <span>Templates</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Studio Body */}
      <div className="cj-body">
        {/* Left Sidebar: Templates | Media | Text | Elements */}
        <aside className="cj-side cj-leftside">
          <div className="cj-tabs" role="tablist" aria-label="Collage tools">
            <button
              type="button"
              role="tab"
              aria-selected={leftTab === 'templates'}
              className={`cj-tab${leftTab === 'templates' ? ' is-active' : ''}`}
              onClick={() => setLeftTab('templates')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Templates</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={leftTab === 'media'}
              className={`cj-tab${leftTab === 'media' ? ' is-active' : ''}`}
              onClick={() => setLeftTab('media')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="18" x="3" y="3" rx="2.5" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span>Media</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={leftTab === 'text'}
              className={`cj-tab${leftTab === 'text' ? ' is-active' : ''}`}
              onClick={() => setLeftTab('text')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" x2="15" y1="20" y2="20" />
                <line x1="12" x2="12" y1="4" y2="20" />
              </svg>
              <span>Text</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={leftTab === 'elements'}
              className={`cj-tab${leftTab === 'elements' ? ' is-active' : ''}`}
              onClick={() => setLeftTab('elements')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>Elements</span>
            </button>
          </div>

          <div className="cj-sidebody">
            {leftTab === 'templates' && (
              <>
                <div>
                  <div className="cj-subhead-row">
                    <h4 className="cj-subhead-title">Collage Templates</h4>
                    <select
                      className="cj-box-filter"
                      value={boxFilter}
                      onChange={(e) => setBoxFilter(e.target.value)}
                      aria-label="Filter templates by box count"
                    >
                      <option value="all">{tpl.slots} Boxes</option>
                      <option value="1">1 Box</option>
                      <option value="2">2 Boxes</option>
                      <option value="3">3 Boxes</option>
                      <option value="4">4 Boxes</option>
                      <option value="5+">5+ Boxes</option>
                    </select>
                  </div>

                  <div className="cj-tplgrid">
                    {templatesShown.map((t) => {
                      const isOn = tplId === t.id;
                      return (
                        <div key={t.id} className={`cj-tplitem${isOn ? ' is-selected' : ''}`}>
                          <button
                            type="button"
                            className={`cj-tplthumb${isOn ? ' on' : ''}`}
                            title={`${t.label} — ${t.slots} box${t.slots > 1 ? 'es' : ''}`}
                            onClick={() => pickTemplate(t)}
                          >
                            {isOn && (
                              <span className="cj-tplcheck" aria-hidden="true">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                            <span className="cj-tplthumb-inner">
                              <TemplateCells cells={t.cells} />
                            </span>
                          </button>
                          <span className="cj-tplname">{t.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Section title="Wedding story">
                  <div className="cj-tplgrid">
                    {WEDDING_TEMPLATES.map((t) => {
                      const isOn = tplId === t.id;
                      return (
                        <div key={t.id} className={`cj-tplitem${isOn ? ' is-selected' : ''}`}>
                          <button
                            type="button"
                            className={`cj-tplthumb${isOn ? ' on' : ''}`}
                            title={`${t.label} — ${t.slots} box${t.slots > 1 ? 'es' : ''}`}
                            onClick={() => pickTemplate(t)}
                          >
                            {isOn && (
                              <span className="cj-tplcheck" aria-hidden="true">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                            <span className="cj-tplthumb-inner">
                              <TemplateCells cells={t.cells} />
                            </span>
                          </button>
                          <span className="cj-tplname">{t.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="cj-note">Scattered, shard and fan layouts. Fan rings mask each photo into its own wedge; pick a segment on the canvas to fill it.</p>
                </Section>

                <Section title="Premium templates">
                  <div className="cj-chiprow" style={{ marginBottom: 10 }}>
                    <button
                      type="button"
                      className={`cj-chip${premCat === 'all' ? ' on' : ''}`}
                      onClick={() => setPremCat('all')}
                    >All</button>
                    {PREMIUM_CATS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`cj-chip${premCat === c.id ? ' on' : ''}`}
                        onClick={() => setPremCat(c.id)}
                      >{c.label}</button>
                    ))}
                  </div>
                  <div className="cj-tplgrid">
                    {premiumShown.map((t) => {
                      const isOn = tplId === t.id;
                      return (
                        <div key={t.id} className={`cj-tplitem${isOn ? ' is-selected' : ''}`}>
                          <button
                            type="button"
                            className={`cj-tplthumb premium pj-${t.cat}${isOn ? ' on' : ''}`}
                            title={`${t.label} — ${t.slots} box${t.slots > 1 ? 'es' : ''}`}
                            onClick={() => pickPremium(t)}
                          >
                            {isOn && (
                              <span className="cj-tplcheck" aria-hidden="true">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                            )}
                            <span className="cj-tplthumb-inner">
                              <TemplateCells cells={t.cells} />
                            </span>
                          </button>
                          <span className="cj-tplname">{t.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="cj-note">Premium sets apply a matching background and hand-drawn ornaments automatically. Heart sets mask every photo to the heart outline.</p>
                </Section>

                <Section title="Background">
                  <div className="cj-swrow">
                    {BG_SWATCHES.map((c) => (
                      <button key={c} type="button" className={`cj-sw${bg === c ? ' on' : ''}`} style={{ background: c }} title={c} onClick={() => setBg(c)} />
                    ))}
                  </div>
                </Section>
              </>
            )}

            {leftTab === 'media' && (
              <>
                <Section title="Photos & videos">
                  <div className="cj-row">
                    <button type="button" className="cj-btn primary" onClick={() => fillRef.current && fillRef.current.click()}>Add files</button>
                    <button type="button" className="cj-btn" onClick={loadSample}>Try sample</button>
                    <button type="button" className="cj-btn" disabled={!filled} onClick={clearAll}>Clear all</button>
                  </div>
                  <p className="cj-note">{filled}/{tpl.slots} boxes filled. Files go into empty boxes in order — or hover a box and use its + button.</p>
                  {filledNames.length > 0 && <div className="cj-fileinfo" style={{ marginTop: 8 }}>{filledNames.join(', ')}</div>}
                </Section>

                <Section title="Canvas size">
                  <div className="cj-chiprow">
                    {RATIOS.map((r) => (
                      <button key={r.id} type="button" className={`cj-chip${ratioId === r.id ? ' on' : ''}`} onClick={() => setRatioId(r.id)}>
                        {r.id}
                      </button>
                    ))}
                  </div>
                  <div className="cj-sizetag">{dims.w} × {dims.h} px</div>
                </Section>

                <Section title="Background">
                  <div className="cj-swrow">
                    {BG_SWATCHES.map((c) => (
                      <button key={c} type="button" className={`cj-sw${bg === c ? ' on' : ''}`} style={{ background: c }} title={c} onClick={() => setBg(c)} />
                    ))}
                  </div>
                </Section>
              </>
            )}

            {leftTab === 'text' && (
              <Section title="Text">
                <div className="cj-row">
                  <button type="button" className="cj-btn primary" onClick={() => addText()}>+ Add text</button>
                  {texts.length > 0 && (
                    <button type="button" className="cj-btn" onClick={clearAllTexts}>Remove all</button>
                  )}
                </div>
                {texts.length > 0 && (
                  <div className="cj-chiprow" style={{ marginTop: 8 }}>
                    {texts.map((t) => (
                      <button
                        key={t.id} type="button"
                        className={`cj-chip${selText === t.id ? ' on' : ''}`}
                        onClick={() => { setSelText(t.id); setSel(-1); setSelEl(null); }}
                      >{(String(t.text).split('\n')[0] || 'Text').slice(0, 14)}</button>
                    ))}
                  </div>
                )}
                <p className="cj-note">
                  {texts.length
                    ? 'Drag a text layer on the canvas to place it. Text is painted into the exported image and video.'
                    : 'No text layers yet — add one to write over the collage.'}
                </p>
              </Section>
            )}

            {leftTab === 'elements' && (
              <Section title="Elements">
                <AddElementsPanel prefix="cj" onAdd={(kind, ref) => addElement(kind, ref)} />
                {els.length > 0 && (
                  <>
                    <div className="cj-chiprow" style={{ marginTop: 8 }}>
                      {els.map((el) => (
                        <button
                          key={el.id} type="button"
                          className={`cj-chip${selEl === el.id ? ' on' : ''}`}
                          onClick={() => { setSelEl(el.id); setSelText(null); setSel(-1); }}
                        >{elementLabel(el)}</button>
                      ))}
                    </div>
                    <div className="cj-row" style={{ marginTop: 8 }}>
                      <button type="button" className="cj-btn" onClick={clearAllEls}>Remove all elements</button>
                    </div>
                  </>
                )}
              </Section>
            )}

            {selTextObj && (
              <Section title="Edit text">
                <textarea
                  ref={textFieldRef} className="cj-textarea" rows={2} value={selTextObj.text}
                  onChange={(e) => patchText(selTextObj.id, { text: e.target.value })}
                  placeholder="Type your text"
                />
                <div className="cj-fieldRow">
                  <label className="cj-field">
                    <span className="cj-fieldLabel">Font</span>
                    <select
                      className="cj-select" style={{ fontFamily: fontCss(selTextObj.font) }}
                      value={selTextObj.font}
                      onChange={(e) => patchText(selTextObj.id, { font: e.target.value })}
                    >
                      {FONT_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.fonts.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <span className="cj-fontpreview" style={{ fontFamily: fontCss(selTextObj.font) }}>
                      Aa — The quick brown fox
                    </span>
                  </label>
                  <label className="cj-field">
                    <span className="cj-fieldLabel">Font size</span>
                    <input
                      className="cj-input" type="number" min={8} max={220} step={2} value={selTextObj.size}
                      onChange={(e) => patchText(selTextObj.id, { size: clamp(parseInt(e.target.value, 10) || 8, 8, 220) })}
                    />
                  </label>
                </div>
                <div className="cj-fieldRow">
                  <label className="cj-field">
                    <span className="cj-fieldLabel">Colour</span>
                    <span className="cj-colorRow">
                      <input
                        className="cj-colorInput" type="color" value={selTextObj.color}
                        onChange={(e) => patchText(selTextObj.id, { color: e.target.value })}
                      />
                      <span className="cj-hexval">{selTextObj.color}</span>
                    </span>
                  </label>
                  <label className="cj-field">
                    <span className="cj-fieldLabel">Opacity</span>
                    <span className="cj-colorRow">
                      <input
                        className="cj-range" type="range" min={10} max={100} step={1} value={selTextObj.opacity ?? 100}
                        onChange={(e) => patchText(selTextObj.id, { opacity: parseInt(e.target.value, 10) })}
                      />
                      <span className="cj-hexval">{selTextObj.opacity ?? 100}%</span>
                    </span>
                  </label>
                </div>
                <div className="cj-swrow" style={{ marginTop: 8 }}>
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c} type="button" className={`cj-sw${selTextObj.color === c ? ' on' : ''}`}
                      style={{ background: c }} title={c} onClick={() => patchText(selTextObj.id, { color: c })}
                    />
                  ))}
                </div>
                <div className="cj-nudgerow" style={{ marginTop: 8 }}>
                  <button type="button" className="cj-btn" title="Move left" onClick={() => patchText(selTextObj.id, { x: clamp(selTextObj.x - 0.02, 0, 1) })}>←</button>
                  <button type="button" className="cj-btn" title="Centre" onClick={() => patchText(selTextObj.id, { x: 0.5, y: 0.5 })}>⊙</button>
                  <button type="button" className="cj-btn" title="Move right" onClick={() => patchText(selTextObj.id, { x: clamp(selTextObj.x + 0.02, 0, 1) })}>→</button>
                  <button type="button" className="cj-btn" title="Move up" onClick={() => patchText(selTextObj.id, { y: clamp(selTextObj.y - 0.02, 0, 1) })}>↑</button>
                  <button type="button" className="cj-btn" title="Move down" onClick={() => patchText(selTextObj.id, { y: clamp(selTextObj.y + 0.02, 0, 1) })}>↓</button>
                </div>
                <div className="cj-row" style={{ marginTop: 8 }}>
                  <button type="button" className="cj-btn" onClick={() => removeText(selTextObj.id)}>Delete text</button>
                </div>
              </Section>
            )}

            {selElObj && (
              <Section title={`Edit ${elementLabel(selElObj)}`}>
                {elementHasText(selElObj) && (
                  <textarea
                    className="cj-textarea" rows={selElObj.kind === 'banner' ? 1 : 3} value={selElObj.text}
                    onChange={(e) => patchEl(selElObj.id, { text: e.target.value })}
                    placeholder={selElObj.kind === 'banner' ? 'Plate text' : selElObj.kind === 'namecard' ? 'Name\nRole' : 'Name\nPhone\nEmail'}
                  />
                )}
                <div className="cj-fieldRow">
                  <label className="cj-field">
                    <span className="cj-fieldLabel">Colour</span>
                    <span className="cj-colorRow">
                      <input
                        className="cj-colorInput" type="color" value={selElObj.color}
                        onChange={(e) => patchEl(selElObj.id, { color: e.target.value })}
                      />
                      <span className="cj-hexval">{selElObj.color}</span>
                    </span>
                  </label>
                  <label className="cj-field">
                    <span className="cj-fieldLabel">Size</span>
                    <input
                      className="cj-range" type="range" min={10} max={130} step={1}
                      value={Math.round((selElObj.w || 0.4) * 100)}
                      onChange={(e) => patchEl(selElObj.id, { w: clamp(parseInt(e.target.value, 10) / 100, 0.04, 1.6) })}
                    />
                  </label>
                </div>
                {(selElObj.kind === 'banner' || selElObj.kind === 'namecard' || selElObj.kind === 'contactcard') && (
                  <div className="cj-fieldRow">
                    <label className="cj-field">
                      <span className="cj-fieldLabel">Plate</span>
                      <span className="cj-colorRow">
                        <input
                          className="cj-colorInput" type="color" value={selElObj.plate}
                          onChange={(e) => patchEl(selElObj.id, { plate: e.target.value })}
                        />
                        <span className="cj-hexval">{selElObj.plate}</span>
                      </span>
                    </label>
                    {selElObj.kind !== 'banner' && (
                      <label className="cj-field">
                        <span className="cj-fieldLabel">Accent</span>
                        <span className="cj-colorRow">
                          <input
                            className="cj-colorInput" type="color" value={selElObj.accent}
                            onChange={(e) => patchEl(selElObj.id, { accent: e.target.value })}
                          />
                          <span className="cj-hexval">{selElObj.accent}</span>
                        </span>
                      </label>
                    )}
                  </div>
                )}
                {selElObj.kind === 'photo' && (
                  <div className="cj-row" style={{ marginTop: 8 }}>
                    <button type="button" className="cj-btn primary" onClick={chooseElPhoto}>Choose photo</button>
                    {selElObj.image && (
                      <button type="button" className="cj-btn" onClick={() => patchEl(selElObj.id, { image: null })}>Clear photo</button>
                    )}
                  </div>
                )}
                <div className="cj-row" style={{ marginTop: 8 }}>
                  <button type="button" className="cj-btn" onClick={() => removeEl(selElObj.id)}>Delete element</button>
                </div>
                <p className="cj-note">Drag the element on the canvas to move it. Elements are painted into the exported image and video.</p>
              </Section>
            )}

            {sel >= 0 && (
              <Section title={`${selKind} ${sel + 1} — ${selItem ? (selItem.kind === 'video' ? 'video' : 'photo') : 'empty'}`}>
                {selItem && (
                  <>
                    <div className="cj-fitrow">
                      <button type="button" className={`cj-chip${selMode === 'fill' ? ' on' : ''}`} onClick={() => setAdjMode(sel, 'fill')}>Fill box</button>
                      <button type="button" className={`cj-chip${selMode === 'fit' ? ' on' : ''}`} onClick={() => setAdjMode(sel, 'fit')}>Fit whole</button>
                    </div>
                    <div className="cj-sliderRow">
                      <label htmlFor="cj-zoom">Zoom</label>
                      <input
                        id="cj-zoom" type="range" min={1} max={3} step={0.05}
                        value={selAdj.zoom || 1}
                        onChange={(e) => setAdjusts((prev) => prev.map((a, k) => (k === sel ? { ...a, zoom: parseFloat(e.target.value) } : a)))}
                      />
                      <span className="cj-val">{(selAdj.zoom || 1).toFixed(2)}x</span>
                    </div>
                    <div className="cj-nudgerow">
                      <button type="button" className="cj-btn" title="Move left" onClick={() => nudge(sel, -0.06, 0)}>←</button>
                      <button type="button" className="cj-btn" title="Center" onClick={() => centerAdj(sel)}>⊙</button>
                      <button type="button" className="cj-btn" title="Move right" onClick={() => nudge(sel, 0.06, 0)}>→</button>
                      <button type="button" className="cj-btn" title="Move up" onClick={() => nudge(sel, 0, -0.06)}>↑</button>
                      <button type="button" className="cj-btn" title="Move down" onClick={() => nudge(sel, 0, 0.06)}>↓</button>
                    </div>
                  </>
                )}
                {selRect && selRect.shape === 'heart' && (
                  <>
                    <div className="cj-sliderRow">
                      <label htmlFor="cj-heartSize">Size</label>
                      <input
                        id="cj-heartSize" type="range" min={25} max={200} step={1}
                        value={heartPct(sel)}
                        onChange={(e) => scaleHeartTo(sel, parseInt(e.target.value, 10))}
                      />
                      <span className="cj-val">{heartPct(sel)}%</span>
                    </div>
                    <div className="cj-nudgerow">
                      <button type="button" className="cj-btn" title="Move left" onClick={() => moveFrame(sel, -0.02, 0)}>←</button>
                      <button type="button" className="cj-btn" title="Snap back to the template spot" onClick={() => resetFrame(sel)}>⊙</button>
                      <button type="button" className="cj-btn" title="Move right" onClick={() => moveFrame(sel, 0.02, 0)}>→</button>
                      <button type="button" className="cj-btn" title="Move up" onClick={() => moveFrame(sel, 0, -0.02)}>↑</button>
                      <button type="button" className="cj-btn" title="Move down" onClick={() => moveFrame(sel, 0, 0.02)}>↓</button>
                    </div>
                    <p className="cj-note">Drag the ✥ grip to move the heart and the ◢ grip to resize it. Hearts can overlap each other and sit anywhere on the canvas; ⊙ snaps one back to its template spot.</p>
                  </>
                )}
                <div className="cj-row" style={{ marginTop: 8 }}>
                  <button type="button" className="cj-btn" onClick={() => resetAdj(sel)}>Reset position</button>
                  {selItem && <button type="button" className="cj-btn" onClick={() => clearSlot(sel)}>Empty box</button>}
                </div>
                <p className="cj-note">Drag inside the box to reposition. Fill crops edge-to-edge (zoom in to pan), Fit shows the whole photo with free movement.</p>
              </Section>
            )}
          </div>
        </aside>

        {/* Center Column: Top Floating Action Toolbar + Canvas Stage + Bottom Media Strip */}
        <div className="cj-center">
          {/* Top Floating Action Bar */}
          <div className="cj-toolbar" role="toolbar" aria-label="Canvas quick actions">
            <div className="cj-tool-group">
              <button
                type="button"
                className="cj-tool-iconbtn"
                title="Reset active slot position"
                onClick={() => resetAdj(activeSlot)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
              </button>
              <button
                type="button"
                className="cj-tool-iconbtn"
                title="Center active slot"
                onClick={() => centerAdj(activeSlot)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 7v6h-6" />
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                </svg>
              </button>
            </div>

            <div className="cj-tool-group">
              <button
                type="button"
                className={`cj-tool-pill${selMode === 'fill' ? ' is-active' : ''}`}
                onClick={() => setAdjMode(activeSlot, 'fill')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
                <span>Fill</span>
              </button>

              <button
                type="button"
                className={`cj-tool-pill${selMode === 'fit' ? ' is-active' : ''}`}
                onClick={() => setAdjMode(activeSlot, 'fit')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 3" />
                </svg>
                <span>Fit</span>
              </button>

              <button
                type="button"
                className="cj-tool-pill"
                onClick={() => {
                  const curZoom = (adjusts[activeSlot]?.zoom || 1);
                  const nextZoom = curZoom >= 1.8 ? 1 : Number((curZoom + 0.25).toFixed(2));
                  setAdjusts((prev) => prev.map((a, k) => (k === activeSlot ? { ...a, zoom: nextZoom } : a)));
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
                <span>Rotate</span>
              </button>

              <button
                type="button"
                className="cj-tool-pill"
                onClick={() => {
                  setAdjusts((prev) => prev.map((a, k) => (
                    k === activeSlot ? { ...a, dx: -(a.dx || 0), dy: -(a.dy || 0) } : a
                  )));
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 7 5 5-5 5V7" />
                  <path d="m21 7-5 5 5 5V7" />
                  <path d="M12 20v2M12 14v2M12 8v2M12 2v2" />
                </svg>
                <span>Flip</span>
              </button>
            </div>

            <select
              className="cj-toolbar-ratio"
              value={ratioId}
              onChange={(e) => setRatioId(e.target.value)}
              aria-label="Canvas aspect ratio"
            >
              {RATIOS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.w} × {r.h} ({RATIO_DISPLAY_NAMES[r.id] || r.label})
                </option>
              ))}
            </select>
          </div>

          {/* Center Collage Canvas Stage */}
          <main
            className="cj-stage"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const raw = e.dataTransfer.getData('application/x-ts-element');
              if (raw) {
                try {
                  const payload = JSON.parse(raw);
                  const b = canvasRef.current.getBoundingClientRect();
                  addElement(payload.kind, payload.id, {
                    x: clamp((e.clientX - b.left) / b.width, 0, 1),
                    y: clamp((e.clientY - b.top) / b.height, 0, 1),
                  });
                  return;
                } catch (er) { /* fall through to files */ }
              }
              loadFiles(e.dataTransfer.files);
            }}
          >
            <div className="cj-canvasWrap">
              <canvas ref={canvasRef} className="cj-canvas" style={{ aspectRatio: `${dims.w} / ${dims.h}` }} />
              <div className="cj-overlay" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
                {rectsPct.map(({ shape, style, points, centroid, numberStyle }, i) => (
                  <div
                    key={i}
                    role="button"
                    aria-label={`Box ${i + 1}`}
                    className={`cj-slotcell${!items[i] ? ' is-empty' : ''}${shape === 'heart' ? ' shape-heart' : ''}${shape === 'poly' ? ' shape-poly' : ''}${sel === i ? ' sel' : ''}`}
                    style={style}
                  >
                    {shape === 'heart' && (
                      <svg className="cj-slotshape" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                        <path d={HEART_PATH_D} />
                      </svg>
                    )}
                    {shape === 'poly' && (
                      <svg className="cj-slotshape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        <polygon points={points.map(([x, y]) => `${x * 100},${y * 100}`).join(' ')} />
                      </svg>
                    )}
                    {!items[i] && (
                      <button
                        type="button" className="cj-slotadd" title="Add photo / video"
                        style={centroid || undefined}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); openSlotFile(i); }}
                      >
                        <span className="cj-slotadd-circle">+</span>
                        <span className="cj-slotadd-label">Add Photo/Video</span>
                      </button>
                    )}
                    {items[i] && (
                      <button
                        type="button" className="cj-swapbtn" title="Replace"
                        style={centroid || undefined}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); openSlotFile(i); }}
                      >⟳</button>
                    )}
                    {(shape !== 'poly' || items[i]) && <span className="cj-slotnum" style={numberStyle || undefined}>{i + 1}</span>}
                  </div>
                ))}
                {grips && (
                  <React.Fragment>
                    <button
                      type="button" className="cj-grip cj-grip-move" style={grips.move} title="Drag to move this heart"
                      onPointerDown={startFrameDrag(sel, 'move')} onPointerMove={onFrameDragMove}
                      onPointerUp={endFrameDrag} onPointerCancel={endFrameDrag}
                    >✥</button>
                    <button
                      type="button" className="cj-grip cj-grip-size" style={grips.size} title="Drag to resize this heart"
                      onPointerDown={startFrameDrag(sel, 'size')} onPointerMove={onFrameDragMove}
                      onPointerUp={endFrameDrag} onPointerCancel={endFrameDrag}
                    >◢</button>
                  </React.Fragment>
                )}
                {textPct.map(({ t, style }) => (
                  <div
                    key={t.id} role="button" aria-label={`Text layer ${t.text}`}
                    className={`cj-textcell${selText === t.id ? ' sel' : ''}`} style={style}
                    onPointerDown={(e) => { e.stopPropagation(); setSel(-1); setSelText(t.id); setSelEl(null); startTextDrag(t, e); }}
                    onPointerMove={onTextDragMove} onPointerUp={endTextDrag} onPointerCancel={endTextDrag}
                    onDoubleClick={() => { setLeftTab('text'); const el = textFieldRef.current; if (el) { el.focus(); el.select(); } }}
                  />
                ))}
                {elementPct.map(({ el, style }) => (
                  <div
                    key={el.id} role="button" aria-label={`Element ${elementLabel(el)}`}
                    className={`cj-elcell${selEl === el.id ? ' sel' : ''}`} style={style}
                    onPointerDown={(e) => { e.stopPropagation(); setSel(-1); setSelText(null); setSelEl(el.id); startElDrag(el, e); }}
                    onPointerMove={onElDragMove} onPointerUp={endElDrag} onPointerCancel={endElDrag}
                  >
                    <span className="cj-elcell-tag">{elementLabel(el)}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="cj-stage-tip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>Click a box to add media, drag to move, use Fill/Fit, and resize from corner grips.</span>
            </p>
          </main>

          {/* Bottom Media Bar */}
          <div className="cj-media-bar">
            <button
              type="button"
              className="cj-add-media-btn"
              onClick={() => fillRef.current && fillRef.current.click()}
            >
              <span>+</span>
              <span>Add Media</span>
            </button>

            <div className="cj-media-thumbs">
              {SAMPLE_SCENIC_THUMBS.map((scenic, idx) => {
                const userMedia = items[idx];
                return (
                  <button
                    key={scenic.name}
                    type="button"
                    className="cj-media-thumb"
                    title={userMedia ? `Replace ${userMedia.name}` : `Load sample: ${scenic.label}`}
                    onClick={() => {
                      if (userMedia) {
                        openSlotFile(idx);
                      } else {
                        loadScenicThumb(scenic);
                      }
                    }}
                  >
                    {userMedia && userMedia.kind === 'video' ? (
                      <video src={userMedia.url} muted playsInline />
                    ) : (
                      <img src={userMedia ? userMedia.url : scenic.url} alt={userMedia ? userMedia.name : scenic.label} />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="cj-upload-tile-btn"
              onClick={() => fillRef.current && fillRef.current.click()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Export & Save */}
        <aside className="cj-side cj-rightside">
          <div className="cj-sidehead">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            <span>Export &amp; Save</span>
          </div>

          <div className="cj-sidebody">
            <Section title="Quality">
              <div className="cj-quality-grid">
                {QUALITIES.map((q) => {
                  const isOn = qualityId === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      className={`cj-quality-pill${isOn ? ' on' : ''}`}
                      onClick={() => setQualityId(q.id)}
                    >
                      {q.id === 'hd' && isOn && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect width="18" height="18" x="3" y="3" rx="4" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      )}
                      <span>{q.label}</span>
                      {q.id === 'hd' && isOn && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {q.id === 'uhd' && <span className="cj-crown" aria-hidden="true">👑</span>}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Export Size">
              <div className="cj-export-size-box">
                <span className="cj-export-size-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="3" rx="2" />
                    <line x1="8" x2="16" y1="21" y2="21" />
                    <line x1="12" x2="12" y1="17" y2="21" />
                  </svg>
                </span>
                <select
                  className="cj-export-size-select"
                  value={ratioId}
                  onChange={(e) => {
                    if (e.target.value === 'reel-uhd') {
                      makeReelPreset();
                    } else {
                      setRatioId(e.target.value);
                    }
                  }}
                  aria-label="Export size"
                >
                  {RATIOS.map((r) => {
                    const rDims = exportDims(r, quality);
                    return (
                      <option key={r.id} value={r.id}>
                        {rDims.w} × {rDims.h} px ({RATIO_DISPLAY_NAMES[r.id] || r.label})
                      </option>
                    );
                  })}
                  <option value="reel-uhd">Reel preset · 9:16 Ultra HD</option>
                </select>
              </div>
            </Section>

            <Section title="Create">
              <div className="cj-sliderRow">
                <label htmlFor="cj-dur">Length</label>
                <input
                  id="cj-dur" type="range" min={3} max={30} step={1} value={recDur}
                  onChange={(e) => setRecDur(parseInt(e.target.value, 10))}
                />
                <span className="cj-val">{recDur} s</span>
              </div>

              <div className="cj-export-actions">
                <button type="button" className="cj-export-btn is-primary" onClick={exportPng}>
                  <span className="cj-export-btn-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="18" x="3" y="3" rx="2.5" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span>Save Image (PNG)</span>
                  </span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                </button>

                <button type="button" className="cj-export-btn is-secondary" onClick={exportVideo}>
                  <span className="cj-export-btn-left">
                    <span className="cj-export-btn-badge" aria-hidden="true">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="7 4 20 12 7 20 7 4" />
                      </svg>
                    </span>
                    <span>Create Video (WebM)</span>
                  </span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                </button>
              </div>

              <div className="cj-info-callout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <span>
                  Renders at {ed.w} × {ed.h} px · {recDur}s for video. The editor is locked while an export runs — cancel to unlock.
                </span>
              </div>
              {err && <div className="cj-err" style={{ marginTop: 8 }}>{err}</div>}
            </Section>

            {jobs.length > 0 && (
              <Section title={`Exports${runningCount ? ' — 1 running' : ''}`}>
                {jobs.map((j) => (
                  <div key={j.id} className="cj-job">
                    <div className="cj-jobtop">
                      <span>
                        {j.label}
                        {j.status === 'done' && <span className="cj-badge" style={{ marginLeft: 6 }}>done</span>}
                        {j.status === 'canceled' && <span style={{ marginLeft: 6, color: '#8a93a3' }}>canceled</span>}
                        {j.status === 'error' && <span style={{ marginLeft: 6, color: '#b42323' }}>failed</span>}
                      </span>
                      <span className="cj-jobmeta">
                        {j.w}×{j.h}{j.kind === 'webm' ? ` · ${j.dur}s` : ''}
                        {j.status === 'running' && <span className="cj-pct" style={{ marginLeft: 6 }}>{Math.round((j.progress || 0) * 100)}%</span>}
                      </span>
                    </div>
                    {j.status === 'running' && (
                      <div className="cj-bar"><div className="cj-barfill" style={{ width: `${Math.round((j.progress || 0) * 100)}%` }} /></div>
                    )}
                    {j.status === 'error' && <div className="cj-err" style={{ marginTop: 8 }}>{j.error}</div>}
                    {j.status === 'done' && j.url && j.kind === 'webm' && <video className="cj-jobvid" src={j.url} controls />}
                    <div className="cj-jobacts">
                      {j.status === 'running' && <button type="button" className="cj-btn" onClick={() => cancelJob(j)}>Cancel</button>}
                      {j.status === 'done' && j.url && <a className="cj-btn primary" href={j.url} download={j.name}>Download</a>}
                      {j.status !== 'running' && <button type="button" className="cj-btn" onClick={() => removeJob(j)}>Remove</button>}
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </div>
        </aside>
      </div>

      {/* Below-the-Fold SEO Content: Step-by-Step Tutorial & FAQ */}
      <div className="cj-below-fold">
        <section className="cj-tutorial-section" aria-labelledby="cj-how-to-heading">
          <div className="cj-section-header">
            <span className="cj-section-eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
              </svg>
              <span>Quick Step-by-Step Guide</span>
            </span>
            <h2 id="cj-how-to-heading" className="cj-section-title">
              How to Make a Photo &amp; Video Collage Online
            </h2>
            <p className="cj-section-subtitle">
              Combine photos and videos into eye-catching grids, hearts, and social media layouts in four simple steps—completely free and right in your browser.
            </p>
          </div>

          <ol className="cj-tutorial-grid">
            {COLLAGE_TUTORIAL_STEPS.map((item) => (
              <li key={item.step} className="cj-tutorial-card">
                <div className="cj-tutorial-media">
                  <span className="cj-tutorial-badge">{item.badge}</span>
                  <CollageStepIllustration step={item.step} />
                </div>
                <div className="cj-tutorial-content">
                  <h3 className="cj-tutorial-card-title">{item.title}</h3>
                  <p className="cj-tutorial-card-desc">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="cj-faq-section" aria-labelledby="cj-faq-heading">
          <div className="cj-faq-layout">
            <aside className="cj-faq-aside">
              <span className="cj-section-eyebrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                <span>Got Questions?</span>
              </span>
              <h2 id="cj-faq-heading" className="cj-section-title">
                Frequently Asked Questions
              </h2>
              <p className="cj-section-subtitle">
                Everything you need to know about designing custom photo grids and animated video collages on ImgMojo.
              </p>

              <div className="cj-faq-illustration-card" aria-hidden="true">
                <svg viewBox="0 0 320 180" fill="none" className="cj-faq-svg">
                  <rect x="16" y="14" width="288" height="152" rx="18" className="cj-illus-card" />
                  <rect x="34" y="30" width="58" height="54" rx="10" className="cj-illus-slot-active" />
                  <rect x="98" y="30" width="58" height="54" rx="10" className="cj-illus-slot" />
                  <rect x="34" y="92" width="58" height="54" rx="10" className="cj-illus-slot" />
                  <rect x="98" y="92" width="58" height="54" rx="10" className="cj-illus-slot-active" opacity="0.8" />
                  <rect x="174" y="34" width="112" height="30" rx="10" className="cj-illus-pill-active" />
                  <circle cx="190" cy="49" r="6" className="cj-illus-slot-active" />
                  <rect x="204" y="45" width="66" height="8" rx="4" className="cj-illus-bar-brand" />
                  <rect x="174" y="75" width="112" height="30" rx="10" className="cj-illus-pill" />
                  <circle cx="190" cy="90" r="6" className="cj-illus-bar" />
                  <rect x="204" y="86" width="60" height="8" rx="4" className="cj-illus-bar" />
                  <rect x="174" y="116" width="112" height="30" rx="10" className="cj-illus-pill" />
                  <circle cx="190" cy="131" r="6" className="cj-illus-bar" />
                  <rect x="204" y="127" width="54" height="8" rx="4" className="cj-illus-bar" />
                </svg>
                <div className="cj-faq-highlights">
                  <span>✓ 100% Free &amp; No Watermark</span>
                  <span>✓ Photo + Video Support</span>
                  <span>✓ Up to Ultra HD Export</span>
                </div>
              </div>
            </aside>

            <div className="cj-faq-list">
              {COLLAGE_FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.question} className={`cj-faq-item${isOpen ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="cj-faq-question"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    >
                      <span>{item.question}</span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="cj-faq-chevron"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="cj-faq-answer">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <input
        ref={fillRef} type="file" accept="video/*,image/*" multiple style={{ display: 'none' }}
        onChange={(e) => { loadFiles(e.target.files); e.target.value = ''; }}
      />
      <input
        ref={slotFileRef} type="file" accept="video/*,image/*" style={{ display: 'none' }}
        onChange={(e) => { loadFiles(e.target.files, pendingSlotRef.current); e.target.value = ''; }}
      />
      <input
        ref={elFileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { loadElPhoto(e.target.files); e.target.value = ''; }}
      />

      {runningJob && (
        <div className="cj-blocker" role="dialog" aria-modal="true" aria-label="Export in progress">
          <div className="cj-blockcard">
            <div className="cj-blocktitle">Exporting {runningJob.kind === 'webm' ? 'video' : 'image'}…</div>
            <div className="cj-blockmeta">
              {runningJob.label} · {runningJob.w} × {runningJob.h} px{runningJob.kind === 'webm' ? ` · ${runningJob.dur}s` : ''}
            </div>
            <div className="cj-bar"><div className="cj-barfill" style={{ width: `${Math.round((runningJob.progress || 0) * 100)}%` }} /></div>
            <div className="cj-blockrow">
              <span className="cj-pct">{Math.round((runningJob.progress || 0) * 100)}%</span>
              <button type="button" className="cj-btn" onClick={() => cancelJob(runningJob)}>Cancel export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
