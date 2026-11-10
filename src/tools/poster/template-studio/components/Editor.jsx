import React, { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import TemplateCanvas from './TemplateCanvas.jsx'
import Inspector from './Inspector.jsx'
import ToolBar from './ToolBar.jsx'
import {
  aspectOf, applyPalette, cloneDoc, makeAnnotation, makeBanner, makeContactCard, makeFooter, makeInk, makeNameCard, makeOrnament, makePhoto, makeRaster, makeShape, makeSocial, makeSticker, makeText, saveDesign, uid,
} from '../model.js'
import { SHAPE_DEFAULTS } from '../data/shapes.js'
import { POSTER_LOGOS, POSTER_TEMPLATES } from '../data/poster-templates.js'
import { BUILTIN_SCANNED_ELEMENTS, loadElements } from '../../elements.js'
import { downloadPng, downloadSlices } from '../export.js'
import { preparePhotoFile, removePhotoBackground } from '../photo.js'
import {
  DEFAULT_TOOL_SETTINGS, PRIMARY_TOOL_OF_GROUP, SHORTCUT_GROUPS, nextToolInGroup,
} from '../tools/registry.js'
import { createCanvas, layerDataUrl, loadImage } from '../tools/raster.js'
import {
  ArrowLeft, Close, Download, Layers, Redo, Save, Undo, ZoomIn, ZoomOut,
} from './Icons.jsx'

const HISTORY_LIMIT = 80

export default function Editor({
  initialDoc,
  designId: initialDesignId,
  designs,
  storageKey,
  onDesignsChange,
  onBack,
  onClose,
  onToast,
  onSave,
  languageLabel = '',
  backLabel = 'Templates',
  apiBase = '/api',
}) {
  const [doc, setDoc] = useState(() => cloneDoc(initialDoc))
  const docRef = useRef(doc)
  docRef.current = doc
  const [designId, setDesignId] = useState(initialDesignId || null)
  // The last id is the primary one the Inspector edits, so a marquee group can
  // be moved, deleted and pasted as a unit without a second selection model.
  const [selection, setSelection] = useState([])
  const selectionRef = useRef(selection)
  selectionRef.current = selection
  const selectedId = selection.length ? selection[selection.length - 1] : null
  const [editingId, setEditingId] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [cuttingId, setCuttingId] = useState(null)
  const [activeTool, setActiveTool] = useState('select')
  // Paint's "Transparent selection": marquee and lasso hit-test the visible
  // artwork instead of the empty box around it.
  const [transparentSelect, setTransparentSelect] = useState(false)
  // Photoshop-style tool options live outside the document so switching tools
  // keeps your brush size, colours and tolerance.
  const [settings, setSettings] = useState(DEFAULT_TOOL_SETTINGS)
  const [viewRotation, setViewRotation] = useState(0)
  const [panelOpen, setPanelOpen] = useState(() => (
    typeof window === 'undefined' ? true : window.innerWidth > 760
  ))
  const [hist, setHist] = useState({ undo: false, redo: false })
  const [library, setLibrary] = useState(() => loadElements())

  const pastRef = useRef([])
  const futureRef = useRef([])
  const gestureRef = useRef(null)
  const photoInputRef = useRef(null)
  const photoTargetRef = useRef(null)

  const syncHist = () => {
    setHist({ undo: pastRef.current.length > 0, redo: futureRef.current.length > 0 })
  }

  const apply = useCallback((next, opts = {}) => {
    const { history = true, immediate = false } = opts
    if (history) {
      pastRef.current.push(docRef.current)
      if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift()
      futureRef.current = []
    }
    const commit = () => {
      docRef.current = next
      setDoc(next)
      setDirty(true)
      syncHist()
    }
    if (immediate) flushSync(commit)
    else commit()
  }, [])

  const mutate = useCallback((updater, opts) => {
    apply(updater(docRef.current), opts)
  }, [apply])

  const patchDoc = useCallback((patch, opts) => {
    mutate((d) => ({ ...d, ...patch }), opts)
  }, [mutate])

  const patchEl = useCallback((id, patch, opts) => {
    mutate(
      (d) => ({ ...d, elements: d.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)) }),
      opts
    )
  }, [mutate])

  const beginGesture = useCallback(() => {
    gestureRef.current = docRef.current
  }, [])

  const endGesture = useCallback(() => {
    const snapshot = gestureRef.current
    gestureRef.current = null
    if (!snapshot || snapshot === docRef.current) return
    pastRef.current.push(snapshot)
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift()
    futureRef.current = []
    syncHist()
  }, [])

  const undo = useCallback(() => {
    const prev = pastRef.current.pop()
    if (!prev) return
    futureRef.current.push(docRef.current)
    docRef.current = prev
    setDoc(prev)
    setEditingId(null)
    setDirty(true)
    setSelection((ids) => ids.filter((id) => prev.elements.some((el) => el.id === id)))
    syncHist()
  }, [])

  const redo = useCallback(() => {
    const next = futureRef.current.pop()
    if (!next) return
    pastRef.current.push(docRef.current)
    docRef.current = next
    setDoc(next)
    setEditingId(null)
    setDirty(true)
    setSelection((ids) => ids.filter((id) => next.elements.some((el) => el.id === id)))
    syncHist()
  }, [])

  const endEdit = useCallback((id, text) => {
    setEditingId(null)
    if (text == null) return
    const el = docRef.current.elements.find((e) => e.id === id)
    if (!el) return
    // Name cards commit each field from its own blur handler.
    if (el.type === 'namecard') return
    const clean = text.replace(/\u00a0/g, ' ')
    if (clean === el.text) return
    patchEl(id, { text: clean }, { history: true })
  }, [patchEl])

  const commitField = useCallback((id, field, value) => {
    if (value == null) return
    const el = docRef.current.elements.find((e) => e.id === id)
    if (!el) return
    const clean = value.replace(/\u00a0/g, ' ')
    if (field.startsWith('social:')) {
      const itemId = field.slice(7)
      const socials = Array.isArray(el.socials) ? el.socials : []
      const current = socials.find((s) => s.id === itemId)
      if (!current || clean === current.handle) return
      patchEl(id, {
        socials: socials.map((s) => (s.id === itemId ? { ...s, handle: clean } : s)),
      }, { history: true })
      return
    }
    if (field.startsWith('contact:')) {
      const itemId = field.slice(8)
      const contacts = Array.isArray(el.contacts) ? el.contacts : []
      const current = contacts.find((c) => c.id === itemId)
      if (!current || clean === current.text) return
      patchEl(id, {
        contacts: contacts.map((c) => (c.id === itemId ? { ...c, text: clean } : c)),
      }, { history: true })
      return
    }
    if (clean === el[field]) return
    patchEl(id, { [field]: clean }, { history: true })
  }, [patchEl])

  const startEdit = useCallback((id) => {
    setSelection([id])
    setEditingId(id)
  }, [])

  const addElement = useCallback((el, opts = {}) => {
    const { behind = false } = opts
    mutate((d) => ({ ...d, elements: behind ? [el, ...d.elements] : [...d.elements, el] }))
    setSelection([el.id])
    return el
  }, [mutate])

  // x/y/w are % of the page width and h is in the same width units, so a drop
  // point has to be converted through the page ratio before it can be used.
  const placedAt = (el, at) => {
    if (!at || !Number.isFinite(at.xPct) || !Number.isFinite(at.yPct)) return el
    const ratio = aspectOf(docRef.current)
    const w = el.w ?? 20
    const hUnits = el.h ?? (el.aspect > 0 ? w / el.aspect : (el.size ?? 4) * 1.6)
    const hPct = hUnits * ratio
    const snap = (v, max) => Math.round(Math.min(Math.max(0, v), Math.max(0, max)) * 10) / 10
    return { ...el, x: snap(at.xPct - w / 2, 100 - w), y: snap(at.yPct - hPct / 2, 100 - hPct) }
  }

  const addText = (at) => addElement(placedAt(makeText({ x: 20, y: 44, size: 4.6, text: 'Your words here' }), at))
  const addBanner = (at) => addElement(placedAt(makeBanner(), at))
  const addNameCard = (at) => addElement(placedAt(makeNameCard(), at))
  const addContactCard = (at) => addElement(placedAt(makeContactCard(), at))
  const addTricolourCard = (at) => addSticker(BUILTIN_SCANNED_ELEMENTS[0], at)
  const addShape = (shape, at) => {
    if (shape === 'arch') {
      addElement(placedAt(makeShape('arch', { x: 32, y: 38, w: 36, h: 46, fill: 'none', stroke: 'accent', strokeWidth: 0.3 }), at))
      return
    }
    const preset = SHAPE_DEFAULTS[shape] || SHAPE_DEFAULTS.triangle
    addElement(placedAt(makeShape(shape, preset), at))
  }
  const addTextAt = useCallback((xPct, yPct) => {
    addElement(makeText({
      size: 4.6,
      text: 'Your words here',
      x: Math.min(84, Math.max(2, xPct - 12)),
      y: Math.min(90, Math.max(2, yPct - 2)),
    }))
    setActiveTool('select')
  }, [addElement])
  const addOrnament = (ornament, at) => addElement(placedAt(makeOrnament(ornament, { x: 40, y: 42, w: 20 }), at))
  const addPhoto = (at) => addElement(placedAt(makePhoto({ x: 61, y: 50 }), at))

  // A poster template is a page frame: its header and footer artwork sits at the
  // top and bottom edges of the PNG, so it is stretched onto the page (when the
  // two shapes are close) and knocked out with multiply so a background photo
  // keeps showing through the frame's plain middle.
  const addSticker = (entry, at) => {
    if (!entry?.src) return
    const ratio = aspectOf(docRef.current)
    const natural = Number(entry.aspect) > 0 ? Number(entry.aspect) : 1
    if (entry.page) {
      const onPhoto = docRef.current.bg?.type === 'image' && !!docRef.current.bg?.src
      const distortion = Math.max(ratio, natural) / Math.min(ratio, natural)
      const snap = (v) => Math.round(v * 10) / 10
      let box
      if (distortion <= 1.6) {
        box = { x: 0, y: 0, w: 100, aspect: ratio }
      } else if ((100 * ratio) / natural <= 100) {
        box = { x: 0, y: 0, w: 100, aspect: natural }
      } else {
        const w = snap((100 * natural) / ratio)
        box = { x: snap((100 - w) / 2), y: 0, w, aspect: natural }
      }
      const sticker = makeSticker(
        { src: entry.src, name: entry.name, aspect: entry.aspect, slots: entry.slots },
        { ...box, blend: onPhoto ? 'multiply' : 'normal' }
      )
      addElement(sticker, { behind: true })
      setActiveTool('select')
      onToast?.(
        distortion <= 1.6
          ? `${entry.name} frame fitted to the page — header and footer hug the edges`
          : `${entry.name} keeps its own shape — it sits at the page top`
      )
      return
    }
    const sticker = makeSticker({ src: entry.src, name: entry.name, aspect: entry.aspect, slots: entry.slots })
    addElement(placedAt(sticker, at))
    setActiveTool('select')
    onToast?.(`${entry.name} added`)
  }
  const addSocial = (platform, at) => addElement(placedAt(makeSocial(platform, { x: 44, y: 88, w: 4 }), at))
  const addFooter = (presetId, dropX, dropY) => {
    const base = makeFooter(presetId)
    const heightPct = base.h * aspectOf(docRef.current)
    const y = dropY == null
      ? Math.max(0, 100 - heightPct)
      : Math.min(Math.max(0, 100 - heightPct), Math.max(0, dropY - heightPct / 2))
    const x = base.w >= 100 ? 0 : Math.min(100 - base.w, Math.max(0, (dropX ?? 50) - base.w / 2))
    const footer = { ...base, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
    if (base.blank) {
      mutate((d) => ({ ...d, elements: [footer, ...d.elements] }))
      setSelection([footer.id])
      return
    }
    addElement(footer)
  }

  const dropElement = (payload, xPct, yPct) => {
    const at = { xPct, yPct }
    switch (payload?.kind) {
      case 'sticker': {
        const entry = [...POSTER_TEMPLATES, ...POSTER_LOGOS, ...library].find((item) => item.id === payload.id)
        if (entry) addSticker(entry, at)
        return
      }
      case 'text': addText(at); return
      case 'banner': addBanner(at); return
      case 'namecard': addNameCard(at); return
      case 'contactcard': addContactCard(at); return
      case 'tricolour_card': addTricolourCard(at); return
      case 'photo': addPhoto(at); return
      case 'shape': addShape(payload.id, at); return
      case 'social': addSocial(payload.id, at); return
      case 'ornament': addOrnament(payload.id, at); return
      default:
    }
  }

  const requestPhoto = useCallback((target) => {
    photoTargetRef.current = target
    photoInputRef.current?.click()
  }, [])

  const applyPhotoFile = useCallback(async (target, file) => {
    if (!target || !file) return
    onToast?.('Preparing image…')
    try {
      const src = await preparePhotoFile(file, apiBase)
      if (target === 'bg') {
        patchDoc({ bg: { ...docRef.current.bg, type: 'image', src } })
      } else if (typeof target === 'object' && target.kind === 'namecardLogo') {
        patchEl(target.cardId, { logo: src }, { history: true })
        setSelection([target.cardId])
        onToast?.('Card logo updated')
        return
      } else if (typeof target === 'object' && target.kind === 'stickerSlot') {
        mutate((d) => ({
          ...d,
          elements: d.elements.map((el) => (
            el.id !== target.stickerId
              ? el
              : {
                ...el,
                slots: (el.slots || []).map((slot) => (slot.id === target.slotId ? { ...slot, src } : slot)),
              }
          )),
        }))
        setSelection([target.stickerId])
        onToast?.('Photo added to the scanned element')
        return
      } else if (typeof target === 'object' && target.kind === 'footerItem') {
        mutate((d) => ({
          ...d,
          elements: d.elements.map((el) => (
            el.id !== target.footerId
              ? el
              : {
                ...el,
                items: (el.items || []).map((item) => (
                  item.id === target.itemId ? { ...item, icon: 'image', src } : item
                )),
              }
          )),
        }))
        setSelection([target.footerId])
        onToast?.('Footer image updated')
        return
      } else {
        patchEl(target, { src, panX: 0, panY: 0 })
        setSelection([target])
      }
      const el = docRef.current.elements.find((e) => e.id === target)
      onToast?.(
        el?.role === 'logo'
          ? 'Party logo updated — drag to move, Shift-drag to fit inside the frame'
          : 'Photo updated — drag to move, Shift-drag to fit inside the frame'
      )
    } catch (err) {
      onToast?.(err?.message || 'Could not use that image')
    }
  }, [apiBase, onToast, patchDoc, patchEl, mutate])

  const handlePhotoFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const target = photoTargetRef.current
    photoTargetRef.current = null
    applyPhotoFile(target, file)
  }

  const removeBackground = useCallback(async (id, tolerance) => {
    const el = docRef.current.elements.find((e) => e.id === id)
    if (!el?.src) {
      onToast?.('Add a photo first')
      return
    }
    setCuttingId(id)
    onToast?.('Removing background…')
    try {
      const src = await removePhotoBackground(el.src, { apiBase, tolerance })
      patchEl(id, { src, panX: 0, panY: 0, backdrop: 'none', borderWidth: 0 }, { history: true })
      onToast?.('Background removed — position the cut-out over the poster')
    } catch (err) {
      onToast?.(err?.message || 'Could not remove that background')
    } finally {
      setCuttingId(null)
    }
  }, [apiBase, onToast, patchEl])

  const removeSlotBackground = useCallback(async (stickerId, slotId, tolerance) => {
    const el = docRef.current.elements.find((e) => e.id === stickerId)
    const slot = el?.slots?.find((s) => s.id === slotId)
    if (!slot?.src) {
      onToast?.('Choose an image first')
      return
    }
    onToast?.('Removing background…')
    try {
      const src = await removePhotoBackground(slot.src, { apiBase, tolerance })
      mutate(
        (d) => ({
          ...d,
          elements: d.elements.map((e) => (
            e.id !== stickerId
              ? e
              : { ...e, slots: (e.slots || []).map((s) => (s.id === slotId ? { ...s, src } : s)) }
          )),
        }),
        { history: true }
      )
      onToast?.('Background removed from that area')
    } catch (err) {
      onToast?.(err?.message || 'Could not remove that background')
    }
  }, [apiBase, onToast, mutate])

  const cloneWithId = (el, step) => {
    const prefix = el.type === 'text' ? 't' : el.type === 'shape' ? 's' : el.type === 'photo' ? 'p'
      : el.type === 'social' ? 'sc' : el.type === 'footer' ? 'f' : el.type === 'sticker' ? 'st' : 'o'
    const copy = JSON.parse(JSON.stringify(el))
    copy.id = uid(prefix)
    copy.x = Math.min(copy.w ? 100 - copy.w : 90, (copy.x || 0) + step)
    copy.y = Math.min(92, (copy.y || 0) + step)
    return copy
  }

  const selectedElements = () => selectionRef.current
    .map((id) => docRef.current.elements.find((el) => el.id === id))
    .filter(Boolean)

  const duplicate = useCallback(() => {
    const copies = selectedElements().map((el) => cloneWithId(el, 3))
    if (!copies.length) return
    mutate((d) => ({ ...d, elements: [...d.elements, ...copies] }))
    setSelection(copies.map((c) => c.id))
  }, [mutate])

  const removeMany = useCallback((ids) => {
    const set = new Set(ids)
    if (!set.size) return
    mutate((d) => ({ ...d, elements: d.elements.filter((el) => !set.has(el.id)) }))
    setSelection((prev) => prev.filter((id) => !set.has(id)))
    setEditingId(null)
  }, [mutate])

  const remove = useCallback((id) => removeMany([id]), [removeMany])

  const clipboardRef = useRef([])
  const pasteStepRef = useRef(0)
  const [canPaste, setCanPaste] = useState(false)

  const copySelection = useCallback(() => {
    const picked = selectedElements()
    if (!picked.length) {
      onToast?.('Select something to copy first')
      return
    }
    clipboardRef.current = JSON.parse(JSON.stringify(picked))
    pasteStepRef.current = 0
    setCanPaste(true)
    onToast?.(picked.length > 1 ? `${picked.length} elements copied` : 'Element copied')
  }, [onToast])

  const cutSelection = useCallback(() => {
    const picked = selectedElements()
    if (!picked.length) {
      onToast?.('Select something to cut first')
      return
    }
    clipboardRef.current = JSON.parse(JSON.stringify(picked))
    pasteStepRef.current = 0
    setCanPaste(true)
    removeMany(picked.map((el) => el.id))
    onToast?.(picked.length > 1 ? `${picked.length} elements cut` : 'Element cut')
  }, [onToast, removeMany])

  const pasteClipboard = useCallback(() => {
    const items = clipboardRef.current
    if (!items.length) {
      onToast?.('Nothing to paste yet')
      return
    }
    pasteStepRef.current += 1
    const copies = items.map((el) => cloneWithId(el, pasteStepRef.current * 3))
    mutate((d) => ({ ...d, elements: [...d.elements, ...copies] }))
    setSelection(copies.map((c) => c.id))
    setActiveTool('select')
    onToast?.(copies.length > 1 ? `${copies.length} elements pasted` : 'Element pasted')
  }, [mutate, onToast])

  const selectAll = useCallback(() => {
    setSelection(docRef.current.elements.map((el) => el.id))
    setActiveTool('select')
  }, [])

  const invertSelection = useCallback(() => {
    const now = new Set(selectionRef.current)
    setSelection(docRef.current.elements.filter((el) => !now.has(el.id)).map((el) => el.id))
    setActiveTool('select')
  }, [])

  // A marquee drop replaces the selection; Shift keeps the previous picks.
  const selectMany = useCallback((ids, additive) => {
    if (!additive) setSelection(ids)
    else setSelection((prev) => [...new Set([...prev, ...ids])])
  }, [])

  const onSelectElement = useCallback((id, additive) => {
    if (id == null) {
      setSelection([])
      return
    }
    if (additive) {
      setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
      return
    }
    // The canvas skips this call while dragging a group member, so a plain
    // click here always isolates the one layer.
    setSelection([id])
  }, [])

  const setSelectionOpacity = useCallback((value) => {
    const set = new Set(selectionRef.current)
    if (!set.size) return
    mutate((d) => ({ ...d, elements: d.elements.map((el) => (set.has(el.id) ? { ...el, opacity: value } : el)) }), { history: false })
  }, [mutate])

  const reorder = useCallback((id, direction) => {
    mutate((d) => {
      const index = d.elements.findIndex((el) => el.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= d.elements.length) return d
      const elements = [...d.elements]
      const [el] = elements.splice(index, 1)
      elements.splice(target, 0, el)
      return { ...d, elements }
    })
  }, [mutate])

  const moveToEdge = useCallback((id, edge) => {
    mutate((d) => {
      const index = d.elements.findIndex((el) => el.id === id)
      if (index < 0) return d
      const elements = [...d.elements]
      const [el] = elements.splice(index, 1)
      if (edge === 'front') elements.push(el)
      else elements.unshift(el)
      return { ...d, elements }
    })
  }, [mutate])

  /* ---------- Photoshop tool plumbing ---------- */

  const commitPaintLayer = useCallback(({ src }) => {
    mutate((d) => {
      const layer = d.elements.find((el) => el.type === 'raster' && el.role === 'paint')
      if (layer) {
        return { ...d, elements: d.elements.map((el) => (el.id === layer.id ? { ...el, src } : el)) }
      }
      return { ...d, elements: [makeRaster({ src }), ...d.elements] }
    })
  }, [mutate])

  const addShapeBox = useCallback((box, toolId) => {
    const ratio = aspectOf(docRef.current) || 1
    const sides = Number(settings.shapeSides) || 6
    const shape =
      toolId === 'shape-ellipse' ? 'circle'
        : toolId === 'shape-line' ? 'line'
          : toolId === 'shape-polygon'
            ? (sides <= 3 ? 'triangle' : sides === 4 ? 'diamond' : sides === 5 ? 'pentagon' : 'hexagon')
            : 'rect'
    const preset = SHAPE_DEFAULTS[shape] || SHAPE_DEFAULTS.rect
    const fill = shape === 'line' && settings.shapeFill === 'none' ? settings.shapeStroke : settings.shapeFill
    addElement(makeShape(shape, {
      ...preset,
      x: box.x,
      y: box.y,
      w: Math.max(1, box.w),
      h: Math.max(0.2, box.h / ratio),
      fill,
      stroke: settings.shapeStroke,
      strokeWidth: settings.shapeStroke === 'none' ? 0 : (preset.strokeWidth ?? 0.3),
    }))
  }, [addElement, settings.shapeFill, settings.shapeSides, settings.shapeStroke])

  const addFrameBox = useCallback((box) => {
    const ratio = aspectOf(docRef.current) || 1
    addElement(makePhoto({
      x: box.x,
      y: box.y,
      w: Math.max(4, box.w),
      h: Math.max(4, box.h / ratio),
      src: '',
      role: 'frame',
      backdrop: 'none',
      tint: 'none',
      borderWidth: 1,
      borderColor: settings.shapeStroke === 'none' ? 'accent' : settings.shapeStroke,
      shape: 'rounded',
      radius: 1.2,
    }))
    onToast?.('Frame added — switch to Move and double-click it to add a photo')
  }, [addElement, onToast, settings.shapeStroke])

  const addNoteAt = useCallback((x, y, text) => {
    addElement(makeAnnotation('note', { x, y, text, color: settings.foreground }))
    onToast?.('Note added — notes never export')
  }, [addElement, onToast, settings.foreground])

  const addCountAt = useCallback((x, y) => {
    const next = docRef.current.elements.reduce(
      (max, el) => (el.type === 'annotation' && el.kind === 'count' ? Math.max(max, el.index || 0) : max),
      0
    ) + 1
    addElement(makeAnnotation('count', { x, y, index: next, color: settings.foreground }))
  }, [addElement, settings.foreground])

  const penCommit = useCallback((path) => {
    addElement(makeInk({ ...path, color: settings.foreground, size: settings.size, opacity: 1 }))
    onToast?.('Path added to the page')
  }, [addElement, onToast, settings.foreground, settings.size])

  const updateDirectPoints = useCallback((id, points) => {
    patchEl(id, { points }, { history: false })
  }, [patchEl])

  const sampleColor = useCallback((hex) => {
    setSettings((s) => ({ ...s, foreground: hex }))
    onToast?.(`Foreground set to ${hex}`)
  }, [onToast])

  const setCloneSource = useCallback((point) => {
    setSettings((s) => ({ ...s, cloneSource: point }))
  }, [])

  const rotateView = useCallback((deg) => {
    let next = Math.round(((deg % 360) + 360) % 360)
    if (next > 180) next -= 360
    setViewRotation(next)
  }, [])

  const zoomAt = useCallback((delta) => {
    setZoom((z) => Math.max(0.4, Math.min(2.4, Math.round((z + delta) * 10) / 10)))
  }, [])

  const addSlice = useCallback((slice) => {
    mutate((d) => ({ ...d, slices: [...(d.slices || []), { id: uid('slice'), ...slice }] }))
  }, [mutate])

  const removeSlice = useCallback((id) => {
    mutate((d) => ({ ...d, slices: (d.slices || []).filter((slice) => slice.id !== id) }))
  }, [mutate])

  const clearSlices = useCallback(() => {
    mutate((d) => ({ ...d, slices: [] }))
  }, [mutate])

  const annotationCount = doc.elements.filter((el) => el.type === 'annotation').length

  const clearAnnotations = useCallback(() => {
    mutate((d) => ({ ...d, elements: d.elements.filter((el) => el.type !== 'annotation') }))
  }, [mutate])

  const exportSliceSet = async () => {
    const slices = docRef.current.slices || []
    if (!slices.length) {
      onToast?.('Draw at least one slice first')
      return
    }
    setExporting(true)
    try {
      const count = await downloadSlices(docRef.current, slices, 2400)
      onToast?.(`${count} slice${count === 1 ? '' : 's'} exported`)
    } catch {
      onToast?.('Could not export the slices')
    } finally {
      setExporting(false)
    }
  }

  // Crop re-projects every layer into the kept rectangle, so the page keeps
  // its artwork instead of leaving elements outside the new canvas.
  const applyCropBox = async ({ x0, y0, x1, y1 }) => {
    const d = docRef.current
    const ratio = aspectOf(d) || 1
    const pageH = 100 / ratio
    const left = x0 * 100
    const top = y0 * pageH
    const width = Math.max(2, (x1 - x0) * 100)
    const height = Math.max(2, (y1 - y0) * pageH)
    const nextRatio = width / height
    const scale = 100 / width
    const snap = (v) => Math.round(v * 10) / 10
    const clampTo = (v, lo, hi) => Math.min(Math.max(lo, v), Math.max(lo, hi))
    const remapX = (x) => (x - left) * scale
    const remapY = (y) => ((y / 100) * pageH - top) * (100 / height)

    const mapSlice = (slice) => ({
      ...slice,
      x: snap(((slice.x / 100 - x0) / Math.max(0.0001, x1 - x0)) * 100),
      y: snap(((slice.y / 100 - y0) / Math.max(0.0001, y1 - y0)) * 100),
      w: snap(slice.w / (x1 - x0)),
      h: snap(slice.h / (y1 - y0)),
    })

    let croppedSrc = null
    const raster = d.elements.find((el) => el.type === 'raster' && el.src)
    if (raster) {
      try {
        const img = await loadImage(raster.src)
        const iw = img.naturalWidth || img.width
        const ih = img.naturalHeight || img.height
        const canvas = createCanvas(Math.round(iw * (x1 - x0)), Math.round(ih * (y1 - y0)))
        canvas.getContext('2d').drawImage(
          img,
          iw * x0, ih * y0, iw * (x1 - x0), ih * (y1 - y0),
          0, 0, canvas.width, canvas.height
        )
        croppedSrc = await layerDataUrl(canvas)
      } catch {
        croppedSrc = null
      }
    }

    mutate((current) => {
      const elements = current.elements.map((el) => {
        if (el.type === 'raster') return croppedSrc ? { ...el, src: croppedSrc } : el
        if (el.type === 'annotation') return { ...el, x: snap(remapX(el.x)), y: snap(remapY(el.y)) }
        const w = el.w != null ? snap(el.w * scale) : el.w
        const h = el.h != null ? snap(el.h * scale) : el.h
        const yMax = h != null ? 100 - h * nextRatio : 100
        return {
          ...el,
          x: snap(clampTo(remapX(el.x), 0, 100 - (w ?? 0))),
          y: snap(clampTo(remapY(el.y), 0, yMax)),
          ...(w != null ? { w } : {}),
          ...(h != null ? { h } : {}),
        }
      })
      return {
        ...current,
        aspect: Math.round(nextRatio * 1000) / 1000,
        elements,
        slices: (current.slices || []).map(mapSlice).filter((slice) => slice.w > 0 && slice.h > 0 && slice.x < 100 && slice.y < 100),
      }
    })
    onToast?.(`Cropped to ${Math.round(nextRatio * 100)}:100`)
  }

  const handleSave = async () => {
    if (onSave) {
      setSaving(true)
      try {
        const result = await onSave(docRef.current, designId)
        if (result?.id) setDesignId(result.id)
        setDirty(false)
        onToast?.(result?.id ? 'Draft saved — find it under My drafts' : 'Draft saved')
      } catch (err) {
        onToast?.(err?.message || 'Could not save this draft')
      } finally {
        setSaving(false)
      }
      return
    }
    const { entry, designs: next } = saveDesign(storageKey, designs, docRef.current, designId)
    setDesignId(entry.id)
    setDirty(false)
    onDesignsChange(next)
    onToast?.('Draft saved — find it under My drafts')
  }

  const handleDownload = async () => {
    setExporting(true)
    try {
      const size = await downloadPng(docRef.current)
      onToast?.(`HD PNG downloaded · ${size.width} × ${size.height}`)
    } catch {
      onToast?.('Could not export this design')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const sync = () => setLibrary(loadElements())
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target
      const tag = target?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable
      if (typing) return
      const meta = e.ctrlKey || e.metaKey
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (meta && e.key.toLowerCase() === 'd') {
        if (!selectedId) return
        e.preventDefault()
        duplicate()
      } else if (meta && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        selectAll()
      } else if (meta && e.key.toLowerCase() === 'c') {
        if (!selectionRef.current.length) return
        e.preventDefault()
        copySelection()
      } else if (meta && e.key.toLowerCase() === 'x') {
        if (!selectionRef.current.length) return
        e.preventDefault()
        cutSelection()
      } else if (meta && e.key.toLowerCase() === 'v') {
        if (!clipboardRef.current.length) return
        e.preventDefault()
        pasteClipboard()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selectionRef.current.length) return
        e.preventDefault()
        removeMany(selectionRef.current)
      } else if (!meta && (e.key === '[' || e.key === ']')) {
        e.preventDefault()
        const step = e.key === ']' ? 1 : -1
        setSettings((s) => ({ ...s, size: Math.max(0.4, Math.min(30, Math.round((s.size + step * 0.4) * 10) / 10)) }))
      } else if (!meta && e.key.toLowerCase() === 'k') {
        setActiveTool('frame')
      } else if (!meta && e.key.toLowerCase() === 'y') {
        setActiveTool('history-brush')
      } else if (!meta && SHORTCUT_GROUPS[e.key.toLowerCase()]) {
        e.preventDefault()
        const group = SHORTCUT_GROUPS[e.key.toLowerCase()]
        // Pressing the letter again cycles through that group, like Photoshop.
        setActiveTool((current) => (
          group.tools.some((t) => t.id === current)
            ? nextToolInGroup(group.id, current)
            : PRIMARY_TOOL_OF_GROUP[group.id]
        ))
      } else if (e.key === 'Escape') {
        setActiveTool('select')
        if (editingId) setEditingId(null)
        else if (selectedId) setSelection([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, editingId, undo, redo, duplicate, removeMany, selectAll, copySelection, cutSelection, pasteClipboard, setActiveTool])

  const selected = doc.elements.find((el) => el.id === selectedId) || null
  const ratio = aspectOf(doc)
  const [canvasResizeState, setCanvasResizeState] = useState(null)

  const beginCanvasLengthResize = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const stageShell = e.currentTarget.closest('.ts-stage-shell')
    if (!stageShell) return
    const rect = stageShell.getBoundingClientRect()
    const startY = e.clientY
    const startHeight = rect.height
    const startWidth = rect.width
    let moved = false
    let currentRatio = ratio

    const onPointerMove = (ev) => {
      const dy = ev.clientY - startY
      if (!moved) {
        if (Math.abs(dy) < 3) return
        moved = true
        beginGesture()
      }
      const newHeight = Math.max(100, startHeight + dy)
      // ratio = width / height
      const newRatio = Math.max(0.2, Math.min(4.0, startWidth / newHeight))
      const roundedRatio = Math.round(newRatio * 1000) / 1000
      currentRatio = roundedRatio
      setCanvasResizeState({
        w: Math.round(startWidth),
        h: Math.round(newHeight),
        ratio: roundedRatio,
      })
      mutate((d) => ({
        ...d,
        aspect: roundedRatio,
        bg: d.bg?.type === 'image' && d.bg.src ? { ...d.bg, fit: 'cover' } : d.bg,
      }), { history: false })
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      setCanvasResizeState(null)
      if (moved) {
        endGesture()
        patchDoc({
          aspect: currentRatio,
          bg: docRef.current.bg?.type === 'image' && docRef.current.bg.src ? { ...docRef.current.bg, fit: 'cover' } : docRef.current.bg,
        }, { history: true })
        onToast?.(`Poster length updated (${currentRatio}:1)`)
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  const beginCanvasCornerResize = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const stageShell = e.currentTarget.closest('.ts-stage-shell')
    if (!stageShell) return
    const rect = stageShell.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = rect.width
    const startHeight = rect.height
    let moved = false
    let currentRatio = ratio

    const onPointerMove = (ev) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!moved) {
        if (Math.abs(dx) + Math.abs(dy) < 3) return
        moved = true
        beginGesture()
      }
      const newWidth = Math.max(100, startWidth + dx)
      const newHeight = Math.max(100, startHeight + dy)
      const newRatio = Math.max(0.2, Math.min(4.0, newWidth / newHeight))
      const roundedRatio = Math.round(newRatio * 1000) / 1000
      currentRatio = roundedRatio
      setCanvasResizeState({
        w: Math.round(newWidth),
        h: Math.round(newHeight),
        ratio: roundedRatio,
      })
      mutate((d) => ({
        ...d,
        aspect: roundedRatio,
        bg: d.bg?.type === 'image' && d.bg.src ? { ...d.bg, fit: 'cover' } : d.bg,
      }), { history: false })
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      setCanvasResizeState(null)
      if (moved) {
        endGesture()
        patchDoc({
          aspect: currentRatio,
          bg: docRef.current.bg?.type === 'image' && docRef.current.bg.src ? { ...docRef.current.bg, fit: 'cover' } : docRef.current.bg,
        }, { history: true })
        onToast?.(`Poster size updated (${currentRatio}:1)`)
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  const replacePhoto = () => {
    if (selected?.type === 'photo' || selected?.type === 'sticker') {
      requestPhoto(selected.id)
      return
    }
    const photo = makePhoto({ x: 57, y: 48 })
    addElement(photo)
    requestPhoto(photo.id)
  }

  const flipSelected = (axis) => {
    if (!selected || (selected.type !== 'photo' && selected.type !== 'sticker')) {
      onToast?.('Select a photo or scanned element first')
      return
    }
    patchEl(selected.id, axis === 'x' ? { flipX: !selected.flipX } : { flipY: !selected.flipY }, { history: true })
  }

  const fitSelected = () => {
    if (selected?.type !== 'photo') {
      onToast?.('Select a photo first')
      return
    }
    patchEl(selected.id, { fit: selected.fit === 'contain' ? 'cover' : 'contain' }, { history: true })
  }

  const extendSelected = () => {
    if (!selected) {
      onToast?.('Select an element first')
      return
    }
    const pageHeight = Math.round((100 / ratio) * 10) / 10
    if (selected.type === 'photo') {
      patchEl(selected.id, { x: 0, y: 0, w: 100, h: pageHeight }, { history: true })
    } else if (selected.type === 'sticker') {
      patchEl(selected.id, { x: 0, y: 0, w: 100, aspect: Math.round((100 / pageHeight) * 1000) / 1000 }, { history: true })
    } else {
      onToast?.('Only photos and scanned elements can fill the page')
    }
  }

  const adjustSelected = (patch, commit = false) => {
    if (selected?.type !== 'photo') return
    const filters = { brightness: 100, contrast: 100, saturate: 100, ...(selected.filters || {}), ...patch }
    patchEl(selected.id, { filters }, { history: commit })
  }

  const removeSelectedBackground = () => {
    if (!selected?.src) {
      onToast?.('Select a photo or scanned element first')
      return
    }
    removeBackground(selected.id)
  }

  return (
    <div className={`ts-editor-root${panelOpen ? '' : ' panel-hidden'}`}>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={handlePhotoFile}
      />
      <header className="ts-topbar ts-editor-bar">
        <button type="button" className="ts-back" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>{backLabel}</span>
        </button>
        <span className="ts-bar-divider" />
        <div className="ts-doc-meta">
          <input
            className="ts-doc-name"
            value={doc.name}
            aria-label="Design name"
            onChange={(e) => patchDoc({ name: e.target.value }, { history: false })}
          />
          <span className="ts-doc-sub">
            {doc.category}
            {languageLabel ? ` · ${languageLabel}` : ''}
            <span className={`ts-save-state${dirty ? ' is-dirty' : ''}`}>
              {dirty ? ' · Unsaved changes' : ' · Saved'}
            </span>
          </span>
        </div>
        <div className="ts-top-actions">
          <div className="ts-history">
            <button type="button" className="ts-icon-btn" onClick={undo} disabled={!hist.undo} title="Undo (Ctrl+Z)">
              <Undo size={16} />
            </button>
            <button type="button" className="ts-icon-btn" onClick={redo} disabled={!hist.redo} title="Redo (Ctrl+Shift+Z)">
              <Redo size={16} />
            </button>
          </div>
          <button type="button" className="ts-btn ts-btn-ghost ts-download" onClick={handleDownload} disabled={exporting}>
            <Download size={15} />
            <span>{exporting ? 'Exporting…' : 'PNG · HD'}</span>
          </button>
          <button type="button" className="ts-btn ts-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={15} />
            <span>{saving ? 'Saving…' : 'Save draft'}</span>
          </button>
          <button type="button" className="ts-icon-btn ts-mobile-only" onClick={() => setPanelOpen((v) => !v)} title="Design panel">
            <Layers size={16} />
          </button>
          <button type="button" className="ts-icon-btn ts-close" onClick={onClose} title="Close studio">
            <Close size={18} />
          </button>
        </div>
      </header>

      <div className="ts-editor-body">
        <ToolBar
          tool={activeTool}
          onTool={setActiveTool}
          selected={selected}
          selectionCount={selection.length}
          onReplacePhoto={replacePhoto}
          onFlip={flipSelected}
          onFit={fitSelected}
          onRemoveBg={removeSelectedBackground}
          onAdjust={adjustSelected}
          onExtend={extendSelected}
          onAddShape={addShape}
          onDelete={() => removeMany(selectionRef.current)}
          onDuplicate={duplicate}
          onCut={cutSelection}
          onCopy={copySelection}
          onPaste={pasteClipboard}
          canPaste={canPaste}
          onSelectAll={selectAll}
          onInvert={invertSelection}
          transparentSelect={transparentSelect}
          onTransparentSelect={() => setTransparentSelect((v) => !v)}
          onSelectionOpacity={setSelectionOpacity}
          onUndo={undo}
          onRedo={redo}
          canUndo={hist.undo}
          canRedo={hist.redo}
          onZoom={zoomAt}
          onDeselect={() => setSelection([])}
          onBegin={beginGesture}
          onEnd={endGesture}
          settings={settings}
          onSettings={setSettings}
          doc={doc}
          onExportSlices={exportSliceSet}
          onClearSlices={clearSlices}
          onClearAnnotations={clearAnnotations}
          annotationCount={annotationCount}
          viewRotation={viewRotation}
          onRotate={rotateView}
          onResetRotation={() => setViewRotation(0)}
          onNotice={onToast}
        />

        <div className="ts-editor">
          <div className="ts-canvas-area">
            <div className="ts-canvas-scroll">
              <div
                className="ts-stage-shell"
                style={{
                  '--ts-ar': ratio,
                  '--ts-zoom': zoom,
                  aspectRatio: ratio,
                  transform: viewRotation ? `rotate(${viewRotation}deg)` : undefined,
                }}
              >
                <TemplateCanvas
                  doc={doc}
                  interactive
                  selectedId={selectedId}
                  selectedIds={selection}
                  editingId={editingId}
                  onSelect={onSelectElement}
                  onSelectMany={selectMany}
                  transparentSelect={transparentSelect}
                  onPatchElement={patchEl}
                  onStartEdit={startEdit}
                  onEndEdit={endEdit}
                  onCommitField={commitField}
                  onRequestPhoto={requestPhoto}
                  onDropPhoto={applyPhotoFile}
                  onDropFooter={addFooter}
                  onDropElement={dropElement}
                  onPatchBg={(patch, opts) => patchDoc({ bg: { ...doc.bg, ...patch } }, opts)}
                  onGestureStart={beginGesture}
                  onGestureEnd={endGesture}
                  tool={activeTool}
                  settings={settings}
                  viewRotation={viewRotation}
                  onAddTextAt={addTextAt}
                  onDeleteElement={remove}
                  onPaintCommit={commitPaintLayer}
                  onAddShapeBox={addShapeBox}
                  onAddFrameBox={addFrameBox}
                  onAddNoteAt={addNoteAt}
                  onAddCountAt={addCountAt}
                  onAddSlice={addSlice}
                  onRemoveSlice={removeSlice}
                  onCropApply={applyCropBox}
                  onSampleColor={sampleColor}
                  onSetCloneSource={setCloneSource}
                  onPenCommit={penCommit}
                  onRotate={rotateView}
                  onZoomAt={zoomAt}
                  onNotice={onToast}
                  onDirectPoints={updateDirectPoints}
                />
                <div
                  className={`ts-stage-resize-bar${canvasResizeState ? ' is-dragging' : ''}`}
                  title="Drag up or down to adjust poster length (height)"
                  onPointerDown={beginCanvasLengthResize}
                >
                  <div className="ts-stage-resize-pill">
                    <span className="ts-stage-resize-grip" />
                    <span>
                      {canvasResizeState
                        ? `Poster Length: ${canvasResizeState.h}px (${canvasResizeState.ratio}:1)`
                        : 'Drag to adjust poster length ↕'}
                    </span>
                  </div>
                </div>
                <div
                  className="ts-stage-resize-corner"
                  title="Drag corner to adjust poster dimensions"
                  onPointerDown={beginCanvasCornerResize}
                />
              </div>
            </div>

            <div className="ts-zoom">
              <button type="button" onClick={() => zoomAt(-0.1)} title="Zoom out">
                <ZoomOut size={15} />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => zoomAt(0.1)} title="Zoom in">
                <ZoomIn size={15} />
              </button>
            </div>

            <button type="button" className="ts-panel-toggle ts-mobile-only" onClick={() => setPanelOpen((v) => !v)}>
              {panelOpen ? 'Hide design panel' : 'Design panel'}
            </button>
          </div>

          <Inspector
            doc={doc}
            selected={selected}
            onSelect={(id) => { setSelection(id ? [id] : []); setEditingId(null) }}
            onPatchDoc={patchDoc}
            onPatchEl={patchEl}
            onBegin={beginGesture}
            onEnd={endGesture}
            onApplyPalette={(id) => mutate((d) => applyPalette(d, id))}
            onDuplicate={duplicate}
            onDelete={remove}
            onReorder={reorder}
            onMoveToEdge={moveToEdge}
            onAddText={addText}
            onAddBanner={addBanner}
            onAddNameCard={addNameCard}
            onAddContactCard={addContactCard}
            onAddTricolourCard={addTricolourCard}
            onAddShape={addShape}
            onAddOrnament={addOrnament}
            onAddPhoto={addPhoto}
            onAddSocial={addSocial}
            onAddFooter={addFooter}
            onAddSticker={addSticker}
            templateElements={POSTER_TEMPLATES}
            logoElements={POSTER_LOGOS}
            scannedElements={library}
            onRequestPhoto={requestPhoto}
            onRemoveBackground={removeBackground}
            onRemoveSlotBackground={removeSlotBackground}
            cutting={cuttingId === selected?.id}
          />
        </div>
      </div>
    </div>
  )
}
