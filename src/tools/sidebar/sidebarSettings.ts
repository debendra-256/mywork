import { useEffect, useSyncExternalStore } from 'react'
import { getBloggerAccessTokenIfAvailable } from '../../data/blogger-auth'

/**
 * Whether the public left navigation is shown. Admin → Sidebar (and the switch
 * inside Admin → Site Theme) writes it to the server in `data/sidebar-settings.json`;
 * the last value this browser saw is cached locally so the first paint already
 * has the right width, and the server copy wins as soon as it loads.
 */

const storageKey = 'promptseen:sidebar-visible'

export type SidebarSettingsStatus = 'idle' | 'loading' | 'ready' | 'error'

function readCachedVisibility(): boolean {
  try {
    return typeof window === 'undefined' ? true : window.localStorage.getItem(storageKey) !== 'off'
  } catch {
    return true
  }
}

let visible = readCachedVisibility()
let status: SidebarSettingsStatus = 'idle'
let request: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

function commit(next: boolean, nextStatus: SidebarSettingsStatus = 'ready') {
  visible = next
  status = nextStatus
  try { window.localStorage.setItem(storageKey, next ? 'on' : 'off') } catch { /* The setting still applies for this visit. */ }
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

const getVisibility = () => visible
const getStatus = () => status

/** One request per visit; the cached copy already sized the layout. */
export function ensureSidebarSettings() {
  if (request) return request
  status = 'loading'
  notify()
  request = fetch('/api/sidebar-settings', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Could not load the sidebar setting (${response.status}).`)
      const result = await response.json() as { visible?: unknown }
      return result.visible !== false
    })
    .then((value) => commit(value))
    .catch(() => {
      status = 'error'
      request = null
      notify()
    })
  return request
}

export function useSidebarVisible(): boolean {
  useEffect(() => { void ensureSidebarSettings() }, [])
  return useSyncExternalStore(subscribe, getVisibility, getVisibility)
}

export function useSidebarSettingsStatus(): SidebarSettingsStatus {
  useEffect(() => { void ensureSidebarSettings() }, [])
  return useSyncExternalStore(subscribe, getStatus, getStatus)
}

/**
 * Saves the choice for every visitor and resizes this tab immediately.
 * Reverts to the previous state if the server refuses the write.
 */
export async function saveSidebarVisible(next: boolean): Promise<boolean> {
  const previous = visible
  commit(next)
  try {
    const token = getBloggerAccessTokenIfAvailable()
    const response = await fetch('/api/sidebar-settings', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ visible: next }),
    })
    const result = await response.json().catch(() => ({})) as { visible?: unknown; error?: string }
    if (!response.ok) throw new Error(result.error || `Could not save the sidebar setting (${response.status}).`)
    const saved = result.visible !== false
    commit(saved)
    return saved
  } catch (reason) {
    commit(previous, 'error')
    throw reason instanceof Error ? reason : new Error('Could not save the sidebar setting.')
  }
}
