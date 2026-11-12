// Photoshop-style tool catalogue. The rail and the canvas dispatch both read
// from here, so adding a tool is a single entry plus a branch in the engine.

export const DEFAULT_TOOL_SETTINGS = {
  foreground: '#1c2025',
  background: '#f7f7f3',
  size: 2.4,
  hardness: 0.75,
  opacity: 0.92,
  tolerance: 34,
  contiguous: true,
  healStrength: 0.85,
  gradientType: 'linear',
  shapeFill: 'none',
  shapeStroke: 'accent',
  shapeSides: 6,
  cropRatio: 'free',
  cloneSource: null,
  smudgeStrength: 0.55,
  dodgeStrength: 0.35,
}

export const TOOL_GROUPS = [
  {
    id: 'move',
    label: 'Move',
    key: 'V',
    tools: [
      { id: 'select', label: 'Move', key: 'V', tip: 'Drag a layer to move it. Drag the page photo to choose which part shows.' },
    ],
  },
  {
    id: 'marquee',
    label: 'Marquee',
    key: 'M',
    tools: [
      { id: 'marquee-rect', label: 'Rectangular marquee', key: 'M', tip: 'Drag a box to select layers. Shift adds to the selection.' },
      { id: 'marquee-ellipse', label: 'Elliptical marquee', key: 'M', tip: 'Drag an oval to select layers inside it.' },
      { id: 'marquee-row', label: 'Single row marquee', key: 'M', tip: 'Drag a one-pixel-high strip to pick the layers it crosses.' },
      { id: 'marquee-col', label: 'Single column marquee', key: 'M', tip: 'Drag a one-pixel-wide strip to pick the layers it crosses.' },
    ],
  },
  {
    id: 'lasso',
    label: 'Lasso',
    key: 'L',
    tools: [
      { id: 'lasso', label: 'Freehand lasso', key: 'L', tip: 'Draw around layers to select them.' },
      { id: 'lasso-poly', label: 'Polygonal lasso', key: 'L', tip: 'Click to add corners, double-click or Enter to close.' },
      { id: 'lasso-magnetic', label: 'Magnetic lasso', key: 'L', tip: 'Drag roughly around artwork; the path snaps to layer edges.' },
    ],
  },
  {
    id: 'quick',
    label: 'Quick select',
    key: 'W',
    tools: [
      { id: 'object-select', label: 'Object selection', key: 'W', tip: 'Click a layer to select it.' },
      { id: 'quick-select', label: 'Quick selection', key: 'W', tip: 'Drag over layers to grow a selection.' },
      { id: 'magic-wand', label: 'Magic wand', key: 'W', tip: 'Click a colour to select every layer using a similar colour.' },
    ],
  },
  {
    id: 'crop',
    label: 'Crop',
    key: 'C',
    tools: [
      { id: 'crop', label: 'Crop', key: 'C', tip: 'Drag the page area to keep, then apply the crop.' },
      { id: 'slice', label: 'Slice', key: 'C', tip: 'Drag web slices on the page and export them separately.' },
      { id: 'frame', label: 'Frame', key: 'K', tip: 'Drag a placeholder frame, then drop a photo into it.' },
    ],
  },
  {
    id: 'measure',
    label: 'Measure',
    key: 'I',
    tools: [
      { id: 'eyedropper', label: 'Eyedropper', key: 'I', tip: 'Click the page to sample a colour into the foreground.' },
      { id: 'ruler', label: 'Ruler', key: 'I', tip: 'Drag to measure distance and angle.' },
      { id: 'note', label: 'Note', key: 'I', tip: 'Click the page to attach a text note.' },
      { id: 'count', label: 'Count', key: 'I', tip: 'Click objects to number them.' },
    ],
  },
  {
    id: 'heal',
    label: 'Healing',
    key: 'J',
    tools: [
      { id: 'spot-heal', label: 'Spot healing brush', key: 'J', tip: 'Brush over a small blemish to sample around it.' },
      { id: 'heal', label: 'Healing brush', key: 'J', tip: 'Alt-click a clean area, then paint over the blemish.' },
      { id: 'patch', label: 'Patch', key: 'J', tip: 'Drag a box over a blemish to fill it from nearby pixels.' },
    ],
  },
  {
    id: 'clone',
    label: 'Clone stamp',
    key: 'S',
    tools: [
      { id: 'clone', label: 'Clone stamp', key: 'S', tip: 'Alt-click a source, then paint to copy it.' },
      { id: 'history-brush', label: 'History brush', key: 'Y', tip: 'Paint the original page back over your retouching.' },
    ],
  },
  {
    id: 'paint',
    label: 'Brush',
    key: 'B',
    tools: [
      { id: 'brush', label: 'Brush', key: 'B', tip: 'Paint soft strokes on a new paint layer.' },
      { id: 'pencil', label: 'Pencil', key: 'B', tip: 'Paint hard-edged strokes.' },
    ],
  },
  {
    id: 'eraser',
    label: 'Eraser',
    key: 'E',
    tools: [
      { id: 'eraser', label: 'Eraser', key: 'E', tip: 'Erase paint and retouching back to the page.' },
    ],
  },
  {
    id: 'fill',
    label: 'Fill',
    key: 'G',
    tools: [
      { id: 'gradient', label: 'Gradient', key: 'G', tip: 'Drag across the page to paint a gradient.' },
      { id: 'bucket', label: 'Paint bucket', key: 'G', tip: 'Click to fill the area of similar colour.' },
    ],
  },
  {
    id: 'focus',
    label: 'Blur',
    key: '',
    tools: [
      { id: 'blur', label: 'Blur', key: '', tip: 'Brush to soften detail.' },
      { id: 'sharpen', label: 'Sharpen', key: '', tip: 'Brush to crisp up detail.' },
      { id: 'smudge', label: 'Smudge', key: '', tip: 'Drag to smear pixels.' },
    ],
  },
  {
    id: 'tone',
    label: 'Dodge',
    key: '',
    tools: [
      { id: 'dodge', label: 'Dodge', key: '', tip: 'Brush to lighten.' },
      { id: 'burn', label: 'Burn', key: '', tip: 'Brush to darken.' },
      { id: 'sponge', label: 'Sponge', key: '', tip: 'Brush to pull colour out.' },
    ],
  },
  {
    id: 'pen',
    label: 'Pen',
    key: 'P',
    tools: [
      { id: 'pen', label: 'Pen', key: 'P', tip: 'Click corners to draw a path; Enter finishes it.' },
    ],
  },
  {
    id: 'path',
    label: 'Path select',
    key: 'A',
    tools: [
      { id: 'path-select', label: 'Path selection', key: 'A', tip: 'Click a path or shape to select it.' },
      { id: 'direct-select', label: 'Direct selection', key: 'A', tip: 'Select a path, then drag its anchor points.' },
    ],
  },
  {
    id: 'type',
    label: 'Type',
    key: 'T',
    tools: [
      { id: 'text', label: 'Type', key: 'T', tip: 'Click the page to place text.' },
    ],
  },
  {
    id: 'shape',
    label: 'Shape',
    key: 'U',
    tools: [
      { id: 'shape-rect', label: 'Rectangle', key: 'U', tip: 'Drag to draw a rectangle.' },
      { id: 'shape-ellipse', label: 'Ellipse', key: 'U', tip: 'Drag to draw an ellipse.' },
      { id: 'shape-polygon', label: 'Polygon', key: 'U', tip: 'Drag to draw a polygon.' },
      { id: 'shape-line', label: 'Line', key: 'U', tip: 'Drag to draw a line.' },
    ],
  },
  {
    id: 'hand',
    label: 'Hand',
    key: 'H',
    tools: [
      { id: 'hand', label: 'Hand', key: 'H', tip: 'Drag to scroll the canvas.' },
    ],
  },
  {
    id: 'rotate',
    label: 'Rotate',
    key: 'R',
    tools: [
      { id: 'rotate', label: 'Rotate view', key: 'R', tip: 'Drag left or right to rotate the view (not the export).' },
    ],
  },
  {
    id: 'zoom',
    label: 'Zoom',
    key: 'Z',
    tools: [
      { id: 'zoom', label: 'Zoom', key: 'Z', tip: 'Click to zoom in, Alt-click to zoom out.' },
    ],
  },
]

export const TOOL_BY_ID = TOOL_GROUPS.reduce((map, group) => {
  group.tools.forEach((tool) => {
    map[tool.id] = { ...tool, group: group.id, groupLabel: group.label }
  })
  return map
}, {})

// Letter -> group, Photoshop-style: pressing the letter parks on the first
// tool, pressing it again cycles through the group.
export const SHORTCUT_GROUPS = TOOL_GROUPS.reduce((map, group) => {
  if (group.key) map[group.key.toLowerCase()] = group
  return map
}, {})

export const GROUP_BY_ID = TOOL_GROUPS.reduce((map, group) => {
  map[group.id] = group
  return map
}, {})

export const PRIMARY_TOOL_OF_GROUP = TOOL_GROUPS.reduce((map, group) => {
  map[group.id] = group.tools[0].id
  return map
}, {})

export const SELECTION_TOOLS = new Set([
  'select',
  'marquee-rect',
  'marquee-ellipse',
  'marquee-row',
  'marquee-col',
  'lasso',
  'lasso-poly',
  'lasso-magnetic',
  'object-select',
  'quick-select',
  'magic-wand',
])

export const MARQUEE_TOOLS = {
  'marquee-rect': 'rect',
  'marquee-ellipse': 'ellipse',
  'marquee-row': 'row',
  'marquee-col': 'col',
}

export const LASSO_TOOLS = new Set(['lasso', 'lasso-poly', 'lasso-magnetic'])

export const PAINT_TOOLS = new Set([
  'brush',
  'pencil',
  'eraser',
  'gradient',
  'bucket',
  'blur',
  'sharpen',
  'smudge',
  'dodge',
  'burn',
  'sponge',
  'clone',
  'heal',
  'spot-heal',
  'patch',
  'history-brush',
])

// Tools that need the page rendered underneath them before painting.
export const SOURCE_PAINT_TOOLS = new Set([
  'blur',
  'sharpen',
  'smudge',
  'dodge',
  'burn',
  'sponge',
  'clone',
  'heal',
  'spot-heal',
  'patch',
  'history-brush',
])

export const RETOUCH_TOOLS = new Set(['clone', 'heal', 'spot-heal', 'history-brush'])

export const TOOL_CURSORS = {
  select: 'grab',
  hand: 'grab',
  zoom: 'zoom-in',
  text: 'text',
  rotate: 'ew-resize',
  eyedropper: 'crosshair',
  'shape-line': 'crosshair',
}

export function toolsInGroup(groupId) {
  return GROUP_BY_ID[groupId]?.tools || []
}

export function nextToolInGroup(groupId, currentId) {
  const tools = toolsInGroup(groupId)
  if (!tools.length) return currentId
  const index = tools.findIndex((tool) => tool.id === currentId)
  return tools[(index + 1) % tools.length].id
}

export function toolLabel(id) {
  return TOOL_BY_ID[id]?.label || id
}
