import React, { useEffect, useRef, useState } from 'react';
import {
  TEMPLATES, PREMIUM_TEMPLATES, PREMIUM_CATS, RATIOS, QUALITIES,
  tplById, ratioById, qualityById, exportDims,
  slotRects, coverFit, containFit, clamp,
} from './templates';
import { injectCollageStyles } from './styles';


function rrPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

const BG_SWATCHES = ['#ffffff', '#101418', '#f7f0e4', '#eaf2fd', '#ecf7ef', '#fdeeee'];

const defAdj = () => ({ dx: 0, dy: 0, zoom: 1, mode: 'fill' });

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
  const { tpl: tp, items: its, adjusts: adjs, bg: bgc } = st;
  ctx.fillStyle = bgc;
  ctx.fillRect(0, 0, W, H);
  const rects = slotRects(tp, W, H);
  const rad = Math.min(W, H) * 0.012;
  rects.forEach((r, i) => {
    const it = its[i];
    const adj = adjs[i] || {};
    const mode = adj.mode || 'fill';
    ctx.save();
    rrPath(ctx, r.x, r.y, r.w, r.h, rad);
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
    rrPath(ctx, r.x, r.y, r.w, r.h, rad);
    ctx.strokeStyle = 'rgba(15,23,42,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  if (tp && tp.deco) drawDeco(ctx, W, H, tp.deco);
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

export default function CollageStudio({ className = '', style }) {
  injectCollageStyles();

  const [tplId, setTplId] = useState('grid2x2');
  const [premCat, setPremCat] = useState('all');
  const [ratioId, setRatioId] = useState('4:5');
  const [items, setItems] = useState([null, null, null, null]);
  const [adjusts, setAdjusts] = useState([defAdj(), defAdj(), defAdj(), defAdj()]);
  const [sel, setSel] = useState(-1);
  const [bg, setBg] = useState('#ffffff');
  const [recDur, setRecDur] = useState(5);
  const [qualityId, setQualityId] = useState('hd');
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState('');

  const canvasRef = useRef(null);
  const fillRef = useRef(null);
  const slotFileRef = useRef(null);
  const pendingSlotRef = useRef(-1);
  const dragRef = useRef(null);
  const jobSeq = useRef(0);
  const jobHandles = useRef(new Map());
  const canceledJobs = useRef(new Set());

  const tpl = tplById(tplId);
  const ratio = ratioById(ratioId);
  const quality = qualityById(qualityId);
  const dims = { w: ratio.w, h: ratio.h };
  const ed = exportDims(ratio, quality);
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
  S.current = { tpl, items, adjusts, bg };

  useEffect(() => {
    setItems((prev) => Array.from({ length: tpl.slots }, (_, i) => prev[i] || null));
    setAdjusts((prev) => Array.from({ length: tpl.slots }, (_, i) => prev[i] || defAdj()));
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
    const rects = slotRects(tpl, dims.w, dims.h);
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
    }
    return -1;
  };

  const onDown = (e) => {
    const i = hitSlot(e);
    setSel(i);
    const it = i >= 0 ? items[i] : null;
    const adj = i >= 0 ? adjusts[i] || {} : {};
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) { /* noop */ }
    dragRef.current = { i, sx: e.clientX, sy: e.clientY, sdx: adj.dx || 0, sdy: adj.dy || 0, moved: false, has: !!it };
  };

  const onMove = (e) => {
    const d = dragRef.current;
    if (!d || d.i < 0 || !d.has) return;
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 3) d.moved = true;
    if (!d.moved) return;
    const canvas = canvasRef.current;
    const b = canvas.getBoundingClientRect();
    const r = slotRects(tpl, dims.w, dims.h)[d.i];
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

  const rectsPct = slotRects(tpl, dims.w, dims.h).map((r) => ({
    left: `${(r.x / dims.w) * 100}%`,
    top: `${(r.y / dims.h) * 100}%`,
    width: `${(r.w / dims.w) * 100}%`,
    height: `${(r.h / dims.h) * 100}%`,
  }));

  const selItem = sel >= 0 ? items[sel] : null;
  const selAdj = sel >= 0 ? adjusts[sel] || {} : {};
  const selMode = selAdj.mode || 'fill';

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
                      {t.cells.map(([l, tp, r, b], k) => {
                        const P = 2.2, G = 1.1;
                        const x0 = l <= 0 ? P : l * 100 + G;
                        const x1 = r >= 1 ? 100 - P : r * 100 - G;
                        const y0 = tp <= 0 ? P : tp * 100 + G;
                        const y1 = b >= 1 ? 100 - P : b * 100 - G;
                        return (
                          <span
                            key={k}
                            className="cj-tplcell"
                            style={{ left: `${x0}%`, top: `${y0}%`, width: `${x1 - x0}%`, height: `${y1 - y0}%` }}
                          />
                        );
                      })}
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
                      {t.cells.map(([l, tp, r, b], k) => {
                        const P = 2.2, G = 1.1;
                        const x0 = l <= 0 ? P : l * 100 + G;
                        const x1 = r >= 1 ? 100 - P : r * 100 - G;
                        const y0 = tp <= 0 ? P : tp * 100 + G;
                        const y1 = b >= 1 ? 100 - P : b * 100 - G;
                        return (
                          <span
                            key={k}
                            className="cj-tplcell"
                            style={{ left: `${x0}%`, top: `${y0}%`, width: `${x1 - x0}%`, height: `${y1 - y0}%` }}
                          />
                        );
                      })}
                    </button>
                    <span className="cj-tplname">{t.label}</span>
                  </div>
                ))}
              </div>
              <p className="cj-note">Seasonal sets apply a matching background and hand-drawn frame ornaments automatically.</p>
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

            {sel >= 0 && (
              <Section title={`Box ${sel + 1} — ${selItem ? (selItem.kind === 'video' ? 'video' : 'photo') : 'empty'}`}>
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
              {rectsPct.map((st, i) => (
                <div key={i} role="button" aria-label={`Box ${i + 1}`} className={`cj-slotcell${sel === i ? ' sel' : ''}`} style={st}>
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
            </div>
          </div>
          <p className="cj-note" style={{ marginTop: 10 }}>
            Click a box to select it, drag to move, use Fill/Fit and nudge arrows from the left panel. Drop files anywhere on the canvas.
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
