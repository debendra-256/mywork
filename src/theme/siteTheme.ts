import { useEffect, useSyncExternalStore } from 'react'
import { DEFAULT_THEME, isThemeId, themeById, themeVariables, type ThemeId } from './themes'

/**
 * The active site theme, chosen in Admin → Site Theme and stored on the server
 * in `data/site-theme.json`. The last value the browser saw is cached locally so
 * the first paint is already themed, and the server copy wins as soon as it loads.
 */

const storageKey = 'promptseen:site-theme'

export type SiteThemeStatus = 'idle' | 'loading' | 'ready' | 'error'

let active: ThemeId = readCachedTheme()
let status: SiteThemeStatus = 'idle'
let request: Promise<void> | null = null
const listeners = new Set<() => void>()

function readCachedTheme(): ThemeId {
  try {
    const stored = typeof window === 'undefined' ? null : window.localStorage.getItem(storageKey)
    return isThemeId(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

/** Paints the palette: one attribute for the CSS layer, inline tokens for every colour. */
export function applyThemeTokens(id: ThemeId) {
  const theme = themeById(id)
  const root = document.documentElement
  root.dataset.theme = id
  root.dataset.scheme = theme.dark ? 'dark' : 'light'
  root.style.colorScheme = theme.dark ? 'dark' : 'light'
  const variables = themeVariables(theme)
  for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', variables['--canvas'])
}

function commit(id: ThemeId, nextStatus: SiteThemeStatus = 'ready') {
  active = id
  status = nextStatus
  try { window.localStorage.setItem(storageKey, id) } catch { /* The theme still applies for this visit. */ }
  applyThemeTokens(id)
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

const getTheme = () => active
const getStatus = () => status

/** Runs once from the app entry so the very first frame carries the saved palette. */
export function applyCachedTheme() {
  applyThemeTokens(active)
}

/** One request per visit; the cached theme already painted. */
export function ensureSiteTheme() {
  if (request) return request
  status = 'loading'
  notify()
  request = fetch('/api/site-theme', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Could not load the site theme (${response.status}).`)
      const result = await response.json() as { theme?: unknown }
      return isThemeId(result.theme) ? result.theme : DEFAULT_THEME
    })
    .then((id) => commit(id))
    .catch(() => {
      status = 'error'
      request = null
      notify()
    })
  return request
}

export function useSiteTheme(): ThemeId {
  useEffect(() => { void ensureSiteTheme() }, [])
  return useSyncExternalStore(subscribe, getTheme, getTheme)
}

export function useSiteThemeStatus(): SiteThemeStatus {
  useEffect(() => { void ensureSiteTheme() }, [])
  return useSyncExternalStore(subscribe, getStatus, getStatus)
}

/**
 * Saves the choice for every visitor and repaints this tab immediately.
 * Reverts to the previous theme if the server refuses the write.
 */
export async function saveSiteTheme(id: ThemeId): Promise<ThemeId> {
  if (!isThemeId(id)) throw new Error('Unknown theme.')
  const previous = active
  commit(id)
  try {
    const response = await fetch('/api/site-theme', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: id }),
    })
    const result = await response.json().catch(() => ({})) as { theme?: unknown; error?: string }
    if (!response.ok) throw new Error(result.error || `Could not save the site theme (${response.status}).`)
    const saved = isThemeId(result.theme) ? result.theme : id
    commit(saved)
    return saved
  } catch (reason) {
    commit(previous, 'error')
    throw reason instanceof Error ? reason : new Error('Could not save the site theme.')
  }
}
