import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check, Image as ImageIcon, Loader2, Layers, ShieldCheck, X } from 'lucide-react'
import { readPosterSource, splitPostIntoPosterEdits } from '../../data/blogger-poster-split'
import { connectBlogger, hasBloggerSession } from '../../data/blogger-auth'
import './PosterSplitter.css'

const SOURCE_LINK = 'https://www.blogger.com/blog/post/edit/7320184749093787409/1981281416180194204'

export default function PosterSplitter() {
  const [link, setLink] = useState(SOURCE_LINK)
  const [source, setSource] = useState(null)
  const [items, setItems] = useState([])
  const [picked, setPicked] = useState([])
  const [asDraft, setAsDraft] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(hasBloggerSession)

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      await connectBlogger()
      setConnected(true)
      setNotice('Blogger connected successfully.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not connect to Blogger.')
    } finally {
      setConnecting(false)
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    setNotice('')
    setSource(null)
    setItems([])
    setProgress([])
    try {
      const post = await readPosterSource(link)
      const postItems = post.items || []
      setSource(post)
      setItems(postItems)
      setPicked(postItems.map((item) => item.id))
      setNotice(`${postItems.length} photos and prompts found in “${post.title}”. You can review and edit each title & prompt before publishing.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not read that Blogger post.')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id) => setPicked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))

  const updateItemTitle = (id, title) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)))
  }

  const updateItemPrompt = (id, prompt) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, prompt } : item)))
  }

  const create = async () => {
    if (!source) return
    const selected = items.filter((item) => picked.includes(item.id))
    if (!selected.length) {
      setError('Select at least one photo to create a post for it.')
      return
    }
    if (!hasBloggerSession()) {
      try {
        setNotice('Connecting to Blogger to publish split posts…')
        await connectBlogger()
        setConnected(true)
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Connect Blogger to create new posts.')
        return
      }
    }
    setBusy(true)
    setError('')
    setNotice('')
    setProgress([])
    try {
      const created = await splitPostIntoPosterEdits(source, selected, {
        asDraft,
        onProgress: (list) => setProgress(list),
      })
      setNotice(`${created.length} post${created.length > 1 ? 's' : ''} published to Blogger with individual title, photo, and prompt.`)
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
          <span className="admin-kicker">IMGMOJO / POST SPLITTER</span>
          <h1>Split a post into separate posts</h1>
          <p>One Blogger post holding many photos becomes one post per photo. Each post carries the image, title, prompt text, and categories just like other posts.</p>
        </div>
        <Link to="/admin" className="admin-secondary"><ArrowLeft size={15} /> Back to dashboard</Link>
      </div>

      {!connected ? (
        <div className="ps-connect">
          <ShieldCheck size={16} />
          <span>Connect Blogger — required when creating new split posts.</span>
          <button type="button" className="ps-connect-btn" onClick={() => void handleConnect()} disabled={connecting}>
            {connecting ? 'Connecting…' : 'Connect Blogger'}
          </button>
        </div>
      ) : (
        <div className="ps-connect ps-connected">
          <Check size={16} />
          <span>Blogger connected — ready to create split posts.</span>
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
          <button type="button" className="admin-primary" onClick={() => void load()} disabled={loading || !link.trim()}>
            {loading ? <><Loader2 size={15} className="ps-spin" /> Reading…</> : <><ImageIcon size={15} /> Find photos</>}
          </button>
        </div>
        <small className="ps-hint">Every image inside the post is listed below. Each will be published as an individual prompt post with its title, photo, and text.</small>
      </section>

      {source && (
        <section className="ps-panel">
          <div className="ps-source-head">
            <div>
              <span className="admin-kicker">PHOTOS IN “{source.title}”</span>
              <strong>{picked.length} of {items.length} selected for split</strong>
            </div>
            <button type="button" className="admin-secondary" onClick={() => setPicked(picked.length === items.length ? [] : items.map((image) => image.id))}>
              {picked.length === items.length ? <><X size={14} /> Clear</> : <><Check size={14} /> Select all</>}
            </button>
          </div>

          <div className="ps-items-list">
            {items.map((item, index) => {
              const on = picked.includes(item.id)
              return (
                <div key={item.id} className={`ps-split-card${on ? ' is-on' : ''}`}>
                  <div className="ps-card-aside">
                    <button
                      type="button"
                      className="ps-card-img-btn"
                      onClick={() => toggle(item.id)}
                      aria-pressed={on}
                      title={on ? 'Click to deselect' : 'Click to select'}
                    >
                      <img src={item.url} alt={item.alt || item.title} loading="lazy" />
                      <span className={`ps-card-tick${on ? ' is-active' : ''}`}>
                        {on ? <Check size={13} /> : null}
                      </span>
                    </button>
                    <span className="ps-card-badge">Photo #{index + 1}</span>
                    <button
                      type="button"
                      className={`ps-toggle-btn${on ? ' is-selected' : ''}`}
                      onClick={() => toggle(item.id)}
                    >
                      {on ? 'Included' : 'Excluded'}
                    </button>
                  </div>

                  <div className="ps-card-fields">
                    <div className="ps-field">
                      <label htmlFor={`title-${item.id}`}>Post Title</label>
                      <input
                        id={`title-${item.id}`}
                        className="ps-item-input"
                        value={item.title}
                        onChange={(e) => updateItemTitle(item.id, e.target.value)}
                        placeholder="Define title for this post"
                      />
                    </div>
                    <div className="ps-field">
                      <label htmlFor={`prompt-${item.id}`}>Prompt Copy</label>
                      <textarea
                        id={`prompt-${item.id}`}
                        className="ps-item-textarea"
                        rows={5}
                        value={item.prompt}
                        onChange={(e) => updateItemPrompt(item.id, e.target.value)}
                        placeholder="Define AI prompt text for this photo"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
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
