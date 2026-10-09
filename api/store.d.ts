export function listProducts(): Promise<Array<Record<string, string | number>>>;
export function addProduct(product: Record<string, unknown>, accessToken: string): Promise<Record<string, string | number>>;
export function handleStoreRequest(request: any, response: any, env?: Record<string, string | undefined>, resource?: string): Promise<unknown>;
