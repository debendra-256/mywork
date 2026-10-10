import { getStore, newId } from '../server/db/index.js'
import { randomBytes, scryptSync } from 'node:crypto'

const env = {
  DATA_STORE: process.env.DATA_STORE || 'postgres',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5543/postgres',
  DATABASE_SSL: process.env.DATABASE_SSL || 'disable',
}

let failures = 0
function check(label, condition, detail) {
  if (condition) console.log(`  ok  ${label}`)
  else { failures += 1; console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`) }
}

const store = getStore(env)
const productId = `verify-${Date.now()}`

console.log(`Data store: ${env.DATA_STORE}`)

const product = await store.upsertProduct({
  id: productId, title: 'Verify Recorder', type: 'software', description: 'Smoke test product',
  pricePaise: 149900, currency: 'INR', watermarkText: 'Promptseen', premium: true, sortOrder: 1,
})
check('product upsert returns camelCase fields', product.title === 'Verify Recorder' && product.pricePaise === 149900 && product.premium === true, JSON.stringify(product))

const fileFeature = await store.upsertFeature({ productId, title: '4K screen capture', description: 'Records up to 2160p', icon: 'video', tier: 'free', benefitKey: '', sortOrder: 1 })
const paidFeature = await store.upsertFeature({ productId, title: 'No watermark', description: 'Clean export', icon: 'shield', tier: 'premium', benefitKey: 'watermark_free', sortOrder: 2 })
check('features saved with generated ids', Boolean(fileFeature.id) && paidFeature.benefitKey === 'watermark_free')

const withFeatures = await store.getProduct(productId)
check('getProduct includes both features in order', withFeatures.features.length === 2 && withFeatures.features[0].title === '4K screen capture')

const preserved = await store.upsertProduct({ ...withFeatures, id: productId, title: 'Verify Recorder Renamed', driveFileId: undefined, fileName: undefined })
check('product edit preserves nullable columns', preserved.title === 'Verify Recorder Renamed' && preserved.watermarkText === 'Promptseen')

const listed = await store.listProducts()
check('listProducts attaches features', (listed.find((item) => item.id === productId)?.features ?? []).length === 2)

const license = await store.insertLicense({ id: newId('lic'), code: `PS-${randomBytes(6).toString('hex').toUpperCase()}`, productId, buyerEmail: 'buyer@example.com', note: 'smoke test', benefitKeys: ['watermark_free'], expiresAt: null })
check('license issued', license.status === 'issued' && license.benefitKeys[0] === 'watermark_free')
check('license lookup by code', (await store.findLicenseByCode(license.code))?.id === license.id)

const email = `verify-${Date.now()}@example.com`
const salt = randomBytes(16).toString('hex')
const user = await store.insertUser({ id: newId('usr'), email, emailNormalized: email, passwordHash: scryptSync('secret1234', salt, 64).toString('base64'), passwordSalt: salt, displayName: 'Verify User' })
check('user created', user.email === email)
check('duplicate email rejected', await store.insertUser({ id: newId('usr'), email, emailNormalized: email, passwordHash: 'x', passwordSalt: salt, displayName: '' }).then(() => false).catch(() => true))

const token = randomBytes(32).toString('base64')
const hash = (await import('node:crypto')).createHash('sha256').update(token).digest('hex')
await store.insertSession({ id: newId('ses'), userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 3600_000).toISOString() })
check('session resolves to user', (await store.findSessionUser(hash))?.id === user.id)

await store.insertEntitlement({ id: newId('ent'), userId: user.id, productId, benefitKey: 'watermark_free', licenseId: license.id, expiresAt: null })
check('entitlement listed for user', (await store.listEntitlements(user.id)).some((item) => item.benefitKey === 'watermark_free'))
await store.insertEntitlement({ id: newId('ent'), userId: user.id, productId, benefitKey: 'watermark_free', licenseId: license.id, expiresAt: null })
check('entitlement upsert does not duplicate', (await store.listEntitlements(user.id)).length === 1)

await store.updateLicense(license.id, { status: 'redeemed', redeemedUserId: user.id, redeemedEmail: email, note: license.note, buyerEmail: license.buyerEmail, expiresAt: null })
const redeemedLicense = (await store.listLicenses({ productId })).find((item) => item.id === license.id)
check('license marked redeemed with holder', redeemedLicense.status === 'redeemed' && redeemedLicense.redeemedUserId === user.id)

await store.deleteEntitlementsByLicense(license.id)
check('revocation clears entitlements', (await store.listEntitlements(user.id)).length === 0)

await store.deleteFeature(paidFeature.id)
check('feature deleted', (await store.getProduct(productId)).features.length === 1)

await store.deleteProduct(productId)
check('product delete cascades features', (await store.listFeatures(productId)).length === 0)

await store.deleteSession(hash)
check('session deleted', (await store.findSessionUser(hash)) === null)

console.log(failures ? `\n${failures} check(s) failed` : '\nAll data-layer checks passed')
process.exit(failures ? 1 : 0)
