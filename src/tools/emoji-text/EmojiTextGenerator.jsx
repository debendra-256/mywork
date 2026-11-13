import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Copy,
  Smile,
  X,
} from 'lucide-react'
import { appConfig } from '../../config/app.config'
import { textStyles } from './text-styles'
import './EmojiTextGenerator.css'

export const HINDI_CATEGORIES = [
  { id: 'all', label: 'सभी' },
  { id: 'bold', label: 'बोल्ड' },
  { id: 'cursive', label: 'कर्सिव' },
  { id: 'shapes', label: 'आकार' },
  { id: 'effects', label: 'इफेक्ट्स' },
  { id: 'glitch', label: 'ग्लिच' },
  { id: 'small', label: 'छोटा' },
  { id: 'fancy', label: 'फैंसी' },
  { id: 'decorative', label: 'सजावटी' },
  { id: 'calligraphy', label: 'सुलेख' },
]

export const HINDI_STYLE_META = {
  'bold': { hindi: 'बोल्ड', categories: ['bold'] },
  'bold-italic': { hindi: 'बोल्ड इटैलिक', categories: ['bold', 'cursive'] },
  'sans-bold': { hindi: 'सैन्स बोल्ड', categories: ['bold', 'shapes'] },
  'sans-bold-italic': { hindi: 'सैन्स बोल्ड इटैलिक', categories: ['bold', 'cursive'] },
  'script-bold': { hindi: 'बोल्ड स्क्रिप्ट', categories: ['bold', 'cursive', 'calligraphy'] },
  'italic': { hindi: 'इटैलिक', categories: ['cursive'] },
  'script': { hindi: 'स्क्रिप्ट', categories: ['cursive', 'calligraphy'] },
  'sans': { hindi: 'सैन्स', categories: ['shapes'] },
  'sans-italic': { hindi: 'सैन्स इटैलिक', categories: ['cursive', 'shapes'] },
  'fraktur': { hindi: 'फ़्रैक्चर', categories: ['fancy', 'calligraphy'] },
  'fraktur-bold': { hindi: 'बोल्ड फ़्रैक्चर', categories: ['bold', 'fancy', 'calligraphy'] },
  'double-struck': { hindi: 'डबल स्ट्रक', categories: ['shapes', 'fancy'] },
  'monospace': { hindi: 'मोनोस्पेस', categories: ['shapes'] },
  'small-caps': { hindi: 'स्मॉल कैप्स', categories: ['shapes', 'small'] },
  'circled': { hindi: 'सर्कल्ड', categories: ['shapes', 'decorative'] },
  'parenthesized': { hindi: 'कोष्ठक', categories: ['shapes'] },
  'superscript': { hindi: 'सुपरस्क्रिप्ट', categories: ['small'] },
  'subscript': { hindi: 'सबस्क्रिप्ट', categories: ['small'] },
  'fullwidth': { hindi: 'फुलविड्थ', categories: ['shapes'] },
  'flip': { hindi: 'उल्टा', categories: ['effects'] },
  'underline': { hindi: 'अंडरलाइन', categories: ['effects'] },
  'double-underline': { hindi: 'डबल अंडरलाइन', categories: ['effects'] },
  'wavy-underline': { hindi: 'वेवी लाइन', categories: ['effects'] },
  'strikethrough': { hindi: 'स्ट्राइकथ्रू', categories: ['effects'] },
  'overline': { hindi: 'ओवरलाइन', categories: ['effects'] },
  'slashed': { hindi: 'स्लैश', categories: ['effects'] },
  'dotted': { hindi: 'डॉटेड', categories: ['effects'] },
  'glitch-light': { hindi: 'हल्का ग्लिच', categories: ['glitch'] },
  'glitch-heavy': { hindi: 'ग्लिच हेवी', categories: ['glitch'] },
  'corrupt': { hindi: 'करप्ट Zalgo', categories: ['glitch'] },
  'wings': { hindi: 'विंग्स', categories: ['decorative'] },
  'heart-line': { hindi: 'हार्ट बीट', categories: ['decorative'] },
  'kawaii': { hindi: 'कवाई', categories: ['decorative'] },
  'star-string': { hindi: 'स्टार स्ट्रिंग', categories: ['decorative'] },
  'flower-chain': { hindi: 'फ्लावर चेन', categories: ['decorative'] },
  'lightning': { hindi: 'लाइटनिंग', categories: ['decorative'] },
  'red-heart': { hindi: 'रेड हार्ट', categories: ['decorative'] },
  'star-glow': { hindi: 'ग्लोइंग स्टार्स', categories: ['decorative'] },
  'fire': { hindi: 'फायर', categories: ['decorative'] },
  'crown': { hindi: 'क्राउन', categories: ['decorative'] },
  'celebrate': { hindi: 'सेलिब्रेशन', categories: ['decorative'] },
  'love-you': { hindi: 'लव यू', categories: ['decorative'] },
  'party-sparkle': { hindi: 'स्पार्कल', categories: ['decorative'] },
  'gaming-life': { hindi: 'गेमर', categories: ['decorative'] },
  'blackletter': { hindi: 'ब्लैकलेटर', categories: ['fancy', 'calligraphy'] },
  'gothic-cross': { hindi: 'क्रूसेडर', categories: ['fancy', 'calligraphy'] },
  'runic': { hindi: 'रूनिक', categories: ['fancy'] },
  'greek': { hindi: 'ग्रीक', categories: ['fancy'] },
  'cyrillic': { hindi: 'स्लाविक', categories: ['fancy'] },
  'cherokee': { hindi: 'चेरोकी', categories: ['fancy'] },
  'vaporwave': { hindi: 'वेपरवेव', categories: ['decorative'] },
  'aesthetic-star': { hindi: 'स्टार डस्ट', categories: ['decorative'] },
  'aesthetic-moon': { hindi: 'नाइट ब्लूम', categories: ['decorative'] },
  'aesthetic-cloud': { hindi: 'क्लाउड नाइन', categories: ['decorative'] },
  'sniper': { hindi: 'स्नाइपर', categories: ['decorative'] },
  'clan-tag': { hindi: 'क्लैन टैग', categories: ['bold', 'shapes'] },
  'symbol-arrows': { hindi: 'एरो', categories: ['decorative'] },
  'symbol-triangles': { hindi: 'ट्रायंगल', categories: ['decorative'] },
  'symbol-moon': { hindi: 'हाफ मून', categories: ['decorative'] },
  'corner': { hindi: 'कॉर्नर ब्रैकेट्स', categories: ['shapes'] },
  'lenticular': { hindi: 'ब्लॉक ब्रैकेट्स', categories: ['shapes'] },
  'box-lines': { hindi: 'बॉक्स लाइन्स', categories: ['shapes'] },
  'spaced': { hindi: 'एयर स्पेसिंग', categories: ['effects'] },
  'dot-between': { hindi: 'डॉट बिटवीन', categories: ['effects'] },
  'slash-wrap': { hindi: 'स्लैश रैप', categories: ['effects'] },
  'bar-wrap': { hindi: 'साइडबार', categories: ['effects'] },
  'dash-around': { hindi: 'लॉन्ग डैश', categories: ['effects'] },
  'snake-case': { hindi: 'स्नेक केस', categories: ['effects'] },
  'pink-heart': { hindi: 'पिंक हार्ट', categories: ['decorative'] },
  'soft-point': { hindi: 'सॉफ्ट पॉइंट', categories: ['decorative'] },
  'bow': { hindi: 'रिबन बो', categories: ['decorative'] },
  'music-note': { hindi: 'म्यूजिक नोट्स', categories: ['decorative'] },
  'soft-wave': { hindi: 'सॉफ्ट वेव', categories: ['decorative'] },
  'aesthetic-halo': { hindi: 'हेलो', categories: ['decorative'] },
  'aesthetic-wave': { hindi: 'स्लो वेव', categories: ['decorative'] },
  'aesthetic-quote': { hindi: 'सॉफ्ट कोट', categories: ['calligraphy', 'decorative'] },
  'aesthetic-floral': { hindi: 'प्रेस्ड फ्लावर', categories: ['decorative'] },
  'aesthetic-blossom': { hindi: 'ब्लॉसम ट्रेल', categories: ['decorative'] },
  'aesthetic-orbit': { hindi: 'ऑर्बिट', categories: ['decorative'] },
  'gothic-dagger': { hindi: 'डैगर रो', categories: ['fancy'] },
  'gothic-altar': { hindi: 'अल्टार', categories: ['fancy'] },
  'gothic-skull': { hindi: 'स्कल एंड बोन्स', categories: ['decorative'] },
  'gothic-ankh': { hindi: 'अंख', categories: ['decorative'] },
  'gothic-fleur': { hindi: 'फ्लेउर-डी-लिस', categories: ['decorative'] },
  'gothic-spade': { hindi: 'स्पेड कोर्ट', categories: ['decorative'] },
  'double-angle': { hindi: 'डबल एंगल', categories: ['shapes'] },
  'angle': { hindi: 'एंगल ब्रैकेट्स', categories: ['shapes'] },
  'symbol-asterisk': { hindi: 'एस्टरिक्स फ्लेयर', categories: ['decorative'] },
  'symbol-diamond': { hindi: 'डायमंड डॉट', categories: ['decorative'] },
  'symbol-music': { hindi: 'म्यूजिक स्कोर', categories: ['decorative'] },
  'symbol-braille': { hindi: 'ब्रेल फ्रेम', categories: ['decorative'] },
  'diamond-set': { hindi: 'डायमंड्स', categories: ['decorative'] },
  'snowfall': { hindi: 'स्नोफॉल', categories: ['decorative'] },
  'rose-drop': { hindi: 'रोज', categories: ['decorative'] },
  'spectrum': { hindi: 'स्पेक्ट्रम बार्स', categories: ['decorative'] },
  'crossed-out': { hindi: 'डिनाइड', categories: ['effects'] },
  'neon-grid': { hindi: 'नियोन ग्रिड', categories: ['shapes'] },
  'toxic': { hindi: 'टॉक्सिक', categories: ['decorative'] },
  'rule-around': { hindi: 'फाइन रूल', categories: ['effects'] },
  'lowercase': { hindi: 'ऑल लोअरकेस', categories: ['effects'] },
}

const maxLength = 280

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
  const [copiedKey, setCopiedKey] = useState('')
  const [notice, setNotice] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
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
        const meta = HINDI_STYLE_META[style.id]
        if (meta && meta.categories) {
          return meta.categories.includes(view)
        }
        return style.category === view
      })
      .map((style) => {
        const meta = HINDI_STYLE_META[style.id] || { hindi: style.name, categories: [style.category] }
        return {
          id: style.id,
          name: style.name,
          hindi: meta.hindi || style.name,
          category: style.category,
          output: style.transform(preview),
        }
      })
  }, [text, view])

  const markCopied = (key, label, failed) => {
    window.clearTimeout(copiedTimer.current)
    setCopiedKey(failed ? '' : key)
    setNotice(failed ? `${label} could not be copied.` : `${label} कॉपी हो गया!`)
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

  return (
    <div className="emoji-text-wrapper">
      <div className="et-modern-container">
        {/* Search / Text Input Bar */}
        <div className="et-search-section">
          <div className="et-search-box">
            <input
              ref={inputRef}
              type="text"
              value={text}
              maxLength={maxLength}
              onChange={(e) => setText(e.target.value)}
              placeholder="hello"
              className="et-search-input"
              aria-label="Enter text to convert"
            />
            {text ? (
              <button
                type="button"
                className="et-search-clear-btn"
                onClick={() => {
                  setText('')
                  inputRef.current?.focus()
                }}
                aria-label="Clear text"
              >
                <X size={20} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Category Filter Pills Row */}
        <div className="et-categories-section">
          <div className="et-categories-row" role="tablist" aria-label="Font categories">
            {HINDI_CATEGORIES.map((cat) => {
              const isActive = view === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`et-category-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => setView(cat.id)}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3-Column Font Cards Grid */}
        <section className="et-cards-section" aria-label="Generated font styles">
          {results.length > 0 ? (
            <div className="et-cards-grid">
              {results.map((style) => {
                const isCopied = copiedKey === style.id
                return (
                  <article
                    key={style.id}
                    className={`et-card ${isCopied ? 'is-copied' : ''}`}
                    onClick={() => copy(style.id, style.hindi, style.output)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${style.hindi} style`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        copy(style.id, style.hindi, style.output)
                      }
                    }}
                    title="Click to copy"
                  >
                    <div className="et-card-body">
                      <div className="et-card-text">{style.output}</div>
                    </div>

                    <div className="et-card-footer" onClick={(e) => e.stopPropagation()}>
                      <span className="et-card-tag">{style.hindi}</span>

                      <div className="et-card-actions">
                        <a
                          href={whatsappUrl(style.output)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="et-card-action-btn et-card-wa"
                          title="Share on WhatsApp"
                          aria-label={`Share ${style.hindi} on WhatsApp`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WhatsAppIcon size={15} />
                        </a>

                        <button
                          type="button"
                          className={`et-card-action-btn et-card-copy ${isCopied ? 'is-copied' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            copy(style.id, style.hindi, style.output)
                          }}
                          title={isCopied ? 'Copied!' : 'Copy'}
                          aria-label={isCopied ? 'Copied' : 'Copy'}
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="et-empty-state">
              <Smile size={36} />
              <h3>कोई फ़ॉन्ट नहीं मिला</h3>
              <p>कृपया 'सभी' श्रेणी चुनें या कोई अन्य शब्द टाइप करें।</p>
              <button
                type="button"
                className="et-empty-reset-btn"
                onClick={() => {
                  setView('all')
                  setText('hello')
                }}
              >
                रीसेट करें
              </button>
            </div>
          )}
        </section>

        {/* Floating Copied Toast */}
        {notice && (
          <div className="et-floating-toast" role="status">
            <Check size={16} />
            <span>{notice}</span>
          </div>
        )}
      </div>

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
