import React, { useState } from 'react'
import { FONTS, PALETTES, ASPECTS, resolveColor } from '../data/presets.js'
import { ORNAMENTS, ornamentMarkup } from '../data/ornaments.js'
import { SOCIALS, socialMarkup } from '../data/socials.js'
import { FOOTER_PRESETS } from '../data/footers.js'
import { CONTACT_KINDS } from '../data/namecards.js'
import { layerLabel, makeFooterItem, uid } from '../model.js'
import { filterTextToScript, scriptLabel } from '../../elements.js'
import {
  ArrowDown, ArrowUp, Copy, Layers, Photo, Plus, Sparkle, Trash, Type,
} from './Icons.jsx'

const TOKENS = ['ink', 'accent', 'soft', 'paper', 'sand']

const EXTRA_COLORS = [
  '#000000', '#1f2937', '#4b5563', '#9ca3af', '#e5e7eb', '#ffffff',
  '#7c2d12', '#b91c1c', '#dc2626', '#f87171', '#fca5a5', '#fecaca',
  '#9a3412', '#c2410c', '#ea580c', '#fb923c', '#fdba74', '#fed7aa',
  '#854d0e', '#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a',
  '#166534', '#15803d', '#22c55e', '#4ade80', '#86efac', '#bbf7d0',
  '#0c4a6e', '#0369a1', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd',
  '#1e3a8a', '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe',
  '#4c1d95', '#6d28d9', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe',
  '#831843', '#be185d', '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8',
]

const Section = ({ title, aside, children }) => (
  <section className="ts-section">
    {title && (
      <h3>
        <span>{title}</span>
        {aside}
      </h3>
    )}
    {children}
  </section>
)

const Seg = ({ value, options, onChange }) => (
  <div className="ts-seg">
    {options.map((opt) => (
      <button
        key={String(opt.value)}
        type="button"
        className={value === opt.value ? 'is-active' : ''}
        onClick={() => onChange(opt.value)}
        title={opt.title || opt.label}
      >
        {opt.icon || opt.label}
      </button>
    ))}
  </div>
)

const Range = ({ label, value, display, min, max, step = 1, onChange, onStart, onEnd }) => (
  <div className="ts-range">
    <div className="ts-range-head">
      <span className="ts-label">{label}</span>
      <span className="ts-value">{display ?? value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onPointerDown={onStart}
      onPointerUp={onEnd}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  </div>
)

function ColorRow({ label, doc, value, onChange, allowNone = false, moreOpen = false }) {
  const [more, setMore] = useState(moreOpen)
  const resolved = value === 'none' || !value ? '#ffffff' : resolveColor(doc, value)
  return (
    <div className="ts-field">
      <span className="ts-label">{label}</span>
      <div className="ts-swatches">
        {allowNone && (
          <button
            type="button"
            className={`ts-swatch ts-swatch--none${value === 'none' ? ' is-active' : ''}`}
            onClick={() => onChange('none')}
            title="None"
          />
        )}
        {TOKENS.map((token) => (
          <button
            key={token}
            type="button"
            className={`ts-swatch${value === token ? ' is-active' : ''}`}
            style={{ background: doc.colors[token] }}
            onClick={() => onChange(token)}
            title={token}
          />
        ))}
        <label className="ts-swatch ts-swatch--custom" style={{ background: resolved }} title="Custom colour">
          <input
            type="color"
            value={resolved.toLowerCase().startsWith('#') ? resolved : '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <button
          type="button"
          className={`ts-swatch ts-swatch--more${more ? ' is-active' : ''}`}
          onClick={() => setMore((v) => !v)}
          title={more ? 'Hide more colours' : 'More colours'}
          aria-expanded={more}
        />
      </div>
      {more && (
        <div className="ts-color-grid">
          {EXTRA_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`ts-color-chip${String(value).toLowerCase() === color ? ' is-active' : ''}`}
              style={{ background: color }}
              onClick={() => onChange(color)}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const AlignIcon = ({ mode }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    {mode === 'left' && <><path d="M2 4h12M2 8h8M2 12h11" /></>}
    {mode === 'center' && <><path d="M2 4h12M4 8h8M3 12h10" /></>}
    {mode === 'right' && <><path d="M2 4h12M6 8h8M3 12h11" /></>}
  </svg>
)

// Dragging a palette chip onto the page drops that element at the pointer.
const elementDrag = (payload) => ({
  draggable: true,
  onDragStart: (e) => {
    e.dataTransfer.setData('application/x-ts-element', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  },
})

const LayerIcon = ({ el }) => {
  if (el.type === 'text') return <Type size={13} />
  if (el.type === 'banner') return <span className="ts-banner-glyph" />
  if (el.type === 'namecard') return <span className="ts-card-glyph" />
  if (el.type === 'photo') return <Photo size={13} />
  if (el.type === 'sticker') return <img className="ts-layer-thumb" src={el.src} alt="" />
  if (el.type === 'social') {
    return (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        dangerouslySetInnerHTML={{ __html: socialMarkup(el.platform) }}
      />
    )
  }
  if (el.type === 'ornament') return <span className="ts-dot" />
  if (el.type === 'footer') return <span className="ts-footer-glyph" />
  return <span className="ts-square" />
}

export default function Inspector({
  doc,
  selected,
  onSelect,
  onPatchDoc,
  onPatchEl,
  onBegin,
  onEnd,
  onApplyPalette,
  onDuplicate,
  onDelete,
  onReorder,
  onMoveToEdge,
  onAddText,
  onAddBanner,
  onAddNameCard,
  onAddContactCard,
  onAddShape,
  onAddOrnament,
  onAddPhoto,
  onAddSocial,
  onAddFooter,
  onAddSticker,
  templateElements = [],
  logoElements = [],
  scannedElements = [],
  onRequestPhoto,
  onRemoveBackground,
  onRemoveSlotBackground,
  cutting = false,
}) {
  const setEl = (patch, opts) => selected && onPatchEl(selected.id, patch, opts)
  const live = (patch) => setEl(patch, { history: false })
  const sizeOptions = FONTS.map((f) => ({ value: f.id, label: f.name }))
  const [cutTolerance, setCutTolerance] = useState(30)
  const [cuttingSlot, setCuttingSlot] = useState(null)
  const footerItems = selected?.type === 'footer' ? selected.items || [] : []
  const stickerSlots = selected?.type === 'sticker' && Array.isArray(selected.slots) ? selected.slots : []
  const stickerAspect = selected?.type === 'sticker' && selected.aspect > 0 ? selected.aspect : 1
  const stickerHeight = selected?.type === 'sticker' ? Math.round((selected.w / stickerAspect) * 10) / 10 : 0
  const pageHeightUnits = Math.round((100 / (ASPECTS[doc.aspect]?.ratio || 1)) * 10) / 10

  const patchSlot = (slotId, patch) => {
    if (!selected) return
    onPatchEl(selected.id, {
      slots: (selected.slots || []).map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot)),
    }, { history: false })
  }

  const slotFontLabel = (font) => ({ sans: 'Sans', serif: 'Serif', display: 'Display' }[font] || 'Sans')
  const cutSlotBackground = async (slot) => {
    if (!selected || !slot?.src) return
    setCuttingSlot(slot.id)
    try {
      await onRemoveSlotBackground?.(selected.id, slot.id, cutTolerance)
    } finally {
      setCuttingSlot(null)
    }
  }

  const patchFooterItem = (itemId, patch) => {
    if (!selected) return
    setEl({ items: (selected.items || []).map((item) => (item.id === itemId ? { ...item, ...patch } : item)) })
  }

  const moveFooterItem = (index, direction) => {
    if (!selected) return
    const items = [...(selected.items || [])]
    const next = index + direction
    if (next < 0 || next >= items.length) return
    const [item] = items.splice(index, 1)
    items.splice(next, 0, item)
    setEl({ items })
  }

  const removeFooterItem = (itemId) => {
    if (!selected) return
    setEl({ items: (selected.items || []).filter((item) => item.id !== itemId) })
  }

  const nameSocials = selected?.type === 'namecard' ? selected.socials || [] : []

  const patchNameSocial = (itemId, patch) => {
    if (!selected) return
    setEl({ socials: nameSocials.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) })
  }

  const liveNameSocial = (itemId, patch) => {
    if (!selected) return
    setEl({
      socials: nameSocials.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }, { history: false })
  }

  const addNameSocial = () => {
    if (!selected) return
    setEl({
      socials: [
        ...nameSocials,
        { id: uid('ncs'), platform: 'instagram', platform2: '', handle: '@yourhandle' },
      ],
    })
  }

  const removeNameSocial = (itemId) => {
    if (!selected) return
    setEl({ socials: nameSocials.filter((item) => item.id !== itemId) })
  }

  const nameContacts = selected?.type === 'namecard' ? selected.contacts || [] : []

  const patchContact = (itemId, patch) => {
    if (!selected) return
    setEl({
      contacts: nameContacts.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    })
  }

  const liveContact = (itemId, patch) => {
    if (!selected) return
    setEl({
      contacts: nameContacts.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }, { history: false })
  }

  const addContact = () => {
    if (!selected) return
    setEl({
      contacts: [...nameContacts, { id: uid('ncc'), kind: 'phone', text: '+91 00000 00000' }],
    })
  }

  const removeContact = (itemId) => {
    if (!selected) return
    setEl({ contacts: nameContacts.filter((item) => item.id !== itemId) })
  }

  return (
    <aside className="ts-inspector">
      <div className="ts-inspector-scroll">
        {selected ? (
          <Section
            title={
              selected.type === 'text' ? 'Text'
                : selected.type === 'banner' ? 'Name plate'
                : selected.type === 'namecard' ? 'Name card'
                : selected.type === 'photo' ? (selected.role === 'logo' ? 'Logo' : 'Photo')
                  : selected.type === 'ornament' ? 'Ornament'
                    : selected.type === 'social' ? 'Social icon'
                      : selected.type === 'footer' ? 'Social footer'
                        : selected.type === 'sticker' ? 'Scanned element' : 'Shape'
            }
            aside={
              <span className="ts-mini-actions">
                <button type="button" className="ts-icon-btn" onClick={onDuplicate} title="Duplicate (Ctrl+D)"><Copy size={14} /></button>
                <button type="button" className="ts-icon-btn" onClick={() => onDelete(selected.id)} title="Delete"><Trash size={14} /></button>
              </span>
            }
          >
            {selected.type === 'text' && (
              <>
                <textarea
                  className="ts-textarea"
                  value={selected.text}
                  rows={2}
                  spellCheck={false}
                  onFocus={onBegin}
                  onBlur={onEnd}
                  onChange={(e) => live({ text: e.target.value })}
                />
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Font</span>
                  <select className="ts-select" value={selected.font} onChange={(e) => setEl({ font: e.target.value })}>
                    {sizeOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <Range
                  label="Size"
                  value={selected.size}
                  display={`${selected.size.toFixed(1)}`}
                  min={1.5}
                  max={18}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ size: v })}
                />
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Style</span>
                  <Seg
                    value={selected.weight}
                    onChange={(v) => setEl({ weight: v })}
                    options={[
                      { value: 400, label: 'Aa' },
                      { value: 600, label: 'Aa', title: 'Medium', icon: <b>Aa</b> },
                      { value: 700, label: 'Aa', title: 'Bold', icon: <strong>Aa</strong> },
                    ]}
                  />
                  <button
                    type="button"
                    className={`ts-toggle ts-toggle--italic${selected.italic ? ' is-active' : ''}`}
                    onClick={() => setEl({ italic: !selected.italic })}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className={`ts-toggle${selected.transform === 'uppercase' ? ' is-active' : ''}`}
                    onClick={() => setEl({ transform: selected.transform === 'uppercase' ? 'none' : 'uppercase' })}
                    title="Uppercase"
                  >
                    AG
                  </button>
                </div>
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Align</span>
                  <Seg
                    value={selected.align}
                    onChange={(v) => setEl({ align: v })}
                    options={[
                      { value: 'left', icon: <AlignIcon mode="left" />, title: 'Align left' },
                      { value: 'center', icon: <AlignIcon mode="center" />, title: 'Align center' },
                      { value: 'right', icon: <AlignIcon mode="right" />, title: 'Align right' },
                    ]}
                  />
                  <span className="ts-spacer" />
                </div>
                <Range
                  label="Letter spacing"
                  value={selected.tracking}
                  display={`${selected.tracking.toFixed(2)} em`}
                  min={-0.05}
                  max={0.5}
                  step={0.01}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ tracking: v })}
                />
                <Range
                  label="Line height"
                  value={selected.lineHeight}
                  display={selected.lineHeight.toFixed(2)}
                  min={0.9}
                  max={2.2}
                  step={0.05}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ lineHeight: v })}
                />
                <ColorRow label="Text colour" doc={doc} value={selected.color} moreOpen onChange={(v) => setEl({ color: v }, { immediate: true })} />
                <div className="ts-subhead">Text background</div>
                <ColorRow label="Background colour" doc={doc} value={selected.bg || 'none'} onChange={(v) => setEl({ bg: v }, { immediate: true })} allowNone />
                <ColorRow label="Border colour" doc={doc} value={selected.bgStroke || 'none'} onChange={(v) => setEl({ bgStroke: v }, { immediate: true })} allowNone />
                {selected.bgStroke && selected.bgStroke !== 'none' && (
                  <Range
                    label="Border width"
                    value={selected.bgStrokeWidth ?? 0.12}
                    display={`${(selected.bgStrokeWidth ?? 0.12).toFixed(2)}`}
                    min={0.04}
                    max={0.6}
                    step={0.02}
                    onStart={onBegin}
                    onEnd={onEnd}
                    onChange={(v) => live({ bgStrokeWidth: v })}
                  />
                )}
                <Range
                  label="Corner radius"
                  value={selected.bgRadius ?? 0}
                  display={`${(selected.bgRadius ?? 0).toFixed(2)}`}
                  min={0}
                  max={3}
                  step={0.05}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ bgRadius: v })}
                />
                <p className="ts-hint">Background colour sits behind the text. Pick None for no fill, the rainbow swatch for more colours, or the last round swatch for any custom colour.</p>
              </>
            )}

            {selected.type === 'banner' && (
              <>
                <textarea
                  className="ts-textarea"
                  value={selected.text}
                  rows={2}
                  spellCheck={false}
                  onFocus={onBegin}
                  onBlur={onEnd}
                  onChange={(e) => live({ text: e.target.value })}
                />
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Font</span>
                  <select className="ts-select" value={selected.font} onChange={(e) => setEl({ font: e.target.value })}>
                    {sizeOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <Range
                  label="Text size"
                  value={selected.size}
                  display={`${selected.size.toFixed(1)}`}
                  min={1.5}
                  max={10}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ size: v })}
                />
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Style</span>
                  <Seg
                    value={selected.weight}
                    onChange={(v) => setEl({ weight: v })}
                    options={[
                      { value: 400, label: 'Aa' },
                      { value: 600, label: 'Aa', title: 'Medium', icon: <b>Aa</b> },
                      { value: 700, label: 'Aa', title: 'Bold', icon: <strong>Aa</strong> },
                    ]}
                  />
                  <button
                    type="button"
                    className={`ts-toggle ts-toggle--italic${selected.italic ? ' is-active' : ''}`}
                    onClick={() => setEl({ italic: !selected.italic })}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className={`ts-toggle${selected.transform === 'uppercase' ? ' is-active' : ''}`}
                    onClick={() => setEl({ transform: selected.transform === 'uppercase' ? 'none' : 'uppercase' })}
                    title="Uppercase"
                  >
                    AG
                  </button>
                </div>
                <Range
                  label="Letter spacing"
                  value={selected.tracking ?? 0}
                  display={`${(selected.tracking ?? 0).toFixed(2)} em`}
                  min={-0.05}
                  max={0.4}
                  step={0.01}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ tracking: v })}
                />
                <ColorRow label="Text colour" doc={doc} value={selected.color} onChange={(v) => setEl({ color: v }, { immediate: true })} moreOpen />
                <div className="ts-subhead">Plate</div>
                <ColorRow label="Background" doc={doc} value={selected.plate || 'none'} onChange={(v) => setEl({ plate: v }, { immediate: true })} allowNone />
                <ColorRow label="Border colour" doc={doc} value={selected.strokeColor || 'none'} onChange={(v) => setEl({ strokeColor: v }, { immediate: true })} allowNone />
                <Range
                  label="Border width"
                  value={selected.strokeWidth ?? 0.22}
                  display={`${(selected.strokeWidth ?? 0.22).toFixed(2)}`}
                  min={0}
                  max={0.8}
                  step={0.02}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ strokeWidth: v })}
                />
                <Range
                  label="Corner radius"
                  value={selected.radius ?? 1.4}
                  display={`${(selected.radius ?? 1.4).toFixed(2)}`}
                  min={0}
                  max={4}
                  step={0.05}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ radius: v })}
                />
                <label className="ts-check">
                  <input
                    type="checkbox"
                    checked={selected.inner !== false}
                    onChange={(e) => setEl({ inner: e.target.checked })}
                  />
                  <span>Inner border line</span>
                </label>
                <label className="ts-check">
                  <input
                    type="checkbox"
                    checked={selected.ornaments !== false}
                    onChange={(e) => setEl({ ornaments: e.target.checked })}
                  />
                  <span>Side ornaments</span>
                </label>
                <Range
                  label="Width"
                  value={selected.w}
                  display={`${selected.w.toFixed(1)}%`}
                  min={10}
                  max={100}
                  step={0.5}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ w: v })}
                />
                <Range
                  label="Height"
                  value={selected.h ?? 13}
                  display={`${(selected.h ?? 13).toFixed(1)}`}
                  min={4}
                  max={30}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ h: v })}
                />
                <p className="ts-hint">Double-click the plate on the canvas to edit the name. Drag the corner handle to resize, or drop it over other elements — layer order decides what sits on top.</p>
              </>
            )}

            {selected.type === 'namecard' && (
              <>
                <div className="ts-subhead">Card</div>
                <ColorRow
                  label="Background"
                  doc={doc}
                  value={selected.bg ?? '#ffffff'}
                  allowNone
                  onChange={(v) => setEl({ bg: v }, { immediate: true })}
                />
                <Range
                  label="Corner radius"
                  value={selected.bgRadius ?? 0.9}
                  display={`${(selected.bgRadius ?? 0.9).toFixed(1)}`}
                  min={0}
                  max={4}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ bgRadius: v })}
                />
                <div className="ts-photo-actions">
                  <button
                    type="button"
                    className="ts-btn ts-btn-ghost"
                    onClick={() => onRequestPhoto?.({ kind: 'namecardLogo', cardId: selected.id })}
                  >
                    <Photo size={14} /> {selected.logo ? 'Change logo' : 'Add logo'}
                  </button>
                  {selected.logo && (
                    <button type="button" className="ts-btn ts-btn-ghost" onClick={() => setEl({ logo: '' })}>
                      Remove
                    </button>
                  )}
                </div>
                <Range
                  label="Logo size"
                  value={selected.logoSize ?? 7.5}
                  display={`${(selected.logoSize ?? 7.5).toFixed(1)}`}
                  min={3}
                  max={18}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ logoSize: v })}
                />
                <ColorRow
                  label="Logo ring"
                  doc={doc}
                  value={selected.logoRing ?? 'none'}
                  allowNone
                  onChange={(v) => setEl({ logoRing: v }, { immediate: true })}
                />
                <div className="ts-subhead">Text</div>
                <textarea
                  className="ts-textarea"
                  value={selected.name}
                  rows={2}
                  spellCheck={false}
                  onFocus={onBegin}
                  onBlur={onEnd}
                  onChange={(e) => live({ name: e.target.value })}
                />
                <textarea
                  className="ts-textarea"
                  value={selected.title || ''}
                  rows={2}
                  placeholder="Role, constituency or tagline"
                  spellCheck={false}
                  onFocus={onBegin}
                  onBlur={onEnd}
                  onChange={(e) => live({ title: e.target.value })}
                />
                <div className="ts-subhead">Social media</div>
                <div className="ts-footer-edit-head">
                  <span className="ts-label">Handles</span>
                  <button type="button" className="ts-btn ts-btn-ghost ts-footer-add" onClick={addNameSocial}>
                    <Plus size={12} /> Add handle
                  </button>
                </div>
                <div className="ts-footer-editor">
                  {nameSocials.map((item) => (
                    <div className="ts-footer-edit" key={item.id}>
                      <div className="ts-footer-edit-top">
                        <select
                          className="ts-select"
                          value={item.platform}
                          onChange={(e) => patchNameSocial(item.id, { platform: e.target.value })}
                        >
                          {SOCIALS.map((social) => (
                            <option key={social.id} value={social.id}>{social.label}</option>
                          ))}
                        </select>
                        <select
                          className="ts-select"
                          value={item.platform2 || 'none'}
                          title="Second icon in this entry"
                          onChange={(e) => patchNameSocial(item.id, { platform2: e.target.value === 'none' ? '' : e.target.value })}
                        >
                          <option value="none">No 2nd icon</option>
                          {SOCIALS.map((social) => (
                            <option key={social.id} value={social.id}>{social.name}</option>
                          ))}
                        </select>
                        <span className="ts-footer-item-actions">
                          <button type="button" title="Remove handle" onClick={() => removeNameSocial(item.id)}>
                            <Trash size={12} />
                          </button>
                        </span>
                      </div>
                      <input
                        className="ts-input"
                        value={item.handle || ''}
                        placeholder="@handle or page name"
                        spellCheck={false}
                        onFocus={onBegin}
                        onBlur={onEnd}
                        onChange={(e) => liveNameSocial(item.id, { handle: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <div className="ts-subhead">Contact bar</div>
                <div className="ts-footer-edit-head">
                  <span className="ts-label">Phone, email or address</span>
                  <button type="button" className="ts-btn ts-btn-ghost ts-footer-add" onClick={addContact}>
                    <Plus size={12} /> Add contact
                  </button>
                </div>
                {nameContacts.length > 0 && (
                  <div className="ts-footer-editor">
                    {nameContacts.map((item) => (
                      <div className="ts-footer-edit" key={item.id}>
                        <div className="ts-footer-edit-top">
                          <select
                            className="ts-select"
                            value={item.kind}
                            title="Contact icon"
                            onChange={(e) => patchContact(item.id, { kind: e.target.value })}
                          >
                            {CONTACT_KINDS.map((kind) => (
                              <option key={kind.id} value={kind.id}>{kind.label}</option>
                            ))}
                          </select>
                          <span className="ts-footer-item-actions">
                            <button type="button" title="Remove contact" onClick={() => removeContact(item.id)}>
                              <Trash size={12} />
                            </button>
                          </span>
                        </div>
                        <input
                          className="ts-input"
                          value={item.text || ''}
                          placeholder="+91 00000 00000"
                          spellCheck={false}
                          onFocus={onBegin}
                          onBlur={onEnd}
                          onChange={(e) => liveContact(item.id, { text: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <ColorRow
                  label="Bar colour"
                  doc={doc}
                  value={selected.contactBg ?? '#0e5b5e'}
                  allowNone
                  onChange={(v) => setEl({ contactBg: v }, { immediate: true })}
                />
                <ColorRow
                  label="Contact colour"
                  doc={doc}
                  value={selected.contactColor ?? '#ffffff'}
                  onChange={(v) => setEl({ contactColor: v }, { immediate: true })}
                />
                <Range
                  label="Contact size"
                  value={selected.contactSize ?? 1.7}
                  display={`${(selected.contactSize ?? 1.7).toFixed(1)}`}
                  min={1}
                  max={4}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ contactSize: v })}
                />
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Font</span>
                  <select className="ts-select" value={selected.font} onChange={(e) => setEl({ font: e.target.value })}>
                    {sizeOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Align</span>
                  <Seg
                    value={selected.align || 'left'}
                    onChange={(v) => setEl({ align: v })}
                    options={[
                      { value: 'left', label: 'L', title: 'Align left', icon: <AlignIcon mode="left" /> },
                      { value: 'center', label: 'C', title: 'Align centre', icon: <AlignIcon mode="center" /> },
                      { value: 'right', label: 'R', title: 'Align right', icon: <AlignIcon mode="right" /> },
                    ]}
                  />
                </div>
                <Range
                  label="Name size"
                  value={selected.nameSize ?? 5}
                  display={`${(selected.nameSize ?? 5).toFixed(1)}`}
                  min={2}
                  max={10}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ nameSize: v })}
                />
                <Range
                  label="Role size"
                  value={selected.titleSize ?? 2.1}
                  display={`${(selected.titleSize ?? 2.1).toFixed(1)}`}
                  min={1}
                  max={5}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ titleSize: v })}
                />
                <Range
                  label="Social size"
                  value={selected.socialSize ?? 2}
                  display={`${(selected.socialSize ?? 2).toFixed(1)}`}
                  min={1}
                  max={5}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ socialSize: v })}
                />
                <ColorRow label="Name colour" doc={doc} value={selected.nameColor} onChange={(v) => setEl({ nameColor: v }, { immediate: true })} />
                <ColorRow label="Role colour" doc={doc} value={selected.titleColor} onChange={(v) => setEl({ titleColor: v }, { immediate: true })} />
                <ColorRow label="Handle colour" doc={doc} value={selected.socialColor} onChange={(v) => setEl({ socialColor: v }, { immediate: true })} />
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Icons</span>
                  <Seg
                    value={selected.icons || 'brand'}
                    onChange={(v) => setEl({ icons: v })}
                    options={[
                      { value: 'brand', label: 'Brand', title: 'Original social media colours' },
                      { value: 'bar', label: 'Line', title: 'Use one icon colour' },
                    ]}
                  />
                </div>
                {selected.icons !== 'brand' && (
                  <ColorRow label="Icon colour" doc={doc} value={selected.iconColor} onChange={(v) => setEl({ iconColor: v }, { immediate: true })} />
                )}
                <Range
                  label="Width"
                  value={selected.w}
                  display={`${selected.w.toFixed(1)}%`}
                  min={30}
                  max={100}
                  step={0.5}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ w: v })}
                />
                <Range
                  label="Height"
                  value={selected.h ?? 24}
                  display={`${(selected.h ?? 24).toFixed(1)}`}
                  min={6}
                  max={60}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ h: v })}
                />
                <p className="ts-hint">Double-click the card, the role line, a handle or a contact to edit it in place. Double-click the logo to swap it. Drag the corner handle to resize.</p>
              </>
            )}

            {selected.type === 'photo' && (
              <>
                <div className="ts-photo-actions">
                  <button type="button" className="ts-btn ts-btn-primary" onClick={() => onRequestPhoto?.(selected.id)}>
                    <Photo size={14} /> {selected.role === 'logo' ? 'Change party logo' : 'Replace photo'}
                  </button>
                  <button type="button" className="ts-btn ts-btn-ghost" onClick={() => setEl({ src: '' })}>
                    Remove
                  </button>
                </div>
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Role</span>
                  <Seg
                    value={selected.role || 'photo'}
                    onChange={(v) => setEl({ role: v === 'logo' ? 'logo' : undefined })}
                    options={[
                      { value: 'photo', label: 'Photo' },
                      { value: 'logo', label: 'Party logo' },
                    ]}
                  />
                </div>
                <p className="ts-hint">
                  {selected.role === 'logo'
                    ? 'Upload the party emblem here. Drop an image straight on the frame to swap it.'
                    : 'Drop an image straight onto the frame to replace it, then Shift-drag to slide the photo inside the frame.'}
                </p>
                <div className="ts-cutout">
                  <button
                    type="button"
                    className="ts-btn ts-btn-ghost ts-cutout-btn"
                    disabled={!selected.src || cutting}
                    onClick={() => onRemoveBackground?.(selected.id, cutTolerance)}
                  >
                    <Sparkle size={14} /> {cutting ? 'Removing background…' : 'Remove background'}
                  </button>
                  <Range
                    label="Cut-out tolerance"
                    value={cutTolerance}
                    display={String(cutTolerance)}
                    min={10}
                    max={90}
                    step={1}
                    onChange={setCutTolerance}
                  />
                  <p className="ts-hint">
                    Best on portraits with a plain backdrop. Raise the tolerance if the edges keep some background.
                  </p>
                </div>
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Fit</span>
                  <Seg
                    value={selected.fit || 'cover'}
                    onChange={(v) => setEl({ fit: v })}
                    options={[
                      { value: 'cover', label: 'Fill', title: 'Fill the frame and crop the edges' },
                      { value: 'contain', label: 'Fit inside', title: 'Show the whole image inside the frame' },
                    ]}
                  />
                </div>
                <p className="ts-hint">“Fit inside” keeps the whole uploaded image visible inside the frame; “Fill” crops it to cover the frame.</p>
                <Range
                  label="Zoom"
                  value={selected.zoom ?? 1}
                  display={`${(selected.zoom ?? 1).toFixed(2)}×`}
                  min={1}
                  max={2.5}
                  step={0.01}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ zoom: v })}
                />
                <Range
                  label="Position X"
                  value={selected.panX ?? 0}
                  display={`${Math.round(selected.panX ?? 0)}%`}
                  min={-50}
                  max={50}
                  step={1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ panX: v })}
                />
                <Range
                  label="Position Y"
                  value={selected.panY ?? 0}
                  display={`${Math.round(selected.panY ?? 0)}%`}
                  min={-50}
                  max={50}
                  step={1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ panY: v })}
                />
                <div className="ts-field">
                  <span className="ts-label">Frame shape</span>
                  <Seg
                    value={selected.shape || 'rect'}
                    onChange={(v) => setEl({ shape: v })}
                    options={[
                      { value: 'rect', label: 'Rect' },
                      { value: 'rounded', label: 'Rounded' },
                      { value: 'circle', label: 'Circle' },
                      { value: 'arch', label: 'Arch' },
                    ]}
                  />
                </div>
                {selected.shape === 'rounded' && (
                  <Range
                    label="Corner"
                    value={selected.radius ?? 1.4}
                    display={`${(selected.radius ?? 1.4).toFixed(1)}`}
                    min={0}
                    max={10}
                    step={0.1}
                    onStart={onBegin}
                    onEnd={onEnd}
                    onChange={(v) => live({ radius: v })}
                  />
                )}
                <Range
                  label="Width"
                  value={selected.w}
                  display={`${selected.w.toFixed(1)}%`}
                  min={5}
                  max={100}
                  step={0.5}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ w: v })}
                />
                <Range
                  label="Height"
                  value={selected.h ?? selected.w}
                  display={`${(selected.h ?? selected.w).toFixed(1)}`}
                  min={5}
                  max={Math.max(100, pageHeightUnits)}
                  step={0.5}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ h: v })}
                />
                <button
                  type="button"
                  className="ts-btn ts-btn-ghost ts-fill-page"
                  onClick={() => setEl({ x: 0, y: 0, w: 100, h: pageHeightUnits })}
                >
                  Extend to the whole page
                </button>
                <ColorRow
                  label="Backdrop"
                  doc={doc}
                  value={selected.backdrop || 'none'}
                  onChange={(v) => setEl({ backdrop: v })}
                  allowNone
                />
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Blend</span>
                  <select
                    className="ts-select"
                    value={selected.blend || 'normal'}
                    onChange={(e) => setEl({ blend: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="overlay">Overlay</option>
                    <option value="soft-light">Soft light</option>
                  </select>
                </div>
                <ColorRow
                  label="Tint"
                  doc={doc}
                  value={selected.tint || 'none'}
                  onChange={(v) => setEl({ tint: v })}
                  allowNone
                />
                <Range
                  label="Tint strength"
                  value={selected.tintStrength ?? 0}
                  display={`${Math.round((selected.tintStrength ?? 0) * 100)}%`}
                  min={0}
                  max={1}
                  step={0.01}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ tintStrength: v })}
                />
                <ColorRow
                  label="Border"
                  doc={doc}
                  value={selected.borderColor || 'none'}
                  onChange={(v) => setEl({ borderColor: v })}
                  allowNone
                />
                <Range
                  label="Border width"
                  value={selected.borderWidth ?? 0}
                  display={(selected.borderWidth ?? 0).toFixed(2)}
                  min={0}
                  max={1.5}
                  step={0.05}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ borderWidth: v })}
                />
              </>
            )}

            {selected.type === 'shape' && (
              <>
                <ColorRow label="Fill" doc={doc} value={selected.fill} onChange={(v) => setEl({ fill: v })} allowNone />
                <ColorRow label="Stroke" doc={doc} value={selected.stroke} onChange={(v) => setEl({ stroke: v })} allowNone />
                <Range
                  label="Stroke width"
                  value={selected.strokeWidth}
                  display={selected.strokeWidth.toFixed(2)}
                  min={0}
                  max={1.2}
                  step={0.05}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ strokeWidth: v })}
                />
              </>
            )}

            {selected.type === 'ornament' && (
              <>
                <ColorRow label="Colour" doc={doc} value={selected.color} onChange={(v) => setEl({ color: v })} />
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Flip</span>
                  <button
                    type="button"
                    className={`ts-toggle${selected.flipX ? ' is-active' : ''}`}
                    onClick={() => setEl({ flipX: !selected.flipX })}
                  >
                    Flip horizontal
                  </button>
                </div>
              </>
            )}

            {selected.type === 'social' && (
              <>
                <div className="ts-field">
                  <span className="ts-label">Platform</span>
                  <Seg
                    value={selected.platform}
                    onChange={(v) => setEl({ platform: v })}
                    options={SOCIALS.map((s) => ({ value: s.id, label: s.name, title: s.label }))}
                  />
                </div>
                <ColorRow label="Colour" doc={doc} value={selected.color} onChange={(v) => setEl({ color: v })} />
                <Range
                  label="Size"
                  value={selected.w}
                  display={`${selected.w.toFixed(1)}%`}
                  min={1}
                  max={14}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ w: v })}
                />
              </>
            )}

            {selected.type === 'footer' && (
              <>
                <div className="ts-footer-edit-head">
                  <span className="ts-label">Items</span>
                  <button
                    type="button"
                    className="ts-btn ts-btn-ghost ts-footer-add"
                    onClick={() => setEl({ items: [...footerItems, makeFooterItem()] })}
                  >
                    <Plus size={12} /> Add item
                  </button>
                </div>
                <div className="ts-footer-editor">
                  {footerItems.map((item, index) => (
                    <div className="ts-footer-edit" key={item.id}>
                      <div className="ts-footer-edit-top">
                        <select
                          className="ts-select"
                          value={item.icon}
                          onChange={(e) => patchFooterItem(item.id, { icon: e.target.value })}
                        >
                          <option value="x">X (Twitter)</option>
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                          <option value="image">Image</option>
                        </select>
                        <span className="ts-footer-item-actions">
                          <button type="button" title="Move left" disabled={index === 0} onClick={() => moveFooterItem(index, -1)}>
                            <ArrowUp size={12} style={{ transform: 'rotate(-90deg)' }} />
                          </button>
                          <button type="button" title="Move right" disabled={index === footerItems.length - 1} onClick={() => moveFooterItem(index, 1)}>
                            <ArrowDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                          </button>
                          <button type="button" title="Remove item" onClick={() => removeFooterItem(item.id)}>
                            <Trash size={12} />
                          </button>
                        </span>
                      </div>
                      <input
                        className="ts-input"
                        value={item.text}
                        placeholder="@handle or name"
                        spellCheck={false}
                        onFocus={onBegin}
                        onBlur={onEnd}
                        onChange={(e) => live({
                          items: footerItems.map((it) => (it.id === item.id ? { ...it, text: e.target.value } : it)),
                        })}
                      />
                      {item.icon === 'image' && (
                        <button
                          type="button"
                          className="ts-btn ts-btn-ghost ts-footer-img-btn"
                          onClick={() => onRequestPhoto?.({ kind: 'footerItem', footerId: selected.id, itemId: item.id })}
                        >
                          <Photo size={13} /> {item.src ? 'Change image' : 'Choose image'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <ColorRow label="Bar colour" doc={doc} value={selected.bg} onChange={(v) => setEl({ bg: v })} />
                <ColorRow label="Text & icons" doc={doc} value={selected.color} onChange={(v) => setEl({ color: v })} />
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Icon colour</span>
                  <Seg
                    value={selected.icons || 'bar'}
                    onChange={(v) => setEl({ icons: v })}
                    options={[
                      { value: 'bar', label: 'Bar' },
                      { value: 'brand', label: 'Brand', title: 'Original social media colours' },
                    ]}
                  />
                </div>
                <Range
                  label="Width"
                  value={selected.w}
                  display={`${selected.w.toFixed(1)}%`}
                  min={10}
                  max={100}
                  step={0.5}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ w: v })}
                />
                <Range
                  label="Height"
                  value={selected.h ?? 7.2}
                  display={`${(selected.h ?? 7.2).toFixed(1)}`}
                  min={3}
                  max={20}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ h: v })}
                />
                <Range
                  label="Corner"
                  value={selected.radius ?? 0}
                  display={`${(selected.radius ?? 0).toFixed(1)}`}
                  min={0}
                  max={10}
                  step={0.1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ radius: v })}
                />
                <p className="ts-hint">Drag the bar to move it, or its corner handle to resize. With the bar selected, drag a handle to slide it along the bar — double-click a handle to recentre it.</p>
              </>
            )}

            {selected.type === 'sticker' && (
              <>
                <Range
                  label="Width"
                  value={selected.w}
                  display={`${selected.w.toFixed(1)}%`}
                  min={6}
                  max={100}
                  step={0.5}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ w: v })}
                />
                <Range
                  label="Height"
                  value={stickerHeight}
                  display={`${stickerHeight.toFixed(1)}%`}
                  min={3}
                  max={Math.max(100, pageHeightUnits)}
                  step={0.5}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => live({ aspect: Math.max(0.1, selected.w / Math.max(3, v)) })}
                />
                <p className="ts-hint">Drag the corner handle to scale it freely, or use Width and Height to stretch the scanned element to fit the template. Added from Admin → Element scanner.</p>
                <div className="ts-field ts-field--inline">
                  <span className="ts-label">Blend</span>
                  <select
                    className="ts-select"
                    value={selected.blend || 'normal'}
                    onChange={(e) => setEl({ blend: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="overlay">Overlay</option>
                    <option value="soft-light">Soft light</option>
                  </select>
                </div>
                <p className="ts-hint">Multiply keeps a poster template from hiding your photo — its white areas turn transparent over the image.</p>
                <div className="ts-cutout">
                  <button
                    type="button"
                    className="ts-btn ts-btn-ghost ts-cutout-btn"
                    disabled={!selected.src || cutting}
                    onClick={() => onRemoveBackground?.(selected.id, cutTolerance)}
                  >
                    <Sparkle size={14} /> {cutting ? 'Removing background…' : 'Remove background'}
                  </button>
                  <Range
                    label="Cut-out tolerance"
                    value={cutTolerance}
                    display={String(cutTolerance)}
                    min={10}
                    max={90}
                    step={1}
                    onChange={setCutTolerance}
                  />
                  <p className="ts-hint">
                    Works on any scanned element with a plain backdrop — raise the tolerance if the edges keep some background. Transparent scans are left as they are.
                  </p>
                </div>
                {stickerSlots.length > 0 && (
                  <div className="ts-slots">
                    <span className="ts-subhead">Editable areas</span>
                    {stickerSlots.map((slot) => (
                      <div className="ts-slot" key={slot.id}>
                        <div className="ts-slot-head">
                          <span className={`ts-slot-kind ts-slot-kind--${slot.kind}`}>{slot.kind === 'text' ? 'TEXT' : 'IMAGE'}</span>
                          <strong>{slot.label}</strong>
                        </div>
                        {slot.kind === 'text' ? (
                          <>
                            <input
                              className="ts-input"
                              value={slot.text || ''}
                              placeholder="Type the text for this area"
                              aria-label={`${slot.label} text`}
                              onChange={(event) => patchSlot(slot.id, { text: filterTextToScript(event.target.value, slot.script) })}
                            />
                            <div className="ts-slot-lock">
                              <span>{slotFontLabel(slot.font)}</span>
                              <span>{scriptLabel(slot.script)}</span>
                            </div>
                            <div className="ts-slot-row">
                              <label className="ts-slot-size" title="Text size">
                                <span>Aa</span>
                                <input
                                  type="range"
                                  min={3}
                                  max={30}
                                  step={0.5}
                                  value={slot.size || 8}
                                  aria-label={`${slot.label} size`}
                                  onChange={(event) => patchSlot(slot.id, { size: parseFloat(event.target.value) })}
                                />
                              </label>
                              <Seg
                                value={slot.align || 'center'}
                                options={[
                                  { value: 'left', label: 'L', title: 'Align left' },
                                  { value: 'center', label: 'C', title: 'Centre' },
                                  { value: 'right', label: 'R', title: 'Align right' },
                                ]}
                                onChange={(value) => patchSlot(slot.id, { align: value })}
                              />
                              <input
                                type="color"
                                className="ts-slot-color"
                                value={String(slot.color || '#1c2025')}
                                aria-label={`${slot.label} colour`}
                                onChange={(event) => patchSlot(slot.id, { color: event.target.value })}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="ts-slot-image">
                            {slot.src ? <img src={slot.src} alt="" /> : <span className="ts-slot-image-empty">No image</span>}
                            <button
                              type="button"
                              className="ts-mini-btn"
                              onClick={() => onRequestPhoto?.({ kind: 'stickerSlot', stickerId: selected.id, slotId: slot.id })}
                            >
                              {slot.src ? 'Replace image' : 'Choose image'}
                            </button>
                            {slot.src && (
                              <Seg
                                value={slot.fit === 'contain' ? 'contain' : 'cover'}
                                options={[
                                  { value: 'cover', label: 'Fill', title: 'Fill the area, cropping the photo if needed' },
                                  { value: 'contain', label: 'Fit', title: 'Show the whole photo inside the area' },
                                ]}
                                onChange={(value) => patchSlot(slot.id, { fit: value })}
                              />
                            )}
                            {slot.src && (
                              <button
                                type="button"
                                className="ts-mini-btn"
                                disabled={cuttingSlot === slot.id}
                                onClick={() => cutSlotBackground(slot)}
                              >
                                <Sparkle size={11} /> {cuttingSlot === slot.id ? 'Removing…' : 'Remove background'}
                              </button>
                            )}
                            {slot.src && (
                              <button type="button" className="ts-mini-btn ts-mini-btn--quiet" onClick={() => patchSlot(slot.id, { src: '' })}>
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <p className="ts-hint">Areas marked in Admin → Element scanner. Text areas keep the scanned font and only accept text in the chosen language; image areas take a photo and crop to fit, and their background can be removed here.</p>
                  </div>
                )}
              </>
            )}

            <Range
              label="Opacity"
              value={selected.opacity}
              display={`${Math.round(selected.opacity * 100)}%`}
              min={0.1}
              max={1}
              step={0.01}
              onStart={onBegin}
              onEnd={onEnd}
              onChange={(v) => live({ opacity: v })}
            />
            <Range
              label="Rotation"
              value={selected.rotation}
              display={`${Math.round(selected.rotation)}°`}
              min={-45}
              max={45}
              step={1}
              onStart={onBegin}
              onEnd={onEnd}
              onChange={(v) => live({ rotation: v })}
            />
          </Section>
        ) : (
          <Section title="Design">
            <p className="ts-hint">
              {doc.elements.length === 0
                ? 'This page is empty. Add text, a name plate, a shape or a scanned element below to start composing.'
                : 'Select any element on the canvas to edit its text and style, or drag it to reposition.'}
            </p>
          </Section>
        )}

        <Section title="Colour story">
          <div className="ts-palettes">
            {Object.entries(PALETTES).map(([id, palette]) => (
              <button
                key={id}
                type="button"
                className={`ts-palette${doc.paletteId === id ? ' is-active' : ''}`}
                onClick={() => onApplyPalette(id)}
                title={palette.name}
              >
                <span className="ts-palette-dots">
                  <i style={{ background: palette.paper }} />
                  <i style={{ background: palette.sand }} />
                  <i style={{ background: palette.accent }} />
                  <i style={{ background: palette.ink }} />
                </span>
                <span className="ts-palette-name">{palette.name}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Background">
          <Seg
            value={doc.bg.type}
            onChange={(v) => onPatchDoc({
              bg: {
                ...doc.bg,
                type: v,
                ...(v === 'image' ? { overlay: doc.bg.overlay ?? 0.4, tint: doc.bg.tint || 'ink' } : {}),
              },
            })}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'linear', label: 'Gradient' },
              { value: 'radial', label: 'Radial' },
              ...(doc.bg.src ? [{ value: 'image', label: 'Photo' }] : []),
            ]}
          />
          {doc.bg.type === 'image' ? (
            <>
              <button type="button" className="ts-btn ts-btn-ghost ts-bg-replace" onClick={() => onRequestPhoto?.('bg')}>
                <Photo size={13} /> Replace background photo
              </button>
              <Range
                label="Photo tint"
                value={Math.round((doc.bg.overlay ?? 0) * 100)}
                display={`${Math.round((doc.bg.overlay ?? 0) * 100)}%`}
                min={0}
                max={75}
                step={1}
                onStart={onBegin}
                onEnd={onEnd}
                onChange={(v) => onPatchDoc({ bg: { ...doc.bg, overlay: v / 100 } })}
              />
              <ColorRow label="Tint" doc={doc} value={doc.bg.tint || 'ink'} onChange={(v) => onPatchDoc({ bg: { ...doc.bg, tint: v } })} />
              <div className="ts-field">
                <span className="ts-label">Photo fit</span>
                <Seg
                  value={doc.bg.fit || 'cover'}
                  onChange={(v) => onPatchDoc({ bg: { ...doc.bg, fit: v } })}
                  options={[
                    { value: 'cover', label: 'Cover' },
                    { value: 'contain', label: 'Contain' },
                  ]}
                />
              </div>
              <Range
                label="Zoom"
                value={Math.round((doc.bg.zoom ?? 1) * 100)}
                display={`${Math.round((doc.bg.zoom ?? 1) * 100)}%`}
                min={100}
                max={300}
                step={5}
                onStart={onBegin}
                onEnd={onEnd}
                onChange={(v) => onPatchDoc({ bg: { ...doc.bg, zoom: v / 100 } })}
              />
              <button
                type="button"
                className="ts-btn ts-btn-ghost ts-bg-replace"
                onClick={() => onPatchDoc({ bg: { ...doc.bg, zoom: 1, posX: 50, posY: 50 } }, { history: true })}
              >
                Reset crop
              </button>
              <p className="ts-hint">Drag the canvas to reposition the background, scroll on it to zoom, or use the slider.</p>
            </>
          ) : (
            <>
              <button type="button" className="ts-btn ts-btn-ghost ts-bg-replace" onClick={() => onRequestPhoto?.('bg')}>
                <Photo size={13} /> Use a photo as background
              </button>
              <ColorRow label="From" doc={doc} value={doc.bg.from} onChange={(v) => onPatchDoc({ bg: { ...doc.bg, from: v } })} />
              {doc.bg.type !== 'solid' && (
                <ColorRow label="To" doc={doc} value={doc.bg.to} onChange={(v) => onPatchDoc({ bg: { ...doc.bg, to: v } })} />
              )}
              {doc.bg.type === 'linear' && (
                <Range
                  label="Angle"
                  value={doc.bg.angle ?? 160}
                  display={`${doc.bg.angle ?? 160}°`}
                  min={0}
                  max={360}
                  step={1}
                  onStart={onBegin}
                  onEnd={onEnd}
                  onChange={(v) => onPatchDoc({ bg: { ...doc.bg, angle: v } })}
                />
              )}
            </>
          )}
          <label className="ts-check">
            <input
              type="checkbox"
              checked={!!doc.bg.texture}
              onChange={(e) => onPatchDoc({ bg: { ...doc.bg, texture: e.target.checked } })}
            />
            <span>Paper grain</span>
          </label>
          <div className="ts-field">
            <span className="ts-label">Canvas size</span>
            <select
              className="ts-select"
              value={doc.aspect}
              onChange={(e) => onPatchDoc({ aspect: e.target.value }, { history: true })}
            >
              {Object.entries(ASPECTS).map(([id, aspect]) => (
                <option key={id} value={id}>{aspect.label}</option>
              ))}
            </select>
          </div>
        </Section>

        <Section title="Add elements">
          <div className="ts-add-grid">
            <button type="button" className="ts-add-btn" onClick={() => onAddText()} {...elementDrag({ kind: 'text' })}>
              <Type size={16} /><span>Text</span>
            </button>
            <button type="button" className="ts-add-btn" onClick={() => onAddBanner()} title="Decorative name plate with editable text and colours" {...elementDrag({ kind: 'banner' })}>
              <span className="ts-banner-glyph" /><span>Name plate</span>
            </button>
            <button type="button" className="ts-add-btn" onClick={() => onAddNameCard()} title="Name, role line and social handles in one editable block" {...elementDrag({ kind: 'namecard' })}>
              <span className="ts-card-glyph" /><span>Name card</span>
            </button>
            <button type="button" className="ts-add-btn" onClick={() => onAddContactCard()} title="Card with a logo and a contact bar for phone and email" {...elementDrag({ kind: 'contactcard' })}>
              <span className="ts-card-glyph ts-card-glyph--contact" /><span>Contact card</span>
            </button>
            <button type="button" className="ts-add-btn" onClick={() => onAddPhoto()} {...elementDrag({ kind: 'photo' })}>
              <Photo size={16} /><span>Photo</span>
            </button>
            <button type="button" className="ts-add-btn" onClick={() => onAddShape('line')} {...elementDrag({ kind: 'shape', id: 'line' })}>
              <span className="ts-line-glyph" /><span>Line</span>
            </button>
            <button type="button" className="ts-add-btn" onClick={() => onAddShape('circle')} {...elementDrag({ kind: 'shape', id: 'circle' })}>
              <span className="ts-circle-glyph" /><span>Circle</span>
            </button>
            <button type="button" className="ts-add-btn" onClick={() => onAddShape('arch')} {...elementDrag({ kind: 'shape', id: 'arch' })}>
              <span className="ts-arch-glyph" /><span>Arch</span>
            </button>
            {SOCIALS.map((social) => (
              <button
                key={social.id}
                type="button"
                className="ts-add-btn"
                title={`Add ${social.label} icon`}
                onClick={() => onAddSocial(social.id)}
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
          <p className="ts-hint">Drag any of these onto the page to drop it under your pointer, or click to add it.</p>
          <div className="ts-footer-presets">
            {FOOTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="ts-footer-chip"
                title={`Add ${preset.name} — drag onto the canvas`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-ts-footer', preset.id)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                onClick={() => onAddFooter?.(preset.id)}
              >
                <span
                  className={`ts-footer-chip-preview${preset.blank ? ' is-blank' : ''}`}
                  style={{
                    background: preset.bg,
                    color: preset.color,
                    borderRadius: `${Math.min(preset.radius, 6)}px`,
                  }}
                >
                  {!preset.blank && ['x', 'instagram', 'facebook'].map((id) => (
                    <svg
                      key={id}
                      viewBox="0 0 24 24"
                      fill="none"
                      dangerouslySetInnerHTML={{ __html: socialMarkup(id) }}
                    />
                  ))}
                </span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
          <p className="ts-hint">Drag a footer onto the canvas, or click to add it at the bottom.</p>
          <div className="ts-ornament-grid">
            {ORNAMENTS.map((ornament) => (
              <button
                key={ornament.id}
                type="button"
                className="ts-ornament-chip"
                title={ornament.name}
                onClick={() => onAddOrnament(ornament.id)}
                {...elementDrag({ kind: 'ornament', id: ornament.id })}
              >
                <svg
                  viewBox="0 0 200 200"
                  fill="none"
                  dangerouslySetInnerHTML={{ __html: ornamentMarkup(ornament.id) }}
                />
              </button>
            ))}
          </div>
          {templateElements.length > 0 ? (
            <>
              <div className="ts-scanned-head">
                <span className="ts-label">Poster templates</span>
                <span className="ts-count">{templateElements.length}</span>
              </div>
              <div className="ts-template-grid">
                {templateElements.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="ts-template-chip"
                    title={`Add ${item.name} — fitted to the page, behind your elements`}
                    onClick={() => onAddSticker(item)}
                    {...elementDrag({ kind: 'sticker', id: item.id })}
                  >
                    <span className="ts-template-thumb"><img src={item.src} alt="" loading="lazy" /></span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
              <p className="ts-hint">
                Drag a template onto the page or click it — the header and footer are fitted to the page edges and
                dropped behind your text, and on a photo page the plain middle lets the image show through.
              </p>
            </>
          ) : null}
          {logoElements.length > 0 ? (
            <>
              <div className="ts-scanned-head">
                <span className="ts-label">Party logos</span>
                <span className="ts-count">{logoElements.length}</span>
              </div>
              <div className="ts-logo-grid">
                {logoElements.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="ts-logo-chip"
                    title={`Add ${item.name} logo — transparent PNG`}
                    onClick={() => onAddSticker(item)}
                    {...elementDrag({ kind: 'sticker', id: item.id })}
                  >
                    <span className="ts-logo-thumb"><img src={item.src} alt="" loading="lazy" /></span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
              <p className="ts-hint">Transparent PNG badges — drag and resize them like any element.</p>
            </>
          ) : null}
          {scannedElements.length > 0 ? (
            <>
              <div className="ts-scanned-head">
                <span className="ts-label">Scanned elements</span>
                <span className="ts-count">{scannedElements.length}</span>
              </div>
              <div className="ts-scanned-grid">
                {scannedElements.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="ts-scanned-chip"
                    title={`Add ${item.name}`}
                    onClick={() => onAddSticker(item)}
                    {...elementDrag({ kind: 'sticker', id: item.id })}
                  >
                    <span className="ts-scanned-thumb"><img src={item.src} alt="" /></span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="ts-hint">Scan an element image in Admin → Element scanner to reuse it here.</p>
          )}
        </Section>

        <Section
          title="Layers"
          aside={<span className="ts-count"><Layers size={12} /> {doc.elements.length}</span>}
        >
          <div className="ts-layers">
            {[...doc.elements].reverse().map((el) => (
              <div
                key={el.id}
                className={`ts-layer${selected?.id === el.id ? ' is-active' : ''}`}
                onClick={() => onSelect(el.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(el.id)}
              >
                <span className={`ts-layer-icon ts-layer-icon--${el.type}`}><LayerIcon el={el} /></span>
                <span className="ts-layer-name">{layerLabel(el)}</span>
                <span className="ts-layer-actions">
                  <button type="button" title="Move up" onClick={(e) => { e.stopPropagation(); onReorder(el.id, 1) }}><ArrowUp size={13} /></button>
                  <button type="button" title="Move down" onClick={(e) => { e.stopPropagation(); onReorder(el.id, -1) }}><ArrowDown size={13} /></button>
                  <button
                    type="button"
                    className="ts-layer-delete"
                    title={`Delete ${layerLabel(el)}`}
                    onClick={(e) => { e.stopPropagation(); onDelete(el.id) }}
                  >
                    <Trash size={13} />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <div className="ts-layer-tools">
            <button
              type="button"
              onClick={() => selected && onMoveToEdge(selected.id, 'front')}
              disabled={!selected}
              title="Put the selected element above everything else"
            >
              Bring to front
            </button>
            <button
              type="button"
              onClick={() => selected && onMoveToEdge(selected.id, 'back')}
              disabled={!selected}
              title="Put the selected element behind everything else"
            >
              Send to back
            </button>
          </div>
          <p className="ts-hint">Elements can sit on top of each other. Layers higher in this list overlap the ones below — reorder or use front/back to control what shows through.</p>
        </Section>
      </div>
      <div className="ts-inspector-foot">
        <Plus size={13} /> Double-click text on the canvas to edit it
      </div>
    </aside>
  )
}
