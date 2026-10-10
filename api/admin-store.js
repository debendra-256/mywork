import { randomBytes } from 'node:crypto'
import { isValidAdminSession } from './admin-auth.js'
import { availableDataStores, getStore, newId, storeStatus } from '../server/db/index.js'
import { methodNotAllowed, parseQuery } from '../server/http.js'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const FEATURE_ICONS = ['sparkles', 'video', 'shield', 'clock', 'sliders', 'mic', 'download', 'badge']

function generateLicenseCode() {
  const bytes = randomBytes(16)
  const characters = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
  return `PS-${characters.join('').replace(/(.{4})(?=.)/g, '$1-')}`
}

function requiredText(value, max, label) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) throw new Error(`${label} is required.`)
  if (text.length > max) throw new Error(`${label} must be ${max} characters or fewer.`)
  return text
}

function optionalText(value, max, label) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length > max) throw new Error(`${label} must be ${max} characters or fewer.`)
  return text
}

function parseBenefits(value) {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(',')
  const keys = raw.map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : '')).filter(Boolean)
  for (const key of keys) if (!/^[a-z0-9_]{1,40}$/.test(key)) throw new Error(`Benefit key "${key}" is invalid. Use lowercase letters, numbers and underscores.`)
  return [...new Set(keys)]
}

function parseExpiry(value) {
  if (value === null || value === '' || value === undefined) return null
  const date = new Date(typeof value === 'string' || typeof value === 'number' ? value : Number.NaN)
  if (Number.isNaN(date.getTime())) throw new Error('License expiry must be a valid date.')
  if (date.getTime() <= Date.now()) throw new Error('License expiry must be in the future.')
  return date.toISOString()
}

function validateProductInput(input, existing) {
  const id = typeof input?.id === 'string' && input.id.trim() ? input.id.trim().toLowerCase() : existing?.id ?? ''
  if (!/^[a-z0-9-]{1,48}$/.test(id)) throw new Error('Product ID must be lowercase letters, numbers or dashes.')
  const title = requiredText(input?.title ?? existing?.title, 100, 'Product title')
  const description = optionalText(input?.description ?? existing?.description, 500, 'Product description')
  const type = input?.type ?? existing?.type
  if (!['software', 'pdf'].includes(type)) throw new Error('Product type must be software or pdf.')
  const price = input?.pricePaise === undefined || input?.pricePaise === null ? existing?.pricePaise : Number(input.pricePaise)
  if (!Number.isSafeInteger(price) || price < 100) throw new Error('Product price must be at least 1.00 in the smallest currency unit.')
  const currency = String(input?.currency ?? existing?.currency ?? 'INR').trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Currency must be a three-letter code.')
  const watermarkText = optionalText(input?.watermarkText ?? existing?.watermarkText, 40, 'Watermark text')
  const premium = input?.premium === undefined ? (existing?.premium ?? true) : Boolean(input.premium)
  const sortOrderRaw = input?.sortOrder === undefined ? (existing?.sortOrder ?? 0) : Number(input.sortOrder)
  if (!Number.isSafeInteger(sortOrderRaw)) throw new Error('Sort order must be a whole number.')
  const imageUrl = optionalText(input?.imageUrl ?? existing?.imageUrl, 500, 'Image URL')
  return { id, title, type, description, pricePaise: price, currency, watermarkText, premium, sortOrder: sortOrderRaw, imageUrl }
}

function validateFeatureInput(input, product) {
  const id = typeof input?.id === 'string' && input.id.trim() ? input.id.trim() : newId('feat')
  const title = requiredText(input?.title, 80, 'Feature title')
  const description = optionalText(input?.description, 200, 'Feature description')
  const icon = FEATURE_ICONS.includes(input?.icon) ? input.icon : 'sparkles'
  const tier = input?.tier === 'free' ? 'free' : 'premium'
  const benefitKey = optionalText(input?.benefitKey, 40, 'Benefit key').toLowerCase()
  if (benefitKey && !/^[a-z0-9_]{1,40}$/.test(benefitKey)) throw new Error('Benefit key may only contain lowercase letters, numbers and underscores.')
  const sortOrderRaw = Number(input?.sortOrder ?? 0)
  if (!Number.isSafeInteger(sortOrderRaw)) throw new Error('Feature order must be a whole number.')
  return { id, productId: product.id, title, description, icon, tier, benefitKey, sortOrder: sortOrderRaw }
}

async function buildSnapshot(env, productId) {
  const store = getStore(env)
  const products = await store.listProducts()
  const licenses = await store.listLicenses(productId ? { productId } : {})
  return { products, licenses, store: { ...storeStatus(env), availableDataStores } }
}

async function runAction(action, body, env) {
  const store = getStore(env)
  if (action === 'saveProduct') {
    const requested = body?.product ?? {}
    const existing = requested.id ? await store.getProduct(requested.id.toLowerCase()) : null
    const product = validateProductInput(requested, existing ?? undefined)
    const saved = await store.upsertProduct(product)
    return { product: saved }
  }
  if (action === 'deleteProduct') {
    const id = requiredText(body?.id, 48, 'Product ID').toLowerCase()
    if (!(await store.deleteProduct(id))) throw new Error('That product does not exist.')
    return { removedProductId: id }
  }
  if (action === 'saveFeature') {
    const input = body?.feature ?? {}
    const product = await store.getProduct(requiredText(input.productId, 48, 'Product ID').toLowerCase())
    if (!product) throw new Error('Choose a product before saving a feature.')
    const saved = await store.upsertFeature(validateFeatureInput(input, product))
    return { feature: saved }
  }
  if (action === 'deleteFeature') {
    const id = requiredText(body?.id, 60, 'Feature ID')
    if (!(await store.deleteFeature(id))) throw new Error('That feature does not exist.')
    return { removedFeatureId: id }
  }
  if (action === 'issueLicense') {
    const input = body?.license ?? {}
    const product = await store.getProduct(requiredText(input.productId, 48, 'Product ID').toLowerCase())
    if (!product) throw new Error('Choose a product before issuing a license.')
    const buyerEmail = optionalText(input.buyerEmail, 254, 'Buyer email').toLowerCase()
    const note = optionalText(input.note, 200, 'License note')
    const expiresAt = parseExpiry(input.expiresAt)
    const benefitKeys = parseBenefits(input.benefitKeys)
      .filter((key) => (product.features ?? []).some((feature) => feature.tier === 'premium' && feature.benefitKey === key))
    if (!benefitKeys.length) throw new Error('Select at least one premium benefit. Add a premium feature with a benefit key first.')
    const license = await store.insertLicense({ id: newId('lic'), code: generateLicenseCode(), productId: product.id, buyerEmail, note, benefitKeys, expiresAt })
    return { license }
  }
  if (action === 'updateLicense') {
    const id = requiredText(body?.id, 60, 'License ID')
    const status = body?.status
    if (!['issued', 'revoked'].includes(status)) throw new Error('License status must be issued or revoked.')
    const licenses = await store.listLicenses()
    const current = licenses.find((license) => license.id === id)
    if (!current) throw new Error('That license does not exist.')
    if (status === 'issued' && current.status === 'redeemed') throw new Error('A redeemed license cannot be reissued. Issue a new one instead.')
    const updated = await store.updateLicense(id, {
      status,
      redeemedUserId: current.redeemedUserId || null,
      redeemedEmail: current.redeemedEmail ?? '',
      note: optionalText(body?.note, 200, 'License note'),
      buyerEmail: optionalText(body?.buyerEmail, 254, 'Buyer email').toLowerCase(),
      expiresAt: parseExpiry(body?.expiresAt),
    })
    if (status === 'revoked') await store.deleteEntitlementsByLicense(id)
    return { license: updated }
  }
  if (action === 'deleteLicense') {
    const id = requiredText(body?.id, 60, 'License ID')
    if (!(await store.deleteLicense(id))) throw new Error('That license does not exist.')
    return { removedLicenseId: id }
  }
  throw new Error(`Unknown action "${action || 'none'}".`)
}

export default async function handler(request, response, env = process.env) {
  response.setHeader('Cache-Control', 'no-store')
  if (!isValidAdminSession(request, env)) return response.status(401).json({ error: 'Admin sign-in is required to manage the digital store.' })

  if (request.method === 'GET') {
    const { productId } = parseQuery(request)
    try {
      return response.status(200).json(await buildSnapshot(env, productId ? productId.toLowerCase() : ''))
    } catch (error) {
      return response.status(503).json({ error: error.message || 'Store database is unavailable.' })
    }
  }

  if (request.method === 'POST') {
    const action = typeof request.body?.action === 'string' ? request.body.action : ''
    try {
      const result = await runAction(action, request.body ?? {}, env)
      return response.status(200).json({ ok: true, ...result, snapshot: await buildSnapshot(env) })
    } catch (error) {
      const message = error?.message || 'Could not update the store.'
      const status = /does not exist|required|invalid|must be|Unknown action/.test(message) ? 400 : 503
      return response.status(status).json({ error: message })
    }
  }

  return methodNotAllowed(response, 'GET, POST')
}
