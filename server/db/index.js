import { createPostgresRepository } from './postgres.js'

/**
 * Data-source switch. Every API module talks to the repository interface below
 * and never to SQL, so a new engine only needs a factory that returns the same methods.
 */
const adapters = Object.freeze({
  postgres: createPostgresRepository,
})

const instances = new Map()

export const availableDataStores = Object.freeze(Object.keys(adapters))

/** Benefit keys connect a purchased product to an in-app capability. */
export const benefitKeys = Object.freeze({
  watermarkFree: 'watermark_free',
})

export function activeDataStoreName(env = process.env) {
  return String(env.DATA_STORE || 'postgres').trim().toLowerCase() || 'postgres'
}

export function getStore(env = process.env) {
  const name = activeDataStoreName(env)
  const factory = adapters[name]
  if (!factory) throw new Error(`Unsupported DATA_STORE "${name}". Available stores: ${availableDataStores.join(', ')}.`)
  const cacheKey = `${name}|${env.DATABASE_URL ?? process.env.DATABASE_URL ?? ''}|${env.DATABASE_SSL ?? process.env.DATABASE_SSL ?? ''}`
  if (!instances.has(cacheKey)) instances.set(cacheKey, factory(env))
  return instances.get(cacheKey)
}

export function databaseConfigured(env = process.env) {
  return Boolean(env.DATABASE_URL || process.env.DATABASE_URL)
}

/** Safe to log: never includes the connection string. */
export function storeStatus(env = process.env) {
  return { dataStore: activeDataStoreName(env), databaseConfigured: databaseConfigured(env) }
}

export { newId } from './postgres.js'
