import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Gallery from './Gallery.jsx'
import Editor from './Editor.jsx'
import { docFromTemplate } from '../data/templates.js'
import { cloneDoc, deleteDesign, loadDesigns, saveDesign, storeDesigns } from '../model.js'
import {
  deleteRemoteDesign, fetchRemoteDesigns, fetchRemoteLanguages, fetchRemoteTemplates, saveRemoteDesign,
} from '../remote.js'
import { Check, Close, Folder, Grid } from './Icons.jsx'

const clientDesign = (row) => ({
  id: row.id,
  name: row.name,
  templateId: row.templateId || null,
  category: row.category || 'Custom',
  aspect: row.aspect || 'portrait',
  colors: row.doc?.colors ? { ...row.doc.colors } : {},
  updatedAt: Date.parse(row.updatedAt) || Date.now(),
  doc: row.doc,
})

const mergeDesigns = (...lists) => {
  const map = new Map()
  for (const list of lists) {
    for (const item of list || []) {
      const current = map.get(item.id)
      if (!current || (item.updatedAt || 0) >= (current.updatedAt || 0)) map.set(item.id, item)
    }
  }
  return [...map.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export default function TemplateStudio({
  open = false,
  onClose,
  initialCategory = 'All',
  initialTemplateId = null,
  storageKey = 'qoder.template-studio.v1',
  apiBase = '/api',
}) {
  const [view, setView] = useState('gallery')
  const [tab, setTab] = useState('templates')
  const [category, setCategory] = useState(initialCategory || 'All')
  const [editorState, setEditorState] = useState(null)
  const [session, setSession] = useState(0)
  const [designs, setDesigns] = useState([])
  const [toast, setToast] = useState(null)
  const [remoteList, setRemoteList] = useState([])
  const [remoteLanguages, setRemoteLanguages] = useState([])
  const [remoteLanguage, setRemoteLanguage] = useState('All')
  const [remoteStatus, setRemoteStatus] = useState({ loading: false, error: '' })
  const [remoteNonce, setRemoteNonce] = useState(0)
  const toastTimer = useRef(null)
  const designsRef = useRef(designs)
  designsRef.current = designs

  const notify = (message) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  useEffect(() => {
    if (!open) return
    setDesigns(loadDesigns(storageKey))
    if (initialTemplateId) {
      const doc = docFromTemplate(initialTemplateId)
      if (doc) {
        setEditorState({ doc, designId: null })
        setSession((s) => s + 1)
        setView('editor')
        return
      }
    }
    setView('gallery')
    setTab('templates')
    setCategory(initialCategory || 'All')
  }, [open, initialTemplateId, initialCategory, storageKey])

  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  useEffect(() => {
    if (!open || !apiBase) return undefined
    let cancelled = false
    const local = loadDesigns(storageKey)
    fetchRemoteDesigns(apiBase)
      .then(async (rows) => {
        if (cancelled) return
        const remote = rows.map(clientDesign)
        const remoteById = new Map(remote.map((d) => [d.id, d]))
        const missing = local.filter((d) => {
          const server = remoteById.get(d.id)
          return !server || (d.updatedAt || 0) > (server.updatedAt || 0)
        })
        let pushed = []
        if (missing.length) {
          const results = await Promise.allSettled(missing.map((d) => saveRemoteDesign(apiBase, d)))
          if (cancelled) return
          pushed = results
            .filter((r) => r.status === 'fulfilled' && r.value)
            .map((r) => clientDesign(r.value))
        }
        const merged = mergeDesigns(remote, pushed, local)
        storeDesigns(storageKey, merged)
        setDesigns(merged)
      })
      .catch(() => { /* offline — the local cache already loaded */ })
    return () => { cancelled = true }
  }, [open, apiBase, storageKey])

  useEffect(() => {
    if (!open || !apiBase) return undefined
    let cancelled = false
    fetchRemoteLanguages(apiBase)
      .then((rows) => { if (!cancelled) setRemoteLanguages(rows) })
      .catch(() => { /* library is optional; built-in templates still work */ })
    return () => { cancelled = true }
  }, [open, apiBase])

  useEffect(() => {
    if (!open || !apiBase) return undefined
    let cancelled = false
    setRemoteStatus({ loading: true, error: '' })
    fetchRemoteTemplates(apiBase, remoteLanguage)
      .then((rows) => {
        if (cancelled) return
        setRemoteList(rows)
        setRemoteStatus({ loading: false, error: '' })
      })
      .catch((err) => {
        if (cancelled) return
        setRemoteList([])
        setRemoteStatus({ loading: false, error: err.message })
      })
    return () => { cancelled = true }
  }, [open, apiBase, remoteLanguage, remoteNonce])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && view === 'gallery') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, view, onClose])

  if (!open || typeof document === 'undefined') return null

  const openTemplate = (id) => {
    const doc = docFromTemplate(id)
    if (!doc) return
    setEditorState({ doc, designId: null })
    setSession((s) => s + 1)
    setView('editor')
  }

  const openDesign = (design) => {
    setEditorState({ doc: design.doc, designId: design.id })
    setSession((s) => s + 1)
    setView('editor')
  }

  const openRemote = (row) => {
    if (!row?.design) {
      notify('This template has no editable design yet')
      return
    }
    setEditorState({ doc: cloneDoc(row.design), designId: null, remoteRow: row })
    setSession((s) => s + 1)
    setView('editor')
  }

  const handleDelete = async (id) => {
    const next = deleteDesign(storageKey, designs, id)
    setDesigns(next)
    notify('Design deleted')
    if (!apiBase) return
    try {
      await deleteRemoteDesign(apiBase, id)
    } catch {
      notify('Deleted here, but the library database is unreachable')
    }
  }

  const handleSaveDesign = async (doc, designId) => {
    const { entry, designs: next } = saveDesign(storageKey, designsRef.current, doc, designId)
    designsRef.current = next
    setDesigns(next)
    if (!apiBase) return { id: entry.id }
    let remote
    try {
      remote = await saveRemoteDesign(apiBase, entry)
    } catch (err) {
      const detail = err?.message ? ` (${err.message})` : ''
      throw new Error(`Saved on this device, but the database save failed${detail} — try Save again`)
    }
    if (!remote) return { id: entry.id }
    const saved = clientDesign(remote)
    const merged = mergeDesigns([saved], designsRef.current)
    storeDesigns(storageKey, merged)
    designsRef.current = merged
    setDesigns(merged)
    return { id: saved.id }
  }

  const goGallery = () => setView('gallery')

  return createPortal(
    <div className="ts-root">
      <div
        className="ts-backdrop"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      >
        <div className="ts-shell" role="dialog" aria-modal="true" aria-label="Template studio">
          {view === 'editor' && editorState ? (
            <Editor
              key={session}
              initialDoc={editorState.doc}
              designId={editorState.designId}
              designs={designs}
              storageKey={storageKey}
              onDesignsChange={setDesigns}
              onSave={handleSaveDesign}
              onBack={goGallery}
              onClose={onClose}
              onToast={notify}
              languageLabel={editorState.remoteRow?.languageNative || editorState.remoteRow?.languageLabel || ''}
              apiBase={apiBase}
            />
          ) : (
            <>
              <header className="ts-topbar">
                <div className="ts-brand">
                  <span className="ts-mark">A</span>
                  <span className="ts-brand-text">
                    <b>Template Studio</b>
                    <em>Atelier Invite</em>
                  </span>
                </div>
                <div className="ts-tabs" role="tablist" aria-label="Studio views">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'templates'}
                    className={`ts-tab${tab === 'templates' ? ' is-active' : ''}`}
                    onClick={() => setTab('templates')}
                  >
                    <Grid size={14} /> Templates
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'saved'}
                    className={`ts-tab${tab === 'saved' ? ' is-active' : ''}`}
                    onClick={() => setTab('saved')}
                  >
                    <Folder size={14} /> My designs
                    {designs.length > 0 && <span className="ts-tab-badge">{designs.length}</span>}
                  </button>
                </div>
                <div className="ts-top-actions">
                  <span className="ts-top-note">Fully editable · Saved to the library</span>
                  <button type="button" className="ts-icon-btn ts-close" onClick={onClose} title="Close studio">
                    <Close size={18} />
                  </button>
                </div>
              </header>
              <Gallery
                designs={designs}
                tab={tab}
                category={category}
                onCategoryChange={setCategory}
                onUseTemplate={openTemplate}
                onOpenDesign={openDesign}
                onDeleteDesign={handleDelete}
                onBrowseTemplates={() => { setTab('templates'); setCategory('All') }}
                remoteTemplates={remoteList}
                remoteLanguages={remoteLanguages}
                remoteLanguage={remoteLanguage}
                onRemoteLanguageChange={setRemoteLanguage}
                onUseRemote={openRemote}
                remoteState={remoteStatus}
                onRefreshRemote={() => setRemoteNonce((n) => n + 1)}
                onManageLibrary={() => {
                  onClose?.()
                  if (typeof window !== 'undefined') window.location.hash = '#/admin'
                }}
              />
            </>
          )}

          {toast && (
            <div className="ts-toast" role="status">
              <Check size={14} />
              <span>{toast}</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
