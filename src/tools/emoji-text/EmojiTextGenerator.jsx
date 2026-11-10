import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Copy,
  Crown,
  FileText,
  Flower2,
  Gamepad2,
  Heart,
  HelpCircle,
  LayoutGrid,
  Leaf,
  Search,
  Share2,
  Shuffle,
  Smile,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { appConfig } from '../../config/app.config'
import { styleCategories, textStyles } from './text-styles'
import './EmojiTextGenerator.css'

const maxLength = 280
const favoritesKey = 'promptseen:emoji-text-favorites'

function WhatsAppIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.58 3.38 17.07L2.1 21.74C2.01 22.06 2.3 22.34 2.62 22.25L7.33 20.93C8.75 21.7 10.33 22.14 12 22.14C17.52 22.14 22 17.66 22 12.14C22 6.62 17.52 2 12 2Z"
        fill="#25D366"
      />
      <path
        d="M16.92 14.38C16.63 14.23 15.22 13.54 14.96 13.44C14.7 13.34 14.51 13.29 14.32 13.58C14.13 13.87 13.58 14.53 13.41 14.72C13.24 14.91 13.07 14.93 12.78 14.79C12.49 14.64 11.57 14.34 10.48 13.37C9.63 12.61 9.06 11.67 8.89 11.38C8.72 11.09 8.87 10.93 9.02 10.79C9.15 10.66 9.31 10.44 9.46 10.27C9.6 10.1 9.65 9.98 9.75 9.79C9.85 9.59 9.8 9.42 9.73 9.28C9.65 9.14 9.08 7.72 8.84 7.14C8.61 6.57 8.37 6.65 8.19 6.64C8.02 6.63 7.83 6.63 7.64 6.63C7.45 6.63 7.15 6.7 6.89 6.99C6.63 7.28 5.89 7.97 5.89 9.38C5.89 10.79 6.92 12.15 7.06 12.34C7.2 12.53 9.1 15.44 11.99 16.69C12.68 16.99 13.22 17.17 13.63 17.3C14.33 17.52 14.96 17.49 15.46 17.42C16.02 17.34 17.18 16.72 17.42 16.05C17.66 15.38 17.66 14.81 17.59 14.67C17.52 14.53 17.33 14.45 17.04 14.31L16.92 14.38Z"
        fill="#ffffff"
      />
    </svg>
  )
}

const whatsappBase = appConfig.promptSharing?.messaging?.find((target) => target.id === 'whatsapp')?.baseUrl ?? 'https://wa.me/'
const whatsappUrl = (value) => `${whatsappBase}?text=${encodeURIComponent(value)}`

const examples = ['Happy Birthday', 'Level 99 Noob', 'Thank You', 'Free Fire', 'Gamer', 'Love You ❤️']

const randomPool = [
  'hello',
  'Good Morning ☀️',
  'Game Over 🎮',
  'Stay Cool 😎',
  'Queen 💖',
  'King 👑',
  'Level 99 Noob',
  'Happy Birthday 🎉',
  'Free Fire',
  'Love You ❤️',
  'Toxic Player ☠️',
  'Angel 🪽',
  'Cyberpunk ⚡',
  'Vibes ✨',
  'Pro Gamer 🕹️',
  'Dream Big 🚀',
  'Sunshine 🌻',
  'Legend ⚔️',
]

const categoryIconMap = {
  all: LayoutGrid,
  fancy: Sparkles,
  cute: Heart,
  gaming: Gamepad2,
  aesthetic: Flower2,
  gothic: Crown,
  minimal: Leaf,
  symbols: Star,
  emoji: Smile,
  favorites: Star,
}

const categoryBadgeMap = {
  fancy: 'FANCY',
  cute: 'CUTE',
  gaming: 'GAMING',
  aesthetic: 'AESTHETIC',
  gothic: 'GOTHIC',
  minimal: 'MINIMAL',
  symbols: 'SYMBOLS',
  emoji: 'EMOJI',
}

const favoriteIds = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(favoritesKey) ?? '[]')
    return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

const isStyleMatch = (style, needle) =>
  !needle ||
  style.name.toLowerCase().includes(needle) ||
  style.category.toLowerCase().includes(needle) ||
  style.id.includes(needle)

// FAQ list for schema and on-page content
const faqs = [
  {
    q: 'How does the Emoji Text Generator work?',
    a: 'The Emoji Text Generator uses special Unicode characters, mathematical symbols, alphabetic glyph variants, and emoji marks to convert regular letters into stylized text. Because these characters are part of the universal Unicode standard, they can be copied and pasted anywhere without requiring custom fonts.'
  },
  {
    q: 'Will these emoji fonts work on WhatsApp, Instagram, and TikTok?',
    a: 'Yes! All 100+ generated text styles are compatible with WhatsApp chats, WhatsApp Status, Instagram bios, Instagram stories, TikTok captions, Discord messages, Facebook posts, and YouTube comments across iOS, Android, and PC.'
  },
  {
    q: 'Can I use these styles for Free Fire, BGMI, and Roblox gamer nicknames?',
    a: 'Absolutely! Styles in the Gaming, Gothic, Aesthetic, and Symbols categories are specifically crafted for gamer tags, clan names, and esports nicknames in games like Free Fire, PUBG Mobile / BGMI, Roblox, and Call of Duty Mobile.'
  },
  {
    q: 'Is this Emoji Text Generator free to use?',
    a: 'Yes, 100% free with unlimited generation. There are no subscriptions, download fees, or registrations required.'
  },
  {
    q: 'Why do some fancy font styles show up as squares on older devices?',
    a: 'Some older operating systems (such as older Android versions) may lack glyph definitions for certain newly released Unicode symbols. However, over 95% of the fonts in our collection use widely supported core Unicode character sets that work reliably on virtually all modern smartphones.'
  }
]

export default function EmojiTextGenerator() {
  const [text, setText] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const q = params.get('text')
      if (q != null && q.trim()) return q.trim().slice(0, maxLength)
    } catch {}
    return 'hello'
  })
  const [view, setView] = useState('all')
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState(favoriteIds)
  const [copiedKey, setCopiedKey] = useState('')
  const [notice, setNotice] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  const copiedTimer = useRef(0)

  // Injected SEO Metadata and JSON-LD schemas
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const q = params.get('text')
      if (q != null && q.trim()) {
        setText(q.trim().slice(0, maxLength))
      }
    } catch {}

    const originalTitle = document.title
    document.title = 'Emoji Text Generator (100+ Fonts) – Fancy & Stylish Font Maker | ImgMojo'

    const metaConfigs = [
      {
        name: 'description',
        content: 'Free Emoji Text Generator to convert simple text into 100+ fancy Unicode fonts, cute emoji styles, gamer nicknames, and aesthetic letters. Copy and paste instantly into WhatsApp, Instagram bios, Free Fire, Discord, and TikTok.'
      },
      {
        name: 'keywords',
        content: 'emoji text generator, fancy text generator, stylish font generator, emoji font maker, aesthetic text converter, unicode font copy paste, whatsapp stylish text, instagram bio fonts, free fire nickname generator'
      },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: 'Emoji Text Generator (100+ Fonts) – Free Fancy Font Maker | ImgMojo' },
      {
        property: 'og:description',
        content: 'Type your words once and generate 100+ stylish Unicode fonts, cute emoji letters, and gamer tags. Free instant copy and WhatsApp share.'
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://imgmojo.com/emoji-text' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Emoji Text Generator – Fancy & Stylish Fonts Online' },
      {
        name: 'twitter:description',
        content: 'Create 100+ stylish emoji text variations for Instagram bios, WhatsApp messages, and gamer nicknames.'
      }
    ]

    const addedMetaElements = metaConfigs.map((cfg) => {
      const el = document.createElement('meta')
      if (cfg.name) el.setAttribute('name', cfg.name)
      if (cfg.property) el.setAttribute('property', cfg.property)
      el.setAttribute('content', cfg.content)
      document.head.appendChild(el)
      return el
    })

    const canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = 'https://imgmojo.com/emoji-text'
    document.head.appendChild(canonical)

    const schemaData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'ImgMojo Emoji Text Generator',
          url: 'https://imgmojo.com/emoji-text',
          applicationCategory: 'UtilityApplication',
          operatingSystem: 'All',
          description: 'Instantly convert words into 100+ stylish Unicode font variations, cute emoji texts, aesthetic styles, and gaming nicknames.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          }
        },
        {
          '@type': 'HowTo',
          name: 'How to Generate and Copy Stylish Emoji Text',
          description: 'Convert any message or nickname into fancy emoji styles in 3 quick steps.',
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Type Your Text',
              text: 'Enter your name, status, or message in the input box on the left.'
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Filter or Search Font Styles',
              text: 'Browse through categories like Fancy, Cute, Gaming, Aesthetic, Gothic, or search directly.'
            },
            {
              '@type': 'HowToStep',
              position: 3,
              name: 'Copy or Share',
              text: 'Click Copy to save to your clipboard or click WhatsApp to send directly to friends.'
            }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.a
            }
          }))
        }
      ]
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schemaData)
    document.head.appendChild(script)

    return () => {
      document.title = originalTitle
      addedMetaElements.forEach((el) => el.remove())
      canonical.remove()
      script.remove()
    }
  }, [])

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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(favoritesKey, JSON.stringify([...next]))
      } catch {
        // Storage full fallback
      }
      return next
    })
  }

  const markCopied = (key, label, failed) => {
    window.clearTimeout(copiedTimer.current)
    setCopiedKey(failed ? '' : key)
    setNotice(failed ? `${label} could not be copied. Select the text and copy it instead.` : `${label} copied! Paste it anywhere.`)
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

  const handleRandomText = () => {
    const available = randomPool.filter((p) => p !== text)
    const picked = available[Math.floor(Math.random() * available.length)] || 'Fancy Text'
    setText(picked)
  }

  const handleShareTopOnWhatsApp = () => {
    if (!results.length) return
    const topOutput = results[0].output
    window.open(whatsappUrl(topOutput), '_blank', 'noopener,noreferrer')
  }

  const chips = [...styleCategories, { id: 'favorites', label: 'Favorites' }]

  return (
    <div className="emoji-text-wrapper">
      {/* Full Width Hero Banner with 3D Illustration Graphic */}
      <section className="emoji-text-hero">
        <div className="emoji-text-hero-content">
          <div className="emoji-text-hero-kicker">
            <span className="emoji-text-kicker-emoji">🥰</span>
            <span>EMOJI TEXT GENERATOR</span>
          </div>
          <h1>
            Write in <span className="emoji-text-hero-gradient">Emoji Style Text</span>
          </h1>
          <p>
            Type your words and instantly get 100+ stylish emoji fonts, decorations and gamer styles. Perfect for WhatsApp,
            Instagram, bios, comments and more!
          </p>
        </div>

        {/* 3D-styled Mobile Graphic Art */}
        <div className="emoji-text-hero-graphic" aria-hidden="true">
          <div className="emoji-text-3d-bubble">
            <div className="emoji-text-3d-face">😍</div>
            <div className="emoji-text-bubble-shine" />
          </div>
          <div className="emoji-text-floating-heart heart-1">💖</div>
          <div className="emoji-text-floating-heart heart-2">💕</div>
          <div className="emoji-text-3d-card">
            <span className="emoji-text-card-aa">Aa</span>
            <div className="emoji-text-card-sparkle">✨</div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Responsive Workspace */}
      <main className="emoji-text-layout">
        {/* Left Column: Controls (Your Text + Style Groups) */}
        <aside className="emoji-text-controls">
          {/* Card 1: Your Text */}
          <section className="emoji-text-card emoji-text-input-card">
            <div className="emoji-text-card-head">
              <div className="emoji-text-card-title">
                <span className="emoji-text-title-icon">✏️</span>
                <h2>Your Text</h2>
              </div>
              <span className="emoji-text-char-badge">
                {source.length}/{maxLength}
              </span>
            </div>

            <label className="emoji-text-textarea-wrap">
              <textarea
                rows={4}
                value={text}
                maxLength={maxLength}
                onChange={(event) => setText(event.target.value)}
                placeholder="Type a name, status or message…"
                aria-label="Text to convert into stylish emoji fonts"
              />
            </label>

            {/* Quick Actions Bar */}
            <div className="emoji-text-quick-actions">
              <button
                type="button"
                className="emoji-text-btn-ghost"
                onClick={() => setText('')}
                disabled={!text}
                title="Clear text"
              >
                <Trash2 size={14} /> Clear
              </button>
              <button
                type="button"
                className="emoji-text-btn-ghost"
                onClick={() => setText('ImgMojo Editor')}
                title="Insert sample text"
              >
                <FileText size={14} /> Sample Text
              </button>
              <button
                type="button"
                className="emoji-text-btn-random"
                onClick={handleRandomText}
                title="Generate random phrase"
              >
                <Shuffle size={14} /> Random Text
              </button>
            </div>

            {/* Suggestion Pills */}
            <div className="emoji-text-examples-row">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="emoji-text-example-pill"
                  onClick={() => setText(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </section>

          {/* Card 2: Style Groups */}
          <section className="emoji-text-card emoji-text-groups-card">
            <div className="emoji-text-card-head">
              <div className="emoji-text-card-title">
                <span className="emoji-text-title-icon">🎯</span>
                <h2>Style Groups</h2>
              </div>
              <span className="emoji-text-styles-count">100+ styles</span>
            </div>

            <div className="emoji-text-chips-grid" role="radiogroup" aria-label="Filter styles by category">
              {chips.map((entry) => {
                const IconComponent = categoryIconMap[entry.id] || Sparkles
                const isCurrent = view === entry.id
                return (
                  <button
                    key={entry.id}
                    type="button"
                    role="radio"
                    aria-checked={isCurrent}
                    className={`emoji-text-chip-btn ${isCurrent ? 'is-active' : ''}`}
                    onClick={() => setView(entry.id)}
                  >
                    <IconComponent
                      size={14}
                      className={entry.id === 'favorites' && categoryCounts.favorites ? 'is-filled' : ''}
                    />
                    <span className="emoji-text-chip-label">{entry.label}</span>
                    <span className="emoji-text-chip-num">{categoryCounts[entry.id] ?? 0}</span>
                  </button>
                )
              })}
            </div>

            <p className="emoji-text-compatibility-tip">
              Styles are composed of universal Unicode glyphs and paste seamlessly into any modern app or platform.
            </p>
          </section>
        </aside>

        {/* Right Column: Fancy Font Variations List */}
        <section className="emoji-text-card emoji-text-results-card" aria-label="Generated font variations">
          {/* Header Row */}
          <div className="emoji-text-results-header">
            <div>
              <div className="emoji-text-results-heading">
                <Sparkles size={18} className="emoji-text-sparkle-icon" />
                <h2>Fancy Font Variations</h2>
              </div>
              <p className="emoji-text-results-sub">Choose from 100+ stylish emoji text styles</p>
            </div>

            {/* Top Action Pills */}
            <div className="emoji-text-top-actions">
              <button
                type="button"
                className={`emoji-text-top-pill ${view === 'favorites' ? 'is-active' : ''}`}
                onClick={() => setView(view === 'favorites' ? 'all' : 'favorites')}
              >
                <Star size={14} className={categoryCounts.favorites ? 'is-filled' : ''} />
                Favorites ({categoryCounts.favorites ?? 0})
              </button>

              <button
                type="button"
                className="emoji-text-top-pill"
                onClick={() => void copy('all', 'All styles', results.map((style) => style.output).join('\n'))}
                disabled={!results.length}
              >
                {copiedKey === 'all' ? (
                  <>
                    <Check size={14} /> Copied All
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy All
                  </>
                )}
              </button>

              <button
                type="button"
                className="emoji-text-top-pill emoji-text-top-whatsapp"
                onClick={handleShareTopOnWhatsApp}
                disabled={!results.length}
              >
                <WhatsAppIcon size={15} />
                <span>Share on WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="emoji-text-search-container">
            <Search size={16} className="emoji-text-search-lens" />
            <input
              value={query}
              maxLength={40}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search font styles (e.g., bold, gothic, cute, gaming...)"
              aria-label="Search font styles"
            />
            {query && (
              <button
                type="button"
                className="emoji-text-search-clear-btn"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Toast Notification */}
          {notice && (
            <div className="emoji-text-toast" role="status">
              <Check size={14} />
              <span>{notice}</span>
            </div>
          )}

          {/* Variations List */}
          {results.length ? (
            <div className="emoji-text-list">
              {results.map((style) => {
                const starred = favorites.has(style.id)
                const badgeText = categoryBadgeMap[style.category] || style.category.toUpperCase()
                return (
                  <article className="emoji-text-row" key={style.id}>
                    <div className="emoji-text-accent-bar" aria-hidden="true" />

                    <div className="emoji-text-row-info">
                      <div className="emoji-text-row-meta">
                        <strong className="emoji-text-style-title">{style.name}</strong>
                        <span className={`emoji-text-category-badge cat-${style.category}`}>
                          {badgeText}
                        </span>
                      </div>
                      <p className="emoji-text-styled-output">{style.output}</p>
                    </div>

                    <div className="emoji-text-row-actions">
                      <button
                        type="button"
                        className={`emoji-text-star-btn ${starred ? 'is-starred' : ''}`}
                        onClick={() => toggleFavorite(style.id)}
                        aria-pressed={starred}
                        aria-label={`${starred ? 'Remove' : 'Add'} ${style.name} ${starred ? 'from' : 'to'} favorites`}
                        title={starred ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={15} />
                      </button>

                      <a
                        className="emoji-text-wa-btn"
                        href={whatsappUrl(style.output)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Share ${style.name} style on WhatsApp`}
                        title="Share on WhatsApp"
                      >
                        <WhatsAppIcon size={14} />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        className={`emoji-text-copy-btn ${copiedKey === style.id ? 'is-copied' : ''}`}
                        onClick={() => void copy(style.id, style.name, style.output)}
                        aria-label={`Copy ${style.name} style`}
                      >
                        {copiedKey === style.id ? (
                          <>
                            <Check size={14} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="emoji-text-empty-state">
              <Smile size={32} />
              {source ? (
                <>
                  <h3>{view === 'favorites' ? 'No favorites added yet' : 'No style matches that search'}</h3>
                  <p>
                    {view === 'favorites'
                      ? 'Click the star icon on any style to bookmark it here for quick access.'
                      : 'Try typing a simpler term like “bold”, “wave” or “cute”, or switch to All Styles.'}
                  </p>
                </>
              ) : (
                <>
                  <h3>Type something to preview</h3>
                  <p>Enter any text on the left to see all 100+ fancy font styles appear instantly.</p>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Semantic On-Page SEO Content Section */}
      <section className="emoji-text-seo-section">
        <div className="emoji-text-seo-header">
          <span className="emoji-text-seo-badge">FEATURES & GUIDE</span>
          <h2>The Ultimate Free Unicode Emoji Text Generator</h2>
          <p>
            Transform your standard messages and social profiles into captivating, stylish text designs with our 100+
            curated Unicode font transformations.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="emoji-text-features-grid">
          <div className="emoji-text-feature-card">
            <div className="emoji-text-feature-icon">✨</div>
            <h3>100+ Unique Font Styles</h3>
            <p>
              Instantly convert ordinary text into bold, italic, gothic fraktur, cursive script, bubble text, zalgo glitch,
              and aesthetic decorations.
            </p>
          </div>

          <div className="emoji-text-feature-card">
            <div className="emoji-text-feature-icon">📲</div>
            <h3>Direct WhatsApp Sharing</h3>
            <p>
              Send any converted message straight to your contacts or groups with a single click via our integrated WhatsApp
              share button.
            </p>
          </div>

          <div className="emoji-text-feature-card">
            <div className="emoji-text-feature-icon">🎮</div>
            <h3>Gamer & Clan Nicknames</h3>
            <p>
              Generate high-tier gamer tags, stylish clan symbols, and weapon-framed names for Free Fire, BGMI, PUBG, and
              Roblox.
            </p>
          </div>

          <div className="emoji-text-feature-card">
            <div className="emoji-text-feature-icon">🔒</div>
            <h3>100% Free & Client-Side</h3>
            <p>
              Your text is transformed right inside your browser with zero latency. No registration, no watermarks, and no
              server logging.
            </p>
          </div>
        </div>

        {/* How It Works (3 Steps) */}
        <div className="emoji-text-how-it-works">
          <h3>How to Generate and Copy Emoji Text</h3>
          <div className="emoji-text-steps-grid">
            <div className="emoji-text-step">
              <span className="emoji-text-step-num">1</span>
              <h4>Type Your Message</h4>
              <p>Enter any words, bio, status, or gaming username in the text area.</p>
            </div>
            <div className="emoji-text-step">
              <span className="emoji-text-step-num">2</span>
              <h4>Browse Categories</h4>
              <p>Filter by Fancy, Cute, Gaming, Aesthetic, or Gothic to find your favorite look.</p>
            </div>
            <div className="emoji-text-step">
              <span className="emoji-text-step-num">3</span>
              <h4>Copy and Paste</h4>
              <p>Click Copy to copy the styled text, or click WhatsApp to share instantly.</p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="emoji-text-faq-container">
          <h3>Frequently Asked Questions</h3>
          <div className="emoji-text-faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div className={`emoji-text-faq-item ${isOpen ? 'is-open' : ''}`} key={index}>
                  <button
                    type="button"
                    className="emoji-text-faq-btn"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className="emoji-text-faq-arrow" />
                  </button>
                  {isOpen && <div className="emoji-text-faq-answer"><p>{faq.a}</p></div>}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
