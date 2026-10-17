import { useState } from 'react'

export type EngagementAction = 'copy' | 'share'
export interface EngagementCounts { copy: number; share: number }
export type EngagementMap = Record<string, EngagementCounts>

const storageKey = 'promptseen:prompt-engagement'

function readStored(): EngagementMap {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '{}') as Record<string, Partial<EngagementCounts>>
    return Object.fromEntries(Object.entries(parsed).map(([id, value]) => [id, { copy: Number(value.copy) || 0, share: Number(value.share) || 0 }]))
  } catch { return {} }
}

/** Copy and share totals kept in this browser, so every card can show how often the prompt was used. */
export function useEngagement() {
  const [counts, setCounts] = useState<EngagementMap>(readStored)
  const record = (id: string, action: EngagementAction) => setCounts((current) => {
    const next: EngagementMap = { ...current, [id]: { ...emptyCounts(), ...current[id], [action]: (current[id]?.[action] ?? 0) + 1 } }
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* The counter stays in memory when browser storage is blocked. */ }
    return next
  })
  return { counts, record }
}

const emptyCounts = (): EngagementCounts => ({ copy: 0, share: 0 })

export function engagementFor(counts: EngagementMap, id: string): EngagementCounts {
  return counts[id] ?? emptyCounts()
}

export function formatCount(value: number): string {
  if (value < 1000) return String(value)
  return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`
}
