import { SHAPE_GEOMETRY } from '../poster/template-studio/data/shapes.js';
import { SOCIALS, socialSvg } from '../poster/template-studio/data/socials.js';
import { contactSvg } from '../poster/template-studio/data/namecards.js';
import { clamp, coverFit, fontCss } from './templates';

const DEFAULT_TEXT = {
  banner: 'YOUR NAME',
  namecard: 'Your Name\nYour Role',
  contactcard: 'Your Name\n+91 90000 00000\nyou@email.com',
};

const DEFAULT_WIDTH = {
  banner: 0.6,
  namecard: 0.56,
  contactcard: 0.62,
  photo: 0.44,
  social: 0.09,
  shape: 0.4,
};

export const ELEMENT_LABELS = {
  banner: 'Name plate',
  namecard: 'Name card',
  contactcard: 'Contact card',
  photo: 'Photo',
  social: 'Social icon',
  shape: 'Shape',
};

export const elementLabel = (el) => {
  if (el.kind === 'social') {
    const social = SOCIALS.find((s) => s.id === el.ref);
    return social ? social.name : 'Social icon';
  }
  if (el.kind === 'shape') return el.ref.charAt(0).toUpperCase() + el.ref.slice(1);
  return ELEMENT_LABELS[el.kind] || 'Element';
};

export const elementHasText = (el) => el.kind === 'banner' || el.kind === 'namecard' || el.kind === 'contactcard';

export function makeElement({ id, kind, ref, x = 0.5, y = 0.5 }) {
  const width = kind === 'shape' && ref === 'line' ? 0.55 : DEFAULT_WIDTH[kind];
  return {
    id,
    kind,
    ref,
    x,
    y,
    w: width ?? 0.4,
    color: '#1c2025',
    plate: '#ffffff',
    accent: '#07864f',
    text: DEFAULT_TEXT[kind] ?? '',
    opacity: 100,
  };
}

/** Element extents in canvas px. Heights follow the width, so ratios stay intact. */
export function elementSize(el, W) {
  const w = clamp(el.w || 0.4, 0.04, 1.6) * W;
  switch (el.kind) {
    case 'banner': return { w, h: w * 0.19 };
    case 'namecard': return { w, h: w * 0.6 };
    case 'contactcard': return { w, h: w * 0.62 };
    default: return { w, h: w };
  }
}

export function elementBox(el, W, H) {
  const { w, h } = elementSize(el, W);
  return { x: el.x * W - w / 2, y: el.y * H - h / 2, w, h };
}

const roundRectPath = (ctx, x, y, w, h, r) => {
  const rr = clamp(r, 0, Math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

const alphaOf = (el) => clamp((el.opacity ?? 100) / 100, 0, 1);

const iconCache = new Map();
function iconImage(id, color) {
  const key = `${id}|${color}`;
  let img = iconCache.get(key);
  if (!img) {
    img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(socialSvg(id, color, 1))}`;
    iconCache.set(key, img);
  }
  return img;
}

const contactCache = new Map();
function contactIcon(kind, color) {
  const key = `${kind}|${color}`;
  let img = contactCache.get(key);
  if (!img) {
    img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(contactSvg(kind, color, 1))}`;
    contactCache.set(key, img);
  }
  return img;
}

const ready = (img) => img && img.complete && img.naturalWidth > 0;

function drawShape(ctx, W, H, el) {
  const geo = SHAPE_GEOMETRY[el.ref] || SHAPE_GEOMETRY.circle;
  const { x, y, w } = elementBox(el, W, H);
  ctx.save();
  ctx.globalAlpha = alphaOf(el);
  ctx.translate(x, y);
  ctx.scale(w / 100, w / 100);
  const path = new Path2D(geo.d);
  if (geo.open) {
    ctx.strokeStyle = el.color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.stroke(path);
  } else {
    ctx.fillStyle = el.color;
    ctx.fill(path);
  }
  ctx.restore();
}

function drawSocial(ctx, W, H, el) {
  const { x, y, w, h } = elementBox(el, W, H);
  const img = iconImage(el.ref || 'x', el.color);
  ctx.save();
  ctx.globalAlpha = alphaOf(el);
  if (ready(img)) {
    ctx.drawImage(img, x, y, w, h);
  } else {
    ctx.fillStyle = el.color;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBanner(ctx, W, H, el) {
  const { x, y, w, h } = elementBox(el, W, H);
  const radius = h * 0.26;
  ctx.save();
  ctx.globalAlpha = alphaOf(el);
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = el.plate;
  ctx.fill();
  ctx.strokeStyle = el.color;
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.stroke();

  const inset = Math.max(2, w * 0.014);
  if (w > inset * 4 && h > inset * 4) {
    roundRectPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, Math.max(0, radius - inset));
    ctx.globalAlpha = alphaOf(el) * 0.55;
    ctx.lineWidth = Math.max(1, w * 0.0025);
    ctx.stroke();
    ctx.globalAlpha = alphaOf(el);
  }

  const px = h * 0.36;
  ctx.font = `700 ${px}px ${fontCss('display')}`;
  ctx.fillStyle = el.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(el.text || '').split('\n')[0].toUpperCase(), x + w / 2, y + h / 2 + px * 0.05, w - h * 0.5);
  ctx.restore();
}

function drawNameCard(ctx, W, H, el) {
  const { x, y, w, h } = elementBox(el, W, H);
  const pad = w * 0.065;
  const [name, role] = String(el.text || '').split('\n');
  const namePx = h * 0.27;
  const rolePx = h * 0.12;
  ctx.save();
  ctx.globalAlpha = alphaOf(el);
  roundRectPath(ctx, x, y, w, h, Math.min(w, h) * 0.09);
  ctx.fillStyle = el.plate;
  ctx.fill();
  ctx.strokeStyle = 'rgba(28,32,37,0.14)';
  ctx.lineWidth = Math.max(1, w * 0.003);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = el.color;
  ctx.font = `700 ${namePx}px ${fontCss('sans')}`;
  ctx.fillText(name || 'Your Name', x + pad, y + pad + namePx, w - pad * 2);
  ctx.fillStyle = el.accent;
  ctx.font = `600 ${rolePx}px ${fontCss('sans')}`;
  ctx.fillText(role || 'Your Role', x + pad, y + pad + namePx + rolePx * 1.8, w - pad * 2);

  const icon = rolePx * 1.5;
  const gap = icon * 0.55;
  let ix = x + pad;
  const iy = y + h - pad - icon;
  ['instagram', 'facebook', 'x'].forEach((id) => {
    const img = iconImage(id, el.accent);
    if (ready(img)) ctx.drawImage(img, ix, iy, icon, icon);
    ix += icon + gap;
  });
  ctx.restore();
}

function drawContactCard(ctx, W, H, el) {
  const { x, y, w, h } = elementBox(el, W, H);
  const pad = w * 0.06;
  const barH = h * 0.29;
  const [name, phone, email] = String(el.text || '').split('\n');
  const namePx = h * 0.19;
  ctx.save();
  ctx.globalAlpha = alphaOf(el);
  roundRectPath(ctx, x, y, w, h, Math.min(w, h) * 0.08);
  ctx.fillStyle = el.plate;
  ctx.fill();
  ctx.strokeStyle = 'rgba(28,32,37,0.14)';
  ctx.lineWidth = Math.max(1, w * 0.003);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = el.color;
  ctx.font = `700 ${namePx}px ${fontCss('sans')}`;
  ctx.fillText(name || 'Your Name', x + pad, y + pad + namePx, w - pad * 2 - h * 0.35);

  const logo = h * 0.2;
  const lx = x + w - pad - logo / 2;
  const ly = y + pad + logo / 2;
  ctx.beginPath();
  ctx.arc(lx, ly, logo / 2, 0, Math.PI * 2);
  ctx.fillStyle = el.accent;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${logo * 0.52}px ${fontCss('sans')}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name || 'A').trim().charAt(0).toUpperCase(), lx, ly + logo * 0.03);

  const barX = x + w * 0.025;
  const barY = y + h - barH - h * 0.03;
  const barW = w - w * 0.05;
  roundRectPath(ctx, barX, barY, barW, barH, Math.min(barW, barH) * 0.16);
  ctx.fillStyle = el.color;
  ctx.fill();

  const rowPx = barH * 0.27;
  const icon = rowPx * 1.2;
  const rowH = barH / 2;
  [[phone || '+91 90000 00000', 'phone'], [email || 'you@email.com', 'email']].forEach(([value, kind], k) => {
    const cy = barY + rowH * (k + 0.5);
    const img = contactIcon(kind, '#ffffff');
    if (ready(img)) ctx.drawImage(img, barX + barW * 0.045, cy - icon / 2, icon, icon);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${rowPx}px ${fontCss('sans')}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, barX + barW * 0.045 + icon * 1.5, cy, barW - icon * 3);
  });
  ctx.restore();
}

function drawPhoto(ctx, W, H, el) {
  const { x, y, w, h } = elementBox(el, W, H);
  const radius = Math.min(w, h) * 0.06;
  const img = el.image;
  ctx.save();
  ctx.globalAlpha = alphaOf(el);
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();
  if (ready(img)) {
    const cf = coverFit(img.naturalWidth, img.naturalHeight, w, h);
    ctx.drawImage(img, x + cf.dx, y + cf.dy, cf.dw, cf.dh);
  } else {
    ctx.fillStyle = '#eef1f6';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#d3dbe4';
    ctx.lineWidth = Math.max(1, w * 0.006);
    const step = Math.max(14, w * 0.09);
    for (let k = -h; k < w; k += step) {
      ctx.beginPath();
      ctx.moveTo(x + k, y + h);
      ctx.lineTo(x + k + h, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#87909a';
    ctx.font = `700 ${Math.max(9, w * 0.055)}px ${fontCss('sans')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PHOTO', x + w / 2, y + h / 2);
  }
  ctx.restore();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, w * 0.018);
  ctx.stroke();
}

const DRAW = {
  shape: drawShape,
  social: drawSocial,
  banner: drawBanner,
  namecard: drawNameCard,
  contactcard: drawContactCard,
  photo: drawPhoto,
};

export function drawElements(ctx, W, H, els) {
  (els || []).forEach((el) => {
    const draw = DRAW[el.kind];
    if (!draw) return;
    ctx.save();
    draw(ctx, W, H, el);
    ctx.restore();
  });
}
