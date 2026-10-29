import React, { useEffect, useRef, useState } from 'react'
import { aspectOf, resolve } from '../model.js'
import { backgroundCss, fontStack } from '../data/presets.js'
import { ornamentMarkup } from '../data/ornaments.js'
import { bannerFlourishSvg } from '../data/banners.js'
import { socialMarkup, brandSocialMarkup, isDarkColor } from '../data/socials.js'
import { contactMarkup } from '../data/namecards.js'
import { SHAPE_GEOMETRY, isPathShape } from '../data/shapes.js'
import { Photo } from './Icons.jsx'

function TextBody({ el, editing, selected, style, boxStyle, onCommit, onPointerDown, onStartEdit }) {
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
    </div>
  )
}

function BannerBody({
  el, editing, selected, handles,
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
      onPointerDown={onPointerDown}
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
      {handles && (
        <span
          className="ts-resize"
          title="Drag to resize"
          onPointerDown={(e) => {
            e.stopPropagation()
            onResize?.(e)
          }}
        />
      )}
    </div>
  )
}

function NameCardBody({
  el, editing, selected, handles,
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
      onPointerDown={onPointerDown}
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
      {handles && (
        <span
          className="ts-resize"
          title="Drag to resize"
          onPointerDown={(e) => {
            e.stopPropagation()
            onResize?.(e)
          }}
        />
      )}
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
  brush,
  onInk,
  onAddTextAt,
  className = '',
}) {
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const listenersRef = useRef(null)
  const resizeRef = useRef(null)
  const [dropId, setDropId] = useState(null)
  const [inkPreview, setInkPreview] = useState(null)
  const [selShape, setSelShape] = useState(null)
  const [frameBox, setFrameBox] = useState(null)
  const selectRef = useRef(null)
  const inkRef = useRef(null)
  const docRef = useRef(doc)
  docRef.current = doc
  const onPatchBgRef = useRef(onPatchBg)
  onPatchBgRef.current = onPatchBg
  const bgImage = doc.bg.type === 'image' && !!doc.bg.src

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

  // Paint keeps a marching-ants frame over the selection once the mouse is
  // released, and the frame itself can be grabbed to move the group.
  useEffect(() => {
    if (!interactive || !selectedIds.length || editingId) {
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
      onPatchBgRef.current?.(
        {
          posX: Math.min(100, Math.max(0, session.posX - dx)),
          posY: Math.min(100, Math.max(0, session.posY - dy)),
        },
        { history: false }
      )
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

  const beginInk = (e) => {
    if (!interactive || !brush || e.button !== 0) return
    const rect = stageRef.current.getBoundingClientRect()
    if (!rect.width) return
    const toPoint = (ev) => ({
      x: ((ev.clientX - rect.left) / rect.width) * 100,
      y: ((ev.clientY - rect.top) / rect.width) * 100,
    })
    const first = toPoint(e)
    const points = [first]
    setInkPreview({ points, color: brush.color, size: brush.size, opacity: brush.opacity })
    const move = (ev) => {
      const point = toPoint(ev)
      const last = points[points.length - 1]
      if (Math.abs(point.x - last.x) + Math.abs(point.y - last.y) < 0.15) return
      points.push(point)
      setInkPreview({ points: [...points], color: brush.color, size: brush.size, opacity: brush.opacity })
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      inkRef.current = null
      setInkPreview(null)
    }
    const up = () => {
      stop()
      if (points.length < 2) return
      const xs = points.map((p) => p.x)
      const ys = points.map((p) => p.y)
      const pad = (Number(brush.size) || 1) / 2
      const minX = Math.min(...xs) - pad
      const maxX = Math.max(...xs) + pad
      const minY = Math.min(...ys) - pad
      const maxY = Math.max(...ys) + pad
      const ratio = aspectOf(docRef.current)
      onInk?.({
        x: Math.max(0, Math.min(100, minX)),
        y: Math.max(0, minY * ratio),
        w: Math.max(0.5, maxX - minX),
        h: Math.max(0.5, maxY - minY),
        points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
        size: brush.size,
        color: brush.color,
        opacity: brush.opacity,
        brush: brush.preset,
      })
    }
    inkRef.current = stop
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
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

  const hitIds = ({ box, poly }) => {
    const stage = stageRef.current
    if (!stage) return []
    const ids = []
    stage.querySelectorAll('[data-el]').forEach((node) => {
      const id = node.getAttribute('data-el')
      const el = docRef.current.elements.find((e) => e.id === id)
      if (!el) return
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
      const inside = (x, y) => pointInPolygon(x, y, poly)
      const picked =
        inside((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2) ||
        corners.some(([x, y]) => inside(x, y)) ||
        poly.some(([x, y]) => x > rect.left && x < rect.right && y > rect.top && y < rect.bottom)
      if (picked) ids.push(id)
    })
    return ids
  }

  const beginSelect = (e) => {
    const stage = stageRef.current
    if (!stage || e.button !== 0) return
    const rect = stage.getBoundingClientRect()
    if (!rect.width) return
    const mode = tool === 'lasso' ? 'lasso' : 'rect'
    const local = (ev) => ({
      x: Math.min(rect.width, Math.max(0, ev.clientX - rect.left)),
      y: Math.min(rect.height, Math.max(0, ev.clientY - rect.top)),
    })
    const origin = local(e)
    const session = { points: [[origin.x, origin.y]], moved: false }

    const paint = (at) => {
      if (mode === 'lasso') {
        setSelShape({ mode, points: [...session.points], vw: rect.width, vh: rect.height })
        return
      }
      setSelShape({
        mode,
        left: Math.min(origin.x, at.x),
        top: Math.min(origin.y, at.y),
        width: Math.abs(at.x - origin.x),
        height: Math.abs(at.y - origin.y),
      })
    }
    if (mode === 'lasso') paint(origin)

    const move = (ev) => {
      const at = local(ev)
      session.last = at
      if (mode === 'lasso') {
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
      if (mode === 'lasso') {
        onSelectMany?.(hitIds({ poly: session.points.map(([x, y]) => [x + rect.left, y + rect.top]) }), shifted)
        return
      }
      onSelectMany?.(hitIds({
        box: {
          left: rect.left + Math.min(origin.x, at.x),
          top: rect.top + Math.min(origin.y, at.y),
          right: rect.left + Math.max(origin.x, at.x),
          bottom: rect.top + Math.max(origin.y, at.y),
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

  const beginResize = (e, el) => {
    if (!interactive) return
    e.preventDefault()
    e.stopPropagation()
    const rect = stageRef.current.getBoundingClientRect()
    const pageHeight = 100 / (aspectOf(docRef.current) || 1)
    const start = {
      x: e.clientX,
      y: e.clientY,
      w: el.w,
      h: el.type === 'sticker' ? el.w / (el.aspect > 0 ? el.aspect : 1) : (el.h ?? 7.2),
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
      if (el.type === 'sticker') {
        const w = Math.min(100 - el.x, Math.max(6, start.w + dw))
        const h = Math.min(pageHeight, Math.max(3, start.h + dh))
        onPatchElement?.(
          el.id,
          { w: Math.round(w * 10) / 10, aspect: Math.round((w / h) * 1000) / 1000 },
          { history: false }
        )
        return
      }
      const w = Math.min(100 - el.x, Math.max(10, start.w + dw))
      const h = Math.min(pageHeight, Math.max(3, start.h + dh))
      onPatchElement?.(el.id, { w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 }, { history: false })
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
          style={style}
          boxStyle={boxStyle}
          onCommit={onEndEdit}
          onStartEdit={onStartEdit}
          onPointerDown={wrapperProps.onPointerDown}
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
      }
      const textStyle = {
        color: textColor,
        fontFamily: fontStack(el.font),
        fontSize: `${el.size}cqw`,
        fontWeight: el.weight,
        fontStyle: el.italic ? 'italic' : 'normal',
        letterSpacing: `${el.tracking ?? 0}em`,
        textTransform: el.transform === 'uppercase' ? 'uppercase' : 'none',
      }
      return (
        <BannerBody
          key={el.id}
          el={el}
          editing={isEditing}
          selected={isSelected}
          handles={handles}
          plateStyle={plateStyle}
          textStyle={textStyle}
          ornamentColor={strokeColor || textColor}
          innerColor={strokeColor || textColor}
          onPointerDown={wrapperProps.onPointerDown}
          onResize={(e) => beginResize(e, el)}
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
          onResize={(e) => beginResize(e, el)}
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
          {handles && (
            <span
              className="ts-resize"
              title="Drag to resize"
              onPointerDown={(e) => {
                e.stopPropagation()
                beginResize(e, el)
              }}
            />
          )}
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
          {handles && (
            <span
              className="ts-resize"
              title="Drag to resize"
              onPointerDown={(e) => beginResize(e, el)}
            />
          )}
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
          {handles && (
            <span
              className="ts-resize"
              title="Drag to resize"
              onPointerDown={(e) => {
                e.stopPropagation()
                beginResize(e, el)
              }}
            />
          )}
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
            {handles && (
              <span
                className="ts-resize"
                title="Drag to resize"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  beginResize(e, el)
                }}
              />
            )}
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
      return <div key={el.id} {...wrapperProps} className={`ts-el ts-shape${isSelected ? ' is-selected' : ''}`} style={style} />
    }

    if (el.type === 'sticker') {
      return (
        <div
          key={el.id}
          {...wrapperProps}
          className={`ts-el ts-sticker${isSelected ? ' is-selected' : ''}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            opacity: el.opacity ?? 1,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          }}
        >
          <img
            src={el.src}
            alt=""
            draggable={false}
            style={{
              aspectRatio: String(el.aspect > 0 ? el.aspect : 1),
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
              return (
                <span
                  key={slot.id}
                  className={`ts-sticker-slot ts-sticker-slot--image${slot.src ? ' has-image' : ''}`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }}
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
                  {slot.src ? <img src={slot.src} alt="" draggable={false} style={{ objectFit: slot.fit === 'contain' ? 'contain' : 'cover' }} /> : <span className="ts-slot-empty">{slot.label || 'Image'}</span>}
                </span>
              )
            }
            if (!slot.text && !interactive) return null
            return (
              <span
                key={slot.id}
                className={`ts-sticker-slot ts-sticker-slot--text${slot.text ? '' : ' is-empty'}`}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  fontSize: `${slot.size || 8}cqw`,
                  color: slot.color || '#1c2025',
                  textAlign: slot.align || 'center',
                  justifyContent: slot.align === 'left' ? 'flex-start' : slot.align === 'right' ? 'flex-end' : 'center',
                  fontFamily: slot.font === 'serif' ? 'Georgia, "Times New Roman", serif' : slot.font === 'display' ? 'var(--ts-font-display)' : 'var(--ts-font-ui)',
                }}
                onClick={(e) => { e.stopPropagation(); onSelect?.(el.id) }}
              >
                {slot.text || (interactive ? slot.label || 'Text' : '')}
              </span>
            )
          })}
          {handles && (
            <span
              className="ts-resize"
              title="Drag to resize"
              onPointerDown={(e) => {
                e.stopPropagation()
                beginResize(e, el)
              }}
            />
          )}
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
      </div>
    )
  }

  return (
    <div
      ref={stageRef}
      className={`ts-stage${interactive ? ' is-interactive' : ' is-preview'}${interactive && bgImage ? ' can-pan-bg' : ''}${interactive && tool === 'brush' ? ' is-brush' : ''}${interactive && tool === 'text' ? ' is-text-tool' : ''}${interactive && (tool === 'marquee' || tool === 'lasso') ? ' is-select-tool' : ''} ${className}`}
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
        if (!interactive) return
        if (tool === 'marquee' || tool === 'lasso') {
          e.stopPropagation()
          beginSelect(e)
          return
        }
        if (tool === 'brush') {
          e.stopPropagation()
          beginInk(e)
          return
        }
        if (tool === 'text') {
          e.stopPropagation()
          placeText(e)
        }
      }}
      onPointerDown={(e) => {
        if (!interactive) return
        if (e.target === e.currentTarget) {
          if (editingId) {
            const node = stageRef.current?.querySelector(`[data-el="${editingId}"]`)
            onEndEdit?.(editingId, node ? node.innerText : null)
          }
          // Paint lets the released selection frame be grabbed and dragged.
          if (tool === 'select' && frameBox && !frameBox.full && selectedIds.length > 1 && insideFrame(e)) {
            beginGroupDrag(e)
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
      {doc.elements.map(renderEl)}
      {frameBox && (
        <div
          className="ts-select-frame"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${frameBox.left}px`,
            top: `${frameBox.top}px`,
            width: `${frameBox.width}px`,
            height: `${frameBox.height}px`,
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
      {inkPreview && (
        <svg
          className="ts-ink-preview"
          viewBox={`0 0 100 ${100 / aspectOf(doc)}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points={inkPreview.points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={inkPreview.color}
            strokeWidth={inkPreview.size}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={inkPreview.opacity}
          />
        </svg>
      )}
    </div>
  )
}
