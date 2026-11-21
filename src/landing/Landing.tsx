import { useMemo, useState } from 'react'
import {
  ArrowRight,
  FileText,
  Gift,
  Image,
  Layers,
  Sparkles,
  Video,
  ShieldCheck,
  Zap,
  Lock,
  ChevronDown,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react'
import { useTools } from '../config/toolSettings'
import { ToolGlyph } from '../config/toolIcons'
import { promptCatalog } from '../data/prompt-catalog'
import { responsiveImage } from '../data/prompt-image'
import { useTrendingTodaySettings } from '../data/trending-today'
import type { Prompt } from '../domain/prompt'

interface CategoryCardItem {
  id: string
  title: string
  text: string
  tint: 'image' | 'video' | 'pdf' | 'generators' | 'utilities'
  toolId?: string
  href?: string
  toggleAll?: boolean
}

const categories: CategoryCardItem[] = [
  {
    id: 'image',
    title: 'Image Tools',
    text: 'Edit, enhance, convert & more',
    tint: 'image',
    toolId: 'collage',
  },
  {
    id: 'video',
    title: 'Video Tools',
    text: 'Record, edit, compress & more',
    tint: 'video',
    toolId: 'shorts',
  },
  {
    id: 'pdf',
    title: 'PDF Tools',
    text: 'Merge, split, convert & more',
    tint: 'pdf',
    href: '/store?type=pdf',
  },
  {
    id: 'generators',
    title: 'Generators',
    text: 'QR, text, images & more',
    tint: 'generators',
    toolId: 'qr-code',
  },
  {
    id: 'utilities',
    title: 'Utilities',
    text: 'Everyday useful tools',
    tint: 'utilities',
    toggleAll: true,
  },
]

const POLITICAL_FALLBACK_PROMPTS = promptCatalog.filter(
  (p) =>
    p.category.toLowerCase().includes('politic') ||
    (p.hashtags ?? []).some((h) => h.toLowerCase().includes('politic'))
)

const HOME_FAQS = [
  {
    q: 'How does ImgMojo protect my data and image privacy?',
    a: 'ImgMojo is engineered with a strict client-side first architecture. Your photos, documents, and screen recordings are processed directly in your browser memory using HTML5 Canvas and WebAssembly. Your files are never uploaded to remote servers, stored in external databases, or shared with third parties.',
  },
  {
    q: 'Are all tools on ImgMojo 100% free with no hidden charges?',
    a: 'Yes, every single utility on ImgMojo—including image compression, format conversion, resizing, QR code creation, passport photo generation, and full screen recording—is completely free to use. There are no credit card requirements, trials, or hidden subscriptions.',
  },
  {
    q: 'Do ImgMojo tools add watermarks to exported files?',
    a: 'No. ImgMojo exports all processed images, converted formats, custom QR codes, and screen recordings completely watermark-free at full original quality.',
  },
  {
    q: 'Can I use images, QR codes, and videos created on ImgMojo for commercial purposes?',
    a: 'Absolutely. Any media, QR code, or screen recording processed or generated using ImgMojo is 100% yours to use for personal, academic, client, and commercial projects without attribution requirements.',
  },
  {
    q: 'Which image and video formats are supported?',
    a: 'We support all major modern formats including JPEG, PNG, WebP, AVIF, SVG, BMP, GIF, WebM, and MP4. You can convert between lossy and lossless formats with custom compression and transparency options.',
  },
  {
    q: 'Do I need to install any browser extensions or desktop apps?',
    a: 'No installation is needed. ImgMojo runs natively in any standard web browser across Windows, macOS, Linux, Android, and iOS devices with instant zero-install performance.',
  },
]

export function HomeLanding({
  onJump,
  onOpenTool,
  onNavigate,
  allPrompts = [],
  politicalPrompts = [],
}: {
  onJump: (id: string) => void
  onOpenTool: (toolId: string) => void
  onNavigate: (href: string) => void
  allPrompts?: Prompt[]
  politicalPrompts?: Prompt[]
  onSelectCategory?: (category: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const [openFaq, setOpenFaq] = useState<number>(0)
  const { utility, libraryMenu, feature } = useTools()
  const trendingSettings = useTrendingTodaySettings()
  const allTools = [
    ...utility,
    ...libraryMenu.filter((tool) => tool.load || tool.href),
    ...feature,
  ]

  // Trending Today displays Admin-selected posts first, then fills with Political hashtag posts in the same 6-slot strip area
  const trendingPoliticalPosts = useMemo(() => {
    const result: Array<{ id: string; title: string; image?: string; imageAlt?: string; slug: string }> = []
    const seen = new Set<string>()

    // 1. Admin-pinned post IDs (in exact admin order)
    for (const pinnedId of trendingSettings.postIds) {
      const found =
        allPrompts.find((p) => p.id === pinnedId || p.slug === pinnedId) ||
        politicalPrompts.find((p) => p.id === pinnedId || p.slug === pinnedId) ||
        promptCatalog.find((p) => p.id === pinnedId || p.slug === pinnedId)
      if (found && found.image && !seen.has(found.id)) {
        seen.add(found.id)
        result.push(found)
      } else {
        const snapshot = trendingSettings.customItems.find((c) => c.id === pinnedId || c.slug === pinnedId)
        if (snapshot && snapshot.image && !seen.has(snapshot.id)) {
          seen.add(snapshot.id)
          result.push(snapshot)
        }
      }
    }

    // 2. Any extra custom items saved by Admin
    for (const custom of trendingSettings.customItems) {
      if (custom.image && !seen.has(custom.id)) {
        seen.add(custom.id)
        result.push(custom)
      }
    }

    // 3. Fill remaining slots up to 6 with Political hashtag posts
    for (const p of politicalPrompts) {
      if (result.length >= 6) break
      if (p.image && !seen.has(p.id)) {
        seen.add(p.id)
        result.push(p)
      }
    }

    // 4. Fallback political catalog items if fewer than 6
    for (const p of POLITICAL_FALLBACK_PROMPTS) {
      if (result.length >= 6) break
      if (p.image && !seen.has(p.id)) {
        seen.add(p.id)
        result.push(p)
      }
    }

    return result.slice(0, 6)
  }, [allPrompts, politicalPrompts, trendingSettings])

  const handleCategoryClick = (category: CategoryCardItem) => {
    if (category.toggleAll) {
      setShowAll((prev) => !prev)
      return
    }
    if (category.toolId) {
      onOpenTool(category.toolId)
    } else if (category.href) {
      onNavigate(category.href)
    }
  }

  return (
    <div className="landing">
      {/* 2 MAIN CATEGORY HERO PANEL */}
      <section className="landing-hero" aria-label="ImgMojo Main Categories">
        <div className="landing-hero-panel landing-dual-hero">
          {/* LEFT CARD: DAILY VIRAL PROMPTS */}
          <article
            className="hero-cat-card hero-card-prompts"
            onClick={() => onJump('explore')}
          >
            <div className="hero-cat-copy">
              <h2 className="hero-cat-title">
                <span className="hero-cat-icon hero-icon-flame" aria-hidden="true">
                  <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
                    <defs>
                      <linearGradient id="flameOuter" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FF9800" />
                        <stop offset="55%" stopColor="#FF5722" />
                        <stop offset="100%" stopColor="#D81B60" />
                      </linearGradient>
                      <linearGradient id="flameInner" x1="16" y1="11" x2="16" y2="29" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFF59D" />
                        <stop offset="65%" stopColor="#FFC107" />
                        <stop offset="100%" stopColor="#FF7043" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M17.5 2.5C17.5 2.5 25.5 9.2 25.5 17.8C25.5 23.6 21.1 28.5 15.8 28.5C10.1 28.5 6.2 23.6 6.2 17.6C6.2 13.4 8.7 9.6 10.6 7.7C10.6 7.7 10.2 11.2 12.4 12.2C11.5 8.2 14.3 4.3 17.5 2.5Z"
                      fill="url(#flameOuter)"
                    />
                    <path
                      d="M16.2 12.2C16.2 12.2 21.2 16.2 21.2 21.2C21.2 24.8 18.8 27.6 15.8 27.6C12.8 27.6 10.6 24.9 10.6 21.5C10.6 18.9 12.2 16.7 13.7 15.5C13.7 15.5 13.6 17.6 15.1 18.2C14.6 15.8 15.1 13.6 16.2 12.2Z"
                      fill="url(#flameInner)"
                    />
                  </svg>
                </span>
                <span>Daily Viral Prompts</span>
              </h2>

              <p className="hero-cat-desc">
                Explore trending prompts for stunning AI images, portraits, cinematic art and more.
              </p>

              <button
                type="button"
                className="hero-cat-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onJump('explore')
                }}
              >
                <span>Explore Prompts</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* OVERLAPPING DUO GIRL PORTRAITS */}
            <div className="hero-prompts-duo" aria-hidden="true">
              <svg className="hero-prompts-rays" viewBox="0 0 36 42" width="24" height="28" fill="none">
                <path d="M26 7L12 2" stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round" />
                <path d="M22 20L4 17" stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round" />
                <path d="M25 32L10 36" stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round" />
              </svg>

              <div className="prompt-duo-card duo-card-left">
                <img
                  src="/images/hero-daily-prompts-girl-2.jpg"
                  alt="Trending AI Portrait"
                  decoding="async"
                />
              </div>

              <div className="prompt-duo-card duo-card-right">
                <img
                  src="/images/hero-daily-prompts-girl.jpg"
                  alt="Daily Viral Prompts"
                  decoding="async"
                />
              </div>
            </div>
          </article>

          {/* RIGHT CARD: FREE TEMPLATES */}
          <article
            className="hero-cat-card hero-card-templates"
            onClick={() => onOpenTool('poster')}
          >
            <div className="hero-cat-copy">
              <h2 className="hero-cat-title">
                <span className="hero-cat-icon hero-icon-gift" aria-hidden="true">
                  <Gift size={23} strokeWidth={2.2} />
                </span>
                <span>Free Templates</span>
              </h2>

              <p className="hero-cat-desc">
                Create posters from <strong>1000+ templates</strong> for social media, YouTube, posters, invites and more.
              </p>

              <button
                type="button"
                className="hero-cat-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenTool('poster')
                }}
              >
                <span>Browse Templates</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 3 OVERLAPPING FANNED HD POSTER TEMPLATE PREVIEWS */}
            <div className="hero-templates-deck" aria-hidden="true">
              <svg
                className="hero-templates-rays"
                viewBox="0 0 42 36"
                width="26"
                height="22"
                fill="none"
              >
                <path d="M8 22L10 4" stroke="#0d7285" strokeWidth="3.4" strokeLinecap="round" />
                <path d="M18 25L27 7" stroke="#0d7285" strokeWidth="3.4" strokeLinecap="round" />
                <path d="M26 31L40 21" stroke="#0d7285" strokeWidth="3.4" strokeLinecap="round" />
              </svg>
              <div className="deck-poster-card poster-card-1">
                <img
                  src="/images/hero-template-poster-1.jpg"
                  alt="Poster Template 1"
                  decoding="async"
                />
              </div>
              <div className="deck-poster-card poster-card-2">
                <img
                  src="/images/hero-template-poster-2.jpg"
                  alt="Poster Template 2"
                  decoding="async"
                />
              </div>
              <div className="deck-poster-card poster-card-3">
                <img
                  src="/images/hero-template-poster-3.jpg"
                  alt="Poster Template 3"
                  decoding="async"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* EXPLORE TOOLS BY CATEGORY */}
      <section
        className="landing-categories"
        id="landing-categories"
        aria-label="Explore tools by category"
      >
        <div className="landing-centered-head">
          <span className="landing-head-line" aria-hidden="true" />
          <h2>Explore Tools by Category</h2>
          <span className="landing-head-line" aria-hidden="true" />
        </div>

        <div className="landing-category-grid landing-category-grid-5">
          {categories.map((category) => (
            <button
              type="button"
              className={`landing-category-card cat-tint-${category.tint}`}
              key={category.id}
              onClick={() => handleCategoryClick(category)}
            >
              <span className={`landing-category-icon icon-tint-${category.tint}`}>
                {category.tint === 'image' && <Image size={21} />}
                {category.tint === 'video' && <Video size={21} />}
                {category.tint === 'pdf' && (
                  <span className="pdf-badge-icon">
                    <FileText size={20} />
                    <small>PDF</small>
                  </span>
                )}
                {category.tint === 'generators' && <Sparkles size={21} />}
                {category.tint === 'utilities' && <Layers size={21} />}
              </span>
              <span className="landing-category-copy">
                <strong>{category.title}</strong>
                <small>{category.text}</small>
              </span>
            </button>
          ))}
        </div>

        {showAll && (
          <div className="landing-tool-index">
            {allTools.map((tool, position) => (
              <button
                type="button"
                className={`landing-tool-chip tint-${(position % 6) + 1}`}
                key={tool.id}
                onClick={() =>
                  tool.href && !tool.load ? onNavigate(tool.href) : onOpenTool(tool.id)
                }
              >
                <span className="landing-tool-glyph">
                  <ToolGlyph icon={tool.icon} size={15} />
                </span>
                {tool.title}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* TRENDING TODAY STRIP — Political Hashtag Posts */}
      <section className="landing-trending-today" aria-label="Trending Today">
        <div className="landing-trending-head">
          <h3 className="landing-trending-title">
            <span className="trending-flame-icon" aria-hidden="true">
              🔥
            </span>
            <span>Trending Today</span>
          </h3>
          <button
            type="button"
            className="landing-trending-viewall"
            onClick={() => onNavigate('/Globalsearch')}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="landing-trending-strip">
          {trendingPoliticalPosts.map((item) => (
            <button
              type="button"
              key={item.id}
              className="landing-trending-thumb"
              onClick={() => onNavigate(`/prompt/${item.slug}`)}
              title={item.title}
            >
              <img
                {...responsiveImage(
                  item.image || '/templates/lotus-parliament.png',
                  '(max-width: 700px) 45vw, 18vw'
                )}
                alt={item.imageAlt || item.title}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </section>

      {/* RICH EDITORIAL, FEATURES, 3-STEP GUIDE & FAQS SECTION */}
      <section className="landing-editorial" aria-label="About ImgMojo Digital Utilities">
        {/* Editorial Header */}
        <div className="landing-editorial-hero">
          <span className="landing-editorial-badge">
            <ShieldCheck size={14} />
            <span>Privacy-First Digital Platform</span>
          </span>
          <h2>Professional Online Tools. Free, Fast &amp; 100% Client-Side.</h2>
          <p>
            ImgMojo is a modern suite of high-performance creative and technical utilities designed to simplify daily digital workflows. 
            Compress large photo libraries, convert file formats, generate scannable QR codes, prepare government-compliant passport photos, 
            and capture pristine screen recordings—completely inside your browser without uploading files to remote servers.
          </p>
        </div>

        {/* 4 Feature Value Pillars */}
        <div className="landing-features-grid">
          <article className="landing-feature-card">
            <div className="landing-feature-icon">
              <Lock size={22} />
            </div>
            <h3>100% In-Browser Privacy</h3>
            <p>
              Your personal photos, documents, and recordings never leave your device. All calculations, rendering, and compression run locally inside your browser memory using HTML5 Canvas and WebAssembly.
            </p>
          </article>

          <article className="landing-feature-card">
            <div className="landing-feature-icon">
              <Zap size={22} />
            </div>
            <h3>Zero Lag &amp; Instant Processing</h3>
            <p>
              No upload or download queues. Files are processed at native hardware speeds directly on your CPU/GPU, enabling instantaneous batch conversions, real-time image cropping, and immediate downloads.
            </p>
          </article>

          <article className="landing-feature-card">
            <div className="landing-feature-icon">
              <CheckCircle2 size={22} />
            </div>
            <h3>Free with No Watermarks</h3>
            <p>
              Every utility is completely free. We never inject forced watermarks, limit export resolutions, or lock essential tools behind paywalls or mandatory credit card registrations.
            </p>
          </article>

          <article className="landing-feature-card">
            <div className="landing-feature-icon">
              <SlidersHorizontal size={22} />
            </div>
            <h3>Universal Format Support</h3>
            <p>
              Seamlessly handle all standard formats: PNG, JPG/JPEG, WebP, AVIF, SVG, BMP, WebM, and MP4. Perfect for web developers, social media managers, photographers, and educators.
            </p>
          </article>
        </div>

        {/* 3-Step Workflow Guide */}
        <div className="landing-steps-section">
          <div className="landing-steps-header">
            <h3>How ImgMojo Works</h3>
            <p>Complete tasks in three simple steps with no software downloads.</p>
          </div>
          <div className="landing-steps-grid">
            <div className="landing-step-item">
              <div className="landing-step-num">1</div>
              <h4>Choose Your Utility</h4>
              <p>Select from our image processing tools, biometric photo creator, QR designer, or screen recorder from the top navigation.</p>
            </div>
            <div className="landing-step-item">
              <div className="landing-step-num">2</div>
              <h4>Customize &amp; Adjust</h4>
              <p>Drag and drop your file, configure parameters (dimensions, quality, background, logo, or audio source) with live instant previews.</p>
            </div>
            <div className="landing-step-item">
              <div className="landing-step-num">3</div>
              <h4>Export Instantly</h4>
              <p>Download your optimized, clean, high-resolution result directly to your storage in one click. Completely watermark-free.</p>
            </div>
          </div>
        </div>

        {/* Interactive FAQ Section */}
        <div className="landing-faq-section">
          <div className="landing-faq-header">
            <h3>Frequently Asked Questions</h3>
            <p>Everything you need to know about ImgMojo tools, security, and licensing.</p>
          </div>
          <div className="landing-faq-list">
            {HOME_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={faq.q} className={`landing-faq-card ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="landing-faq-trigger"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className="landing-faq-chevron" />
                  </button>
                  {isOpen && (
                    <div className="landing-faq-body">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
