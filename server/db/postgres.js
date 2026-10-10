import { randomUUID } from 'node:crypto'
import pg from 'pg'

const { Pool } = pg

const PRODUCT_COLUMNS = 'id, title, type, description, price_paise, currency, drive_file_id, file_name, image_url, watermark_text, premium, sort_order, created_at, updated_at'
const FEATURE_COLUMNS = 'id, product_id, title, description, icon, tier, benefit_key, sort_order'
const LICENSE_COLUMNS = 'id, code, product_id, buyer_email, note, benefit_keys, status, redeemed_user_id, redeemed_email, issued_by, expires_at'
const USER_COLUMNS = 'id, email, display_name, status, google_sub, facebook_id, signup_source'

/** Provider account IDs live in their own column so one person can link both. */
const SOCIAL_USER_COLUMNS = Object.freeze({ google: 'google_sub', facebook: 'facebook_id' })

function toUser(row) {
  return {
    id: row.id,
    email: row.email ?? '',
    displayName: row.display_name ?? '',
    status: row.status,
    googleSub: row.google_sub ?? '',
    facebookId: row.facebook_id ?? '',
    signupSource: row.signup_source ?? 'password',
  }
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS store_products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('software', 'pdf')),
    description TEXT NOT NULL DEFAULT '',
    price_paise INTEGER NOT NULL CHECK (price_paise > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    drive_file_id TEXT,
    file_name TEXT,
    image_url TEXT,
    watermark_text TEXT,
    premium BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE store_products ADD COLUMN IF NOT EXISTS watermark_text TEXT`,
  `ALTER TABLE store_products ADD COLUMN IF NOT EXISTS premium BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE store_products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS product_features (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES store_products (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'sparkles',
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    benefit_key TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS product_features_product_id_idx ON product_features (product_id, sort_order)`,
  `CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    email_normalized TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS google_sub TEXT`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS facebook_id TEXT`,
  `ALTER TABLE app_users ADD COLUMN IF NOT EXISTS signup_source TEXT NOT NULL DEFAULT 'password'`,
  `CREATE UNIQUE INDEX IF NOT EXISTS app_users_google_sub_idx ON app_users (google_sub) WHERE google_sub IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS app_users_facebook_id_idx ON app_users (facebook_id) WHERE facebook_id IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS app_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx ON app_sessions (expires_at)`,
  `CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    product_id TEXT NOT NULL REFERENCES store_products (id) ON DELETE CASCADE,
    buyer_email TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    benefit_keys TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('issued', 'redeemed', 'revoked')) DEFAULT 'issued',
    redeemed_user_id TEXT,
    redeemed_email TEXT NOT NULL DEFAULT '',
    issued_by TEXT NOT NULL DEFAULT 'admin',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS licenses_product_id_idx ON licenses (product_id)`,
  `CREATE TABLE IF NOT EXISTS entitlements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
    product_id TEXT REFERENCES store_products (id) ON DELETE CASCADE,
    benefit_key TEXT NOT NULL,
    license_id TEXT REFERENCES licenses (id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id, benefit_key)
  )`,
  `CREATE INDEX IF NOT EXISTS entitlements_user_id_idx ON entitlements (user_id)`,
]

const pools = new Map()
const prepared = new Map()

export function newId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`
}

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).toISOString()
  return null
}

function toProduct(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    description: row.description ?? '',
    pricePaise: Number(row.price_paise),
    currency: row.currency ?? 'INR',
    premium: row.premium !== false,
    sortOrder: Number(row.sort_order ?? 0),
    watermarkText: row.watermark_text ?? '',
    ...(row.file_name ? { fileName: row.file_name } : {}),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.drive_file_id ? { hasFile: true } : {}),
  }
}

function toFeature(row) {
  return {
    id: row.id,
    productId: row.product_id,
    title: row.title,
    description: row.description ?? '',
    icon: row.icon ?? 'sparkles',
    tier: row.tier,
    benefitKey: row.benefit_key ?? '',
    sortOrder: Number(row.sort_order ?? 0),
  }
}

function toLicense(row) {
  return {
    id: row.id,
    code: row.code,
    productId: row.product_id,
    buyerEmail: row.buyer_email ?? '',
    note: row.note ?? '',
    benefitKeys: String(row.benefit_keys ?? '').split(',').map((key) => key.trim()).filter(Boolean),
    status: row.status,
    redeemedUserId: row.redeemed_user_id ?? '',
    redeemedEmail: row.redeemed_email ?? '',
    issuedBy: row.issued_by ?? 'admin',
    expiresAt: normalizeDate(row.expires_at),
    createdAt: normalizeDate(row.created_at),
  }
}

function toEntitlement(row) {
  return { benefitKey: row.benefit_key, productId: row.product_id ?? '', expiresAt: normalizeDate(row.expires_at) }
}

function connect(env) {
  const connectionString = env.DATABASE_URL ?? process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not configured.')
  const sslDisabled = (env.DATABASE_SSL ?? process.env.DATABASE_SSL) === 'disable'
  const key = `${connectionString}|${sslDisabled}`
  if (!pools.has(key)) pools.set(key, new Pool({ connectionString, ssl: sslDisabled ? false : { rejectUnauthorized: false }, max: 5 }))
  return pools.get(key)
}

async function preparedPool(env) {
  const pool = connect(env)
  const key = pool.options.connectionString
  let setup = prepared.get(key)
  if (!setup) {
    setup = (async () => {
      for (const statement of SCHEMA_STATEMENTS) await pool.query(statement)
    })().catch((error) => {
      prepared.delete(key)
      throw error
    })
    prepared.set(key, setup)
  }
  await setup
  return pool
}

async function fetchFeatures(pool, productIds) {
  if (!productIds.length) return new Map()
  const placeholders = productIds.map((_, index) => `$${index + 1}`)
  const { rows } = await pool.query(`SELECT ${FEATURE_COLUMNS} FROM product_features WHERE product_id IN (${placeholders.join(', ')}) ORDER BY sort_order, title`, productIds)
  const grouped = new Map()
  for (const row of rows) {
    if (!grouped.has(row.product_id)) grouped.set(row.product_id, [])
    grouped.get(row.product_id).push(toFeature(row))
  }
  return grouped
}

export function createPostgresRepository(env = process.env) {
  async function query(sql, params) {
    const pool = await preparedPool(env)
    return await pool.query(sql, params)
  }

  return {
    async listProducts({ includeFeatures = true } = {}) {
      const pool = await preparedPool(env)
      const { rows } = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM store_products ORDER BY sort_order, created_at DESC`)
      const products = rows.map(toProduct)
      if (!includeFeatures) return products
      const features = await fetchFeatures(pool, products.map((product) => product.id))
      return products.map((product) => ({ ...product, features: features.get(product.id) ?? [] }))
    },

    async getProduct(productId) {
      const pool = await preparedPool(env)
      const { rows } = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM store_products WHERE id = $1`, [productId])
      if (!rows.length) return null
      const product = toProduct(rows[0])
      const features = await fetchFeatures(pool, [product.id])
      return { ...product, features: features.get(product.id) ?? [] }
    },

    async upsertProduct(product) {
      const { rows } = await query(`INSERT INTO store_products (id, title, type, description, price_paise, currency, drive_file_id, file_name, image_url, watermark_text, premium, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type, description = EXCLUDED.description,
          price_paise = EXCLUDED.price_paise, currency = EXCLUDED.currency,
          drive_file_id = COALESCE(EXCLUDED.drive_file_id, store_products.drive_file_id),
          file_name = COALESCE(EXCLUDED.file_name, store_products.file_name),
          image_url = COALESCE(EXCLUDED.image_url, store_products.image_url),
          watermark_text = EXCLUDED.watermark_text,
          premium = EXCLUDED.premium, sort_order = EXCLUDED.sort_order, updated_at = NOW()
        RETURNING ${PRODUCT_COLUMNS}`,
      [product.id, product.title, product.type, product.description, product.pricePaise, product.currency,
        product.driveFileId ?? null, product.fileName ?? null, product.imageUrl ?? null, product.watermarkText ?? null,
        product.premium !== false, product.sortOrder ?? 0])
      return toProduct(rows[0])
    },

    async deleteProduct(productId) {
      const { rowCount } = await query('DELETE FROM store_products WHERE id = $1', [productId])
      return rowCount > 0
    },

    async listFeatures(productId) {
      const { rows } = await query(`SELECT ${FEATURE_COLUMNS} FROM product_features WHERE product_id = $1 ORDER BY sort_order, title`, [productId])
      return rows.map(toFeature)
    },

    async upsertFeature(feature) {
      const id = feature.id || newId('feat')
      const { rows } = await query(`INSERT INTO product_features (id, product_id, title, description, icon, tier, benefit_key, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, title = EXCLUDED.title, description = EXCLUDED.description,
          icon = EXCLUDED.icon, tier = EXCLUDED.tier, benefit_key = EXCLUDED.benefit_key, sort_order = EXCLUDED.sort_order
        RETURNING ${FEATURE_COLUMNS}`,
      [id, feature.productId, feature.title, feature.description ?? '', feature.icon ?? 'sparkles', feature.tier, feature.benefitKey || null, feature.sortOrder ?? 0])
      return toFeature(rows[0])
    },

    async deleteFeature(featureId) {
      const { rowCount } = await query('DELETE FROM product_features WHERE id = $1', [featureId])
      return rowCount > 0
    },

    async listLicenses({ productId = '' } = {}) {
      const { rows } = productId
        ? await query(`SELECT ${LICENSE_COLUMNS} FROM licenses WHERE product_id = $1 ORDER BY created_at DESC`, [productId])
        : await query(`SELECT ${LICENSE_COLUMNS} FROM licenses ORDER BY created_at DESC`)
      return rows.map(toLicense)
    },

    async insertLicense(license) {
      const { rows } = await query(`INSERT INTO licenses (id, code, product_id, buyer_email, note, benefit_keys, status, issued_by, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'issued', $7, $8) RETURNING ${LICENSE_COLUMNS}`,
      [license.id, license.code, license.productId, license.buyerEmail ?? '', license.note ?? '', license.benefitKeys.join(','), license.issuedBy ?? 'admin', license.expiresAt ?? null])
      return toLicense(rows[0])
    },

    async updateLicense(licenseId, changes) {
      const { rows } = await query(`UPDATE licenses SET status = $2, redeemed_user_id = $3, redeemed_email = $4, note = $5, buyer_email = $6, expires_at = $7, updated_at = NOW()
        WHERE id = $1 RETURNING ${LICENSE_COLUMNS}`,
      [licenseId, changes.status, changes.redeemedUserId ?? null, changes.redeemedEmail ?? '', changes.note ?? '', changes.buyerEmail ?? '', changes.expiresAt ?? null])
      return rows.length ? toLicense(rows[0]) : null
    },

    async deleteLicense(licenseId) {
      const { rowCount } = await query('DELETE FROM licenses WHERE id = $1', [licenseId])
      return rowCount > 0
    },

    async findLicenseByCode(code) {
      const { rows } = await query(`SELECT ${LICENSE_COLUMNS} FROM licenses WHERE code = $1`, [code])
      return rows.length ? toLicense(rows[0]) : null
    },

    async findProductByBenefitKey(benefitKey) {
      const { rows } = await query('SELECT product_id FROM product_features WHERE benefit_key = $1 LIMIT 1', [benefitKey])
      return rows.length ? rows[0].product_id : null
    },

    async insertUser(user) {
      const { rows } = await query(`INSERT INTO app_users (id, email, email_normalized, password_hash, password_salt, display_name)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, display_name, status, created_at`,
      [user.id, user.email, user.emailNormalized, user.passwordHash, user.passwordSalt, user.displayName ?? ''])
      return { id: rows[0].id, email: rows[0].email, displayName: rows[0].display_name ?? '', status: rows[0].status }
    },

    async findUserByEmail(emailNormalized) {
      const { rows } = await query('SELECT id, email, password_hash, password_salt, display_name, status FROM app_users WHERE email_normalized = $1', [emailNormalized])
      if (!rows.length) return null
      const row = rows[0]
      return { id: row.id, email: row.email, passwordHash: row.password_hash, passwordSalt: row.password_salt, displayName: row.display_name ?? '', status: row.status }
    },

    async findUserById(userId) {
      const { rows } = await query('SELECT id, email, display_name, status FROM app_users WHERE id = $1', [userId])
      if (!rows.length) return null
      const row = rows[0]
      return { id: row.id, email: row.email, displayName: row.display_name ?? '', status: row.status }
    },

    async findSocialUser(provider, providerUserId) {
      const column = SOCIAL_USER_COLUMNS[provider]
      if (!column || !providerUserId) return null
      const { rows } = await query(`SELECT ${USER_COLUMNS} FROM app_users WHERE ${column} = $1`, [providerUserId])
      return rows.length ? toUser(rows[0]) : null
    },

    async insertSocialUser(user) {
      const column = SOCIAL_USER_COLUMNS[user.provider]
      if (!column) throw new Error('Unsupported sign-in provider.')
      const { rows } = await query(`INSERT INTO app_users (id, email, email_normalized, password_hash, password_salt, display_name, ${column}, signup_source)
        VALUES ($1, $2, $3, '', '', $4, $5, $6) RETURNING ${USER_COLUMNS}`,
      [user.id, user.email, user.emailNormalized, user.displayName ?? '', user.providerId, user.provider])
      return toUser(rows[0])
    },

    async attachSocialIdentity(userId, provider, providerId) {
      const column = SOCIAL_USER_COLUMNS[provider]
      if (!column) throw new Error('Unsupported sign-in provider.')
      const { rows } = await query(`UPDATE app_users SET ${column} = $2, signup_source = $3, updated_at = NOW()
        WHERE id = $1 AND ${column} IS NULL RETURNING ${USER_COLUMNS}`,
      [userId, providerId, provider])
      return rows.length ? toUser(rows[0]) : null
    },

    async insertSession(session) {
      await query('INSERT INTO app_sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)', [session.id, session.userId, session.tokenHash, session.expiresAt])
    },

    async findSessionUser(tokenHash) {
      const { rows } = await query(`SELECT s.user_id AS id, s.expires_at, u.email, u.display_name, u.status, u.google_sub, u.facebook_id, u.signup_source
        FROM app_sessions s JOIN app_users u ON u.id = s.user_id WHERE s.token_hash = $1`, [tokenHash])
      if (!rows.length) return null
      const row = rows[0]
      if (new Date(row.expires_at).getTime() < Date.now()) {
        await query('DELETE FROM app_sessions WHERE token_hash = $1', [tokenHash])
        return null
      }
      return toUser(row)
    },

    async deleteSession(tokenHash) {
      await query('DELETE FROM app_sessions WHERE token_hash = $1', [tokenHash])
    },

    async listEntitlements(userId) {
      const { rows } = await query(`SELECT benefit_key, product_id, expires_at FROM entitlements WHERE user_id = $1
        AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at`, [userId])
      return rows.map(toEntitlement)
    },

    async insertEntitlement(entitlement) {
      await query(`INSERT INTO entitlements (id, user_id, product_id, benefit_key, license_id, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, product_id, benefit_key) DO UPDATE SET license_id = EXCLUDED.license_id, expires_at = EXCLUDED.expires_at`,
      [entitlement.id, entitlement.userId, entitlement.productId || null, entitlement.benefitKey, entitlement.licenseId || null, entitlement.expiresAt ?? null])
    },

    async deleteEntitlementsByLicense(licenseId) {
      await query('DELETE FROM entitlements WHERE license_id = $1', [licenseId])
    },
  }
}

export default createPostgresRepository
