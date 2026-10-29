import React, { useState } from 'react'
import { Copy, Redo, Trash, Undo, ZoomIn, ZoomOut } from './Icons.jsx'
import { SHAPE_GEOMETRY, SHAPE_TOOLS, BRUSH_PRESETS } from '../data/shapes.js'

const TIcon = ({ children, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

const CursorIcon = () => (
  <TIcon><path d="M5 3.5 11.5 20l2.3-6.4 6.2-2.3L5 3.5Z" /></TIcon>
)
const DeselectIcon = () => (
  <TIcon><rect x="4" y="4" width="16" height="16" rx="2.5" strokeDasharray="3 2.6" /></TIcon>
)
const MarqueeIcon = () => (
  <TIcon>
    <path d="M4 8V5.6A1.6 1.6 0 0 1 5.6 4H8" />
    <path d="M16 4h2.4A1.6 1.6 0 0 1 20 5.6V8" />
    <path d="M20 16v2.4a1.6 1.6 0 0 1-1.6 1.6H16" />
    <path d="M8 20H5.6A1.6 1.6 0 0 1 4 18.4V16" />
    <path d="M8.5 12h7M12 8.5v7" strokeDasharray="2 2" />
  </TIcon>
)
const LassoIcon = () => (
  <TIcon>
    <path d="M7.5 5.2c3.6-1 6.6 1.3 7.6 4 .7 2.2-.5 4.2-2.4 4.8-1.7.5-3.3-.5-3.5-2-.2-1.6 1.1-2.7 2.5-2.5" />
    <path d="M9 14.2c-.4 1.8-.9 3-1.6 3.6" />
    <circle cx="6.2" cy="19" r="1.8" />
  </TIcon>
)
const SelectAllIcon = () => (
  <TIcon>
    <rect x="4" y="4" width="16" height="16" rx="2.5" strokeDasharray="3 2.6" />
    <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" stroke="none" opacity="0.45" />
  </TIcon>
)
const InvertIcon = () => (
  <TIcon>
    <rect x="4" y="4" width="16" height="16" rx="2.5" />
    <path d="M4 4h8v16H4z" fill="currentColor" stroke="none" opacity="0.45" />
  </TIcon>
)
const TransparentIcon = () => (
  <TIcon>
    <rect x="4" y="4" width="16" height="16" rx="2.5" />
    <path d="M4 10h8v6H4zM12 4h4v6h-4zM12 10h4v6h-4z" fill="currentColor" stroke="none" opacity="0.35" />
  </TIcon>
)
const CutIcon = () => (
  <TIcon>
    <circle cx="6" cy="6.5" r="2.5" />
    <circle cx="6" cy="17.5" r="2.5" />
    <path d="M8.2 8.1 20 19M8.2 15.9 20 5" />
  </TIcon>
)
const PasteIcon = () => (
  <TIcon>
    <path d="M9 4H6.5A1.5 1.5 0 0 0 5 5.5v14A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 17.5 4H15" />
    <rect x="9" y="2.6" width="6" height="3" rx="1.2" />
    <path d="M8.5 12.5h7M8.5 16h4.5" />
  </TIcon>
)
const OpacityIcon = () => (
  <TIcon>
    <rect x="4" y="4" width="16" height="16" rx="2.5" />
    <path d="M12 4h4.5A2.5 2.5 0 0 1 19 6.5v11a2.5 2.5 0 0 1-2.5 2.5H12z" fill="currentColor" stroke="none" opacity="0.4" />
  </TIcon>
)
const ReplaceIcon = () => (
  <TIcon>
    <rect x="3" y="4" width="18" height="16" rx="2.4" />
    <circle cx="8.5" cy="9.5" r="1.7" />
    <path d="m3 17 5-5 4 4 3-3 6 6" />
  </TIcon>
)
const FlipHIcon = () => (
  <TIcon>
    <path d="M12 3v18" strokeDasharray="2.5 2.5" />
    <path d="M9 6 4 12l5 6" />
    <path d="m15 6 5 6-5 6" />
  </TIcon>
)
const FlipVIcon = () => (
  <TIcon>
    <path d="M3 12h18" strokeDasharray="2.5 2.5" />
    <path d="M6 9 12 4l6 5" />
    <path d="m6 15 6 5 6-5" />
  </TIcon>
)
const CropIcon = () => (
  <TIcon>
    <path d="M7 3v13a1 1 0 0 0 1 1h13" />
    <path d="M3 7h13a1 1 0 0 1 1 1v13" />
  </TIcon>
)
const MagicIcon = () => (
  <TIcon>
    <rect x="3" y="3" width="18" height="18" rx="2.5" strokeDasharray="2.4 3" />
    <path d="m14 7 3 3M7 14l3 3M12 12l4-4" />
    <path d="M17.5 3.5 19 2" />
  </TIcon>
)
const AdjustIcon = () => (
  <TIcon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
  </TIcon>
)
const ExpandIcon = () => (
  <TIcon>
    <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
  </TIcon>
)
const PenIcon = () => (
  <TIcon>
    <path d="M4 20l4.2-1 10.3-10.3a2 2 0 0 0 0-2.8l-.4-.4a2 2 0 0 0-2.8 0L5 15.8 4 20Z" />
    <path d="m12.8 5.9 3.3 3.3M4.8 15.4l3.8 3.8" />
  </TIcon>
)
const BrushIcon = () => (
  <TIcon>
    <path d="M14.5 3.5 20.5 9.5 12 18l-6-6 8.5-8.5Z" />
    <path d="M9 15c-1 2-2 3-4 4 .4-2.6 1.4-4.3 3-5.5" />
  </TIcon>
)
const TextIcon = () => (
  <TIcon><path d="M5 20 12 4l7 16M8 14h8" /></TIcon>
)
const EraserIcon = () => (
  <TIcon>
    <path d="m4 16 7.5-7.5 7 7L14 20H8l-4-4Z" />
    <path d="M9 20h11" />
  </TIcon>
)
const PickerIcon = () => (
  <TIcon>
    <path d="m4 20 2-6 8.5-8.5a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L10 18l-6 2Z" />
    <path d="m13 6.5 4.5 4.5" />
  </TIcon>
)
const ShapeGlyph = ({ shape }) => {
  const geo = SHAPE_GEOMETRY[shape]
  if (!geo) return null
  return (
    <svg width="18" height="18" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={geo.d} />
    </svg>
  )
}
const BrushGlyph = ({ weight }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M4 17c4 3 8-1 11-5s4-7 5-8" strokeWidth={weight} />
  </svg>
)

const DuplicateIcon = () => (
  <TIcon>
    <rect x="3.5" y="3.5" width="10" height="10" rx="2" />
    <rect x="10.5" y="10.5" width="10" height="10" rx="2" fill="currentColor" stroke="none" opacity="0.22" />
    <path d="M15.5 13v5M13 15.5h5" />
  </TIcon>
)

function ToolButton({ title, active, on, disabled, onClick, children }) {
  return (
    <button
      type="button"
      className={`ts-tool-btn${active ? ' is-active' : ''}${on ? ' is-on' : ''}`}
      title={title}
      aria-label={title}
      aria-pressed={active ? 'true' : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

const Group = ({ label, children }) => (
  <div className="ts-tool-group">
    <div className="ts-tool-row">{children}</div>
    <span className="ts-tool-label">{label}</span>
  </div>
)

const FILTERS = [
  { key: 'brightness', label: 'Brightness', min: 50, max: 160 },
  { key: 'contrast', label: 'Contrast', min: 50, max: 160 },
  { key: 'saturate', label: 'Saturation', min: 0, max: 200 },
]

export default function ToolBar({
  tool = 'select',
  onTool,
  brush,
  onBrush,
  selected,
  selectionCount = 0,
  onReplacePhoto,
  onFlip,
  onFit,
  onRemoveBg,
  onAdjust,
  onExtend,
  onAddShape,
  onDelete,
  onDuplicate,
  onCut,
  onCopy,
  onPaste,
  canPaste,
  onSelectAll,
  onInvert,
  transparentSelect,
  onTransparentSelect,
  onSelectionOpacity,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPickColor,
  onZoom,
  onDeselect,
  onBegin,
  onEnd,
}) {
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [opacityOpen, setOpacityOpen] = useState(false)
  const imageReady = !!selected?.src
  const photoSelected = selected?.type === 'photo'
  const filters = selected?.filters || {}
  const adjustVisible = adjustOpen && photoSelected
  const opacityVisible = opacityOpen && selectionCount > 0
  const selecting = tool === 'marquee' || tool === 'lasso'
  const opacityValue = selected ? Math.round((selected.opacity ?? 1) * 100) : 100
  const many = selectionCount > 1

  return (
    <aside className="ts-toolbar-rail">
      <div className="ts-toolbar" role="toolbar" aria-label="Editing tools">
        <Group label={many ? `Selection · ${selectionCount}` : 'Selection'}>
          <ToolButton title="Select and move (V)" active={tool === 'select'} onClick={() => onTool?.('select')}>
            <CursorIcon />
          </ToolButton>
          <ToolButton
            title="Rectangle select (M) — drag a box around the elements"
            active={tool === 'marquee'}
            onClick={() => onTool?.('marquee')}
          >
            <MarqueeIcon />
          </ToolButton>
          <ToolButton
            title="Free-form select (L) — draw around the elements"
            active={tool === 'lasso'}
            onClick={() => onTool?.('lasso')}
          >
            <LassoIcon />
          </ToolButton>
          <ToolButton title="Select all (Ctrl+A)" onClick={onSelectAll}>
            <SelectAllIcon />
          </ToolButton>
          <ToolButton title="Invert selection" onClick={onInvert}>
            <InvertIcon />
          </ToolButton>
          <ToolButton
            title="Transparent selection — pick the artwork only, not the empty box around it"
            on={!!transparentSelect}
            onClick={onTransparentSelect}
          >
            <TransparentIcon />
          </ToolButton>
          <ToolButton title="Deselect (Esc)" disabled={!selectionCount} onClick={onDeselect}>
            <DeselectIcon />
          </ToolButton>
          <ToolButton
            title="Transparency of the selected layers"
            active={opacityVisible}
            disabled={!selectionCount}
            onClick={() => setOpacityOpen((v) => !v)}
          >
            <OpacityIcon />
          </ToolButton>
        </Group>

        <Group label="Image">
          <ToolButton title="Add or replace an image" onClick={onReplacePhoto}>
            <ReplaceIcon />
          </ToolButton>
          <ToolButton title="Flip horizontally" active={!!selected?.flipX} disabled={!imageReady} onClick={() => onFlip?.('x')}>
            <FlipHIcon />
          </ToolButton>
          <ToolButton title="Flip vertically" active={!!selected?.flipY} disabled={!imageReady} onClick={() => onFlip?.('y')}>
            <FlipVIcon />
          </ToolButton>
          <ToolButton
            title={selected?.fit === 'contain' ? 'Crop: fitting the whole photo' : 'Crop: filling the frame'}
            on={selected?.fit === 'contain'}
            disabled={!photoSelected}
            onClick={onFit}
          >
            <CropIcon />
          </ToolButton>
          <ToolButton title="Remove background" disabled={!imageReady} onClick={onRemoveBg}>
            <MagicIcon />
          </ToolButton>
          <ToolButton
            title="Adjust photo"
            active={adjustVisible}
            disabled={!photoSelected}
            onClick={() => setAdjustOpen((v) => !v)}
          >
            <AdjustIcon />
          </ToolButton>
          <ToolButton title="Extend to the whole page" disabled={!selected} onClick={onExtend}>
            <ExpandIcon />
          </ToolButton>
        </Group>

        <Group label="Tools">
          <ToolButton title="Pen — add a line" onClick={() => onAddShape?.('line')}>
            <PenIcon />
          </ToolButton>
          <ToolButton title="Brush (B)" active={tool === 'brush'} onClick={() => onTool?.('brush')}>
            <BrushIcon />
          </ToolButton>
          <ToolButton title="Text (T) — click the page to place text" active={tool === 'text'} onClick={() => onTool?.('text')}>
            <TextIcon />
          </ToolButton>
          <ToolButton title="Eraser — delete the selected layer" disabled={!selectionCount} onClick={onDelete}>
            <EraserIcon />
          </ToolButton>
          <ToolButton title="Pick a colour from the screen" onClick={onPickColor}>
            <PickerIcon />
          </ToolButton>
          <ToolButton title="Zoom out" onClick={() => onZoom?.(-0.1)}>
            <ZoomOut size={18} />
          </ToolButton>
          <ToolButton title="Zoom in" onClick={() => onZoom?.(0.1)}>
            <ZoomIn size={18} />
          </ToolButton>
        </Group>

        <Group label="Brushes">
          {BRUSH_PRESETS.map((preset) => (
            <ToolButton
              key={preset.id}
              title={`${preset.label} brush`}
              active={tool === 'brush' && brush?.preset === preset.id}
              onClick={() => {
                onBrush?.({ ...brush, preset: preset.id, size: preset.size, opacity: preset.opacity })
                onTool?.('brush')
              }}
            >
              <BrushGlyph weight={preset.size + 0.6} />
            </ToolButton>
          ))}
        </Group>

        <Group label="Shapes">
          {SHAPE_TOOLS.map((shape) => (
            <ToolButton key={shape.id} title={`Add ${shape.title.toLowerCase()}`} onClick={() => onAddShape?.(shape.id)}>
              <ShapeGlyph shape={shape.id} />
            </ToolButton>
          ))}
        </Group>

        <Group label="Actions">
          <ToolButton title="Cut (Ctrl+X)" disabled={!selectionCount} onClick={onCut}>
            <CutIcon />
          </ToolButton>
          <ToolButton title="Copy (Ctrl+C)" disabled={!selectionCount} onClick={onCopy}>
            <Copy size={18} />
          </ToolButton>
          <ToolButton title="Paste (Ctrl+V)" disabled={!canPaste} onClick={onPaste}>
            <PasteIcon />
          </ToolButton>
          <ToolButton title="Duplicate (Ctrl+D)" disabled={!selectionCount} onClick={onDuplicate}>
            <DuplicateIcon />
          </ToolButton>
          <ToolButton title="Delete (Del)" disabled={!selectionCount} onClick={onDelete}>
            <Trash size={18} />
          </ToolButton>
          <ToolButton title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}>
            <Undo size={18} />
          </ToolButton>
          <ToolButton title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo}>
            <Redo size={18} />
          </ToolButton>
        </Group>
      </div>

      {(selecting || (tool === 'brush' && brush) || adjustVisible || opacityVisible) && (
        <div className="ts-tool-options-stack">
          {selecting && (
            <div className="ts-tool-options">
              <span className="ts-tool-options-title">
                {tool === 'lasso' ? 'Free-form select' : 'Rectangle select'}
              </span>
              <span className="ts-tool-option ts-tool-tip">
                Drag on the page to draw the selection · Shift adds to it · release to pick the layers inside
              </span>
            </div>
          )}

          {tool === 'brush' && brush && (
            <div className="ts-tool-options">
              <span className="ts-tool-options-title">Brush</span>
              <span className="ts-tool-option">{BRUSH_PRESETS.find((p) => p.id === brush.preset)?.label || 'Brush'}</span>
              <label className="ts-tool-option">
                Size
                <input
                  type="range"
                  min="0.3"
                  max="8"
                  step="0.1"
                  value={brush.size}
                  onChange={(e) => onBrush?.({ ...brush, size: Number(e.target.value) })}
                />
                <span className="ts-tool-scale">{Number(brush.size).toFixed(1)}</span>
              </label>
              <label className="ts-tool-option">
                Opacity
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={Math.round(brush.opacity * 100)}
                  onChange={(e) => onBrush?.({ ...brush, opacity: Number(e.target.value) / 100 })}
                />
                <span className="ts-tool-scale">{Math.round(brush.opacity * 100)}%</span>
              </label>
              <label className="ts-tool-option">
                Colour
                <input type="color" value={brush.color} onChange={(e) => onBrush?.({ ...brush, color: e.target.value })} />
              </label>
              <span className="ts-tool-option ts-tool-tip">Drag on the page to paint · V returns to Select</span>
            </div>
          )}

          {adjustVisible && (
            <div className="ts-tool-options">
              <span className="ts-tool-options-title">Adjust photo</span>
              {FILTERS.map((filter) => (
                <label className="ts-tool-option" key={filter.key}>
                  {filter.label}
                  <input
                    type="range"
                    min={filter.min}
                    max={filter.max}
                    step="1"
                    value={filters[filter.key] ?? 100}
                    onPointerDown={onBegin}
                    onPointerUp={onEnd}
                    onChange={(e) => onAdjust?.({ [filter.key]: Number(e.target.value) })}
                  />
                  <span className="ts-tool-scale">{filters[filter.key] ?? 100}%</span>
                </label>
              ))}
              <div className="ts-tool-actions">
                <button
                  type="button"
                  className="ts-btn ts-btn-ghost ts-tool-reset"
                  onClick={() => onAdjust?.({ brightness: 100, contrast: 100, saturate: 100 }, true)}
                >
                  Reset
                </button>
                <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" onClick={() => setAdjustOpen(false)}>
                  Done
                </button>
              </div>
            </div>
          )}
          {opacityVisible && (
            <div className="ts-tool-options">
              <span className="ts-tool-options-title">
                Transparency · {many ? `${selectionCount} layers` : '1 layer'}
              </span>
              <label className="ts-tool-option">
                Opacity
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={opacityValue}
                  onPointerDown={onBegin}
                  onPointerUp={onEnd}
                  onChange={(e) => onSelectionOpacity?.(Number(e.target.value) / 100)}
                />
                <span className="ts-tool-scale">{opacityValue}%</span>
              </label>
              <div className="ts-tool-actions">
                <button
                  type="button"
                  className="ts-btn ts-btn-ghost ts-tool-reset"
                  onClick={() => {
                    onBegin?.()
                    onSelectionOpacity?.(1)
                    onEnd?.()
                  }}
                >
                  Solid
                </button>
                <button
                  type="button"
                  className="ts-btn ts-btn-ghost ts-tool-reset"
                  onClick={() => setOpacityOpen(false)}
                >
                  Done
                </button>
              </div>
              <span className="ts-tool-option ts-tool-tip">
                Works on photos, poster templates, text and shapes — select a group to fade them together
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
