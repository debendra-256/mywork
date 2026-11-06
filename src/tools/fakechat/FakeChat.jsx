import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Download, ImagePlus, Moon, Plus, RotateCcw, Smile, Sun, Trash2 } from 'lucide-react'
import { STATUS_OPTIONS, STYLE_OPTIONS, drawChat, formatChatTime } from './render'
import { EMOJI_GROUPS } from './emoji'
import './FakeChat.css'

const imageCache = new Map()

function loadImage(src) {
  if (!src) return Promise.resolve(null)
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => resolve(null)
      image.src = src
    }))
  }
  return imageCache.get(src)
}

function fileToDataUrl(file, max) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Choose an image file.')); return }
    if (file.size > 12 * 1024 * 1024) { reject(new Error('Choose an image under 12 MB.')); return }
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

const defaultContact = () => ({ name: 'Maya', lastSeen: 'last seen today at 9:45 AM', avatar: '' })

const defaultMessages = () => [
  { id: 'm1', side: 'them', text: 'Hey! Did you try the new ImgMojo editor?', time: '9:41 AM', status: 'read', image: '' },
  { id: 'm2', side: 'me', text: 'Just did. The poster and QR tools are so quick.', time: '9:42 AM', status: 'read', image: '' },
  { id: 'm3', side: 'them', text: 'Send me the link, I want to try the fake chat maker 👀', time: '9:43 AM', status: 'read', image: '' },
  { id: 'm4', side: 'me', text: 'imgmojo.com/fakechat — pick WhatsApp or Messenger, then download the PNG.', time: '9:44 AM', status: 'read', image: '' },
  { id: 'm5', side: 'them', text: 'This is going to be fun 😄', time: '9:45 AM', status: 'read', image: '' },
]

function initials(name) {
  return String(name ?? '').trim().slice(0, 1).toUpperCase() || '?'
}

function EmojiPanel({ group, onGroup, onPick }) {
  const active = EMOJI_GROUPS.find((entry) => entry.id === group) ?? EMOJI_GROUPS[0]
  return <div className="fakechat-emoji" role="dialog" aria-label="Choose an emoji">
    <div className="fakechat-emoji-tabs" role="tablist" aria-label="Emoji categories">
      {EMOJI_GROUPS.map((entry) => <button key={entry.id} type="button" role="tab" title={entry.label} aria-selected={entry.id === active.id} className={entry.id === active.id ? 'is-active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => onGroup(entry.id)}>
        <span aria-hidden="true">{entry.emojis[0]}</span><span className="fakechat-sr-only">{entry.label}</span>
      </button>)}
    </div>
    <div className="fakechat-emoji-grid">
      {active.emojis.map((emoji) => <button key={emoji} type="button" aria-label={`Insert ${emoji}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(emoji)}>{emoji}</button>)}
    </div>
  </div>
}

export default function FakeChat() {
  const [style, setStyle] = useState('whatsapp')
  const [dark, setDark] = useState(false)
  const [contact, setContact] = useState(defaultContact)
  const [dateLabel, setDateLabel] = useState('Today')
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
  const canvasRef = useRef(null)
  const composerRef = useRef(null)
  const messageRefs = useRef(new Map())

  const imageSources = useMemo(() => {
    const sources = [contact.avatar, ...messages.map((message) => message.image)].filter(Boolean)
    return [...new Set(sources)]
  }, [contact.avatar, messages])

  useEffect(() => {
    let cancelled = false
    Promise.all(imageSources.map(async (src) => [src, await loadImage(src)])).then((entries) => {
      if (cancelled || !canvasRef.current) return
      const images = new Map(entries.filter(([, image]) => image))
      const result = drawChat(canvasRef.current, { style, dark, contact, dateLabel, messages }, images, exportWidth)
      setDims((current) => current.width === result.width && current.height === result.height ? current : result)
    })
    return () => { cancelled = true }
  }, [style, dark, contact, dateLabel, messages, exportWidth, imageSources])

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
  const updateMessage = (id, patch) => setMessages((current) => current.map((message) => message.id === id ? { ...message, ...patch } : message))

  const toggleEmoji = (target) => setEmojiPanel((current) => current === target ? null : target)

  const insertEmoji = (target, emoji) => {
    const field = target === 'composer' ? composerRef.current : messageRefs.current.get(target)
    if (!field) return
    field.focus()
    const start = field.selectionStart ?? field.value.length
    const end = field.selectionEnd ?? start
    field.setSelectionRange(start, end)
    // Native insert keeps the caret after the emoji and fires the controlled onChange.
    let inserted = false
    try { inserted = document.execCommand('insertText', false, emoji) } catch { inserted = false }
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
    try { updateContact({ avatar: await fileToDataUrl(file, 320) }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not use that image.') }
  }

  const uploadDraftImage = async (file) => {
    if (!file) return
    setError('')
    try { setDraftImage(await fileToDataUrl(file, 1100)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not use that image.') }
  }

  const uploadMessageImage = async (id, file) => {
    if (!file) return
    setError('')
    try { updateMessage(id, { image: await fileToDataUrl(file, 1100) }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not use that image.') }
  }

  const addMessage = () => {
    const text = draftText.trim()
    if (!text && !draftImage) return
    setMessages((current) => [...current, {
      id: messageId(),
      side: draftSide,
      text,
      time: draftTime.trim() || formatChatTime(),
      status: 'read',
      image: draftImage,
    }])
    setDraftText('')
    setDraftImage('')
    setDraftTime(formatChatTime())
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
    link.download = 'imgmojo-fakechat.png'
    link.click()
  }

  const reset = () => {
    if (!window.confirm('Reset this chat to the sample conversation?')) return
    setStyle('whatsapp')
    setDark(false)
    setContact(defaultContact())
    setDateLabel('Today')
    setMessages(defaultMessages())
    setEditingId(null)
    setDraftText('')
    setDraftImage('')
    setDraftTime(formatChatTime())
    setError('')
  }

  return <section className="fakechat-tool" aria-label="FakeChat generator">
    <div className="fakechat-layout">
      <div className="fakechat-controls">
        <section className="fakechat-block">
          <div className="fakechat-block-head"><h2>Chat style</h2><span>{style === 'messenger' ? 'Messenger' : 'WhatsApp'}</span></div>
          <div className="fakechat-segmented" role="radiogroup" aria-label="Chat style">
            {STYLE_OPTIONS.map((option) => <button key={option.id} type="button" role="radio" aria-checked={style === option.id} className={style === option.id ? 'is-active' : ''} onClick={() => setStyle(option.id)}><i className={`fakechat-style-dot ${option.id}`} />{option.label}</button>)}
          </div>
          <div className="fakechat-inline-row">
            <button type="button" role="switch" aria-checked={dark} className={`fakechat-switch ${dark ? 'is-on' : ''}`} onClick={() => setDark((value) => !value)}><span className="fakechat-switch-track"><span /></span>{dark ? <><Moon size={14} /> Dark theme</> : <><Sun size={14} /> Light theme</>}</button>
            <label className="fakechat-field fakechat-field-inline">Date label<input value={dateLabel} maxLength={24} onChange={(event) => setDateLabel(event.target.value)} placeholder="Today" /></label>
          </div>
        </section>

        <section className="fakechat-block">
          <div className="fakechat-block-head"><h2>Contact</h2><span>Shown in the chat header</span></div>
          <div className="fakechat-avatar-row">
            <span className="fakechat-avatar-preview">
              {contact.avatar ? <img src={contact.avatar} alt="" /> : initials(contact.name)}
            </span>
            <label className="fakechat-upload">Upload photo<input type="file" accept="image/*" onChange={(event) => { void uploadAvatar(event.currentTarget.files?.[0] ?? null); event.currentTarget.value = '' }} /></label>
            {contact.avatar && <button type="button" className="fakechat-link-button" onClick={() => updateContact({ avatar: '' })}>Remove</button>}
          </div>
          <div className="fakechat-two-fields">
            <label className="fakechat-field">Contact name<input value={contact.name} maxLength={40} onChange={(event) => updateContact({ name: event.target.value })} placeholder="Maya" /></label>
            <label className="fakechat-field">Status line<input value={contact.lastSeen} maxLength={54} onChange={(event) => updateContact({ lastSeen: event.target.value })} placeholder="last seen today at 9:45 AM" /></label>
          </div>
        </section>

        <section className="fakechat-block">
          <div className="fakechat-block-head"><h2>Messages</h2><span>{messages.length} in this chat</span></div>
          <div className="fakechat-message-list">
            {messages.map((message, index) => {
              const open = editingId === message.id
              return <article className={`fakechat-message ${message.side} ${open ? 'is-open' : ''}`} key={message.id}>
                <button type="button" className="fakechat-message-row" onClick={() => { setEditingId(open ? null : message.id); setEmojiPanel(null) }} aria-expanded={open}>
                  <span className="fakechat-message-index">{index + 1}</span>
                  <span className="fakechat-message-copy">
                    <span className="fakechat-message-text">{message.image && <ImagePlus size={12} />}{message.text || (message.image ? 'Photo message' : 'Empty message')}</span>
                    <span className="fakechat-message-meta">{message.side === 'me' ? 'Me' : 'Them'} · {message.time}{message.side === 'me' && message.status ? ` · ${message.status}` : ''}</span>
                  </span>
                </button>
                {open && <div className="fakechat-message-editor">
                  <label className="fakechat-field">Message text<textarea ref={(field) => { if (field) messageRefs.current.set(message.id, field); else messageRefs.current.delete(message.id) }} rows={3} value={message.text} maxLength={600} onChange={(event) => updateMessage(message.id, { text: event.target.value })} placeholder="Type the message" /></label>
                  {emojiPanel === message.id && <EmojiPanel group={emojiGroup} onGroup={setEmojiGroup} onPick={(emoji) => insertEmoji(message.id, emoji)} />}
                  <div className="fakechat-three-fields">
                    <label className="fakechat-field">From<select value={message.side} onChange={(event) => updateMessage(message.id, { side: event.target.value })}><option value="me">Me</option><option value="them">Them</option></select></label>
                    <label className="fakechat-field">Time<input value={message.time} maxLength={16} onChange={(event) => updateMessage(message.id, { time: event.target.value })} placeholder="9:45 AM" /></label>
                    <label className="fakechat-field">Status<select value={message.status || 'read'} disabled={message.side !== 'me'} onChange={(event) => updateMessage(message.id, { status: event.target.value })}>{STATUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
                  </div>
                  <div className="fakechat-message-tools">
                    {message.image ? <div className="fakechat-attach">
                      <img src={message.image} alt="" />
                      <button type="button" className="fakechat-link-button" onClick={() => updateMessage(message.id, { image: '' })}>Remove photo</button>
                    </div> : <label className="fakechat-upload fakechat-upload-small"><ImagePlus size={14} /> Add photo<input type="file" accept="image/*" onChange={(event) => { void uploadMessageImage(message.id, event.currentTarget.files?.[0] ?? null); event.currentTarget.value = '' }} /></label>}
                    <div className="fakechat-message-actions">
                      <button type="button" className={`fakechat-icon-button ${emojiPanel === message.id ? 'is-active' : ''}`} data-emoji-toggle aria-label="Add emoji" aria-expanded={emojiPanel === message.id} onClick={() => toggleEmoji(message.id)}><Smile size={15} /></button>
                      <button type="button" className="fakechat-icon-button" aria-label="Move message up" disabled={index === 0} onClick={() => moveMessage(index, -1)}><ArrowUp size={15} /></button>
                      <button type="button" className="fakechat-icon-button" aria-label="Move message down" disabled={index === messages.length - 1} onClick={() => moveMessage(index, 1)}><ArrowDown size={15} /></button>
                      <button type="button" className="fakechat-icon-button danger" aria-label="Delete message" onClick={() => removeMessage(message.id)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>}
              </article>
            })}
            {!messages.length && <p className="fakechat-empty">No messages yet. Add the first one below.</p>}
          </div>

          <div className="fakechat-composer">
            <label className="fakechat-field">New message<textarea ref={composerRef} rows={2} value={draftText} maxLength={600} onChange={(event) => setDraftText(event.target.value)} placeholder="Type a message…" /></label>
            {emojiPanel === 'composer' && <EmojiPanel group={emojiGroup} onGroup={setEmojiGroup} onPick={(emoji) => insertEmoji('composer', emoji)} />}
            <div className="fakechat-composer-row">
              <div className="fakechat-segmented fakechat-segmented-small" role="radiogroup" aria-label="Message sender">
                <button type="button" role="radio" aria-checked={draftSide === 'me'} className={draftSide === 'me' ? 'is-active' : ''} onClick={() => setDraftSide('me')}>Me</button>
                <button type="button" role="radio" aria-checked={draftSide === 'them'} className={draftSide === 'them' ? 'is-active' : ''} onClick={() => setDraftSide('them')}>Them</button>
              </div>
              <label className="fakechat-field fakechat-field-time">Time<input value={draftTime} maxLength={16} onChange={(event) => setDraftTime(event.target.value)} placeholder="9:45 AM" /></label>
              <button type="button" data-emoji-toggle aria-label="Add emoji" aria-expanded={emojiPanel === 'composer'} className={`fakechat-emoji-toggle ${emojiPanel === 'composer' ? 'is-active' : ''}`} onClick={() => toggleEmoji('composer')}><Smile size={15} /> Emoji</button>
              <label className="fakechat-upload fakechat-upload-small"><ImagePlus size={14} /> Photo<input type="file" accept="image/*" onChange={(event) => { void uploadDraftImage(event.currentTarget.files?.[0] ?? null); event.currentTarget.value = '' }} /></label>
              <button type="button" className="fakechat-add" onClick={addMessage} disabled={!draftText.trim() && !draftImage}><Plus size={15} /> Add message</button>
            </div>
            {draftImage && <div className="fakechat-attach fakechat-attach-draft">
              <img src={draftImage} alt="" />
              <button type="button" className="fakechat-link-button" onClick={() => setDraftImage('')}>Remove photo</button>
            </div>}
            {error && <p className="fakechat-error" role="alert">{error}</p>}
          </div>
        </section>

        <p className="fakechat-disclaimer">For fun and creative projects. Please don’t use fake chats to mislead people.</p>
      </div>

      <aside className="fakechat-preview-card">
        <div className="fakechat-preview-head"><span>Live preview</span><span>{dims.width} × {dims.height} px</span></div>
        <div className="fakechat-screen"><canvas ref={canvasRef} className="fakechat-canvas" role="img" aria-label="Fake chat screenshot preview" /></div>
        <div className="fakechat-export">
          <label className="fakechat-field">Image size<select value={exportWidth} onChange={(event) => setExportWidth(Number(event.target.value))}><option value={720}>720 px wide</option><option value={1080}>1080 px wide</option></select></label>
          <div className="fakechat-export-actions">
            <button type="button" className="fakechat-download" onClick={download} disabled={!dims.width}><Download size={16} /> Download PNG</button>
            <button type="button" className="fakechat-reset" onClick={reset}><RotateCcw size={15} /> Reset</button>
          </div>
        </div>
        <p className="fakechat-note">Updates live as you type. Photos never leave this browser.</p>
      </aside>
    </div>
  </section>
}
