import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, FileText, FolderOpen, Gift, Image, Layers, LayoutGrid, PenLine, Play, ShieldCheck, Sparkles, Video, Wand2, Zap } from 'lucide-react'
import { useTools } from '../config/toolSettings'
import { ToolGlyph } from '../config/toolIcons'

interface LandingAction {
  label: string
  jump?: string
  toolId?: string
  href?: string
}

interface LandingSlide {
  eyebrow: string
  line1: string
  line2: string
  accent: string
  body: string
  primary: LandingAction
  secondary: LandingAction
}

/** Three hero slides, matching the mockup's headline treatment and its two calls to action. */
const slides: LandingSlide[] = [
  {
    eyebrow: 'All-in-One AI Tools',
    line1: 'Create, Edit, Convert &',
    line2: 'Share with',
    accent: 'AI',
    body: '100+ free tools for images, PDFs, videos, text and more — simple, fast and easy to use.',
    primary: { label: 'Explore All Tools', jump: 'landing-categories' },
    secondary: { label: 'How It Works', jump: 'how-it-works' },
  },
  {
    eyebrow: 'Poster & Collage Studio',
    line1: 'Turn one photo into a',
    line2: 'poster, collage or',
    accent: 'reel',
    body: 'Drop an image, pick a layout and export it in the exact size you need — no upload, no waiting.',
    primary: { label: 'Open Poster Studio', toolId: 'poster' },
    secondary: { label: 'Try Collage Studio', toolId: 'collage' },
  },
  {
    eyebrow: 'Runs On Your Device',
    line1: 'Everything happens in',
    line2: 'your',
    accent: 'browser',
    body: 'Editing, recording and exporting run locally. Your files stay with you, always.',
    primary: { label: 'Try the prompt generator', toolId: 'prompt-generator' },
    secondary: { label: 'Browse all tools', jump: 'landing-categories' },
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

const AUTO_ADVANCE_MS = 7000

/**
 * The marketing top of the home page: hero carousel, trust strip and the
 * category grid. Every colour comes from the active site theme's tokens.
 */
export function HomeLanding({ onJump, onOpenTool, onNavigate }: { onJump: (id: string) => void; onOpenTool: (toolId: string) => void; onNavigate: (href: string) => void }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const region = useRef<HTMLDivElement>(null)
  const { utility, libraryMenu, feature } = useTools()
  const allTools = [...utility, ...libraryMenu.filter((tool) => tool.load || tool.href), ...feature]

  useEffect(() => {
    if (paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [paused])

  const run = (action: LandingAction) => {
    if (action.jump) onJump(action.jump)
    else if (action.toolId) onOpenTool(action.toolId)
    else if (action.href) onNavigate(action.href)
  }
  const slide = slides[index]

  return <div className="landing" ref={region} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
    <section className="landing-hero" aria-roledescription="carousel" aria-label="What ImgMojo does">
      <button type="button" className="landing-arrow landing-arrow-prev" aria-label="Previous slide" onClick={() => setIndex((value) => (value - 1 + slides.length) % slides.length)}><ChevronLeft size={18} /></button>
      <button type="button" className="landing-arrow landing-arrow-next" aria-label="Next slide" onClick={() => setIndex((value) => (value + 1) % slides.length)}><ChevronRight size={18} /></button>
      <div className="landing-hero-panel">
        <div className="landing-hero-copy" key={slide.eyebrow}>
          <span className="landing-eyebrow"><Sparkles size={13} /> {slide.eyebrow}</span>
          <h1>{slide.line1}<br />{slide.line2} <em>{slide.accent}</em></h1>
          <p>{slide.body}</p>
          <div className="landing-ctas">
            <button type="button" className="landing-cta landing-cta-primary" onClick={() => run(slide.primary)}>{slide.primary.label}<ArrowRight size={15} /></button>
            <button type="button" className="landing-cta landing-cta-secondary" onClick={() => run(slide.secondary)}><Play size={13} />{slide.secondary.label}</button>
          </div>
        </div>
        <HeroArt />
        <div className="landing-dots" role="tablist" aria-label="Choose a slide">
          {slides.map((item, position) => <button type="button" role="tab" aria-selected={position === index} aria-label={item.eyebrow} className={`landing-dot ${position === index ? 'is-active' : ''}`} key={item.eyebrow} onClick={() => setIndex(position)} />)}
        </div>
      </div>
    </section>

    <section className="landing-trust" id="how-it-works" aria-label="Why ImgMojo">
      {trustItems.map((item) => <div className="landing-trust-item" key={item.title}><span className="landing-trust-icon"><item.icon size={19} /></span><div><strong>{item.title}</strong><span>{item.text}</span></div></div>)}
    </section>

    <section className="landing-categories" id="landing-categories" aria-label="Explore tools by category">
      <div className="landing-section-head">
        <h2><LayoutGrid size={19} /> Explore Tools by Category</h2>
        <button type="button" className="landing-view-all" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>View All Tools <ArrowRight size={15} /></button>
      </div>
      <div className="landing-category-grid">
        {categories.map((category) => <button type="button" className={`landing-category-card tint-${category.tint}`} key={category.id} onClick={() => category.toolId ? onOpenTool(category.toolId) : category.href && onNavigate(category.href)}>
          <span className="landing-category-icon"><category.icon size={20} /></span>
          <span className="landing-category-copy"><strong>{category.title}</strong><small>{category.text}</small></span>
        </button>)}
      </div>
      {showAll && <div className="landing-tool-index">
        {allTools.map((tool, position) => <button type="button" className={`landing-tool-chip tint-${(position % 6) + 1}`} key={tool.id} onClick={() => tool.href && !tool.load ? onNavigate(tool.href) : onOpenTool(tool.id)}>
          <span className="landing-tool-glyph"><ToolGlyph icon={tool.icon} size={15} /></span>{tool.title}
        </button>)}
      </div>}
    </section>
  </div>
}

/** Decorative brand art: the ImgMojo mark beside a stylised editor window. */
function HeroArt() {
  return <div className="landing-art" aria-hidden="true">
    <span className="landing-art-glow" />
    <div className="landing-art-screen">
      <div className="landing-art-bar"><i /><i /><i /><span>imgmojo · studio</span></div>
      <div className="landing-art-body">
        <div className="landing-art-canvas"><img src="/images/imgmojo-mark.png" alt="" width={92} height={92} /></div>
        <div className="landing-art-side"><i /><i /><i /><i /></div>
      </div>
    </div>
    <span className="landing-art-live">LIVE</span>
    <span className="landing-art-chip landing-art-chip-a"><ShieldCheck size={15} /></span>
    <span className="landing-art-chip landing-art-chip-b"><Sparkles size={15} /></span>
  </div>
}
