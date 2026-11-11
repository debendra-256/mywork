import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  X,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Clock3,
  Zap,
} from 'lucide-react'
import { EMOJI_CATEGORIES, SKIN_TONES, type EmojiItem } from './emojiData'
import './GetEmoji.css'

function BackspaceIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
  )
}

const RECENTS_STORAGE_KEY = 'imgmojo:getemoji-recents'
const MAX_RECENTS = 36

export default function GetEmoji() {
  const [selectedEmojis, setSelectedEmojis] = useState('')
  const [copiedWorkbench, setCopiedWorkbench] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeSkinTone, setActiveSkinTone] = useState<string>('default')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [recents, setRecents] = useState<string[]>([])
  const toastTimeoutRef = useRef<number | null>(null)

  // Load recents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setRecents(parsed.slice(0, MAX_RECENTS))
      }
    } catch {
      // localStorage may be disabled
    }
  }, [])

  // Show a temporary floating toast
  const showToast = (message: string) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current)
    setToastMessage(message)
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null)
    }, 1800)
  }

  // Handle single emoji click
  const handleEmojiClick = async (emojiChar: string) => {
    // 1. Append to workbench
    setSelectedEmojis((prev) => prev + emojiChar)

    // 2. Add to recents
    setRecents((prev) => {
      const next = [emojiChar, ...prev.filter((e) => e !== emojiChar)].slice(0, MAX_RECENTS)
      try {
        localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })

    // 3. Directly copy to clipboard
    try {
      await navigator.clipboard.writeText(emojiChar)
      showToast(`Copied ${emojiChar} to clipboard!`)
    } catch {
      showToast(`Added ${emojiChar} to workbench`)
    }
  }

  // Copy entire workbench
  const handleCopyWorkbench = async () => {
    if (!selectedEmojis) return
    try {
      await navigator.clipboard.writeText(selectedEmojis)
      setCopiedWorkbench(true)
      showToast(`Copied all emojis to clipboard!`)
      window.setTimeout(() => setCopiedWorkbench(false), 1600)
    } catch {
      showToast('Clipboard access was blocked')
    }
  }

  // Clear workbench
  const handleClearWorkbench = () => {
    setSelectedEmojis('')
  }

  // Backspace last emoji
  const handleBackspace = () => {
    // Convert to array of code points to avoid breaking surrogate pairs
    const chars = Array.from(selectedEmojis)
    chars.pop()
    setSelectedEmojis(chars.join(''))
  }

  // Clear recents
  const handleClearRecents = () => {
    setRecents([])
    try {
      localStorage.removeItem(RECENTS_STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  // Resolve emoji character with active skin tone
  const resolveEmojiChar = (item: EmojiItem): string => {
    if (!item.skinTone || activeSkinTone === 'default') {
      return item.char
    }
    const toneObj = SKIN_TONES.find((t) => t.id === activeSkinTone)
    if (!toneObj || !toneObj.modifier) return item.char
    return item.char + toneObj.modifier
  }

  // Filtered categories & emojis
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return EMOJI_CATEGORIES.map((category) => {
      if (activeCategory !== 'all' && activeCategory !== category.id) {
        return { ...category, emojis: [] }
      }
      if (!q) {
        return category
      }
      const matched = category.emojis.filter((item) => {
        if (item.name.toLowerCase().includes(q)) return true
        if (item.keywords.some((kw) => kw.toLowerCase().includes(q))) return true
        if (item.char === q) return true
        return false
      })
      return { ...category, emojis: matched }
    }).filter((category) => category.emojis.length > 0)
  }, [searchQuery, activeCategory])

  return (
    <div className="get-emoji-container">
      {/* Hero Header */}
      <header className="get-emoji-hero">
        <div className="get-emoji-badge">
          <Zap size={14} /> 100% Free · Copy & Paste Directory
        </div>
        <h1 className="get-emoji-title">
          Get<span className="accent-text">Emoji</span> — Copy & Paste Emojis
        </h1>
        <p className="get-emoji-subtitle">
          Copy and paste emojis for WhatsApp, Instagram, Facebook, Twitter, TikTok, Slack, Mac,
          Windows, iPhone, and Android. No apps required — click any emoji to copy instantly.
        </p>
      </header>

      {/* Live Workbench / Copy Box */}
      <section className="get-emoji-workbench" aria-label="Emoji Workbench">
        <div className="get-emoji-output-row">
          <div
            className="get-emoji-output-display"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setSelectedEmojis(e.currentTarget.textContent || '')}
            tabIndex={0}
            role="textbox"
            aria-label="Selected emojis"
          >
            {selectedEmojis || (
              <span className="get-emoji-output-placeholder">
                Click any emoji below to copy & assemble your string here…
              </span>
            )}
          </div>

          <div className="get-emoji-actions">
            <button
              type="button"
              className="get-emoji-btn get-emoji-btn-primary"
              onClick={handleCopyWorkbench}
              disabled={!selectedEmojis}
              title="Copy all emojis in the workbench"
            >
              {copiedWorkbench ? <Check size={16} /> : <Copy size={16} />}
              {copiedWorkbench ? 'Copied All!' : 'Copy All'}
            </button>
            <button
              type="button"
              className="get-emoji-btn get-emoji-btn-secondary"
              onClick={handleBackspace}
              disabled={!selectedEmojis}
              title="Delete last emoji"
              aria-label="Backspace"
            >
              <BackspaceIcon size={16} />
            </button>
            <button
              type="button"
              className="get-emoji-btn get-emoji-btn-secondary"
              onClick={handleClearWorkbench}
              disabled={!selectedEmojis}
              title="Clear workbench"
              aria-label="Clear"
            >
              <RotateCcw size={16} /> Clear
            </button>
          </div>
        </div>

        <div className="get-emoji-meta-row">
          <span>{Array.from(selectedEmojis).length} emojis in workbench</span>
          <span>Tip: Click any emoji to copy directly to your clipboard</span>
        </div>
      </section>

      {/* Controls: Search & Skin Tone */}
      <div className="get-emoji-controls-bar">
        <div className="get-emoji-search-box">
          <Search size={18} className="get-emoji-search-icon" />
          <input
            type="text"
            className="get-emoji-search-input"
            placeholder="Search 2,000+ emojis by name or keyword (e.g. fire, smile, heart, dog)…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search emojis"
          />
          {searchQuery && (
            <button
              type="button"
              className="get-emoji-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Skin Tone Selector */}
        <div className="get-emoji-skintones" role="radiogroup" aria-label="Skin tone selector">
          {SKIN_TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              role="radio"
              aria-checked={activeSkinTone === tone.id}
              className={`get-emoji-skintone-btn ${activeSkinTone === tone.id ? 'is-active' : ''}`}
              onClick={() => setActiveSkinTone(tone.id)}
              title={`${tone.label} Skin Tone`}
            >
              {tone.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky Category Pills */}
      <nav className="get-emoji-nav" aria-label="Emoji Categories">
        <button
          type="button"
          className={`get-emoji-nav-item ${activeCategory === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          <Sparkles size={14} /> All Emojis
        </button>
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`get-emoji-nav-item ${activeCategory === cat.id ? 'is-active' : ''}`}
            onClick={() => {
              setActiveCategory(cat.id)
              const el = document.getElementById(`cat-${cat.id}`)
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            <span>{cat.icon}</span> {cat.name}
          </button>
        ))}
      </nav>

      {/* Recently Used Bar */}
      {recents.length > 0 && !searchQuery && (
        <section className="get-emoji-recents-wrap" aria-label="Recently used emojis">
          <div className="get-emoji-recents-head">
            <span className="get-emoji-recents-title">
              <Clock3 size={15} /> Recently Copied
            </span>
            <button type="button" className="get-emoji-recents-clear" onClick={handleClearRecents}>
              Clear recents
            </button>
          </div>
          <div className="get-emoji-recents-list">
            {recents.map((emojiChar, index) => (
              <button
                key={`${emojiChar}-${index}`}
                type="button"
                className="get-emoji-item"
                onClick={() => handleEmojiClick(emojiChar)}
                title={`Copy ${emojiChar}`}
              >
                {emojiChar}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Main Emoji Directory */}
      <main className="get-emoji-main">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              id={`cat-${category.id}`}
              className="get-emoji-category"
              aria-label={category.name}
            >
              <div className="get-emoji-category-header">
                <h2 className="get-emoji-category-title">
                  <span>{category.icon}</span> {category.name}
                </h2>
                <span className="get-emoji-category-count">{category.emojis.length} emojis</span>
              </div>

              <div className="get-emoji-grid">
                {category.emojis.map((item) => {
                  const resolvedChar = resolveEmojiChar(item)
                  return (
                    <button
                      key={`${item.name}-${resolvedChar}`}
                      type="button"
                      className="get-emoji-item"
                      onClick={() => handleEmojiClick(resolvedChar)}
                      title={`${item.name} (${resolvedChar})`}
                      aria-label={`${item.name} ${resolvedChar}`}
                    >
                      {resolvedChar}
                    </button>
                  )
                })}
              </div>
            </section>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🔍</p>
            <h3>No emojis found for "{searchQuery}"</h3>
            <p>Try searching for generic terms like "smile", "love", "heart", "food", or "animal".</p>
            <button
              type="button"
              className="get-emoji-btn get-emoji-btn-primary"
              style={{ marginTop: '16px' }}
              onClick={() => {
                setSearchQuery('')
                setActiveCategory('all')
              }}
            >
              Reset Search
            </button>
          </div>
        )}
      </main>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="get-emoji-toast" role="status" aria-live="polite">
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* GetEmoji SEO Guide & How-To Section */}
      <footer className="get-emoji-guide">
        <div className="get-emoji-guide-header">
          <h2>How to Copy and Paste Emoji Online</h2>
          <p>
            GetEmoji makes it effortless to find and copy any emoji directly to your clipboard.
            Fully supported across all major browsers, desktop operating systems, and mobile devices.
          </p>
        </div>

        <div className="get-emoji-features-grid">
          <div className="get-emoji-feature-card">
            <div className="get-emoji-feature-icon">⚡️</div>
            <h3>Instant 1-Click Copy</h3>
            <p>
              Click or tap any emoji and it is instantly copied to your clipboard. Ready to paste with
              Ctrl+V (Windows) or Cmd+V (Mac).
            </p>
          </div>

          <div className="get-emoji-feature-card">
            <div className="get-emoji-feature-icon">🎨</div>
            <h3>Skin Tone Customizer</h3>
            <p>
              Switch between 6 skin tones with the tone bar. Hand gestures, people, and professions
              update dynamically.
            </p>
          </div>

          <div className="get-emoji-feature-card">
            <div className="get-emoji-feature-icon">📲</div>
            <h3>Universal Compatibility</h3>
            <p>
              All emojis adhere to the official Unicode standard. Works on WhatsApp, Instagram,
              Facebook, Twitter, TikTok, Slack, Discord, and Google Docs.
            </p>
          </div>

          <div className="get-emoji-feature-card">
            <div className="get-emoji-feature-icon">🔒</div>
            <h3>100% Free & Private</h3>
            <p>
              Runs completely client-side in your web browser. No apps, extensions, or downloads
              needed.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
