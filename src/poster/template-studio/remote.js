async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'Admin token required' : `Library request failed (${res.status})`)
  }
  return res.json()
}

async function sendJson(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Library request failed (${res.status})`)
  return data
}

export async function fetchRemoteLanguages(apiBase) {
  if (!apiBase) return []
  const data = await getJson(`${apiBase}/languages`)
  return Array.isArray(data.languages) ? data.languages : []
}

export async function fetchRemoteTemplates(apiBase, language = 'All') {
  if (!apiBase) return []
  const qs = language && language !== 'All' ? `?language=${encodeURIComponent(language)}` : ''
  const data = await getJson(`${apiBase}/templates${qs}`)
  return Array.isArray(data.templates) ? data.templates : []
}

export async function fetchRemoteDesigns(apiBase) {
  if (!apiBase) return []
  const data = await getJson(`${apiBase}/designs`)
  return Array.isArray(data.designs) ? data.designs : []
}

export async function saveRemoteDesign(apiBase, design) {
  if (!apiBase) return null
  const data = await sendJson(`${apiBase}/designs/${encodeURIComponent(design.id)}`, 'PUT', {
    name: design.name,
    templateId: design.templateId,
    category: design.category,
    aspect: design.aspect,
    doc: design.doc,
  })
  return data.design || null
}

export async function deleteRemoteDesign(apiBase, id) {
  if (!apiBase) return false
  await sendJson(`${apiBase}/designs/${encodeURIComponent(id)}`, 'DELETE')
  return true
}
