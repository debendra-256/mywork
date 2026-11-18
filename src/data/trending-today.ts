import { useEffect, useSyncExternalStore } from 'react'
import { getBloggerAccessTokenIfAvailable } from './blogger-auth'

export interface TrendingTodayItemSnapshot {
  id: string
  title: string
  image: string
  slug: string
}

export interface TrendingTodaySettings {
  version: 1
  postIds: string[]
  customItems: TrendingTodayItemSnapshot[]
  hashtag: string
}

const storageKey = 'imgmojo:trending-today-settings'

const defaultSettings: TrendingTodaySettings = {
  version: 1,
  postIds: [],
  customItems: [],
  hashtag: 'Political',
}

export function normalizeTrendingTodaySettings(input: unknown): TrendingTodaySettings {
  const source = input && typeof input === 'object' ? (input as Partial<TrendingTodaySettings>) : {}
  const postIds = Array.isArray(source.postIds)
    ? source.postIds.map((id) => String(id ?? '').trim()).filter(Boolean).slice(0, 24)
    : []
  const customItems = Array.isArray(source.customItems)
    ? source.customItems
        .map((item) => ({
          id: String(item?.id ?? '').trim(),
          title: String(item?.title ?? '').trim().slice(0, 140),
          image: String(item?.image ?? '').trim(),
          slug: String(item?.slug ?? '').trim(),
        }))
        .filter((item) => Boolean(item.id && item.image))
        .slice(0, 24)
    : []
  const hashtag = String(source.hashtag ?? 'Political').trim().slice(0, 60) || 'Political'
  return { version: 1, postIds, customItems, hashtag }
}

function readCachedSettings(): TrendingTodaySettings {
  try {
    const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(storageKey)
    return raw ? normalizeTrendingTodaySettings(JSON.parse(raw)) : defaultSettings
  } catch {
    return defaultSettings
  }
}

let currentSettings: TrendingTodaySettings = readCachedSettings()
let request: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

function commit(next: TrendingTodaySettings) {
  currentSettings = next
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(next))
  } catch {
    /* ignore storage errors */
  }
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSettings = () => currentSettings

export function ensureTrendingTodaySettings() {
  if (request) return request
  request = fetch('/api/trending-today', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Could not load Trending Today (${response.status}).`)
      const data = normalizeTrendingTodaySettings(await response.json())
      // If server returned empty but local cache has pinned items, keep local cache until saved
      if (data.postIds.length === 0 && data.customItems.length === 0 && currentSettings.postIds.length > 0) {
        return currentSettings
      }
      return data
    })
    .then(commit)
    .catch(() => {
      request = null
    })
  return request
}

export function useTrendingTodaySettings(): TrendingTodaySettings {
  useEffect(() => {
    void ensureTrendingTodaySettings()
  }, [])
  return useSyncExternalStore(subscribe, getSettings, getSettings)
}

export async function saveTrendingTodaySettings(next: TrendingTodaySettings): Promise<TrendingTodaySettings> {
  const normalized = normalizeTrendingTodaySettings(next)
  commit(normalized)
  try {
    const token = getBloggerAccessTokenIfAvailable()
    const response = await fetch('/api/trending-today', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(normalized),
    })
    if (response.ok) {
      const saved = normalizeTrendingTodaySettings(await response.json())
      commit(saved)
      return saved
    }
  } catch {
    /* Kept in localStorage so static/preview admin sessions still work seamlessly */
  }
  return normalized
}
