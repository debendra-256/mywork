const polar = (count, radius, inner, cx = 50, cy = 50, rotation = -Math.PI / 2) => {
  const points = []
  const step = (Math.PI * 2) / count
  for (let i = 0; i < count; i++) {
    const r = inner != null && i % 2 ? inner : radius
    const angle = rotation + i * step
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${points.join(' L')} Z`
}

const seal = (teeth, radius, depth) => {
  const points = []
  const step = (Math.PI * 2) / (teeth * 2)
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 ? depth : radius
    const angle = -Math.PI / 2 + i * step
    points.push(`${(50 + r * Math.cos(angle)).toFixed(2)} ${(50 + r * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${points.join(' L')} Z`
}

export const SHAPE_GEOMETRY = {
  line: { d: 'M2 50 L98 50', open: true },
  curve: { d: 'M3 82 C 26 18, 74 18, 97 68', open: true },
  rect: { d: 'M4 4 H96 V96 H4 Z' },
  rounded: { d: 'M16 4 H84 A12 12 0 0 1 96 16 V84 A12 12 0 0 1 84 96 H16 A12 12 0 0 1 4 84 V16 A12 12 0 0 1 16 4 Z' },
  circle: { d: 'M2 50 A48 48 0 1 0 98 50 A48 48 0 1 0 2 50 Z' },
  arch: { d: 'M4 96 V50 A46 46 0 0 1 96 50 V96 Z' },
  triangle: { d: 'M50 4 L96 94 H4 Z' },
  diamond: { d: 'M50 2 L98 50 L50 98 L2 50 Z' },
  pentagon: { d: polar(5, 48) },
  hexagon: { d: polar(6, 48) },
  arrow: { d: 'M2 36 H62 V10 L98 50 L62 90 V64 H2 Z' },
  arrowLeft: { d: 'M98 36 H38 V10 L2 50 L38 90 V64 H98 Z' },
  arrowUp: { d: 'M36 98 V38 H10 L50 2 L90 38 H64 V98 Z' },
  star: { d: polar(5, 48, 20) },
  sparkle: { d: 'M50 2 C 55 33, 67 45, 98 50 C 67 55, 55 67, 50 98 C 45 67, 33 55, 2 50 C 33 45, 45 33, 50 2 Z' },
  bubble: { d: 'M16 6 H84 A12 12 0 0 1 96 18 V60 A12 12 0 0 1 84 72 H46 L26 94 L30 72 H16 A12 12 0 0 1 4 60 V18 A12 12 0 0 1 16 6 Z' },
  badge: { d: seal(12, 48, 41) },
}

const CSS_SHAPES = new Set(['line', 'rect', 'rounded', 'circle', 'arch'])

export const isPathShape = (shape) => !!SHAPE_GEOMETRY[shape] && !CSS_SHAPES.has(shape)

export const SHAPE_TOOLS = [
  { id: 'line', label: 'Line', title: 'Line' },
  { id: 'curve', label: 'Curve', title: 'Curve' },
  { id: 'circle', label: 'Circle', title: 'Circle' },
  { id: 'rect', label: 'Square', title: 'Square' },
  { id: 'rounded', label: 'Rounded', title: 'Rounded square' },
  { id: 'triangle', label: 'Triangle', title: 'Triangle' },
  { id: 'diamond', label: 'Diamond', title: 'Diamond' },
  { id: 'pentagon', label: 'Pentagon', title: 'Pentagon' },
  { id: 'hexagon', label: 'Hexagon', title: 'Hexagon' },
  { id: 'arrow', label: 'Arrow', title: 'Arrow right' },
  { id: 'arrowLeft', label: 'Arrow left', title: 'Arrow left' },
  { id: 'arrowUp', label: 'Arrow up', title: 'Arrow up' },
  { id: 'star', label: 'Star', title: 'Star' },
  { id: 'sparkle', label: 'Sparkle', title: 'Sparkle' },
  { id: 'bubble', label: 'Bubble', title: 'Speech bubble' },
  { id: 'badge', label: 'Badge', title: 'Badge' },
]

export const SHAPE_DEFAULTS = {
  line: { x: 30, y: 50, w: 40, h: 0.14, fill: 'accent', stroke: 'none', strokeWidth: 0 },
  curve: { x: 30, y: 44, w: 36, h: 18, fill: 'none', stroke: 'accent', strokeWidth: 0.4 },
  circle: { x: 36, y: 42, w: 28, h: 28, fill: 'none', stroke: 'accent', strokeWidth: 0.3 },
  rect: { x: 38, y: 44, w: 24, h: 24, fill: 'none', stroke: 'accent', strokeWidth: 0.3, radius: 0 },
  rounded: { x: 38, y: 44, w: 24, h: 24, fill: 'none', stroke: 'accent', strokeWidth: 0.3, radius: 2 },
  triangle: { x: 38, y: 42, w: 26, h: 23, fill: 'none', stroke: 'accent', strokeWidth: 0.35 },
  diamond: { x: 39, y: 42, w: 23, h: 23, fill: 'none', stroke: 'accent', strokeWidth: 0.35 },
  pentagon: { x: 38, y: 42, w: 25, h: 25, fill: 'none', stroke: 'accent', strokeWidth: 0.35 },
  hexagon: { x: 38, y: 42, w: 25, h: 25, fill: 'none', stroke: 'accent', strokeWidth: 0.35 },
  arrow: { x: 34, y: 46, w: 32, h: 17, fill: 'accent', stroke: 'none', strokeWidth: 0 },
  arrowLeft: { x: 34, y: 46, w: 32, h: 17, fill: 'accent', stroke: 'none', strokeWidth: 0 },
  arrowUp: { x: 41, y: 38, w: 17, h: 32, fill: 'accent', stroke: 'none', strokeWidth: 0 },
  star: { x: 39, y: 40, w: 23, h: 23, fill: 'accent', stroke: 'none', strokeWidth: 0 },
  sparkle: { x: 40, y: 41, w: 21, h: 21, fill: 'accent', stroke: 'none', strokeWidth: 0 },
  bubble: { x: 33, y: 42, w: 35, h: 27, fill: 'none', stroke: 'accent', strokeWidth: 0.35 },
  badge: { x: 39, y: 41, w: 23, h: 23, fill: 'soft', stroke: 'accent', strokeWidth: 0.25 },
}

export const BRUSH_PRESETS = [
  { id: 'pencil', label: 'Pencil', size: 0.6, opacity: 1 },
  { id: 'marker', label: 'Marker', size: 1.8, opacity: 0.9 },
  { id: 'ink', label: 'Ink', size: 3, opacity: 1 },
  { id: 'airbrush', label: 'Airbrush', size: 4.5, opacity: 0.35 },
]
