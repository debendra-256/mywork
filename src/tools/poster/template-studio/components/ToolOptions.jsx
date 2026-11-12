import React from 'react'
import { TOOL_BY_ID, SELECTION_TOOLS, PAINT_TOOLS } from '../tools/registry.js'

const PAINT_SIZES = new Set([
  'brush', 'pencil', 'eraser', 'clone', 'heal', 'spot-heal', 'history-brush',
  'blur', 'sharpen', 'smudge', 'dodge', 'burn', 'sponge',
])

const BRUSH_COLOR = new Set(['brush', 'pencil'])
const STRENGTH = new Set(['smudge', 'dodge', 'burn', 'sponge', 'heal', 'spot-heal'])

// Palette tokens like "accent" are valid document colours but not for <input type="color">.
const hexOr = (value, fallback) => (/^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback)

function Slider({ label, value, min, max, step = 1, suffix = '', onChange }) {
  return (
    <label className="ts-tool-option">
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="ts-tool-scale">{Math.round(Number(value) * 10) / 10}{suffix}</span>
    </label>
  )
}

export default function ToolOptions({
  tool = 'select',
  settings = {},
  onSettings,
  doc,
  selected,
  selectionCount = 0,
  transparentSelect,
  onTransparentSelect,
  onExportSlices,
  onClearSlices,
  onClearAnnotations,
  annotationCount = 0,
  viewRotation = 0,
  onRotate,
  onResetRotation,
  onZoom,
  onSelectAll,
  onDeselect,
}) {
  const meta = TOOL_BY_ID[tool]
  if (!meta) return null
  const set = (patch) => onSettings?.({ ...settings, ...patch })
  const isSelection = SELECTION_TOOLS.has(tool) && tool !== 'select'
  const isPaint = PAINT_TOOLS.has(tool)
  const sliceCount = Array.isArray(doc?.slices) ? doc.slices.length : 0
  const countMarks = (doc?.elements || []).filter((el) => el.type === 'annotation' && el.kind === 'count').length
  const noteMarks = (doc?.elements || []).filter((el) => el.type === 'annotation' && el.kind === 'note').length
  const cloneLocked = tool === 'clone' || tool === 'heal'
  const cloneSource = settings.cloneSource
  return (
    <div className="ts-tool-options-bar">
      <div className="ts-tool-options-inner">
        <span className="ts-tool-options-title">{meta.label}</span>

        {tool === 'select' && (
          <>
            <span className="ts-tool-option ts-tool-tip">Drag any layer or poster photo to position.</span>
            <div className="ts-tool-actions">
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" onClick={onSelectAll}>Select all</button>
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" onClick={onDeselect} disabled={!selectionCount}>Deselect</button>
            </div>
          </>
        )}

        {PAINT_SIZES.has(tool) && (
          <>
            <Slider label="Size" value={settings.size ?? 2.4} min={0.4} max={14} step={0.2} suffix="%" onChange={(size) => set({ size })} />
            {tool !== 'eraser' && (
              <Slider label="Hardness" value={Math.round((settings.hardness ?? 0.75) * 100)} min={0} max={100} suffix="%" onChange={(v) => set({ hardness: v / 100 })} />
            )}
            {tool !== 'history-brush' && (
              <Slider label="Opacity" value={Math.round((settings.opacity ?? 0.92) * 100)} min={5} max={100} suffix="%" onChange={(v) => set({ opacity: v / 100 })} />
            )}
            {BRUSH_COLOR.has(tool) && (
              <label className="ts-tool-option">
                Colour
                <input type="color" value={settings.foreground || '#1c2025'} onChange={(e) => set({ foreground: e.target.value })} />
              </label>
            )}
            {STRENGTH.has(tool) && (
              <Slider
                label={tool === 'smudge' ? 'Strength' : 'Flow'}
                value={Math.round((tool === 'smudge' ? settings.smudgeStrength : settings.dodgeStrength) * 100)}
                min={5}
                max={100}
                suffix="%"
                onChange={(v) => set(tool === 'smudge' ? { smudgeStrength: v / 100 } : { dodgeStrength: v / 100 })}
              />
            )}
            {cloneLocked && (
              <span className="ts-tool-option ts-tool-tip">
                {cloneSource
                  ? 'Source set — Alt-click to move it, then paint.'
                  : 'Alt-click a clean area first, then paint over the spot.'}
              </span>
            )}
            {tool === 'spot-heal' && (
              <span className="ts-tool-option ts-tool-tip">Brush over a small blemish — clean pixels are sampled nearby.</span>
            )}
            {tool === 'patch' && (
              <span className="ts-tool-option ts-tool-tip">Drag a box over the blemish; nearby pixels fill it in.</span>
            )}
            {tool === 'history-brush' && (
              <span className="ts-tool-option ts-tool-tip">Paint to restore the page underneath your paint layer.</span>
            )}
          </>
        )}

        {tool === 'bucket' && (
          <>
            <Slider label="Tolerance" value={settings.tolerance ?? 34} min={2} max={120} onChange={(tolerance) => set({ tolerance })} />
            <label className="ts-tool-option">
              <input type="checkbox" checked={settings.contiguous !== false} onChange={(e) => set({ contiguous: e.target.checked })} />
              Contiguous area
            </label>
            <label className="ts-tool-option">
              Colour
              <input type="color" value={settings.foreground || '#1c2025'} onChange={(e) => set({ foreground: e.target.value })} />
            </label>
            <span className="ts-tool-option ts-tool-tip">Click the page to flood that colour area.</span>
          </>
        )}

        {tool === 'gradient' && (
          <>
            <div className="ts-tool-option">
              <div className="ts-seg">
                <button type="button" className={settings.gradientType !== 'radial' ? 'is-active' : ''} onClick={() => set({ gradientType: 'linear' })}>Linear</button>
                <button type="button" className={settings.gradientType === 'radial' ? 'is-active' : ''} onClick={() => set({ gradientType: 'radial' })}>Radial</button>
              </div>
            </div>
            <div className="ts-tool-option ts-ps-gradient-preview">
              <span style={{ background: settings.foreground || '#1c2025' }} />
              <span style={{ background: settings.background || '#f7f7f3' }} />
              <em>foreground → background</em>
            </div>
            <Slider label="Opacity" value={Math.round((settings.opacity ?? 0.92) * 100)} min={5} max={100} suffix="%" onChange={(v) => set({ opacity: v / 100 })} />
            <span className="ts-tool-option ts-tool-tip">Drag across the page to lay the gradient down.</span>
          </>
        )}

        {isSelection && (
          <>
            {tool === 'magic-wand' && (
              <Slider label="Tolerance" value={settings.tolerance ?? 34} min={2} max={120} onChange={(tolerance) => set({ tolerance })} />
            )}
            <label className="ts-tool-option">
              <input type="checkbox" checked={!!transparentSelect} onChange={onTransparentSelect} />
              Transparent selection
            </label>
            <span className="ts-tool-option ts-tool-tip">
              {tool === 'object-select' && 'Click a layer to select it. Shift-click to add.'}
              {tool === 'quick-select' && 'Drag over layers to grow the selection; Shift adds.'}
              {tool === 'magic-wand' && 'Click a colour; every layer in that colour range is selected.'}
              {tool === 'lasso-poly' && 'Click corners; double-click or Enter closes the shape.'}
              {tool === 'lasso-magnetic' && 'Drag around the artwork; the path snaps to layer edges.'}
              {tool === 'marquee-ellipse' && 'Drag an oval; layers inside are selected.'}
              {(tool === 'marquee-row' || tool === 'marquee-col') && 'Drag a thin strip across the layers you want.'}
              {(tool === 'marquee-rect' || tool === 'lasso') && 'Drag on the page; Shift adds to the selection.'}
            </span>
            <div className="ts-tool-actions">
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" onClick={onSelectAll}>Select all</button>
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" onClick={onDeselect} disabled={!selectionCount}>Deselect</button>
            </div>
          </>
        )}

        {tool === 'crop' && (
          <>
            <span className="ts-tool-option ts-tool-tip">
              Drag a box on the page. Layers outside the box are removed; undo brings them back.
            </span>
            <span className="ts-tool-option ts-tool-tip">Use the Apply crop / Cancel buttons on the page.</span>
          </>
        )}

        {tool === 'slice' && (
          <>
            <span className="ts-tool-option ts-tool-tip">Drag boxes on the page to mark web slices.</span>
            <span className="ts-tool-option">{sliceCount} slice{sliceCount === 1 ? '' : 's'} marked</span>
            <div className="ts-tool-actions">
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" disabled={!sliceCount} onClick={onExportSlices}>Export slices</button>
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" disabled={!sliceCount} onClick={onClearSlices}>Clear</button>
            </div>
          </>
        )}

        {tool === 'frame' && (
          <span className="ts-tool-option ts-tool-tip">Drag a placeholder, then double-click it (or drop a file) to add a photo.</span>
        )}

        {tool === 'eyedropper' && (
          <>
            <div className="ts-tool-option ts-ps-gradient-preview">
              <span style={{ background: settings.foreground || '#1c2025' }} />
              <em>{settings.foreground || '#1c2025'}</em>
            </div>
            <span className="ts-tool-option ts-tool-tip">Click the page to sample a colour. It becomes the foreground.</span>
          </>
        )}

        {tool === 'ruler' && (
          <span className="ts-tool-option ts-tool-tip">Drag on the page to measure distance and angle.</span>
        )}

        {tool === 'note' && (
          <>
            <span className="ts-tool-option">{noteMarks} note{noteMarks === 1 ? '' : 's'} on the page</span>
            <span className="ts-tool-option ts-tool-tip">Click the page, type the note. Notes never appear in the PNG export.</span>
            <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" disabled={!annotationCount} onClick={onClearAnnotations}>Clear notes & counts</button>
          </>
        )}

        {tool === 'count' && (
          <>
            <span className="ts-tool-option">{countMarks} counted</span>
            <span className="ts-tool-option ts-tool-tip">Click each object; markers are numbered automatically.</span>
            <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" disabled={!annotationCount} onClick={onClearAnnotations}>Clear notes & counts</button>
          </>
        )}

        {(tool === 'pen' || tool === 'path-select' || tool === 'direct-select' || tool === 'text') && (
          <span className="ts-tool-option ts-tool-tip">
            {tool === 'pen' && 'Click to place corners. Enter or double-click finishes; Esc cancels.'}
            {tool === 'path-select' && 'Click a path, line or ink stroke to select it.'}
            {tool === 'direct-select' && 'Select an ink path, then drag its anchor points.'}
            {tool === 'text' && 'Click the page to place a text layer, then type in the design panel.'}
          </span>
        )}

        {tool.startsWith('shape-') && (
          <>
            <label className="ts-tool-option">
              Fill
              <input type="color" value={settings.shapeFill && settings.shapeFill !== 'none' ? settings.shapeFill : '#ffffff'} onChange={(e) => set({ shapeFill: e.target.value })} />
              <button type="button" className="ts-toggle" onClick={() => set({ shapeFill: 'none' })}>None</button>
            </label>
            <label className="ts-tool-option">
              Stroke
              <input type="color" value={hexOr(settings.shapeStroke, '#1c2025')} onChange={(e) => set({ shapeStroke: e.target.value })} />
            </label>
            {tool === 'shape-polygon' && (
              <Slider label="Sides" value={settings.shapeSides ?? 6} min={3} max={12} onChange={(shapeSides) => set({ shapeSides })} />
            )}
            <span className="ts-tool-option ts-tool-tip">Drag on the page to draw the shape.</span>
          </>
        )}

        {tool === 'rotate' && (
          <>
            <div className="ts-tool-option">
              <span>View angle</span>
              <span className="ts-tool-scale">{Math.round(viewRotation)}°</span>
            </div>
            <div className="ts-tool-option">
              <input type="range" min="-180" max="180" step="1" value={viewRotation} onChange={(e) => onRotate?.(Number(e.target.value), true)} />
            </div>
            <div className="ts-tool-actions">
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" onClick={() => onRotate?.(0, true)}>Straighten</button>
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" onClick={onResetRotation}>Reset</button>
            </div>
            <span className="ts-tool-option ts-tool-tip">Drag left or right on the page to rotate the view. Exports stay upright.</span>
          </>
        )}

        {tool === 'zoom' && (
          <>
            <div className="ts-tool-actions">
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" onClick={() => onZoom?.(-0.1)}>Zoom out</button>
              <button type="button" className="ts-btn ts-btn-ghost ts-tool-reset" onClick={() => onZoom?.(0.1)}>Zoom in</button>
            </div>
            <span className="ts-tool-option ts-tool-tip">Click the page to zoom in, Alt-click to zoom out.</span>
          </>
        )}

        {selected ? <span className="ts-tool-option ts-tool-tip">Selected: {selected.type}</span> : null}
      </div>
    </div>
  )
}
