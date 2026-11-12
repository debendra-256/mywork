import React, { useState } from 'react'
import { Copy, Redo, Trash, Undo } from './Icons.jsx'
import { SHAPE_GEOMETRY, SHAPE_TOOLS } from '../data/shapes.js'
import PhotoshopRail from './PhotoshopRail.jsx'

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

const DeselectIcon = () => (
  <TIcon><rect x="4" y="4" width="16" height="16" rx="2.5" strokeDasharray="3 2.6" /></TIcon>
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
const ShapeGlyph = ({ shape }) => {
  const geo = SHAPE_GEOMETRY[shape]
  if (!geo) return null
  return (
    <svg width="18" height="18" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={geo.d} />
    </svg>
  )
}
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
  onZoom,
  onDeselect,
  onBegin,
  onEnd,
  settings,
  onSettings,
  doc,
  onExportSlices,
  onClearSlices,
  onClearAnnotations,
  annotationCount = 0,
  viewRotation = 0,
  onRotate,
  onResetRotation,
  onNotice,
}) {
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [opacityOpen, setOpacityOpen] = useState(false)
  const imageReady = !!selected?.src
  const photoSelected = selected?.type === 'photo'
  const filters = selected?.filters || {}
  const adjustVisible = adjustOpen && photoSelected
  const opacityVisible = opacityOpen && selectionCount > 0
  const opacityValue = selected ? Math.round((selected.opacity ?? 1) * 100) : 100
  const many = selectionCount > 1

  return (
    <aside className="ts-toolbar-rail">
      <div className="ts-toolbar" role="toolbar" aria-label="Editing tools">
        <PhotoshopRail
          tool={tool}
          onTool={onTool}
          settings={settings}
          onSettings={onSettings}
          onNotice={(tip) => tip && onNotice?.(tip)}
        />

        <Group label={many ? `Selection · ${selectionCount}` : 'Selection'}>
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

      {(adjustVisible || opacityVisible) && (
        <div className="ts-tool-options-stack">
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
