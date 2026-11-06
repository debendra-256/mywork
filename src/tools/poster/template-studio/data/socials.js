const PATHS = {
  x: 'M17.53 3h3.02l-6.6 7.54L21.75 21h-6.08l-4.76-6.22L5.45 21H2.43l7.06-8.07L2.25 3h6.24l4.3 5.69L17.53 3Zm-1.06 16.2h1.67L7.6 4.71H5.8l10.67 14.49Z',
  facebook: 'M13.4 21.5v-8.1h2.72l.41-3.16H13.4V8.22c0-.91.25-1.53 1.56-1.53h1.67V3.85c-.29-.04-1.28-.12-2.44-.12-2.41 0-4.06 1.47-4.06 4.18v2.33H7.4v3.16h2.73v8.1h3.27Z',
}

const instagramShapes = (stroke, fill) =>
  `<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" fill="none" stroke="${stroke}" stroke-width="1.9"/>` +
  `<circle cx="12" cy="12" r="4.1" fill="none" stroke="${stroke}" stroke-width="1.9"/>` +
  `<circle cx="17.1" cy="6.9" r="1.15" fill="${fill}"/>`

const icons = {
  x: `<path d="${PATHS.x}" fill="currentColor"/>`,
  facebook: `<path d="${PATHS.facebook}" fill="currentColor"/>`,
  instagram: instagramShapes('currentColor', 'currentColor'),
}

export const SOCIALS = [
  { id: 'x', name: 'X', label: 'X (Twitter)' },
  { id: 'facebook', name: 'Facebook', label: 'Facebook' },
  { id: 'instagram', name: 'Instagram', label: 'Instagram' },
]

export const socialName = (id) => SOCIALS.find((s) => s.id === id)?.label || 'Social'

export const socialMarkup = (id) => icons[id] || icons.x

export const socialSvg = (id, color = '#1d241f', opacity = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="400" height="400" fill="none" style="color:${color};opacity:${opacity}">${socialMarkup(id)}</svg>`

const IG_BRAND_STOPS = [
  ['0%', '#feda75'],
  ['32%', '#fa7e1e'],
  ['58%', '#d62976'],
  ['80%', '#962fbf'],
  ['100%', '#4f5bd5'],
]

export function isDarkColor(input) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(input || '').trim())
  if (!match) return true
  const hex = match[1].length === 3 ? match[1].split('').map((c) => c + c).join('') : match[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140
}

// Real brand colours. X flips to white on dark bars so it stays legible.
export const brandSocialMarkup = (id, { dark = true, gid = 'ts-brand' } = {}) => {
  if (id === 'facebook') return `<path d="${PATHS.facebook}" fill="#1877F2"/>`
  if (id === 'instagram') {
    const stops = IG_BRAND_STOPS.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join('')
    return `<defs><linearGradient id="${gid}" x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">${stops}</linearGradient></defs>${instagramShapes(`url(#${gid})`, `url(#${gid})`)}`
  }
  return `<path d="${PATHS.x}" fill="${dark ? '#ffffff' : '#0f1419'}"/>`
}

export const brandSocialSvg = (id, opts = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="400" height="400" fill="none">${brandSocialMarkup(id, opts)}</svg>`
