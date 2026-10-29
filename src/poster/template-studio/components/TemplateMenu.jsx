import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'
import TemplateStudio from './Studio.jsx'
import TemplateCanvas from './TemplateCanvas.jsx'
import { CATEGORIES } from '../data/presets.js'
import { CATEGORY_COUNTS, docFromTemplate } from '../data/templates.js'
import { ChevronDown, Sparkle } from './Icons.jsx'

const StudioContext = createContext(null)

export const useTemplateStudio = () => useContext(StudioContext)

export function TemplateProvider({ children, storageKey = 'qoder.template-studio.v1' }) {
  const [state, setState] = useState({ open: false, category: 'All', templateId: null, nonce: 0 })

  const open = useCallback((category = 'All', templateId = null) => {
    setState((s) => ({ open: true, category, templateId, nonce: s.nonce + 1 }))
  }, [])
  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])

  const api = useMemo(() => ({ open, close }), [open, close])

  return (
    <StudioContext.Provider value={api}>
      {children}
      <TemplateStudio
        key={state.nonce}
        open={state.open}
        onClose={close}
        initialCategory={state.category}
        initialTemplateId={state.templateId}
        storageKey={storageKey}
      />
    </StudioContext.Provider>
  )
}

export function TemplateMenu({ label = 'Templates', className = '' }) {
  const ctx = useTemplateStudio()
  const [menuOpen, setMenuOpen] = useState(false)
  const [fallback, setFallback] = useState({ open: false, category: 'All' })
  const navRef = useRef(null)
  const featured = useMemo(() => docFromTemplate('w-bloom'), [])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const launch = (category = 'All') => {
    setMenuOpen(false)
    if (ctx) ctx.open(category)
    else setFallback({ open: true, category })
  }

  return (
    <div className={`ts-nav ${className}`} ref={navRef}>
      <button
        type="button"
        className={`ts-nav-btn${menuOpen ? ' is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span>{label}</span>
        <span className="ts-nav-new">New</span>
        <ChevronDown size={14} />
      </button>

      {menuOpen && (
        <div className="ts-menu" role="menu">
          <div className="ts-menu-main">
            <span className="ts-menu-eyebrow">Browse by occasion</span>
            <div className="ts-menu-cats">
              {CATEGORIES.filter((c) => c.id !== 'All').map((cat) => (
                <button key={cat.id} type="button" role="menuitem" onClick={() => launch(cat.id)}>
                  <span>{cat.label}</span>
                  <span className="ts-menu-count">{CATEGORY_COUNTS[cat.id] || 0}</span>
                </button>
              ))}
            </div>
            <button type="button" className="ts-menu-all" onClick={() => launch('All')}>
              <Sparkle size={14} />
              Open template studio
              <span>→</span>
            </button>
            <p className="ts-menu-foot">Editable designs for print, web and social.</p>
          </div>

          <div className="ts-menu-feature">
            <span className="ts-menu-eyebrow">Editor’s pick</span>
            <button type="button" className="ts-menu-preview" onClick={() => launch('All')} aria-label="Open Garden Bloom invitation">
              <TemplateCanvas doc={featured} className="ts-thumb" />
            </button>
            <div className="ts-menu-feature-meta">
              <b>Garden Bloom</b>
              <span>Wedding invitation · 5 × 7</span>
            </div>
            <button type="button" className="ts-menu-cta" onClick={() => launch('All')}>
              Customize it
            </button>
          </div>
        </div>
      )}

      {!ctx && (
        <TemplateStudio
          open={fallback.open}
          onClose={() => setFallback((s) => ({ ...s, open: false }))}
          initialCategory={fallback.category}
        />
      )}
    </div>
  )
}
