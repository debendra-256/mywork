import pg from 'pg'

const { Pool } = pg
let pool
let initialized

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.')
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'disable' ? false : true, max: 5 })
  return pool
}

async function ensureSchema() {
  if (!initialized) {
    initialized = getPool().query(`CREATE TABLE IF NOT EXISTS store_products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('software', 'pdf')),
      description TEXT NOT NULL DEFAULT '',
      price_paise INTEGER NOT NULL CHECK (price_paise > 0),
      currency TEXT NOT NULL DEFAULT 'INR',
      drive_file_id TEXT,
      file_name TEXT,
      image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).catch((error) => { initialized = undefined; throw error })
  }
  await initialized
  return getPool()
}

function publicProduct(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    description: row.description,
    pricePaise: row.price_paise,
    currency: row.currency,
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.file_name ? { fileName: row.file_name } : {}),
  }
}

export async function listProducts() {
  const db = await ensureSchema()
  const { rows } = await db.query('SELECT id, title, type, description, price_paise, currency, image_url, file_name FROM store_products ORDER BY created_at DESC')
  return rows.map(publicProduct)
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

export async function addProduct(product, accessToken) {
  if (typeof accessToken !== 'string' || !accessToken) throw new Error('Google authorization is required to add a product.')
  const { id, title, description = '', pricePaise, driveFileId } = product ?? {}
  if (typeof id !== 'string' || !/^[a-z0-9-]{1,48}$/.test(id)) throw new Error('Product ID is invalid.')
  if (typeof title !== 'string' || !title.trim() || title.length > 100) throw new Error('Product title is invalid.')
  if (typeof description !== 'string' || description.length > 500) throw new Error('Product description is invalid.')
  if (!Number.isSafeInteger(pricePaise) || pricePaise < 100) throw new Error('Product price is invalid.')
  if (typeof driveFileId !== 'string' || !driveFileId) throw new Error('Drive file ID is required.')
  const file = await verifyDriveFile(accessToken, driveFileId)
  const db = await ensureSchema()
  const { rows } = await db.query(`INSERT INTO store_products (id, title, type, description, price_paise, drive_file_id, file_name)
    VALUES ($1, $2, 'pdf', $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description,
      price_paise = EXCLUDED.price_paise, drive_file_id = EXCLUDED.drive_file_id,
      file_name = EXCLUDED.file_name, updated_at = NOW()
    RETURNING id, title, type, description, price_paise, currency, image_url, file_name`,
  [id, title.trim(), description.trim(), pricePaise, driveFileId, file.name])
  return publicProduct(rows[0])
}

export async function handleStoreRequest(request, response, _env, _resource) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method === 'GET') {
    try { return response.status(200).json({ products: await listProducts() }) }
    catch (error) { return response.status(503).json({ error: error.message || 'Store database is unavailable.' }) }
  }
  if (request.method === 'POST') {
    const authorization = request.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    try {
      const product = await addProduct(request.body, token)
      return response.status(201).json({ product })
    } catch (error) { return response.status(400).json({ error: error.message || 'Could not add the product.' }) }
  }
  response.setHeader('Allow', 'GET, POST')
  return response.status(405).json({ error: 'Method not allowed.' })
}

export default handleStoreRequest
