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
];

export function slotRects(tpl, W, H) {
  const u = Math.min(W, H) * 0.022;
  const g = u * 0.55;
  return tpl.cells.map(([l, t, r, b]) => {
    const x0 = l * W + (l <= 0 ? u : g / 2);
    const x1 = r * W - (r >= 1 ? u : g / 2);
    const y0 = t * H + (t <= 0 ? u : g / 2);
    const y1 = b * H - (b >= 1 ? u : g / 2);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  });
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
