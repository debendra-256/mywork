import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Maximize2, Network, Plus, Redo2, RotateCcw, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import './MindCloud.css'

const STORAGE_KEY = 'imgmojo:mindcloud:v1'
const NODE_GAP_X = 62
const NODE_GAP_Y = 14
const FONT_STACK = 'Inter, "Segoe UI", system-ui, sans-serif'
const EXPORT_FONT_STACK = 'Inter, Segoe UI, system-ui, sans-serif'
const DEFAULT_THEME = 'mint'

const THEMES = [
  { id: 'mint', name: 'Mint', canvas: '#f4faf6', dots: '#dbe8df', root: '#17382a', palette: ['#0a9f62', '#11806b', '#3a9b58', '#0f7a52', '#5aa87f', '#2f7057'] },
  { id: 'violet', name: 'Violet', canvas: '#f8f6fd', dots: '#e3dcf2', root: '#2d2346', palette: ['#7c4dff', '#9a5cf5', '#6d5bd0', '#8e44ad', '#5b5bd6', '#b06ab3'] },
  { id: 'sunset', name: 'Sunset', canvas: '#fdf8f4', dots: '#f0e0d4', root: '#3d271d', palette: ['#e8590c', '#d9480f', '#e67700', '#c92a2a', '#e8590c', '#a61e4d'] },
  { id: 'ocean', name: 'Ocean', canvas: '#f3f9fc', dots: '#d7e7f0', root: '#143445', palette: ['#0b7285', '#1971c2', '#0c8599', '#1864ab', '#22b8cf', '#3b5bdb'] },
  { id: 'rose', name: 'Rose', canvas: '#fdf6f8', dots: '#f0dde3', root: '#3d1f2a', palette: ['#c2255c', '#a61e4d', '#d6336c', '#c92a5e', '#e64980', '#9c36b5'] },
  { id: 'graphite', name: 'Graphite', canvas: '#f7f8f9', dots: '#e2e5e8', root: '#20252b', palette: ['#343a40', '#495057', '#5c636a', '#212529', '#6c757d', '#3b4046'] },
]

const TEMPLATES = [
  {
    id: 'launch',
    title: 'Product launch',
    themeId: 'mint',
    nodes: [
      { id: 'root', parentId: null, text: 'Product launch' },
      { id: 'research', parentId: 'root', text: 'Research' },
      { id: 'interviews', parentId: 'research', text: 'Customer interviews' },
      { id: 'competitors', parentId: 'research', text: 'Competitor scan' },
      { id: 'design', parentId: 'root', text: 'Design' },
      { id: 'wireframes', parentId: 'design', text: 'Wireframes' },
      { id: 'brand', parentId: 'design', text: 'Brand kit' },
      { id: 'build', parentId: 'root', text: 'Build' },
      { id: 'frontend', parentId: 'build', text: 'Frontend' },
      { id: 'backend', parentId: 'build', text: 'Backend' },
      { id: 'launch-day', parentId: 'root', text: 'Launch' },
      { id: 'beta', parentId: 'launch-day', text: 'Beta testers' },
      { id: 'promo', parentId: 'launch-day', text: 'Launch campaign' },
    ],
  },
  {
    id: 'trip',
    title: 'Trip planner',
    themeId: 'ocean',
    nodes: [
      { id: 'root', parentId: null, text: 'Weekend in Goa' },
      { id: 'stay', parentId: 'root', text: 'Stay' },
      { id: 'beach-house', parentId: 'stay', text: 'Beach house' },
      { id: 'checkin', parentId: 'stay', text: 'Check-in time' },
      { id: 'food', parentId: 'root', text: 'Food' },
      { id: 'cafes', parentId: 'food', text: 'Beach cafés' },
      { id: 'seafood', parentId: 'food', text: 'Seafood shacks' },
      { id: 'do', parentId: 'root', text: 'Things to do' },
      { id: 'sunset', parentId: 'do', text: 'Sunset cruise' },
      { id: 'market', parentId: 'do', text: 'Night market' },
      { id: 'pack', parentId: 'root', text: 'Pack' },
      { id: 'essentials', parentId: 'pack', text: 'Sunscreen, charger' },
    ],
  },
  {
    id: 'study',
    title: 'Study notes',
    themeId: 'violet',
    nodes: [
      { id: 'root', parentId: null, text: 'Cell biology' },
      { id: 'structure', parentId: 'root', text: 'Cell structure' },
      { id: 'membrane', parentId: 'structure', text: 'Plasma membrane' },
      { id: 'organelles', parentId: 'structure', text: 'Organelles' },
      { id: 'processes', parentId: 'root', text: 'Processes' },
      { id: 'mitosis', parentId: 'processes', text: 'Mitosis' },
      { id: 'osmosis', parentId: 'processes', text: 'Osmosis' },
      { id: 'exam', parentId: 'root', text: 'Exam prep' },
      { id: 'flashcards', parentId: 'exam', text: 'Flashcards' },
      { id: 'practice', parentId: 'exam', text: 'Practice questions' },
    ],
  },
  {
    id: 'content',
    title: 'Content ideas',
    themeId: 'sunset',
    nodes: [
      { id: 'root', parentId: null, text: 'Content plan' },
      { id: 'video', parentId: 'root', text: 'Video' },
      { id: 'reels', parentId: 'video', text: 'Short reels' },
      { id: 'tutorials', parentId: 'video', text: 'Tutorials' },
      { id: 'social', parentId: 'root', text: 'Social' },
      { id: 'carousel', parentId: 'social', text: 'Carousel posts' },
      { id: 'polls', parentId: 'social', text: 'Polls and Q&A' },
      { id: 'blog', parentId: 'root', text: 'Blog' },
      { id: 'seo', parentId: 'blog', text: 'SEO articles' },
      { id: 'newsletter', parentId: 'blog', text: 'Newsletter' },
    ],
  },
]

let idSeed = 0
function createId() {
  idSeed += 1
  return `m${Date.now().toString(36)}${idSeed.toString(36)}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

function freshNodes(template) {
  return template.nodes.map((node) => ({ ...node }))
}

function wrapLabel(text, maxChars) {
  const words = String(text || 'Untitled').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (!words.length) return ['Untitled']
  const lines = []
  let line = ''
  for (let index = 0; index < words.length; index += 1) {
    const candidate = line ? `${line} ${words[index]}` : words[index]
    if (!line || candidate.length <= maxChars) {
      line = candidate
      continue
    }
    lines.push(line)
    const rest = [words[index], ...words.slice(index + 1)].join(' ')
    lines.push(rest.length > maxChars ? `${rest.slice(0, maxChars - 1).trimEnd()}…` : rest)
    return lines
  }
  if (line) lines.push(line)
  return lines
}

function measureNode(text, isRoot) {
  const lines = wrapLabel(text, isRoot ? 22 : 26)
  const font = isRoot ? 15.5 : 13.5
  const longest = Math.max(...lines.map((line) => line.length))
  const w = Math.round(clamp(longest * font * 0.585 + 32, isRoot ? 132 : 104, 236))
  const h = (isRoot ? 52 : 44) + (lines.length - 1) * 17
  return { lines, w, h, font }
}

function buildLayout(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const children = new Map(nodes.map((node) => [node.id, []]))
  nodes.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) children.get(node.parentId).push(node)
  })
  const root = nodes.find((node) => !node.parentId || !byId.has(node.parentId)) ?? nodes[0]
  const sizes = new Map(nodes.map((node) => [node.id, measureNode(node.text, node.id === root.id)]))
  const positions = new Map()

  const span = (id) => {
    const kids = children.get(id) ?? []
    if (!kids.length) return sizes.get(id).h
    let height = 0
    kids.forEach((kid, index) => { height += span(kid.id) + (index ? NODE_GAP_Y : 0) })
    return Math.max(sizes.get(id).h, height)
  }

  const place = (id, x, y, side, colorIndex, level) => {
    const size = sizes.get(id)
    positions.set(id, { x, y, w: size.w, h: size.h, lines: size.lines, font: size.font, side, colorIndex, level })
    const kids = children.get(id) ?? []
    if (!kids.length) return
    const heights = kids.map((kid) => span(kid.id))
    const total = heights.reduce((sum, height) => sum + height, 0) + NODE_GAP_Y * (kids.length - 1)
    const dir = side === 'left' ? -1 : 1
    let cursor = y - total / 2
    kids.forEach((kid, index) => {
      const kidSize = sizes.get(kid.id)
      const childX = x + dir * (size.w / 2 + NODE_GAP_X + kidSize.w / 2)
      place(kid.id, childX, cursor + heights[index] / 2, side, colorIndex, level + 1)
      cursor += heights[index] + NODE_GAP_Y
    })
  }

  const rootSize = sizes.get(root.id)
  positions.set(root.id, { x: 0, y: 0, w: rootSize.w, h: rootSize.h, lines: rootSize.lines, font: rootSize.font, side: 'root', colorIndex: -1, level: 0 })

  const sides = { right: [], left: [] }
  const rootKids = children.get(root.id) ?? []
  rootKids.forEach((kid, index) => { sides[index % 2 ? 'left' : 'right'].push({ kid, colorIndex: index }) })

  ;['right', 'left'].forEach((side) => {
    const list = sides[side]
    if (!list.length) return
    const total = list.reduce((sum, item, index) => sum + span(item.kid.id) + (index ? NODE_GAP_Y : 0), 0)
    const dir = side === 'left' ? -1 : 1
    let cursor = -total / 2
    list.forEach(({ kid, colorIndex }) => {
      const kidSize = sizes.get(kid.id)
      const kidSpan = span(kid.id)
      const x = dir * (rootSize.w / 2 + NODE_GAP_X + kidSize.w / 2)
      place(kid.id, x, cursor + kidSpan / 2, side, colorIndex, 1)
      cursor += kidSpan + NODE_GAP_Y
    })
  })

  const edges = nodes
    .filter((node) => node.parentId && positions.has(node.parentId) && positions.has(node.id))
    .map((node) => ({ id: `${node.parentId}-${node.id}`, from: node.parentId, to: node.id }))

  nodes.forEach((node) => {
    const position = positions.get(node.id)
    if (!position) return
    position.x += Number(node.offsetX) || 0
    position.y += Number(node.offsetY) || 0
  })

  return { positions, edges, rootId: root.id }
}

function collectSubtree(nodes, id) {
  const ids = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    nodes.forEach((node) => {
      if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) {
        ids.add(node.id)
        changed = true
      }
    })
  }
  return ids
}

function boundsOf(positions) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  positions.forEach((node) => {
    minX = Math.min(minX, node.x - node.w / 2)
    maxX = Math.max(maxX, node.x + node.w / 2)
    minY = Math.min(minY, node.y - node.h / 2)
    maxY = Math.max(maxY, node.y + node.h / 2)
  })
  if (!Number.isFinite(minX)) return { minX: -120, minY: -80, maxX: 120, maxY: 80, width: 240, height: 160 }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

function sanitizeNodes(input) {
  if (!Array.isArray(input)) return null
  const raw = []
  const ids = new Set()
  for (const item of input) {
    if (!item || typeof item.id !== 'string' || typeof item.text !== 'string') continue
    const id = item.id.slice(0, 40)
    if (ids.has(id)) continue
    ids.add(id)
    const node = { id, parentId: typeof item.parentId === 'string' ? item.parentId : null, text: item.text.trim().slice(0, 90) || 'Untitled' }
    const offsetX = Number(item.offsetX)
    const offsetY = Number(item.offsetY)
    if (Number.isFinite(offsetX) && offsetX) node.offsetX = clamp(offsetX, -20000, 20000)
    if (Number.isFinite(offsetY) && offsetY) node.offsetY = clamp(offsetY, -20000, 20000)
    raw.push(node)
  }
  if (!raw.length) return null
  const root = raw.find((node) => !node.parentId || !ids.has(node.parentId) || node.parentId === node.id)
  if (!root) return null
  root.parentId = null
  const ordered = [root]
  const queue = [root.id]
  while (queue.length) {
    const parentId = queue.shift()
    raw.forEach((node) => {
      if (node.id !== root.id && node.parentId === parentId && !ordered.includes(node)) {
        ordered.push(node)
        queue.push(node.id)
      }
    })
  }
  return ordered
}

function loadSavedMap() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const nodes = sanitizeNodes(parsed?.nodes)
    if (!nodes) return null
    return {
      nodes,
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim().slice(0, 60) : TEMPLATES[0].title,
      themeId: THEMES.some((theme) => theme.id === parsed.themeId) ? parsed.themeId : DEFAULT_THEME,
      background: parsed.background === 'plain' ? 'plain' : 'dots',
    }
  } catch {
    return null
  }
}

function escapeText(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))
}

function buildExportSvg(nodes, theme) {
  const layout = buildLayout(nodes)
  const bounds = boundsOf(layout.positions)
  const padding = 72
  const width = Math.ceil(bounds.width + padding * 2)
  const height = Math.ceil(bounds.height + padding * 2)
  const offsetX = -bounds.minX + padding
  const offsetY = -bounds.minY + padding
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`]
  parts.push(`<rect width="100%" height="100%" fill="${theme.canvas}"/>`)

  const colorFor = (position) => position.colorIndex >= 0 ? theme.palette[position.colorIndex % theme.palette.length] : theme.root

  layout.edges.forEach((edge) => {
    const from = layout.positions.get(edge.from)
    const to = layout.positions.get(edge.to)
    if (!from || !to) return
    const dir = to.x >= from.x ? 1 : -1
    const x1 = from.x + (dir * from.w) / 2 + offsetX
    const y1 = from.y + offsetY
    const x2 = to.x - (dir * to.w) / 2 + offsetX
    const y2 = to.y + offsetY
    const midX = (x1 + x2) / 2
    parts.push(`<path d="M${x1} ${y1} C${midX} ${y1} ${midX} ${y2} ${x2} ${y2}" fill="none" stroke="${colorFor(from.colorIndex >= 0 ? from : to)}" stroke-width="2.4" stroke-linecap="round" opacity="0.75"/>`)
  })

  nodes.forEach((node) => {
    const position = layout.positions.get(node.id)
    if (!position) return
    const x = position.x - position.w / 2 + offsetX
    const y = position.y - position.h / 2 + offsetY
    const color = colorFor(position)
    const isRoot = position.level === 0
    const isBranch = position.level === 1
    const fill = isRoot || isBranch ? color : '#ffffff'
    const textColor = isRoot || isBranch ? '#ffffff' : '#28313a'
    const weight = isRoot ? 700 : isBranch ? 650 : 550
    parts.push(`<rect x="${x}" y="${y}" width="${position.w}" height="${position.h}" rx="${isRoot ? 15 : 12}" fill="${fill}"${isBranch ? '' : ` stroke="${color}" stroke-width="1.5"`}/>`)
    parts.push(`<text x="${x + 14}" y="${position.y + offsetY}" fill="${textColor}" font-family="${EXPORT_FONT_STACK}" font-size="${position.font}" font-weight="${weight}">`)
    position.lines.forEach((line, index) => {
      const dy = index === 0 ? 5 - ((position.lines.length - 1) * 17) / 2 : 17
      parts.push(`<tspan x="${x + 14}" dy="${dy}">${escapeText(line)}</tspan>`)
    })
    parts.push('</text>')
  })

  parts.push(`<text x="${padding}" y="${height - 26}" fill="#95a39c" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600">Made with ImgMojo Mind Cloud</text>`)
  parts.push('</svg>')
  return { svg: parts.join(''), width, height }
}

export default function MindCloud() {
  const [start] = useState(() => loadSavedMap() ?? {
    nodes: freshNodes(TEMPLATES[0]),
    title: TEMPLATES[0].title,
    themeId: DEFAULT_THEME,
    background: 'dots',
  })
  const [doc, setDoc] = useState(() => ({ nodes: start.nodes, past: [], future: [] }))
  const [title, setTitle] = useState(start.title)
  const [themeId, setThemeId] = useState(start.themeId)
  const [background, setBackground] = useState(start.background)
  const [selectedId, setSelectedId] = useState(() => start.nodes[0]?.id ?? null)
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [notice, setNotice] = useState('')
  const [drag, setDrag] = useState(null)

  const svgRef = useRef(null)
  const editorRef = useRef(null)
  const importRef = useRef(null)
  const panRef = useRef(null)
  const dragRef = useRef(null)
  const nodesRef = useRef(doc.nodes)
  nodesRef.current = doc.nodes

  const nodes = doc.nodes
  const theme = THEMES.find((entry) => entry.id === themeId) ?? THEMES[0]
  const layout = useMemo(() => buildLayout(nodes), [nodes])
  const positions = useMemo(() => {
    if (!drag) return layout.positions
    const next = new Map(layout.positions)
    drag.ids.forEach((id) => {
      const position = next.get(id)
      if (position) next.set(id, { ...position, x: position.x + drag.dx, y: position.y + drag.dy })
    })
    return next
  }, [layout, drag])
  const hasOffsets = useMemo(() => nodes.some((node) => Number(node.offsetX) || Number(node.offsetY)), [nodes])
  const selected = nodes.find((node) => node.id === selectedId) ?? null
  const selectedPosition = selectedId ? positions.get(selectedId) ?? null : null

  const trail = useMemo(() => {
    if (!selected) return 'No node selected'
    const byId = new Map(nodes.map((node) => [node.id, node]))
    const parts = []
    let current = selected
    let guard = 0
    while (current && guard < 20) {
      parts.unshift(current.text || 'Untitled')
      current = current.parentId ? byId.get(current.parentId) : null
      guard += 1
    }
    return parts.join(' / ')
  }, [selected, nodes])

  const depth = useMemo(() => {
    const byId = new Map(nodes.map((node) => [node.id, node]))
    let max = 1
    nodes.forEach((node) => {
      let level = 1
      let current = node
      const seen = new Set([node.id])
      while (current.parentId && byId.has(current.parentId) && !seen.has(current.parentId)) {
        seen.add(current.parentId)
        current = byId.get(current.parentId)
        level += 1
      }
      max = Math.max(max, level)
    })
    return max
  }, [nodes])

  const commit = useCallback((nextNodes) => {
    setDoc((current) => ({ nodes: nextNodes, past: [...current.past.slice(-59), current.nodes], future: [] }))
  }, [])

  const fitView = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width < 60 || rect.height < 60) return
    const currentLayout = buildLayout(nodesRef.current)
    const bounds = boundsOf(currentLayout.positions)
    const zoom = clamp(Math.min((rect.width - 130) / bounds.width, (rect.height - 120) / bounds.height), 0.24, 1.2)
    setView({
      zoom,
      x: rect.width / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom,
      y: rect.height / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom,
    })
  }, [])

  const requestFit = useCallback(() => {
    requestAnimationFrame(() => fitView())
  }, [fitView])

  useEffect(() => {
    fitView()
    const svg = svgRef.current
    if (!svg) return
    const observer = new ResizeObserver(() => requestFit())
    observer.observe(svg)
    return () => observer.disconnect()
  }, [fitView, requestFit])

  useEffect(() => {
    if (selectedId && !nodes.some((node) => node.id === selectedId)) setSelectedId(nodes[0]?.id ?? null)
  }, [nodes, selectedId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, title, themeId, background, nodes }))
      } catch {
        /* The map still works without storage. */
      }
    }, 260)
    return () => window.clearTimeout(timer)
  }, [title, themeId, background, nodes])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (event) => {
      event.preventDefault()
      const rect = svg.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top
      setView((current) => {
        const zoom = clamp(current.zoom * Math.exp(-event.deltaY * 0.0015), 0.2, 2.4)
        const scale = zoom / current.zoom
        return {
          zoom,
          x: pointerX - (pointerX - current.x) * scale,
          y: pointerY - (pointerY - current.y) * scale,
        }
      })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [])

  const addChild = useCallback((parentId = selectedId) => {
    const target = parentId ?? nodesRef.current.find((node) => !node.parentId)?.id
    if (!target) return
    const node = { id: createId(), parentId: target, text: 'New idea' }
    commit([...nodesRef.current, node])
    setSelectedId(node.id)
    requestFit()
  }, [selectedId, commit, requestFit])

  const addSibling = useCallback(() => {
    const current = nodesRef.current.find((node) => node.id === selectedId)
    if (!current || !current.parentId) {
      addChild()
      return
    }
    const node = { id: createId(), parentId: current.parentId, text: 'New idea' }
    const index = nodesRef.current.findIndex((entry) => entry.id === current.id)
    const next = [...nodesRef.current.slice(0, index + 1), node, ...nodesRef.current.slice(index + 1)]
    commit(next)
    setSelectedId(node.id)
    requestFit()
  }, [selectedId, addChild, commit, requestFit])

  const deleteSelected = useCallback(() => {
    const current = nodesRef.current.find((node) => node.id === selectedId)
    if (!current || !current.parentId) return
    const remove = new Set([current.id])
    let changed = true
    while (changed) {
      changed = false
      nodesRef.current.forEach((node) => {
        if (node.parentId && remove.has(node.parentId) && !remove.has(node.id)) {
          remove.add(node.id)
          changed = true
        }
      })
    }
    commit(nodesRef.current.filter((node) => !remove.has(node.id)))
    setSelectedId(current.parentId)
    requestFit()
  }, [selectedId, commit, requestFit])

  const updateText = useCallback((text) => {
    if (!selectedId) return
    const clean = text.replace(/[\r\n]+/g, ' ').slice(0, 90)
    commit(nodesRef.current.map((node) => node.id === selectedId ? { ...node, text: clean } : node))
  }, [selectedId, commit])

  const undo = useCallback(() => {
    setDoc((current) => current.past.length ? ({
      nodes: current.past[current.past.length - 1],
      past: current.past.slice(0, -1),
      future: [current.nodes, ...current.future].slice(0, 60),
    }) : current)
  }, [])

  const redo = useCallback(() => {
    setDoc((current) => current.future.length ? ({
      nodes: current.future[0],
      past: [...current.past, current.nodes].slice(-60),
      future: current.future.slice(1),
    }) : current)
  }, [])

  const zoomBy = useCallback((factor) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    setView((current) => {
      const zoom = clamp(current.zoom * factor, 0.2, 2.4)
      const scale = zoom / current.zoom
      return {
        zoom,
        x: rect.width / 2 - (rect.width / 2 - current.x) * scale,
        y: rect.height / 2 - (rect.height / 2 - current.y) * scale,
      }
    })
  }, [])

  const exportPng = useCallback(async () => {
    if (exporting) return
    setExporting(true)
    setNotice('')
    try {
      const { svg, width, height } = buildExportSvg(nodesRef.current, theme)
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
      try {
        const image = await new Promise((resolve, reject) => {
          const element = new Image()
          element.onload = () => resolve(element)
          element.onerror = () => reject(new Error('Could not render the map as an image.'))
          element.src = url
        })
        const scale = Math.min(2, 4096 / Math.max(width, height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(width * scale)
        canvas.height = Math.round(height * scale)
        const context = canvas.getContext('2d')
        context.fillStyle = theme.canvas
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (!blob) throw new Error('PNG export failed.')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${slugify(title) || 'mind-map'}-mindcloud.png`
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(link.href), 4000)
        setNotice(`PNG exported · ${canvas.width} × ${canvas.height}px`)
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setExporting(false)
    }
  }, [exporting, theme, title])

  const downloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ app: 'imgmojo-mindcloud', version: 1, title, themeId, background, nodes: nodesRef.current }, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${slugify(title) || 'mind-map'}-mindcloud.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(link.href), 4000)
    setNotice('Mind map file saved.')
  }, [title, themeId, background])

  const importMap = useCallback(async (file) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const nextNodes = sanitizeNodes(parsed?.nodes)
      if (!nextNodes) throw new Error('That JSON file has no mind map nodes.')
      setDoc((current) => ({ nodes: nextNodes, past: [...current.past.slice(-59), current.nodes], future: [] }))
      if (typeof parsed.title === 'string' && parsed.title.trim()) setTitle(parsed.title.trim().slice(0, 60))
      if (THEMES.some((entry) => entry.id === parsed.themeId)) setThemeId(parsed.themeId)
      if (parsed.background === 'plain' || parsed.background === 'dots') setBackground(parsed.background)
      setSelectedId(nextNodes[0].id)
      requestFit()
      setNotice(`Imported “${parsed.title || 'mind map'}”.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not read that file.')
    }
  }, [requestFit])

  const applyTemplate = useCallback((template) => {
    const nextNodes = freshNodes(template)
    setDoc((current) => ({ nodes: nextNodes, past: [...current.past.slice(-59), current.nodes], future: [] }))
    setTitle(template.title)
    if (template.themeId) setThemeId(template.themeId)
    setSelectedId(nextNodes[0].id)
    requestFit()
    setNotice(`Loaded the “${template.title}” template.`)
  }, [requestFit])

  const resetMap = useCallback(() => {
    const nextNodes = freshNodes(TEMPLATES[0])
    setDoc((current) => ({ nodes: nextNodes, past: [...current.past.slice(-59), current.nodes], future: [] }))
    setTitle(TEMPLATES[0].title)
    setThemeId(DEFAULT_THEME)
    setBackground('dots')
    setSelectedId(nextNodes[0].id)
    requestFit()
    setNotice('Started a fresh map.')
  }, [requestFit])

  useEffect(() => {
    const onKeyDown = (event) => {
      const element = event.target
      const tag = element?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element?.isContentEditable) return
      const mod = event.ctrlKey || event.metaKey
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void exportPng()
        return
      }
      if (event.key === 'Tab') {
        event.preventDefault()
        addChild()
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        addSibling()
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [addChild, addSibling, deleteSelected, undo, redo, exportPng])

  const autoArrange = useCallback(() => {
    commit(nodesRef.current.map((node) => {
      if (!Number(node.offsetX) && !Number(node.offsetY)) return node
      const { offsetX, offsetY, ...rest } = node
      return rest
    }))
    requestFit()
    setNotice('Nodes snapped back to the automatic layout.')
  }, [commit, requestFit])

  const startNodeDrag = (event, node) => {
    event.stopPropagation()
    if (event.button !== 0) return
    setSelectedId(node.id)
    const ids = [...collectSubtree(nodesRef.current, node.id)]
    dragRef.current = { ids, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, moved: false }
    setDrag({ ids, dx: 0, dy: 0 })
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* Synthetic or already-released pointers can skip capture. */
    }
  }

  const startPan = (event) => {
    if (event.button !== 0) return
    if (event.target.closest('[data-mindnode]')) return
    panRef.current = { x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* Synthetic or already-released pointers can skip capture. */
    }
    setPanning(true)
    setSelectedId(null)
  }

  const movePan = (event) => {
    const active = dragRef.current
    if (active) {
      const deltaX = event.clientX - active.startX
      const deltaY = event.clientY - active.startY
      if (!active.moved && Math.hypot(deltaX, deltaY) > 2) active.moved = true
      if (!active.moved) return
      active.dx = deltaX / view.zoom
      active.dy = deltaY / view.zoom
      setDrag({ ids: active.ids, dx: active.dx, dy: active.dy })
      return
    }
    const pan = panRef.current
    if (!pan) return
    setView((current) => ({ zoom: current.zoom, x: pan.viewX + event.clientX - pan.x, y: pan.viewY + event.clientY - pan.y }))
  }

  const endPan = (event) => {
    const active = dragRef.current
    if (active) {
      dragRef.current = null
      setDrag(null)
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        /* Pointer capture is released automatically on pointer up. */
      }
      if (!active.moved) return
      const ids = new Set(active.ids)
      commit(nodesRef.current.map((node) => ids.has(node.id) ? {
        ...node,
        offsetX: Math.round(((Number(node.offsetX) || 0) + active.dx) * 10) / 10,
        offsetY: Math.round(((Number(node.offsetY) || 0) + active.dy) * 10) / 10,
      } : node))
      return
    }
    if (!panRef.current) return
    panRef.current = null
    setPanning(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* Pointer capture may already be released. */
    }
  }

  const focusEditor = () => {
    requestAnimationFrame(() => editorRef.current?.focus())
  }

  return <section className="mindcloud-tool" aria-label="Mind Cloud mind map maker">
    <div className="mindcloud-toolbar">
      <div className="mindcloud-brand">
        <span className="mindcloud-brand-mark"><Network size={16} /></span>
        <input className="mindcloud-title" value={title} onChange={(event) => setTitle(event.target.value.slice(0, 60))} aria-label="Mind map title" maxLength={60} />
      </div>
      <div className="mindcloud-tools">
        <button className="mindcloud-icon-btn" type="button" onClick={undo} disabled={!doc.past.length} aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 size={15} /></button>
        <button className="mindcloud-icon-btn" type="button" onClick={redo} disabled={!doc.future.length} aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><Redo2 size={15} /></button>
        <span className="mindcloud-divider" aria-hidden="true" />
        <button className="mindcloud-btn" type="button" onClick={() => addChild()} disabled={!selectedId}><Plus size={14} /> Child</button>
        <button className="mindcloud-btn" type="button" onClick={addSibling} disabled={!selectedId}><Plus size={14} /> Sibling</button>
        <button className="mindcloud-icon-btn danger" type="button" onClick={deleteSelected} disabled={!selected || !selected.parentId} aria-label="Delete node" title="Delete node"><Trash2 size={15} /></button>
        <span className="mindcloud-divider" aria-hidden="true" />
        <button className="mindcloud-btn" type="button" onClick={autoArrange} disabled={!hasOffsets} title="Snap nodes back to the automatic layout"><RotateCcw size={14} /> Arrange</button>
      </div>
      <div className="mindcloud-tools mindcloud-tools-end">
        <button className="mindcloud-icon-btn" type="button" onClick={() => zoomBy(0.85)} aria-label="Zoom out"><ZoomOut size={15} /></button>
        <span className="mindcloud-zoom-value">{Math.round(view.zoom * 100)}%</span>
        <button className="mindcloud-icon-btn" type="button" onClick={() => zoomBy(1.18)} aria-label="Zoom in"><ZoomIn size={15} /></button>
        <button className="mindcloud-icon-btn" type="button" onClick={fitView} aria-label="Fit map" title="Fit map"><Maximize2 size={15} /></button>
        <button className="mindcloud-download" type="button" onClick={exportPng} disabled={exporting}><Download size={15} />{exporting ? 'Rendering…' : 'PNG'}</button>
      </div>
    </div>

    <div className="mindcloud-body">
      <div className="mindcloud-stage">
        <svg
          ref={svgRef}
          className={`mindcloud-canvas ${panning ? 'is-panning' : ''}`}
          onPointerDown={startPan}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
          role="application"
          aria-label="Mind map canvas"
        >
          <defs>
            <pattern id="mindcloud-dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.1" fill={theme.dots} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={theme.canvas} />
          <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
            {background === 'dots' && <rect x="-30000" y="-30000" width="60000" height="60000" fill="url(#mindcloud-dots)" />}

            {layout.edges.map((edge) => {
              const from = positions.get(edge.from)
              const to = positions.get(edge.to)
              if (!from || !to) return null
              const dir = to.x >= from.x ? 1 : -1
              const x1 = from.x + (dir * from.w) / 2
              const x2 = to.x - (dir * to.w) / 2
              const midX = (x1 + x2) / 2
              const colorIndex = from.colorIndex >= 0 ? from.colorIndex : to.colorIndex
              const color = theme.palette[colorIndex % theme.palette.length]
              return <path key={edge.id} d={`M${x1} ${from.y} C${midX} ${from.y} ${midX} ${to.y} ${x2} ${to.y}`} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" opacity="0.72" />
            })}

            {nodes.map((node) => {
              const position = positions.get(node.id)
              if (!position) return null
              const isRoot = position.level === 0
              const isBranch = position.level === 1
              const isSelected = node.id === selectedId
              const color = position.colorIndex >= 0 ? theme.palette[position.colorIndex % theme.palette.length] : theme.root
              const fill = isRoot || isBranch ? color : '#ffffff'
              const textColor = isRoot || isBranch ? '#ffffff' : '#28313a'
              return <g
                key={node.id}
                className={`mindcloud-node ${drag && drag.ids.includes(node.id) ? 'is-dragging' : ''}`}
                data-mindnode="true"
                transform={`translate(${position.x} ${position.y})`}
                onPointerDown={(event) => startNodeDrag(event, node)}
                onClick={(event) => { event.stopPropagation(); setSelectedId(node.id) }}
                onDoubleClick={() => { setSelectedId(node.id); focusEditor() }}
                role="button"
                tabIndex={-1}
                aria-label={`Node: ${node.text}`}
              >
                <rect
                  x={-position.w / 2}
                  y={-position.h / 2}
                  width={position.w}
                  height={position.h}
                  rx={isRoot ? 15 : 12}
                  fill={fill}
                  stroke={isBranch ? 'none' : color}
                  strokeWidth={isBranch ? 0 : 1.5}
                />
                {isSelected && <rect x={-position.w / 2 - 4} y={-position.h / 2 - 4} width={position.w + 8} height={position.h + 8} rx={isRoot ? 18 : 15} fill="none" stroke="#0a9f62" strokeWidth="2" strokeDasharray="5 3" />}
                <text
                  textAnchor="start"
                  fontFamily={FONT_STACK}
                  fontSize={position.font}
                  fontWeight={isRoot ? 700 : isBranch ? 650 : 550}
                  fill={textColor}
                  pointerEvents="none"
                >
                  {position.lines.map((line, index) => <tspan key={`${node.id}-${index}`} x={-position.w / 2 + 14} y={(index - (position.lines.length - 1) / 2) * 17 + 5}>{line}</tspan>)}
                </text>
              </g>
            })}

            {selectedPosition && <g
              className="mindcloud-add-bubble"
              transform={`translate(${selectedPosition.x + (selectedPosition.side === 'left' ? -(selectedPosition.w / 2 + 20) : selectedPosition.w / 2 + 20)} ${selectedPosition.y})`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => { event.stopPropagation(); addChild(selectedId) }}
              role="button"
              aria-label="Add a child node"
            >
              <circle r="11" fill="#0a9f62" />
              <path d="M-4.5 0h9M0-4.5v9" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </g>}
          </g>
        </svg>

        <p className="mindcloud-hint">Drag a node to move it · Drag empty canvas to pan · Scroll to zoom · Tab adds a child · Enter adds a sibling · Del removes</p>
        {notice && <p className="mindcloud-notice" role="status">{notice}</p>}
      </div>

      <aside className="mindcloud-inspector">
        <section className="mindcloud-panel">
          <div className="mindcloud-panel-head"><h2>Node</h2><span>{nodes.length} nodes · depth {depth}</span></div>
          <p className="mindcloud-path" title={trail}>{trail}</p>
          <label className="mindcloud-field">
            Label
            <textarea ref={editorRef} rows={2} maxLength={90} value={selected ? selected.text : ''} onChange={(event) => updateText(event.target.value)} placeholder={selected ? 'Type an idea…' : 'Select a node on the canvas'} disabled={!selected} />
          </label>
          <div className="mindcloud-node-actions">
            <button type="button" onClick={() => addChild()} disabled={!selected}><Plus size={13} /> Add child</button>
            <button type="button" onClick={addSibling} disabled={!selected || !selected.parentId}><Plus size={13} /> Add sibling</button>
            <button type="button" className="danger" onClick={deleteSelected} disabled={!selected || !selected.parentId}><Trash2 size={13} /> Delete</button>
          </div>
        </section>

        <section className="mindcloud-panel">
          <div className="mindcloud-panel-head"><h2>Theme</h2><span>{theme.name}</span></div>
          <div className="mindcloud-themes">
            {THEMES.map((entry) => <button key={entry.id} type="button" className={`mindcloud-theme ${entry.id === theme.id ? 'is-active' : ''}`} onClick={() => setThemeId(entry.id)} aria-pressed={entry.id === theme.id} aria-label={`${entry.name} theme`}>
              <span className="mindcloud-theme-chip" style={{ background: entry.canvas, borderColor: entry.palette[0] }}>
                <i style={{ background: entry.palette[0] }} /><i style={{ background: entry.palette[1] }} /><i style={{ background: entry.palette[2] }} />
              </span>
              <small>{entry.name}</small>
            </button>)}
          </div>
          <div className="mindcloud-row">
            <span>Canvas</span>
            <div className="mindcloud-segmented">
              <button type="button" className={background === 'dots' ? 'is-active' : ''} onClick={() => setBackground('dots')}>Dots</button>
              <button type="button" className={background === 'plain' ? 'is-active' : ''} onClick={() => setBackground('plain')}>Plain</button>
            </div>
          </div>
        </section>

        <section className="mindcloud-panel">
          <div className="mindcloud-panel-head"><h2>Templates</h2><span>Start fast</span></div>
          <div className="mindcloud-templates">
            {TEMPLATES.map((template) => <button key={template.id} type="button" onClick={() => applyTemplate(template)}>
              <strong>{template.title}</strong>
              <small>{template.nodes.length} nodes</small>
            </button>)}
          </div>
        </section>

        <section className="mindcloud-panel">
          <div className="mindcloud-panel-head"><h2>Export</h2><span>2× PNG</span></div>
          <div className="mindcloud-export">
            <button type="button" className="mindcloud-download wide" onClick={exportPng} disabled={exporting}><Download size={15} /> Download PNG</button>
            <div className="mindcloud-export-row">
              <button type="button" onClick={downloadJson}>Save .json</button>
              <button type="button" onClick={() => importRef.current?.click()}>Load .json</button>
              <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(event) => { void importMap(event.currentTarget.files?.[0] ?? null); event.currentTarget.value = '' }} />
            </div>
            <button type="button" className="mindcloud-reset" onClick={resetMap}><RotateCcw size={14} /> Reset to sample</button>
            <p>Everything stays in this browser. Nothing is uploaded.</p>
          </div>
        </section>
      </aside>
    </div>
  </section>
}
