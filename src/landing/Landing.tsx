import { useState } from 'react'
import {
  ArrowRight,
  FileText,
  Gift,
  Image,
  Layers,
  Sparkles,
  Video,
} from 'lucide-react'
import { useTools } from '../config/toolSettings'
import { ToolGlyph } from '../config/toolIcons'

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

const TRENDING_TODAY_THUMBS = [
  {
    id: 'tt-1',
    image: '/images/trending-thumb-1.jpg',
    title: 'Sunglasses Bridal Portrait',
  },
  {
    id: 'tt-2',
    image: '/images/trending-thumb-2.jpg',
    title: 'Golden Temple Sunrise',
  },
  {
    id: 'tt-3',
    image: '/images/trending-thumb-3.jpg',
    title: 'Divine Mahadev Art',
  },
  {
    id: 'tt-4',
    image: '/images/trending-thumb-4.jpg',
    title: 'Autumn Golden Avenue',
  },
  {
    id: 'tt-5',
    image: '/images/trending-thumb-5.jpg',
    title: 'Cyberpunk Neon Supercar',
  },
  {
    id: 'tt-6',
    image: '/images/trending-thumb-6.jpg',
    title: 'Serene Sunset Mountain Lake',
  },
]

export function HomeLanding({
  onJump,
  onOpenTool,
  onNavigate,
}: {
  onJump: (id: string) => void
  onOpenTool: (toolId: string) => void
  onNavigate: (href: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const { utility, libraryMenu, feature } = useTools()
  const allTools = [
    ...utility,
    ...libraryMenu.filter((tool) => tool.load || tool.href),
    ...feature,
  ]

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

      {/* TRENDING TODAY STRIP */}
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
            onClick={() => onJump('explore')}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="landing-trending-strip">
          {TRENDING_TODAY_THUMBS.map((item) => (
            <button
              type="button"
              key={item.id}
              className="landing-trending-thumb"
              onClick={() => onJump('explore')}
              title={item.title}
            >
              <img src={item.image} alt={item.title} loading="lazy" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
