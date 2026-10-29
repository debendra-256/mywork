import React, { useMemo, useState } from 'react'
import TemplateCanvas from './TemplateCanvas.jsx'
import { TEMPLATES, docFromTemplate, CATEGORY_COUNTS } from '../data/templates.js'
import { CATEGORIES, ASPECTS } from '../data/presets.js'
import { cloneDoc } from '../model.js'
import { Sparkle, Search, Trash, Folder, Upload, Globe, Refresh } from './Icons.jsx'

const formatDate = (ts) => {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ts))
  } catch {
    return ''
  }
}

function TemplateCard({ template, doc, onUse }) {
  return (
    <article
      className="ts-card"
      role="button"
      tabIndex={0}
      onClick={() => onUse(template.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onUse(template.id)}
    >
      <div className="ts-card-frame">
        <TemplateCanvas doc={doc} className="ts-thumb" />
        {template.featured && <span className="ts-card-badge">Editor’s pick</span>}
        <span className="ts-card-ratio">{ASPECTS[template.aspect]?.label}</span>
        <span className="ts-card-hover">Customize this design</span>
      </div>
      <div className="ts-card-meta">
        <div>
          <h4>{template.name}</h4>
          <p>{template.category} · {template.tag}</p>
        </div>
        <span className="ts-card-arrow">→</span>
      </div>
    </article>
  )
}

function RemoteCard({ template, onUse }) {
  const doc = template.design
  return (
    <article
      className="ts-card ts-card--remote"
      role="button"
      tabIndex={0}
      onClick={() => onUse(template)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onUse(template)}
    >
      <div className="ts-card-frame">
        {doc ? <TemplateCanvas doc={doc} className="ts-thumb" /> : <div className="ts-thumb ts-thumb--blank" />}
        <span className="ts-card-badge ts-card-badge--remote"><Upload size={11} /> Library</span>
        <span className="ts-card-lang"><Globe size={11} /> {template.languageNative || template.language}</span>
        <span className="ts-card-ratio">{ASPECTS[template.aspect]?.label || template.aspect}</span>
        <span className="ts-card-hover">Edit this template</span>
      </div>
      <div className="ts-card-meta">
        <div>
          <h4>{template.name}</h4>
          <p>{template.category} · {template.languageLabel || template.language}</p>
        </div>
        <span className="ts-card-arrow">→</span>
      </div>
    </article>
  )
}

function SavedCard({ design, onOpen, onDelete }) {
  return (
    <article
      className="ts-card ts-card--saved"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(design)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(design)}
    >
      <div className="ts-card-frame">
        <TemplateCanvas doc={design.doc} className="ts-thumb" />
        <span className="ts-card-badge ts-card-badge--saved">Saved</span>
        <span className="ts-card-hover">Continue editing</span>
        <button
          type="button"
          className="ts-card-delete"
          title="Delete design"
          onClick={(e) => { e.stopPropagation(); onDelete(design.id) }}
        >
          <Trash size={14} />
        </button>
      </div>
      <div className="ts-card-meta">
        <div>
          <h4>{design.name}</h4>
          <p>{design.category} · {formatDate(design.updatedAt)}</p>
        </div>
        <span className="ts-card-arrow">→</span>
      </div>
    </article>
  )
}

export default function Gallery({
  designs,
  tab,
  category,
  onCategoryChange,
  onUseTemplate,
  onOpenDesign,
  onDeleteDesign,
  onBrowseTemplates,
  remoteTemplates = [],
  remoteLanguages = [],
  remoteLanguage = 'All',
  onRemoteLanguageChange,
  onUseRemote,
  remoteState = { loading: false, error: '' },
  onRefreshRemote,
  onManageLibrary,
}) {
  const [query, setQuery] = useState('')
  const docs = useMemo(() => {
    const map = {}
    TEMPLATES.forEach((t) => { map[t.id] = docFromTemplate(t.id) })
    return map
  }, [])

  const remoteCounts = useMemo(() => remoteTemplates.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {}), [remoteTemplates])

  const q = query.trim().toLowerCase()
  const matches = (t) => !q || `${t.name} ${t.category} ${t.tag || ''}`.toLowerCase().includes(q)
  const inCategory = (t) => category === 'All' || t.category === category
  const filtered = TEMPLATES.filter((t) => inCategory(t) && matches(t))
  const filteredRemote = remoteTemplates.filter((t) => inCategory(t) && matches(t))
  const totalKnown = TEMPLATES.length + remoteTemplates.length
  const languageLabel = remoteLanguage === 'All'
    ? 'All languages'
    : (remoteLanguages.find((l) => l.code === remoteLanguage)?.nativeLabel || remoteLanguage)

  if (tab === 'saved') {
    return (
      <div className="ts-scroll">
        <div className="ts-gallery">
          <div className="ts-gallery-head">
            <div>
              <span className="ts-eyebrow"><Folder size={12} /> Your collection</span>
              <h2>My designs</h2>
              <p>Everything you save is stored in the library database. Reopen a design to keep editing.</p>
            </div>
            <button type="button" className="ts-btn ts-btn-dark" onClick={onBrowseTemplates}>
              Browse templates
            </button>
          </div>

          {designs.length === 0 ? (
            <div className="ts-empty">
              <div className="ts-empty-mark">
                <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M60 98C42 84 32 71 32 58a16 16 0 0130-9 16 16 0 0130 9c0 13-10 26-32 40Z" />
                  <path d="M60 108V86M48 92c0-8 5-13 12-14M72 96c0-6-4-10-12-11" opacity=".6" />
                </svg>
              </div>
              <h3>Nothing saved yet</h3>
              <p>Choose a template, make it yours, then hit Save. Your designs will appear here.</p>
              <button type="button" className="ts-btn ts-btn-primary" onClick={onBrowseTemplates}>
                Start designing
              </button>
            </div>
          ) : (
            <div className="ts-grid ts-grid--saved">
              {designs.map((design) => (
                <SavedCard
                  key={design.id}
                  design={{ ...design, doc: design.doc ? cloneDoc(design.doc) : docFromTemplate(design.templateId) }}
                  onOpen={onOpenDesign}
                  onDelete={onDeleteDesign}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ts-scroll">
      <div className="ts-gallery">
        <div className="ts-gallery-head">
          <div>
            <span className="ts-eyebrow"><Sparkle size={12} /> The template library</span>
            <h2>Something for every celebration.</h2>
            <p>
              {TEMPLATES.length} hand-set designs for weddings, birthdays, babies, parties and more.
              Open any template, edit every word and colour, then save your own version.
            </p>
          </div>
          <label className="ts-search">
            <Search size={15} />
            <input
              type="search"
              placeholder="Search templates"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {remoteLanguages.length > 0 && (
          <div className="ts-langbar">
            <span className="ts-langbar-label"><Globe size={13} /> Library language</span>
            <div className="ts-langbar-chips">
              <button
                type="button"
                className={`ts-langchip${remoteLanguage === 'All' ? ' is-active' : ''}`}
                onClick={() => onRemoteLanguageChange?.('All')}
              >
                All
              </button>
              {remoteLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`ts-langchip${remoteLanguage === lang.code ? ' is-active' : ''}`}
                  onClick={() => onRemoteLanguageChange?.(lang.code)}
                  title={lang.label}
                >
                  {lang.nativeLabel || lang.label}
                  <span>{lang.code}</span>
                </button>
              ))}
            </div>
            <span className="ts-langbar-note">
              {remoteState.loading ? 'Loading…' : `${remoteTemplates.length} uploaded`}
            </span>
          </div>
        )}

        <div className="ts-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`ts-chip${category === cat.id ? ' is-active' : ''}`}
              onClick={() => onCategoryChange(cat.id)}
            >
              {cat.label}
              <span className="ts-chip-count">
                {cat.id === 'All' ? totalKnown : (CATEGORY_COUNTS[cat.id] || 0) + (remoteCounts[cat.id] || 0)}
              </span>
            </button>
          ))}
        </div>

        {remoteState.error && (
          <div className="ts-lib-note ts-lib-note--error">
            <span>Template library unavailable — showing studio designs. ({remoteState.error})</span>
            {onRefreshRemote && (
              <button type="button" className="ts-btn ts-btn-ghost" onClick={onRefreshRemote}>
                <Refresh size={13} /> Retry
              </button>
            )}
          </div>
        )}

        {filteredRemote.length > 0 && (
          <section className="ts-lib-section">
            <div className="ts-section-head">
              <div>
                <span className="ts-eyebrow"><Upload size={12} /> From the library</span>
                <h3>Uploaded templates</h3>
              </div>
              <span className="ts-section-note">{languageLabel}</span>
            </div>
            <div className="ts-grid">
              {filteredRemote.map((template) => (
                <RemoteCard key={template.id} template={template} onUse={onUseRemote} />
              ))}
            </div>
          </section>
        )}

        {filtered.length > 0 && (
          <section className="ts-lib-section">
            {filteredRemote.length > 0 && (
              <div className="ts-section-head">
                <div>
                  <span className="ts-eyebrow"><Sparkle size={12} /> Built in</span>
                  <h3>Studio collection</h3>
                </div>
                <span className="ts-section-note">{filtered.length} designs</span>
              </div>
            )}
            <div className="ts-grid">
              {filtered.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  doc={docs[template.id]}
                  onUse={onUseTemplate}
                />
              ))}
            </div>
          </section>
        )}

        {!filtered.length && !filteredRemote.length && (
          <div className="ts-empty ts-empty--inline">
            <h3>{query ? `No designs match “${query}”` : 'Nothing here yet'}</h3>
            <p>
              {query
                ? 'Try another word, or browse every occasion.'
                : 'Upload a design in the admin panel, or browse another occasion.'}
            </p>
            <button
              type="button"
              className="ts-btn ts-btn-ghost"
              onClick={() => { setQuery(''); onCategoryChange('All') }}
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="ts-gallery-foot">
          <span>Every template is fully editable — text, fonts, colours, ornament and layout.</span>
          <span>Saved designs are stored in the library database.</span>
          {onManageLibrary && (
            <button type="button" className="ts-gallery-admin" onClick={onManageLibrary}>
              Manage template library →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
