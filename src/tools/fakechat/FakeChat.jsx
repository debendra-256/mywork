import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCheck,
  ChevronDown,
  Download,
  Eye,
  HelpCircle,
  ImagePlus,
  MessageCircle,
  MessageSquare,
  MessageSquareMore,
  MessageSquareText,
  Moon,
  Palette,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { STATUS_OPTIONS, STYLE_OPTIONS, drawChat, formatChatTime } from './render'
import { EMOJI_GROUPS } from './emoji'
import './FakeChat.css'

const imageCache = new Map()

function loadImage(src) {
  if (!src) return Promise.resolve(null)
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => resolve(null)
        image.src = src
      })
    )
  }
  return imageCache.get(src)
}

function fileToDataUrl(file, max) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file.'))
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error('Choose an image under 12 MB.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Could not read that image.'))
      image.onload = () => {
        const scale = Math.min(1, max / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

let messageSequence = 0
function messageId() {
  messageSequence += 1
  return `m${Date.now().toString(36)}${messageSequence}`
}

const defaultContact = () => ({
  name: 'Maya',
  lastSeen: 'last seen today at 9:45 AM',
  avatar: '',
})

const defaultMessages = () => [
  {
    id: 'm1',
    side: 'them',
    text: 'Hey! Did you try the new ImgMojo editor?',
    time: '9:41 AM',
    status: 'read',
    image: '',
  },
  {
    id: 'm2',
    side: 'me',
    text: 'Just did. The poster and QR tools are so quick.',
    time: '9:42 AM',
    status: 'read',
    image: '',
  },
  {
    id: 'm3',
    side: 'them',
    text: 'Send me the link, I want to try the fake chat maker 👀',
    time: '9:43 AM',
    status: 'read',
    image: '',
  },
  {
    id: 'm4',
    side: 'me',
    text: 'imgmojo.com/fakechat — pick WhatsApp or Messenger, then download the PNG.',
    time: '9:44 AM',
    status: 'read',
    image: '',
  },
  {
    id: 'm5',
    side: 'them',
    text: 'This is going to be fun 😄',
    time: '9:45 AM',
    status: 'read',
    image: '',
  },
]

function initials(name) {
  return String(name ?? '').trim().slice(0, 1).toUpperCase() || '?'
}

function EmojiPanel({ group, onGroup, onPick }) {
  const active = EMOJI_GROUPS.find((entry) => entry.id === group) ?? EMOJI_GROUPS[0]
  return (
    <div className="fakechat-emoji" role="dialog" aria-label="Choose an emoji">
      <div className="fakechat-emoji-tabs" role="tablist" aria-label="Emoji categories">
        {EMOJI_GROUPS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            title={entry.label}
            aria-selected={entry.id === active.id}
            className={entry.id === active.id ? 'is-active' : ''}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onGroup(entry.id)}
          >
            <span aria-hidden="true">{entry.emojis[0]}</span>
            <span className="fakechat-sr-only">{entry.label}</span>
          </button>
        ))}
      </div>
      <div className="fakechat-emoji-grid">
        {active.emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`Insert ${emoji}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

// Authentic brand icons for chat platforms
function PlatformIcon({ id, isActive = false }) {
  if (id === 'whatsapp') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* WhatsApp speech bubble */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.58 3.38 17.07L2.1 21.74C2.01 22.06 2.3 22.34 2.62 22.25L7.33 20.93C8.75 21.7 10.33 22.14 12 22.14C17.52 22.14 22 17.66 22 12.14C22 6.62 17.52 2 12 2Z"
          fill={isActive ? '#ffffff' : '#25D366'}
        />
        {/* Real phone receiver handset */}
        <path
          d="M16.92 14.38C16.63 14.23 15.22 13.54 14.96 13.44C14.7 13.34 14.51 13.29 14.32 13.58C14.13 13.87 13.58 14.53 13.41 14.72C13.24 14.91 13.07 14.93 12.78 14.79C12.49 14.64 11.57 14.34 10.48 13.37C9.63 12.61 9.06 11.67 8.89 11.38C8.72 11.09 8.87 10.93 9.02 10.79C9.15 10.66 9.31 10.44 9.46 10.27C9.6 10.1 9.65 9.98 9.75 9.79C9.85 9.59 9.8 9.42 9.73 9.28C9.65 9.14 9.08 7.72 8.84 7.14C8.61 6.57 8.37 6.65 8.19 6.64C8.02 6.63 7.83 6.63 7.64 6.63C7.45 6.63 7.15 6.7 6.89 6.99C6.63 7.28 5.89 7.97 5.89 9.38C5.89 10.79 6.92 12.15 7.06 12.34C7.2 12.53 9.1 15.44 11.99 16.69C12.68 16.99 13.22 17.17 13.63 17.3C14.33 17.52 14.96 17.49 15.46 17.42C16.02 17.34 17.18 16.72 17.42 16.05C17.66 15.38 17.66 14.81 17.59 14.67C17.52 14.53 17.33 14.45 17.04 14.31L16.92 14.38Z"
          fill={isActive ? '#25D366' : '#ffffff'}
        />
      </svg>
    )
  }
  if (id === 'telegram') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill={isActive ? '#ffffff' : '#2AABEE'} />
        <path
          d="M7.4 11.8L15.3 8.6C15.9 8.3 16.5 8.8 16.3 9.4L14.7 17C14.5 17.6 13.8 17.8 13.4 17.4L11.2 15.2L10.2 16.2C10 16.4 9.7 16.3 9.7 16V13.8L14.6 9.4C14.8 9.2 14.6 8.9 14.3 9.1L8.3 12.9L7.4 11.8Z"
          fill={isActive ? '#2AABEE' : '#ffffff'}
        />
      </svg>
    )
  }
  if (id === 'messenger') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M12 2C6.48 2 2 6.14 2 11.26C2 14.17 3.45 16.78 5.73 18.45V22L9.15 20.13C10.05 20.38 11.01 20.52 12 20.52C17.52 20.52 22 16.38 22 11.26C22 6.14 17.52 2 12 2Z"
          fill={isActive ? '#ffffff' : '#0084FF'}
        />
        <path
          d="M13.08 14.46L10.47 11.67L5.37 14.46L10.98 8.51L13.66 11.3L18.69 8.51L13.08 14.46Z"
          fill={isActive ? '#0084FF' : '#ffffff'}
        />
      </svg>
    )
  }
  if (id === 'instagram') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke={isActive ? '#ffffff' : '#E1306C'} strokeWidth="2.2" />
        <circle cx="12" cy="12" r="4.2" stroke={isActive ? '#ffffff' : '#E1306C'} strokeWidth="2.2" />
        <circle cx="17.2" cy="6.8" r="1.3" fill={isActive ? '#ffffff' : '#E1306C'} />
      </svg>
    )
  }
  if (id === 'imessage') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M12 3C6.75 3 2.5 6.78 2.5 11.45C2.5 14.07 3.82 16.4 5.92 17.93C5.65 19.34 4.8 20.73 4.77 20.77C4.6 21.05 4.86 21.37 5.16 21.25C6.91 20.57 8.35 19.5 9.09 18.91C10.02 19.29 11 19.5 12 19.5C17.25 19.5 21.5 15.72 21.5 11.05C21.5 6.38 17.25 3 12 3Z"
          fill={isActive ? '#ffffff' : '#34C759'}
        />
        <circle cx="7.8" cy="11.5" r="1.2" fill={isActive ? '#34C759' : '#ffffff'} />
        <circle cx="12" cy="11.5" r="1.2" fill={isActive ? '#34C759' : '#ffffff'} />
        <circle cx="16.2" cy="11.5" r="1.2" fill={isActive ? '#34C759' : '#ffffff'} />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#ffffff' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export default function FakeChat() {
  const [style, setStyle] = useState('whatsapp')
  const [themeMode, setThemeMode] = useState('light') // 'light' | 'dark' | 'auto'
  const [dark, setDark] = useState(false)
  const [showDateLabel, setShowDateLabel] = useState(true)
  const [dateLabel, setDateLabel] = useState('Today')
  const [contact, setContact] = useState(defaultContact)
  const [messages, setMessages] = useState(defaultMessages)
  const [editingId, setEditingId] = useState(null)
  const [exportWidth, setExportWidth] = useState(1080)
  const [dims, setDims] = useState({ width: 0, height: 0 })
  const [draftText, setDraftText] = useState('')
  const [draftSide, setDraftSide] = useState('me')
  const [draftTime, setDraftTime] = useState(() => formatChatTime())
  const [draftImage, setDraftImage] = useState('')
  const [error, setError] = useState('')
  const [emojiPanel, setEmojiPanel] = useState(null)
  const [emojiGroup, setEmojiGroup] = useState(EMOJI_GROUPS[0].id)
  const [activeNav, setActiveNav] = useState('chat-setup')
  const [showComposer, setShowComposer] = useState(false)

  const canvasRef = useRef(null)
  const composerRef = useRef(null)
  const messageRefs = useRef(new Map())

  // Handle system dark mode when in 'auto' mode
  useEffect(() => {
    if (themeMode === 'light') {
      setDark(false)
      return
    }
    if (themeMode === 'dark') {
      setDark(true)
      return
    }
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(query.matches)
    const listener = (event) => setDark(event.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [themeMode])

  // SEO: Meta tags, title, OpenGraph, Canonical, and JSON-LD schema
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const previousTitle = document.title
    const seoTitle = 'Fake Chat Generator Online – Free Realistic Chat Maker | ImgMojo'
    const seoDescription =
      'Create realistic fake chat conversations online for free with ImgMojo Fake Chat Generator. Make WhatsApp, Messenger, Telegram, and iMessage chat screenshots for videos, memes, reels, and stories with custom contacts, timestamps, and images.'
    const seoKeywords =
      'fake chat generator, fake whatsapp chat, fake messenger chat, fake chat screenshot, fake conversation maker, fake text generator, fake chat for memes, fake chat video maker, ImgMojo'
    const canonicalUrl = window.location.href.split('#')[0]

    document.title = seoTitle

    const managedMeta = []
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`)
      const created = !element
      const prevContent = element ? element.getAttribute('content') : null
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attrName, attrValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
      managedMeta.push({ element, created, prevContent })
    }

    setMetaTag('name', 'description', seoDescription)
    setMetaTag('name', 'keywords', seoKeywords)
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large')
    setMetaTag('property', 'og:title', seoTitle)
    setMetaTag('property', 'og:description', seoDescription)
    setMetaTag('property', 'og:type', 'website')
    setMetaTag('property', 'og:url', canonicalUrl)
    setMetaTag('property', 'og:site_name', 'ImgMojo')
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', seoTitle)
    setMetaTag('name', 'twitter:description', seoDescription)

    let canonicalLink = document.head.querySelector('link[rel="canonical"]')
    const createdCanonical = !canonicalLink
    const prevCanonicalHref = canonicalLink ? canonicalLink.getAttribute('href') : null
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonicalUrl)

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'ImgMojo Fake Chat Generator',
          url: canonicalUrl,
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'All',
          description: seoDescription,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
        {
          '@type': 'HowTo',
          name: 'How to Create Fake Chat Conversations Online',
          description: 'Follow these 4 simple steps to customize and download a realistic fake chat screenshot.',
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Choose Chat Platform & Theme',
              text: 'Select your preferred chat style such as WhatsApp, Messenger, Telegram, or iMessage, and choose Light or Dark theme.',
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Set Contact Information',
              text: 'Enter the contact name, customize the last seen or status line, and upload a profile picture.',
            },
            {
              '@type': 'HowToStep',
              position: 3,
              name: 'Add Messages',
              text: 'Compose incoming and outgoing messages with custom times, read receipts, emojis, and media attachments.',
            },
            {
              '@type': 'HowToStep',
              position: 4,
              name: 'Download Realistic PNG Screenshot',
              text: 'Select your export resolution and download the crystal-clear PNG image instantly.',
            },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is ImgMojo Fake Chat Generator free to use?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, ImgMojo Fake Chat Generator is 100% free with no watermarks and no registration required.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does the downloaded fake chat screenshot include a watermark?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No, every screenshot downloaded from ImgMojo is completely free of watermarks.',
              },
            },
            {
              '@type': 'Question',
              name: 'Are my chats or uploaded photos saved on any server?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No, all rendering happens strictly in your browser using HTML5 Canvas. No messages or photos are uploaded to any server, guaranteeing 100% privacy.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I generate dark mode fake chats?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! You can toggle between Light and Dark themes, or select Auto to match your system preferences.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I add photos and emojis into fake messages?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, you can easily attach photos to any message and choose from a full set of emojis using our built-in emoji picker.',
              },
            },
          ],
        },
      ],
    }

    let scriptTag = document.head.querySelector('#fakechat-structured-data')
    if (!scriptTag) {
      scriptTag = document.createElement('script')
      scriptTag.id = 'fakechat-structured-data'
      scriptTag.type = 'application/ld+json'
      document.head.appendChild(scriptTag)
    }
    scriptTag.textContent = JSON.stringify(structuredData)

    return () => {
      document.title = previousTitle
      managedMeta.forEach(({ element, created, prevContent }) => {
        if (created) element.remove()
        else if (prevContent !== null) element.setAttribute('content', prevContent)
      })
      if (canonicalLink) {
        if (createdCanonical) canonicalLink.remove()
        else if (prevCanonicalHref !== null) canonicalLink.setAttribute('href', prevCanonicalHref)
      }
      scriptTag?.remove()
    }
  }, [])

  const imageSources = useMemo(() => {
    const sources = [contact.avatar, ...messages.map((message) => message.image)].filter(Boolean)
    return [...new Set(sources)]
  }, [contact.avatar, messages])

  // Redraw canvas whenever chat state changes
  useEffect(() => {
    let cancelled = false
    Promise.all(imageSources.map(async (src) => [src, await loadImage(src)])).then((entries) => {
      if (cancelled || !canvasRef.current) return
      const images = new Map(entries.filter(([, image]) => image))
      const effectiveDateLabel = showDateLabel ? dateLabel : ''
      const result = drawChat(
        canvasRef.current,
        { style, dark, contact, dateLabel: effectiveDateLabel, messages },
        images,
        exportWidth
      )
      setDims((current) =>
        current.width === result.width && current.height === result.height ? current : result
      )
    })
    return () => {
      cancelled = true
    }
  }, [style, dark, contact, showDateLabel, dateLabel, messages, exportWidth, imageSources])

  useEffect(() => {
    if (!emojiPanel) return
    const close = (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.fakechat-emoji') || target.closest('[data-emoji-toggle]')) return
      setEmojiPanel(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [emojiPanel])

  const updateContact = (patch) => setContact((current) => ({ ...current, ...patch }))
  const updateMessage = (id, patch) =>
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, ...patch } : message))
    )

  const toggleEmoji = (target) => setEmojiPanel((current) => (current === target ? null : target))

  const insertEmoji = (target, emoji) => {
    const field = target === 'composer' ? composerRef.current : messageRefs.current.get(target)
    if (!field) return
    field.focus()
    const start = field.selectionStart ?? field.value.length
    const end = field.selectionEnd ?? start
    field.setSelectionRange(start, end)
    let inserted = false
    try {
      inserted = document.execCommand('insertText', false, emoji)
    } catch {
      inserted = false
    }
    if (inserted) return
    const next = `${field.value.slice(0, start)}${emoji}${field.value.slice(end)}`
    if (target === 'composer') setDraftText(next)
    else updateMessage(target, { text: next })
    requestAnimationFrame(() => {
      field.focus()
      const caret = start + emoji.length
      field.setSelectionRange(caret, caret)
    })
  }

  const uploadAvatar = async (file) => {
    if (!file) return
    setError('')
    try {
      updateContact({ avatar: await fileToDataUrl(file, 320) })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not use that image.')
    }
  }

  const uploadDraftImage = async (file) => {
    if (!file) return
    setError('')
    try {
      setDraftImage(await fileToDataUrl(file, 1100))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not use that image.')
    }
  }

  const uploadMessageImage = async (id, file) => {
    if (!file) return
    setError('')
    try {
      updateMessage(id, { image: await fileToDataUrl(file, 1100) })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not use that image.')
    }
  }

  const addMessage = () => {
    const text = draftText.trim()
    if (!text && !draftImage) return
    const newId = messageId()
    setMessages((current) => [
      ...current,
      {
        id: newId,
        side: draftSide,
        text,
        time: draftTime.trim() || formatChatTime(),
        status: 'read',
        image: draftImage,
      },
    ])
    setDraftText('')
    setDraftImage('')
    setDraftTime(formatChatTime())
  }

  const handleAddButtonClick = () => {
    const newId = messageId()
    const lastSide = messages.length > 0 ? messages[messages.length - 1].side : 'them'
    const nextSide = lastSide === 'me' ? 'them' : 'me'
    setMessages((prev) => [
      ...prev,
      {
        id: newId,
        side: nextSide,
        text: 'New message',
        time: formatChatTime(),
        status: 'read',
        image: '',
      },
    ])
    setEditingId(newId)
  }

  const moveMessage = (index, direction) => {
    setMessages((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const removeMessage = (id) => {
    setMessages((current) => current.filter((message) => message.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `imgmojo-${style}-fakechat.png`
    link.click()
  }

  const reset = () => {
    if (!window.confirm('Reset this chat to the sample conversation?')) return
    setStyle('whatsapp')
    setThemeMode('light')
    setDark(false)
    setShowDateLabel(true)
    setContact(defaultContact())
    setDateLabel('Today')
    setMessages(defaultMessages())
    setEditingId(null)
    setDraftText('')
    setDraftImage('')
    setDraftTime(formatChatTime())
    setError('')
  }

  const scrollToSection = (id) => {
    setActiveNav(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const navItems = [
    { id: 'chat-setup', label: 'Chat Setup', icon: MessageSquareMore },
    { id: 'contact-details', label: 'Contact Details', icon: User },
    { id: 'messages', label: 'Messages', icon: MessageSquareText },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'export', label: 'Export', icon: Download },
  ]

  return (
    <div className="fakechat-wrapper">
      {/* ----------------- TOP HERO BANNER ----------------- */}
      <section className="fakechat-hero" aria-label="Tool Header">
        <div className="fakechat-hero-content">
          <div className="fakechat-hero-icon" aria-hidden="true" title="Mobile Messenger">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                fill="#ffffff"
                fillOpacity="0.22"
              />
              <circle cx="8.5" cy="11.5" r="1" fill="#ffffff" />
              <circle cx="12" cy="11.5" r="1" fill="#ffffff" />
              <circle cx="15.5" cy="11.5" r="1" fill="#ffffff" />
            </svg>
          </div>
          <div className="fakechat-hero-text">
            <h1>Fake Chat Generator</h1>
            <p>Create realistic fake chat conversations for videos, memes, or story templates.</p>
          </div>
        </div>

        {/* Real Mobile Messaging Illustration Graphic */}
        <div className="fakechat-hero-messaging-art" aria-hidden="true">
          <div className="fakechat-real-phone">
            <div className="fakechat-real-phone-header">
              <div className="fakechat-real-phone-avatar">M</div>
              <div>
                <div className="fakechat-real-phone-title">Maya</div>
                <div className="fakechat-real-phone-status">online</div>
              </div>
            </div>
            <div className="fakechat-real-bubble in">
              <span>Did you try the new editor? 👀</span>
              <span className="fakechat-real-time">9:41 AM</span>
            </div>
            <div className="fakechat-real-bubble out">
              <span>Just did, it's so quick! 🚀</span>
              <span className="fakechat-real-time">9:42 AM ✔✔</span>
            </div>
          </div>
          <div className="fakechat-floating-pill">
            <div className="fakechat-floating-avatar">A</div>
            <span>Send link now!</span>
            <span className="fakechat-floating-heart">❤️</span>
          </div>
        </div>
      </section>

      {/* ----------------- MOBILE NAVIGATION PILLS ----------------- */}
      <div className="fakechat-mobile-nav" role="tablist" aria-label="Mobile Sections">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeNav === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`fakechat-mobile-nav-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => scrollToSection(item.id)}
            >
              <Icon size={14} />
              {item.label}
            </button>
          )
        })}
      </div>

      {/* ----------------- 3-COLUMN MAIN LAYOUT ----------------- */}
      <div className="fakechat-layout">
        {/* COLUMN 1: LEFT NAVIGATION SIDEBAR */}
        <aside className="fakechat-sidebar-nav" aria-label="Editor Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`fakechat-nav-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => scrollToSection(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </aside>

        {/* COLUMN 2: CENTER EDITOR FORMS */}
        <main className="fakechat-center-column">
          {/* CARD 1: CHAT SETUP */}
          <section id="chat-setup" className="fakechat-card" aria-labelledby="chat-setup-heading">
            <div className="fakechat-card-head">
              <div className="fakechat-card-head-left">
                <div className="fakechat-card-icon">
                  <MessageSquareMore size={18} />
                </div>
                <div className="fakechat-card-titles">
                  <h2 id="chat-setup-heading">Chat Setup</h2>
                  <p>Configure your fake chat conversation</p>
                </div>
              </div>
            </div>

            {/* Platform Selection Row */}
            <div className="fakechat-platforms" role="radiogroup" aria-label="Chat Platform">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={style === option.id}
                  className={`fakechat-platform-pill ${option.id} ${style === option.id ? 'is-active' : ''}`}
                  onClick={() => setStyle(option.id)}
                >
                  <PlatformIcon id={option.id} isActive={style === option.id} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            {/* Theme & Date Controls */}
            <div className="fakechat-setup-grid">
              <div className="fakechat-field-group">
                <span className="fakechat-field-label">
                  <Sun size={14} />
                  Theme
                </span>
                <div className="fakechat-segmented-theme" role="radiogroup" aria-label="Theme mode">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={themeMode === 'light'}
                    className={`fakechat-theme-btn ${themeMode === 'light' ? 'is-active' : ''}`}
                    onClick={() => setThemeMode('light')}
                  >
                    <Sun size={14} /> Light
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={themeMode === 'dark'}
                    className={`fakechat-theme-btn ${themeMode === 'dark' ? 'is-active' : ''}`}
                    onClick={() => setThemeMode('dark')}
                  >
                    <Moon size={14} /> Dark
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={themeMode === 'auto'}
                    className={`fakechat-theme-btn ${themeMode === 'auto' ? 'is-active' : ''}`}
                    onClick={() => setThemeMode('auto')}
                  >
                    <Smartphone size={14} /> Auto
                  </button>
                </div>
              </div>

              <div className="fakechat-field-group">
                <span className="fakechat-field-label">
                  <Calendar size={14} />
                  Date Label
                </span>
                <div className="fakechat-date-controls">
                  <div className="fakechat-date-input-wrap">
                    <input
                      value={dateLabel}
                      maxLength={24}
                      onChange={(event) => setDateLabel(event.target.value)}
                      placeholder="Today"
                      disabled={!showDateLabel}
                    />
                  </div>
                  <label className={`fakechat-toggle-wrap ${showDateLabel ? 'is-on' : ''}`}>
                    <div
                      className="fakechat-toggle-switch"
                      onClick={() => setShowDateLabel((prev) => !prev)}
                    >
                      <span />
                    </div>
                    Show date label
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* CARD 2: CONTACT DETAILS */}
          <section
            id="contact-details"
            className="fakechat-card"
            aria-labelledby="contact-details-heading"
          >
            <div className="fakechat-card-head">
              <div className="fakechat-card-head-left">
                <div className="fakechat-card-icon">
                  <User size={18} />
                </div>
                <div className="fakechat-card-titles">
                  <h2 id="contact-details-heading">Contact Details</h2>
                </div>
              </div>
            </div>

            <div className="fakechat-contact-content">
              <div className="fakechat-contact-avatar">
                {contact.avatar ? <img src={contact.avatar} alt="Contact" /> : initials(contact.name)}
              </div>
              <label className="fakechat-upload-btn">
                <Upload size={14} />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    void uploadAvatar(event.currentTarget.files?.[0] ?? null)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
              {contact.avatar && (
                <button
                  type="button"
                  className="fakechat-remove-photo"
                  onClick={() => updateContact({ avatar: '' })}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="fakechat-contact-fields">
              <div className="fakechat-input-col">
                <label htmlFor="contact-name">Contact Name</label>
                <input
                  id="contact-name"
                  value={contact.name}
                  maxLength={40}
                  onChange={(event) => updateContact({ name: event.target.value })}
                  placeholder="Maya"
                />
              </div>
              <div className="fakechat-input-col">
                <label htmlFor="contact-status">Status Line</label>
                <input
                  id="contact-status"
                  value={contact.lastSeen}
                  maxLength={54}
                  onChange={(event) => updateContact({ lastSeen: event.target.value })}
                  placeholder="last seen today at 9:45 AM"
                />
              </div>
            </div>
          </section>

          {/* CARD 3: MESSAGES */}
          <section id="messages" className="fakechat-card" aria-labelledby="messages-heading">
            <div className="fakechat-card-head">
              <div className="fakechat-card-head-left">
                <div className="fakechat-card-icon">
                  <MessageSquareText size={18} />
                </div>
                <div className="fakechat-card-titles">
                  <h2 id="messages-heading">Messages</h2>
                </div>
              </div>
              <span className="fakechat-badge-count">{messages.length} messages in this chat</span>
            </div>

            {/* Message List */}
            <div className="fakechat-messages-list">
              {messages.map((message, index) => {
                const isOpen = editingId === message.id
                return (
                  <article
                    key={message.id}
                    className={`fakechat-msg-item ${message.side} ${isOpen ? 'is-editing' : ''}`}
                  >
                    <div className="fakechat-msg-row">
                      <span className="fakechat-msg-num">{index + 1}</span>
                      <div
                        className="fakechat-msg-body"
                        onClick={() => {
                          setEditingId(isOpen ? null : message.id)
                          setEmojiPanel(null)
                        }}
                      >
                        <span className="fakechat-msg-text">
                          {message.image && <ImagePlus size={13} style={{ marginRight: 4 }} />}
                          {message.text || (message.image ? 'Photo message' : 'Empty message')}
                        </span>
                        <div className="fakechat-msg-meta">
                          <span>{message.time}</span>
                          {message.side === 'me' && message.status === 'read' && (
                            <span className="fakechat-msg-ticks" title="Read">
                              <CheckCheck size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="fakechat-msg-del-btn"
                        aria-label="Delete message"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeMessage(message.id)
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Inline Editor when clicked */}
                    {isOpen && (
                      <div className="fakechat-msg-editor">
                        <textarea
                          ref={(field) => {
                            if (field) messageRefs.current.set(message.id, field)
                            else messageRefs.current.delete(message.id)
                          }}
                          rows={3}
                          value={message.text}
                          maxLength={600}
                          onChange={(event) => updateMessage(message.id, { text: event.target.value })}
                          placeholder="Type message text..."
                        />
                        {emojiPanel === message.id && (
                          <EmojiPanel
                            group={emojiGroup}
                            onGroup={setEmojiGroup}
                            onPick={(emoji) => insertEmoji(message.id, emoji)}
                          />
                        )}
                        <div className="fakechat-editor-three-col">
                          <div className="fakechat-input-col">
                            <label>From</label>
                            <select
                              value={message.side}
                              onChange={(event) =>
                                updateMessage(message.id, { side: event.target.value })
                              }
                            >
                              <option value="me">Me</option>
                              <option value="them">Them</option>
                            </select>
                          </div>
                          <div className="fakechat-input-col">
                            <label>Time</label>
                            <input
                              value={message.time}
                              maxLength={16}
                              onChange={(event) =>
                                updateMessage(message.id, { time: event.target.value })
                              }
                              placeholder="9:45 AM"
                            />
                          </div>
                          <div className="fakechat-input-col">
                            <label>Status</label>
                            <select
                              value={message.status || 'read'}
                              disabled={message.side !== 'me'}
                              onChange={(event) =>
                                updateMessage(message.id, { status: event.target.value })
                              }
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="fakechat-editor-tools">
                          {message.image ? (
                            <div className="fakechat-attach">
                              <img src={message.image} alt="Attachment" />
                              <button
                                type="button"
                                className="fakechat-remove-photo"
                                onClick={() => updateMessage(message.id, { image: '' })}
                              >
                                Remove photo
                              </button>
                            </div>
                          ) : (
                            <label className="fakechat-upload-btn">
                              <ImagePlus size={14} /> Add photo
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                  void uploadMessageImage(
                                    message.id,
                                    event.currentTarget.files?.[0] ?? null
                                  )
                                  event.currentTarget.value = ''
                                }}
                              />
                            </label>
                          )}

                          <div className="fakechat-btn-group">
                            <button
                              type="button"
                              className={`fakechat-small-icon-btn ${emojiPanel === message.id ? 'is-active' : ''}`}
                              data-emoji-toggle
                              aria-label="Add emoji"
                              onClick={() => toggleEmoji(message.id)}
                            >
                              <Smile size={16} />
                            </button>
                            <button
                              type="button"
                              className="fakechat-small-icon-btn"
                              aria-label="Move message up"
                              disabled={index === 0}
                              onClick={() => moveMessage(index, -1)}
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              className="fakechat-small-icon-btn"
                              aria-label="Move message down"
                              disabled={index === messages.length - 1}
                              onClick={() => moveMessage(index, 1)}
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            {/* + Add Message Button */}
            <button
              type="button"
              className="fakechat-add-btn"
              onClick={handleAddButtonClick}
            >
              <Plus size={16} />
              Add Message
            </button>

            {/* Composer Drawer */}
            {(showComposer || messages.length === 0) && (
              <div className="fakechat-composer-panel">
                <textarea
                  ref={composerRef}
                  rows={2}
                  value={draftText}
                  maxLength={600}
                  onChange={(event) => setDraftText(event.target.value)}
                  placeholder="Type a message…"
                />
                {emojiPanel === 'composer' && (
                  <EmojiPanel
                    group={emojiGroup}
                    onGroup={setEmojiGroup}
                    onPick={(emoji) => insertEmoji('composer', emoji)}
                  />
                )}
                <div className="fakechat-composer-row">
                  <div className="fakechat-side-segmented" role="radiogroup" aria-label="Sender">
                    <button
                      type="button"
                      className={`fakechat-side-btn ${draftSide === 'me' ? 'is-active' : ''}`}
                      onClick={() => setDraftSide('me')}
                    >
                      Me
                    </button>
                    <button
                      type="button"
                      className={`fakechat-side-btn ${draftSide === 'them' ? 'is-active' : ''}`}
                      onClick={() => setDraftSide('them')}
                    >
                      Them
                    </button>
                  </div>

                  <input
                    className="fakechat-time-input"
                    value={draftTime}
                    maxLength={16}
                    onChange={(event) => setDraftTime(event.target.value)}
                    placeholder="9:45 AM"
                  />

                  <button
                    type="button"
                    className="fakechat-small-icon-btn"
                    data-emoji-toggle
                    aria-label="Add emoji"
                    onClick={() => toggleEmoji('composer')}
                  >
                    <Smile size={16} />
                  </button>

                  <label className="fakechat-upload-btn">
                    <ImagePlus size={14} /> Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        void uploadDraftImage(event.currentTarget.files?.[0] ?? null)
                        event.currentTarget.value = ''
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    className="fakechat-composer-action-btn"
                    onClick={addMessage}
                    disabled={!draftText.trim() && !draftImage}
                  >
                    <Plus size={15} /> Add
                  </button>
                </div>

                {draftImage && (
                  <div className="fakechat-attach" style={{ marginTop: 6 }}>
                    <img src={draftImage} alt="Draft" />
                    <button
                      type="button"
                      className="fakechat-remove-photo"
                      onClick={() => setDraftImage('')}
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>
            )}
            {error && <p className="fakechat-error">{error}</p>}
          </section>

          {/* CARD 4: APPEARANCE (Scroll target) */}
          <section id="appearance" className="fakechat-card" aria-labelledby="appearance-heading">
            <div className="fakechat-card-head">
              <div className="fakechat-card-head-left">
                <div className="fakechat-card-icon">
                  <Palette size={18} />
                </div>
                <div className="fakechat-card-titles">
                  <h2 id="appearance-heading">Appearance</h2>
                  <p>Fine-tune colors and visual style</p>
                </div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              The layout automatically matches official platform styling for{' '}
              <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{style}</strong>{' '}
              including fonts, bubble geometries, timestamps, and header layouts in{' '}
              <strong>{dark ? 'Dark mode' : 'Light mode'}</strong>.
            </p>
          </section>

          {/* CARD 5: EXPORT (Scroll target) */}
          <section id="export" className="fakechat-card" aria-labelledby="export-heading">
            <div className="fakechat-card-head">
              <div className="fakechat-card-head-left">
                <div className="fakechat-card-icon">
                  <Download size={18} />
                </div>
                <div className="fakechat-card-titles">
                  <h2 id="export-heading">Export & Reset</h2>
                  <p>Save lossless PNG image or restart from default</p>
                </div>
              </div>
            </div>
            <div className="fakechat-actions-row">
              <button
                type="button"
                className="fakechat-download-btn"
                onClick={download}
                disabled={!dims.width}
              >
                <Download size={16} /> Download PNG
              </button>
              <button type="button" className="fakechat-reset-btn" onClick={reset}>
                <RotateCcw size={15} /> Reset
              </button>
            </div>
          </section>
        </main>

        {/* COLUMN 3: RIGHT LIVE PREVIEW CARD */}
        <aside className="fakechat-preview-card" aria-label="Live Preview">
          <div className="fakechat-preview-head">
            <span className="fakechat-preview-title">
              <Eye size={18} color="#6c5ce7" /> Live Preview
            </span>
            <span className="fakechat-dim-pill">
              {dims.width || 1080} × {dims.height || 1920} px
            </span>
          </div>

          {/* Smartphone Mockup Frame */}
          <div className="fakechat-phone-frame">
            <div className="fakechat-phone-top">
              <div className="fakechat-phone-camera" />
              <div className="fakechat-phone-speaker" />
            </div>
            <div className="fakechat-screen-area">
              <canvas
                ref={canvasRef}
                className="fakechat-canvas"
                role="img"
                aria-label="Fake chat screenshot preview"
              />
            </div>
          </div>

          {/* Image Size Dropdown */}
          <div className="fakechat-export-panel">
            <div className="fakechat-size-select-wrap">
              <label htmlFor="export-size">
                <Smartphone size={14} /> Image Size
              </label>
              <select
                id="export-size"
                value={exportWidth}
                onChange={(event) => setExportWidth(Number(event.target.value))}
              >
                <option value={1080}>1080 px wide (Portrait)</option>
                <option value={720}>720 px wide (Standard)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="fakechat-actions-row">
              <button
                type="button"
                className="fakechat-download-btn"
                onClick={download}
                disabled={!dims.width}
              >
                <Download size={16} /> Download PNG
              </button>
              <button
                type="button"
                className="fakechat-reset-btn"
                onClick={reset}
                title="Reset to sample chat"
              >
                <RotateCcw size={15} /> Reset
              </button>
            </div>

            <p className="fakechat-helper-note">
              Updates live as you type. Photos never leave this browser.
            </p>
          </div>
        </aside>
      </div>

      {/* ----------------- SEO CONTENT SECTION ----------------- */}
      <section className="fakechat-seo-container" aria-label="Information & Features">
        <header className="fakechat-seo-header">
          <h2>Why Use ImgMojo's Fake Chat Generator?</h2>
          <p>
            Create pixel-perfect, hyper-realistic chat conversations for WhatsApp, Messenger,
            Telegram, and iMessage in seconds. Ideal for storytelling videos, TikToks, YouTube
            Shorts, memes, and UI design mockups.
          </p>
        </header>

        {/* Feature Cards Grid */}
        <div className="fakechat-features-grid">
          <div className="fakechat-feature-card">
            <div className="fakechat-feature-icon">
              <Sparkles size={22} />
            </div>
            <h3>100% Free & No Watermark</h3>
            <p>
              Generate unlimited high-resolution screenshots without paying a cent or dealing with
              intrusive watermarks.
            </p>
          </div>

          <div className="fakechat-feature-card">
            <div className="fakechat-feature-icon">
              <Smartphone size={22} />
            </div>
            <h3>Realistic Native Styling</h3>
            <p>
              Every header, bubble shape, font, timestamp, and status checkmark matches authentic
              mobile operating system designs.
            </p>
          </div>

          <div className="fakechat-feature-card">
            <div className="fakechat-feature-icon">
              <ShieldCheck size={22} />
            </div>
            <h3>Client-Side Privacy</h3>
            <p>
              All rendering is computed directly in your browser using HTML5 Canvas. Your messages
              and photos are never sent to external servers.
            </p>
          </div>

          <div className="fakechat-feature-card">
            <div className="fakechat-feature-icon">
              <Download size={22} />
            </div>
            <h3>Lossless HD PNG Export</h3>
            <p>
              Export crisp 1080p vertical screenshots optimized for social media feeds, video
              editing timelines, and presentations.
            </p>
          </div>
        </div>

        {/* 4-Step How-To Guide */}
        <div className="fakechat-steps-section">
          <div className="fakechat-seo-header" style={{ marginBottom: 0 }}>
            <h2>How to Make Fake Chat Screenshots in 4 Steps</h2>
            <p>Follow these quick steps to generate your personalized chat conversation.</p>
          </div>
          <div className="fakechat-steps-grid">
            <div className="fakechat-step-item">
              <div className="fakechat-step-badge">1</div>
              <h4>Pick Platform & Theme</h4>
              <p>Select WhatsApp, Telegram, Messenger, Instagram, or iMessage, and choose Light or Dark mode.</p>
            </div>
            <div className="fakechat-step-item">
              <div className="fakechat-step-badge">2</div>
              <h4>Customize Contact</h4>
              <p>Enter the sender’s name, set their last seen or status line, and upload a custom avatar photo.</p>
            </div>
            <div className="fakechat-step-item">
              <div className="fakechat-step-badge">3</div>
              <h4>Compose Messages</h4>
              <p>Add alternating messages, adjust timestamps, insert emojis, or attach photo messages.</p>
            </div>
            <div className="fakechat-step-item">
              <div className="fakechat-step-badge">4</div>
              <h4>Download PNG</h4>
              <p>Check the live smartphone preview and click Download PNG to save your clean screenshot.</p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="fakechat-faq-section">
          <div className="fakechat-seo-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about our fake chat generator tool.</p>
          </div>
          <div className="fakechat-faq-list">
            <details className="fakechat-faq-item" open>
              <summary className="fakechat-faq-question">
                <span>Is this fake chat generator free?</span>
                <ChevronDown size={18} />
              </summary>
              <p className="fakechat-faq-answer">
                Yes! ImgMojo’s Fake Chat Generator is completely free with no usage limits, no credit
                card, and zero watermarks on exported files.
              </p>
            </details>

            <details className="fakechat-faq-item">
              <summary className="fakechat-faq-question">
                <span>Can I use this for YouTube Shorts, Reels, and TikTok videos?</span>
                <ChevronDown size={18} />
              </summary>
              <p className="fakechat-faq-answer">
                Absolutely. The output is formatted in clean 1080 × 1920 portrait dimensions, making
                it ideal for video editors, storytelling skits, and social media shorts.
              </p>
            </details>

            <details className="fakechat-faq-item">
              <summary className="fakechat-faq-question">
                <span>Are my images or private chats saved on any server?</span>
                <ChevronDown size={18} />
              </summary>
              <p className="fakechat-faq-answer">
                No. All text processing and canvas rendering happen locally in your web browser. No
                chat logs, media files, or contact information are stored or transmitted.
              </p>
            </details>

            <details className="fakechat-faq-item">
              <summary className="fakechat-faq-question">
                <span>How do I add images and emojis into messages?</span>
                <ChevronDown size={18} />
              </summary>
              <p className="fakechat-faq-answer">
                Click the emoji icon to browse our full emoji library, or click "Add photo" to attach
                any picture directly into an individual message bubble.
              </p>
            </details>

            <details className="fakechat-faq-item">
              <summary className="fakechat-faq-question">
                <span>Can I switch between Light and Dark themes?</span>
                <ChevronDown size={18} />
              </summary>
              <p className="fakechat-faq-answer">
                Yes. Use the Theme toggle in Chat Setup to switch between Light, Dark, or Auto to
                match your operating system preference.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
