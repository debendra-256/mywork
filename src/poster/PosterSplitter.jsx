import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check, Image as ImageIcon, Loader2, Layers, ShieldCheck, X } from 'lucide-react'
import { POSTER_LABEL, posterEditUrl, readPosterSource, splitPostIntoPosterEdits } from '../data/blogger-poster-split'
import { hasBloggerSession } from '../data/blogger-auth'
import './PosterSplitter.css'

const SOURCE_LINK = 'https://www.blogger.com/blog/post/edit/1194691713972639537/2401058807252053039'

export default function PosterSplitter() {
  const [link, setLink] = useState(SOURCE_LINK)
  const [source, setSource] = useState(null)
  const [picked, setPicked] = useState([])
  const [asDraft, setAsDraft] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const connected = hasBloggerSession()

  const load = async () => {
    setLoading(true)
    setError('')
    setNotice('')
    setSource(null)
    setProgress([])
    try {
      const post = await readPosterSource(link)
      setSource(post)
      setPicked(post.images.map((image) => image.url))
      setNotice(`${post.images.length} photos found in “${post.title}” — each one becomes its own post.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not read that Blogger post.')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (url) => setPicked((prev) => (prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]))

  const create = async () => {
    if (!source) return
    const images = source.images.filter((image) => picked.includes(image.url))
    setBusy(true)
    setError('')
    setNotice('')
    setProgress([])
    try {
      const created = await splitPostIntoPosterEdits(source, images, {
        asDraft,
        onProgress: (list) => setProgress(list),
      })
      setNotice(`${created.length} post${created.length > 1 ? 's' : ''} created with the ${POSTER_LABEL} label.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Blogger could not create those posts.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">PROMPTSEEN / CREATIVE POSTER</span>
          <h1>Split a post into poster edits</h1>
          <p>One Blogger post holding many photos becomes one post per photo. Each post carries only the image and a <strong>Create your poster</strong> button that opens the poster editor with that photo — no titles, no instructions, no prompt text.</p>
        </div>
        <Link to="/admin" className="admin-secondary"><ArrowLeft size={15} /> Back to dashboard</Link>
      </div>

      {!connected && (
        <div className="ps-connect">
          <ShieldCheck size={16} />
          <span>Connect Blogger first — the split reads your post and creates new ones as you.</span>
          <Link to="/login">Connect Blogger</Link>
        </div>
      )}

      <section className="ps-panel">
        <span className="admin-kicker">SOURCE POST</span>
        <div className="ps-link-row">
          <input
            className="ps-link"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://www.blogger.com/blog/post/edit/blogId/postId"
            spellCheck={false}
            aria-label="Blogger post edit link"
          />
          <button type="button" className="admin-primary" onClick={() => void load()} disabled={loading || !connected}>
            {loading ? <><Loader2 size={15} className="ps-spin" /> Reading…</> : <><ImageIcon size={15} /> Find photos</>}
          </button>
        </div>
        <small className="ps-hint">Every image inside the post is listed below. Photos for editing carry the {POSTER_LABEL} label so they stay apart from prompt templates.</small>
      </section>

      {source && (
        <section className="ps-panel">
          <div className="ps-source-head">
            <div>
              <span className="admin-kicker">PHOTOS IN “{source.title}”</span>
              <strong>{picked.length} of {source.images.length} selected</strong>
            </div>
            <button type="button" className="admin-secondary" onClick={() => setPicked(picked.length === source.images.length ? [] : source.images.map((image) => image.url))}>
              {picked.length === source.images.length ? <><X size={14} /> Clear</> : <><Check size={14} /> Select all</>}
            </button>
          </div>
          <div className="ps-photo-grid">
            {source.images.map((image, index) => {
              const on = picked.includes(image.url)
              return (
                <button
                  type="button"
                  key={image.url}
                  className={`ps-photo${on ? ' is-on' : ''}`}
                  onClick={() => toggle(image.url)}
                  aria-pressed={on}
                >
                  <span className="ps-photo-stage"><img src={image.url} alt={image.alt || ''} loading="lazy" /></span>
                  <span className="ps-photo-foot">
                    <b>Photo {index + 1}</b>
                    <span>{on ? 'Will create a post' : 'Skipped'}</span>
                  </span>
                  {on && <span className="ps-photo-tick"><Check size={11} /></span>}
                </button>
              )
            })}
          </div>
          <div className="ps-preview">
            <span className="admin-kicker">EDIT BUTTON TARGET</span>
            <code>{posterEditUrl(source.images[0].url)}</code>
          </div>
          <label className="ps-switch">
            <input type="checkbox" checked={asDraft} onChange={(event) => setAsDraft(event.target.checked)} />
            <span>
              <strong>Create as drafts</strong>
              <small>Leave them unpublished in Blogger so you can check each one first.</small>
            </span>
          </label>
          <button type="button" className="admin-primary ps-create" onClick={() => void create()} disabled={busy || !picked.length}>
            {busy ? <><Loader2 size={15} className="ps-spin" /> Creating {picked.length} post{picked.length > 1 ? 's' : ''}…</> : <><Layers size={15} /> Create {picked.length} post{picked.length > 1 ? 's' : ''}</>}
          </button>
        </section>
      )}

      {progress.length > 0 && (
        <section className="ps-panel">
          <span className="admin-kicker">CREATED</span>
          <ul className="ps-result">
            {progress.map((item) => (
              <li key={item.id}>
                <Check size={14} />
                <span>{item.title}</span>
                {item.url && <a href={item.url} target="_blank" rel="noreferrer">Open post <ArrowUpRight size={12} /></a>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="editor-error" role="alert">{error}</p>}
      {notice && <p className="ps-notice" role="status">{notice}</p>}
    </>
  )
}
