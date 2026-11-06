const leaf = (x, y, rotate, scale = 1, opacity = 0.14) =>
  `<path d="M0 0C-8 -6 -12 -16 -10 -26C-1 -22 4 -13 0 0Z" transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" fill="currentColor" fill-opacity="${opacity}" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>`

const sparkle = (x, y, s = 1, opacity = 1) =>
  `<path d="M0 -14C1.4 -4 4 -1.4 14 0C4 1.4 1.4 4 0 14C-1.4 4 -4 1.4 -14 0C-4 -1.4 -1.4 -4 0 -14Z" transform="translate(${x} ${y}) scale(${s})" fill="currentColor" opacity="${opacity}"/>`

const wreathLeaves = () => {
  const items = []
  for (let a = 18; a <= 342; a += 17) {
    if (a > 78 && a < 102) continue
    if (a > 258 && a < 282) continue
    const rad = (a * Math.PI) / 180
    const x = 100 + Math.cos(rad) * 62
    const y = 100 + Math.sin(rad) * 62
    items.push(leaf(x.toFixed(1), y.toFixed(1), (a + 90).toFixed(0), 0.92, 0.13))
  }
  return items.join('')
}

const eucalyptusLeaves = () => {
  const spots = [
    [96, 176, -18, 15, 9],
    [108, 158, 16, 16, 9.5],
    [92, 140, -22, 15, 9],
    [110, 122, 20, 16, 9.5],
    [96, 104, -24, 14, 8.5],
    [112, 86, 24, 15, 9],
    [100, 68, -26, 13, 8],
    [116, 50, 26, 13, 8],
  ]
  return spots
    .map(
      ([x, y, r, rx, ry]) =>
        `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="1"/>`
    )
    .join('')
}

const ornaments = {
  floralCorner: `
    <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 188C24 132 52 92 104 68" stroke-width="1.6" opacity=".9"/>
      <path d="M34 152c-22-4-34-22-30-42 20 2 34 20 30 42Z" fill="currentColor" fill-opacity=".12" stroke-width="1.1"/>
      <path d="M58 118c-20-12-24-34-14-52 18 10 24 32 14 52Z" fill="currentColor" fill-opacity=".12" stroke-width="1.1"/>
      <path d="M84 90c-8-22 0-44 18-56 6 20-2 42-18 56Z" fill="currentColor" fill-opacity=".12" stroke-width="1.1"/>
      <circle cx="112" cy="62" r="11" stroke-width="1.2"/>
      <circle cx="112" cy="62" r="3.4" fill="currentColor" stroke="none"/>
      <circle cx="129" cy="46" r="2.6" fill="currentColor" stroke="none"/>
      <circle cx="95" cy="43" r="2.1" fill="currentColor" stroke="none"/>
      <path d="M98 76c10-7 22-7 32 0" stroke-width="1"/>
      <circle cx="132" cy="84" r="1.8" fill="currentColor" stroke="none"/>
    </g>`,
  sprig: `
    <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M100 190C97 140 100 90 108 18" stroke-width="1.4"/>
      ${leaf(98, 168, -46, 1)}
      ${leaf(102, 146, 138, 1.05)}
      ${leaf(99, 124, -44, 1.1)}
      ${leaf(103, 102, 142, 1.05)}
      ${leaf(101, 80, -40, 1)}
      ${leaf(105, 58, 148, 0.95)}
      ${leaf(105, 39, -34, 0.85)}
      <circle cx="108" cy="21" r="3" fill="currentColor" stroke="none"/>
    </g>`,
  eucalyptus: `
    <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M100 192C94 148 98 94 118 26" stroke-width="1.4"/>
      ${eucalyptusLeaves()}
    </g>`,
  wreath: `
    <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="100" cy="100" r="62" stroke-width=".8" opacity=".35"/>
      ${wreathLeaves()}
      <circle cx="100" cy="29" r="2.4" fill="currentColor" stroke="none"/>
    </g>`,
  deco: `
    <g stroke="currentColor" fill="none" stroke-width="1.1" stroke-linejoin="round">
      <path d="M8 86V8h78"/>
      <path d="M20 86V20h66"/>
      <path d="M8 98v12M98 8h12" opacity=".7"/>
      <path d="M34 34l11-11 11 11-11 11z" fill="currentColor" fill-opacity=".14"/>
      <path d="M8 112c20 0 32 10 34 30" opacity=".55"/>
      <path d="M112 8c0 20 10 32 30 34" opacity=".55"/>
    </g>`,
  sunburst: `
    <g stroke="currentColor" stroke-linecap="round">
      <path d="M100 24v30M62 34l13 27M138 34l-13 27M32 58l23 19M168 58l-23 19M16 94h31M184 94h-31" stroke-width="1.4"/>
      <path d="M54 156a50 50 0 0192 0" stroke-width="1.2"/>
      <path d="M68 156a36 36 0 0164 0" stroke-width="1" opacity=".55"/>
      <path d="M82 156a22 22 0 0136 0" stroke-width="1" opacity=".4"/>
      <circle cx="100" cy="156" r="3" fill="currentColor" stroke="none"/>
    </g>`,
  stars: `
    ${sparkle(100, 72, 1.5, 0.95)}
    ${sparkle(46, 96, 0.7, 0.6)}
    ${sparkle(152, 112, 0.9, 0.75)}
    ${sparkle(112, 146, 0.5, 0.5)}
    ${sparkle(66, 40, 0.4, 0.45)}`,
  dots: `
    <g fill="currentColor">
      <circle cx="64" cy="100" r="3"/>
      <circle cx="84" cy="100" r="1.7" opacity=".55"/>
      <circle cx="100" cy="100" r="3.6"/>
      <circle cx="116" cy="100" r="1.7" opacity=".55"/>
      <circle cx="136" cy="100" r="3"/>
    </g>`,
  heart: `
    <g stroke="currentColor" fill="none" stroke-linecap="round">
      <path d="M100 142C68 121 51 101 51 81a26 26 0 0150-14 26 26 0 0150 14c0 20-17 40-51 61Z" stroke-width="1.3"/>
      <path d="M100 54c-4 8-9 11-17 12 8 2 12 6 14 14 2-8 6-12 14-14-8-1-11-4-11-12Z" fill="currentColor" fill-opacity=".18" stroke="none"/>
      ${sparkle(37, 58, 0.42, 0.55)}
      ${sparkle(165, 74, 0.55, 0.6)}
    </g>`,
  pine: `
    <g fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round">
      <path d="M100 20L122 58h-12l22 34h-14l22 34H60l22-34H68l22-34H78z"/>
      <path d="M100 20L122 58h-12l22 34h-14l22 34H60l22-34H68l22-34H78z" transform="translate(-54 48) scale(.55)"/>
      <path d="M100 20L122 58h-12l22 34h-14l22 34H60l22-34H68l22-34H78z" transform="translate(54 48) scale(.55)"/>
      <path d="M100 146v24" stroke-width="1.6"/>
      <path d="M82 182h36" stroke-width="1.2" opacity=".6"/>
    </g>`,
  rings: `
    <g stroke="currentColor" fill="none">
      <circle cx="84" cy="106" r="31" stroke-width="1.5"/>
      <circle cx="116" cy="106" r="31" stroke-width="1.5"/>
      <path d="M100 56l7 9-7 9-7-9z" fill="currentColor" fill-opacity=".25" stroke-width="1"/>
      <path d="M74 88c4-7 11-11 19-12M126 88c-4-7-11-11-19-12" stroke-width=".9" opacity=".5"/>
    </g>`,
  diya: `
    <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <path d="M100 40c-12 15-11 32 0 45 11-13 12-30 0-45Z" fill="currentColor" fill-opacity=".85" stroke="none"/>
      <path d="M100 55c-5 8-4 17 0 23 4-6 5-15 0-23Z" fill="#fff" fill-opacity=".6" stroke="none"/>
      <path d="M48 118h104c-5 27-24 44-52 44s-47-17-52-44Z" fill="currentColor" fill-opacity=".16" stroke-width="1.8"/>
      <path d="M64 118c6 17 19 26 36 26s30-9 36-26" stroke-width="1.1" opacity=".7"/>
      <path d="M38 110c22 7 102 7 124 0" stroke-width="2" opacity=".9"/>
      <path d="M100 98v-4" stroke-width="1.6"/>
    </g>`,
  lotus: `
    <g stroke="currentColor" fill="currentColor" fill-opacity=".1" stroke-linejoin="round">
      <path d="M100 152C86 122 86 72 100 40C114 72 114 122 100 152Z" stroke-width="1.2"/>
      <path d="M100 152C86 122 86 72 100 40C114 72 114 122 100 152Z" transform="rotate(26 100 152)" stroke-width="1.1"/>
      <path d="M100 152C86 122 86 72 100 40C114 72 114 122 100 152Z" transform="rotate(-26 100 152)" stroke-width="1.1"/>
      <path d="M100 152C86 122 86 72 100 40C114 72 114 122 100 152Z" transform="rotate(50 100 152)" stroke-width="1" opacity=".85"/>
      <path d="M100 152C86 122 86 72 100 40C114 72 114 122 100 152Z" transform="rotate(-50 100 152)" stroke-width="1" opacity=".85"/>
      <path d="M56 158c28-8 60-8 88 0" stroke-width="1.2" fill="none"/>
      <circle cx="100" cy="164" r="2.6" fill="currentColor" stroke="none"/>
    </g>`,
}

export const ORNAMENTS = [
  { id: 'floralCorner', name: 'Floral corner' },
  { id: 'sprig', name: 'Botanical sprig' },
  { id: 'eucalyptus', name: 'Eucalyptus' },
  { id: 'wreath', name: 'Laurel wreath' },
  { id: 'dots', name: 'Dot divider' },
  { id: 'deco', name: 'Art deco' },
  { id: 'sunburst', name: 'Sunburst' },
  { id: 'stars', name: 'Sparkles' },
  { id: 'heart', name: 'Heart' },
  { id: 'rings', name: 'Rings' },
  { id: 'pine', name: 'Pines' },
  { id: 'lotus', name: 'Lotus' },
  { id: 'diya', name: 'Diya' },
]

export const ornamentMarkup = (id) => ornaments[id] || ornaments.sprig

export const ornamentSvg = (id, color = '#b08d57', opacity = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400" fill="none" style="color:${color};opacity:${opacity}">${ornamentMarkup(id)}</svg>`
