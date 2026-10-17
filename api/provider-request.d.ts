export interface AiModelConfig { id: string; name: string; provider: string; model: string; apiKey: string; baseUrl?: string }
export interface ChatRequest { endpoint: string; headers: Record<string, string>; body: unknown }

export function normalizeBaseUrl(value: string | undefined): string
export function buildChatRequest(selected: AiModelConfig, options: { systemText: string; userText: string; image?: string; maxTokens?: number }): ChatRequest
export function readChatCompletion(selected: Pick<AiModelConfig, 'provider'>, result: any): string
export function providerFailure(result: any, status: number, name: string): string
