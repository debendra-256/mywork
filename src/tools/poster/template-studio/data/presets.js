export const ASPECTS = {
  portrait: { ratio: 5 / 7, label: '5 × 7 in' },
  square: { ratio: 1, label: 'Square' },
  story: { ratio: 9 / 16, label: 'Story 9:16' },
  landscape: { ratio: 7 / 5, label: '7 × 5 in' },
  banner: { ratio: 4, label: 'Banner 4 × 1' },
}

export const FONTS = [
  // ── Display / Serif ────────────────────────────────────────────────────────
  { id: 'display',     name: 'Bodoni Display',        stack: "'Bodoni MT', Didot, 'Bodoni 72', 'Playfair Display', Georgia, serif" },
  { id: 'playfair',   name: 'Playfair Display',       stack: "'Playfair Display', 'Palatino Linotype', Georgia, serif" },
  { id: 'cormorant',  name: 'Cormorant Garamond',     stack: "'Cormorant Garamond', 'EB Garamond', Garamond, Georgia, serif" },
  { id: 'ebgaramond', name: 'EB Garamond',            stack: "'EB Garamond', Garamond, 'Times New Roman', serif" },
  { id: 'lora',       name: 'Lora',                   stack: "'Lora', 'Palatino Linotype', Georgia, serif" },
  { id: 'merriweather', name: 'Merriweather',         stack: "'Merriweather', Georgia, 'Times New Roman', serif" },
  { id: 'libre',      name: 'Libre Baskerville',      stack: "'Libre Baskerville', Baskerville, Georgia, serif" },
  { id: 'cinzel',     name: 'Cinzel',                 stack: "'Cinzel', Trajan, 'Times New Roman', serif" },
  { id: 'dm-serif',   name: 'DM Serif Display',       stack: "'DM Serif Display', 'Playfair Display', Georgia, serif" },
  { id: 'spectral',   name: 'Spectral',               stack: "'Spectral', 'Palatino Linotype', Georgia, serif" },
  { id: 'vollkorn',   name: 'Vollkorn',               stack: "'Vollkorn', Georgia, 'Times New Roman', serif" },
  { id: 'alegreya',   name: 'Alegreya',               stack: "'Alegreya', Georgia, 'Times New Roman', serif" },
  { id: 'cardo',      name: 'Cardo',                  stack: "'Cardo', 'Palatino Linotype', Georgia, serif" },
  { id: 'italiana',   name: 'Italiana',               stack: "'Italiana', Didot, Georgia, serif" },
  { id: 'pt-serif',   name: 'PT Serif',               stack: "'PT Serif', Georgia, 'Times New Roman', serif" },
  { id: 'serif',      name: 'Classic Serif',          stack: "Georgia, 'Times New Roman', Times, serif" },
  // ── Sans-serif ────────────────────────────────────────────────────────────
  { id: 'sans',       name: 'Modern Sans',            stack: "'Segoe UI', 'Helvetica Neue', system-ui, -apple-system, sans-serif" },
  { id: 'inter',      name: 'Inter',                  stack: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" },
  { id: 'montserrat', name: 'Montserrat',             stack: "'Montserrat', 'Segoe UI', 'Helvetica Neue', sans-serif" },
  { id: 'raleway',    name: 'Raleway',                stack: "'Raleway', 'Segoe UI', 'Helvetica Neue', sans-serif" },
  { id: 'poppins',    name: 'Poppins',                stack: "'Poppins', 'Segoe UI', 'Helvetica Neue', sans-serif" },
  { id: 'lato',       name: 'Lato',                   stack: "'Lato', 'Segoe UI', 'Helvetica Neue', sans-serif" },
  { id: 'nunito',     name: 'Nunito',                 stack: "'Nunito', 'Segoe UI', 'Helvetica Neue', sans-serif" },
  { id: 'open-sans',  name: 'Open Sans',              stack: "'Open Sans', 'Segoe UI', 'Helvetica Neue', sans-serif" },
  { id: 'josefin',    name: 'Josefin Sans',           stack: "'Josefin Sans', 'Segoe UI', 'Helvetica Neue', sans-serif" },
  { id: 'source-sans', name: 'Source Sans 3',         stack: "'Source Sans 3', 'Source Sans Pro', 'Segoe UI', sans-serif" },
  { id: 'dm-sans',    name: 'DM Sans',                stack: "'DM Sans', 'Segoe UI', system-ui, sans-serif" },
  { id: 'syne',       name: 'Syne',                   stack: "'Syne', 'Segoe UI', system-ui, sans-serif" },
  { id: 'space-grotesk', name: 'Space Grotesk',       stack: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif" },
  { id: 'outfit',     name: 'Outfit',                 stack: "'Outfit', 'Segoe UI', system-ui, sans-serif" },
  { id: 'plus-jakarta', name: 'Plus Jakarta Sans',    stack: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" },
  { id: 'bricolage',  name: 'Bricolage Grotesque',    stack: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif" },
  // ── Script / Handwritten ──────────────────────────────────────────────────
  { id: 'script',     name: 'Script',                 stack: "'Segoe Script', 'Brush Script MT', 'Snell Roundhand', cursive" },
  { id: 'dancing',    name: 'Dancing Script',         stack: "'Dancing Script', 'Segoe Script', 'Brush Script MT', cursive" },
  { id: 'great-vibes', name: 'Great Vibes',           stack: "'Great Vibes', 'Snell Roundhand', 'Brush Script MT', cursive" },
  { id: 'sacramento', name: 'Sacramento',             stack: "'Sacramento', 'Great Vibes', 'Brush Script MT', cursive" },
  { id: 'satisfy',    name: 'Satisfy',                stack: "'Satisfy', 'Segoe Script', 'Brush Script MT', cursive" },
  { id: 'pacifico',   name: 'Pacifico',               stack: "'Pacifico', 'Segoe Script', cursive" },
  { id: 'pinyon',     name: 'Pinyon Script',          stack: "'Pinyon Script', 'Great Vibes', 'Brush Script MT', cursive" },
  { id: 'alex-brush', name: 'Alex Brush',             stack: "'Alex Brush', 'Great Vibes', 'Brush Script MT', cursive" },
  { id: 'petit-formal', name: 'Petit Formal Script',  stack: "'Petit Formal Script', 'Great Vibes', cursive" },
  // ── Monospace ────────────────────────────────────────────────────────────
  { id: 'mono',       name: 'Mono',                   stack: "Consolas, 'Courier New', monospace" },
  { id: 'jetbrains',  name: 'JetBrains Mono',         stack: "'JetBrains Mono', Consolas, 'Courier New', monospace" },
  { id: 'ibm-mono',   name: 'IBM Plex Mono',          stack: "'IBM Plex Mono', 'Courier New', monospace" },
  { id: 'roboto-mono', name: 'Roboto Mono',           stack: "'Roboto Mono', Consolas, 'Courier New', monospace" },
  { id: 'space-mono', name: 'Space Mono',             stack: "'Space Mono', Consolas, 'Courier New', monospace" },
  { id: 'fira-code',  name: 'Fira Code',              stack: "'Fira Code', Consolas, 'Courier New', monospace" },
]

export const fontStack = (id) => (FONTS.find((f) => f.id === id) || FONTS[1]).stack

export const PALETTES = {
  ivory: { name: 'Ivory & Sage', paper: '#f7f2e6', sand: '#ebe1cc', ink: '#303729', accent: '#7c8a63', soft: '#98a085' },
  blush: { name: 'Blush & Clay', paper: '#fdf4f0', sand: '#f5e2d9', ink: '#472f2a', accent: '#bf7f6e', soft: '#cfa694' },
  terracotta: { name: 'Terracotta', paper: '#fbf1e7', sand: '#f1dbc7', ink: '#442a1e', accent: '#b0603c', soft: '#c49174' },
  sage: { name: 'Herb Garden', paper: '#f1f4ea', sand: '#dee6d1', ink: '#2b3428', accent: '#677b50', soft: '#93a37d' },
  sand: { name: 'Golden Sand', paper: '#faf5ec', sand: '#eee0c8', ink: '#3b3325', accent: '#ac8952', soft: '#c0a67f' },
  plum: { name: 'Plum Wine', paper: '#f8f0f2', sand: '#eedbe2', ink: '#3b2230', accent: '#8a4661', soft: '#b98a9c' },
  ocean: { name: 'Sea Glass', paper: '#eff5f4', sand: '#dce9e8', ink: '#1e3437', accent: '#4c7c80', soft: '#8fb0b1' },
  midnight: { name: 'Midnight Blue', paper: '#0f1a2b', sand: '#172842', ink: '#eef2f7', accent: '#a7bdd9', soft: '#7d95b3' },
  noir: { name: 'Noir & Gold', paper: '#141612', sand: '#21251b', ink: '#f4efe2', accent: '#c8a76a', soft: '#9a9c8b' },
  emerald: { name: 'Evergreen', paper: '#f0f5f0', sand: '#dbe8dd', ink: '#1c3225', accent: '#3d6a4e', soft: '#86a68c' },
  festive: { name: 'Marigold', paper: '#fdf3e8', sand: '#f8ddc0', ink: '#492216', accent: '#b33f2c', soft: '#cd8a5e' },
  pastel: { name: 'Soft Pastel', paper: '#fdf8f5', sand: '#f7e6e8', ink: '#4b3440', accent: '#c08497', soft: '#deb6c0' },
  monochrome: { name: 'Ink & Paper', paper: '#f7f7f3', sand: '#e8e8e1', ink: '#232320', accent: '#6a6a60', soft: '#9d9d93' },
  wine: { name: 'Deep Wine', paper: '#f7eff0', sand: '#eed9dc', ink: '#3a1b23', accent: '#7c3042', soft: '#b0808a' },
  teal: { name: 'Deep Teal', paper: '#0e2023', sand: '#163236', ink: '#edf4f2', accent: '#9dc4b8', soft: '#6f9690' },
  tricolor: { name: 'Saffron & Green', paper: '#fff6e6', sand: '#f3ddb4', ink: '#1d241f', accent: '#d97706', soft: '#2f7d4f' },
}

export const paletteColors = (id) => PALETTES[id] || PALETTES.ivory

export const CATEGORIES = [
  { id: 'All', label: 'All templates' },
  { id: 'Wedding', label: 'Wedding' },
  { id: 'Birthday', label: 'Birthday' },
  { id: 'Baby', label: 'Baby & Kids' },
  { id: 'Party', label: 'Party' },
  { id: 'Anniversary', label: 'Anniversary' },
  { id: 'Festival', label: 'Festival' },
  { id: 'Corporate', label: 'Corporate' },
  { id: 'Political', label: 'Political' },
]

export const resolveColor = (doc, color) => {
  if (!color || typeof color !== 'string') return 'transparent'
  if (color === 'none' || color === 'transparent') return color
  if (color.startsWith('#') || color.startsWith('rgb')) return color
  const palette = (doc && doc.colors) ? doc.colors : (PALETTES.monochrome || {})
  return palette[color] || (PALETTES.monochrome && PALETTES.monochrome[color]) || '#333333'
}

const cssUrl = (src) => `url("${String(src).replace(/"/g, '%22')}")`

export function withAlpha(color, alpha) {
  const a = Math.max(0, Math.min(1, Number(alpha) || 0))
  if (typeof color !== 'string') return color
  if (color.startsWith('#')) {
    const hex = color.length === 4
      ? color.slice(1).split('').map((c) => c + c).join('')
      : color.slice(1, 7)
    const num = Number.parseInt(hex, 16)
    if (Number.isNaN(num)) return color
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${a})`
  }
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${a})`)
  return color
}

export const backgroundCss = (doc) => {
  if (doc.bg.type === 'image' && doc.bg.src) {
    const fit = doc.bg.fit === 'contain' ? 'contain' : 'cover'
    const image = `${cssUrl(doc.bg.src)} center / ${fit} no-repeat`
    const shade = Number(doc.bg.overlay) || 0
    if (shade <= 0) return image
    const tint = withAlpha(resolveColor(doc, doc.bg.tint || 'ink'), shade)
    return `linear-gradient(${tint}, ${tint}), ${image}`
  }
  const from = resolveColor(doc, doc.bg.from)
  const to = resolveColor(doc, doc.bg.to)
  if (doc.bg.type === 'solid') return from
  if (doc.bg.type === 'radial') return `radial-gradient(120% 90% at 50% 0%, ${from} 0%, ${to} 100%)`
  return `linear-gradient(${doc.bg.angle || 160}deg, ${from} 0%, ${to} 100%)`
}

