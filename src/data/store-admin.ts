import type { StoreSnapshot } from '../domain/store'

const emptySnapshot: StoreSnapshot = { products: [], licenses: [], store: { dataStore: 'postgres', databaseConfigured: false } }

async function toJson(response: Response) {
  const result = await response.json().catch(() => ({})) as Partial<StoreSnapshot> & { error?: string }
  if (!response.ok) throw new Error(result.error || `Store request failed (${response.status}).`)
  return { ...emptySnapshot, ...result, products: result.products ?? [], licenses: result.licenses ?? [] } as StoreSnapshot
}

export async function loadStoreSnapshot(): Promise<StoreSnapshot> {
  return await toJson(await fetch('/api/admin-store'))
}

export async function storeAction(action: string, payload: Record<string, unknown> = {}): Promise<StoreSnapshot> {
  const response = await fetch('/api/admin-store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  const result = await response.json().catch(() => ({})) as Partial<StoreSnapshot> & { error?: string; snapshot?: StoreSnapshot }
  if (!response.ok) throw new Error(result.error || `Store update failed (${response.status}).`)
  return result.snapshot ?? await loadStoreSnapshot()
}
