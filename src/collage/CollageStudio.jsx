import React, { useEffect, useRef, useState } from 'react';
import {
  TEMPLATES, PREMIUM_TEMPLATES, PREMIUM_CATS, RATIOS, QUALITIES,
  tplById, ratioById, qualityById, exportDims,
  slotRects, slotPath, heartPath, heartSquare, toFrame, HEART_PATH_D,
  coverFit, containFit, clamp, TEXT_FONTS, TEXT_COLORS, fontCss, textPx,
} from './templates';
import { injectCollageStyles } from './styles';

const BG_SWATCHES = ['#ffffff', '#101418', '#f7f0e4', '#eaf2fd', '#ecf7ef', '#fdeeee'];

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
  return cells.map(([l, tp, r, b, shape], k) => {
    const P = 2.2, G = 1.1;
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
  const [recDur, setRecDur] = useState(5);
  const [qualityId, setQualityId] = useState('hd');
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState('');

  const canvasRef = useRef(null);
  const fillRef = useRef(null);
  const slotFileRef = useRef(null);
  const textFieldRef = useRef(null);
  const pendingSlotRef = useRef(-1);
  const dragRef = useRef(null);
  const frameDragRef = useRef(null);
  const textDragRef = useRef(null);
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

  const pickPremium = (t) => {
    setTplId(t.id);
    setBg(t.bg);
    setSel(-1);
  };

  const S = useRef({});
  S.current = { tpl, items, adjusts, bg, frames, texts };

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
      if (r.shape !== 'heart') return i;
      // A heart owns only its silhouette, so the empty corners fall through to
      // whatever box sits behind them.
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

  const addText = () => {
    const id = ++textSeq.current;
    setTexts((prev) => [...prev, { ...defText(), id, y: clamp(0.5 + prev.length * 0.07, 0, 0.93) }]);
    setSelText(id);
    setSel(-1);
    setTimeout(() => { const el = textFieldRef.current; if (el) { el.focus(); el.select(); } }, 40);
  };

  const removeText = (id) => {
    setTexts((prev) => prev.filter((t) => t.id !== id));
    setSelText((cur) => (cur === id ? null : cur));
  };

  const clearAllTexts = () => { setTexts([]); setSelText(null); };

  const resetFrame = (i) => setFrames((prev) => {
    const next = prev.slice();
    next[i] = null;
    return next;
  });

  const onDown = (e) => {
    const i = hitSlot(e);
    setSel(i);
    setSelText(null);
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

  const rectsPct = rects.map((r) => ({ shape: r.shape, style: pctStyle(r.x, r.y, r.w, r.h) }));

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

  const selItem = sel >= 0 ? items[sel] : null;
  const selAdj = sel >= 0 ? adjusts[sel] || {} : {};
  const selMode = selAdj.mode || 'fill';
  const selTextObj = texts.find((t) => t.id === selText) || null;

  return (
    <div className={`cj-page ${className}`} style={style}>
      <div className="cj-body">
        <aside className="cj-side">
          <div className="cj-sidehead">Collage editor</div>
          <div className="cj-sidebody">
            <Section title={`Templates (${tpl.slots} box${tpl.slots > 1 ? 'es' : ''})`}>
              <div className="cj-tplgrid">
                {TEMPLATES.map((t) => (
                  <div key={t.id}>
                    <button
                      type="button"
                      className={`cj-tplthumb${tplId === t.id ? ' on' : ''}`}
                      title={`${t.label} — ${t.slots} box${t.slots > 1 ? 'es' : ''}`}
                      onClick={() => setTplId(t.id)}
                    >
                      <TemplateCells cells={t.cells} />
                    </button>
                    <span className="cj-tplname">{t.label}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Premium templates">
              <div className="cj-chiprow">
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
                {premiumShown.map((t) => (
                  <div key={t.id}>
                    <button
                      type="button"
                      className={`cj-tplthumb premium pj-${t.cat}${tplId === t.id ? ' on' : ''}`}
                      title={`${t.label} — ${t.slots} box${t.slots > 1 ? 'es' : ''}`}
                      onClick={() => pickPremium(t)}
                    >
                      <TemplateCells cells={t.cells} />
                    </button>
                    <span className="cj-tplname">{t.label}</span>
                  </div>
                ))}
              </div>
              <p className="cj-note">Premium sets apply a matching background and hand-drawn ornaments automatically. Heart sets mask every photo to the heart outline.</p>
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

            <Section title="Photos & videos">
              <div className="cj-row">
                <button type="button" className="cj-btn primary" onClick={() => fillRef.current && fillRef.current.click()}>Add files</button>
                <button type="button" className="cj-btn" onClick={loadSample}>Try sample</button>
                <button type="button" className="cj-btn" disabled={!filled} onClick={clearAll}>Clear all</button>
              </div>
              <p className="cj-note">{filled}/{tpl.slots} boxes filled. Files go into empty boxes in order — or hover a box and use its + button.</p>
              {filledNames.length > 0 && <div className="cj-fileinfo" style={{ marginTop: 8 }}>{filledNames.join(', ')}</div>}
            </Section>

            <Section title="Text">
              <div className="cj-row">
                <button type="button" className="cj-btn primary" onClick={addText}>+ Add text</button>
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
                      onClick={() => { setSelText(t.id); setSel(-1); }}
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
                      {TEXT_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
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

            {sel >= 0 && (
              <Section title={`${selRect && selRect.shape === 'heart' ? 'Heart' : 'Box'} ${sel + 1} — ${selItem ? (selItem.kind === 'video' ? 'video' : 'photo') : 'empty'}`}>
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

        <main
          className="cj-stage"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); loadFiles(e.dataTransfer.files); }}
        >
          <div className="cj-canvasWrap">
            <canvas ref={canvasRef} className="cj-canvas" style={{ aspectRatio: `${dims.w} / ${dims.h}` }} />
            <div className="cj-overlay" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
              {rectsPct.map(({ shape, style }, i) => (
                <div key={i} role="button" aria-label={`Box ${i + 1}`} className={`cj-slotcell${shape === 'heart' ? ' shape-heart' : ''}${sel === i ? ' sel' : ''}`} style={style}>
                  {shape === 'heart' && (
                    <svg className="cj-slotshape" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                      <path d={HEART_PATH_D} />
                    </svg>
                  )}
                  {!items[i] && (
                    <button
                      type="button" className="cj-slotadd" title="Add photo / video"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); openSlotFile(i); }}
                    >+</button>
                  )}
                  {items[i] && (
                    <button
                      type="button" className="cj-swapbtn" title="Replace"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); openSlotFile(i); }}
                    >⟳</button>
                  )}
                  <span className="cj-slotnum">{i + 1}</span>
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
                  onPointerDown={(e) => { e.stopPropagation(); setSel(-1); setSelText(t.id); startTextDrag(t, e); }}
                  onPointerMove={onTextDragMove} onPointerUp={endTextDrag} onPointerCancel={endTextDrag}
                  onDoubleClick={() => { const el = textFieldRef.current; if (el) { el.focus(); el.select(); } }}
                />
              ))}
            </div>
          </div>
          <p className="cj-note" style={{ marginTop: 10 }}>
            Click a box to select it, drag to move, use Fill/Fit and nudge arrows from the left panel. Select a heart to drag or resize it with its corner grips. Add text from the left panel, then drag it into place. Drop files anywhere on the canvas.
          </p>
        </main>

        <aside className="cj-side cj-rightside">
          <div className="cj-sidehead">Export &amp; saves</div>
          <div className="cj-sidebody">
            <Section title="Quality">
              <div className="cj-chiprow">
                {QUALITIES.map((q) => (
                  <button key={q.id} type="button" className={`cj-chip${qualityId === q.id ? ' on' : ''}`} onClick={() => setQualityId(q.id)}>
                    {q.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Export size">
              <div className="cj-sizetag">Export size — {ed.w} × {ed.h} px</div>
              <div className="cj-row" style={{ marginTop: 8 }}>
                <button type="button" className="cj-btn" onClick={makeReelPreset}>Reel preset · 9:16 Ultra HD</button>
              </div>
            </Section>

            <Section title="Create">
              <div className="cj-sliderRow">
                <label htmlFor="cj-dur">Length</label>
                <input
                  id="cj-dur" type="range" min={3} max={30} step={1} value={recDur}
                  onChange={(e) => setRecDur(parseInt(e.target.value, 10))}
                />
                <span className="cj-val">{recDur}s</span>
              </div>
              <div className="cj-row" style={{ marginTop: 8 }}>
                <button type="button" className="cj-btn primary" onClick={exportPng}>Save image (PNG)</button>
                <button type="button" className="cj-btn" onClick={exportVideo}>Create video (WebM)</button>
              </div>
              <p className="cj-note">Renders at {ed.w}×{ed.h} px{` · ${recDur}s`} for video. The editor is locked while an export runs — cancel to unlock.</p>
              {err && <div className="cj-err" style={{ marginTop: 8 }}>{err}</div>}
            </Section>

            <Section title={`Exports${runningCount ? ' — 1 running' : ''}`}>
              {!jobs.length && <p className="cj-note">Nothing exported yet. PNG and video jobs appear here with percent progress, cancel and download.</p>}
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
          </div>
        </aside>
      </div>

      <input
        ref={fillRef} type="file" accept="video/*,image/*" multiple style={{ display: 'none' }}
        onChange={(e) => { loadFiles(e.target.files); e.target.value = ''; }}
      />
      <input
        ref={slotFileRef} type="file" accept="video/*,image/*" style={{ display: 'none' }}
        onChange={(e) => { loadFiles(e.target.files, pendingSlotRef.current); e.target.value = ''; }}
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
