import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, ClipboardPaste, Download, Instagram, LoaderCircle, ShieldCheck, Sparkles, Video } from 'lucide-react'
import './InstagramDownloader.css'

const KIND_LABELS = { reel: 'Reel', p: 'Photo', tv: 'IGTV' }

function downloadName(post) {
  const ext = post.mediaType === 'VIDEO' ? 'mp4' : 'jpg'
  return `imgmojo-${post.shortcode}.${ext}`
}

export default function InstagramDownloader() {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [post, setPost] = useState(null)
  const [thumbFailed, setThumbFailed] = useState(false)

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) { setUrl(text.trim()); setError('') }
    } catch {
      setError('Clipboard is not accessible — paste the link with Ctrl+V instead.')
    }
  }

  const resolve = async () => {
    const trimmed = url.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError('')
    setPost(null)
    setThumbFailed(false)
    try {
      const response = await fetch(`/api/instagram?url=${encodeURIComponent(trimmed)}`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not resolve this Instagram link.')
      setPost(data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Network error — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="igdl-page">
    <div className="igdl-card">
      <div className="igdl-heading">
        <span className="igdl-icon"><Instagram size={26} /></span>
        <div>
          <h1>Instagram Video Downloader</h1>
          <p>Download reels, videos, and photos from a public Instagram link.</p>
        </div>
      </div>
      <form className="igdl-bar" onSubmit={(event) => { event.preventDefault(); void resolve() }}>
        <input value={url} onChange={(event) => { setUrl(event.target.value); setError('') }} placeholder="Paste the Instagram reel or photo link here…" aria-label="Instagram post link" inputMode="url" />
        <button type="button" className="igdl-paste" onClick={() => void pasteFromClipboard()} title="Paste from clipboard"><ClipboardPaste size={16} /></button>
        <button type="submit" className="igdl-fetch" disabled={busy || !url.trim()}>{busy ? <LoaderCircle className="igdl-spin" size={16} /> : <Download size={16} />} {busy ? 'Fetching…' : 'Fetch'}</button>
      </form>
      {error && <p className="igdl-error" role="alert">{error}</p>}
      {post && <div className="igdl-result">
        <a className="igdl-thumb" href={post.permalink} target="_blank" rel="noreferrer">
          {post.thumbnailUrl && !thumbFailed
            ? <img src={`/api/instagram?thumb=1&u=${encodeURIComponent(post.thumbnailUrl)}`} alt="Instagram post preview" onError={() => setThumbFailed(true)} />
            : <span className="igdl-thumb-fallback">{post.mediaType === 'IMAGE' ? <Sparkles size={30} /> : <Video size={30} />}</span>}
          <span className="igdl-kind">{KIND_LABELS[post.kind] ?? 'Post'}</span>
        </a>
        <div className="igdl-meta">
          {post.authorName && <a className="igdl-author" href={post.authorUrl} target="_blank" rel="noreferrer">@{post.authorName} <ArrowUpRight size={13} /></a>}
          {post.title && <p className="igdl-caption">{post.title}</p>}
          {post.mediaUrl
            ? <a className="igdl-download" href={post.mediaUrl} download={downloadName(post)} target="_blank" rel="noreferrer"><Download size={16} /> Download {post.mediaType === 'VIDEO' ? 'MP4 video' : 'full photo'}</a>
            : <>
                {post.mediaError && <p className="igdl-error" role="alert">{post.mediaError}</p>}
                <p className="igdl-note">The media file could not be fetched for this post. It may be private, a multi-photo carousel, or Instagram temporarily blocked the request — try again in a moment.</p>
                <a className="igdl-open" href={post.permalink} target="_blank" rel="noreferrer">Open on Instagram <ArrowUpRight size={13} /></a>
              </>}
        </div>
      </div>}
    </div>
    <div className="igdl-steps">
      <div className="igdl-step"><span>1</span><p>Copy the reel or photo link from Instagram (Share → Copy link).</p></div>
      <div className="igdl-step"><span>2</span><p>Paste it into the box above and press Fetch.</p></div>
      <div className="igdl-step"><span>3</span><p>Preview the post, then download the MP4 or photo.</p></div>
    </div>
    <p className="igdl-fineprint"><ShieldCheck size={13} /> Downloads are for personal use. Respect the creator's rights and Instagram's terms.</p>
  </div>
}
