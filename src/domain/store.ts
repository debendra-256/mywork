export const WATERMARK_BENEFIT = 'watermark_free'

export interface StoreFeature {
  id: string
  productId: string
  title: string
  description: string
  icon: string
  tier: 'free' | 'premium'
  benefitKey: string
  sortOrder: number
  locked?: boolean
  unlockBenefit?: string
  benefitLabel?: string
}

export interface StoreProduct {
  id: string
  title: string
  type: 'software' | 'pdf'
  description: string
  pricePaise: number
  currency: string
  premium: boolean
  sortOrder: number
  watermarkText: string
  fileName?: string
  imageUrl?: string
  hasFile?: boolean
  features: StoreFeature[]
}

export interface StoreLicense {
  id: string
  code: string
  productId: string
  buyerEmail: string
  note: string
  benefitKeys: string[]
  status: 'issued' | 'redeemed' | 'revoked'
  redeemedEmail: string
  issuedBy: string
  expiresAt: string | null
  createdAt: string | null
}

export interface StoreSnapshot {
  products: StoreProduct[]
  licenses: StoreLicense[]
  store: { dataStore: string; databaseConfigured: boolean; availableDataStores?: string[] }
}

export interface CustomerEntitlement {
  benefitKey: string
  productId: string
  expiresAt: string | null
}

export interface CustomerSession {
  user: { id: string; email: string; displayName: string; signupSource: 'password' | 'google' | 'facebook' } | null
  entitlements: CustomerEntitlement[]
  benefits: string[]
}

export const emptyCustomerSession: CustomerSession = { user: null, entitlements: [], benefits: [] }

export function productPrice(product: Pick<StoreProduct, 'pricePaise' | 'currency'>): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: product.currency || 'INR' }).format(product.pricePaise / 100)
}
