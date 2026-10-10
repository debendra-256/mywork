import { getStore, storeStatus } from '../server/db/index.js'
import { parseQuery } from '../server/http.js'

const WATERMARK_FREE_BENEFIT = 'watermark_free'

function withFeatureState(product) {
  return {
    ...product,
    features: (product.features ?? []).map((feature) => ({
      ...feature,
      locked: feature.tier === 'premium',
      unlockBenefit: feature.benefitKey || '',
      benefitLabel: feature.benefitKey === WATERMARK_FREE_BENEFIT ? 'Removes the screen recorder watermark' : '',
    })),
  }
}

export async function listProducts(env = process.env) {
  const products = await getStore(env).listProducts()
  return products.map(withFeatureState)
}

export async function getProduct(productId, env = process.env) {
  const product = await getStore(env).getProduct(productId)
  return product ? withFeatureState(product) : null
}

async function verifyDriveFile(accessToken, driveFileId) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}?fields=id,name,mimeType`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Google could not verify this uploaded Drive file. Reconnect Google and try again.')
  const file = await response.json()
  if (file.mimeType !== 'application/pdf' || file.id !== driveFileId) throw new Error('The Drive file is not a PDF.')
  return file
}

export async function addProduct(product, accessToken, env = process.env) {
  if (typeof accessToken !== 'string' || !accessToken) throw new Error('Google authorization is required to add a product.')
  const { id, title, description = '', pricePaise, driveFileId } = product ?? {}
  if (typeof id !== 'string' || !/^[a-z0-9-]{1,48}$/.test(id)) throw new Error('Product ID is invalid.')
  if (typeof title !== 'string' || !title.trim() || title.length > 100) throw new Error('Product title is invalid.')
  if (typeof description !== 'string' || description.length > 500) throw new Error('Product description is invalid.')
  if (!Number.isSafeInteger(pricePaise) || pricePaise < 100) throw new Error('Product price is invalid.')
  if (typeof driveFileId !== 'string' || !driveFileId) throw new Error('Drive file ID is required.')
  const file = await verifyDriveFile(accessToken, driveFileId)
  const saved = await getStore(env).upsertProduct({
    id,
    title: title.trim(),
    type: 'pdf',
    description: description.trim(),
    pricePaise,
    currency: 'INR',
    driveFileId,
    fileName: file.name,
    watermarkText: '',
    premium: true,
  })
  return withFeatureState({ ...saved, hasFile: true })
}

export async function handleStoreRequest(request, response, env = process.env, _resource) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method === 'GET') {
    try {
      const { id } = parseQuery(request)
      if (id) {
        const product = await getProduct(String(id), env)
        return product ? response.status(200).json({ product }) : response.status(404).json({ error: 'Product not found.' })
      }
      return response.status(200).json({ products: await listProducts(env), store: storeStatus(env) })
    } catch (error) {
      return response.status(503).json({ error: error.message || 'Store database is unavailable.' })
    }
  }
  if (request.method === 'POST') {
    const authorization = request.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    try {
      const product = await addProduct(request.body, token, env)
      return response.status(201).json({ product })
    } catch (error) { return response.status(400).json({ error: error.message || 'Could not add the product.' }) }
  }
  response.setHeader('Allow', 'GET, POST')
  return response.status(405).json({ error: 'Method not allowed.' })
}

export default handleStoreRequest
