import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TOOL_GROUPS, TOOL_BY_ID, toolsInGroup } from '../tools/registry.js'

const Svg = ({ children, size = 18 }) => (
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

function GroupIcon({ group }) {
  switch (group) {
    case 'move':
      return <Svg><path d="M5 3.5 11.5 20l2.3-6.4 6.2-2.3L5 3.5Z" /></Svg>
    case 'marquee':
      return (
        <Svg>
          <path d="M4 8V5.6A1.6 1.6 0 0 1 5.6 4H8M16 4h2.4A1.6 1.6 0 0 1 20 5.6V8M20 16v2.4a1.6 1.6 0 0 1-1.6 1.6H16M8 20H5.6A1.6 1.6 0 0 1 4 18.4V16" />
          <path d="M8.5 12h7M12 8.5v7" strokeDasharray="2 2" />
        </Svg>
      )
    case 'lasso':
      return (
        <Svg>
          <path d="M7.5 5.2c3.6-1 6.6 1.3 7.6 4 .7 2.2-.5 4.2-2.4 4.8-1.7.5-3.3-.5-3.5-2-.2-1.6 1.1-2.7 2.5-2.5" />
          <path d="M9 14.2c-.4 1.8-.9 3-1.6 3.6" />
          <circle cx="6.2" cy="19" r="1.8" />
        </Svg>
      )
    case 'quick':
      return (
        <Svg>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" strokeDasharray="2.4 2.6" />
          <path d="m13 7 1.2 2.8L17 11l-2.8 1.2L13 15l-1.2-2.8L9 11l2.8-1.2L13 7Z" fill="currentColor" stroke="none" opacity="0.7" />
          <path d="m18 3 1.4-1.4" />
        </Svg>
      )
    case 'crop':
      return <Svg><path d="M7 3v13a1 1 0 0 0 1 1h13" /><path d="M3 7h13a1 1 0 0 1 1 1v13" /></Svg>
    case 'measure':
      return (
        <Svg>
          <path d="m4 20 2-6 8.5-8.5a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L10 18l-6 2Z" />
          <path d="m13 6.5 4.5 4.5" />
        </Svg>
      )
    case 'heal':
      return (
        <Svg>
          <rect x="3.2" y="8.6" width="17.6" height="6.8" rx="3.4" transform="rotate(-45 12 12)" />
          <path d="M9 9.5v5M15 9.5v5" />
        </Svg>
      )
    case 'clone':
      return (
        <Svg>
          <path d="M9 3h6M12 3v4" />
          <path d="M7 7h10l1 5H6l1-5Z" />
          <path d="M8 12v5.5A2.5 2.5 0 0 0 10.5 20h3A2.5 2.5 0 0 0 16 17.5V12" />
        </Svg>
      )
    case 'paint':
      return (
        <Svg>
          <path d="M14.5 3.5 20.5 9.5 12 18l-6-6 8.5-8.5Z" />
          <path d="M9 15c-1 2-2 3-4 4 .4-2.6 1.4-4.3 3-5.5" />
        </Svg>
      )
    case 'eraser':
      return <Svg><path d="m4 16 7.5-7.5 7 7L14 20H8l-4-4Z" /><path d="M9 20h11" /></Svg>
    case 'fill':
      return (
        <Svg>
          <rect x="4" y="4" width="16" height="16" rx="2.5" />
          <path d="M4 12h16" />
          <path d="M4 12 20 4v16H4Z" fill="currentColor" stroke="none" opacity="0.28" />
        </Svg>
      )
    case 'focus':
      return (
        <Svg>
          <path d="M12 3c3.5 4.4 5.5 7.3 5.5 9.6A5.5 5.5 0 0 1 6.5 12.6C6.5 10.3 8.5 7.4 12 3Z" />
          <path d="M9 13.5a3 3 0 0 0 3 3" opacity="0.6" />
        </Svg>
      )
    case 'tone':
      return (
        <Svg>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
        </Svg>
      )
    case 'pen':
      return (
        <Svg>
          <path d="M4 20l2-6 8.5-8.5a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L10 18l-6 2Z" />
          <path d="M13 6.5 17.5 11" />
          <circle cx="4.5" cy="20.5" r="1" fill="currentColor" />
        </Svg>
      )
    case 'path':
      return (
        <Svg>
          <path d="M4 17c5-1 6-9 11-9" />
          <rect x="2.5" y="15.5" width="3.5" height="3.5" fill="currentColor" stroke="none" />
          <rect x="15.5" y="6.5" width="3.5" height="3.5" fill="currentColor" stroke="none" />
          <path d="m12 6 1.5 2 2.5.5-2 1.7.5 2.6-2.5-1.4-2.5 1.4.5-2.6-2-1.7L11 8.5 12 6Z" transform="translate(1 4)" opacity="0.55" />
        </Svg>
      )
    case 'type':
      return <Svg><path d="M5 20 12 4l7 16M8 14h8" /></Svg>
    case 'shape':
      return <Svg><rect x="3.5" y="7" width="9" height="9" /><circle cx="16.5" cy="12" r="4.5" opacity="0.7" /></Svg>
    case 'hand':
      return (
        <Svg>
          <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4.8a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v6.5" />
          <path d="M17 11.5V10a1.5 1.5 0 0 1 3 0v5c0 3.3-2.7 6-6 6h-1.5a6 6 0 0 1-4.3-1.8L4 14.4a1.6 1.6 0 0 1 2.3-2.2L8 13.5" />
        </Svg>
      )
    case 'rotate':
      return (
        <Svg>
          <path d="M20 12a8 8 0 1 1-2.6-5.9" />
          <path d="M20 4v5h-5" />
        </Svg>
      )
    case 'zoom':
      return <Svg><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5M8 10.5h5M10.5 8v5" /></Svg>
    default:
      return <Svg><circle cx="12" cy="12" r="8" /></Svg>
  }
}

function Flyout({ group, anchor, onPick, onClose, current }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const style = {
    position: 'fixed',
    left: Math.min(window.innerWidth - 220, anchor.right + 8),
    top: Math.min(Math.max(8, anchor.top - 6), window.innerHeight - 60 - group.tools.length * 40),
    zIndex: 2147483600,
  }
  return createPortal(
    <div className="ts-ps-flyout-backdrop" onPointerDown={onClose}>
      <div className="ts-ps-flyout" style={style} onPointerDown={(e) => e.stopPropagation()}>
        <span className="ts-ps-flyout-title">{group.label}</span>
        {group.tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`ts-ps-flyout-item${current === tool.id ? ' is-active' : ''}`}
            onClick={() => { onPick(tool.id); onClose() }}
          >
            <span>{tool.label}</span>
            {tool.key ? <kbd>{tool.key}</kbd> : null}
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
}

export default function PhotoshopRail({
  tool = 'select',
  onTool,
  settings,
  onSettings,
  onNotice,
}) {
  const [flyout, setFlyout] = useState(null)
  const railRef = useRef(null)
  const activeGroup = TOOL_BY_ID[tool]?.group || 'move'
  const fgRef = useRef(null)
  const bgRef = useRef(null)

  const pick = (id) => {
    onTool?.(id)
    const meta = TOOL_BY_ID[id]
    onNotice?.(meta?.tip)
  }

  const pickInGroup = (group, event) => {
    const tools = toolsInGroup(group.id)
    if (tools.length === 1) {
      pick(tools[0].id)
      return
    }
    const currentIndex = tools.findIndex((t) => t.id === tool)
    if (currentIndex >= 0 && !event.shiftKey) {
      // Same group: cycle to the next subtool.
      pick(tools[(currentIndex + 1) % tools.length].id)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    setFlyout({ group, anchor: rect })
  }

  const openFlyout = (group, event) => {
    event.stopPropagation()
    const rect = event.currentTarget.parentElement.getBoundingClientRect()
    setFlyout({ group, anchor: rect })
  }

  return (
    <div className="ts-ps-rail" ref={railRef} aria-label="Photoshop tools">
      <div className="ts-ps-head">
        <span>Photoshop</span>
        <em>tools</em>
      </div>
      <div className="ts-ps-groups">
        {TOOL_GROUPS.map((group) => {
          const inGroup = group.tools.some((t) => t.id === tool)
          const current = inGroup ? tool : group.tools[0].id
          return (
            <div className="ts-ps-slot" key={group.id}>
              <button
                type="button"
                className={`ts-ps-btn${inGroup ? ' is-active' : ''}`}
                title={`${group.label}${group.key ? ` (${group.key})` : ''} — click for ${TOOL_BY_ID[current]?.label}${group.tools.length > 1 ? ', click again or use the corner arrow for more' : ''}`}
                onClick={(e) => pickInGroup(group, e)}
              >
                <GroupIcon group={group.id} />
                {group.key ? <span className="ts-ps-key">{group.key}</span> : null}
              </button>
              {group.tools.length > 1 && (
                <button
                  type="button"
                  className="ts-ps-more"
                  title={`More ${group.label.toLowerCase()} tools`}
                  onClick={(e) => openFlyout(group, e)}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="ts-ps-colors">
        <button
          type="button"
          className="ts-ps-color ts-ps-color--fg"
          title="Foreground colour — click to change"
          style={{ background: settings?.foreground || '#1c2025' }}
          onClick={() => fgRef.current?.click()}
        />
        <button
          type="button"
          className="ts-ps-color ts-ps-color--bg"
          title="Background colour — click to change"
          style={{ background: settings?.background || '#ffffff' }}
          onClick={() => bgRef.current?.click()}
        />
        <button
          type="button"
          className="ts-ps-swap"
          title="Swap foreground and background"
          onClick={() => onSettings?.({
            ...settings,
            foreground: settings?.background || '#fff',
            background: settings?.foreground || '#000',
          })}
        >
          ⇄
        </button>
        <input
          ref={fgRef}
          type="color"
          className="ts-ps-color-input"
          value={settings?.foreground || '#1c2025'}
          onChange={(e) => onSettings?.({ ...settings, foreground: e.target.value })}
        />
        <input
          ref={bgRef}
          type="color"
          className="ts-ps-color-input"
          value={settings?.background || '#f7f7f3'}
          onChange={(e) => onSettings?.({ ...settings, background: e.target.value })}
        />
        <button
          type="button"
          className="ts-ps-reset-colors"
          title="Reset to black and white"
          onClick={() => onSettings?.({ ...settings, foreground: '#1c2025', background: '#f7f7f3' })}
        >
          B/W
        </button>
      </div>

      {flyout && (
        <Flyout
          group={flyout.group}
          anchor={flyout.anchor}
          current={tool}
          onPick={pick}
          onClose={() => setFlyout(null)}
        />
      )}
    </div>
  )
}
