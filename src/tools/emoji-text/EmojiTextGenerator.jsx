import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Copy,
  Eye,
  FileText,
  Heart,
  Layers,
  PenTool,
  Share2,
  Shuffle,
  Smile,
  Sparkles,
  Star,
  Trash2,
  Type,
  User,
  X,
} from 'lucide-react'
import { appConfig } from '../../config/app.config'
import { textStyles } from './text-styles'
import './EmojiTextGenerator.css'

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'bold', label: 'Bold' },
  { id: 'cursive', label: 'Cursive' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'effects', label: 'Effects' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'small', label: 'Small' },
  { id: 'fancy', label: 'Fancy' },
  { id: 'decorative', label: 'Decorative' },
  { id: 'calligraphy', label: 'Calligraphy' },
]

export const STYLE_CATEGORIES_MAP = {
  'bold': ['bold'],
  'bold-italic': ['bold', 'cursive'],
  'sans-bold': ['bold', 'shapes'],
  'sans-bold-italic': ['bold', 'cursive'],
  'script-bold': ['bold', 'cursive', 'calligraphy'],
  'italic': ['cursive'],
  'script': ['cursive', 'calligraphy'],
  'sans': ['shapes'],
  'sans-italic': ['cursive', 'shapes'],
  'fraktur': ['fancy', 'calligraphy'],
  'fraktur-bold': ['bold', 'fancy', 'calligraphy'],
  'double-struck': ['shapes', 'fancy'],
  'monospace': ['shapes'],
  'small-caps': ['shapes', 'small'],
  'circled': ['shapes', 'decorative'],
  'parenthesized': ['shapes'],
  'superscript': ['small'],
  'subscript': ['small'],
  'fullwidth': ['shapes'],
  'flip': ['effects'],
  'underline': ['effects'],
  'double-underline': ['effects'],
  'wavy-underline': ['effects'],
  'strikethrough': ['effects'],
  'overline': ['effects'],
  'slashed': ['effects'],
  'dotted': ['effects'],
  'glitch-light': ['glitch'],
  'glitch-heavy': ['glitch'],
  'corrupt': ['glitch'],
  'wings': ['decorative'],
  'heart-line': ['decorative'],
  'kawaii': ['decorative'],
  'star-string': ['decorative'],
  'flower-chain': ['decorative'],
  'lightning': ['decorative'],
  'red-heart': ['decorative'],
  'star-glow': ['decorative'],
  'fire': ['decorative'],
  'crown': ['decorative'],
  'celebrate': ['decorative'],
  'love-you': ['decorative'],
  'party-sparkle': ['decorative'],
  'gaming-life': ['decorative'],
  'blackletter': ['fancy', 'calligraphy'],
  'gothic-cross': ['fancy', 'calligraphy'],
  'runic': ['fancy'],
  'greek': ['fancy'],
  'cyrillic': ['fancy'],
  'cherokee': ['fancy'],
  'vaporwave': ['decorative'],
  'aesthetic-star': ['decorative'],
  'aesthetic-moon': ['decorative'],
  'aesthetic-cloud': ['decorative'],
  'sniper': ['decorative'],
  'clan-tag': ['bold', 'shapes'],
  'symbol-arrows': ['decorative'],
  'symbol-triangles': ['decorative'],
  'symbol-moon': ['decorative'],
  'corner': ['shapes'],
  'lenticular': ['shapes'],
  'box-lines': ['shapes'],
  'spaced': ['effects'],
  'dot-between': ['effects'],
  'slash-wrap': ['effects'],
  'bar-wrap': ['effects'],
  'dash-around': ['effects'],
  'snake-case': ['effects'],
  'pink-heart': ['decorative'],
  'soft-point': ['decorative'],
  'bow': ['decorative'],
  'music-note': ['decorative'],
  'soft-wave': ['decorative'],
  'aesthetic-halo': ['decorative'],
  'aesthetic-wave': ['decorative'],
  'aesthetic-quote': ['calligraphy', 'decorative'],
  'aesthetic-floral': ['decorative'],
  'aesthetic-blossom': ['decorative'],
  'aesthetic-orbit': ['decorative'],
  'gothic-dagger': ['fancy'],
  'gothic-altar': ['fancy'],
  'gothic-skull': ['decorative'],
  'gothic-ankh': ['decorative'],
  'gothic-fleur': ['decorative'],
  'gothic-spade': ['decorative'],
  'double-angle': ['shapes'],
  'angle': ['shapes'],
  'symbol-asterisk': ['decorative'],
  'symbol-diamond': ['decorative'],
  'symbol-music': ['decorative'],
  'symbol-braille': ['decorative'],
  'diamond-set': ['decorative'],
  'snowfall': ['decorative'],
  'rose-drop': ['decorative'],
  'spectrum': ['decorative'],
  'crossed-out': ['effects'],
  'neon-grid': ['shapes'],
  'toxic': ['decorative'],
  'rule-around': ['effects'],
  'lowercase': ['effects'],
}

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

function InstagramIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

function FacebookIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  )
}

function YoutubeIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#ffffff"></polygon>
    </svg>
  )
}

function XSocialIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
  )
}

function TelegramIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"></path>
    </svg>
  )
}

const whatsappBase = appConfig.promptSharing?.messaging?.find((target) => target.id === 'whatsapp')?.baseUrl ?? 'https://wa.me/'
const whatsappUrl = (value) => `${whatsappBase}?text=${encodeURIComponent(value)}`

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
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(favoritesKey) ?? '[]')
      return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : [])
    } catch {
      return new Set()
    }
  })
  const [copiedKey, setCopiedKey] = useState('')
  const [notice, setNotice] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  const [previewPlatform, setPreviewPlatform] = useState('instagram')
  const [livePreviewOpen, setLivePreviewOpen] = useState(true)
  const [decorateOpen, setDecorateOpen] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(true)

  const copiedTimer = useRef(0)
  const inputRef = useRef(null)

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

  const results = useMemo(() => {
    const preview = text || 'hello'
    return textStyles
      .filter((style) => {
        if (view === 'all') return true
        const cats = STYLE_CATEGORIES_MAP[style.id]
        if (cats) {
          return cats.includes(view)
        }
        return style.category === view
      })
      .map((style) => ({
        id: style.id,
        name: style.name,
        category: style.category,
        output: style.transform(preview),
      }))
  }, [text, view])

  const featuredOutput = useMemo(() => {
    const pick = results.find((r) => r.id === 'bold-italic') || results[0]
    return pick ? pick.output : (text || 'hello')
  }, [results, text])

  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation()
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(favoritesKey, JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  const markCopied = (key, label, failed) => {
    window.clearTimeout(copiedTimer.current)
    setCopiedKey(failed ? '' : key)
    setNotice(failed ? `${label} could not be copied.` : `${label} copied to clipboard!`)
    copiedTimer.current = window.setTimeout(() => {
      setCopiedKey('')
      setNotice('')
    }, 2000)
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

  const handleCopyAll = () => {
    if (!results.length) return
    const allText = results.map((r) => r.output).join('\n')
    void copy('all', 'All styles', allText)
  }

  const handleShare = async () => {
    const shareText = featuredOutput || text || 'hello'
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fancy Font Generator',
          text: shareText,
          url: window.location.href,
        })
        return
      } catch {}
    }
    window.open(whatsappUrl(shareText), '_blank', 'noopener,noreferrer')
  }

  const applyDecoration = (type) => {
    const current = text.trim() || 'hello'
    if (type === 'symbol') {
      setText(`★ ${current} ★`)
    } else if (type === 'emoji') {
      setText(`✨ ${current} ✨`)
    } else if (type === 'case') {
      if (current === current.toUpperCase()) {
        setText(current.toLowerCase())
      } else {
        setText(current.toUpperCase())
      }
    }
  }

  const sourceText = text || 'hello'

  return (
    <div className="emoji-text-wrapper">
      {/* 1. Header Hero Banner with 3D elements & Turquoise Waves */}
      <header className="ff-hero-banner">
        <div className="ff-hero-inner">
          {/* Left 3D Card: Aa with yellow sparkle */}
          <div className="ff-hero-card ff-hero-card-left" aria-hidden="true">
            <div className="ff-3d-box">
              <span className="ff-3d-text-blue">Aa</span>
            </div>
            <span className="ff-sparkle-gold">✦</span>
          </div>

          {/* Center Titles & Social Platform Badges */}
          <div className="ff-hero-center">
            <h1 className="ff-hero-title">
              Fancy Font Generator
              <svg className="ff-crown-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                <path d="M2 5l4 14h12l4-14-6 7-4-7-4 7-6-7z" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
              </svg>
            </h1>
            <p className="ff-hero-sub">
              Create stylish fonts & cool text for your bios, posts, usernames and social profiles.
            </p>

            {/* Social Platform Badges Row */}
            <div className="ff-social-pills">
              <button
                type="button"
                className="ff-social-pill ff-pill-ig"
                title="Instagram Fonts"
                onClick={() => setPreviewPlatform('instagram')}
                aria-label="Instagram preview"
              >
                <InstagramIcon size={16} />
              </button>
              <button
                type="button"
                className="ff-social-pill ff-pill-wa"
                title="WhatsApp Fonts"
                onClick={() => setPreviewPlatform('whatsapp')}
                aria-label="WhatsApp preview"
              >
                <WhatsAppIcon size={16} />
              </button>
              <button
                type="button"
                className="ff-social-pill ff-pill-fb"
                title="Facebook Fonts"
                onClick={() => setPreviewPlatform('facebook')}
                aria-label="Facebook preview"
              >
                <FacebookIcon size={16} />
              </button>
              <button
                type="button"
                className="ff-social-pill ff-pill-yt"
                title="YouTube Fonts"
                onClick={() => setPreviewPlatform('youtube')}
                aria-label="YouTube preview"
              >
                <YoutubeIcon size={16} />
              </button>
              <button
                type="button"
                className="ff-social-pill ff-pill-x"
                title="X Fonts"
                aria-label="X preview"
              >
                <XSocialIcon size={14} />
              </button>
              <button
                type="button"
                className="ff-social-pill ff-pill-tg"
                title="Telegram Fonts"
                aria-label="Telegram preview"
              >
                <TelegramIcon size={16} />
              </button>
              <span className="ff-social-pill ff-pill-more">+ More</span>
            </div>
          </div>

          {/* Right 3D Card: Aa with blue star & 3D pencil */}
          <div className="ff-hero-card ff-hero-card-right" aria-hidden="true">
            <div className="ff-3d-box ff-3d-box-purple">
              <span className="ff-3d-text-purple">Aa</span>
            </div>
            <span className="ff-star-blue">✦</span>
            <div className="ff-3d-pencil">✏️</div>
          </div>
        </div>
      </header>

      {/* 2. Main 2-Column Responsive Workspace */}
      <main className="ff-workspace">
        {/* Left Column: Main Generator Panel */}
        <section className="ff-generator-panel" aria-label="Font Generator">
          {/* Header Row: ✏️ Your Text and 5/280 */}
          <div className="ff-panel-header">
            <div className="ff-panel-title">
              <span className="ff-pencil-emoji" aria-hidden="true">✏️</span>
              <h2>Your Text</h2>
            </div>
            <span className="ff-char-count">{text.length}/{maxLength}</span>
          </div>

          {/* Input Box */}
          <div className="ff-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={text}
              maxLength={maxLength}
              onChange={(e) => setText(e.target.value)}
              placeholder="hello"
              className="ff-main-input"
              aria-label="Text to generate stylish fonts"
            />
            {text ? (
              <button
                type="button"
                className="ff-input-clear-btn"
                onClick={() => {
                  setText('')
                  inputRef.current?.focus()
                }}
                aria-label="Clear text input"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>

          {/* Quick Actions Row */}
          <div className="ff-actions-row">
            <button
              type="button"
              className="ff-btn-primary"
              onClick={() => {
                if (!text) setText('hello')
                inputRef.current?.focus()
              }}
            >
              <Sparkles size={16} /> Generate Styles
            </button>

            <button
              type="button"
              className="ff-btn-outline"
              onClick={() => {
                setText('')
                inputRef.current?.focus()
              }}
            >
              <Trash2 size={14} /> Clear
            </button>

            <button
              type="button"
              className="ff-btn-outline"
              onClick={handleRandomText}
            >
              <Shuffle size={14} /> Random Text
            </button>

            <button
              type="button"
              className="ff-btn-outline"
              onClick={() => setText('ImgMojo Fancy')}
            >
              <FileText size={14} /> Sample Text
            </button>

            <button
              type="button"
              className="ff-btn-outline"
              onClick={handleCopyAll}
            >
              <Copy size={14} /> Copy All
            </button>

            <button
              type="button"
              className="ff-btn-outline"
              onClick={handleShare}
            >
              <Share2 size={14} /> Share ⨠
            </button>
          </div>

          {/* Category Filter Pills Row */}
          <div className="ff-categories-bar" role="tablist" aria-label="Font categories">
            {CATEGORIES.map((cat) => {
              const isActive = view === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`ff-category-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => setView(cat.id)}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* 3-Column Font Cards Grid */}
          {results.length > 0 ? (
            <div className="ff-cards-grid">
              {results.map((style) => {
                const isCopied = copiedKey === style.id
                const isFavorited = favorites.has(style.id)
                return (
                  <article
                    key={style.id}
                    className={`ff-card ${isCopied ? 'is-copied' : ''}`}
                    onClick={() => copy(style.id, style.name, style.output)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${style.name} style`}
                    title="Click to copy"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        copy(style.id, style.name, style.output)
                      }
                    }}
                  >
                    <div className="ff-card-body">
                      <span className="ff-card-text">{style.output}</span>
                    </div>

                    <div className="ff-card-foot" onClick={(e) => e.stopPropagation()}>
                      <span className="ff-card-tag">{style.name}</span>

                      <div className="ff-card-actions">
                        <button
                          type="button"
                          className={`ff-card-icon-btn ff-card-heart ${isFavorited ? 'is-fav' : ''}`}
                          onClick={(e) => toggleFavorite(style.id, e)}
                          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                          aria-label="Favorite style"
                        >
                          <Heart
                            size={15}
                            fill={isFavorited ? '#ef4444' : 'none'}
                            color={isFavorited ? '#ef4444' : 'currentColor'}
                          />
                        </button>

                        <a
                          href={whatsappUrl(style.output)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ff-card-icon-btn ff-card-wa"
                          title="Share on WhatsApp"
                          aria-label={`Share ${style.name} on WhatsApp`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WhatsAppIcon size={15} />
                        </a>

                        <button
                          type="button"
                          className={`ff-card-icon-btn ff-card-copy ${isCopied ? 'is-copied' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            copy(style.id, style.name, style.output)
                          }}
                          title={isCopied ? 'Copied!' : 'Copy'}
                          aria-label={isCopied ? 'Copied' : 'Copy'}
                        >
                          {isCopied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="ff-empty-state">
              <Smile size={36} />
              <h3>No fonts found</h3>
              <p>Please select 'All' category or try typing different words.</p>
              <button
                type="button"
                className="ff-empty-reset-btn"
                onClick={() => {
                  setView('all')
                  setText('hello')
                }}
              >
                Reset
              </button>
            </div>
          )}
        </section>

        {/* Right Column: Sidebar Widgets */}
        <aside className="ff-sidebar" aria-label="Tools and Previews">
          {/* Widget 1: Live Preview */}
          <div className="ff-widget-card">
            <button
              type="button"
              className="ff-widget-head"
              onClick={() => setLivePreviewOpen(!livePreviewOpen)}
              aria-expanded={livePreviewOpen}
            >
              <div className="ff-widget-title">
                <Eye size={18} className="ff-icon-cyan" />
                <h3>Live Preview</h3>
              </div>
              <ChevronDown size={18} className={`ff-widget-chevron ${livePreviewOpen ? 'is-open' : ''}`} />
            </button>

            {livePreviewOpen && (
              <div className="ff-widget-body">
                {/* Social Platform Tabs */}
                <div className="ff-preview-tabs">
                  <button
                    type="button"
                    className={`ff-preview-tab ${previewPlatform === 'instagram' ? 'is-active' : ''}`}
                    onClick={() => setPreviewPlatform('instagram')}
                  >
                    <InstagramIcon size={14} /> Instagram
                  </button>
                  <button
                    type="button"
                    className={`ff-preview-tab ${previewPlatform === 'whatsapp' ? 'is-active' : ''}`}
                    onClick={() => setPreviewPlatform('whatsapp')}
                  >
                    <WhatsAppIcon size={14} /> WhatsApp
                  </button>
                  <button
                    type="button"
                    className={`ff-preview-tab ${previewPlatform === 'facebook' ? 'is-active' : ''}`}
                    onClick={() => setPreviewPlatform('facebook')}
                  >
                    <FacebookIcon size={14} /> Facebook
                  </button>
                  <button
                    type="button"
                    className={`ff-preview-tab ${previewPlatform === 'youtube' ? 'is-active' : ''}`}
                    onClick={() => setPreviewPlatform('youtube')}
                  >
                    <YoutubeIcon size={14} /> YouTube
                  </button>
                </div>

                {/* Social Profile Mockup Box */}
                <div className="ff-mockup-box">
                  {previewPlatform === 'instagram' && (
                    <div className="ff-ig-mockup">
                      <div className="ff-ig-top">
                        <div className="ff-ig-avatar-ring">
                          <div className="ff-ig-avatar" />
                        </div>
                        <div className="ff-ig-stats">
                          <div className="ff-ig-stat"><strong>128</strong><span>Posts</span></div>
                          <div className="ff-ig-stat"><strong>10.5K</strong><span>Followers</span></div>
                          <div className="ff-ig-stat"><strong>256</strong><span>Following</span></div>
                        </div>
                      </div>
                      <div className="ff-ig-styled-text">{featuredOutput}</div>
                      <p className="ff-ig-sub">This is how your text will look on Instagram.</p>
                    </div>
                  )}

                  {previewPlatform === 'whatsapp' && (
                    <div className="ff-wa-mockup">
                      <div className="ff-wa-bubble">
                        <span className="ff-wa-text">{featuredOutput}</span>
                        <span className="ff-wa-time">10:45 AM <span className="ff-wa-ticks">✓✓</span></span>
                      </div>
                      <p className="ff-ig-sub">This is how your text will look on WhatsApp.</p>
                    </div>
                  )}

                  {previewPlatform === 'facebook' && (
                    <div className="ff-fb-mockup">
                      <div className="ff-fb-header">
                        <div className="ff-fb-avatar" />
                        <div>
                          <strong>Alex Morgan</strong>
                          <span className="ff-fb-time">Just now · 🌍</span>
                        </div>
                      </div>
                      <div className="ff-fb-text">{featuredOutput}</div>
                      <p className="ff-ig-sub">This is how your text will look on Facebook.</p>
                    </div>
                  )}

                  {previewPlatform === 'youtube' && (
                    <div className="ff-yt-mockup">
                      <div className="ff-yt-header">
                        <div className="ff-yt-avatar" />
                        <div>
                          <strong>@GamerVibe</strong>
                          <span className="ff-yt-time">2 hours ago</span>
                        </div>
                      </div>
                      <div className="ff-yt-text">{featuredOutput}</div>
                      <p className="ff-ig-sub">This is how your text will look on YouTube.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Widget 2: Decorate Your Text */}
          <div className="ff-widget-card">
            <button
              type="button"
              className="ff-widget-head"
              onClick={() => setDecorateOpen(!decorateOpen)}
              aria-expanded={decorateOpen}
            >
              <div className="ff-widget-title">
                <Sparkles size={18} className="ff-icon-cyan" />
                <h3>Decorate Your Text</h3>
              </div>
              <ChevronDown size={18} className={`ff-widget-chevron ${decorateOpen ? 'is-open' : ''}`} />
            </button>

            {decorateOpen && (
              <div className="ff-widget-body">
                <div className="ff-decorate-tabs">
                  <button
                    type="button"
                    className="ff-decorate-tab"
                    onClick={() => applyDecoration('symbol')}
                  >
                    ☆ Add Symbols
                  </button>
                  <button
                    type="button"
                    className="ff-decorate-tab"
                    onClick={() => applyDecoration('emoji')}
                  >
                    😊 Add Emojis
                  </button>
                  <button
                    type="button"
                    className="ff-decorate-tab"
                    onClick={() => applyDecoration('case')}
                  >
                    🔤 Text Case
                  </button>
                </div>

                <div className="ff-presets-row">
                  <button
                    type="button"
                    className="ff-preset-btn"
                    onClick={() => setText(`★ ${sourceText} ★`)}
                  >
                    ★ {sourceText} ★
                  </button>
                  <button
                    type="button"
                    className="ff-preset-btn"
                    onClick={() => setText(`♡ ${sourceText} ♡`)}
                  >
                    ♡ {sourceText} ♡
                  </button>
                  <button
                    type="button"
                    className="ff-preset-btn"
                    onClick={() => setText(`꧁ ${sourceText} ꧂`)}
                  >
                    ꧁ {sourceText} ꧂
                  </button>
                  <button
                    type="button"
                    className="ff-preset-btn"
                    onClick={() => setText(`⁂ ${sourceText} ⁂`)}
                  >
                    ⁂ {sourceText} ⁂
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Widget 3: Useful Tools */}
          <div className="ff-widget-card">
            <button
              type="button"
              className="ff-widget-head"
              onClick={() => setToolsOpen(!toolsOpen)}
              aria-expanded={toolsOpen}
            >
              <div className="ff-widget-title">
                <Layers size={18} className="ff-icon-cyan" />
                <h3>Useful Tools</h3>
              </div>
              <ChevronDown size={18} className={`ff-widget-chevron ${toolsOpen ? 'is-open' : ''}`} />
            </button>

            {toolsOpen && (
              <div className="ff-widget-body">
                <div className="ff-tools-grid">
                  <button
                    type="button"
                    className="ff-tool-item"
                    onClick={() => setText('⚡Shadow_Hunter⚡')}
                  >
                    <div className="ff-tool-icon-wrap ff-tool-blue">
                      <User size={16} />
                    </div>
                    <div className="ff-tool-info">
                      <strong>Stylish Name</strong>
                      <span>Generator</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="ff-tool-item"
                    onClick={() => setText('✨ Dreamer | Creating Vibes 🚀')}
                  >
                    <div className="ff-tool-icon-wrap ff-tool-purple">
                      <PenTool size={16} />
                    </div>
                    <div className="ff-tool-info">
                      <strong>Bio Generator</strong>
                      <span>(Instagram, Gaming)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="ff-tool-item"
                    onClick={() => setView('shapes')}
                  >
                    <div className="ff-tool-icon-wrap ff-tool-orange">
                      <Star size={16} />
                    </div>
                    <div className="ff-tool-info">
                      <strong>Symbol Library</strong>
                      <span>(★ ♡ 𓆩 ...)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="ff-tool-item"
                    onClick={() => {
                      if (text === text.toUpperCase()) setText(text.toLowerCase())
                      else setText(text.toUpperCase())
                    }}
                  >
                    <div className="ff-tool-icon-wrap ff-tool-cyan">
                      <Type size={16} />
                    </div>
                    <div className="ff-tool-info">
                      <strong>Text Case Converter</strong>
                      <span>(UPPER, lower, Title)</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Floating Copied Toast */}
      {notice && (
        <div className="et-floating-toast" role="status">
          <Check size={16} />
          <span>{notice}</span>
        </div>
      )}

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
