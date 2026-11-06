import React from 'react'
import { SOCIALS, socialMarkup } from '../data/socials.js'
import { Photo, Type } from './Icons.jsx'

export const ELEMENT_DRAG_TYPE = 'application/x-ts-element'

// Dragging a palette chip onto the page drops that element at the pointer.
export const elementDrag = (payload, type = ELEMENT_DRAG_TYPE) => ({
  draggable: true,
  onDragStart: (e) => {
    e.dataTransfer.setData(type, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  },
})

const ITEMS = [
  { kind: 'text', label: 'Text', glyph: () => <Type size={16} /> },
  { kind: 'banner', label: 'Name plate', title: 'Decorative name plate with editable text and colours', glyph: (p) => <span className={`${p}-banner-glyph`} /> },
  { kind: 'namecard', label: 'Name card', title: 'Name, role line and social handles in one editable block', glyph: (p) => <span className={`${p}-card-glyph`} /> },
  { kind: 'contactcard', label: 'Contact card', title: 'Card with a logo and a contact bar for phone and email', glyph: (p) => <span className={`${p}-card-glyph ${p}-card-glyph--contact`} /> },
  { kind: 'photo', label: 'Photo', glyph: () => <Photo size={16} /> },
  { kind: 'shape', id: 'line', label: 'Line', glyph: (p) => <span className={`${p}-line-glyph`} /> },
  { kind: 'shape', id: 'circle', label: 'Circle', glyph: (p) => <span className={`${p}-circle-glyph`} /> },
  { kind: 'shape', id: 'arch', label: 'Arch', glyph: (p) => <span className={`${p}-arch-glyph`} /> },
]

/**
 * The shared "Add elements" grid. `prefix` namespaces the class names so the
 * poster studio and the collage studio can style the same markup.
 */
export default function AddElementsPanel({
  onAdd,
  prefix = 'ts',
  hint = 'Drag any of these onto the page to drop it under your pointer, or click to add it.',
}) {
  return (
    <>
      <div className={`${prefix}-add-grid`}>
        {ITEMS.map((item) => (
          <button
            key={`${item.kind}-${item.id || ''}`}
            type="button"
            className={`${prefix}-add-btn`}
            title={item.title}
            onClick={() => onAdd(item.kind, item.id)}
            {...elementDrag({ kind: item.kind, id: item.id })}
          >
            {item.glyph(prefix)}
            <span>{item.label}</span>
          </button>
        ))}
        {SOCIALS.map((social) => (
          <button
            key={social.id}
            type="button"
            className={`${prefix}-add-btn`}
            title={`Add ${social.label} icon`}
            onClick={() => onAdd('social', social.id)}
            {...elementDrag({ kind: 'social', id: social.id })}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              dangerouslySetInnerHTML={{ __html: socialMarkup(social.id) }}
            />
            <span>{social.name}</span>
          </button>
        ))}
      </div>
      {hint && <p className={`${prefix}-hint`}>{hint}</p>}
    </>
  )
}
