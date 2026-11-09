import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { getBloggerAccessTokenIfAvailable } from '../data/blogger-auth'
import { toolsConfig, type ToolDefinition, type ToolIcon } from './ToolsConfig'

export interface CustomTool {
  id: string
  title: string
  href: string
  icon: ToolIcon
  enabled: boolean
}

/** Runtime settings saved by the admin Tools page, layered over the bundled registry. */
export interface ToolSettings {
  version: 1
  overrides: Record<string, boolean>
  customTools: CustomTool[]
}

export interface EffectiveTools {
  all: ToolDefinition[]
  enabled: ToolDefinition[]
  utility: ToolDefinition[]
  admin: ToolDefinition[]
  pages: ToolDefinition[]
  libraryMenu: ToolDefinition[]
  feature: ToolDefinition[]
}

const storageKey = 'promptseen:tools-config'
const toolIcons: readonly ToolIcon[] = ['images', 'youtube', 'image-plus', 'video', 'qr-code', 'download', 'scan', 'layers', 'message', 'network', 'eraser', 'droplets', 'sparkles', 'wand', 'bot', 'monitor-play', 'zap', 'instagram', 'smile', 'palette', 'panel-left', 'id-card', 'file-archive']
const idPattern = /^[a-z0-9][a-z0-9-]{1,47}$/
const emptySettings: ToolSettings = { version: 1, overrides: {}, customTools: [] }

function isToolIcon(value: unknown): value is ToolIcon {
  return typeof value === 'string' && (toolIcons as readonly string[]).includes(value)
}

export function normalizeToolSettings(input: unknown): ToolSettings {
  const source = input && typeof input === 'object' ? input as Partial<ToolSettings> : {}
  const overrides: Record<string, boolean> = {}
  if (source.overrides && typeof source.overrides === 'object' && !Array.isArray(source.overrides)) {
    for (const [id, enabled] of Object.entries(source.overrides)) {
      if (idPattern.test(id) && typeof enabled === 'boolean') overrides[id] = enabled
    }
  }
  const customTools: CustomTool[] = []
  if (Array.isArray(source.customTools)) {
    for (const item of source.customTools) {
      const id = typeof item?.id === 'string' ? item.id.trim() : ''
      const title = typeof item?.title === 'string' ? item.title.trim() : ''
      const href = typeof item?.href === 'string' ? item.href.trim() : ''
      if (!idPattern.test(id) || !title || title.length > 60) continue
      if (!/^https?:\/\/\S+$/i.test(href) && !/^\/[^/]/.test(href)) continue
      if (customTools.some((tool) => tool.id === id) || toolsConfig.some((tool) => tool.id === id)) continue
      customTools.push({ id, title: title.slice(0, 60), href, icon: isToolIcon(item?.icon) ? item.icon : 'images', enabled: item?.enabled !== false })
    }
  }
  return { version: 1, overrides, customTools: customTools.slice(0, 40) }
}

function readCachedSettings(): ToolSettings {
  try {
    const stored = typeof window === 'undefined' ? null : window.localStorage.getItem(storageKey)
    return stored ? normalizeToolSettings(JSON.parse(stored)) : emptySettings
  } catch {
    return emptySettings
  }
}

let settings: ToolSettings = readCachedSettings()
let status: 'idle' | 'loading' | 'ready' | 'error' = 'idle'
let request: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

function commit(next: ToolSettings) {
  settings = next
  status = 'ready'
  try { window.localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* Settings still apply for this visit. */ }
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

const getSettings = () => settings
const getStatus = () => status

/** One small request per visit; the cached copy paints instantly on repeat visits. */
export function ensureToolSettings() {
  if (request) return request
  status = 'loading'
  notify()
  request = fetch('/api/tools-config', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Could not load tool settings (${response.status}).`)
      return normalizeToolSettings(await response.json())
    })
    .then(commit)
    .catch(() => {
      status = 'error'
      request = null
      notify()
    })
  return request
}

export function useToolSettings(): ToolSettings {
  useEffect(() => { void ensureToolSettings() }, [])
  return useSyncExternalStore(subscribe, getSettings, getSettings)
}

export function useToolSettingsStatus() {
  useEffect(() => { void ensureToolSettings() }, [])
  return useSyncExternalStore(subscribe, getStatus, getStatus)
}

export function mergeToolSettings(current: ToolSettings): EffectiveTools {
  const bundled: ToolDefinition[] = toolsConfig.map((tool) => current.overrides[tool.id] === undefined ? tool : { ...tool, enabled: current.overrides[tool.id] })
  const custom: ToolDefinition[] = current.customTools.map((tool) => ({
    id: tool.id,
    title: tool.title,
    placement: 'library',
    icon: tool.icon,
    href: tool.href,
    external: true,
    enabled: tool.enabled,
  }))
  const all = [...bundled, ...custom]
  const enabled = all.filter((tool) => tool.enabled !== false && (typeof tool.load === 'function' || Boolean(tool.href)))
  return {
    all,
    enabled,
    utility: enabled.filter((tool) => tool.placement === 'utility'),
    admin: enabled.filter((tool) => tool.placement === 'admin'),
    pages: enabled.filter((tool) => (tool.placement === 'library' || tool.placement === 'feature') && Boolean(tool.path) && typeof tool.load === 'function'),
    libraryMenu: all.filter((tool) => tool.placement === 'library' && tool.enabled !== false),
    feature: enabled.filter((tool) => tool.placement === 'feature'),
  }
}

export function useTools(): EffectiveTools {
  const current = useToolSettings()
  return useMemo(() => mergeToolSettings(current), [current])
}

/** Optimistic local apply; saveToolSettings() is what persists it to the server config. */
export function applyToolSettings(next: ToolSettings) {
  commit(normalizeToolSettings(next))
}

export async function saveToolSettings(next: ToolSettings): Promise<ToolSettings> {
  const token = getBloggerAccessTokenIfAvailable()
  const response = await fetch('/api/tools-config', {
    method: 'PUT',
    // Password admins authenticate with the session cookie; Blogger admins also send their token.
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(normalizeToolSettings(next)),
  })
  const result = await response.json().catch(() => ({})) as ToolSettings & { error?: string }
  if (!response.ok) throw new Error(result.error || `Could not save tool settings (${response.status}).`)
  const saved = normalizeToolSettings(result)
  commit(saved)
  return saved
}

export const bundledToolIds = new Set(toolsConfig.map((tool) => tool.id))
