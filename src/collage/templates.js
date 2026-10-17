// Classic collage layout set. Cells are [left, top, right, bottom] in unit
// space; slotRects turns them into neat pixel rects with uniform margins/gutters.

export const RATIOS = [
  { id: '1:1', w: 1080, h: 1080, label: 'Square' },
  { id: '4:5', w: 1080, h: 1350, label: 'Portrait' },
  { id: '3:4', w: 1080, h: 1440, label: 'Classic' },
  { id: '9:16', w: 1080, h: 1920, label: 'Reel' },
  { id: '4:3', w: 1440, h: 1080, label: 'Landscape' },
  { id: '16:9', w: 1920, h: 1080, label: 'Wide' },
];

export const QUALITIES = [
  { id: 'draft', scale: 0.5, label: 'Draft' },
  { id: 'hd', scale: 1, label: 'Full HD' },
  { id: 'uhd', scale: 2, label: 'Ultra HD' },
];

export const qualityById = (id) => QUALITIES.find((q) => q.id === id) || QUALITIES[1];

const even = (v) => Math.round(v / 2) * 2;
export function exportDims(ratio, quality) {
  return { w: even(ratio.w * quality.scale), h: even(ratio.h * quality.scale) };
}

const T = (id, label, cells) => ({ id, label, cells, slots: cells.length });

export const TEMPLATES = [
  T('full', 'Single', [[0, 0, 1, 1]]),
  T('half-v', '2 side by side', [[0, 0, 0.5, 1], [0.5, 0, 1, 1]]),
  T('half-h', '2 stacked', [[0, 0, 1, 0.5], [0, 0.5, 1, 1]]),
  T('left-hero', 'Hero left + 2', [[0, 0, 0.62, 1], [0.62, 0, 1, 0.5], [0.62, 0.5, 1, 1]]),
  T('top-hero', 'Hero top + 2', [[0, 0, 1, 0.55], [0, 0.55, 0.5, 1], [0.5, 0.55, 1, 1]]),
  T('right-hero', 'Hero right + 2', [[0, 0, 0.38, 0.5], [0, 0.5, 0.38, 1], [0.38, 0, 1, 1]]),
  T('cols3', '3 columns', [[0, 0, 1 / 3, 1], [1 / 3, 0, 2 / 3, 1], [2 / 3, 0, 1, 1]]),
  T('rows3', '3 rows', [[0, 0, 1, 1 / 3], [0, 1 / 3, 1, 2 / 3], [0, 2 / 3, 1, 1]]),
  T('grid2x2', '2 x 2 grid', [[0, 0, 0.5, 0.5], [0.5, 0, 1, 0.5], [0, 0.5, 0.5, 1], [0.5, 0.5, 1, 1]]),
  T('left-hero3', 'Hero left + 3', [[0, 0, 0.6, 1], [0.6, 0, 1, 1 / 3], [0.6, 1 / 3, 1, 2 / 3], [0.6, 2 / 3, 1, 1]]),
  T('top-hero3', 'Hero top + 3', [[0, 0, 1, 0.6], [0, 0.6, 1 / 3, 1], [1 / 3, 0.6, 2 / 3, 1], [2 / 3, 0.6, 1, 1]]),
  T('top2-bot3', '2 top + 3', [[0, 0, 0.5, 0.5], [0.5, 0, 1, 0.5], [0, 0.5, 1 / 3, 1], [1 / 3, 0.5, 2 / 3, 1], [2 / 3, 0.5, 1, 1]]),
  T('left-hero4', 'Hero left + 4', [[0, 0, 0.58, 1], [0.58, 0, 0.79, 0.5], [0.79, 0, 1, 0.5], [0.58, 0.5, 0.79, 1], [0.79, 0.5, 1, 1]]),
  T('center-hero', 'Center + 4 corners', [
    [0, 0, 0.28, 0.28], [0.72, 0, 1, 0.28], [0, 0.72, 0.28, 1], [0.72, 0.72, 1, 1],
    [0.24, 0.24, 0.76, 0.76],
  ]),
  T('grid2x3', '2 x 3 grid', [
    [0, 0, 1 / 3, 0.5], [1 / 3, 0, 2 / 3, 0.5], [2 / 3, 0, 1, 0.5],
    [0, 0.5, 1 / 3, 1], [1 / 3, 0.5, 2 / 3, 1], [2 / 3, 0.5, 1, 1],
  ]),
  T('grid3x2', '3 x 2 grid', [
    [0, 0, 0.5, 1 / 3], [0.5, 0, 1, 1 / 3],
    [0, 1 / 3, 0.5, 2 / 3], [0.5, 1 / 3, 1, 2 / 3],
    [0, 2 / 3, 0.5, 1], [0.5, 2 / 3, 1, 1],
  ]),
  T('cols4', '4 columns', [[0, 0, 0.25, 1], [0.25, 0, 0.5, 1], [0.5, 0, 0.75, 1], [0.75, 0, 1, 1]]),
  T('rows4', '4 rows', [[0, 0, 1, 0.25], [0, 0.25, 1, 0.5], [0, 0.5, 1, 0.75], [0, 0.75, 1, 1]]),
  T('top-hero5', 'Hero top + 5', [
    [0, 0, 1, 0.55],
    [0, 0.55, 0.2, 1], [0.2, 0.55, 0.4, 1], [0.4, 0.55, 0.6, 1], [0.6, 0.55, 0.8, 1], [0.8, 0.55, 1, 1],
  ]),
  T('side-strips', 'Side strips', [[0, 0, 0.24, 1], [0.76, 0, 1, 1], [0.24, 0, 0.76, 0.5], [0.24, 0.5, 0.76, 1]]),
];

export const tplById = (id) => TEMPLATES.find((t) => t.id === id)
  || PREMIUM_TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
export const ratioById = (id) => RATIOS.find((r) => r.id === id) || RATIOS[0];

const P = (id, label, cat, bg, deco, cells) => ({ id, label, cat, bg, deco, cells, slots: cells.length });

export const PREMIUM_CATS = [
  { id: 'autumn', label: 'Autumn season' },
  { id: 'christmas', label: 'Christmas' },
  { id: 'fathers', label: "Father's day" },
  { id: 'hearts', label: 'Hearts' },
];

// Original seasonal sets. `bg` is applied on pick; `deco` is a procedural
// frame ornament id rendered by the engine.
export const PREMIUM_TEMPLATES = [
  P('aut-hero', 'Cozy hero', 'autumn', '#fdf3e3', 'autumn', [
    [0, 0, 1, 0.56], [0, 0.56, 0.5, 1], [0.5, 0.56, 1, 1],
  ]),
  P('aut-strip', 'Fall strip', 'autumn', '#fbeeda', 'autumn', [
    [0, 0, 1, 0.34], [0, 0.34, 1, 0.67], [0, 0.67, 1, 1],
  ]),
  P('aut-quad', 'Harvest quad', 'autumn', '#fdf6ea', 'autumn', [
    [0, 0, 0.5, 0.5], [0.5, 0, 1, 0.5], [0, 0.5, 0.5, 1], [0.5, 0.5, 1, 1],
  ]),
  P('aut-column', 'Leafy column', 'autumn', '#fbf1de', 'autumn', [
    [0, 0, 0.3, 1], [0.7, 0, 1, 1], [0.3, 0, 0.7, 0.5], [0.3, 0.5, 0.7, 1],
  ]),
  P('xmas-hero', 'Snowy hero', 'christmas', '#10261c', 'christmas-snow', [
    [0, 0, 1, 0.55], [0, 0.55, 0.5, 1], [0.5, 0.55, 1, 1],
  ]),
  P('xmas-trio', 'Festive trio', 'christmas', '#0f2d22', 'christmas-tree', [
    [0, 0, 1 / 3, 1], [1 / 3, 0, 2 / 3, 1], [2 / 3, 0, 1, 1],
  ]),
  P('xmas-quad', 'Gift quad', 'christmas', '#12291f', 'christmas-garland', [
    [0, 0, 0.5, 0.5], [0.5, 0, 1, 0.5], [0, 0.5, 0.5, 1], [0.5, 0.5, 1, 1],
  ]),
  P('xmas-duo', 'Holiday duo', 'christmas', '#0e2b21', 'christmas-snow', [
    [0, 0, 1, 0.52], [0, 0.52, 1, 1],
  ]),
  P('dad-hero', 'Best Dad hero', 'fathers', '#eef1f6', 'dad-tie', [
    [0, 0, 0.6, 1], [0.6, 0, 1, 0.5], [0.6, 0.5, 1, 1],
  ]),
  P('dad-quad', 'Legend quad', 'fathers', '#e9edf4', 'dad-stars', [
    [0, 0, 0.5, 0.5], [0.5, 0, 1, 0.5], [0, 0.5, 0.5, 1], [0.5, 0.5, 1, 1],
  ]),
  P('dad-strip', 'Dad stripes', 'fathers', '#edf0f6', 'dad-stars', [
    [0, 0, 1, 0.32], [0, 0.32, 1, 0.66], [0, 0.66, 1, 1],
  ]),
  P('dad-mid', 'Super Dad', 'fathers', '#e8ecf3', 'dad-mustache', [
    [0, 0, 0.28, 0.28], [0.72, 0, 1, 0.28], [0, 0.72, 0.28, 1], [0.72, 0.72, 1, 1],
    [0.26, 0.26, 0.74, 0.74],
  ]),
  // Heart set: every cell is masked to the shared heart silhouette, so the
  // boxes below are the shape's bounding box rather than a visible frame.
  P('heart-duo', 'Two hearts', 'hearts', '#fdf3f5', 'love-hearts', [
    [0.03, 0.14, 0.50, 0.61, 'heart'], [0.50, 0.39, 0.97, 0.86, 'heart'],
  ]),
  P('heart-trio', 'Three hearts', 'hearts', '#fff5f6', 'love-hearts', [
    [0.02, 0.03, 0.56, 0.57, 'heart'], [0.56, 0.30, 0.98, 0.72, 'heart'], [0.06, 0.60, 0.44, 0.98, 'heart'],
  ]),
  P('heart-quad', 'Four hearts', 'hearts', '#fceff2', 'love-hearts', [
    [0.02, 0.03, 0.47, 0.48, 'heart'], [0.53, 0.03, 0.98, 0.48, 'heart'],
    [0.02, 0.52, 0.47, 0.97, 'heart'], [0.53, 0.52, 0.98, 0.97, 'heart'],
  ]),
  P('heart-hero', 'Big heart + 2', 'hearts', '#fdf1f4', 'love-hearts', [
    [0.18, 0.02, 0.82, 0.62, 'heart'], [0.04, 0.66, 0.36, 0.98, 'heart'], [0.64, 0.66, 0.96, 0.98, 'heart'],
  ]),
];

/**
 * A slot's pixel rect. `frames` holds hearts the user dragged or resized —
 * stored as canvas fractions so a moved heart survives a ratio switch.
 */
export function slotRects(tpl, W, H, frames) {
  const u = Math.min(W, H) * 0.022;
  const g = u * 0.55;
  return tpl.cells.map(([l, t, r, b, shape], i) => {
    const sh = shape || 'box';
    const f = frames && frames[i];
    if (f && sh === 'heart') {
      return { x: f.fx * W, y: f.fy * H, w: f.fw * W, h: f.fh * H, shape: sh };
    }
    const x0 = l * W + (l <= 0 ? u : g / 2);
    const x1 = r * W - (r >= 1 ? u : g / 2);
    const y0 = t * H + (t <= 0 ? u : g / 2);
    const y1 = b * H - (b >= 1 ? u : g / 2);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, shape: sh };
  });
}

/** Where a slot sits as canvas fractions — the starting point of a drag. */
export const toFrame = (r, W, H) => ({ fx: r.x / W, fy: r.y / H, fw: r.w / W, fh: r.h / H });

/** The square a heart really fills inside its (possibly wide) cell. */
export function heartSquare(r) {
  const s = Math.min(r.w, r.h);
  return { x: r.x + (r.w - s) / 2, y: r.y + (r.h - s) / 2, s };
}

// One heart silhouette shared by every surface: the canvas clip, the editor
// overlay and the picker thumbnails all trace these unit-space curves, so a
// photo can never be masked into a shape that looks like a different one.
const HEART_START = [50, 90];
const HEART_CURVES = [
  [19, 69, 3, 49, 3, 33],
  [3, 17, 15, 8, 27, 8],
  [38, 8, 46, 15, 50, 23],
  [54, 15, 62, 8, 73, 8],
  [85, 8, 97, 17, 97, 33],
  [97, 49, 81, 69, 50, 90],
];

/** Unit-space heart as an SVG path, for the 0 0 100 100 overlay viewBox. */
export const HEART_PATH_D = `M${HEART_START.join(' ')}${HEART_CURVES
  .map((c) => `C${c.join(' ')}`).join('')}Z`;

/** Trace the heart into any 2D path target (canvas context or Path2D) inside the given box. */
export function heartPath(target, x, y, w, h) {
  // Hearts keep their proportions: the curve is inscribed in the largest square
  // the box offers, so a tall cell yields a centred heart rather than a stretched one.
  const s = Math.min(w, h);
  const ox = x + (w - s) / 2;
  const oy = y + (h - s) / 2;
  const px = (v) => ox + (v / 100) * s;
  target.moveTo(px(HEART_START[0]), oy + (HEART_START[1] / 100) * s);
  for (const curve of HEART_CURVES) {
    target.bezierCurveTo(
      px(curve[0]), oy + (curve[1] / 100) * s,
      px(curve[2]), oy + (curve[3] / 100) * s,
      px(curve[4]), oy + (curve[5] / 100) * s,
    );
  }
  target.closePath();
}

/** Trace a slot's outline — rounded box by default, heart where the template asks for one. */
export function slotPath(target, rect, radius) {
  // Path2D starts empty and has no beginPath, so only a context needs clearing.
  if (target.beginPath) target.beginPath();
  if (rect.shape === 'heart') heartPath(target, rect.x, rect.y, rect.w, rect.h);
  else {
    const r = Math.max(0, Math.min(radius, rect.w / 2, rect.h / 2));
    if (target.roundRect) target.roundRect(rect.x, rect.y, rect.w, rect.h, r);
    else {
      const { x, y, w, h } = rect;
      target.moveTo(x + r, y);
      target.arcTo(x + w, y, x + w, y + h, r);
      target.arcTo(x + w, y + h, x, y + h, r);
      target.arcTo(x, y + h, x, y, r);
      target.arcTo(x, y, x + w, y, r);
      target.closePath();
    }
  }
}

export function coverFit(sw, sh, dw, dh) {
  const s = Math.max(dw / sw, dh / sh);
  return { dw: sw * s, dh: sh * s, dx: (dw - sw * s) / 2, dy: (dh - sh * s) / 2 };
}

export function containFit(sw, sh, dw, dh) {
  const s = Math.min(dw / sw, dh / sh);
  return { dw: sw * s, dh: sh * s, dx: (dw - sw * s) / 2, dy: (dh - sh * s) / 2 };
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Text layers. Families are web-safe stacks so the canvas paints exactly what
// the picker offers — no font loading, no preview/export mismatch.
export const TEXT_FONTS = [
  { id: 'sans', label: 'Roboto', css: '"Roboto", "Helvetica Neue", Arial, sans-serif' },
  { id: 'serif', label: 'Georgia', css: 'Georgia, "Times New Roman", serif' },
  { id: 'display', label: 'Impact', css: 'Impact, "Arial Black", Haettenschweiler, sans-serif' },
  { id: 'mono', label: 'Courier', css: '"Courier New", monospace' },
  { id: 'script', label: 'Script', css: '"Segoe Script", "Brush Script MT", cursive' },
];

export const fontCss = (id) => (TEXT_FONTS.find((f) => f.id === id) || TEXT_FONTS[0]).css;

/** A text size is px measured on a 1000 px short side, so layers scale with the canvas. */
export const textPx = (size, W, H) => Math.max(1, ((size || 40) / 1000) * Math.min(W, H));

export const TEXT_COLORS = ['#1c2025', '#ffffff', '#0a9f62', '#e07a92', '#b8860b', '#33415c'];
