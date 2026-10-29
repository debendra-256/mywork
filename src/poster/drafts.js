const STORAGE_KEY = 'promptseen.create-poster.drafts.v1'
const MAX_DRAFTS = 12

const clone = (value) => JSON.parse(JSON.stringify(value))

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function loadDrafts() {
  const store = storage()
  if (!store) return []
  try {
    const parsed = JSON.parse(store.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry) => entry && entry.id && entry.doc && Array.isArray(entry.doc.elements))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  } catch {
    return []
  }
}

export function saveDraft(doc, designId) {
  const store = storage()
  if (!store) throw new Error('This browser cannot store drafts — download the PNG instead')
  const id = designId || `poster_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
  const entry = {
    id,
    name: doc.name || 'Untitled poster',
    templateId: doc.templateId || null,
    aspect: doc.aspect,
    updatedAt: Date.now(),
    doc: clone(doc),
  }
  const next = [entry, ...loadDrafts().filter((draft) => draft.id !== id)].slice(0, MAX_DRAFTS)
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    throw new Error('This draft is too big for browser storage — try a smaller photo')
  }
  return { entry, drafts: next }
}

export function deleteDraft(id) {
  const store = storage()
  const next = loadDrafts().filter((draft) => draft.id !== id)
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* nothing was removed from disk; the in-memory list still updates */
  }
  return next
}
