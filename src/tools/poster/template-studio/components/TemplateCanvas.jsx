import React, { useEffect, useRef, useState } from 'react'
import { aspectOf, resolve } from '../model.js'
import { backgroundCss, fontStack } from '../data/presets.js'
import { ornamentMarkup } from '../data/ornaments.js'
import { bannerFlourishSvg } from '../data/banners.js'
import { socialMarkup, brandSocialMarkup, isDarkColor } from '../data/socials.js'
import { contactMarkup } from '../data/namecards.js'
import { SHAPE_GEOMETRY, isPathShape } from '../data/shapes.js'
import { Photo } from './Icons.jsx'
import {
  LASSO_TOOLS, MARQUEE_TOOLS, PAINT_TOOLS, SOURCE_PAINT_TOOLS,
} from '../tools/registry.js'
import {
  clamp,
  colorDistance,
  fillGradient,
  layerDataUrl,
  loadImage,
  paintBucket,
  paintPatchLine,
  paintStamp,
  paintStroke,
  patchRect,
  renderUnderlay,
  samplePageColor,
  smudgeLine,
} from '../tools/raster.js'

function TextBody({ el, editing, selected, handles, style, boxStyle, onCommit, onPointerDown, onResize, onStartEdit, removeBtn }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!editing) return
    const node = ref.current
    if (!node) return
    node.focus()
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(node)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
  }, [editing])

  return (
    <div
      ref={ref}
      data-el={el.id}
      data-el-type="text"
      className={`ts-el ts-text${selected ? ' is-selected' : ''}${editing ? ' is-editing' : ''}`}
      style={style}
      contentEditable={editing || undefined}
      suppressContentEditableWarning
      spellCheck={false}
      onPointerDown={(e) => {
        if (editing) e.stopPropagation()
        if (e.target.closest?.('.ts-resize') || e.target.closest?.('.ts-el-remove-btn')) {
          e.stopPropagation()
          return
        }
        onPointerDown?.(e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!editing) onStartEdit?.(el.id)
      }}
      onBlur={(e) => {
        if (editing) onCommit?.(el.id, e.currentTarget.innerText)
      }}
      onKeyDown={(e) => {
        if (!editing) return
        e.stopPropagation()
        if (e.key === 'Escape') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
    >
      {boxStyle && <span className="ts-text-bg" aria-hidden="true" style={boxStyle} />}
      {el.text}
      {handles && <ResizeHandles onResize={onResize} />}
      {removeBtn}
    </div>
  )
}

function ResizeHandles({ onResize, showSides = true }) {
  const handlePointerDown = (e, dir) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.nativeEvent?.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation()
    }
    onResize?.(e, dir)
  }

  return (
    <>
      <span
        className="ts-resize ts-resize--se"
        title="Drag corner to resize width and height"
        onPointerDown={(e) => handlePointerDown(e, 'se')}
      />
      <span
        className="ts-resize ts-resize--sw"
        title="Drag corner to resize width and height"
        onPointerDown={(e) => handlePointerDown(e, 'sw')}
      />
      <span
        className="ts-resize ts-resize--ne"
        title="Drag corner to resize width and height"
        onPointerDown={(e) => handlePointerDown(e, 'ne')}
      />
      <span
        className="ts-resize ts-resize--nw"
        title="Drag corner to resize width and height"
        onPointerDown={(e) => handlePointerDown(e, 'nw')}
      />
      {showSides && (
        <>
          <span
            className="ts-resize ts-resize--s"
            title="Drag to increase or decrease length (height)"
            onPointerDown={(e) => handlePointerDown(e, 's')}
          >
            <span className="ts-resize-bar" />
          </span>
          <span
            className="ts-resize ts-resize--n"
            title="Drag to adjust length from top"
            onPointerDown={(e) => handlePointerDown(e, 'n')}
          >
            <span className="ts-resize-bar" />
          </span>
          <span
            className="ts-resize ts-resize--e"
            title="Drag to adjust width"
            onPointerDown={(e) => handlePointerDown(e, 'e')}
          >
            <span className="ts-resize-bar" />
          </span>
          <span
            className="ts-resize ts-resize--w"
            title="Drag to adjust width from left"
            onPointerDown={(e) => handlePointerDown(e, 'w')}
          >
            <span className="ts-resize-bar" />
          </span>
        </>
      )}
    </>
  )
}

function defaultHeightOf(el) {
  if (el.h != null && Number.isFinite(Number(el.h))) return Number(el.h)
  if (el.type === 'namecard') return 24
  if (el.type === 'contactcard') return 30
  if (el.type === 'banner') return 13
  if (el.type === 'footer') return 7.2
  if (el.type === 'sticker') return el.aspect > 0 ? el.w / el.aspect : el.w
  if (el.type === 'shape' || el.type === 'photo') return el.w
  if (el.type === 'text') return (el.size ?? 4.6) * 2
  return 10
}

function BannerBody({
  el, editing, selected, handles, removeBtn,
  plateStyle, textStyle, ornamentColor, innerColor,
  onCommit, onPointerDown, onResize, onStartEdit,
}) {
  const textRef = useRef(null)

  useEffect(() => {
    if (!editing) return
    const node = textRef.current
    if (!node) return
    node.focus()
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(node)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
  }, [editing])

  const ornament = el.ornaments ? bannerFlourishSvg(ornamentColor) : ''

  return (
    <div
      data-el={el.id}
      data-el-type="banner"
      className={`ts-el ts-banner${selected ? ' is-selected' : ''}${editing ? ' is-editing' : ''}${el.ornaments ? ' has-ornaments' : ''}`}
      style={plateStyle}
      onPointerDown={(e) => {
        if (e.target.closest?.('.ts-resize') || e.target.closest?.('.ts-el-remove-btn')) {
          e.stopPropagation()
          return
        }
        onPointerDown?.(e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!editing) onStartEdit?.(el.id)
      }}
    >
      {el.inner && (
        <span className="ts-banner-inner" style={{ borderColor: innerColor }} />
      )}
      {el.ornaments && (
        <>
          <span
            className="ts-banner-ornament ts-banner-ornament--left"
            style={{ color: ornamentColor }}
            dangerouslySetInnerHTML={{ __html: ornament }}
          />
          <span
            className="ts-banner-ornament ts-banner-ornament--right"
            style={{ color: ornamentColor }}
            dangerouslySetInnerHTML={{ __html: ornament }}
          />
        </>
      )}
      <span
        ref={textRef}
        className="ts-banner-text"
        contentEditable={editing || undefined}
        suppressContentEditableWarning
        spellCheck={false}
        style={textStyle}
        onPointerDown={(e) => { if (editing) e.stopPropagation() }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (!editing) onStartEdit?.(el.id)
        }}
        onBlur={(e) => {
          if (editing) onCommit?.(el.id, e.currentTarget.innerText)
        }}
        onKeyDown={(e) => {
          if (!editing) return
          e.stopPropagation()
          if (e.key === 'Escape') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
      >
        {el.text}
      </span>
      {handles && <ResizeHandles onResize={onResize} />}
      {removeBtn}
    </div>
  )
}

function NameCardBody({
  el, editing, selected, handles, removeBtn,
  wrapperStyle, sheetStyle, nameStyle, titleStyle, socialsStyle, iconStyle,
  logoStyle, barStyle, contactIconStyle,
  onCommitField, onEndEdit, onPointerDown, onRequestLogo, onResize, onStartEdit,
}) {
  const rootRef = useRef(null)
  const focusRef = useRef('name')
  const wasEditingRef = useRef(false)

  useEffect(() => {
    if (editing) {
      wasEditingRef.current = true
      const root = rootRef.current
      const node = root?.querySelector(`[data-field="${focusRef.current}"]`) || root?.querySelector('[data-field="name"]')
      if (!node) return
      node.focus()
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(node)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
      return
    }
    if (!wasEditingRef.current) return
    wasEditingRef.current = false
    const root = rootRef.current
    if (!root) return
    // Ending the session can drop contentEditable before a blur fires, so pull
    // whatever is still on screen into the document.
    root.querySelectorAll('[data-field]').forEach((node) => {
      onCommitField?.(el.id, node.getAttribute('data-field'), node.innerText)
    })
  }, [editing])

  const platformsOf = (item) => [item.platform, item.platform2].filter((p) => p && p !== 'none')

  const editableProps = (field) => ({
    'data-field': field,
    contentEditable: editing || undefined,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onPointerDown: (e) => { if (editing) e.stopPropagation() },
    onDoubleClick: (e) => {
      e.stopPropagation()
      if (!editing) {
        focusRef.current = field
        onStartEdit?.(el.id, field)
      }
    },
    onBlur: (e) => onCommitField?.(el.id, field, e.currentTarget.innerText),
    onKeyDown: (e) => {
      if (!editing) return
      e.stopPropagation()
      if (e.key === 'Escape') {
        e.preventDefault()
        e.currentTarget.blur()
        onEndEdit?.(el.id, null)
      }
    },
  })

  const socials = Array.isArray(el.socials) ? el.socials : []
  const contacts = Array.isArray(el.contacts) ? el.contacts : []

  return (
    <div
      ref={rootRef}
      data-el={el.id}
      data-el-type="namecard"
      className={`ts-el ts-namecard align-${el.align || 'left'}${selected ? ' is-selected' : ''}${editing ? ' is-editing' : ''}`}
      style={wrapperStyle}
      onPointerDown={(e) => {
        if (e.target.closest?.('.ts-resize') || e.target.closest?.('.ts-el-remove-btn')) {
          e.stopPropagation()
          return
        }
        onPointerDown?.(e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!editing) onStartEdit?.(el.id)
      }}
    >
      <div className="ts-namecard-sheet" style={sheetStyle}>
        <div className="ts-namecard-body">
          {el.logo && (
            <span
              className="ts-namecard-logo"
              style={logoStyle}
              title="Double-click to change the logo"
              onDoubleClick={(e) => {
                e.stopPropagation()
                if (!editing) onRequestLogo?.()
              }}
            >
              <img src={el.logo} alt="" draggable={false} />
            </span>
          )}
          <span className="ts-namecard-copy">
            <span className="ts-namecard-name" style={nameStyle} {...editableProps('name')}>
              {el.name}
            </span>
            {(el.title || editing) && (
              <span className="ts-namecard-title" style={titleStyle} {...editableProps('title')}>
                {el.title}
              </span>
            )}
            {socials.length > 0 && (
              <span className="ts-namecard-socials" style={socialsStyle}>
                {socials.map((item) => (
                  <span className="ts-namecard-social" key={item.id}>
                    {platformsOf(item).map((platform) => (
                      <span className="ts-namecard-icon" key={platform} style={iconStyle}>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          dangerouslySetInnerHTML={{
                            __html: el.icons === 'brand'
                              ? brandSocialMarkup(platform, { dark: false, gid: `tsnc-${el.id}-${item.id}-${platform}` })
                              : socialMarkup(platform),
                          }}
                        />
                      </span>
                    ))}
                    <span className="ts-namecard-handle" {...editableProps(`social:${item.id}`)}>
                      {item.handle}
                    </span>
                  </span>
                ))}
              </span>
            )}
          </span>
        </div>
        {contacts.length > 0 && (
          <div className="ts-namecard-bar" style={barStyle}>
            {contacts.map((item) => (
              <span className="ts-namecard-contact" key={item.id}>
                <span
                  className="ts-namecard-contact-icon"
                  style={contactIconStyle}
                  dangerouslySetInnerHTML={{ __html: contactMarkup(item.kind) }}
                />
                <span className="ts-namecard-contact-text" {...editableProps(`contact:${item.id}`)}>
                  {item.text}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
      {handles && <ResizeHandles onResize={onResize} />}
    </div>
  )
}

function pointInPolygon(x, y, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]
    const yi = poly[i][1]
    const xj = poly[j][0]
    const yj = poly[j][1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

// Paint's transparent selection: hit-test the artwork instead of the box that
// holds it, so letterboxed photos only answer where pixels actually exist.
function visibleRect(node, transparent) {
  if (!transparent) return node.getBoundingClientRect()
  let box = null
  node.querySelectorAll('img, svg').forEach((inner) => {
    const r = inner.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return
    box = box
      ? {
          left: Math.min(box.left, r.left),
          top: Math.min(box.top, r.top),
          right: Math.max(box.right, r.right),
          bottom: Math.max(box.bottom, r.bottom),
        }
      : { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
  })
  if (!box) return node.getBoundingClientRect()
  return { ...box, width: box.right - box.left, height: box.bottom - box.top }
}

export default function TemplateCanvas({
  doc,
  interactive = false,
  selectedId,
  selectedIds = [],
  editingId,
  onSelect,
  onSelectMany,
  transparentSelect = false,
  onPatchElement,
  onStartEdit,
  onEndEdit,
  onCommitField,
  onRequestPhoto,
  onDropPhoto,
  onDropFooter,
  onDropElement,
  onPatchBg,
  onGestureStart,
  onGestureEnd,
  tool = 'select',
  settings = {},
  viewRotation = 0,
  onAddTextAt,
  onDeleteElement,
  onPaintCommit,
  onAddShapeBox,
  onAddFrameBox,
  onAddNoteAt,
  onAddCountAt,
  onAddSlice,
  onRemoveSlice,
  onCropApply,
  onCropCancel,
  onSampleColor,
  onSetCloneSource,
  onPenCommit,
  onRotate,
  onZoomAt,
  onNotice,
  onDirectPoints,
  className = '',
}) {
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const listenersRef = useRef(null)
  const resizeRef = useRef(null)
  const [dropId, setDropId] = useState(null)
  const [selShape, setSelShape] = useState(null)
  const [frameBox, setFrameBox] = useState(null)
  const [cropBox, setCropBox] = useState(null)
  const [cropMeta, setCropMeta] = useState(null)
  const [slicePreview, setSlicePreview] = useState(null)
  const [quickCircle, setQuickCircle] = useState(null)
  const [ruler, setRuler] = useState(null)
  const [penPoints, setPenPoints] = useState([])
  const [penCursor, setPenCursor] = useState(null)
  const [directDrag, setDirectDrag] = useState(null)
  const [paintActive, setPaintActive] = useState(false)
  const [drawBox, setDrawBox] = useState(null)
  const [noteDraft, setNoteDraft] = useState(null)
  const selectRef = useRef(null)
  const polyRef = useRef([])
  const penRef = useRef([])
  const paintRef = useRef(null)
  const paintHostRef = useRef(null)
  const paintBusyRef = useRef(false)
  const cursorRef = useRef({ x: 0, y: 0 })
  const docRef = useRef(doc)
  docRef.current = doc
  const onPatchBgRef = useRef(onPatchBg)
  onPatchBgRef.current = onPatchBg
  const bgImage = doc.bg.type === 'image' && !!doc.bg.src
  const directTarget = tool === 'direct-select' ? doc.elements.find((el) => el.id === selectedId) : null
  const paintTool = PAINT_TOOLS.has(tool)
  const marqueeMode = MARQUEE_TOOLS[tool] || null
  const lassoTool = LASSO_TOOLS.has(tool) ? tool : null

  const offPointer = (l) => {
    if (!l) return
    window.removeEventListener('pointermove', l.move)
    window.removeEventListener('pointerup', l.up)
    window.removeEventListener('pointercancel', l.cancel || l.up)
  }

  useEffect(() => () => {
    offPointer(listenersRef.current)
    resizeRef.current?.()
    selectRef.current?.()
  }, [])

  useEffect(() => {
    const node = stageRef.current
    if (!node || !interactive) return
    let timer = null
    let zooming = false
    const onWheel = (e) => {
      const bg = docRef.current.bg
      if (bg.type !== 'image' || !bg.src) return
      e.preventDefault()
      if (!zooming) {
        zooming = true
        onGestureStart?.()
      }
      const zoom = Math.min(4, Math.max(1, (bg.zoom ?? 1) * (1 - e.deltaY * 0.0015)))
      onPatchBgRef.current?.({ zoom }, { history: false })
      clearTimeout(timer)
      timer = setTimeout(() => {
        zooming = false
        onGestureEnd?.()
      }, 350)
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      node.removeEventListener('wheel', onWheel)
      clearTimeout(timer)
    }
  }, [interactive, onGestureStart, onGestureEnd])

  // Every tool owns transient overlays; changing tools clears the last one so
  // a crop box never lingers under the brush.
  useEffect(() => {
    setCropBox(null)
    setCropMeta(null)
    setSlicePreview(null)
    setQuickCircle(null)
    setRuler(null)
    setPenPoints([])
    setPenCursor(null)
    setDirectDrag(null)
    setSelShape(null)
    setDrawBox(null)
    setNoteDraft(null)
    polyRef.current = []
    penRef.current = []
  }, [tool])

  // Paint keeps a marching-ants frame over the selection once the mouse is
  // released, and the frame itself can be grabbed to move the group.
  useEffect(() => {
    if (!interactive || selectedIds.length <= 1 || editingId) {
      setFrameBox(null)
      return
    }
    const measure = () => {
      const stage = stageRef.current
      if (!stage) return
      const s = stage.getBoundingClientRect()
      if (!s.width) return
      const wanted = new Set(selectedIds)
      let box = null
      stage.querySelectorAll('[data-el]').forEach((node) => {
        if (!wanted.has(node.getAttribute('data-el'))) return
        const owner = docRef.current.elements.find((el) => el.id === node.getAttribute('data-el'))
        if (!owner || owner.type === 'raster' || owner.type === 'annotation') return
        const r = node.getBoundingClientRect()
        if (!r.width || !r.height) return
        box = box
          ? {
              left: Math.min(box.left, r.left),
              top: Math.min(box.top, r.top),
              right: Math.max(box.right, r.right),
              bottom: Math.max(box.bottom, r.bottom),
            }
          : { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
      })
      if (!box) {
        setFrameBox(null)
        return
      }
      const pad = 4
      setFrameBox({
        left: box.left - s.left - pad,
        top: box.top - s.top - pad,
        width: box.right - box.left + pad * 2,
        height: box.bottom - box.top + pad * 2,
        full: (box.right - box.left) * (box.bottom - box.top) > s.width * s.height * 0.7,
      })
    }
    measure()
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [interactive, selectedIds, editingId, doc])

  const insideFrame = (e) => {
    const stage = stageRef.current
    if (!stage || !frameBox) return false
    const s = stage.getBoundingClientRect()
    const x = e.clientX - s.left
    const y = e.clientY - s.top
    return x >= frameBox.left && x <= frameBox.left + frameBox.width && y >= frameBox.top && y <= frameBox.top + frameBox.height
  }

  const beginBgPan = (e) => {
    if (!interactive || e.button !== 0) return
    const bg = docRef.current.bg
    if (bg.type !== 'image' || !bg.src) return
    const rect = stageRef.current.getBoundingClientRect()
    const session = {
      startX: e.clientX,
      startY: e.clientY,
      posX: bg.posX ?? 50,
      posY: bg.posY ?? 50,
      fit: bg.fit || 'cover',
      rect,
      moved: false,
    }
    const move = (ev) => {
      if (!session.moved) {
        if (Math.abs(ev.clientX - session.startX) + Math.abs(ev.clientY - session.startY) < 3) return
        session.moved = true
        onGestureStart?.()
      }
      const dx = ((ev.clientX - session.startX) / session.rect.width) * 100
      const dy = ((ev.clientY - session.startY) / session.rect.height) * 100
      const patch = {
        posX: Math.min(100, Math.max(0, session.posX - dx)),
        posY: Math.min(100, Math.max(0, session.posY - dy)),
      }
      // A letterboxed photo has nothing hidden to reveal; fill the page so the
      // drag picks the visible portion instead of sliding it inside paper margins.
      if (session.fit === 'contain' && (bg.zoom ?? 1) <= 1) patch.fit = 'cover'
      onPatchBgRef.current?.(patch, { history: false })
    }
    const up = () => {
      detach()
      if (session.moved) onGestureEnd?.()
      else onSelect?.(null)
    }
    // A cancelled pointer is the browser taking over, not the user dropping the
    // selection, so never clear the group here.
    const cancel = () => {
      detach()
      if (session.moved) onGestureEnd?.()
    }
    const detach = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    e.preventDefault()
  }

  const placeText = (e) => {
    const rect = stageRef.current.getBoundingClientRect()
    if (!rect.width) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onAddTextAt?.(x, y)
    e.preventDefault()
  }

  const finishDrag = (aborted = false) => {
    const drag = dragRef.current
    offPointer(listenersRef.current)
    listenersRef.current = null
    // Grabbing a group member drags the whole group, but a click that goes
    // nowhere isolates that member the way Paint's selection frame does.
    // A cancelled pointer is the browser taking over, so keep the group.
    if (drag?.collapseOnClick && !drag.moved && !aborted) onSelect?.(drag.el.id)
    else if (drag?.moved) onGestureEnd?.()
    dragRef.current = null
  }

  const hitIds = ({ box, poly, ellipse }) => {
    const stage = stageRef.current
    if (!stage) return []
    const ids = []
    stage.querySelectorAll('[data-el]').forEach((node) => {
      const id = node.getAttribute('data-el')
      const el = docRef.current.elements.find((e) => e.id === id)
      if (!el || el.type === 'raster' || el.type === 'annotation') return
      if (transparentSelect && (el.opacity ?? 1) <= 0.02) return
      const rect = visibleRect(node, transparentSelect)
      if (box) {
        if (overlaps(rect, box)) ids.push(id)
        return
      }
      const corners = [
        [rect.left, rect.top],
        [rect.right, rect.top],
        [rect.left, rect.bottom],
        [rect.right, rect.bottom],
      ]
      if (ellipse) {
        const inside = (x, y) =>
          ((x - ellipse.cx) ** 2) / (ellipse.rx ** 2) + ((y - ellipse.cy) ** 2) / (ellipse.ry ** 2) <= 1
        const picked =
          inside((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2) ||
          corners.some(([x, y]) => inside(x, y)) ||
          (ellipse.cx > rect.left && ellipse.cx < rect.right && ellipse.cy > rect.top && ellipse.cy < rect.bottom)
        if (picked) ids.push(id)
        return
      }
      const inside = (x, y) => pointInPolygon(x, y, poly)
      const picked =
        inside((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2) ||
        corners.some(([x, y]) => inside(x, y)) ||
        poly.some(([x, y]) => x > rect.left && x < rect.right && y > rect.top && y < rect.bottom)
      if (picked) ids.push(id)
    })
    return ids
  }

  // Magnetic lasso: pull the freehand path onto nearby layer edges so the
  // selection hugs artwork instead of the hand's wobble.
  const snapMagnetic = (points) => {
    const stage = stageRef.current
    if (!stage) return points
    const stageRect = stage.getBoundingClientRect()
    const edges = []
    stage.querySelectorAll('[data-el]').forEach((node) => {
      const r = node.getBoundingClientRect()
      if (!r.width || !r.height) return
      edges.push({ x1: r.left - stageRect.left, y1: r.top - stageRect.top, x2: r.right - stageRect.left, y2: r.top - stageRect.top })
      edges.push({ x1: r.left - stageRect.left, y1: r.bottom - stageRect.top, x2: r.right - stageRect.left, y2: r.bottom - stageRect.top })
      edges.push({ x1: r.left - stageRect.left, y1: r.top - stageRect.top, x2: r.left - stageRect.left, y2: r.bottom - stageRect.top })
      edges.push({ x1: r.right - stageRect.left, y1: r.top - stageRect.top, x2: r.right - stageRect.left, y2: r.bottom - stageRect.top })
    })
    return points.map(([x, y]) => {
      let best = null
      edges.forEach((edge) => {
        const vertical = edge.x1 === edge.x2
        if (vertical) {
          const minY = Math.min(edge.y1, edge.y2) - 10
          const maxY = Math.max(edge.y1, edge.y2) + 10
          if (y < minY || y > maxY) return
          const d = Math.abs(x - edge.x1)
          if (d <= 14 && (!best || d < best.d)) best = { d, x: edge.x1 }
        } else {
          const minX = Math.min(edge.x1, edge.x2) - 10
          const maxX = Math.max(edge.x1, edge.x2) + 10
          if (x < minX || x > maxX) return
          const d = Math.abs(y - edge.y1)
          if (d <= 14 && (!best || d < best.d)) best = { d, y: edge.y1 }
        }
      })
      return best ? [best.x ?? x, best.y ?? y] : [x, y]
    })
  }

  const beginSelect = (e, forcedMode) => {
    const stage = stageRef.current
    if (!stage || e.button !== 0) return
    const rect = stage.getBoundingClientRect()
    if (!rect.width) return
    const mode = forcedMode || (lassoTool ? 'lasso' : marqueeMode || 'rect')
    const drawingLasso = mode === 'lasso' || mode === 'magnetic'
    const local = (ev) => ({
      x: Math.min(rect.width, Math.max(0, ev.clientX - rect.left)),
      y: Math.min(rect.height, Math.max(0, ev.clientY - rect.top)),
    })
    const origin = local(e)
    const session = { points: [[origin.x, origin.y]], moved: false, last: origin }

    const paint = (at) => {
      if (drawingLasso) {
        setSelShape({ mode: 'lasso', points: [...session.points], vw: rect.width, vh: rect.height })
        return
      }
      const left = Math.min(origin.x, at.x)
      const top = Math.min(origin.y, at.y)
      let width = Math.abs(at.x - origin.x)
      let height = Math.abs(at.y - origin.y)
      if (mode === 'row') height = 6
      if (mode === 'col') width = 6
      setSelShape({ mode, left, top, width, height })
    }
    if (drawingLasso) paint(origin)

    const move = (ev) => {
      cursorRef.current = local(ev)
      const at = local(ev)
      session.last = at
      if (drawingLasso) {
        const last = session.points[session.points.length - 1]
        if (Math.abs(at.x - origin.x) + Math.abs(at.y - origin.y) >= 4) session.moved = true
        if (Math.abs(at.x - last[0]) + Math.abs(at.y - last[1]) >= 2) session.points.push([at.x, at.y])
      } else {
        if (Math.abs(at.x - origin.x) + Math.abs(at.y - origin.y) < 3) return
        session.moved = true
      }
      paint(at)
    }
    const detach = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      selectRef.current = null
      setSelShape(null)
    }
    const finish = (at, shifted) => {
      if (drawingLasso) {
        const points = mode === 'magnetic' ? snapMagnetic(session.points) : session.points
        onSelectMany?.(hitIds({ poly: points.map(([x, y]) => [x + rect.left, y + rect.top]) }), shifted)
        return
      }
      const left = Math.min(origin.x, at.x)
      const top = Math.min(origin.y, at.y)
      let width = Math.abs(at.x - origin.x)
      let height = Math.abs(at.y - origin.y)
      if (mode === 'row') height = 6
      if (mode === 'col') width = 6
      if (mode === 'ellipse') {
        onSelectMany?.(hitIds({
          ellipse: {
            cx: rect.left + left + width / 2,
            cy: rect.top + top + height / 2,
            rx: Math.max(2, width / 2),
            ry: Math.max(2, height / 2),
          },
        }), shifted)
        return
      }
      onSelectMany?.(hitIds({
        box: {
          left: rect.left + left,
          top: rect.top + top,
          right: rect.left + left + width,
          bottom: rect.top + top + height,
        },
      }), shifted)
    }
    const up = (ev) => {
      detach()
      if (!session.moved) {
        onSelect?.(null)
        return
      }
      finish(local(ev), ev.shiftKey)
    }
    // A cancelled pointer (native drag, touch takeover) must not lose the
    // selection the user just drew — commit the shape as it stands.
    const cancel = (ev) => {
      detach()
      if (!session.moved) return
      finish(session.last || local(ev), ev.shiftKey)
    }
    selectRef.current = detach
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    e.preventDefault()
  }

  const finishPoly = (shifted) => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const points = polyRef.current
    polyRef.current = []
    setSelShape(null)
    if (points.length < 3) return
    onSelectMany?.(hitIds({ poly: points.map(([x, y]) => [x + rect.left, y + rect.top]) }), shifted)
  }

  const beginPoly = (e) => {
    if (e.button !== 0) return
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const at = {
      x: Math.min(rect.width, Math.max(0, e.clientX - rect.left)),
      y: Math.min(rect.height, Math.max(0, e.clientY - rect.top)),
    }
    // Double-click closes the shape from the stage's onDoubleClick handler.
    if (!polyRef.current.length) onSelect?.(null)
    polyRef.current = [...polyRef.current, [at.x, at.y]]
    setSelShape({ mode: 'lasso', points: [...polyRef.current], vw: rect.width, vh: rect.height })
    e.preventDefault()
  }

  const finishPen = () => {
    const points = penRef.current
    penRef.current = []
    setPenPoints([])
    setPenCursor(null)
    if (points.length < 2) return
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const pad = Math.max(0.4, (settings.size || 2) / 2)
    const minX = Math.min(...xs) - pad
    const maxX = Math.max(...xs) + pad
    const minY = Math.min(...ys) - pad
    const maxY = Math.max(...ys) + pad
    onPenCommit?.({
      x: Math.max(0, Math.min(100, minX)),
      y: Math.max(0, minY),
      w: Math.max(0.5, maxX - minX),
      h: Math.max(0.5, maxY - minY),
      points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
    })
  }

  const beginPen = (e) => {
    if (e.button !== 0) return
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const at = {
      x: Math.min(rect.width, Math.max(0, e.clientX - rect.left)) / rect.width * 100,
      y: Math.min(rect.height, Math.max(0, e.clientY - rect.top)) / rect.width * 100,
    }
    penRef.current = [...penRef.current, at]
    setPenPoints([...penRef.current])
    e.preventDefault()
  }

  useEffect(() => {
    if (tool !== 'pen' && tool !== 'lasso-poly') return undefined
    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (tool === 'pen') finishPen()
        else finishPoly(e.shiftKey)
      } else if (e.key === 'Escape') {
        penRef.current = []
        setPenPoints([])
        setPenCursor(null)
        polyRef.current = []
        setSelShape(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const stagePoint = (e) => {
    const stage = stageRef.current
    if (!stage) return null
    const rect = stage.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    return {
      px: clamp(e.clientX - rect.left, 0, rect.width),
      py: clamp(e.clientY - rect.top, 0, rect.height),
      fx: clamp((e.clientX - rect.left) / rect.width, 0, 1),
      fy: clamp((e.clientY - rect.top) / rect.height, 0, 1),
      rect,
    }
  }

  // Colour a layer paints with, used by the magic wand.
  const colorOfElement = (el) => {
    const d = docRef.current
    const raw =
      el.type === 'text' || el.type === 'banner'
        ? el.color
        : el.type === 'shape'
          ? (el.fill && el.fill !== 'none' ? el.fill : el.stroke)
          : el.type === 'photo'
            ? (el.tint && el.tint !== 'none' ? el.tint : el.backdrop)
            : el.type === 'footer' || el.type === 'namecard' || el.type === 'contactcard'
              ? el.bg
              : el.color
    return raw && raw !== 'none' && raw !== 'transparent' ? resolve(d, raw) : null
  }

  const elementAt = (e) => {
    if (typeof document === 'undefined') return null
    const nodes = document.elementsFromPoint(e.clientX, e.clientY)
    for (const node of nodes) {
      const holder = node.closest?.('[data-el]')
      if (!holder) continue
      const id = holder.getAttribute('data-el')
      const el = docRef.current.elements.find((item) => item.id === id)
      if (el) return el
    }
    return null
  }

  const beginObjectSelect = (e) => {
    const el = elementAt(e)
    if (!el) {
      if (!e.shiftKey) onSelect?.(null)
      return
    }
    if ((tool === 'path-select' || tool === 'direct-select') && el.type !== 'ink' && el.type !== 'shape') {
      onNotice?.('Path tools pick shapes and pen paths — click a vector layer')
      return
    }
    onSelect?.(el.id, e.shiftKey)
  }

  const beginQuickSelect = (e) => {
    const start = stagePoint(e)
    if (!start) return
    const keep = e.shiftKey ? [...selectedIds] : []
    const move = (ev) => {
      const at = stagePoint(ev)
      if (!at) return
      const radius = Math.max(10, Math.hypot(at.px - start.px, at.py - start.py))
      setQuickCircle({ left: at.px - radius, top: at.py - radius, size: radius * 2 })
      const ids = hitIds({
        ellipse: {
          cx: start.rect.left + start.px,
          cy: start.rect.top + start.py,
          rx: radius,
          ry: radius,
        },
      })
      onSelectMany?.([...new Set([...keep, ...ids])], false)
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      setQuickCircle(null)
      selectRef.current = null
    }
    selectRef.current = stop
    setQuickCircle({ left: start.px - 10, top: start.py - 10, size: 20 })
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    e.preventDefault()
  }

  const beginMagicWand = async (e) => {
    const point = stagePoint(e)
    if (!point) return
    onNotice?.('Sampling the page…')
    const target = await samplePageColor(docRef.current, point.fx, point.fy, 320)
    const tolerance = Number(settings.tolerance) || 34
    const ids = docRef.current.elements
      .filter((el) => el.type !== 'raster' && el.type !== 'annotation')
      .filter((el) => {
        const color = colorOfElement(el)
        if (!color || !color.startsWith('#')) return false
        return colorDistance(color, target) <= tolerance
      })
      .map((el) => el.id)
    onSelectMany?.(e.shiftKey ? [...new Set([...selectedIds, ...ids])] : ids, false)
    onNotice?.(
      ids.length
        ? `Magic wand picked ${ids.length} layer${ids.length === 1 ? '' : 's'} near ${target}`
        : 'No layers match that colour'
    )
  }

  const sampleAt = async (e) => {
    const point = stagePoint(e)
    if (!point) return
    const hex = await samplePageColor(docRef.current, point.fx, point.fy, 640)
    onSampleColor?.(hex)
  }

  const beginRuler = (e) => {
    const start = stagePoint(e)
    if (!start) return
    const origin = { x: start.px, y: start.py }
    const move = (ev) => {
      const at = stagePoint(ev)
      if (!at) return
      const dx = at.px - origin.x
      const dy = at.py - origin.y
      setRuler({
        x1: origin.x,
        y1: origin.y,
        x2: at.px,
        y2: at.py,
        vw: start.rect.width,
        vh: start.rect.height,
        length: Math.hypot(dx, dy),
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      })
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      selectRef.current = null
    }
    setRuler({
      x1: origin.x,
      y1: origin.y,
      x2: origin.x,
      y2: origin.y,
      vw: start.rect.width,
      vh: start.rect.height,
      length: 0,
      angle: 0,
    })
    selectRef.current = stop
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    e.preventDefault()
  }

  const placeNote = (e) => {
    const point = stagePoint(e)
    if (!point) return
    setNoteDraft({
      x: Math.round(point.fx * 1000) / 10,
      y: Math.round(point.fy * 1000) / 10,
      left: point.px + 12,
      top: point.py + 12,
      text: '',
    })
  }

  const commitNote = () => {
    if (!noteDraft) return
    const text = noteDraft.text.trim()
    if (text) onAddNoteAt?.(noteDraft.x, noteDraft.y, text)
    setNoteDraft(null)
  }

  const placeCount = (e) => {
    const point = stagePoint(e)
    if (!point) return
    onAddCountAt?.(Math.round(point.fx * 1000) / 10, Math.round(point.fy * 1000) / 10)
  }

  const ratioFromSetting = () => {
    const raw = String(settings.cropRatio || 'free')
    if (raw === 'free') return 0
    const [a, b] = raw.split(':').map(Number)
    if (!a || !b) return 0
    return a / b
  }

  const beginCrop = (e) => {
    const start = stagePoint(e)
    if (!start) return
    const origin = { x: start.px, y: start.py }
    const aspect = ratioFromSetting()
    const move = (ev) => {
      const at = stagePoint(ev)
      if (!at) return
      const left = Math.min(origin.x, at.px)
      const top = Math.min(origin.y, at.py)
      let width = Math.abs(at.px - origin.x)
      let height = Math.abs(at.py - origin.y)
      if (aspect) {
        if (width / Math.max(1, height) > aspect) width = height * aspect
        else height = width / aspect
      }
      setCropBox({
        left: at.px < origin.x ? origin.x - width : origin.x,
        top: at.py < origin.y ? origin.y - height : origin.y,
        width,
        height,
      })
      setCropMeta({ width, height })
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      selectRef.current = null
    }
    selectRef.current = stop
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    e.preventDefault()
  }

  const applyCrop = () => {
    const stage = stageRef.current
    if (!stage || !cropBox || cropBox.width < 6 || cropBox.height < 6) {
      onNotice?.('Drag a crop box on the page first')
      return
    }
    const rect = stage.getBoundingClientRect()
    onCropApply?.({
      x0: clamp(cropBox.left / rect.width, 0, 1),
      y0: clamp(cropBox.top / rect.height, 0, 1),
      x1: clamp((cropBox.left + cropBox.width) / rect.width, 0, 1),
      y1: clamp((cropBox.top + cropBox.height) / rect.height, 0, 1),
    })
    setCropBox(null)
    setCropMeta(null)
  }

  const cancelCrop = () => {
    setCropBox(null)
    setCropMeta(null)
    onCropCancel?.()
  }

  const beginSlice = (e) => {
    const start = stagePoint(e)
    if (!start) return
    const origin = { x: start.px, y: start.py }
    const move = (ev) => {
      const at = stagePoint(ev)
      if (!at) return
      setSlicePreview({
        left: Math.min(origin.x, at.px),
        top: Math.min(origin.y, at.py),
        width: Math.abs(at.px - origin.x),
        height: Math.abs(at.py - origin.y),
      })
    }
    const finish = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      selectRef.current = null
      setSlicePreview(null)
      const at = stagePoint(ev) || start
      const left = Math.min(origin.x, at.px)
      const top = Math.min(origin.y, at.py)
      const width = Math.abs(at.px - origin.x)
      const height = Math.abs(at.py - origin.y)
      const rect = start.rect
      if (width < 8 || height < 8) return
      onAddSlice?.({
        x: Math.round((left / rect.width) * 1000) / 10,
        y: Math.round((top / rect.height) * 1000) / 10,
        w: Math.round((width / rect.width) * 1000) / 10,
        h: Math.round((height / rect.height) * 1000) / 10,
      })
    }
    selectRef.current = () => setSlicePreview(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    e.preventDefault()
  }

  // Crop, slice, frame and shape tools all start from a dragged box.
  const beginBoxDrag = (e, kind) => {
    const start = stagePoint(e)
    if (!start) return
    const origin = { x: start.px, y: start.py }
    const box = (at) => {
      const left = Math.min(origin.x, at.px)
      const top = Math.min(origin.y, at.py)
      const width = Math.abs(at.px - origin.x)
      const height = Math.abs(at.py - origin.y)
      setDrawBox({ left, top, width, height, kind })
      return { left, top, width, height }
    }
    const move = (ev) => {
      const at = stagePoint(ev)
      if (at) box(at)
    }
    const finish = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      selectRef.current = null
      const at = stagePoint(ev) || start
      const { left, top, width, height } = box(at)
      setDrawBox(null)
      const rect = start.rect
      if (width < 6 || height < 6) {
        if (kind === 'shape') onNotice?.('Drag a larger box to draw the shape')
        return
      }
      const payload = {
        x: Math.round((left / rect.width) * 1000) / 10,
        y: Math.round((top / rect.height) * 1000) / 10,
        w: Math.round((width / rect.width) * 1000) / 10,
        h: Math.round((height / rect.height) * 1000) / 10,
      }
      if (kind === 'frame') onAddFrameBox?.(payload)
      else onAddShapeBox?.(payload, tool)
    }
    selectRef.current = () => setDrawBox(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    e.preventDefault()
  }

  const beginHand = (e) => {
    const scroller = stageRef.current?.closest('.ts-canvas-scroll')
    if (!scroller) return
    const start = { x: e.clientX, y: e.clientY, left: scroller.scrollLeft, top: scroller.scrollTop }
    const move = (ev) => {
      scroller.scrollLeft = start.left - (ev.clientX - start.x)
      scroller.scrollTop = start.top - (ev.clientY - start.y)
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      selectRef.current = null
    }
    selectRef.current = stop
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    e.preventDefault()
  }

  const beginRotate = (e) => {
    const startX = e.clientX
    const base = Number(viewRotation) || 0
    const move = (ev) => onRotate?.(base + (ev.clientX - startX) / 6)
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      selectRef.current = null
    }
    selectRef.current = stop
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    e.preventDefault()
  }

  const zoomAt = (e) => {
    onZoomAt?.(e.altKey ? -0.2 : 0.2)
    e.preventDefault()
  }

  // Direct selection drags a pen/ink anchor instead of moving the layer.
  const beginDirectPoint = (e) => {
    const target = directTarget
    const point = stagePoint(e)
    if (!target) {
      beginObjectSelect(e)
      return
    }
    if (!point) return
    if (target.type !== 'ink' || !Array.isArray(target.points) || target.points.length < 2) {
      onNotice?.('Direct selection edits pen and ink anchors — select a pen path first')
      return
    }
    const px = (point.px / point.rect.width) * 100
    const py = (point.py / point.rect.width) * 100
    let index = -1
    let best = 1.8
    target.points.forEach((anchor, i) => {
      const distance = Math.hypot(target.x + anchor.x - px, target.y + anchor.y - py)
      if (distance < best) {
        best = distance
        index = i
      }
    })
    if (index < 0) {
      beginObjectSelect(e)
      return
    }
    const startPoint = target.points[index]
    const start = { x: px, y: py }
    onGestureStart?.()
    const move = (ev) => {
      const at = stagePoint(ev)
      if (!at) return
      const nx = (at.px / at.rect.width) * 100
      const ny = (at.py / at.rect.width) * 100
      onDirectPoints?.(target.id, target.points.map((anchor, i) => (
        i === index
          ? {
              x: Math.round((startPoint.x + nx - start.x) * 100) / 100,
              y: Math.round((startPoint.y + ny - start.y) * 100) / 100,
            }
          : anchor
      )))
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      selectRef.current = null
      onGestureEnd?.()
    }
    selectRef.current = stop
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    e.preventDefault()
  }

  const paintLayerSrc = () => {
    const layer = docRef.current.elements.find((el) => el.type === 'raster' && el.role === 'paint')
    return layer?.src || ''
  }

  const ensurePaintHost = async () => {
    const host = paintHostRef.current
    const stage = stageRef.current
    const rect = stage?.getBoundingClientRect()
    if (!host || !rect?.width) return null
    const width = clamp(Math.round(rect.width * 2), 480, 2200)
    const height = Math.max(240, Math.round(width / (aspectOf(docRef.current) || 1)))
    if (host.width !== width || host.height !== height) {
      host.width = width
      host.height = height
      paintRef.current = { src: null }
    }
    const session = paintRef.current || { src: null }
    paintRef.current = session
    const src = paintLayerSrc()
    if (session.src !== src) {
      const ctx = host.getContext('2d')
      ctx.clearRect(0, 0, host.width, host.height)
      if (src) {
        try {
          const img = await loadImage(src)
          ctx.drawImage(img, 0, 0, host.width, host.height)
        } catch {
          /* an unreadable layer starts empty */
        }
      }
      session.src = src
    }
    return { host, ctx: host.getContext('2d') }
  }

  const commitPaint = async (host) => {
    const src = await layerDataUrl(host)
    if (paintRef.current) paintRef.current.src = src
    onPaintCommit?.({ src })
    setPaintActive(false)
  }

  const beginPaint = async (e) => {
    if (e.button !== 0 || paintBusyRef.current) return
    const stage = stageRef.current
    if (!stage) return
    e.preventDefault()
    if ((tool === 'clone' || tool === 'heal') && e.altKey) {
      const rect = stage.getBoundingClientRect()
      onSetCloneSource?.({
        x: clamp((e.clientX - rect.left) / rect.width, 0, 1),
        y: clamp((e.clientY - rect.top) / rect.height, 0, 1),
      })
      onNotice?.('Clone source set — paint to copy from it')
      return
    }
    if (tool === 'clone' && !settings.cloneSource) {
      onNotice?.('Alt-click a clean area to set the clone source')
      return
    }
    paintBusyRef.current = true
    setPaintActive(true)
    try {
      const ready = await ensurePaintHost()
      if (!ready) return
      const { host } = ready
      const rect = stage.getBoundingClientRect()
      const point = (ev) => ({
        x: clamp(((ev.clientX - rect.left) / rect.width) * host.width, 0, host.width),
        y: clamp(((ev.clientY - rect.top) / rect.height) * host.height, 0, host.height),
      })
      const toStage = (p) => ({
        x: (p.x / host.width) * rect.width,
        y: (p.y / host.height) * rect.height,
      })
      const first = point(e)
      const brushPx = Math.max(2, ((Number(settings.size) || 2.4) / 100) * host.width)
      const needsSource = SOURCE_PAINT_TOOLS.has(tool) || tool === 'bucket'
      const underlay = needsSource ? await renderUnderlay(docRef.current, host.width) : null
      if (tool === 'bucket') {
        paintBucket(host, underlay, first.x, first.y, {
          tolerance: Number(settings.tolerance) || 34,
          contiguous: settings.contiguous !== false,
          color: settings.foreground || '#1c2025',
          opacity: Number(settings.opacity) || 1,
        })
        await commitPaint(host)
        return
      }
      const base = {
        size: brushPx,
        hardness: tool === 'pencil' ? 1 : Number(settings.hardness ?? 0.75),
        opacity: Number(settings.opacity ?? 0.92),
        color: settings.foreground || '#1c2025',
        erase: tool === 'eraser',
      }
      const offset = tool === 'clone' && settings.cloneSource
        ? {
            x: first.x - settings.cloneSource.x * host.width,
            y: first.y - settings.cloneSource.y * host.height,
          }
        : { x: 0, y: 0 }
      const retouch = (from, to) => {
        const common = {
          size: brushPx,
          hardness: Number(settings.hardness ?? 0.6),
          opacity: Number(settings.healStrength ?? 0.85),
        }
        if (tool === 'clone') {
          return paintPatchLine(host, underlay, from, to, {
            ...common,
            sourceX: from.x - offset.x,
            sourceY: from.y - offset.y,
          })
        }
        if (tool === 'heal') {
          return paintPatchLine(host, underlay, from, to, {
            ...common,
            filter: 'blur(1px)',
            sourceX: from.x - brushPx * 0.9,
            sourceY: from.y - brushPx * 0.35,
          })
        }
        if (tool === 'spot-heal') {
          return paintPatchLine(host, underlay, from, to, {
            ...common,
            hardness: 0.3,
            filter: 'blur(2px)',
            sourceX: from.x - brushPx * 1.4,
            sourceY: from.y - brushPx * 0.8,
          })
        }
        if (tool === 'history-brush') {
          return paintPatchLine(host, underlay, from, to, { ...common, hardness: 0.4 })
        }
        if (tool === 'blur') {
          return paintPatchLine(host, underlay, from, to, {
            ...common,
            filter: `blur(${Math.max(0.8, brushPx / 10)}px)`,
          })
        }
        if (tool === 'sharpen') {
          return paintPatchLine(host, underlay, from, to, {
            ...common,
            filter: 'contrast(190%) brightness(106%)',
          })
        }
        if (tool === 'dodge') {
          return paintPatchLine(host, underlay, from, to, {
            ...common,
            tint: { mode: 'lighter', color: '#ffffff', alpha: Number(settings.dodgeStrength ?? 0.35) },
          })
        }
        if (tool === 'burn') {
          return paintPatchLine(host, underlay, from, to, {
            ...common,
            tint: { mode: 'multiply', color: '#2b2416', alpha: Number(settings.dodgeStrength ?? 0.35) * 0.9 },
          })
        }
        if (tool === 'sponge') {
          return paintPatchLine(host, underlay, from, to, {
            ...common,
            tint: { mode: 'saturation', color: '#8a8a8a', alpha: 0.5 },
          })
        }
        if (tool === 'smudge') {
          return smudgeLine(host, underlay, from, to, {
            size: brushPx,
            strength: Number(settings.smudgeStrength ?? 0.55),
          })
        }
        return null
      }

      let last = first
      const paint = (from, to) => {
        if (tool === 'brush' || tool === 'pencil' || tool === 'eraser') paintStroke(host, from, to, base)
        else retouch(from, to)
      }
      const updateBox = (from, to) => {
        const a = toStage(from)
        const b = toStage(to)
        setDrawBox({
          left: Math.min(a.x, b.x),
          top: Math.min(a.y, b.y),
          width: Math.abs(b.x - a.x),
          height: Math.abs(b.y - a.y),
          kind: 'paint',
        })
      }
      if (tool === 'brush' || tool === 'pencil' || tool === 'eraser') paintStamp(host, first.x, first.y, base)
      else if (needsSource && tool !== 'gradient' && tool !== 'patch') retouch(first, first)

      const move = (ev) => {
        const at = point(ev)
        if (tool === 'gradient' || tool === 'patch') {
          updateBox(first, at)
          last = at
          return
        }
        if (Math.hypot(at.x - last.x, at.y - last.y) < 0.8) return
        paint(last, at)
        last = at
      }
      const finish = async () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', finish)
        selectRef.current = null
        setDrawBox(null)
        if (tool === 'gradient') {
          fillGradient(host, first, last, {
            type: settings.gradientType || 'linear',
            foreground: settings.foreground || '#1c2025',
            background: settings.background || '#f7f7f3',
            opacity: Number(settings.opacity ?? 0.9),
          })
        }
        if (tool === 'patch') {
          patchRect(host, underlay, {
            x: Math.min(first.x, last.x),
            y: Math.min(first.y, last.y),
            width: Math.max(8, Math.abs(last.x - first.x)),
            height: Math.max(8, Math.abs(last.y - first.y)),
          }, {})
        }
        await commitPaint(host)
      }
      // A cancelled pointer should keep whatever was already painted.
      selectRef.current = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', finish)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', finish)
      window.addEventListener('pointercancel', finish)
    } finally {
      paintBusyRef.current = false
    }
  }

  const positionFor = (el, x0, y0, dx, dy, rect) => {
    const elhPct =
      el.type === 'text'
        ? 10
        : el.type === 'sticker'
          ? ((el.w / (el.aspect > 0 ? el.aspect : 1)) * rect.width) / rect.height
          : ((el.h ?? el.w) * rect.width) / rect.height
    const x = Math.min(Math.max(0, x0 + dx), Math.max(0, 100 - el.w))
    const y = Math.min(Math.max(0, y0 + dy), Math.max(0, 100 - elhPct))
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
  }

  const startDragSession = (drag) => {
    dragRef.current = drag
    const move = (ev) => {
      const current = dragRef.current
      if (!current) return
      const dx = ((ev.clientX - current.startX) / current.rect.width) * 100
      const dy = ((ev.clientY - current.startY) / current.rect.height) * 100
      if (!current.moved) {
        if (Math.abs(ev.clientX - current.startX) + Math.abs(ev.clientY - current.startY) < 3) return
        current.moved = true
        onGestureStart?.()
      }
      if (current.mode === 'pan') {
        const frameW = Math.max(1, (current.el.w / 100) * current.rect.width)
        const frameH = Math.max(1, ((current.el.h ?? current.el.w) / 100) * current.rect.width)
        const panX = Math.min(50, Math.max(-50, current.panX0 + ((ev.clientX - current.startX) / frameW) * 100))
        const panY = Math.min(50, Math.max(-50, current.panY0 + ((ev.clientY - current.startY) / frameH) * 100))
        onPatchElement?.(current.el.id, { panX: Math.round(panX), panY: Math.round(panY) }, { history: false })
        return
      }
      if (current.starts) {
        current.starts.forEach((start) => {
          onPatchElement?.(start.id, positionFor(start.el, start.x, start.y, dx, dy, current.rect), { history: false })
        })
        return
      }
      onPatchElement?.(
        current.el.id,
        positionFor(current.el, current.x0, current.y0, dx, dy, current.rect),
        { history: false }
      )
    }
    const up = () => finishDrag()
    const cancel = () => finishDrag(true)
    listenersRef.current = { move, up, cancel }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
  }

  const beginDrag = (e, el, additive) => {
    if (!interactive || editingId || e.button !== 0) return
    // Only the move tool drags layers; every other tool owns the pointer.
    if (tool !== 'select') return
    if (el.locked) return
    const groupMove =
      selectedIds.length > 1 && selectedIds.includes(el.id) && !(el.type === 'photo' && e.shiftKey)
    const members = groupMove
      ? docRef.current.elements.filter((m) => selectedIds.includes(m.id) && !m.locked)
      : null
    startDragSession({
      el,
      starts: members ? members.map((m) => ({ id: m.id, x: m.x, y: m.y, el: m })) : null,
      collapseOnClick: groupMove && !additive,
      mode: el.type === 'photo' && e.shiftKey ? 'pan' : 'move',
      startX: e.clientX,
      startY: e.clientY,
      x0: el.x,
      y0: el.y,
      panX0: el.panX ?? 0,
      panY0: el.panY ?? 0,
      rect: stageRef.current.getBoundingClientRect(),
      moved: false,
    })
    e.preventDefault()
  }

  // Paint lets you grab the selection frame itself, so an empty spot inside the
  // frame moves the group instead of dropping the selection.
  const beginGroupDrag = (e) => {
    if (!interactive || editingId || e.button !== 0) return
    const members = docRef.current.elements.filter((m) => selectedIds.includes(m.id) && !m.locked)
    if (!members.length) return
    const primary = members[members.length - 1]
    startDragSession({
      el: primary,
      starts: members.map((m) => ({ id: m.id, x: m.x, y: m.y, el: m })),
      collapseOnClick: false,
      mode: 'move',
      startX: e.clientX,
      startY: e.clientY,
      x0: primary.x,
      y0: primary.y,
      panX0: 0,
      panY0: 0,
      rect: stageRef.current.getBoundingClientRect(),
      moved: false,
    })
    e.preventDefault()
  }

  const beginItemDrag = (e, el, item) => {
    if (!interactive || e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const stageRect = stageRef.current.getBoundingClientRect()
    const barW = (el.w / 100) * stageRect.width
    const barLeft = stageRect.left + (el.x / 100) * stageRect.width
    const contentW = Math.max(1, barW * 0.92)
    const itemRect = e.currentTarget.getBoundingClientRect()
    const dx0 = item.dx ?? 0
    const baseLeft = itemRect.left - (dx0 / 100) * contentW
    const baseRight = itemRect.right - (dx0 / 100) * contentW
    const minDx = (((barLeft + barW * 0.04) - baseLeft) / contentW) * 100
    const maxDx = (((barLeft + barW * 0.96) - baseRight) / contentW) * 100
    const session = {
      lo: Math.min(minDx, maxDx),
      hi: Math.max(minDx, maxDx),
      startX: e.clientX,
      dx0,
      contentW,
      moved: false,
    }

    const move = (ev) => {
      const delta = ((ev.clientX - session.startX) / session.contentW) * 100
      if (!session.moved) {
        if (Math.abs(ev.clientX - session.startX) < 2) return
        session.moved = true
        onGestureStart?.()
      }
      const next = Math.min(session.hi, Math.max(session.lo, session.dx0 + delta))
      onPatchElement?.(
        el.id,
        {
          items: (el.items || []).map((it) => (
            it.id === item.id ? { ...it, dx: Math.round(next * 10) / 10 } : it
          )),
        },
        { history: false }
      )
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      listenersRef.current = null
    }
    const up = () => {
      stop()
      if (session.moved) onGestureEnd?.()
    }
    if (listenersRef.current) {
      window.removeEventListener('pointermove', listenersRef.current.move)
      window.removeEventListener('pointerup', listenersRef.current.up)
      window.removeEventListener('pointercancel', listenersRef.current.up)
    }
    listenersRef.current = { move, up }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const beginResize = (e, el, dir = 'se') => {
    if (!interactive) return
    e.preventDefault()
    e.stopPropagation()
    if (e.nativeEvent?.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation()
    }
    const rect = stageRef.current.getBoundingClientRect()
    const pageHeight = 100 / (aspectOf(docRef.current) || 1)
    const currentH = defaultHeightOf(el)
    const start = {
      x: e.clientX,
      y: e.clientY,
      elX: el.x,
      elY: el.y,
      w: el.w,
      h: currentH,
      rect,
      moved: false,
    }
    const move = (ev) => {
      const dw = ((ev.clientX - start.x) / start.rect.width) * 100
      const dh = ((ev.clientY - start.y) / start.rect.width) * 100
      if (!start.moved) {
        if (Math.abs(ev.clientX - start.x) + Math.abs(ev.clientY - start.y) < 2) return
        start.moved = true
        onGestureStart?.()
      }

      let patch = {}
      if (dir === 's') {
        const h = Math.max(3, start.h + dh)
        patch = { h: Math.round(h * 10) / 10 }
        if (el.type === 'sticker') {
          patch.aspect = Math.round((start.w / h) * 1000) / 1000
        }
      } else if (dir === 'n') {
        const h = Math.max(3, start.h - dh)
        const y = start.elY + (start.h - h) * (aspectOf(docRef.current) || 1)
        patch = { y: Math.max(0, Math.round(y * 10) / 10), h: Math.round(h * 10) / 10 }
        if (el.type === 'sticker') {
          patch.aspect = Math.round((start.w / h) * 1000) / 1000
        }
      } else if (dir === 'e') {
        const w = Math.min(100 - start.elX, Math.max(6, start.w + dw))
        patch = { w: Math.round(w * 10) / 10 }
        if (el.type === 'sticker') {
          patch.aspect = Math.round((w / start.h) * 1000) / 1000
        }
      } else if (dir === 'w') {
        const maxW = start.elX + start.w
        const w = Math.min(maxW, Math.max(6, start.w - dw))
        const x = maxW - w
        patch = { x: Math.round(x * 10) / 10, w: Math.round(w * 10) / 10 }
        if (el.type === 'sticker') {
          patch.aspect = Math.round((w / start.h) * 1000) / 1000
        }
      } else if (dir === 'sw') {
        const maxW = start.elX + start.w
        const w = Math.min(maxW, Math.max(6, start.w - dw))
        const x = maxW - w
        const h = Math.max(3, start.h + dh)
        patch = { x: Math.round(x * 10) / 10, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 }
        if (el.type === 'sticker') {
          patch.aspect = Math.round((w / h) * 1000) / 1000
        }
      } else if (dir === 'ne') {
        const w = Math.min(100 - start.elX, Math.max(6, start.w + dw))
        const h = Math.max(3, start.h - dh)
        const y = start.elY + (start.h - h) * (aspectOf(docRef.current) || 1)
        patch = { y: Math.max(0, Math.round(y * 10) / 10), w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 }
        if (el.type === 'sticker') {
          patch.aspect = Math.round((w / h) * 1000) / 1000
        }
      } else if (dir === 'nw') {
        const maxW = start.elX + start.w
        const w = Math.min(maxW, Math.max(6, start.w - dw))
        const x = maxW - w
        const h = Math.max(3, start.h - dh)
        const y = start.elY + (start.h - h) * (aspectOf(docRef.current) || 1)
        patch = { x: Math.round(x * 10) / 10, y: Math.max(0, Math.round(y * 10) / 10), w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 }
        if (el.type === 'sticker') {
          patch.aspect = Math.round((w / h) * 1000) / 1000
        }
      } else {
        // 'se'
        const w = Math.min(100 - start.elX, Math.max(6, start.w + dw))
        const h = Math.min(pageHeight, Math.max(3, start.h + dh))
        patch = { w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 }
        if (el.type === 'sticker') {
          patch.aspect = Math.round((w / h) * 1000) / 1000
        }
      }

      onPatchElement?.(el.id, patch, { history: false })
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      resizeRef.current = null
    }
    const up = () => {
      stop()
      if (start.moved) onGestureEnd?.()
    }
    resizeRef.current = stop
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const renderEl = (el) => {
    const isPrimary = interactive && selectedId === el.id
    // Every member of a multi-selection is outlined; only the primary one gets
    // the resize handle so a group reads as one object on the page.
    const isSelected = isPrimary || (interactive && selectedIds.includes(el.id))
    const handles = isPrimary && interactive
    const isEditing = interactive && editingId === el.id
    const removeBtn = isSelected && interactive && onDeleteElement ? (
      <button
        type="button"
        className="ts-el-remove-btn"
        title="Remove element"
        aria-label="Remove element"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onDeleteElement(el.id)
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    ) : null
    const common = {
      'data-el': el.id,
      'data-el-type': el.type,
    }
    const cls = `ts-el${isSelected ? ' is-selected' : ''}`
    const wrapperProps = {
      ...common,
      className: cls,
      onPointerDown: (e) => {
        if (!interactive) return
        if (e.target.closest?.('.ts-resize') || e.target.closest?.('.ts-el-remove-btn')) {
          e.stopPropagation()
          return
        }
        if (editingId) {
          if (editingId === el.id) return
          const node = stageRef.current?.querySelector(`[data-el="${editingId}"]`)
          onEndEdit?.(editingId, node ? node.innerText : null)
          onSelect?.(el.id)
          return
        }
        e.stopPropagation()
        const additive = e.shiftKey && el.type !== 'photo'
        // Grabbing a member of a multi-selection keeps the group; a click that
        // never moves collapses it in finishDrag.
        const inGroup = selectedIds.length > 1 && selectedIds.includes(el.id)
        if (!inGroup || additive) onSelect?.(el.id, additive)
        beginDrag(e, el, additive)
      },
    }

    // The paint layer is a full-page bitmap under the template; it never takes
    // pointer events or joins selection hit-tests.
    if (el.type === 'raster') {
      if (!el.src) return null
      return (
        <img
          key={el.id}
          className="ts-raster-layer"
          src={el.src}
          alt=""
          draggable={false}
          style={{
            opacity: el.opacity ?? 1,
            mixBlendMode: el.blend && el.blend !== 'normal' ? el.blend : undefined,
          }}
        />
      )
    }
    // Annotations are drawn as pins on top of everything and never export.
    if (el.type === 'annotation') return null

    if (el.type === 'text') {
      const style = {
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        fontFamily: fontStack(el.font),
        fontSize: `${el.size}cqw`,
        color: resolve(doc, el.color),
        fontWeight: el.weight,
        fontStyle: el.italic ? 'italic' : 'normal',
        textAlign: el.align,
        letterSpacing: `${el.tracking}em`,
        lineHeight: el.lineHeight,
        textTransform: el.transform === 'uppercase' ? 'uppercase' : 'none',
        opacity: el.opacity ?? 1,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }
      const boxFill = el.bg && el.bg !== 'none' ? resolve(doc, el.bg) : null
      const boxStroke =
        el.bgStroke && el.bgStroke !== 'none' && el.bgStrokeWidth > 0
          ? resolve(doc, el.bgStroke)
          : null
      const boxStyle = boxFill || boxStroke
        ? {
            background: boxFill || 'transparent',
            border: boxStroke ? `${el.bgStrokeWidth}cqw solid ${boxStroke}` : undefined,
            borderRadius: `${el.bgRadius ?? 0}cqw`,
          }
        : null
      return (
        <TextBody
          key={el.id}
          el={el}
          editing={isEditing}
          selected={isSelected}
          handles={handles}
          style={style}
          boxStyle={boxStyle}
          onCommit={onEndEdit}
          onStartEdit={onStartEdit}
          onPointerDown={wrapperProps.onPointerDown}
          onResize={(e, dir) => beginResize(e, el, dir)}
          removeBtn={removeBtn}
        />
      )
    }

    if (el.type === 'banner') {
      const plate = el.plate && el.plate !== 'none' ? resolve(doc, el.plate) : 'transparent'
      const strokeColor = el.strokeColor && el.strokeColor !== 'none' ? resolve(doc, el.strokeColor) : null
      const textColor = resolve(doc, el.color)
      const plateStyle = {
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        height: `${el.h ?? 13}cqw`,
        background: plate,
        border: strokeColor && el.strokeWidth > 0 ? `${el.strokeWidth}cqw solid ${strokeColor}` : undefined,
        borderRadius: `${el.radius ?? 1.4}cqw`,
        opacity: el.opacity ?? 1,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
      }
      const textStyle = {
        color: textColor,
        fontFamily: fontStack(el.font),
        fontSize: `${el.size}cqw`,
        fontWeight: el.weight,
        fontStyle: el.italic ? 'italic' : 'normal',
        letterSpacing: `${el.tracking ?? 0}em`,
        textTransform: el.transform === 'uppercase' ? 'uppercase' : 'none',
        textAlign: el.align || 'center',
        width: el.align ? '100%' : undefined,
      }
      return (
        <BannerBody
          key={el.id}
          el={el}
          editing={isEditing}
          selected={isSelected}
          handles={handles}
          removeBtn={removeBtn}
          plateStyle={plateStyle}
          textStyle={textStyle}
          ornamentColor={strokeColor || textColor}
          innerColor={strokeColor || textColor}
          onPointerDown={wrapperProps.onPointerDown}
          onResize={(e, dir) => beginResize(e, el, dir)}
          onCommit={onEndEdit}
          onStartEdit={onStartEdit}
        />
      )
    }

    if (el.type === 'namecard') {
      const radius = `${el.bgRadius ?? 0.9}cqw`
      const wrapperStyle = {
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        height: `${el.h ?? 24}cqw`,
        opacity: el.opacity ?? 1,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        borderRadius: radius,
        background: el.bg && el.bg !== 'none' ? resolve(doc, el.bg) : 'transparent',
      }
      const sheetStyle = { borderRadius: radius }
      const nameStyle = {
        fontFamily: fontStack(el.font),
        fontSize: `${el.nameSize ?? 5}cqw`,
        fontWeight: 700,
        color: resolve(doc, el.nameColor),
      }
      const titleStyle = {
        fontFamily: fontStack(el.font),
        fontSize: `${el.titleSize ?? 2.1}cqw`,
        fontWeight: 600,
        color: resolve(doc, el.titleColor),
      }
      const socialsStyle = {
        fontFamily: fontStack(el.font),
        fontSize: `${el.socialSize ?? 2}cqw`,
        fontWeight: 600,
        color: resolve(doc, el.socialColor),
      }
      const iconStyle = { color: resolve(doc, el.iconColor) }
      const hasRing = el.logoRing && el.logoRing !== 'none'
      const logoStyle = {
        width: `${el.logoSize ?? 7.5}cqw`,
        height: `${el.logoSize ?? 7.5}cqw`,
        borderColor: hasRing ? resolve(doc, el.logoRing) : undefined,
        borderWidth: hasRing ? '0.18cqw' : 0,
      }
      const barStyle = {
        background: el.contactBg && el.contactBg !== 'none' ? resolve(doc, el.contactBg) : 'transparent',
        color: resolve(doc, el.contactColor),
        fontFamily: fontStack(el.font),
        fontSize: `${el.contactSize ?? 1.7}cqw`,
      }
      return (
        <NameCardBody
          key={el.id}
          el={el}
          editing={isEditing}
          selected={isSelected}
          handles={handles}
          removeBtn={removeBtn}
          wrapperStyle={wrapperStyle}
          sheetStyle={sheetStyle}
          nameStyle={nameStyle}
          titleStyle={titleStyle}
          socialsStyle={socialsStyle}
          iconStyle={iconStyle}
          logoStyle={logoStyle}
          barStyle={barStyle}
          contactIconStyle={{ color: resolve(doc, el.contactColor) }}
          onPointerDown={wrapperProps.onPointerDown}
          onResize={(e, dir) => beginResize(e, el, dir)}
          onRequestLogo={() => onRequestPhoto?.({ kind: 'namecardLogo', cardId: el.id })}
          onCommitField={onCommitField}
          onEndEdit={onEndEdit}
          onStartEdit={onStartEdit}
        />
      )
    }

    if (el.type === 'photo') {
      const backdrop = el.backdrop && el.backdrop !== 'none' ? resolve(doc, el.backdrop) : undefined
      const tint = el.tint && el.tint !== 'none' ? resolve(doc, el.tint) : null
      const style = {
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        height: `${(el.h ?? el.w)}cqw`,
        borderRadius:
          el.shape === 'circle' ? '50%'
            : el.shape === 'arch' ? '50% 50% 0 0 / 42% 42% 0 0'
              : el.shape === 'rounded' ? `${el.radius ?? 1.4}cqw` : 0,
        background: backdrop,
        border:
          el.borderWidth > 0 && el.borderColor && el.borderColor !== 'none'
            ? `${el.borderWidth}cqw solid ${resolve(doc, el.borderColor)}`
            : undefined,
        opacity: el.opacity ?? 1,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }
      return (
        <div
          key={el.id}
          {...wrapperProps}
          className={`ts-el ts-photo${isSelected ? ' is-selected' : ''}${dropId === el.id ? ' is-drop' : ''}`}
          style={style}
          onDoubleClick={(e) => {
            if (!interactive) return
            e.stopPropagation()
            onRequestPhoto?.(el.id)
          }}
          onDragOver={(e) => {
            if (!interactive || !e.dataTransfer.types.includes('Files')) return
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = 'copy'
            if (dropId !== el.id) setDropId(el.id)
          }}
          onDragLeave={() => {
            if (dropId === el.id) setDropId(null)
          }}
          onDrop={(e) => {
            if (!interactive || !e.dataTransfer.types.includes('Files')) return
            e.preventDefault()
            e.stopPropagation()
            setDropId(null)
            const file = e.dataTransfer.files?.[0]
            if (file) onDropPhoto?.(el.id, file)
          }}
        >
          {el.src ? (
            <img
              src={el.src}
              alt=""
              draggable={false}
              style={{
                objectFit: el.fit === 'contain' ? 'contain' : 'cover',
                transform: `translate(${el.panX ?? 0}%, ${el.panY ?? 0}%) scale(${(el.zoom || 1) * (el.flipX ? -1 : 1)}, ${(el.zoom || 1) * (el.flipY ? -1 : 1)})`,
                mixBlendMode: el.blend && el.blend !== 'normal' ? el.blend : undefined,
                filter: el.filters
                  ? `brightness(${el.filters.brightness ?? 100}%) contrast(${el.filters.contrast ?? 100}%) saturate(${el.filters.saturate ?? 100}%)`
                  : undefined,
              }}
            />
          ) : (
            <span className="ts-photo-empty">
              <Photo size={18} />
              Add photo
            </span>
          )}
          {tint && el.tintStrength > 0 && (
            <span className="ts-photo-tint" style={{ background: tint, opacity: el.tintStrength }} />
          )}
          {dropId === el.id && <span className="ts-photo-drop">Drop to replace</span>}
          {handles && <ResizeHandles onResize={(e, dir) => beginResize(e, el, dir)} />}
          {removeBtn}
        </div>
      )
    }

    if (el.type === 'footer') {
      const h = el.h ?? 7.2
      const brandIcons = el.icons === 'brand'
      const darkBar = isDarkColor(resolve(doc, el.bg))
      return (
        <div
          key={el.id}
          {...wrapperProps}
          className={`ts-el ts-footer${isSelected ? ' is-selected' : ''}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            height: `${h}cqw`,
            background: resolve(doc, el.bg),
            color: resolve(doc, el.color),
            borderRadius: `${el.radius ?? 0}cqw`,
            fontSize: `${(h * 0.36).toFixed(2)}cqw`,
            opacity: el.opacity ?? 1,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          }}
        >
          {(el.items || []).map((item) => (
            <span
              className="ts-footer-item"
              key={item.id}
              style={{ left: `${item.dx ?? 0}%` }}
              title={handles ? 'Drag to slide along the bar · double-click to reset' : undefined}
              onPointerDown={handles ? (e) => beginItemDrag(e, el, item) : undefined}
              onDoubleClick={handles ? () => onPatchElement?.(
                el.id,
                { items: (el.items || []).map((it) => (it.id === item.id ? { ...it, dx: 0 } : it)) },
                { history: true }
              ) : undefined}
            >
              {item.icon === 'image' && item.src ? (
                <img src={item.src} alt="" draggable={false} />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  dangerouslySetInnerHTML={{
                    __html: item.icon === 'image'
                      ? '<rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/>'
                      : brandIcons
                        ? brandSocialMarkup(item.icon, { dark: darkBar, gid: `tsig-${item.id}` })
                        : socialMarkup(item.icon),
                  }}
                />
              )}
              <span className="ts-footer-text">{item.text}</span>
            </span>
          ))}
          {handles && <ResizeHandles onResize={(e, dir) => beginResize(e, el, dir)} />}
          {removeBtn}
        </div>
      )
    }

    if (el.type === 'ink') {
      const points = (el.points || []).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
      return (
        <div
          key={el.id}
          {...wrapperProps}
          className={`ts-el ts-ink${isSelected ? ' is-selected' : ''}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            height: `${el.h}cqw`,
            opacity: el.opacity ?? 1,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          }}
        >
          <svg className="ts-ink-svg" viewBox={`0 0 ${el.w} ${el.h}`} preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points={points}
              fill="none"
              stroke={resolve(doc, el.color)}
              strokeWidth={el.size}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {handles && <ResizeHandles onResize={(e, dir) => beginResize(e, el, dir)} />}
          {removeBtn}
        </div>
      )
    }

    if (el.type === 'shape') {
      if (isPathShape(el.shape)) {
        const geo = SHAPE_GEOMETRY[el.shape]
        const fill = resolve(doc, el.fill)
        const stroke = resolve(doc, el.stroke)
        const solidFill = fill !== 'none' && fill !== 'transparent'
        const strokeOn = stroke !== 'none' && stroke !== 'transparent' && (el.strokeWidth || 0) > 0
        const sw = strokeOn ? ((el.strokeWidth || 0) * 100) / Math.max(1, el.w) : 0
        return (
          <div
            key={el.id}
            {...wrapperProps}
            className={`ts-el ts-shape ts-shape--path${isSelected ? ' is-selected' : ''}`}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h ?? el.w}cqw`,
              opacity: el.opacity ?? 1,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            }}
          >
            <svg className="ts-shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path
                d={geo.d}
                fill={geo.open || !solidFill ? 'none' : fill}
                stroke={strokeOn ? stroke : 'none'}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {handles && <ResizeHandles onResize={(e, dir) => beginResize(e, el, dir)} />}
            {removeBtn}
          </div>
        )
      }
      const fill = resolve(doc, el.fill)
      const fill2 = el.fill2 ? resolve(doc, el.fill2) : null
      const fill3 = el.fill3 ? resolve(doc, el.fill3) : null
      const stroke = resolve(doc, el.stroke)
      const solidFill = fill !== 'none' && fill !== 'transparent'
      const style = {
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        height: el.shape === 'line' ? '0.3cqw' : `${el.h ?? el.w}cqw`,
        background: solidFill && fill2 && fill3
          ? `linear-gradient(${el.angle ?? 90}deg, ${fill}, ${fill2} ${el.mix ?? 50}%, ${fill3})`
          : solidFill && fill2
            ? `linear-gradient(${el.angle ?? 90}deg, ${fill}, ${fill2})`
            : solidFill ? fill : undefined,
        border:
          stroke !== 'none' && stroke !== 'transparent' && el.strokeWidth
            ? `${el.strokeWidth}cqw solid ${stroke}`
            : undefined,
        borderRadius:
          el.shape === 'circle' ? '50%'
            : el.shape === 'arch' ? '50% 50% 0 0 / 42% 42% 0 0'
              : `${el.radius ?? 0}cqw`,
        opacity: el.opacity ?? 1,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }
      if (el.shape === 'line') {
        style.background = fill !== 'none' ? fill : resolve(doc, 'accent')
      }
      return (
        <div key={el.id} {...wrapperProps} className={`ts-el ts-shape${isSelected ? ' is-selected' : ''}`} style={style}>
          {handles && <ResizeHandles onResize={(e, dir) => beginResize(e, el, dir)} />}
          {removeBtn}
        </div>
      )
    }

    if (el.type === 'sticker') {
      const h = el.h ?? (el.aspect > 0 ? el.w / el.aspect : el.w)
      return (
        <div
          key={el.id}
          {...wrapperProps}
          className={`ts-el ts-sticker${isSelected ? ' is-selected' : ''}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            height: `${h}cqw`,
            opacity: el.opacity ?? 1,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          }}
        >
          <img
            src={el.src}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              mixBlendMode: el.blend && el.blend !== 'normal' ? el.blend : undefined,
              transform: el.flipX || el.flipY ? `scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})` : undefined,
              filter: el.filters
                ? `brightness(${el.filters.brightness ?? 100}%) contrast(${el.filters.contrast ?? 100}%) saturate(${el.filters.saturate ?? 100}%)`
                : undefined,
            }}
          />
          {Array.isArray(el.slots) && el.slots.map((slot) => {
            if (slot.kind === 'image') {
              if (!slot.src && !interactive) return null
              const isCircle = slot.shape === 'circle'
              const radius = isCircle ? '50%' : (slot.borderRadius || undefined)
              return (
                <span
                  key={slot.id}
                  className={`ts-sticker-slot ts-sticker-slot--image${slot.src ? ' has-image' : ''}${isCircle ? ' is-circle' : ''}`}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `${slot.w}%`,
                    height: `${slot.h}%`,
                    borderRadius: radius,
                  }}
                  onPointerDown={(e) => { if (!slot.src) e.stopPropagation() }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!interactive) return
                    onSelect?.(el.id)
                    if (!slot.src) onRequestPhoto?.({ kind: 'stickerSlot', stickerId: el.id, slotId: slot.id })
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (interactive && slot.src) onRequestPhoto?.({ kind: 'stickerSlot', stickerId: el.id, slotId: slot.id })
                  }}
                  onKeyDown={(e) => {
                    if (!interactive || (e.key !== 'Enter' && e.key !== ' ')) return
                    e.preventDefault()
                    onRequestPhoto?.({ kind: 'stickerSlot', stickerId: el.id, slotId: slot.id })
                  }}
                  role="button"
                  tabIndex={interactive ? 0 : undefined}
                  aria-label={slot.label || 'Replace image'}
                  title={interactive ? `${slot.src ? 'Double-click to replace' : 'Click to add'} — ${slot.label || 'image area'}` : undefined}
                >
                  {slot.src ? (
                    <img
                      src={slot.src}
                      alt=""
                      draggable={false}
                      style={{
                        objectFit: slot.fit === 'contain' ? 'contain' : 'cover',
                        borderRadius: radius,
                      }}
                    />
                  ) : (
                    <span className="ts-slot-empty" style={{ borderRadius: radius }}>
                      {slot.label || 'Image'}
                    </span>
                  )}
                </span>
              )
            }
            if (!slot.text && !interactive) return null
            return (
              <span
                key={slot.id}
                data-slot={slot.id}
                className={`ts-sticker-slot ts-sticker-slot--text${slot.text ? '' : ' is-empty'}`}
                contentEditable={interactive || undefined}
                suppressContentEditableWarning
                spellCheck={false}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  fontSize: `${slot.size || 8}cqw`,
                  color: slot.color || '#1c2025',
                  fontWeight: slot.weight || 700,
                  textAlign: slot.align || 'center',
                  justifyContent: slot.align === 'left' ? 'flex-start' : slot.align === 'right' ? 'flex-end' : 'center',
                  fontFamily: slot.font === 'serif' ? 'Georgia, "Times New Roman", serif' : slot.font === 'display' ? 'var(--ts-font-display)' : 'var(--ts-font-ui)',
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  onSelect?.(el.id)
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                }}
                onBlur={(e) => {
                  const text = e.currentTarget.innerText
                  onPatchElement?.(
                    el.id,
                    {
                      slots: (el.slots || []).map((s) => (s.id === slot.id ? { ...s, text } : s)),
                    },
                    { history: true }
                  )
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                }}
              >
                {slot.text || (interactive ? slot.label || 'Text' : '')}
              </span>
            )
          })}
          {handles && <ResizeHandles onResize={(e, dir) => beginResize(e, el, dir)} />}
          {removeBtn}
        </div>
      )
    }

    if (el.type === 'social') {
      return (
        <div
          key={el.id}
          {...wrapperProps}
          className={`ts-el ts-social${isSelected ? ' is-selected' : ''}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            color: resolve(doc, el.color),
            opacity: el.opacity ?? 1,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{ display: 'block', width: '100%', height: 'auto' }}
            dangerouslySetInnerHTML={{ __html: socialMarkup(el.platform) }}
          />
        </div>
      )
    }

    const style = {
      left: `${el.x}%`,
      top: `${el.y}%`,
      width: `${el.w}%`,
      color: resolve(doc, el.color),
      opacity: el.opacity ?? 1,
      transform: `${el.flipX ? 'scaleX(-1) ' : ''}${el.rotation ? `rotate(${el.rotation}deg)` : ''}`.trim() || undefined,
      transformOrigin: 'center center',
    }
    return (
      <div key={el.id} {...wrapperProps} className={`ts-el ts-ornament${isSelected ? ' is-selected' : ''}`} style={style}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          style={{ display: 'block', width: '100%', height: 'auto' }}
          dangerouslySetInnerHTML={{ __html: ornamentMarkup(el.ornament) }}
        />
        {removeBtn}
      </div>
    )
  }

  const selectionLike =
    tool.startsWith('marquee-') ||
    tool.startsWith('lasso') ||
    tool === 'object-select' ||
    tool === 'quick-select' ||
    tool === 'magic-wand'
  const boxTool =
    tool === 'crop' ||
    tool === 'slice' ||
    tool === 'frame' ||
    tool.startsWith('shape-')
  const cursorClass = !interactive
    ? ''
    : PAINT_TOOLS.has(tool)
      ? ' is-paint-tool'
      : tool === 'hand'
        ? ' is-pan-tool'
        : tool === 'zoom'
          ? ' is-zoom-tool'
          : boxTool
            ? ' is-crop-tool'
            : tool === 'eyedropper'
              ? ' is-pick-tool'
              : selectionLike
                ? ' is-select-tool'
                : tool === 'text'
                  ? ' is-text-tool'
                  : ''

  return (
    <div
      ref={stageRef}
      className={`ts-stage${interactive ? ' is-interactive' : ' is-preview'}${interactive && bgImage ? ' can-pan-bg' : ''}${cursorClass} ${className}`}
      style={{
        aspectRatio: aspectOf(doc),
        background: bgImage ? resolve(doc, doc.bg.from || 'ink') : backgroundCss(doc),
      }}
      onDragOver={(e) => {
        if (!interactive) return
        const types = e.dataTransfer.types
        if (types.includes('Files') || types.includes('application/x-ts-footer') || types.includes('application/x-ts-element')) e.preventDefault()
      }}
      onDrop={(e) => {
        if (!interactive) return
        const types = e.dataTransfer.types
        const rect = stageRef.current.getBoundingClientRect()
        const xPct = ((e.clientX - rect.left) / rect.width) * 100
        const yPct = ((e.clientY - rect.top) / rect.height) * 100
        if (types.includes('application/x-ts-element')) {
          e.preventDefault()
          let payload = null
          try {
            payload = JSON.parse(e.dataTransfer.getData('application/x-ts-element'))
          } catch {
            return
          }
          onDropElement?.(payload, xPct, yPct)
          return
        }
        if (types.includes('application/x-ts-footer')) {
          e.preventDefault()
          const presetId = e.dataTransfer.getData('application/x-ts-footer')
          onDropFooter?.(presetId, xPct, yPct)
          return
        }
        if (types.includes('Files')) e.preventDefault()
      }}
      onPointerDownCapture={(e) => {
        if (!interactive || e.button !== 0) return
        const onFrame = frameBox && insideFrame(e)
        if (tool.startsWith('marquee-') || tool === 'lasso' || tool === 'lasso-magnetic') {
          e.stopPropagation()
          if (onFrame) beginGroupDrag(e)
          else beginSelect(e)
          return
        }
        if (tool === 'lasso-poly') {
          e.stopPropagation()
          beginPoly(e)
          return
        }
        if (tool === 'object-select' || tool === 'path-select') {
          e.stopPropagation()
          beginObjectSelect(e)
          return
        }
        if (tool === 'direct-select') {
          e.stopPropagation()
          beginDirectPoint(e)
          return
        }
        if (tool === 'quick-select') {
          e.stopPropagation()
          beginQuickSelect(e)
          return
        }
        if (tool === 'magic-wand') {
          e.stopPropagation()
          beginMagicWand(e)
          return
        }
        if (tool === 'crop') {
          e.stopPropagation()
          beginCrop(e)
          return
        }
        if (tool === 'slice') {
          e.stopPropagation()
          beginSlice(e)
          return
        }
        if (tool === 'frame') {
          e.stopPropagation()
          beginBoxDrag(e, 'frame')
          return
        }
        if (tool.startsWith('shape-')) {
          e.stopPropagation()
          beginBoxDrag(e, 'shape')
          return
        }
        if (tool === 'eyedropper') {
          e.stopPropagation()
          sampleAt(e)
          return
        }
        if (tool === 'ruler') {
          e.stopPropagation()
          beginRuler(e)
          return
        }
        if (tool === 'note') {
          e.stopPropagation()
          placeNote(e)
          return
        }
        if (tool === 'count') {
          e.stopPropagation()
          placeCount(e)
          return
        }
        if (tool === 'pen') {
          e.stopPropagation()
          beginPen(e)
          return
        }
        if (tool === 'hand') {
          e.stopPropagation()
          beginHand(e)
          return
        }
        if (tool === 'rotate') {
          e.stopPropagation()
          beginRotate(e)
          return
        }
        if (tool === 'zoom') {
          e.stopPropagation()
          zoomAt(e)
          return
        }
        if (PAINT_TOOLS.has(tool)) {
          e.stopPropagation()
          beginPaint(e)
          return
        }
        if (tool === 'text') {
          e.stopPropagation()
          placeText(e)
        }
      }}
      onPointerMove={(e) => {
        if (!interactive || tool !== 'pen') return
        const point = stagePoint(e)
        if (!point) return
        setPenCursor({
          x: (point.px / point.rect.width) * 100,
          y: (point.py / point.rect.width) * 100,
        })
      }}
      onDoubleClick={(e) => {
        if (!interactive) return
        if (tool === 'lasso-poly') {
          finishPoly(e.shiftKey)
          return
        }
        if (tool === 'pen') finishPen()
      }}
      onPointerDown={(e) => {
        if (!interactive) return
        const isCanvasBg = e.target === e.currentTarget ||
          e.target.classList?.contains('ts-bg-photo') ||
          e.target.classList?.contains('ts-bg-shade') ||
          e.target.classList?.contains('ts-grain')
        if (isCanvasBg) {
          if (editingId) {
            const node = stageRef.current?.querySelector(`[data-el="${editingId}"]`)
            onEndEdit?.(editingId, node ? node.innerText : null)
          }
          // Drag inside selection frame to move it (whether 1 or multiple elements)
          if (frameBox && insideFrame(e)) {
            beginGroupDrag(e)
            return
          }
          if (tool === 'select') {
            // With a photo page, dragging the page moves the photo so you can
            // choose which part of it shows. Marquee/lasso have their own tools.
            if (bgImage) beginBgPan(e)
            else beginSelect(e)
            return
          }
          if (bgImage) beginBgPan(e)
          else onSelect?.(null)
        }
      }}
      onDragStartCapture={(e) => e.preventDefault()}
    >
      {bgImage && (
        <img
          className="ts-bg-photo"
          src={doc.bg.src}
          alt=""
          draggable={false}
          style={{
            objectFit: doc.bg.fit === 'contain' ? 'contain' : 'cover',
            objectPosition: `${doc.bg.posX ?? 50}% ${doc.bg.posY ?? 50}%`,
            transform: `scale(${doc.bg.zoom ?? 1})`,
          }}
        />
      )}
      {bgImage && (Number(doc.bg.overlay) || 0) > 0 && (
        <div
          className="ts-bg-shade"
          style={{ background: resolve(doc, doc.bg.tint || 'ink'), opacity: Number(doc.bg.overlay) || 0 }}
        />
      )}
      {doc.bg.texture && <div className="ts-grain" />}
      {interactive && (
        <canvas
          ref={paintHostRef}
          className={`ts-paint-layer${paintActive ? ' is-live' : ''}`}
          aria-hidden="true"
        />
      )}
      {doc.elements.map(renderEl)}
      {interactive && doc.elements.filter((el) => el.type === 'annotation').map((el) => (
        <button
          key={el.id}
          type="button"
          className={`ts-annotation ts-annotation--${el.kind || 'note'}${selectedIds.includes(el.id) ? ' is-selected' : ''}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            background: el.color || settings.foreground || '#f2b84b',
          }}
          title={el.text || (el.kind === 'count' ? `Count ${el.index}` : 'Note')}
          onPointerDown={(e) => {
            e.stopPropagation()
            onSelect?.(el.id, e.shiftKey)
          }}
        >
          {el.kind === 'count' ? el.index : 'Note'}
        </button>
      ))}
      {interactive && (doc.slices || []).map((slice, index) => (
        <div
          key={slice.id}
          className="ts-slice"
          style={{
            left: `${slice.x}%`,
            top: `${slice.y}%`,
            width: `${slice.w}%`,
            height: `${slice.h}%`,
          }}
        >
          <span className="ts-slice-tag">Slice {index + 1}</span>
          <button
            type="button"
            className="ts-slice-remove"
            title="Remove slice"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onRemoveSlice?.(slice.id)}
          >
            ×
          </button>
        </div>
      ))}
      {interactive && slicePreview && (
        <div
          className="ts-slice is-preview"
          style={{
            left: `${slicePreview.left}px`,
            top: `${slicePreview.top}px`,
            width: `${slicePreview.width}px`,
            height: `${slicePreview.height}px`,
          }}
        >
          <span className="ts-slice-tag">
            {Math.round(slicePreview.width)} × {Math.round(slicePreview.height)}
          </span>
        </div>
      )}
      {interactive && drawBox && (
        <div
          className={`ts-draw-box is-${drawBox.kind}`}
          style={{
            left: `${drawBox.left}px`,
            top: `${drawBox.top}px`,
            width: `${drawBox.width}px`,
            height: `${drawBox.height}px`,
          }}
        />
      )}
      {interactive && cropBox && (
        <>
          <div
            className="ts-crop-shade"
            style={{
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${cropBox.left}px ${cropBox.top}px, ${cropBox.left}px ${cropBox.top + cropBox.height}px, ${cropBox.left + cropBox.width}px ${cropBox.top + cropBox.height}px, ${cropBox.left + cropBox.width}px ${cropBox.top}px, ${cropBox.left}px ${cropBox.top}px)`,
            }}
          />
          <div
            className="ts-crop-box"
            style={{
              left: `${cropBox.left}px`,
              top: `${cropBox.top}px`,
              width: `${cropBox.width}px`,
              height: `${cropBox.height}px`,
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="ts-crop-size">
              {cropMeta
                ? `${Math.round((cropBox.width / (stageRef.current?.clientWidth || 1)) * 100)}% × ${Math.round((cropBox.height / (stageRef.current?.clientHeight || 1)) * 100)}% of page`
                : ''}
            </span>
            <div className="ts-crop-actions">
              <button type="button" className="ts-btn ts-btn-ghost" onClick={cancelCrop}>
                Cancel
              </button>
              <button type="button" className="ts-btn ts-btn-primary" onClick={applyCrop}>
                Apply crop
              </button>
            </div>
          </div>
        </>
      )}
      {interactive && quickCircle && (
        <span
          className="ts-quick-ring"
          style={{
            left: `${quickCircle.left}px`,
            top: `${quickCircle.top}px`,
            width: `${quickCircle.size}px`,
            height: `${quickCircle.size}px`,
          }}
        />
      )}
      {interactive && ruler && (
        <>
          <svg
            className="ts-ruler-layer"
            viewBox={`0 0 ${ruler.vw} ${ruler.vh}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1={ruler.x1} y1={ruler.y1} x2={ruler.x2} y2={ruler.y2} />
            <circle cx={ruler.x1} cy={ruler.y1} r="3" />
            <circle cx={ruler.x2} cy={ruler.y2} r="3" />
          </svg>
          <span
            className="ts-ruler-label"
            style={{
              left: `${(ruler.x1 + ruler.x2) / 2}px`,
              top: `${(ruler.y1 + ruler.y2) / 2}px`,
            }}
          >
            {Math.round(ruler.length)} px · {Math.round(ruler.angle)}°
          </span>
        </>
      )}
      {interactive && (penPoints.length > 0 || penCursor) && (
        <svg
          className="ts-pen-layer"
          viewBox={`0 0 100 ${100 / (aspectOf(doc) || 1)}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {penPoints.length > 1 && (
            <polyline points={penPoints.map((p) => `${p.x},${p.y}`).join(' ')} />
          )}
          {penCursor && penPoints.length > 0 && (
            <line
              x1={penPoints[penPoints.length - 1].x}
              y1={penPoints[penPoints.length - 1].y}
              x2={penCursor.x}
              y2={penCursor.y}
            />
          )}
          {penPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="0.55" />
          ))}
        </svg>
      )}
      {interactive && tool === 'direct-select' && directTarget?.type === 'ink' && (
        <svg
          className="ts-direct-layer"
          viewBox={`0 0 100 ${100 / (aspectOf(doc) || 1)}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {(directTarget.points || []).map((anchor, i) => (
            <circle
              key={i}
              cx={directTarget.x + anchor.x}
              cy={directTarget.y + anchor.y}
              r="0.7"
            />
          ))}
        </svg>
      )}
      {interactive && noteDraft && (
        <div
          className="ts-note-compose"
          style={{ left: `${noteDraft.left}px`, top: `${noteDraft.top}px` }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <textarea
            autoFocus
            value={noteDraft.text}
            placeholder="Add a note…"
            onChange={(e) => setNoteDraft({ ...noteDraft, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                commitNote()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setNoteDraft(null)
              }
            }}
          />
          <div className="ts-note-actions">
            <button type="button" className="ts-btn ts-btn-ghost" onClick={() => setNoteDraft(null)}>
              Cancel
            </button>
            <button type="button" className="ts-btn ts-btn-primary" onClick={commitNote}>
              Add note
            </button>
          </div>
        </div>
      )}
      {frameBox && (
        <div
          className="ts-select-frame"
          style={{
            position: 'absolute',
            left: `${frameBox.left}px`,
            top: `${frameBox.top}px`,
            width: `${frameBox.width}px`,
            height: `${frameBox.height}px`,
            cursor: 'move',
          }}
          title="Drag inside to move selection"
          onPointerDown={(e) => {
            if (e.target.closest?.('.ts-resize') || e.target.closest?.('.ts-el-remove-btn')) return
            e.stopPropagation()
            beginGroupDrag(e)
          }}
        />
      )}
      {selShape?.mode === 'rect' && (
        <div
          className="ts-marquee"
          style={{
            left: `${selShape.left}px`,
            top: `${selShape.top}px`,
            width: `${selShape.width}px`,
            height: `${selShape.height}px`,
          }}
        />
      )}
      {selShape?.mode === 'lasso' && (
        <svg
          className="ts-lasso"
          viewBox={`0 0 ${selShape.vw} ${selShape.vh}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon points={selShape.points.map(([x, y]) => `${x},${y}`).join(' ')} />
        </svg>
      )}
    </div>
  )
}
