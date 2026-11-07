import { useMemo, useRef, useState } from 'react'
import { Check, Copy, Eraser, Search, Smile, Sparkles, Star, X } from 'lucide-react'
import { appConfig } from '../../config/app.config'
import { styleCategories, textStyles } from './text-styles'
import './EmojiTextGenerator.css'

const maxLength = 280
const favoritesKey = 'promptseen:emoji-text-favorites'

const WHATSAPP_GLYPH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'

function WhatsAppMark() {
  return <svg className="emoji-text-whatsapp-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={WHATSAPP_GLYPH} /></svg>
}

const whatsappBase = appConfig.promptSharing.messaging.find((target) => target.id === 'whatsapp')?.baseUrl ?? 'https://wa.me/'
const whatsappUrl = (value) => `${whatsappBase}?text=${encodeURIComponent(value)}`

const examples = ['Happy Birthday', 'Level 99 Noob', 'Thank You', 'Free Fire']

const favoriteIds = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(favoritesKey) ?? '[]')
    return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

const isStyleMatch = (style, needle) => !needle
  || style.name.toLowerCase().includes(needle)
  || style.category.toLowerCase().includes(needle)
  || style.id.includes(needle)

export default function EmojiTextGenerator() {
  const [text, setText] = useState('')
  const [view, setView] = useState('all')
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState(favoriteIds)
  const [copiedKey, setCopiedKey] = useState('')
  const [notice, setNotice] = useState('')
  const copiedTimer = useRef(0)

  const source = text.trim()
  const needle = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!source) return []
    return textStyles
      .filter((style) => (view === 'favorites' ? favorites.has(style.id) : view === 'all' || style.category === view))
      .filter((style) => isStyleMatch(style, needle))
      .map((style) => ({ id: style.id, name: style.name, category: style.category, output: style.transform(source) }))
  }, [source, view, favorites, needle])

  const categoryCounts = useMemo(() => {
    const counts = { all: textStyles.length, favorites: favorites.size }
    for (const style of textStyles) counts[style.category] = (counts[style.category] ?? 0) + 1
    return counts
  }, [favorites])

  const toggleFavorite = (id) => {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id); else next.add(id)
      try {
        localStorage.setItem(favoritesKey, JSON.stringify([...next]))
      } catch {
        // Storage can be full or blocked; the star still works for this visit.
      }
      return next
    })
  }

  const markCopied = (key, label, failed) => {
    window.clearTimeout(copiedTimer.current)
    setCopiedKey(failed ? '' : key)
    setNotice(failed ? `${label} could not be copied. Select the text and copy it instead.` : `${label} copied — paste it anywhere.`)
    copiedTimer.current = window.setTimeout(() => setCopiedKey(''), 1800)
  }

  const copy = async (key, label, value) => {
    try {
      await navigator.clipboard.writeText(value)
      markCopied(key, label, false)
    } catch {
      markCopied(key, label, true)
    }
  }

  const chips = [...styleCategories, { id: 'favorites', label: 'Favorites' }]

  return <section className="emoji-text-tool" aria-label="Emoji text generator">
    <div className="emoji-text-intro">
      <span className="emoji-text-kicker"><Smile size={13} /> EMOJI TEXT GENERATOR</span>
      <h1>Write in <em>emoji style</em> text</h1>
      <p>Type your words once and copy any of the {textStyles.length} Unicode fonts, emoji decorations and gamer styles. Ready for WhatsApp, Instagram, Free Fire and BGMI names.</p>
    </div>

    <div className="emoji-text-layout">
      <div className="emoji-text-controls">
        <section className="emoji-text-block">
          <div className="emoji-text-block-head"><h2>Your text</h2><span>{source.length}/{maxLength}</span></div>
          <label className="emoji-text-field">
            <textarea rows={4} value={text} maxLength={maxLength} onChange={(event) => setText(event.target.value)} placeholder="Type a name, status or message…" aria-label="Text to style" />
          </label>
          <div className="emoji-text-block-actions">
            <button type="button" className="emoji-text-ghost" onClick={() => setText('')} disabled={!text}><Eraser size={15} /> Clear</button>
            <span className="emoji-text-examples-label">Try</span>
            <div className="emoji-text-examples">
              {examples.map((example) => <button key={example} type="button" className="emoji-text-example" onClick={() => setText(example)}>{example}</button>)}
            </div>
          </div>
        </section>

        <section className="emoji-text-block">
          <div className="emoji-text-block-head"><h2>Style groups</h2><span>{results.length} shown</span></div>
          <div className="emoji-text-chips" role="radiogroup" aria-label="Style groups">
            {chips.map((entry) => <button
              key={entry.id}
              type="button"
              role="radio"
              aria-checked={view === entry.id}
              className={view === entry.id ? 'is-active' : ''}
              onClick={() => setView(entry.id)}
            >{entry.id === 'favorites' && <Star size={12} className={categoryCounts.favorites ? 'is-filled' : ''} />}{entry.label}<span>{categoryCounts[entry.id] ?? 0}</span></button>)}
          </div>
          <p className="emoji-text-note">Styles are built from Unicode characters, so they paste into any app. Fancy fonts may not show on very old devices.</p>
        </section>
      </div>

      <section className="emoji-text-results" aria-label="Generated styles">
        <div className="emoji-text-results-head">
          <div className="emoji-text-results-title"><h2><Sparkles size={15} /> Fancy Font Variations</h2>{notice && <p role="status">{notice}</p>}</div>
          <button type="button" className="emoji-text-copy-all" onClick={() => void copy('all', 'All styles', results.map((style) => style.output).join('\n'))} disabled={!results.length}>
            {copiedKey === 'all' ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy All</>}
          </button>
        </div>

        <label className="emoji-text-search">
          <Search size={14} />
          <input value={query} maxLength={40} onChange={(event) => setQuery(event.target.value)} placeholder="Search font styles (e.g., bold, gothic, cute)…" aria-label="Search font styles" />
          {query && <button type="button" className="emoji-text-search-clear" onClick={() => setQuery('')} aria-label="Clear search"><X size={13} /></button>}
        </label>

        {results.length ? <div className="emoji-text-style-list">{results.map((style) => {
          const starred = favorites.has(style.id)
          return <article className="emoji-text-style" key={style.id}>
            <div className="emoji-text-style-meta"><strong>{style.name}</strong><span>{style.category}</span></div>
            <p className="emoji-text-style-text">{style.output}</p>
            <div className="emoji-text-style-actions">
              <button type="button" className={`emoji-text-star ${starred ? 'is-on' : ''}`} onClick={() => toggleFavorite(style.id)} aria-pressed={starred} aria-label={`${starred ? 'Remove' : 'Add'} ${style.name} ${starred ? 'from' : 'to'} favorites`}><Star size={14} /></button>
              <a className="emoji-text-whatsapp" href={whatsappUrl(style.output)} target="_blank" rel="noreferrer" aria-label={`Share the ${style.name} style on WhatsApp`}><span className="emoji-text-whatsapp-badge"><WhatsAppMark /></span>WhatsApp</a>
              <button type="button" className={`emoji-text-copy ${copiedKey === style.id ? 'is-copied' : ''}`} onClick={() => void copy(style.id, style.name, style.output)} aria-label={`Copy the ${style.name} style`}>
                {copiedKey === style.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </article>
        })}</div>
          : <div className="emoji-text-empty"><Smile size={26} />{source
            ? <><h3>{view === 'favorites' ? 'No favourites yet' : 'No style matches that search'}</h3><p>{view === 'favorites' ? 'Tap the star on any style and it will show up here, even after you reload.' : 'Try a shorter word, like “bold”, “glow” or “wave”, or pick another style group.'}</p></>
            : <><h3>Nothing to style yet</h3><p>Type a name or message on the left, then every style appears here instantly.</p></>}</div>}
      </section>
    </div>
  </section>
}
