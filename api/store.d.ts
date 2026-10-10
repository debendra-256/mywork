export interface StoreFeature {
  id: string
  productId: string
  title: string
  description: string
  icon: string
  tier: 'free' | 'premium'
  benefitKey: string
  sortOrder: number
  locked: boolean
  unlockBenefit: string
  benefitLabel: string
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

export interface StoreStatus {
  dataStore: string
  databaseConfigured: boolean
}

export function listProducts(env?: Record<string, string | undefined>): Promise<StoreProduct[]>;
export function getProduct(productId: string, env?: Record<string, string | undefined>): Promise<StoreProduct | null>;
export function addProduct(product: Record<string, unknown>, accessToken: string, env?: Record<string, string | undefined>): Promise<StoreProduct>;
export function handleStoreRequest(request: any, response: any, env?: Record<string, string | undefined>, resource?: string): Promise<unknown>;
export default handleStoreRequest;
