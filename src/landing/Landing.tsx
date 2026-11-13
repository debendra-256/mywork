import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Gift,
  Image,
  Layers,
  LayoutGrid,
  PenLine,
  Play,
  ShieldCheck,
  Sparkles,
  Video,
  Wand2,
  Zap,
  FileArchive,
  IdCard,
  Copy,
  Check,
} from 'lucide-react'
import { useTools } from '../config/toolSettings'
import { ToolGlyph } from '../config/toolIcons'

interface LandingAction {
  label: string
  jump?: string
  toolId?: string
  href?: string
}

interface LandingSlide {
  id: string
  eyebrow: string
  icon: typeof Sparkles
  line1: string
  line2: string
  accent: string
  body: string
  primary: LandingAction
  secondary: LandingAction
  badge: string
  toolTag: string
  mockupType: 'poster' | 'shorts' | 'compress' | 'watermark' | 'passport' | 'prompt' | 'girls-prompt' | 'recorder'
}

export const HERO_GIRL_PROMPTS = [
  {
    id: 'gp-1',
    style: 'Golden Hour Film',
    tag: 'Girls · 35mm Film',
    image: '/images/prompts/girl-portrait-1.jpg',
    prompt: 'cinematic golden hour 8k portrait of an Indian girl in soft amber light, natural skin texture, 35mm film grain, editorial --v 6.0',
    model: 'Midjourney v6',
  },
  {
    id: 'gp-2',
    style: 'Editorial Fashion',
    tag: 'Fashion · Studio',
    image: '/images/prompts/girl-portrait-2.jpg',
    prompt: 'high-fashion studio portrait of an aesthetic young woman, dramatic rim light, minimalist background, sharp focus, 85mm f/1.4 lens --style raw',
    model: 'FLUX.1',
  },
  {
    id: 'gp-3',
    style: 'Sunlit Bokeh',
    tag: 'Natural · Glow',
    image: '/images/prompts/girl-portrait-3.jpg',
    prompt: 'candid sunlit portrait of a smiling girl with windblown hair, soft warm bokeh, photorealistic skin details, Kodak Portra 400 --v 6.0',
    model: 'ChatGPT 4o',
  },
  {
    id: 'gp-4',
    style: 'Royal Saree',
    tag: 'Traditional · Festive',
    image: '/images/prompts/girl-portrait-4.jpg',
    prompt: 'graceful Indian woman in a vibrant traditional silk saree, warm temple lighting, regal posture, intricate embroidery details, photorealistic 8k --v 6.0',
    model: 'Gemini',
  },
  {
    id: 'gp-5',
    style: 'Studio Portrait',
    tag: 'Close-Up · 8K',
    image: '/images/prompts/girl-portrait-5.jpg',
    prompt: 'ultra-detailed studio beauty portrait of a young woman, softbox diffused lighting, hyper-realistic iris and skin pores, cinematic masterpiece --v 6.0',
    model: 'Midjourney v6',
  },
]

/**
 * Premium Hero Slides showcasing all core ImgMojo creative tools with live posters,
 * multi-color logo gradients, and instant 1-click launcher actions.
 */
const slides: LandingSlide[] = [
  {
    id: 'poster',
    eyebrow: 'Poster & Collage Studio',
    icon: Sparkles,
    line1: 'Turn one photo into a',
    line2: 'poster, collage or',
    accent: 'reel',
    body: 'Drop an image, pick a layout and export it in the exact size you need — no upload, no waiting.',
    primary: { label: 'Open Poster Studio', toolId: 'poster' },
    secondary: { label: 'Try Collage Studio', toolId: 'collage' },
    badge: 'LIVE STUDIO',
    toolTag: 'poster · studio',
    mockupType: 'poster',
  },
  {
    id: 'girls-prompt',
    eyebrow: 'Trending Girls AI Prompts',
    icon: Sparkles,
    line1: 'Generate breathtaking',
    line2: 'photorealistic AI prompts for',
    accent: 'Girls',
    body: 'Copy verified, viral Midjourney & ChatGPT prompt recipes for cinematic 8K portraits, golden-hour film aesthetics, traditional saree looks, and studio fashion photography.',
    primary: { label: 'Explore Girls Prompts', jump: 'explore' },
    secondary: { label: 'Generate AI Prompt', toolId: 'prompt-generator' },
    badge: 'TRENDING 4K',
    toolTag: 'girls · prompt',
    mockupType: 'girls-prompt',
  },
  {
    id: 'prompt',
    eyebrow: 'AI Prompt Generator',
    icon: Wand2,
    line1: 'Generate high-converting',
    line2: 'prompts for Midjourney &',
    accent: 'ChatGPT',
    body: 'Craft photorealistic, cinematic and artistic prompt recipes tailored to top generative AI models with 1 click.',
    primary: { label: 'Generate Prompts', toolId: 'prompt-generator' },
    secondary: { label: 'Prompt Library', jump: 'explore' },
    badge: 'GPT & FLUX',
    toolTag: 'prompt · engine',
    mockupType: 'prompt',
  },
  {
    id: 'shorts',
    eyebrow: 'YouTube to Shorts Maker',
    icon: Zap,
    line1: 'Turn any YouTube video into',
    line2: 'viral 9:16 vertical',
    accent: 'Shorts',
    body: 'Auto-reframe video clips, highlight high-energy moments, and export in crystal-clear HD for YouTube & Reels.',
    primary: { label: 'Create Shorts Now', toolId: 'shorts' },
    secondary: { label: 'Explore Video Tools', toolId: 'shorts' },
    badge: 'HD 1080P',
    toolTag: 'shorts · 9:16',
    mockupType: 'shorts',
  },
  {
    id: 'compress',
    eyebrow: 'Smart Image Compressor',
    icon: FileArchive,
    line1: 'Shrink photo sizes up to',
    line2: '90% with zero quality',
    accent: 'loss',
    body: 'Lightning-fast client-side batch compression for PNG, JPEG, and WebP. 100% private, processing directly in your browser.',
    primary: { label: 'Compress Images', toolId: 'compress-image' },
    secondary: { label: 'Batch Optimizer', toolId: 'compress-image' },
    badge: '-90% SIZE',
    toolTag: 'compress · fast',
    mockupType: 'compress',
  },
  {
    id: 'watermark',
    eyebrow: 'AI Magic Eraser',
    icon: Wand2,
    line1: 'Erase photobombers and',
    line2: 'watermarks with one',
    accent: 'brush',
    body: 'Smart inpainting removes logos, stamps, objects and blemishes seamlessly while preserving natural textures.',
    primary: { label: 'Remove Watermark', toolId: 'watermark-remover' },
    secondary: { label: 'Erase Objects', toolId: 'remove-object' },
    badge: 'AI INPAINT',
    toolTag: 'eraser · ai',
    mockupType: 'watermark',
  },
  {
    id: 'passport',
    eyebrow: 'Biometric Passport Studio',
    icon: IdCard,
    line1: 'Create compliant official',
    line2: 'passport and visa',
    accent: 'photos',
    body: 'Instant background removal, standard country dimensions (US, UK, EU, India), and ready-to-print multi-photo sheets.',
    primary: { label: 'Make Passport Photo', toolId: 'passport-photo' },
    secondary: { label: 'View Print Sizes', toolId: 'passport-photo' },
    badge: 'BIOMETRIC',
    toolTag: 'passport · 35x45',
    mockupType: 'passport',
  },
  {
    id: 'recorder',
    eyebrow: 'Studio Screen Recorder',
    icon: Video,
    line1: 'Record screen & audio in',
    line2: 'crystal-clear HD with',
    accent: 'no limits',
    body: 'Capture full screen, application window or browser tab with microphone audio. Zero watermarks and completely free.',
    primary: { label: 'Start Recording', toolId: 'screen-recorder' },
    secondary: { label: 'Create QR Codes', toolId: 'qr-code' },
    badge: 'REC 60FPS',
    toolTag: 'recorder · hd',
    mockupType: 'recorder',
  },
]

const trustItems = [
  { icon: Zap, title: '100+ Tools', text: 'All in one place' },
  { icon: Gift, title: '100% Free', text: 'No signup required' },
  { icon: Layers, title: 'Multiple Formats', text: 'Image, PDF, Video, Text' },
  { icon: ShieldCheck, title: 'Privacy First', text: 'Your data stays on your device' },
]

const categories = [
  { id: 'image', icon: Image, tint: 1, title: 'Image Tools', text: 'Edit, convert and enhance images.', toolId: 'collage' },
  { id: 'pdf', icon: FileText, tint: 2, title: 'PDF Tools', text: 'Merge, split and manage PDF files.', href: '/store?type=pdf' },
  { id: 'video', icon: Video, tint: 3, title: 'Video Tools', text: 'Edit, compress and create videos.', toolId: 'shorts' },
  { id: 'writing', icon: PenLine, tint: 4, title: 'Writing Tools', text: 'Generate, rewrite and improve text.', toolId: 'emoji-text' },
  { id: 'file', icon: FolderOpen, tint: 5, title: 'File Tools', text: 'Convert, compress and manage files.', toolId: 'qr-code' },
  { id: 'ai', icon: Wand2, tint: 6, title: 'AI & Utilities', text: 'Handy AI tools for everyday tasks.', toolId: 'mindcloud' },
]

const AUTO_ADVANCE_MS = 6000

export function HomeLanding({
  onJump,
  onOpenTool,
  onNavigate,
}: {
  onJump: (id: string) => void
  onOpenTool: (toolId: string) => void
  onNavigate: (href: string) => void
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const region = useRef<HTMLDivElement>(null)
  const { utility, libraryMenu, feature } = useTools()
  const allTools = [...utility, ...libraryMenu.filter((tool) => tool.load || tool.href), ...feature]

  const nextSlide = useCallback(() => {
    setIndex((prev) => (prev + 1) % slides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    if (paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(nextSlide, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [paused, nextSlide])

  const run = (action: LandingAction) => {
    if (action.jump) onJump(action.jump)
    else if (action.toolId) onOpenTool(action.toolId)
    else if (action.href) onNavigate(action.href)
  }

  const slide = slides[index]
  const EyebrowIcon = slide.icon

  return (
    <div
      className="landing"
      ref={region}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* HERO SLIDER CAROUSEL */}
      <section className="landing-hero" aria-roledescription="carousel" aria-label="ImgMojo Tools Showcase">
        <button
          type="button"
          className="landing-arrow landing-arrow-prev"
          aria-label="Previous slide"
          onClick={prevSlide}
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          className="landing-arrow landing-arrow-next"
          aria-label="Next slide"
          onClick={nextSlide}
        >
          <ChevronRight size={18} />
        </button>

        <div className="landing-hero-panel">
          <div className="landing-hero-copy" key={slide.id}>
            <span className="landing-eyebrow">
              <EyebrowIcon size={14} className="eyebrow-icon-gradient" /> {slide.eyebrow}
            </span>

            <h1>
              {slide.line1}
              <br />
              {slide.line2} <em className="landing-text-gradient">{slide.accent}</em>
            </h1>

            <p>{slide.body}</p>

            <div className="landing-ctas">
              <button
                type="button"
                className="landing-cta landing-cta-primary"
                onClick={() => run(slide.primary)}
              >
                <span>{slide.primary.label}</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                className="landing-cta landing-cta-secondary"
                onClick={() => run(slide.secondary)}
              >
                <Play size={13} />
                <span>{slide.secondary.label}</span>
              </button>
            </div>
          </div>

          <HeroArt slide={slide} />

          <div className="landing-dots" role="tablist" aria-label="Choose a tool slide">
            {slides.map((item, position) => (
              <button
                type="button"
                role="tab"
                aria-selected={position === index}
                aria-label={`Slide ${position + 1}: ${item.eyebrow}`}
                className={`landing-dot ${position === index ? 'is-active' : ''}`}
                key={item.id}
                onClick={() => setIndex(position)}
              >
                {position === index && <span className="landing-dot-glow" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="landing-trust" id="how-it-works" aria-label="Why ImgMojo">
        {trustItems.map((item) => (
          <div className="landing-trust-item" key={item.title}>
            <span className="landing-trust-icon">
              <item.icon size={19} />
            </span>
            <div>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          </div>
        ))}
      </section>

      {/* CATEGORY GRID */}
      <section className="landing-categories" id="landing-categories" aria-label="Explore tools by category">
        <div className="landing-section-head">
          <h2>
            <LayoutGrid size={19} /> Explore Tools by Category
          </h2>
          <button
            type="button"
            className="landing-view-all"
            aria-expanded={showAll}
            onClick={() => setShowAll((value) => !value)}
          >
            View All Tools <ArrowRight size={15} />
          </button>
        </div>
        <div className="landing-category-grid">
          {categories.map((category) => (
            <button
              type="button"
              className={`landing-category-card tint-${category.tint}`}
              key={category.id}
              onClick={() => (category.toolId ? onOpenTool(category.toolId) : category.href && onNavigate(category.href))}
            >
              <span className="landing-category-icon">
                <category.icon size={20} />
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
                onClick={() => (tool.href && !tool.load ? onNavigate(tool.href) : onOpenTool(tool.id))}
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
    </div>
  )
}

/**
 * Interactive Premium Tool Poster art featuring live prompt image showcases (girls & portraits),
 * dedicated tool canvas layouts, live status badges, and subtle floating accents.
 */
function HeroArt({ slide }: { slide: LandingSlide }) {
  const isPromptSlide = slide.mockupType === 'girls-prompt' || slide.mockupType === 'prompt'
  const [activePromptIndex, setActivePromptIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const currentPrompt = HERO_GIRL_PROMPTS[activePromptIndex % HERO_GIRL_PROMPTS.length]

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      void navigator.clipboard.writeText(currentPrompt.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className={`landing-art landing-art-${slide.mockupType}`}>
      <span className="landing-art-glow" />

      <div className="landing-art-screen">
        {/* WINDOW HEADER */}
        <div className="landing-art-bar">
          <div className="landing-art-controls">
            <i className="ctrl-red" />
            <i className="ctrl-yellow" />
            <i className="ctrl-green" />
          </div>
          <span className="landing-art-title">imgmojo · {slide.toolTag}</span>
        </div>

        {/* WINDOW CANVAS */}
        <div className="landing-art-body">
          <div className={`landing-art-canvas ${isPromptSlide ? 'canvas-prompt-mode' : ''}`}>
            {isPromptSlide ? (
              <div className="art-prompt-girls-showcase">
                <div className="art-prompt-img-container">
                  <img
                    src={currentPrompt.image}
                    alt={currentPrompt.style}
                    className="art-prompt-main-image"
                  />
                  <div className="art-prompt-img-overlay" />

                  {/* Floating Prompt Tag Badge */}
                  <span className="art-prompt-style-badge">
                    <Sparkles size={11} />
                    <span>{currentPrompt.tag}</span>
                  </span>

                  {/* Model Pill */}
                  <span className="art-prompt-model-badge">
                    {currentPrompt.model}
                  </span>

                  {/* Prompt Text Snippet Bar */}
                  <div className="art-prompt-snippet-bar">
                    <div className="art-prompt-snippet-content">
                      <span className="art-prompt-syntax">/imagine</span>
                      <p className="art-prompt-snippet-text">{currentPrompt.prompt}</p>
                    </div>
                    <button
                      type="button"
                      className={`art-prompt-copy-btn ${copied ? 'is-copied' : ''}`}
                      onClick={handleCopy}
                      title="Copy prompt"
                    >
                      {copied ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Thumbnails to switch between girls prompt styles */}
                <div className="art-prompt-thumbs" role="tablist" aria-label="Choose girl prompt style">
                  {HERO_GIRL_PROMPTS.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`art-prompt-thumb-pill ${activePromptIndex === idx ? 'is-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActivePromptIndex(idx)
                      }}
                      title={item.style}
                    >
                      <img src={item.image} alt={item.style} />
                      <span>{item.style}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {slide.mockupType === 'poster' ? (
                  <div className="art-poster-preview-wrap">
                    <img src="/images/poster-card-upload.png" alt="Poster Studio" className="art-poster-bg-img" />
                    <span className="art-poster-overlay-pill">🎨 250+ Templates</span>
                  </div>
                ) : slide.mockupType === 'passport' ? (
                  <div className="art-passport-preview-wrap">
                    <img src="/sample-portrait.jpg" alt="Biometric Passport" className="art-passport-bg-img" />
                    <div className="passport-biometric-box" />
                    <span className="art-passport-overlay-pill">35 × 45 mm</span>
                  </div>
                ) : (
                  <div className="landing-art-logo-wrap">
                    <img
                      src="/images/imgmojo-mark.png"
                      alt="ImgMojo"
                      width={84}
                      height={84}
                      className="landing-art-logo"
                    />
                    <span className="landing-art-tool-pill">{slide.eyebrow}</span>
                  </div>
                )}

                {/* DYNAMIC TOOL POSTER MOCKUP ELEMENTS */}
                {slide.mockupType === 'shorts' && (
                  <div className="art-tool-overlay art-overlay-shorts">
                    <div className="shorts-phone-frame">
                      <div className="shorts-phone-notch" />
                      <div className="shorts-play-btn">
                        <Play size={14} fill="currentColor" />
                      </div>
                      <div className="shorts-progress-bar">
                        <div className="shorts-progress-fill" />
                      </div>
                    </div>
                  </div>
                )}

                {slide.mockupType === 'compress' && (
                  <div className="art-tool-overlay art-overlay-compress">
                    <div className="compress-meter-pill">
                      <strong>-90%</strong>
                      <small>Optimized</small>
                    </div>
                  </div>
                )}

                {slide.mockupType === 'watermark' && (
                  <div className="art-tool-overlay art-overlay-watermark">
                    <div className="watermark-brush-halo">
                      <Wand2 size={16} />
                    </div>
                  </div>
                )}

                {slide.mockupType === 'recorder' && (
                  <div className="art-tool-overlay art-overlay-recorder">
                    <div className="recorder-audio-waves">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT SIDE TOOL PROPERTY BARS */}
          <div className="landing-art-side">
            {isPromptSlide ? (
              <div className="art-side-prompt-specs">
                <span className="art-spec-pill spec-model">{currentPrompt.model}</span>
                <span className="art-spec-pill spec-quality">8K UHD</span>
                <span className="art-spec-pill spec-raw">--style raw</span>
                <span className="art-spec-pill spec-ar">16:9 / 9:16</span>
              </div>
            ) : (
              <>
                <i className="side-bar side-bar-primary" />
                <i className="side-bar side-bar-accent" />
                <i className="side-bar side-bar-subtle" />
                <i className="side-bar side-bar-highlight" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING BADGES & CHIPS */}
      <span className="landing-art-live">
        <span className="art-live-pulse" />
        {slide.badge}
      </span>
      <span className="landing-art-chip landing-art-chip-a" title="Privacy Guaranteed">
        <ShieldCheck size={15} />
      </span>
      <span className="landing-art-chip landing-art-chip-b" title="AI Powered">
        <Sparkles size={15} />
      </span>
    </div>
  )
}
