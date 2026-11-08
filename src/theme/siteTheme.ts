import { useEffect, useSyncExternalStore } from 'react'
import { DEFAULT_THEME, isThemeId, themeById, themeVariables, type ThemeId } from './themes'

/**
 * The active site theme, chosen in Admin → Site Theme and stored on the server
 * in `data/site-theme.json`. The last value the browser saw is cached locally so
 * the first paint is already themed, and the server copy wins as soon as it loads.
 */

const storageKey = 'promptseen:site-theme'
const userChoiceKey = 'imgmojo:user-theme-selected'
const altStorageKey = 'imgmojo:site-theme'

export type SiteThemeStatus = 'idle' | 'loading' | 'ready' | 'error'

let active: ThemeId = readCachedTheme()
let status: SiteThemeStatus = 'idle'
let request: Promise<void> | null = null
const listeners = new Set<() => void>()

function readCachedTheme(): ThemeId {
  try {
    if (typeof window === 'undefined') return DEFAULT_THEME
    const userSelected = window.localStorage.getItem(userChoiceKey)
    if (isThemeId(userSelected)) return userSelected
    const stored = window.localStorage.getItem(storageKey) || window.localStorage.getItem(altStorageKey)
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

function commit(id: ThemeId, nextStatus: SiteThemeStatus = 'ready', isUserChoice = false) {
  active = id
  status = nextStatus
  try {
    window.localStorage.setItem(storageKey, id)
    window.localStorage.setItem(altStorageKey, id)
    if (isUserChoice) {
      window.localStorage.setItem(userChoiceKey, id)
    }
  } catch { /* The theme still applies for this visit. */ }
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

/** One request per visit; respects user selection if already chosen. */
export function ensureSiteTheme() {
  if (request) return request
  try {
    const userSelected = typeof window !== 'undefined' ? window.localStorage.getItem(userChoiceKey) : null
    if (isThemeId(userSelected)) {
      applyThemeTokens(userSelected)
      return Promise.resolve()
    }
  } catch {}

  status = 'loading'
  notify()
  request = fetch('/api/site-theme', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Could not load the site theme (${response.status}).`)
      const result = await response.json() as { theme?: unknown }
      return isThemeId(result.theme) ? result.theme : DEFAULT_THEME
    })
    .then((id) => {
      try {
        const userSelected = window.localStorage.getItem(userChoiceKey)
        if (isThemeId(userSelected)) return
      } catch {}
      commit(id)
    })
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
 * Saves the choice and repaints immediately.
 * Persists locally and syncs to server if authorized without reverting on permission errors.
 */
export async function saveSiteTheme(id: ThemeId): Promise<ThemeId> {
  if (!isThemeId(id)) throw new Error('Unknown theme.')
  commit(id, 'ready', true)
  try {
    const response = await fetch('/api/site-theme', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: id }),
    })
    if (response.ok) {
      const result = await response.json().catch(() => ({})) as { theme?: unknown }
      const saved = isThemeId(result.theme) ? result.theme : id
      commit(saved, 'ready', true)
      return saved
    }
    return id
  } catch {
    return id
  }
}
