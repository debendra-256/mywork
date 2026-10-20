import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Bookmark, Camera, Check, ChevronDown, Clock3, Copy, DatabaseBackup, Download, Facebook, Flame, Headphones, Heart, Home, ImagePlus, Images, Instagram, KeyRound, LayoutDashboard, Lock, LockOpen, LogOut, Menu, MessageCircle, Mic, MicOff, Monitor, Pause, Play, Plus, QrCode, Search, Send, Share2, ShieldCheck, SlidersHorizontal, Sparkles, Square, Store, Trash2, Video, X, Youtube, Zap } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { appConfig } from '../config/app.config'
import { QRCodeCanvas } from 'qrcode.react'
import { promptCatalog, promptCategories } from '../data/prompt-catalog'
import { createPromptRepository } from '../data/prompt-repository'
import { imageAtWidth, responsiveImage } from '../data/prompt-image'
import { engagementFor, formatCount, useEngagement, type EngagementCounts } from '../data/prompt-engagement'
import { clearBloggerSession, connectBlogger, getBloggerAccessToken, hasBloggerSession } from '../data/blogger-auth'
import { getPromptBloggerDraftMetadata, parseBloggerEditUrl, promptBloggerDraft, publishPromptToBlogger } from '../data/blogger-publisher'
import { publishPdfProduct } from '../data/digital-products'
import { loadStoreSnapshot, storeAction } from '../data/store-admin'
import { loadCustomerSession, redeemLicenseCode, signIn, signInWithProvider, signOut, signUp, useCustomer } from '../data/customer-auth'
import { loadSocialProviders, mountGoogleSignInButton, requestFacebookToken, type SocialProviderFlags } from '../data/social-login'
import { WATERMARK_BENEFIT, productPrice, type StoreFeature, type StoreProduct, type StoreSnapshot } from '../domain/store'
import { createMenuItemId, defaultSideMenus, type SideMenuSection } from '../data/side-menus'
import { promptHashtags, promptLabels, promptTags, type Prompt } from '../domain/prompt'
import CollageStudio from '../collage/CollageStudio'
import ShortsCreator from '../shorts/ShortsCreator'

const promptRepository = createPromptRepository({
  contentProvider: appConfig.contentProvider,
  wordpressApiUrl: appConfig.wordpress.apiUrl,
  blogger: appConfig.blogger,
  pageSize: appConfig.pagination.pageSize,
})

function openNewBloggerPost() {
  const { blogId } = promptBloggerDraft
  window.open(`https://www.blogger.com/blog/posts/${encodeURIComponent(blogId)}`, '_blank', 'noopener,noreferrer')
}

function Header({ onMenu, adminLoggedIn = false }: { onMenu: () => void; adminLoggedIn?: boolean }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const signedIn = adminLoggedIn || hasBloggerSession()
  const submit = (event: FormEvent) => {
    event.preventDefault()
    navigate(`/?q=${encodeURIComponent(search)}#explore`)
  }
  return <header className="topbar">
    <button className="menu-toggle" onClick={onMenu} aria-label="Open navigation"><Menu size={21} /></button>
    <Link to="/" className="brand"><span className="brand-symbol"><Sparkles size={18} /></span><span>{appConfig.appName || 'Promptseen'}<i>.</i></span></Link>
    <nav className="top-links" aria-label="Main navigation"><Link to="/">Home</Link><a href="#trending">Trending</a><a href="#explore">Explore</a><Link to="/store">Sell online</Link><Link to="/account">My account</Link></nav>
    <form className="top-search" onSubmit={submit}><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search prompts, styles, ideas" aria-label="Search prompts" /><kbd>⌘ K</kbd></form>
    <Link className="creator-link" to={signedIn ? '/admin' : '/login'}>{signedIn ? 'Dashboard' : 'Log in'} <ArrowUpRight size={15} /></Link>
  </header>
}

function Sidebar({ open, active, categories, onSelect, onHome, onClose, menuSections, recorderOpen, qrOpen, onOpenRecorder, onOpenQr }: { open: boolean; active: string; categories: PromptFilter[]; onSelect: (category: string) => void; onHome: () => void; onClose: () => void; menuSections: SideMenuSection[]; recorderOpen: boolean; qrOpen: boolean; onOpenRecorder: () => void; onOpenQr: () => void }) {
  return <>
    {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-mobile-head"><span>Browse</span><button onClick={onClose} aria-label="Close navigation"><X size={19} /></button></div>
      <div className="side-section"><p className="side-label">YOUR SPACE</p>
        <Link className="side-item" to="/" onClick={onHome}><Home size={17} />Home</Link>
        <button className={`side-item ${active === 'All' && !recorderOpen && !qrOpen ? 'selected' : ''}`} onClick={() => onSelect('All')}><Headphones size={17} />Discover</button>
        <button className={`side-item ${recorderOpen ? 'selected' : ''}`} onClick={onOpenRecorder}><Video size={17} />Screen Recorder</button>
        <button className={`side-item ${qrOpen ? 'selected' : ''}`} onClick={onOpenQr}><QrCode size={17} />QR Code Generator</button>
        <button className={`side-item ${active === 'Trending' ? 'selected' : ''}`} onClick={() => onSelect('Trending')}><Flame size={17} />Trending prompts<span className="side-live-dot" /></button>
        <Link className="side-item" to="/collage" onClick={onClose}><Images size={17} />Photo and Video Editor</Link>
        <Link className="side-item" to="/shorts" onClick={onClose}><Youtube size={17} />YouTube to Shorts Maker</Link>
        <button className={`side-item ${active === 'Latest' ? 'selected' : ''}`} onClick={() => onSelect('Latest')}><Clock3 size={17} />Latest prompts</button>
        <button className="side-item" onClick={() => onSelect('Saved')}><Bookmark size={17} />Saved collection</button>
      </div>
      <div className="side-section side-special-menus">{menuSections.map((section) => <details className="side-menu-group" key={section.id}><summary className="side-menu-heading"><span className="side-menu-mark">{section.id === 'events' ? 'E' : 'F'}</span>{section.title}<span className="side-menu-count">{section.items.length}</span></summary><div className="side-menu-items">{section.items.map((item) => <button key={item.id} className={`side-item side-subcategory ${active === item.name ? 'selected' : ''}`} title={item.timing ? `${item.name} · ${item.timing}` : item.name} onClick={() => onSelect(item.name)}><span>{item.name}</span>{item.timing && <small>{item.timing}</small>}</button>)}</div></details>)}</div>
      <div className="side-section side-special-menus"><details className="side-menu-group" open><summary className="side-menu-heading"><span className="side-menu-mark">$</span>Sell online<span className="side-menu-count">2</span></summary><div className="side-menu-items"><Link className="side-item side-subcategory" to="/store?type=software" onClick={onClose}><span>Software</span></Link><Link className="side-item side-subcategory" to="/store?type=pdf" onClick={onClose}><span>PDF</span></Link></div></details></div>
      <div className="side-section side-categories" id="categories"><div className="side-label-row"><p className="side-label">CATEGORIES</p><SlidersHorizontal size={14} /></div>
        {categories.map((category) => <button key={category.key} className={`side-item category-side-item ${active.toLowerCase() === category.key ? 'selected' : ''}`} onClick={() => onSelect(category.label)}><span className="side-category-mark">{category.label.slice(0, 1)}</span>{category.label}</button>)}
      </div>
      <div className="sidebar-bottom"><div className="sidebar-promo"><span className="promo-icon"><Sparkles size={17} /></span><strong>Your next idea starts here.</strong><p>Browse the library and make it your own.</p><a href="#explore">Explore prompts <ArrowRight size={14} /></a></div><span className="sidebar-version">PROMPTSEEN · A CREATIVE LIBRARY</span></div>
    </aside>
  </>
}

function PromptCard({ prompt, index, saved, engagement, onToggleSave, onCopy, onHashtag }: { prompt: Prompt; index: number; saved: boolean; engagement: EngagementCounts; onToggleSave: () => void; onCopy: () => void; onHashtag: (tag: string) => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(prompt.promptText); setCopied(true); onCopy(); window.setTimeout(() => setCopied(false), 1500) } catch { setCopied(false) }
  }
  const tags = promptHashtags(prompt)
  return <article className="prompt-tile">
    <Link to={`/prompt/${prompt.slug}`} className={`tile-image tile-image-${index % 6}`}>
      {prompt.image ? <img {...responsiveImage(prompt.image, '(max-width: 700px) 45vw, 23vw')} alt={prompt.imageAlt || ''} loading="lazy" /> : <span className="tile-image-fallback"><Sparkles size={28} /></span>}
      <span className="tile-vignette" />
      <span className="tile-tag">{prompt.category}</span>
      {prompt.featured && <span className="tile-featured"><Sparkles size={12} /> EDITOR’S PICK</span>}
      <span className="tile-open"><ArrowUpRight size={17} /></span>
    </Link>
    {tags.length > 0 && <div className="tile-hashtags">{tags.map((tag) => <button key={tag} className="tile-hashtag" title={`Show every ${tag} prompt`} onClick={() => onHashtag(tag)}>#{tag}</button>)}</div>}
    <div className="tile-content"><div className="tile-heading"><Link to={`/prompt/${prompt.slug}`} className="tile-title">{prompt.title}</Link><button className={`tile-save ${saved ? 'is-saved' : ''}`} onClick={onToggleSave} aria-label={saved ? 'Remove from saved' : 'Save prompt'}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button></div>
      <p>{prompt.description}</p>
      <div className="tile-stats"><span><Copy size={11} /> {formatCount(engagement.copy)} copies</span><span><Share2 size={11} /> {formatCount(engagement.share)} shares</span></div>
      <div className="tile-footer">{!prompt.sourceUrl && <span>{prompt.tool} <b>·</b> {prompt.style}</span>}<button className="tile-copy" onClick={copy}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy prompt'}</button></div>
    </div>
  </article>
}

function FeatureHero({ prompts }: { prompts: Prompt[] }) {
  const source = prompts.length >= 4 ? prompts : [...prompts, ...promptCatalog.filter((item) => !prompts.some((prompt) => prompt.id === item.id))]
  const trending = [...source].sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt)).slice(0, 4)
  return <section className="feature-hero trending-hero" id="trending">
    <div className="trending-hero-heading"><div><span className="feature-eyebrow"><Flame size={14} /> TRENDING NOW</span></div><span className="trending-hero-count">TOP 04</span></div>
    <div className="trending-template-grid">{trending.map((prompt, index) => <Link className="trending-template-card" to={`/prompt/${prompt.slug}`} key={prompt.id}>
      <div className={`trending-template-image template-image-${index}`}>{prompt.image ? <img {...responsiveImage(prompt.image, '(max-width: 700px) 44vw, 22vw')} alt={prompt.imageAlt || prompt.title} loading="lazy" /> : <Sparkles size={28} />}<span className="trending-template-rank">0{index + 1}</span><span className="trending-template-tag">{prompt.featured ? 'TRENDING' : prompt.category}</span></div>
      <div className="trending-template-copy"><span>{prompt.tool} <b>·</b> {prompt.style}</span><h2>{prompt.title}</h2><p>{prompt.description}</p><span className="trending-template-open">View template <ArrowUpRight size={14} /></span></div>
    </Link>)}</div>
  </section>
}

interface SocialTrend {
  id: string
  platform: 'X' | 'Instagram'
  author: string
  text: string
  permalink: string
  createdAt: string
  imageUrl?: string
  engagement: number
}

interface SocialTrendResponse {
  items: SocialTrend[]
  configured: { x: boolean; instagram: boolean }
  errors: string[]
}

const scrollerTiles = { software: '/images/tile-software.png', pdf: '/images/tile-pdf.png', feature: '/images/tile-license.png' }

interface ScrollerSlide {
  key: string
  image: string
  value: string
  label: string
}

function ProductScroller() {
  const [products, setProducts] = useState<StoreProduct[]>([])
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/store/products', { signal: controller.signal })
      .then(async (response) => await response.json() as { products?: StoreProduct[] })
      .then((data) => setProducts(data.products ?? []))
      .catch(() => { /* the band simply does not render when the catalog is unreachable */ })
    return () => controller.abort()
  }, [])
  const slides = useMemo<ScrollerSlide[]>(() => products.flatMap((product) => [
    { key: product.id, image: product.imageUrl || scrollerTiles[product.type], value: product.title, label: `${product.type === 'software' ? 'Software' : 'PDF download'} · ${productPrice(product)}` },
    ...product.features.map((feature) => ({ key: `${product.id}-${feature.id}`, image: scrollerTiles.feature, value: feature.title, label: feature.tier === 'premium' ? 'Premium unlock' : 'Free for everyone' })),
  ]), [products])
  if (!slides.length) return null
  return <section className="product-scroller" aria-label="Products and software in our store">
    <div className="product-scroller-track">
      {[false, true].map((isClone) => <div className="product-scroller-set" key={isClone ? 'clone' : 'live'} aria-hidden={isClone || undefined}>
        {slides.map((slide) => <div className="product-scroller-item" key={slide.key}>
          <div className="product-scroller-tile"><i className="product-scroller-dash" /><img className="product-scroller-image" src={slide.image} alt="" width={168} height={168} loading="lazy" /></div>
          <div className="product-scroller-copy"><strong>{slide.value}</strong><span>{slide.label}</span></div>
        </div>)}
      </div>)}
    </div>
  </section>
}

function SocialTrendSection({ addedIds, onAdd }: { addedIds: Set<string>; onAdd: (trend: SocialTrend) => boolean }) {
  const [trends, setTrends] = useState<SocialTrendResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    fetch('/api/social-trends', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Social feed returned ${response.status}.`)
        return await response.json() as SocialTrendResponse
      })
      .then(setTrends)
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Could not load social trends.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [refreshKey])

  return <section className="social-trends" aria-labelledby="social-trends-title">
    <div className="social-trends-heading"><div><span className="section-kicker">LIVE FROM SOCIAL</span><h2 id="social-trends-title">Prompts people are <em>sharing.</em></h2><p>Popular public posts from X and Instagram, ranked by available engagement.</p></div><button className="social-refresh" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading} aria-label="Refresh social trends"><ArrowRight size={15} />{loading ? 'Updating' : 'Refresh'}</button></div>
    {error && <div className="social-feed-message" role="status">{error}. The live feed is available when the server API is running.</div>}
    {loading && <div className="social-feed-message"><span className="blog-status-dot" />Loading public social posts…</div>}
    {!loading && trends && trends.items.length > 0 && <div className="social-trend-grid">{trends.items.map((trend) => <article className="social-trend-card" key={`${trend.platform}-${trend.id}`}>
      {trend.imageUrl ? <a className="social-trend-image" href={trend.permalink} target="_blank" rel="noreferrer"><img src={trend.imageUrl} alt="" loading="lazy" /></a> : <div className="social-trend-image social-image-empty"><Sparkles size={22} /></div>}
      <div className="social-trend-copy"><div className="social-trend-meta"><span className={`social-platform ${trend.platform === 'Instagram' ? 'instagram' : 'x-platform'}`}>{trend.platform === 'Instagram' ? <b>◎</b> : <b>𝕏</b>}{trend.platform}</span><span>{trend.engagement.toLocaleString()} interactions</span></div>
        <p>{trend.text}</p><div className="social-trend-footer"><span>@{trend.author}</span><a href={trend.permalink} target="_blank" rel="noreferrer">View post <ArrowUpRight size={13} /></a></div><button className="social-add-button" disabled={addedIds.has(`${trend.platform.toLowerCase()}-${trend.id}`)} onClick={() => { setSaveError(''); if (!onAdd(trend)) setSaveError('Could not add this post. Browser storage may be full.') }}>{addedIds.has(`${trend.platform.toLowerCase()}-${trend.id}`) ? <><Check size={13} /> Added to library</> : <><Plus size={13} /> Add to library</>}</button>
      </div>
    </article>)}</div>}
    {saveError && <div className="social-feed-error" role="alert">{saveError}</div>}
    {!loading && trends && trends.items.length === 0 && <div className="social-feed-message">{trends.configured.x || trends.configured.instagram ? 'No matching public posts were returned. Try broader search terms or hashtags.' : 'Add X and Instagram API credentials to the server environment to show live posts.'}</div>}
    {!loading && trends?.errors.map((message) => <div className="social-feed-error" key={message}>{message}</div>)}
  </section>
}

interface PromptFilter { key: string; label: string; count: number }

/** Labels handled by the built-in pills instead of getting one of their own. */
const reservedFilterKeys = new Set(['all', 'trending', 'latest', 'saved', 'featured'])

/** Filter choices read from the loaded prompts, so a tag the blog actually uses is never missing. */
function collectPromptFilters(prompts: Prompt[]): PromptFilter[] {
  const curated = promptCategories.filter((name) => name !== 'Trending' && name !== 'Latest')
  const found = new Map<string, PromptFilter>()
  for (const prompt of prompts) {
    const counted = new Set<string>()
    for (const label of promptLabels(prompt)) {
      const key = label.toLowerCase()
      if (counted.has(key) || reservedFilterKeys.has(key)) continue
      counted.add(key)
      const existing = found.get(key)
      if (existing) existing.count += 1
      else found.set(key, { key, label: curated.find((name) => name.toLowerCase() === key) ?? label, count: 1 })
    }
  }
  const curatedRank = new Map(curated.map((name, index) => [name.toLowerCase(), index]))
  const present = [...found.values()].sort((a, b) => (curatedRank.get(a.key) ?? 100) - (curatedRank.get(b.key) ?? 100) || b.count - a.count || a.key.localeCompare(b.key))
  const unused = curated.filter((name) => !found.has(name.toLowerCase())).map((name) => ({ key: name.toLowerCase(), label: name, count: 0 }))
  return [...present, ...unused]
}

/** Prompt tiles shown per page of the library grid. */
const libraryPageSize = 24

/** Current page plus at most two neighbours on each side, always including the first and last page. */
function pageNumbers(current: number, total: number): (number | 'gap')[] {
  const wanted = new Set([1, total, current, current - 1, current + 1, current - 2, current + 2])
  const pages = [...wanted].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
  const withGaps: (number | 'gap')[] = []
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) withGaps.push('gap')
    withGaps.push(page)
  })
  return withGaps
}

function CategoryPills({ active, categories, onSelect }: { active: string; categories: PromptFilter[]; onSelect: (category: string) => void }) {
  const visible: PromptFilter[] = [{ key: 'all', label: 'All', count: 0 }, { key: 'trending', label: 'Trending', count: 0 }, { key: 'latest', label: 'Latest', count: 0 }, ...categories.filter((category) => category.count > 0)]
  return <div className="category-pills" aria-label="Filter by category">{visible.map((item) => <button key={item.key} className={active.toLowerCase() === item.key ? 'category-pill active' : 'category-pill'} onClick={() => onSelect(item.label)}>{item.label === 'Trending' && <Flame size={14} />}{item.label === 'Latest' && <Clock3 size={14} />}{item.label !== 'Trending' && item.label !== 'Latest' && item.label !== 'All' && <span className="pill-mark">✳</span>}{item.label}</button>)}</div>
}

function HomePhotoPromptGenerator({ canGenerate }: { canGenerate: boolean }) {
  const [generatorMode, setGeneratorMode] = useState<'text' | 'image'>('text')
  const [photo, setPhoto] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [instruction, setInstruction] = useState('')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const choosePhoto = (file: File | undefined) => {
    setError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPG, PNG, or WebP photo.'); return }
    if (file.size > 3 * 1024 * 1024) { setError('Choose an image smaller than 3 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') { setPhoto(reader.result); setPhotoName(file.name) }
      else setError('Could not read this photo. Try another one.')
    }
    reader.onerror = () => setError('Could not read this photo. Try another one.')
    reader.readAsDataURL(file)
  }
  const generate = async () => {
    if (generatorMode === 'image' && !photo) { setError('Choose a photo first.'); return }
    if (generatorMode === 'text' && !instruction.trim()) { setError('Describe a prompt idea first.'); return }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: generatorMode === 'image' ? photo : '', instruction }),
      })
      const result = await response.json().catch(() => ({})) as { prompt?: string; error?: string }
      if (!response.ok || !result.prompt) throw new Error(result.error || `Prompt generation failed (${response.status}).`)
      setPrompt(result.prompt)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not generate a prompt from this photo.') }
    finally { setBusy(false) }
  }
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(prompt) } catch { setError('Could not copy the prompt. Select the text and copy it instead.') }
  }
  return <section className="home-photo-generator" aria-labelledby="home-photo-generator-title"><div className="home-photo-generator-heading"><span className="section-kicker">AI PROMPT GENERATOR</span><h2 id="home-photo-generator-title">Free AI Prompt Generator</h2></div>{canGenerate ? <div className="home-photo-generator-workspace"><div className="home-prompt-composer"><textarea aria-label="Describe an image to generate a prompt for" value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Generate a prompt for..." rows={5} /><div className="home-prompt-composer-footer"><label className="home-generator-mode"><select value={generatorMode} aria-label="Input mode" onChange={(event) => { const mode = event.target.value as 'text' | 'image'; setGeneratorMode(mode); setError('') }}><option value="text">Text</option><option value="image">Image</option></select><ChevronDown size={15} /></label><label className="home-image-attach"><ImagePlus size={15} />{photo ? photoName : 'Add image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setGeneratorMode('image'); choosePhoto(event.currentTarget.files?.[0]) }} /></label><button className="home-photo-generate-button" type="button" onClick={() => void generate()} disabled={busy || (generatorMode === 'image' ? !photo : !instruction.trim())}>{busy ? 'Generating…' : 'Generate'} <ArrowRight size={16} /></button></div></div>{generatorMode === 'image' && photo && <div className="home-photo-selected"><img src={photo} alt="Selected photo preview" /><span>{photoName}</span></div>}{prompt && <div className="home-generated-prompt"><label htmlFor="generated-home-prompt">Generated prompt</label><textarea id="generated-home-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={7} /><button type="button" onClick={() => void copyPrompt()}><Copy size={14} /> Copy prompt</button></div>}{error && <p className="editor-error" role="alert">{error}</p>}</div> : <div className="home-photo-generator-login"><p>Sign in with your Blogger account to use the prompt generator.</p><Link to="/login" className="home-photo-generate-button">Sign in to generate <ArrowRight size={15} /></Link></div>}</section>
}

function videoReady(video: HTMLVideoElement): Promise<void> {
  if (video.videoWidth) return Promise.resolve()
  return new Promise<void>((resolve) => { video.onloadedmetadata = () => resolve() })
}

function paintWatermark(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string) {
  const bar = Math.max(30, Math.round(canvas.height / 16))
  const pad = Math.max(12, Math.round(canvas.height / 34))
  const mark = (label: string, y: number) => {
    context.save()
    context.font = `700 ${Math.max(14, Math.round(canvas.height / 24))}px system-ui, -apple-system, Segoe UI, sans-serif`
    context.textBaseline = 'middle'
    const labelWidth = context.measureText(label).width
    context.globalAlpha = 0.4
    context.fillStyle = '#0b0f0d'
    context.beginPath()
    context.roundRect((canvas.width - labelWidth - bar * 1.5) / 2, y, labelWidth + bar * 1.5, bar, bar * 0.45)
    context.fill()
    context.globalAlpha = 0.92
    context.fillStyle = '#ffffff'
    context.fillText(label, (canvas.width - labelWidth) / 2, y + bar / 2)
    context.restore()
  }
  mark(text, pad)
  mark(`${text} · free version`, canvas.height - pad - bar)
}

function ScreenRecorder() {
  const [title, setTitle] = useState('Screen recording')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraOnly, setCameraOnly] = useState(false)
  const [recording, setRecording] = useState(false)
  const [starting, setStarting] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const [watermarkText, setWatermarkText] = useState(appConfig.appName || 'Promptseen')
  const customer = useCustomer()
  const watermarkFree = customer.benefits.includes(WATERMARK_BENEFIT)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const tracksRef = useRef<MediaStream[]>([])
  const chunksRef = useRef<Blob[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/store/products', { signal: controller.signal })
      .then(async (response) => await response.json() as { products?: StoreProduct[] })
      .then((data) => {
        const owner = (data.products ?? []).find((product) => product.features.some((feature) => feature.benefitKey === WATERMARK_BENEFIT))
        if (owner?.watermarkText) setWatermarkText(owner.watermarkText)
      })
      .catch(() => { /* the shipped product name is a fine fallback watermark */ })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream
      void videoRef.current.play().catch(() => undefined)
    }
  }, [previewStream])
  useEffect(() => {
    if (!recording || paused) return
    timerRef.current = window.setInterval(() => setSeconds((time) => time + 1), 1000)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [recording, paused])
  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    tracksRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
  }, [])

  const start = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || (!cameraOnly && !navigator.mediaDevices.getDisplayMedia) || !window.MediaRecorder) {
      setError('Screen recording needs a supported desktop browser and a secure connection (HTTPS).')
      return
    }
    setStarting(true)
    let screen: MediaStream | null = null
    let camera: MediaStream | null = null
    let mic: MediaStream | null = null
    let canvasStream: MediaStream | null = null
    let rafFrame = 0
    let lastPaint = 0
    let haltCompositor = () => {}
    try {
      screen = cameraOnly
        ? await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60, max: 60 } }, audio: audioEnabled ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false })
        : await navigator.mediaDevices.getDisplayMedia({ video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60, max: 60 } }, audio: audioEnabled })
      if (cameraEnabled) camera = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60, max: 60 } }, audio: false })
      if (audioEnabled && !cameraOnly) {
        try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }) }
        catch { setError('Microphone access was unavailable. Recording will continue with shared-tab audio, if selected.') }
      }
      let videoTracks = screen.getVideoTracks()
      if (camera || !watermarkFree) {
        const displayVideo = document.createElement('video')
        const cameraVideo = document.createElement('video')
        displayVideo.muted = true; cameraVideo.muted = true
        displayVideo.srcObject = screen
        if (camera) cameraVideo.srcObject = camera
        await Promise.all([displayVideo.play(), camera ? cameraVideo.play() : Promise.resolve()])
        await Promise.all([videoReady(displayVideo), ...(camera ? [videoReady(cameraVideo)] : [])])
        const canvas = document.createElement('canvas')
        canvas.width = displayVideo.videoWidth || 1280; canvas.height = displayVideo.videoHeight || 720
        const context = canvas.getContext('2d')
        if (!context || !canvas.captureStream) throw new Error('This browser cannot composite the recording. Try another browser.')
        const paint = () => {
          const now = performance.now()
          if (now - lastPaint < 16) return
          lastPaint = now
          try {
            if (!displayVideo.videoWidth) return
            context.drawImage(displayVideo, 0, 0, canvas.width, canvas.height)
            if (camera && cameraVideo.videoWidth) {
              const diameter = Math.min(canvas.width, canvas.height) * 0.22
              const x = canvas.width - diameter - 28; const y = canvas.height - diameter - 28
              context.save(); context.beginPath(); context.arc(x + diameter / 2, y + diameter / 2, diameter / 2, 0, Math.PI * 2); context.clip()
              context.drawImage(cameraVideo, x, y, diameter, diameter)
            }
            if (!watermarkFree) paintWatermark(context, canvas, watermarkText)
          } catch { /* an interrupted or resized capture surface should cost a frame, not the whole recording */ }
          finally { context.restore() }
        }
        // rAF stops as soon as this tab stops painting (another tab, or the recorded window on top of
        // the browser), so a timer keeps compositing; paint() itself caps the rate at 60 fps.
        const loop = () => { paint(); rafFrame = requestAnimationFrame(loop) }
        loop()
        const watchdog = window.setInterval(paint, 100)
        haltCompositor = () => { cancelAnimationFrame(rafFrame); window.clearInterval(watchdog) }
        canvasStream = canvas.captureStream(60)
        videoTracks = canvasStream.getVideoTracks()
      }
      const composed = new MediaStream([...videoTracks, ...screen.getAudioTracks(), ...(mic?.getAudioTracks() ?? [])])
      const streams = [screen, ...(camera ? [camera] : []), ...(mic ? [mic] : []), ...(canvasStream ? [canvasStream] : [])]
      tracksRef.current = streams
      setPreviewStream(composed)
      chunksRef.current = []
      for (let count = 5; count >= 1; count -= 1) {
        setCountdown(count)
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
      }
      setCountdown(null)
      const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type))
      const surface = screen.getVideoTracks()[0]?.getSettings()
      const pixels = (surface?.width ?? 1920) * (surface?.height ?? 1080)
      // A flat 50 Mbps starves the encoder on a laptop-sized surface and the take stalls after a few
      // seconds, so scale the target with the captured resolution and keep 4K at the old ceiling.
      const videoBitsPerSecond = Math.min(50000000, Math.max(4000000, Math.round(pixels * 60 * 0.06)))
      const recorder = new MediaRecorder(composed, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond, audioBitsPerSecond: 192000 })
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${title.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-') || 'screen-recording'}.webm`
        anchor.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        streams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
        haltCompositor()
        setPreviewStream(null); setRecording(false); setPaused(false); setStarting(false); setCountdown(null)
      }
      screen.getVideoTracks()[0]?.addEventListener('ended', () => { if (recorder.state !== 'inactive') recorder.stop() }, { once: true })
      recorder.start(1000)
      recorderRef.current = recorder
      setSeconds(0); setRecording(true); setPaused(false); setStarting(false)
    } catch (reason) {
      ;[screen, camera, mic].filter((stream): stream is MediaStream => Boolean(stream)).forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
      canvasStream?.getTracks().forEach((track) => track.stop())
      haltCompositor()
      setPreviewStream(null)
      setStarting(false); setCountdown(null)
      setError(reason instanceof Error ? reason.message : 'Could not start screen recording. Check browser permissions and try again.')
    }
  }
  const stop = () => { if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop() }
  const togglePause = () => {
    const recorder = recorderRef.current
    if (!recorder) return
    if (recorder.state === 'recording') { recorder.pause(); setPaused(true) }
    else if (recorder.state === 'paused') { recorder.resume(); setPaused(false) }
  }
  const timeLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return <section className="home-photo-generator recorder-generator" aria-label="Screen recording controls">
    <div className="recorder-layout">
      <aside className="recorder-settings">
        <label>Recording title<input value={title} onChange={(event) => setTitle(event.target.value)} disabled={recording} placeholder="Recording title" /></label>
        <div className="recorder-setting-label">Capture</div>
        <div className="recorder-quality-badge"><span>4K</span><strong>Ultra HD</strong><small>Up to 2160p · 60 fps</small></div>
        <div className={`recorder-tier-badge ${watermarkFree ? 'pro' : 'free'}`}>{watermarkFree ? <BadgeCheck size={16} /> : <Lock size={16} />}<div><strong>{watermarkFree ? 'Watermark free' : 'Free version'}</strong><small>{watermarkFree ? 'Your downloads export clean.' : `Downloads carry a “${watermarkText}” watermark.`}</small></div>{!watermarkFree && <Link className="recorder-upgrade" to={customer.user ? '/store?type=software' : '/account'} onClick={() => { if (recording) setError('Start a clean recording after unlocking to remove the watermark.') }}>{customer.user ? 'Remove watermark' : 'Have a code? Redeem it'} <ArrowRight size={13} /></Link>}</div>
        <button className={`recorder-option ${!cameraEnabled && !cameraOnly ? 'active' : ''}`} onClick={() => { setCameraEnabled(false); setCameraOnly(false) }} disabled={recording}><Monitor size={17} />Screen</button>
        <button className={`recorder-option ${cameraEnabled ? 'active' : ''}`} onClick={() => { setCameraEnabled(true); setCameraOnly(false) }} disabled={recording}><Monitor size={17} /><Camera size={15} />Screen &amp; Camera</button>
        <button className={`recorder-option ${cameraOnly ? 'active' : ''}`} onClick={() => { setCameraEnabled(false); setCameraOnly(true) }} disabled={recording}><Camera size={17} />Camera only</button>
        <label className="recorder-mic"><span>{audioEnabled ? <Mic size={17} /> : <MicOff size={17} />} Microphone</span><input type="checkbox" checked={audioEnabled} onChange={(event) => setAudioEnabled(event.target.checked)} disabled={recording} /></label>
        {(cameraEnabled || cameraOnly) && <p className="recorder-hint">{cameraOnly ? 'Record from your webcam without sharing your screen.' : 'Your camera appears as a bubble over the shared screen.'}</p>}
      </aside>
      <div className="recorder-preview">
        {previewStream ? <video ref={videoRef} muted playsInline /> : <div className="recorder-preview-empty"><span><Monitor size={29} /></span><strong>{recording ? 'Recording in progress' : 'Ready to record'}</strong><p>Choose a screen or window after clicking Record.</p></div>}
        {countdown !== null && <div className="recorder-countdown" aria-live="assertive"><span>{countdown}</span><strong>Get ready</strong></div>}
        {recording && <span className="recorder-live"><i />{paused ? 'Paused' : 'Recording'} · {timeLabel}</span>}
        <div className="recorder-controls">{!recording ? <button className="recorder-record" onClick={() => void start()} disabled={starting}><span />{starting ? 'Starting…' : 'Start recording'}</button> : <><button className="recorder-pause" onClick={togglePause}>{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? 'Resume' : 'Pause'}</button><button className="recorder-stop" onClick={stop}><Square size={14} fill="currentColor" />Stop &amp; download <Download size={14} /></button></>}</div>
      </div>
    </div>
    {error && <p className="recorder-error" role="alert">{error}</p>}
  </section>
}

function RecorderFullscreen({ onClose }: { onClose: () => void }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [])
  return <div className="recorder-fullscreen">
    <div className="recorder-fullscreen-bar"><div><Video size={17} /><strong>Screen Recorder</strong><small>Full screen while you capture</small></div><button className="recorder-fullscreen-close" type="button" onClick={onClose}><X size={15} />Exit full screen</button></div>
    <div className="recorder-fullscreen-body"><ScreenRecorder /></div>
  </div>
}

function QRCodeGenerator() {
  const [value, setValue] = useState('')
  const [qrColor, setQrColor] = useState('#17231c')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [size, setSize] = useState(320)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const download = () => {
    const canvas = qrCanvasRef.current
    if (!canvas || !value.trim()) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'promptseen-qr-code.png'
    link.click()
  }

  return <section className="home-photo-generator qr-generator" aria-label="QR code generator">
    <div className="qr-generator-layout">
      <div className="qr-generator-settings">
        <label className="qr-field-label" htmlFor="qr-generator-value">Link or text</label>
        <textarea id="qr-generator-value" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Paste a link or enter text" rows={5} />
        <div className="qr-color-fields">
          <label>QR color<input type="color" value={qrColor} onChange={(event) => setQrColor(event.target.value)} /></label>
          <label>Background<input type="color" value={bgColor} onChange={(event) => setBgColor(event.target.value)} /></label>
        </div>
        <label className="qr-size-field">Image size <span>{size}px</span><input type="range" min="160" max="640" step="32" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label>
        <div className="qr-generator-actions"><button type="button" className="qr-clear-button" onClick={() => setValue('')} disabled={!value}><X size={15} />Clear</button><button type="button" className="qr-download-button" onClick={download} disabled={!value.trim()}><Download size={16} />Download PNG</button></div>
      </div>
      <div className="qr-generator-preview">
        <div className="qr-preview-frame" style={{ backgroundColor: bgColor }}>
          {value.trim() ? <QRCodeCanvas ref={qrCanvasRef} value={value.trim()} size={size} fgColor={qrColor} bgColor={bgColor} level="H" marginSize={2} /> : <div className="qr-preview-empty"><QrCode size={68} strokeWidth={1.2} /><span>Your QR code will appear here</span></div>}
        </div>
        <strong>{value.trim() ? 'Ready to scan' : 'Enter a link or text to begin'}</strong>
        <p>PNG download · {size} × {size} px</p>
      </div>
    </div>
  </section>
}

function HomePage({ prompts, blogStatus, canGenerate, onAddTrend, menuSections, adminLoggedIn = false }: { prompts: Prompt[]; blogStatus: 'idle' | 'loading' | 'connected' | 'error'; canGenerate: boolean; onAddTrend: (trend: SocialTrend) => boolean; menuSections: SideMenuSection[]; adminLoggedIn?: boolean }) {
  const [active, setActive] = useState('All')
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '')
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [recorderOpen, setRecorderOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [page, setPage] = useState(1)
  const { counts, record } = useEngagement()
  const utilityOpen = recorderOpen || qrOpen
  const location = useLocation()
  useEffect(() => { setQuery(new URLSearchParams(location.search).get('q') ?? '') }, [location.search])
  const filters = useMemo(() => collectPromptFilters(prompts), [prompts])
  const shown = useMemo(() => {
    const term = query.trim().toLowerCase()
    const tag = active.toLowerCase()
    let items = prompts
    if (active === 'Trending') items = items.filter((item) => item.featured || promptTags(item).includes('trending'))
    else if (active === 'Latest') items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    else if (active === 'Saved') items = items.filter((item) => savedIds.includes(item.id))
    else if (tag !== 'all') items = items.filter((item) => promptTags(item).includes(tag))
    if (term) items = items.filter((item) => `${item.title} ${item.description} ${item.category} ${item.tool} ${item.style} ${promptTags(item).join(' ')}`.toLowerCase().includes(term))
    return items
  }, [active, query, savedIds, prompts])
  useEffect(() => { setPage(1) }, [active, query, savedIds])
  const toggleSave = (id: string) => setSavedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])
  const totalPages = Math.max(1, Math.ceil(shown.length / libraryPageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = shown.slice((currentPage - 1) * libraryPageSize, currentPage * libraryPageSize)
  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages))
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
  }
  /** A hashtag on a tile filters the library the way a pill does, then returns to the top of the grid. */
  const showHashtag = (tag: string) => {
    setActive(tag)
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
  }
  const addedTrendIds = useMemo(() => new Set(prompts.filter((prompt) => prompt.id.startsWith('social-')).map((prompt) => prompt.id.slice('social-'.length))), [prompts])
  const title = active === 'All' ? 'All prompts' : active === 'Saved' ? 'Your saved prompts' : active === 'Trending' ? 'Trending prompts' : active === 'Latest' ? 'Latest prompts' : `${active} prompts`
  return <div className="app-layout"><Header onMenu={() => setSidebarOpen(true)} adminLoggedIn={adminLoggedIn} /><div className="page-body"><Sidebar open={sidebarOpen} active={active} categories={filters} onHome={() => { setActive('All'); setQuery(''); setRecorderOpen(false); setQrOpen(false); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} recorderOpen={recorderOpen} qrOpen={qrOpen} onOpenRecorder={() => { setRecorderOpen(true); setQrOpen(false); setSidebarOpen(false); window.setTimeout(() => document.getElementById('home-generator-area')?.scrollIntoView({ behavior: 'smooth' }), 0) }} onOpenQr={() => { setQrOpen(true); setRecorderOpen(false); setSidebarOpen(false); window.setTimeout(() => document.getElementById('home-generator-area')?.scrollIntoView({ behavior: 'smooth' }), 0) }} onSelect={(category) => { setActive(category); setRecorderOpen(false); setQrOpen(false); setSidebarOpen(false); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' }) }} onClose={() => setSidebarOpen(false)} menuSections={menuSections} />
    <main className={`main-content ${utilityOpen ? 'recorder-main-wide' : ''}`}><div className={`content-inner ${utilityOpen ? 'recorder-content-wide' : ''}`}><div id="home-generator-area">{recorderOpen ? null : qrOpen ? <QRCodeGenerator /> : <HomePhotoPromptGenerator canGenerate={canGenerate} />}</div>{recorderOpen && <RecorderFullscreen onClose={() => setRecorderOpen(false)} />}<FeatureHero prompts={prompts} /><ProductScroller /><SocialTrendSection addedIds={addedTrendIds} onAdd={onAddTrend} />
      <section className="browse-section" id="explore"><div className="section-topline"><div><span className="section-kicker">THE PROMPT LIBRARY</span><h2>Find your next <em>favorite.</em></h2></div><span className="collection-count">{prompts.length} IDEAS <span>↗</span></span></div>
        
        <div className="inline-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prompts, styles, ideas" aria-label="Filter the prompt library" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}</div>
        <CategoryPills active={active} categories={filters} onSelect={setActive} />
        <div className="results-heading"><div><span className="results-label">BROWSE THE LIBRARY</span><h3>{title}</h3></div><span className="results-number">{String(shown.length).padStart(2, '0')} <span>prompts</span></span></div>
        {shown.length ? <><div className="prompt-grid">{pageItems.map((prompt, index) => <PromptCard key={prompt.id} prompt={prompt} index={(currentPage - 1) * libraryPageSize + index} saved={savedIds.includes(prompt.id)} engagement={engagementFor(counts, prompt.id)} onToggleSave={() => toggleSave(prompt.id)} onCopy={() => record(prompt.id, 'copy')} onHashtag={showHashtag} />)}</div>{totalPages > 1 && <nav className="library-pagination" aria-label="Prompt pages"><button className="pagination-edge" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><ArrowLeft size={15} /> Prev</button><div className="pagination-pages">{pageNumbers(currentPage, totalPages).map((entry, index) => entry === 'gap' ? <span className="pagination-gap" key={`gap-${index}`}>…</span> : <button key={entry} className={`pagination-page ${entry === currentPage ? 'is-current' : ''}`} onClick={() => goToPage(entry)} aria-current={entry === currentPage ? 'page' : undefined}>{entry}</button>)}</div><span className="pagination-range">{String((currentPage - 1) * libraryPageSize + 1).padStart(2, '0')}–{String((currentPage - 1) * libraryPageSize + pageItems.length).padStart(2, '0')} of {String(shown.length).padStart(2, '0')}</span><button className="pagination-edge" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next <ArrowRight size={15} /></button></nav>}</> : <div className="no-results"><span>✳</span><h3>{blogStatus === 'connected' && prompts.length === 0 ? 'No published posts yet' : 'No prompts here yet'}</h3><p>{blogStatus === 'connected' && prompts.length === 0 ? 'Your Blogger connection is working. Publish a post on the blog and it will appear here.' : 'Try another category or search term.'}</p>{!(blogStatus === 'connected' && prompts.length === 0) && <button onClick={() => { setActive('All'); setQuery('') }}>Show all prompts <ArrowRight size={15} /></button>}</div>}
      </section>
      <footer className="page-footer"><Link to="/" className="brand"><span className="brand-symbol"><Sparkles size={15} /></span><span>Promptseen<i>.</i></span></Link><p>Good ideas like being shared.</p><div className="community-links"><strong>Join our community</strong><nav aria-label="Join our social communities">{appConfig.community.whatsappPhone && <a className="community-whatsapp" href={`https://wa.me/${appConfig.community.whatsappPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>}{appConfig.community.instagramUsername && <a className="community-instagram" href={`https://instagram.com/${encodeURIComponent(appConfig.community.instagramUsername)}`} target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a>}{appConfig.community.facebookPageId && <a className="community-facebook" href={`https://facebook.com/${encodeURIComponent(appConfig.community.facebookPageId)}`} target="_blank" rel="noreferrer"><Facebook size={16} /> Facebook</a>}{appConfig.community.telegramUsername && <a className="community-telegram" href={`https://t.me/${encodeURIComponent(appConfig.community.telegramUsername)}`} target="_blank" rel="noreferrer"><Send size={16} /> Telegram</a>}</nav></div><span>© {new Date().getFullYear()} Promptseen</span></footer>
    </div></main></div></div>
}

function StoreFeatureList({ features, benefits }: { features: StoreFeature[]; benefits: string[] }) {
  if (!features.length) return null
  return <ul className="store-feature-list">{features.map((feature) => {
    const premium = feature.tier === 'premium'
    const active = premium ? (feature.benefitKey ? benefits.includes(feature.benefitKey) : false) : true
    return <li className={`store-feature ${premium ? 'store-feature-premium' : ''} ${premium && !active ? 'store-feature-locked' : ''}`} key={feature.id}>
      {premium ? (active ? <LockOpen size={13} /> : <Lock size={13} />) : <Check size={13} />}
      <span><strong>{feature.title}</strong>{feature.description && <small>{feature.description}</small>}</span>
      {premium && <em>{active ? 'UNLOCKED' : 'PREMIUM'}</em>}
    </li>
  })}</ul>
}

function StorePage() {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState(() => new URLSearchParams(window.location.search).get('type') || 'all')
  const customer = useCustomer()
  useEffect(() => {
    fetch('/api/store/products').then(async (response) => {
      const data = await response.json() as { products?: StoreProduct[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not load products.')
      setProducts(data.products ?? [])
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Store is unavailable.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { setCategory(new URLSearchParams(location.search).get('type') || 'all') }, [location.search])
  const visible = products.filter((product) => category === 'all' || product.type === category)
  return <div className="detail-shell store-shell"><Header onMenu={() => {}} /><main className="store-page"><Link className="store-back-link" to="/"><ArrowLeft size={14} /> Prompt library</Link><section className="store-hero"><span className="feature-eyebrow"><Store size={14} /> DIGITAL GOODS</span><h1>Sell online</h1><p>Software and practical PDFs with every feature listed up front. Premium features unlock the moment your license code is redeemed.</p></section><nav className="store-filters" aria-label="Product categories"><Link className={category === 'all' ? 'active' : ''} to="/store">All products</Link><Link className={category === 'software' ? 'active' : ''} to="/store?type=software">Software</Link><Link className={category === 'pdf' ? 'active' : ''} to="/store?type=pdf">PDF</Link></nav>{loading && <div className="store-empty">Loading products…</div>}{error && <div className="store-empty store-error" role="alert">{error}</div>}{!loading && !error && visible.length === 0 && <div className="store-empty"><span><Copy size={23} /></span><h2>No products listed yet</h2><p>Products and their feature lists come from the store database. Add them in Creator Studio under Digital store.</p></div>}{visible.length > 0 && <div className="store-product-grid">{visible.map((product) => <article className={`store-product-card ${product.premium ? 'store-product-premium' : ''}`} key={product.id}><div className="store-product-image">{product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : product.type === 'pdf' ? <Copy size={31} /> : <Sparkles size={31} />}<span>{product.type === 'pdf' ? 'PDF' : 'SOFTWARE'}</span>{product.premium && <em className="store-premium-flag">PREMIUM</em>}</div><div className="store-product-copy"><h2>{product.title}</h2><p>{product.description}</p><StoreFeatureList features={product.features} benefits={customer.benefits} />{product.features.some((feature) => feature.tier === 'premium') && <p className="store-feature-hint">Premium features unlock after payment.</p>}<div className="store-product-buy"><strong>{productPrice(product)}</strong><Link to={`/checkout/${encodeURIComponent(product.id)}`}>Buy now <ArrowRight size={15} /></Link></div></div></article>)}</div>}<p className="store-security-note"><ShieldCheck size={14} /> Pay with the on-screen instructions, then redeem your license code in your account to unlock premium features.</p></main></div>
}

function CheckoutPage() {
  const { productId = '' } = useParams()
  const [product, setProduct] = useState<StoreProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const customer = useCustomer()
  useEffect(() => {
    fetch('/api/store/products').then(async (response) => {
      const data = await response.json() as { products?: StoreProduct[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'Could not load product.')
      setProduct((data.products ?? []).find((item) => item.id === productId) ?? null)
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Store is unavailable.'))
      .finally(() => setLoading(false))
  }, [productId])
  return <div className="detail-shell store-shell"><Header onMenu={() => {}} /><main className="checkout-page"><Link className="store-back-link" to="/store"><ArrowLeft size={14} /> Back to products</Link><section className="checkout-card"><div className="checkout-icon"><ShieldCheck size={24} /></div><span className="section-kicker">PAYMENT</span><h1>{loading ? 'Loading checkout…' : product?.title || 'Product unavailable'}</h1>{product && <><p className="checkout-description">{product.description}</p><div className="checkout-summary"><span>{product.type === 'pdf' ? 'PDF download' : 'Software access'}</span><strong>{productPrice(product)}</strong></div><div className="checkout-feature-panel"><span className="admin-kicker">WHAT YOU GET</span><StoreFeatureList features={product.features} benefits={customer.benefits} /></div><ol className="checkout-steps"><li><span>1</span><div><strong>Pay the listed price</strong><p>Payment is handled by the store owner. Open the store page or reply to the link you were sent to arrange it.</p></div></li><li><span>2</span><div><strong>Receive your license code</strong><p>After the payment is confirmed you are sent a code, for example PS-A1B2-C3D4-E5F6.</p></div></li><li><span>3</span><div><strong>Redeem it in your account</strong><p>Signing in and redeeming unlocks every premium feature on this product, such as watermark-free recording.</p></div></li></ol><div className="checkout-redeem-row">{customer.user ? <><BadgeCheck size={16} /> <span>Signed in as {customer.user.email}</span><Link to="/account">Manage license <ArrowRight size={14} /></Link></> : <><KeyRound size={16} /> <span>Already paid? Sign in and redeem your code.</span><Link to="/account">Go to my account <ArrowRight size={14} /></Link></>}</div></>}{error && <p className="checkout-error" role="alert">{error}</p>}{!loading && !product && !error && <p className="checkout-error">This product is no longer available.</p>}</section></main></div>
}

function benefitLabels(products: StoreProduct[], benefitKey: string) {
  const matches: string[] = []
  for (const product of products) for (const feature of product.features) if (feature.benefitKey === benefitKey) matches.push(`${product.title} · ${feature.title}`)
  return matches
}

function AccountPage() {
  const customer = useCustomer()
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    fetch('/api/store/products').then(async (response) => {
      const data = await response.json() as { products?: StoreProduct[] }
      setProducts(data.products ?? [])
    }).catch(() => setProducts([]))
  }, [])
  useEffect(() => { void loadCustomerSession() }, [])
  const [providers, setProviders] = useState<SocialProviderFlags>({ google: false, facebook: false })
  const [facebookBusy, setFacebookBusy] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { void loadSocialProviders().then(setProviders) }, [])
  const completeSocialSignIn = async (provider: 'google' | 'facebook', credential: string) => {
    setBusy(true); setError(''); setNotice('')
    try {
      await signInWithProvider(provider, credential)
      setNotice(`Signed in with ${provider === 'google' ? 'Google' : 'Facebook'}. Your premium features appear here once redeemed.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Social sign-in failed.') }
    finally { setBusy(false); setFacebookBusy(false) }
  }
  useEffect(() => {
    if (!providers.google || customer.user || !googleButtonRef.current) return
    mountGoogleSignInButton(googleButtonRef.current, (credential) => { void completeSocialSignIn('google', credential) })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Google sign-in could not load.'))
  }, [providers.google, customer.user])
  const facebookSignIn = async () => {
    setFacebookBusy(true); setError(''); setNotice('')
    try { await completeSocialSignIn('facebook', await requestFacebookToken()) }
    catch (reason) { setFacebookBusy(false); setError(reason instanceof Error ? reason.message : 'Facebook sign-in failed.') }
  }
  const socialRow = providers.google || providers.facebook ? <div className="account-social"><div className="login-divider"><span />or<span /></div>{providers.google && <div className="account-google-button" ref={googleButtonRef} />}{providers.facebook && <button className="account-facebook-button" type="button" onClick={() => { void facebookSignIn() }} disabled={busy || facebookBusy}><Facebook size={17} /> {facebookBusy ? 'Connecting…' : 'Continue with Facebook'}</button>}</div> : null
  const authenticate = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'signup') { await signUp(email, password, displayName); setNotice('Account created. Your premium features appear here once redeemed.') }
      else { await signIn(email, password); setNotice('Signed in.') }
      setPassword('')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not complete that request.') }
    finally { setBusy(false) }
  }
  const redeem = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      await redeemLicenseCode(code)
      setNotice('License redeemed. Premium features are now unlocked in this account.')
      setCode('')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not redeem that code.') }
    finally { setBusy(false) }
  }
  const logout = () => { void signOut(); setError(''); setNotice('Signed out.') }
  return <div className="detail-shell store-shell"><Header onMenu={() => {}} /><main className="account-page"><Link className="store-back-link" to="/"><ArrowLeft size={14} /> Back to the library</Link>{customer.user ? <section className="account-card"><div className="account-card-head"><span className="section-kicker">MY ACCOUNT</span><h1>{customer.user.displayName || customer.user.email}</h1><p>{customer.user.signupSource === 'password' ? customer.user.email : `Signed in with ${customer.user.signupSource === 'google' ? 'Google' : 'Facebook'}`}</p></div><div className="account-unlocks"><span className="admin-kicker">UNLOCKED PREMIUM FEATURES</span>{customer.entitlements.length ? <ul>{customer.entitlements.map((entitlement) => <li key={`${entitlement.productId}-${entitlement.benefitKey}`}><LockOpen size={15} /><div><strong>{benefitLabels(products, entitlement.benefitKey).join(', ') || entitlement.benefitKey}</strong>{entitlement.expiresAt && <small>Valid until {new Date(entitlement.expiresAt).toLocaleDateString()}</small>}</div></li>)}</ul> : <p className="account-empty">No premium features unlocked yet. Pay for a product, then redeem its license code below.</p>}</div><form className="account-redeem" onSubmit={redeem}><label>License code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="PS-XXXX-XXXX-XXXX" autoComplete="off" required /></label><button className="admin-primary" type="submit" disabled={busy || !code.trim()}>{busy ? 'Checking…' : 'Redeem code'} <KeyRound size={15} /></button></form><div className="account-foot"><Link to="/store">Browse products <ArrowRight size={14} /></Link><button className="admin-secondary" type="button" onClick={logout}><LogOut size={15} /> Sign out</button></div>{notice && <p className="menu-manager-message" role="status">{notice}</p>}{error && <p className="editor-error" role="alert">{error}</p>}</section> : <section className="account-card"><div className="account-card-head"><span className="section-kicker">CUSTOMER SIGN IN</span><h1>Your licenses, one account</h1><p>Sign in to redeem a license code and unlock the premium features of every product you own.</p></div><div className="account-mode-tabs"><button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError('') }}>Sign in</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError('') }}>Create account</button></div><form className="account-form" onSubmit={authenticate}>{mode === 'signup' && <label className="editor-field">Name <span className="field-optional">OPTIONAL</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} placeholder="How should we greet you?" /></label>}<label className="editor-field">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label><label className="editor-field">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required /></label><button className="publish-button" type="submit" disabled={busy}>{busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button></form>{socialRow}{notice && <p className="menu-manager-message" role="status">{notice}</p>}{error && <p className="editor-error" role="alert">{error}</p>}<p className="account-privacy"><ShieldCheck size={15} /> Passwords are stored hashed on the server. This account is only used for product licenses.</p></section>}</main></div>
}

function CollagePage() {
  return <div className="detail-shell"><Header onMenu={() => {}} /><CollageStudio /></div>
}

function ShortsPage() {
  return <div className="detail-shell"><Header onMenu={() => {}} /><ShortsCreator /></div>
}

function PromptPage({ prompts }: { prompts: Prompt[] }) {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const { counts, record } = useEngagement()
  const prompt = prompts.find((item) => item.slug === slug)
  useEffect(() => {
    if (!prompt) return
    const originalTitle = document.title
    const hashtags = (prompt.hashtags ?? []).map((tag) => tag.replace(/^#/, '')).filter(Boolean)
    const metadata = [
      ['name', 'description', prompt.description],
      ['name', 'keywords', hashtags.join(', ')],
      ['property', 'og:title', prompt.title],
      ['property', 'og:description', prompt.description],
      ['property', 'og:type', 'article'],
      ['property', 'og:url', `${window.location.origin}/prompt/${encodeURIComponent(prompt.slug)}`],
      ['property', 'og:image', imageAtWidth(prompt.image, 1200) ?? ''],
      ['name', 'twitter:card', prompt.image ? 'summary_large_image' : 'summary'],
      ...hashtags.map((tag) => ['property', 'article:tag', tag] as const),
    ]
    const prior = metadata.map(([attribute, key, content]) => {
      const selector = `meta[${attribute}="${key}"]`
      let element = document.head.querySelector<HTMLMetaElement>(selector)
      const created = !element
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, key)
        document.head.append(element)
      }
      const previous = element.getAttribute('content')
      element.setAttribute('content', content)
      return { element, previous, created }
    })
    document.title = `${prompt.title} | ${appConfig.appName}`
    return () => {
      document.title = originalTitle
      prior.forEach(({ element, previous, created }) => {
        if (created) element.remove()
        else if (previous === null) element.removeAttribute('content')
        else element.setAttribute('content', previous)
      })
    }
  }, [prompt])
  if (!prompt) return <main className="not-found"><Sparkles size={25} /><h1>This prompt is still a blank canvas.</h1><Link to="/">Back to the library <ArrowRight size={15} /></Link></main>
  const copy = async () => { try { await navigator.clipboard.writeText(prompt.promptText); setCopied(true); record(prompt.id, 'copy'); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }
  const pageUrl = `${window.location.origin}/prompt/${encodeURIComponent(prompt.slug)}`
  const engagement = engagementFor(counts, prompt.id)
  const shareText = `${prompt.title}\n\n${prompt.promptText}${prompt.image ? `\n\nImage:\n${imageAtWidth(prompt.image, 1200)}` : ''}\n\n${pageUrl}`
  const copyForAiTool = (label: string) => {
    if (!navigator.clipboard?.writeText) {
      setShareMessage('Clipboard is unavailable here. Copy the prompt above, then paste it into the tool.')
      return
    }
    void navigator.clipboard.writeText(prompt.promptText).then(() => {
      record(prompt.id, 'copy')
      setShareMessage(`Prompt copied. Paste it into ${label}.`)
      window.setTimeout(() => setShareMessage(''), 3000)
    }).catch(() => {
      setShareMessage('Clipboard access was blocked. Copy the prompt above, then paste it into the tool.')
      window.setTimeout(() => setShareMessage(''), 4000)
    })
  }
  return <div className="detail-shell"><Header onMenu={() => navigate('/')} /><main className="prompt-detail"><button className="detail-back" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back to prompts</button><div className="detail-columns"><div className="detail-cover">{prompt.image && <img src={imageAtWidth(prompt.image, 1000)} alt={prompt.imageAlt || ''} />}<span>{prompt.category}</span></div><div className="detail-info">{!prompt.sourceUrl && <span className="section-kicker">{prompt.tool} · {prompt.style}</span>}<h1>{prompt.title}</h1><p>{prompt.description}</p><div className="detail-prompt-label">THE PROMPT <span>READY TO COPY</span></div><div className="detail-prompt-text">{prompt.promptText}</div><button className="copy-large" onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Copied to clipboard' : 'Copy prompt'} <ArrowRight size={16} /></button><div className="detail-stats"><span><Copy size={13} /> {formatCount(engagement.copy)} copies</span><span><Share2 size={13} /> {formatCount(engagement.share)} shares</span></div><section className="prompt-share-panel"><button type="button" className="prompt-share-toggle" aria-expanded={shareMenuOpen} onClick={() => setShareMenuOpen((open) => !open)}><Copy size={17} /> Share prompt <span>{shareMenuOpen ? '−' : '+'}</span></button>{shareMenuOpen && <div className="prompt-share-options"><div className="share-group"><strong>Send to someone</strong><div className="share-target-list">{appConfig.promptSharing.messaging.map((target) => {
        const url = target.id === 'whatsapp'
          ? `${target.baseUrl}?text=${encodeURIComponent(shareText)}`
          : `${target.baseUrl}?url=${encodeURIComponent(prompt.image || pageUrl)}&text=${encodeURIComponent(`${prompt.title}\n\n${prompt.promptText}${prompt.image ? `\n\n${pageUrl}` : ''}`)}`
        return <a key={target.id} className={`share-target share-${target.id}`} href={url} target="_blank" rel="noreferrer" onClick={() => record(prompt.id, 'share')}><ArrowUpRight size={15} /> {target.label}</a>
      })}</div></div><div className="share-group"><strong>Open with prompt copied</strong><div className="share-target-list">{appConfig.promptSharing.aiTools.map((target) => <a key={target.id} className="share-target" href={target.url} target="_blank" rel="noreferrer" onClick={() => copyForAiTool(target.label)}>{target.label}<ArrowUpRight size={13} /></a>)}</div><p className="share-helper">The prompt is copied to your clipboard. Paste it into the tool after it opens.</p></div></div>}</section>{shareMessage && <p className="share-status" role="status">{shareMessage}</p>}</div></div></main></div>
}

function LoginPage({ onConnected, onAdminLogin }: { onConnected: () => void; onAdminLogin: () => void }) {
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState(false)
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordLoginBusy, setPasswordLoginBusy] = useState(false)
  const [error, setError] = useState('')
  const handleConnect = async () => {
    setConnecting(true); setError('')
    try { await connectBlogger(); onConnected(); navigate('/admin') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Google authorization failed.') }
    finally { setConnecting(false) }
  }
  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault(); setPasswordLoginBusy(true); setError('')
    try {
      const response = await fetch('/api/admin-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, password }) })
      const result = await response.json().catch(() => ({})) as { error?: string; authenticated?: boolean }
      if (!response.ok || !result.authenticated) throw new Error(result.error || 'Password sign-in failed.')
      onAdminLogin(); navigate('/admin')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Password sign-in failed.') }
    finally { setPasswordLoginBusy(false) }
  }
  return <main className="auth-page"><Link to="/" className="auth-back"><ArrowLeft size={15} /> Back to Promptseen</Link><div className="auth-card"><section className="auth-art"><Link to="/" className="brand auth-brand"><span className="brand-symbol"><Sparkles size={18} /></span><span>{appConfig.appName}<i>.</i></span></Link><div className="auth-art-copy"><span className="auth-eyebrow"><Sparkles size={13} /> CREATOR STUDIO</span><h1>Your blog,<br />one <em>workspace.</em></h1><p>Sign in with your user ID and password, or connect the Blogger account used to publish posts.</p><div className="auth-art-preview"><div className="mini-cover mini-cover-one" /><div className="mini-cover mini-cover-two" /><div className="mini-cover mini-cover-three" /><span>YOUR CREATIVE LIBRARY</span></div></div><span className="auth-art-footer">A LITTLE MORE IMAGINATION · PROMPTSEEN</span></section><section className="auth-form-panel"><div className="auth-form-wrap"><span className="auth-form-icon"><ShieldCheck size={19} /></span><span className="auth-status">ADMIN SIGN IN</span><h2>Welcome back</h2><p className="auth-subtitle">Choose either sign-in option to open Creator Studio.</p><form className="admin-password-login" onSubmit={handlePasswordLogin}><label>User ID<input value={userId} onChange={(event) => setUserId(event.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><button className="auth-submit" type="submit" disabled={passwordLoginBusy}>{passwordLoginBusy ? 'Signing in…' : 'Sign in with password'} <ArrowRight size={16} /></button></form><div className="login-divider"><span />or<span /></div><button className="auth-submit blogger-login-button" type="button" onClick={() => void handleConnect()} disabled={connecting}>{connecting ? 'Connecting…' : 'Continue with Blogger'} <ArrowRight size={16} /></button>{error && <p className="editor-error" role="alert">{error}{error.toLowerCase().includes('invalid_client') && ' Check that the OAuth client ID and JavaScript origin are correct in Google Cloud Console.'}</p>}<div className="preview-disclaimer"><span>About Blogger access</span><p>Password sign-in opens Creator Studio. Connect Blogger when you need to create or publish a Blogger post or upload a PDF to Drive.</p></div></div><span className="auth-legal">© {new Date().getFullYear()} {appConfig.appName} · Secure sign-in</span></section></div></main>
}

function AdminShell({ onLogout, bloggerConnected, children }: { onLogout: () => void; bloggerConnected: boolean; children: ReactNode }) {
  const location = useLocation()
  const isCreate = location.pathname.endsWith('/new')
  const isMenus = location.pathname.endsWith('/menus')
  const isPdfUpload = location.pathname.endsWith('/upload-pdf')
  const isAiModels = location.pathname.endsWith('/ai-models')
  const isProducts = location.pathname.endsWith('/products')
  return <div className="admin-shell"><header className="admin-topbar"><Link to="/" className="brand"><span className="brand-symbol"><Sparkles size={17} /></span><span>{appConfig.appName}<i>.</i></span></Link><div className="admin-topbar-right">{!bloggerConnected && <Link className="admin-connect-blogger" to="/login">Connect Blogger</Link>}<Link className="admin-view-site" to="/">View site <ArrowUpRight size={14} /></Link><button className="admin-header-logout" onClick={onLogout}><LogOut size={15} />Logout</button><button className="admin-avatar" aria-label={`${appConfig.adminDisplayName} profile`}>{appConfig.adminDisplayName.slice(0, 1).toUpperCase()}</button></div></header><div className="admin-body"><aside className="admin-nav"><span className="admin-nav-title">WORKSPACE</span><Link to="/admin" className={!isCreate && !isMenus && !isPdfUpload && !isAiModels && !isProducts ? 'admin-nav-link active' : 'admin-nav-link'}><LayoutDashboard size={17} />Overview</Link><Link to="/admin/new" onClick={openNewBloggerPost} className={isCreate ? 'admin-nav-link active' : 'admin-nav-link'}><Plus size={18} />Create prompt</Link><Link to="/admin/ai-models" className={isAiModels ? 'admin-nav-link active' : 'admin-nav-link'}><Sparkles size={17} />AI models</Link><Link to="/admin/products" className={isProducts ? 'admin-nav-link active' : 'admin-nav-link'}><Store size={17} />Digital store</Link><Link to="/admin/upload-pdf" className={isPdfUpload ? 'admin-nav-link active' : 'admin-nav-link'}><Copy size={17} />Upload PDF product</Link><Link to="/admin/menus" className={isMenus ? 'admin-nav-link active' : 'admin-nav-link'}><SlidersHorizontal size={17} />Manage menus</Link><a className="admin-nav-link" href="/#categories"><SlidersHorizontal size={17} />Categories</a><div className="admin-nav-bottom"><div className="admin-preview-note"><ShieldCheck size={17} /><strong>Blogger publishing</strong><p>Your connection stays active in this tab until the access token expires.</p></div><button className="admin-nav-link logout-link" onClick={onLogout}><LogOut size={17} />Sign out</button></div></aside><main className="admin-main"><div className="admin-main-inner">{children}</div></main></div></div>
}

interface ProductDraft { id: string; title: string; type: 'software' | 'pdf'; description: string; price: string; currency: string; watermarkText: string; premium: boolean; sortOrder: number }
interface FeatureDraft { id: string; productId: string; title: string; description: string; tier: 'free' | 'premium'; benefitKey: string; icon: string; sortOrder: number }

const blankProduct: ProductDraft = { id: '', title: '', type: 'software', description: '', price: '199', currency: 'INR', watermarkText: 'Promptseen', premium: true, sortOrder: 0 }
const blankFeature: FeatureDraft = { id: '', productId: '', title: '', description: '', tier: 'premium', benefitKey: '', icon: 'sparkles', sortOrder: 0 }

function featureToDraft(feature: StoreFeature): FeatureDraft {
  return { id: feature.id, productId: feature.productId, title: feature.title, description: feature.description, tier: feature.tier, benefitKey: feature.benefitKey, icon: feature.icon, sortOrder: feature.sortOrder }
}

function ProductManager() {
  const [snapshot, setSnapshot] = useState<StoreSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [productDraft, setProductDraft] = useState<ProductDraft>(blankProduct)
  const [featureDraft, setFeatureDraft] = useState<FeatureDraft>(blankFeature)
  const [selectedId, setSelectedId] = useState('')
  const [licenseBenefits, setLicenseBenefits] = useState<string[]>([])
  const products = snapshot?.products ?? []
  const licenses = snapshot?.licenses ?? []
  const selected = products.find((product) => product.id === selectedId) ?? null
  const refresh = (action: string, payload: Record<string, unknown>, message: string) => {
    setBusy(true); setError(''); setNotice('')
    return storeAction(action, payload)
      .then((next) => { setSnapshot(next); setNotice(message) })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not update the store.'))
      .finally(() => setBusy(false))
  }
  useEffect(() => {
    let cancelled = false
    loadStoreSnapshot().then((next) => {
      if (cancelled) return
      setSnapshot(next)
      if (next.products.length && !selectedId) {
        setSelectedId(next.products[0].id)
        setFeatureDraft({ ...blankFeature, productId: next.products[0].id, sortOrder: next.products[0].features.length + 1 })
      }
    }).catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load the store.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])
  useEffect(() => { setLicenseBenefits((selected?.features ?? []).filter((feature) => feature.tier === 'premium' && feature.benefitKey).map((feature) => feature.benefitKey)) }, [selectedId, snapshot])
  const editProduct = (product: StoreProduct) => {
    setSelectedId(product.id)
    setProductDraft({ id: product.id, title: product.title, type: product.type, description: product.description, price: String(product.pricePaise / 100), currency: product.currency, watermarkText: product.watermarkText, premium: product.premium, sortOrder: product.sortOrder })
    setFeatureDraft({ ...blankFeature, productId: product.id, sortOrder: product.features.length + 1 })
    setError(''); setNotice('')
  }
  const saveProduct = () => {
    const pricePaise = Math.round(Number(productDraft.price) * 100)
    if (!Number.isFinite(pricePaise) || pricePaise < 100) { setError('Enter a price of at least 1.00.'); return }
    const id = (productDraft.id.trim() || productDraft.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48))
    const isNew = !products.some((product) => product.id === id)
    if (!productDraft.title.trim()) { setError('Product title is required.'); return }
    return refresh('saveProduct', { product: { ...productDraft, id, pricePaise } }, isNew ? 'Product created.' : 'Product saved.')
      .then(() => { setSelectedId(id); if (isNew) setFeatureDraft({ ...blankFeature, productId: id, sortOrder: 1 }) })
  }
  const saveFeature = () => {
    if (!featureDraft.title.trim()) { setError('Feature title is required.'); return }
    if (!featureDraft.productId) { setError('Choose a product first.'); return }
    return refresh('saveFeature', { feature: { ...featureDraft, productId: featureDraft.productId } }, 'Feature saved.')
      .then(() => setFeatureDraft({ ...blankFeature, productId: featureDraft.productId, sortOrder: (selected?.features.length ?? 0) + 1 }))
  }
  const issueLicense = () => {
    if (!selected) { setError('Choose a product before issuing a license.'); return }
    if (!licenseBenefits.length) { setError('Select at least one premium benefit. Add a premium feature with a benefit key first.'); return }
    const input = document.querySelector<HTMLInputElement>('#license-buyer-email')
    const note = document.querySelector<HTMLInputElement>('#license-note')
    const expires = document.querySelector<HTMLInputElement>('#license-expires')
    return refresh('issueLicense', { license: { productId: selected.id, buyerEmail: input?.value.trim() ?? '', note: note?.value.trim() ?? '', expiresAt: expires?.value ?? '', benefitKeys: licenseBenefits } }, 'License issued. Share the code with the buyer.')
  }
  const copyCode = (code: string) => {
    if (!navigator.clipboard) { setNotice(`Copy this code manually: ${code}`); return }
    void navigator.clipboard.writeText(code).then(() => setNotice('License code copied.')).catch(() => setNotice(`Copy it manually: ${code}`))
  }
  const totalFeatures = products.reduce((count, product) => count + product.features.length, 0)
  const openLicenses = licenses.filter((license) => license.status === 'issued').length
  const premiumProducts = products.filter((product) => product.premium).length
  return <><div className="admin-page-heading"><div><span className="admin-kicker">{appConfig.appName.toUpperCase()} / DIGITAL STORE</span><h1>Digital store</h1><p>Every premium product, its full feature list and the license codes you have issued.</p></div><Link to="/store" className="admin-secondary"><Store size={15} /> View public store</Link></div>
    {loading ? <section className="editor-panel">Loading the store database…</section> : <>
      <div className="store-source-banner"><DatabaseBackup size={17} /><div><small>DATA SOURCE</small><strong>{snapshot?.store?.dataStore ?? 'postgres'}</strong><p>{snapshot?.store?.databaseConfigured ? 'Connected. Tables are created automatically on first use.' : 'Set DATABASE_URL on the server to activate the store database.'}</p></div>{snapshot?.store?.availableDataStores && <span className="store-source-options">Switchable: {snapshot.store.availableDataStores.join(', ')}</span>}</div>
      {error && <p className="editor-error" role="alert">{error}</p>}
      {notice && <p className="menu-manager-message" role="status">{notice}</p>}
      <section className="admin-stat-grid"><article className="admin-stat-card"><span>PRODUCTS</span><strong>{products.length}</strong><small>In the digital store</small><div className="stat-icon violet"><Store size={18} /></div></article><article className="admin-stat-card"><span>PREMIUM</span><strong>{premiumProducts}</strong><small>Marked premium</small><div className="stat-icon green"><BadgeCheck size={18} /></div></article><article className="admin-stat-card"><span>FEATURES</span><strong>{totalFeatures}</strong><small>Listed across products</small><div className="stat-icon yellow"><SlidersHorizontal size={18} /></div></article><article className="admin-stat-card"><span>LICENSES</span><strong>{licenses.length}</strong><small>{openLicenses} waiting to be redeemed</small><div className="stat-icon blue"><KeyRound size={18} /></div></article></section>
      <section className="editor-panel store-product-panel"><div className="editor-panel-heading"><div><span className="admin-kicker">{products.some((product) => product.id === productDraft.id) ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</span><h2>Product details</h2></div>{selected && <button type="button" className="admin-text-link" onClick={() => { setProductDraft(blankProduct); setSelectedId(''); setFeatureDraft({ ...blankFeature, productId: '', sortOrder: 1 }) }}><Plus size={14} /> New product</button>}</div><div className="store-product-fields">
        <label className="editor-field">Title<input value={productDraft.title} maxLength={100} onChange={(event) => setProductDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="Screen Recorder Pro" /></label>
        <label className="editor-field">ID<span className="field-optional">URL SAFE</span><input value={productDraft.id} maxLength={48} onChange={(event) => setProductDraft((draft) => ({ ...draft, id: event.target.value }))} placeholder="screen-recorder-pro" /></label>
        <label className="editor-field">Type<select value={productDraft.type} onChange={(event) => setProductDraft((draft) => ({ ...draft, type: event.target.value as ProductDraft['type'] }))}><option value="software">Software</option><option value="pdf">PDF</option></select></label>
        <label className="editor-field">Price ({productDraft.currency})<input value={productDraft.price} inputMode="decimal" onChange={(event) => setProductDraft((draft) => ({ ...draft, price: event.target.value }))} /></label>
        <label className="editor-field">Currency<input value={productDraft.currency} maxLength={3} onChange={(event) => setProductDraft((draft) => ({ ...draft, currency: event.target.value.toUpperCase() }))} /></label>
        <label className="editor-field">Watermark text <span className="field-optional">FREE USERS</span><input value={productDraft.watermarkText} maxLength={40} onChange={(event) => setProductDraft((draft) => ({ ...draft, watermarkText: event.target.value }))} placeholder="Promptseen" /></label>
        <label className="editor-field">Order<input type="number" value={productDraft.sortOrder} onChange={(event) => setProductDraft((draft) => ({ ...draft, sortOrder: Number(event.target.value) || 0 }))} /></label>
        <label className="store-premium-toggle"><input type="checkbox" checked={productDraft.premium} onChange={(event) => setProductDraft((draft) => ({ ...draft, premium: event.target.checked }))} /><span>Premium product</span></label>
        <label className="editor-field store-description">Description<textarea value={productDraft.description} maxLength={500} rows={3} onChange={(event) => setProductDraft((draft) => ({ ...draft, description: event.target.value }))} /></label>
      </div><div className="store-product-actions"><button className="admin-primary" type="button" onClick={() => void saveProduct()} disabled={busy}><Check size={15} /> Save product</button>{productDraft.id && <button className="admin-secondary" type="button" disabled={busy} onClick={() => void refresh('deleteProduct', { id: productDraft.id }, 'Product removed.').then(() => { setProductDraft(blankProduct); setSelectedId('') })}><Trash2 size={15} /> Delete product</button>}</div></section>
      <section className="admin-table-card"><div className="admin-table-head"><div><span className="admin-kicker">CATALOG</span><h2>All products</h2></div><span className="store-table-count">{products.length} record(s)</span></div><div className="admin-table-scroll"><table className="prompts-table store-table"><thead><tr><th>PRODUCT</th><th>TYPE</th><th>PRICE</th><th>FEATURES</th><th>PREMIUM</th><th /></tr></thead><tbody>{products.length ? products.map((product) => <tr key={product.id} className={selectedId === product.id ? 'store-row-active' : ''}><td><div className="table-prompt"><span><strong>{product.title}</strong><small>{product.id}</small></span></div></td><td>{product.type}</td><td>{productPrice(product)}</td><td>{product.features.length}</td><td>{product.premium ? <span className="store-pill premium"><BadgeCheck size={13} /> Premium</span> : <span className="store-pill">Free</span>}</td><td><button className="table-open" type="button" onClick={() => editProduct(product)} aria-label={`Edit ${product.title}`}><SlidersHorizontal size={15} /></button></td></tr>) : <tr><td colSpan={6}>No products yet. Save the form above to create the first one.</td></tr>}</tbody></table></div></section>
      {selected ? <><section className="editor-panel store-feature-panel"><div className="editor-panel-heading"><div><span className="admin-kicker">FEATURES</span><h2>{selected.title}</h2><p>Free features show as included. Premium features show as locked until a license with that benefit is redeemed.</p></div></div><div className="store-feature-list-admin">{selected.features.length ? selected.features.map((feature) => <div className={`store-feature-row ${feature.tier}`} key={feature.id}><span className="store-feature-icon">{feature.tier === 'premium' ? <Lock size={15} /> : <Check size={15} />}</span><div><strong>{feature.title}</strong><small>{feature.description}{feature.benefitKey && <code>{feature.benefitKey}</code>}</small></div><button type="button" className="menu-remove-button" onClick={() => void refresh('deleteFeature', { id: feature.id }, 'Feature removed.')} aria-label={`Remove ${feature.title}`}><X size={15} /></button><button type="button" className="table-open" onClick={() => setFeatureDraft(featureToDraft(feature))} aria-label={`Edit ${feature.title}`}><SlidersHorizontal size={14} /></button></div>) : <p className="account-empty">No features listed yet.</p>}</div><div className="store-feature-form"><label className="editor-field">Feature title<input value={featureDraft.title} maxLength={80} onChange={(event) => setFeatureDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="No watermark on export" /></label><label className="editor-field">Detail <span className="field-optional">OPTIONAL</span><input value={featureDraft.description} maxLength={200} onChange={(event) => setFeatureDraft((draft) => ({ ...draft, description: event.target.value }))} /></label><label className="editor-field">Tier<select value={featureDraft.tier} onChange={(event) => setFeatureDraft((draft) => ({ ...draft, tier: event.target.value as FeatureDraft['tier'] }))}><option value="free">Free</option><option value="premium">Premium</option></select></label><label className="editor-field">Benefit key<span className="field-optional">PREMIUM ONLY</span><input value={featureDraft.benefitKey} maxLength={40} onChange={(event) => setFeatureDraft((draft) => ({ ...draft, benefitKey: event.target.value }))} placeholder="watermark_free" /></label><button className="admin-primary" type="button" onClick={() => void saveFeature()} disabled={busy}><Plus size={15} /> {featureDraft.id ? 'Update feature' : 'Add feature'}</button>{featureDraft.id && <button className="admin-secondary" type="button" onClick={() => setFeatureDraft({ ...blankFeature, productId: selected.id, sortOrder: selected.features.length + 1 })}>Cancel edit</button>}</div><p className="store-benefit-hint">Use <code>{WATERMARK_BENEFIT}</code> as the benefit key to remove the screen recorder watermark for paying customers.</p></section>
        <section className="editor-panel store-license-panel"><div className="editor-panel-heading"><div><span className="admin-kicker">LICENSES</span><h2>Issue a code for {selected.title}</h2><p>Create a code after the payment arrives, then send it to the buyer.</p></div></div><div className="store-license-form"><label className="editor-field">Buyer email <span className="field-optional">OPTIONAL</span><input id="license-buyer-email" type="email" placeholder="buyer@example.com" /></label><label className="editor-field">Note<input id="license-note" maxLength={200} placeholder="Invoice 24" /></label><label className="editor-field">Expires <span className="field-optional">OPTIONAL</span><input id="license-expires" type="date" /></label><div className="store-license-benefits"><span>Benefits in this license</span>{(selected.features ?? []).filter((feature) => feature.tier === 'premium' && feature.benefitKey).length ? (selected.features ?? []).filter((feature) => feature.tier === 'premium' && feature.benefitKey).map((feature) => <label key={feature.id}><input type="checkbox" checked={licenseBenefits.includes(feature.benefitKey)} onChange={(event) => setLicenseBenefits((current) => event.target.checked ? [...current, feature.benefitKey] : current.filter((key) => key !== feature.benefitKey))} /><span>{feature.title} <code>{feature.benefitKey}</code></span></label>) : <small>Add a premium feature with a benefit key first.</small>}</div><button className="admin-primary" type="button" onClick={() => void issueLicense()} disabled={busy}><KeyRound size={15} /> Issue license code</button></div><div className="admin-table-scroll"><table className="prompts-table store-table"><thead><tr><th>CODE</th><th>PRODUCT</th><th>BENEFITS</th><th>STATUS</th><th>REDEEMED BY</th><th /></tr></thead><tbody>{licenses.filter((license) => license.productId === selected.id).length ? licenses.filter((license) => license.productId === selected.id).map((license) => <tr key={license.id}><td><button className="store-code-copy" type="button" onClick={() => copyCode(license.code)} title="Copy code">{license.code} <Copy size={13} /></button></td><td>{license.productId}</td><td>{license.benefitKeys.join(', ')}</td><td><span className={`store-pill ${license.status}`}>{license.status}</span></td><td>{license.redeemedEmail || license.buyerEmail || '—'}</td><td>{license.status === 'issued' ? <button className="menu-remove-button" type="button" onClick={() => void refresh('updateLicense', { id: license.id, status: 'revoked', note: license.note, buyerEmail: license.buyerEmail, expiresAt: license.expiresAt }, 'License revoked. Any account that redeemed it lost the benefit.')} aria-label="Revoke license"><Lock size={14} /></button> : null}</td></tr>) : <tr><td colSpan={6}>No licenses issued for this product yet.</td></tr>}</tbody></table></div></section></> : <section className="editor-panel">Choose a product above to manage its features and licenses.</section>}
    </>}</>
}

function AdminOverview({ prompts, blogStatus }: { prompts: Prompt[]; blogStatus: 'idle' | 'loading' | 'connected' | 'error' }) {
  const location = useLocation()
  const publishNotice = location.state as { publishedUrl?: string } | null
  const created = prompts.filter((item) => item.id.startsWith('local-') || item.id.startsWith('social-'))
  const recent = [...prompts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
  return <><div className="admin-page-heading"><div><span className="admin-kicker">{appConfig.appName.toUpperCase()} / CREATOR STUDIO</span><h1>Welcome, {appConfig.adminDisplayName} <span>✳</span></h1><p>Here’s what’s happening in your prompt library.</p></div><Link to="/admin/new" onClick={openNewBloggerPost} className="admin-primary"><Plus size={16} /> Create prompt</Link></div>{publishNotice?.publishedUrl && <div className="publish-success-banner"><Check size={17} /><span>Published to Blogger successfully.</span><a href={publishNotice.publishedUrl} target="_blank" rel="noreferrer">View post <ArrowUpRight size={13} /></a></div>}<div className="admin-local-banner"><ShieldCheck size={17} /><span><strong>{blogStatus === 'connected' ? 'Blogger connected' : 'Preview workspace'}</strong> — {blogStatus === 'connected' ? 'New prompts publish directly to Blogger; the public library reads published posts.' : 'Connect your Blogger account before publishing.'}</span></div><section className="admin-stat-grid"><article className="admin-stat-card"><span>LIBRARY PROMPTS</span><strong>{prompts.length}</strong><small><i>↗</i> {blogStatus === 'connected' ? 'Includes Blogger posts' : 'Including sample content'}</small><div className="stat-icon violet"><Sparkles size={18} /></div></article><article className="admin-stat-card"><span>YOUR PROMPTS</span><strong>{created.length}</strong><small><i>↗</i> Created in this browser</small><div className="stat-icon green"><Plus size={19} /></div></article><article className="admin-stat-card"><span>CATEGORIES</span><strong>{promptCategories.length}</strong><small>Ready to organize prompts</small><div className="stat-icon yellow"><SlidersHorizontal size={18} /></div></article><article className="admin-stat-card"><span>BLOGGER CONNECTION</span><strong className="status-waiting">{blogStatus === 'connected' ? 'Connected' : blogStatus === 'loading' ? 'Checking…' : blogStatus === 'error' ? 'Offline' : 'Pending'}</strong><small>{blogStatus === 'connected' ? 'Published posts are live' : 'Blogger account not connected'}</small><div className="stat-icon blue"><ShieldCheck size={18} /></div></article></section><section className="admin-table-card"><div className="admin-table-head"><div><span className="admin-kicker">YOUR CONTENT</span><h2>Recently added</h2></div><Link to="/admin/new" onClick={openNewBloggerPost} className="admin-text-link">Add a prompt <ArrowRight size={14} /></Link></div><div className="admin-table-scroll"><table className="prompts-table"><thead><tr><th>PROMPT</th><th>CATEGORY</th><th>TOOL</th><th>DATE</th><th /></tr></thead><tbody>{recent.map((prompt) => <tr key={prompt.id}><td><div className="table-prompt">{prompt.image && <img src={prompt.image} alt="" />}<span><strong>{prompt.title}</strong><small>/{prompt.slug}</small></span></div></td><td><span className="table-category">{prompt.category}</span></td><td>{prompt.tool}</td><td>{new Date(`${prompt.createdAt}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td><td><Link to={`/prompt/${prompt.slug}`} className="table-open" aria-label={`Open ${prompt.title}`}><ArrowUpRight size={15} /></Link></td></tr>)}</tbody></table></div></section><div className="admin-bottom-line"><span>{appConfig.appName} Admin <b>·</b> UI preview</span><Link to="/">Return to public site <ArrowUpRight size={13} /></Link></div></>
}

function parseHashtags(input: string): string[] {
  return [...new Set(input.split(/[\s,;]+/).map((tag) => tag.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean))].slice(0, 12)
}

interface AdminAiModel { id: string; name: string; provider: string; model: string; configured: boolean; custom?: boolean; baseUrl?: string }

const defaultCustomBaseUrl = 'https://api.zyloai.net/v1'
const zyloModelIds = ['gemini-3.1-pro', 'zimage', 'openai/gpt-image-1.5']
const providerLabel = (provider: string) => provider === 'custom' ? 'Custom endpoint' : provider

function AiModelSettingsPage() {
  const [models, setModels] = useState<AdminAiModel[]>([
    { id: 'openai-gpt-4o', name: 'GPT-4o', provider: 'OpenAI', model: 'gpt-4o', configured: false },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', model: 'gemini-2.5-flash', configured: false },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', model: 'claude-sonnet-4-6', configured: false },
  ])
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [draftProvider, setDraftProvider] = useState('openai')
  const [draftName, setDraftName] = useState('')
  const [draftModel, setDraftModel] = useState('')
  const [draftBaseUrl, setDraftBaseUrl] = useState(defaultCustomBaseUrl)
  const [draftApiKey, setDraftApiKey] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [keyTest, setKeyTest] = useState<{ id: string; ok: boolean; detail: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch('/api/ai-model-settings', { headers: { Authorization: `Bearer ${getBloggerAccessToken()}` } })
        const result = await response.json().catch(() => ({})) as { models?: AdminAiModel[]; activeModel?: string | null; error?: string }
        if (!response.ok) throw new Error(result.error || `Could not load model settings (${response.status}).`)
        if (!cancelled) { setModels(result.models ?? []); setActiveModel(result.activeModel ?? null) }
      } catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load AI model settings.') }
      finally { if (!cancelled) setLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [])
  const resetDraft = () => { setEditingId(null); setDraftName(''); setDraftModel(''); setDraftApiKey(''); setDraftBaseUrl(defaultCustomBaseUrl); setDraftProvider('openai') }
  const saveDraft = () => {
    setError(''); setNotice('')
    const name = draftName.trim()
    const model = draftModel.trim()
    const isCustom = draftProvider === 'custom'
    const baseUrl = isCustom ? draftBaseUrl.trim().replace(/\/+$/, '') : ''
    if (!name || !model) { setError('Enter a display name and the model ID.'); return }
    if (isCustom && !/^https?:\/\/\S+$/i.test(baseUrl)) { setError(`Enter the custom API base URL, for example ${defaultCustomBaseUrl}.`); return }
    if (!editingId && !draftApiKey.trim()) { setError('Enter the provider API key before adding a model.'); return }
    const id = editingId ?? `${draftProvider}-${model.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')}`
    const existing = models.find((item) => item.id === id)
    if (existing && !existing.custom) { setError('That model ID belongs to a built-in model. Paste its key on that card instead.'); return }
    const entry = { id, name, provider: draftProvider, model, ...(isCustom ? { baseUrl } : {}) }
    setModels((items) => items.some((item) => item.id === id) ? items.map((item) => item.id === id ? { ...item, ...entry } : item) : [...items, { ...entry, configured: false, custom: true }])
    if (draftApiKey.trim()) setApiKeys((values) => ({ ...values, [id]: draftApiKey.trim() }))
    resetDraft()
    setNotice(`${name} is ready. Switch it on and save to generate prompts with it.`)
  }
  const testKey = async (model: AdminAiModel) => {
    setError(''); setNotice(''); setTestingId(model.id); setKeyTest(null)
    try {
      const response = await fetch('/api/ai-model-settings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getBloggerAccessToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: model.id, apiKey: apiKeys[model.id] ?? '' }),
      })
      const result = await response.json().catch(() => ({})) as { ok?: boolean; detail?: string; error?: string }
      if (!response.ok) throw new Error(result.error || `Could not reach the model settings API (${response.status}).`)
      setKeyTest({ id: model.id, ok: Boolean(result.ok), detail: result.detail ?? 'The provider gave no answer.' })
    } catch (reason) { setKeyTest({ id: model.id, ok: false, detail: reason instanceof Error ? reason.message : 'Could not test this API key.' }) }
    finally { setTestingId(null) }
  }
  const editModel = (model: AdminAiModel) => {
    setError(''); setNotice('')
    setEditingId(model.id); setDraftProvider(model.provider); setDraftName(model.name); setDraftModel(model.model); setDraftBaseUrl(model.baseUrl || defaultCustomBaseUrl); setDraftApiKey('')
  }
  const removeModel = (model: AdminAiModel) => {
    setError(''); setNotice('')
    setModels((items) => items.filter((item) => item.id !== model.id))
    setApiKeys((values) => { const next = { ...values }; delete next[model.id]; return next })
    setKeyTest((current) => current?.id === model.id ? null : current)
    setActiveModel((current) => current === model.id ? null : current)
    if (editingId === model.id) resetDraft()
    setNotice(`${model.name} removed. Save to apply the change.`)
  }
  const useZyloPreset = () => {
    setError(''); setNotice('')
    setEditingId(null); setDraftProvider('custom'); setDraftBaseUrl(defaultCustomBaseUrl); setDraftName('ZyloAI Gemini'); setDraftModel(zyloModelIds[0])
  }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/ai-model-settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getBloggerAccessToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeModel, apiKeys, customModels: models.filter((item) => item.custom).map(({ id, name, provider, model, baseUrl }) => ({ id, name, provider, model, ...(provider === 'custom' && baseUrl ? { baseUrl } : {}) })) }),
      })
      const result = await response.json().catch(() => ({})) as { models?: AdminAiModel[]; activeModel?: string | null; error?: string }
      if (!response.ok) throw new Error(result.error || `Could not save AI model settings (${response.status}).`)
      setModels(result.models ?? []); setActiveModel(result.activeModel === undefined ? activeModel : result.activeModel); setApiKeys({}); setNotice('Model settings saved. The selected model will generate prompts.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save AI model settings.') }
    finally { setSaving(false) }
  }
  const selectedModel = models.find((model) => model.id === activeModel)
  return <><div className="admin-page-heading"><div><span className="admin-kicker">PROMPTSEEN / AI CONFIGURATION</span><h1>AI models</h1><p>Add models and switch on one for prompt generation.</p></div><Link to="/admin" className="admin-secondary"><ArrowLeft size={15} /> Back to dashboard</Link></div><div className="ai-active-model-banner"><span className={`ai-active-model-indicator ${activeModel ? 'on' : ''}`} /><div><small>MODEL IN USE</small><strong>{loading ? 'Loading model settings…' : activeModel ? selectedModel?.name ?? activeModel : 'No model active'}</strong></div><span className="ai-active-model-provider">{activeModel ? providerLabel(selectedModel?.provider ?? '') : 'Prompt generation is off'}</span></div><div className="ai-settings-notice"><ShieldCheck size={17} /><span>Settings are saved in the server config file <code>data/ai-model-settings.json</code>. Provider keys are encrypted with <code>AI_SETTINGS_ENCRYPTION_KEY</code>.</span></div>{loading ? <section className="editor-panel">Loading AI model settings…</section> : <form className="ai-model-settings" onSubmit={save}>
    <section className="ai-add-model-card"><div><span className="admin-kicker">{editingId ? 'EDIT CUSTOM MODEL' : 'CUSTOM PROVIDER'}</span><h2>{editingId ? 'Update this model' : 'Add a model'}</h2><p>Pick a provider, then enter its display name, model ID and API key. A custom endpoint works with any OpenAI-compatible API such as ZyloAI.</p><button type="button" className="ai-model-preset" onClick={useZyloPreset}><Sparkles size={14} /> Use ZyloAI</button></div><div className="ai-add-model-fields"><label>Provider<select value={draftProvider} onChange={(event) => setDraftProvider(event.target.value)}><option value="openai">OpenAI</option><option value="google">Google</option><option value="anthropic">Anthropic</option><option value="custom">ZyloAI / custom endpoint</option></select></label>{draftProvider === 'custom' && <label>API base URL<input value={draftBaseUrl} onChange={(event) => setDraftBaseUrl(event.target.value)} placeholder={defaultCustomBaseUrl} maxLength={160} /></label>}<label>Display name<input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="e.g. GPT-4o mini" /></label><label>Model ID<input value={draftModel} onChange={(event) => setDraftModel(event.target.value)} placeholder={draftProvider === 'custom' ? zyloModelIds[0] : 'e.g. gpt-4o-mini'} /></label>{draftProvider === 'custom' && <small className="ai-custom-endpoint-hint">POSTs to {draftBaseUrl.trim().replace(/\/+$/, '') || defaultCustomBaseUrl}/chat/completions with a Bearer key. ZyloAI model IDs: {zyloModelIds.join(', ')}.</small>}<label>API key<input type="password" autoComplete="new-password" value={draftApiKey} onChange={(event) => setDraftApiKey(event.target.value)} placeholder={editingId ? 'Leave blank to keep the saved key' : 'Paste provider API key'} /></label><button type="button" className="ai-add-model-button" onClick={saveDraft}>{editingId ? <><Check size={15} /> Update model</> : <><Plus size={15} /> Add model</>}</button>{editingId && <button type="button" className="ai-model-cancel" onClick={resetDraft}>Cancel</button>}</div></section>
    <div className="ai-model-grid">{models.map((model) => <section className={`ai-model-card ${activeModel === model.id ? 'active' : ''}`} key={model.id}><div className="ai-model-card-heading"><div><span>{providerLabel(model.provider)}</span><h2>{model.name}</h2></div><button type="button" className={`ai-model-toggle ${activeModel === model.id ? 'enabled' : ''}`} role="switch" aria-checked={activeModel === model.id} aria-label={`${activeModel === model.id ? 'Deactivate' : 'Activate'} ${model.name}`} disabled={activeModel !== model.id && !model.configured && !apiKeys[model.id]?.trim()} onClick={() => setActiveModel((current) => current === model.id ? null : model.id)}><span />{activeModel === model.id ? 'ON' : 'OFF'}</button></div><p>Model ID: <code>{model.model}</code></p>{model.baseUrl && <p className="ai-model-endpoint">Endpoint: <code>{`${model.baseUrl}/chat/completions`}</code></p>}<label className="editor-field">API key<input type="password" autoComplete="new-password" value={apiKeys[model.id] ?? ''} onChange={(event) => setApiKeys((values) => ({ ...values, [model.id]: event.target.value }))} placeholder={model.configured ? 'Key saved securely · enter to replace' : model.provider === 'custom' ? 'Paste the endpoint API key' : `Paste ${model.provider} API key`} /></label><small className={model.configured || apiKeys[model.id]?.trim() ? 'ai-key-status configured' : 'ai-key-status'}>{model.configured ? 'API key configured' : apiKeys[model.id]?.trim() ? 'API key ready to save' : 'API key not configured'}</small><div className="ai-model-test"><button type="button" onClick={() => void testKey(model)} disabled={testingId !== null || (!model.configured && !apiKeys[model.id]?.trim())}><Zap size={14} /> {testingId === model.id ? 'Testing key…' : 'Test key'}</button>{keyTest?.id === model.id && <small className={keyTest.ok ? 'ai-key-test-result ok' : 'ai-key-test-result fail'} role="status">{keyTest.detail}</small>}</div>{model.custom && <div className="ai-model-actions"><button type="button" onClick={() => editModel(model)}>Edit</button><button type="button" className="ai-model-remove" onClick={() => removeModel(model)}><Trash2 size={14} /> Remove</button></div>}</section>)}</div>
    {activeModel === null && <p className="ai-model-off-notice" role="status">All models are off. Prompt generation is paused until you switch on a configured model.</p>}{error && <p className="editor-error" role="alert">{error}</p>}{notice && <p className="ai-settings-success" role="status">{notice}</p>}<button className="publish-button ai-settings-save" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save model settings'} <Check size={16} /></button></form>}</>
}

function titleFromPromptText(text: string): string {
  const firstLine = text.split('\n').map((line) => line.replace(/[#>*`]/g, '').trim()).find((line) => line.length > 0) ?? ''
  return firstLine.slice(0, 70).trim()
}

function PromptEditor({ onPublish, customCategories }: { onPublish: (prompt: Prompt, target: { blogId: string; postId: string }) => Promise<{ id: string; url: string; published: string; imageUrl: string }>; customCategories: string[] }) {
  const [title, setTitle] = useState('')
  const description = ''
  const [promptText, setPromptText] = useState('')
  const [category, setCategory] = useState('Girls')
  const categories = [...new Set([...promptCategories.filter((item) => item !== 'Trending' && item !== 'Latest'), ...customCategories])]
  const [tool, setTool] = useState('Gemini')
  const [style, setStyle] = useState('Editorial')
  const [hashtagsInput, setHashtagsInput] = useState('')
  const [generatorPhoto, setGeneratorPhoto] = useState('')
  const [generatorPhotoName, setGeneratorPhotoName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatorError, setGeneratorError] = useState('')
  const [bloggerPostUrl, setBloggerPostUrl] = useState('')
  const [error, setError] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)
  const navigate = useNavigate()
  const effectiveTitle = title.trim() || titleFromPromptText(promptText)
  useEffect(() => {
    let cancelled = false
    if (!bloggerPostUrl.trim()) { setIsLoadingDraft(false); setTitle(''); setError(''); return }
    setIsLoadingDraft(true)
    const timer = window.setTimeout(() => {
      let target: { blogId: string; postId: string }
      try { target = parseBloggerEditUrl(bloggerPostUrl) } catch (reason) {
        setIsLoadingDraft(false)
        setError(reason instanceof Error ? reason.message : 'Paste a valid Blogger edit link.')
        return
      }
      setError('')
      setTitle('')
      getPromptBloggerDraftMetadata(target).then((draft) => {
        if (cancelled) return
        setTitle(draft.title)
        setHashtagsInput(draft.hashtags.map((tag) => `#${tag}`).join(' '))
      }).catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load the Blogger draft.')
      }).finally(() => { if (!cancelled) setIsLoadingDraft(false) })
    }, 450)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [bloggerPostUrl])
  const selectGeneratorPhoto = (file: File | undefined) => {
    setGeneratorError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setGeneratorError('Choose a JPG, PNG, or WebP photo.'); return }
    if (file.size > 3 * 1024 * 1024) { setGeneratorError('Choose an image smaller than 3 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') { setGeneratorPhoto(reader.result); setGeneratorPhotoName(file.name) }
      else setGeneratorError('Could not read this image. Try another photo.')
    }
    reader.onerror = () => setGeneratorError('Could not read this image. Try another photo.')
    reader.readAsDataURL(file)
  }
  const generateFromPhoto = async () => {
    if (!generatorPhoto) { setGeneratorError('Choose a photo first.'); return }
    setIsGenerating(true)
    setGeneratorError('')
    try {
      const accessToken = getBloggerAccessToken()
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: generatorPhoto }),
      })
      const result = await response.json().catch(() => ({})) as { prompt?: string; error?: string }
      if (!response.ok || !result.prompt) throw new Error(result.error || `Prompt generation failed (${response.status}).`)
      setPromptText(result.prompt)
    } catch (reason) {
      setGeneratorError(reason instanceof Error ? reason.message : 'Could not generate a prompt from this photo.')
    } finally { setIsGenerating(false) }
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    let target: { blogId: string; postId: string }
    try { target = parseBloggerEditUrl(bloggerPostUrl) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Paste a valid Blogger edit link.'); return }
    if (!promptText.trim()) { setError('Write the prompt first — its first line names the Blogger post when the draft has no title.'); return }
    const slug = effectiveTitle.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || target.postId
    const prompt: Prompt = { id: `pending-${Date.now()}`, slug, title: effectiveTitle, description: description.trim(), promptText: promptText.trim(), category, tool, style: style.trim() || 'Creative', featured: false, hashtags: parseHashtags(hashtagsInput), createdAt: new Date().toISOString().slice(0, 10) }
    setIsPublishing(true)
    try {
      const post = await onPublish(prompt, target)
      navigate('/admin', { state: { publishedUrl: post.url } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Blogger could not publish this post.')
    } finally { setIsPublishing(false) }
  }
  return <><div className="admin-page-heading editor-page-heading"><div><span className="admin-kicker">PROMPTSEEN / CONTENT</span><h1>Create prompt from Blogger</h1><p>Start a new Blogger post, upload its image, then complete the prompt details here.</p></div><Link to="/admin" className="admin-secondary"><ArrowLeft size={15} /> Back to dashboard</Link></div><div className="editor-preview-banner"><span className="preview-banner-icon"><ShieldCheck size={17} /></span><div><strong>1. Start a new Blogger post and upload your image. 2. Paste its saved post link here and complete the prompt fields.</strong><p>Use the Blogger post link below to choose the post. Publishing keeps its Blogger title — an untitled draft is named from the first line of your prompt — and keeps Blogger images.</p></div></div><form className="prompt-editor" onSubmit={submit}><div className="editor-main-column"><section className="editor-panel"><div className="editor-panel-heading"><div><span className="admin-kicker">01 — THE BASICS</span><h2>Prompt details</h2></div><span className="required-note">* REQUIRED</span></div><label className="editor-field">Blogger post link <b>*</b><input type="url" value={bloggerPostUrl} onChange={(event) => setBloggerPostUrl(event.target.value)} placeholder="Paste the new post link after saving it in Blogger" required /></label><div className="editor-two-fields"><label className="editor-field">Category <b>*</b><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="editor-field">AI tool<select value={tool} onChange={(event) => setTool(event.target.value)}>{['Gemini', 'ChatGPT', 'Midjourney', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label></div><label className="editor-field">Style tag<input value={style} onChange={(event) => setStyle(event.target.value)} placeholder="e.g. Film portrait" maxLength={32} /></label><label className="editor-field">Hashtags<input value={hashtagsInput} onChange={(event) => setHashtagsInput(event.target.value)} placeholder="#AIart #PortraitPrompt #Gemini" /><small>Add up to 12, separated by spaces or commas. They become Blogger labels and prompt-page metadata.</small></label></section><section className="editor-panel prompt-copy-panel"><div className="editor-panel-heading"><div><span className="admin-kicker">02 — THE PROMPT</span><h2>Write the prompt</h2></div><span className="required-note">* REQUIRED</span></div><div className="photo-prompt-generator"><div className="photo-generator-top"><div><strong>Generate from a photo</strong><small>Upload a photo and GPT-4o will write an image prompt.</small></div><ImagePlus size={19} /></div><label className="photo-generator-picker">{generatorPhoto ? <img src={generatorPhoto} alt="Selected photo preview" /> : <span><ImagePlus size={22} /> Choose a photo</span>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectGeneratorPhoto(event.currentTarget.files?.[0])} /><small>{generatorPhotoName || "JPG, PNG, or WebP · up to 3 MB"}</small></label><button className="photo-generator-button" type="button" onClick={() => void generateFromPhoto()} disabled={isGenerating || !generatorPhoto}>{isGenerating ? "Generating…" : "Generate prompt"}<Sparkles size={15} /></button>{generatorError && <p className="editor-error" role="alert">{generatorError}</p>}</div><label className="editor-field">Prompt text<textarea className="prompt-textarea" value={promptText} onChange={(event) => setPromptText(event.target.value)} placeholder="Write a prompt or generate one from a photo…" rows={9} required /><small>Generated text appears here. You can edit it before publishing.</small></label></section></div><aside className="editor-side-column"><section className="editor-panel image-editor-panel"><div className="editor-panel-heading"><div><span className="admin-kicker">03 — BLOGGER BODY</span><h2>Post content and image</h2></div></div><p>Upload and save your image in Blogger. Its Blogger title is kept; the category, AI tool, hashtags, and prompt you enter here are added to that post.</p><a className="admin-text-link" href={`https://www.blogger.com/blog/posts/${promptBloggerDraft.blogId}`} target="_blank" rel="noreferrer">Open Blogger posts <ArrowUpRight size={14} /></a><p>Click <strong>+ NEW POST</strong> in Blogger. After saving the draft, copy its edit URL and paste it into the Blogger post link field above.</p></section><section className="editor-panel publish-panel"><span className="admin-kicker">PUBLISH</span><h2>Ready to share?</h2><p>This updates the selected Blogger post with all prompt details and publishes it.</p><p className="publish-title-preview"><small>Blogger post title</small><strong>{effectiveTitle || 'Takes the first line of your prompt'}</strong></p>{error && <p className="editor-error" role="alert">{error}</p>}<button className="publish-button" type="submit" disabled={isPublishing || isLoadingDraft}><Plus size={16} /> {isLoadingDraft ? 'Loading Blogger draft…' : isPublishing ? 'Updating and publishing…' : 'Update and publish draft'} <ArrowRight size={15} /></button></section></aside></form></>
}

function PdfProductUploader() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ id: string; driveFileId: string; fileName: string; postUrl: string; catalogRecord: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!file) { setError('Choose a PDF file to upload.'); return }
    setBusy(true); setError(''); setResult(null)
    try {
      const pricePaise = Math.round(Number(price) * 100)
      setResult(await publishPdfProduct({ file, title: title.trim(), description: description.trim(), pricePaise }))
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not upload and publish the PDF product.') }
    finally { setBusy(false) }
  }
  const copyCatalog = async () => {
    if (!result) return
    try { await navigator.clipboard.writeText(result.catalogRecord); setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
    catch { setCopied(false) }
  }
  return <><div className="admin-page-heading"><div><span className="admin-kicker">PROMPTSEEN / SELL ONLINE</span><h1>Upload PDF product</h1><p>Upload a private PDF to Drive and publish its paid listing on Blogger.</p></div><Link to="/store" className="admin-secondary"><ArrowUpRight size={15} /> View store</Link></div><div className="menu-manager-notice"><ShieldCheck size={16} /><span>The PDF stays private in Google Drive. Blogger gets the product description and checkout link; it does not receive the file binary.</span></div><form className="editor-panel pdf-product-form" onSubmit={submit}><div className="editor-panel-heading"><div><span className="admin-kicker">PAID PDF LISTING</span><h2>Product details</h2></div></div><label className="editor-field">Product title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="e.g. The Portrait Prompt Guide" required /></label><label className="editor-field">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={500} placeholder="What the buyer will learn or receive" required /></label><div className="editor-two-fields"><label className="editor-field">Price (INR)<input type="number" min="1" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="199.00" required /></label><label className="editor-field">PDF file<input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /><small>{file ? `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'PDF only · up to 25 MB'}</small></label></div>{error && <p className="editor-error" role="alert">{error}</p>}<button className="publish-button pdf-upload-button" type="submit" disabled={busy}>{busy ? 'Uploading PDF and publishing…' : 'Upload PDF and publish to Blogger'} <ArrowRight size={15} /></button></form>{result && <section className="admin-table-card pdf-upload-result"><div className="admin-table-head"><div><span className="admin-kicker">PRODUCT POST CREATED</span><h2>{result.fileName}</h2></div><a href={result.postUrl} target="_blank" rel="noreferrer" className="admin-text-link">View Blogger post <ArrowUpRight size={14} /></a></div><div className="pdf-next-steps"><p><strong>Private Drive file ID:</strong> {result.driveFileId}</p><p>The payment screen is a placeholder; downloads remain locked until scanner-based payment verification is added.</p><p>Add this product record to server-side <code>STORE_PRODUCTS_JSON</code> to show it in the store:</p><pre>{result.catalogRecord}</pre><button className="admin-secondary" onClick={() => void copyCatalog()} type="button"><Copy size={14} /> {copied ? 'Copied' : 'Copy product record'}</button></div></section>}</>
}

function MenuManager({ menuSections, onChange }: { menuSections: SideMenuSection[]; onChange: (sections: SideMenuSection[]) => void }) {
  const [sectionId, setSectionId] = useState<SideMenuSection['id']>('events')
  const [name, setName] = useState('')
  const [timing, setTiming] = useState('')
  const [message, setMessage] = useState('')
  const addItem = (event: FormEvent) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return
    const section = menuSections.find((item) => item.id === sectionId)
    if (section?.items.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
      setMessage(`“${cleanName}” is already in ${section.title}.`)
      return
    }
    onChange(menuSections.map((item) => item.id === sectionId ? { ...item, items: [...item.items, { id: createMenuItemId(cleanName), name: cleanName, ...(timing.trim() ? { timing: timing.trim() } : {}) }] } : item))
    setName(''); setTiming(''); setMessage('Menu item added.')
  }
  const removeItem = (groupId: SideMenuSection['id'], itemId: string) => onChange(menuSections.map((section) => section.id === groupId ? { ...section, items: section.items.filter((item) => item.id !== itemId) } : section))
  return <><div className="admin-page-heading"><div><span className="admin-kicker">PROMPTSEEN / NAVIGATION</span><h1>Manage menus</h1><p>Create the event and festival subcategories shown in the public sidebar.</p></div><Link to="/" className="admin-secondary"><ArrowUpRight size={15} /> View site</Link></div><div className="menu-manager-notice"><ShieldCheck size={16} /><span>Menu changes are saved in this browser and appear in this app’s sidebar.</span></div><section className="editor-panel menu-create-panel"><div className="editor-panel-heading"><div><span className="admin-kicker">ADD A SUBCATEGORY</span><h2>Create a menu item</h2></div></div><form className="menu-create-form" onSubmit={addItem}><label className="editor-field">Section<select value={sectionId} onChange={(event) => setSectionId(event.target.value as SideMenuSection['id'])}>{menuSections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label><label className="editor-field">Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. World Book Day" maxLength={60} required /></label><label className="editor-field">Date or season <span className="field-optional">OPTIONAL</span><input value={timing} onChange={(event) => setTiming(event.target.value)} placeholder="e.g. 23 April" maxLength={60} /></label><button className="admin-primary" type="submit"><Plus size={15} /> Add menu item</button></form>{message && <p className="menu-manager-message" role="status">{message}</p>}</section><div className="menu-manager-groups">{menuSections.map((section) => <section className="admin-table-card menu-items-card" key={section.id}><div className="admin-table-head"><div><span className="admin-kicker">{section.id === 'events' ? 'CALENDAR' : 'CELEBRATIONS'}</span><h2>{section.title} <small>{section.items.length}</small></h2></div></div><div className="managed-menu-list">{section.items.map((item) => <div className="managed-menu-row" key={item.id}><span className="managed-menu-mark">{item.name.slice(0, 1)}</span><span className="managed-menu-name"><strong>{item.name}</strong>{item.timing && <small>{item.timing}</small>}</span><button type="button" className="menu-remove-button" onClick={() => removeItem(section.id, item.id)} aria-label={`Remove ${item.name}`}><X size={15} /></button></div>)}</div></section>)}</div></>
}

function AdminGate({ allowed, authReady, bloggerConnected, prompts, blogStatus, onPublish, onLogout, menuSections, onChangeMenus }: { allowed: boolean; authReady: boolean; bloggerConnected: boolean; prompts: Prompt[]; blogStatus: 'idle' | 'loading' | 'connected' | 'error'; onPublish: (prompt: Prompt, target: { blogId: string; postId: string }) => Promise<{ id: string; url: string; published: string; imageUrl: string }>; onLogout: () => void; menuSections: SideMenuSection[]; onChangeMenus: (sections: SideMenuSection[]) => void }) {
  const createPage = useLocation().pathname.endsWith('/new')
  const pdfUploadPage = useLocation().pathname.endsWith('/upload-pdf')
  const menusPage = useLocation().pathname.endsWith('/menus')
  const aiModelsPage = useLocation().pathname.endsWith('/ai-models')
  const productsPage = useLocation().pathname.endsWith('/products')
  if (!authReady) return <main className="auth-page"><p className="auth-subtitle">Checking sign-in…</p></main>
  if (!allowed) return <Navigate to="/login" replace />
  const customCategories = menuSections.flatMap((section) => section.items.map((item) => item.name))
  return <AdminShell bloggerConnected={bloggerConnected} onLogout={onLogout}>{pdfUploadPage ? <PdfProductUploader /> : productsPage ? <ProductManager /> : aiModelsPage ? <AiModelSettingsPage /> : menusPage ? <MenuManager menuSections={menuSections} onChange={onChangeMenus} /> : createPage ? <PromptEditor onPublish={onPublish} customCategories={customCategories} /> : <AdminOverview prompts={prompts} blogStatus={blogStatus} />}</AdminShell>
}

function loadSideMenus(): SideMenuSection[] {
  try {
    const stored = window.localStorage.getItem(appConfig.storage.sideMenusKey)
    if (!stored) return defaultSideMenus
    const parsed = JSON.parse(stored) as SideMenuSection[]
    if (Array.isArray(parsed) && parsed.length === defaultSideMenus.length && parsed.every((section) => section.id && section.title && Array.isArray(section.items))) return parsed
  } catch { /* Fall back to the shipped menu if browser storage is unavailable or invalid. */ }
  return defaultSideMenus
}

export default function App() {
  const [bloggerConnected, setBloggerConnected] = useState(() => hasBloggerSession())
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [adminAuthReady, setAdminAuthReady] = useState(false)
  const [blogPrompts, setBlogPrompts] = useState<Prompt[] | null>(null)
  const [blogStatus, setBlogStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>(() => appConfig.contentProvider === 'blogger' ? (hasBloggerSession() ? 'connected' : 'loading') : 'idle')
  const [menuSections, setMenuSections] = useState<SideMenuSection[]>(loadSideMenus)
  const [localPrompts, setLocalPrompts] = useState<Prompt[]>(() => {
    try { return JSON.parse(window.localStorage.getItem(appConfig.storage.localPromptsKey) || '[]') as Prompt[] }
    catch { return [] }
  })
  const prompts = useMemo(() => [...localPrompts, ...(blogPrompts ?? promptCatalog)], [localPrompts, blogPrompts])
  useEffect(() => {
    let cancelled = false
    fetch('/api/admin-auth').then(async (response) => {
      const result = await response.json().catch(() => ({})) as { authenticated?: boolean }
      if (!cancelled) setAdminAuthenticated(Boolean(response.ok && result.authenticated))
    }).catch(() => { if (!cancelled) setAdminAuthenticated(false) })
      .finally(() => { if (!cancelled) setAdminAuthReady(true) })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    try { window.localStorage.setItem(appConfig.storage.sideMenusKey, JSON.stringify(menuSections)) }
    catch { /* Keep the in-memory menu usable if browser storage is unavailable. */ }
  }, [menuSections])
  useEffect(() => {
    if (appConfig.contentProvider !== 'blogger') return
    let cancelled = false
    setBlogStatus('loading')
    promptRepository.list().then((posts) => {
      if (cancelled) return
      setBlogPrompts(posts)
      setBlogStatus('connected')
    }).catch(() => {
      if (cancelled) return
      setBlogStatus('error')
    })
    return () => { cancelled = true }
  }, [bloggerConnected])
  const publishPrompt = (prompt: Prompt) => {
    if (localPrompts.some((item) => item.id === prompt.id)) return true
    const updated = [prompt, ...localPrompts]
    try { window.localStorage.setItem(appConfig.storage.localPromptsKey, JSON.stringify(updated)); setLocalPrompts(updated); return true }
    catch { return false }
  }
  const publishToBlogger = async (prompt: Prompt, target: { blogId: string; postId: string }) => {
    const result = await publishPromptToBlogger(prompt, target)
    const path = new URL(result.url).pathname.split('/').filter(Boolean)
    const blogPost: Prompt = {
      ...prompt,
      id: result.id,
      slug: path.at(-1) || prompt.slug,
      image: result.imageUrl,
      sourceUrl: result.url,
      createdAt: result.published ? result.published.slice(0, 10) : prompt.createdAt,
    }
    setBlogPrompts((current) => [blogPost, ...(current ?? promptCatalog).filter((item) => item.id !== result.id)])
    setBlogStatus('connected')
    return result
  }
  const addSocialTrend = (trend: SocialTrend): boolean => {
    const text = trend.text.trim().replace(/\s+/g, ' ')
    const title = (text.match(/^.{1,76}?(?:[.!?](?:\s|$)|$)/)?.[0] ?? text.slice(0, 76)).replace(/[.!?]+$/, '').trim() || 'Social prompt inspiration'
    const postedDate = new Date(trend.createdAt)
    return publishPrompt({
      id: `social-${trend.platform.toLowerCase()}-${trend.id}`,
      slug: `social-${trend.platform.toLowerCase()}-${trend.id}`,
      title,
      description: text.length > 180 ? `${text.slice(0, 177)}…` : text,
      promptText: text,
      category: 'Trending',
      tool: trend.platform,
      style: 'Social inspiration',
      featured: true,
      createdAt: Number.isNaN(postedDate.valueOf()) ? new Date().toISOString().slice(0, 10) : postedDate.toISOString().slice(0, 10),
      image: trend.imageUrl,
      sourceUrl: trend.permalink,
    })
  }
  const logout = () => {
    clearBloggerSession(); setBloggerConnected(false); setAdminAuthenticated(false)
    void fetch('/api/admin-auth', { method: 'DELETE' }).catch(() => undefined)
  }
  useEffect(() => { document.title = `${appConfig.appName || 'Promptseen'} — AI prompt library` }, [])
  useEffect(() => { void loadCustomerSession() }, [])
  const adminAllowed = bloggerConnected || adminAuthenticated
  return <Routes><Route path="/" element={<HomePage prompts={prompts} blogStatus={blogStatus} canGenerate={true} onAddTrend={addSocialTrend} menuSections={menuSections} adminLoggedIn={adminAuthenticated} />} /><Route path="/store" element={<StorePage />} /><Route path="/collage" element={<CollagePage />} /><Route path="/shorts" element={<ShortsPage />} /><Route path="/checkout/:productId" element={<CheckoutPage />} /><Route path="/prompt/:slug" element={<PromptPage prompts={prompts} />} /><Route path="/account" element={<AccountPage />} /><Route path="/login" element={<LoginPage onConnected={() => setBloggerConnected(true)} onAdminLogin={() => { setAdminAuthenticated(true); setAdminAuthReady(true) }} />} /><Route path="/admin/upload-pdf" element={<AdminGate authReady={adminAuthReady} allowed={adminAllowed} bloggerConnected={bloggerConnected} prompts={prompts} blogStatus={blogStatus} onPublish={publishToBlogger} onLogout={logout} menuSections={menuSections} onChangeMenus={setMenuSections} />} /><Route path="/admin/*" element={<AdminGate authReady={adminAuthReady} allowed={adminAllowed} bloggerConnected={bloggerConnected} prompts={prompts} blogStatus={blogStatus} onPublish={publishToBlogger} onLogout={logout} menuSections={menuSections} onChangeMenus={setMenuSections} />} /><Route path="*" element={<HomePage prompts={prompts} blogStatus={blogStatus} canGenerate={bloggerConnected} onAddTrend={addSocialTrend} menuSections={menuSections} adminLoggedIn={adminAuthenticated} />} /></Routes>
}

