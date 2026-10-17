export interface AiModelSettings {
  activeModel: string | null
  models: Array<{ id: string; name: string; provider: string; model: string; configured: boolean; custom?: boolean; baseUrl?: string }>
}
export function getAiModelSettings(env?: Record<string, string | undefined>): Promise<AiModelSettings>
export function saveAiModelSettings(input: { activeModel: string | null; apiKeys?: Record<string, string>; customModels?: Array<{ id: string; name: string; provider: string; model: string; baseUrl?: string }> }, env?: Record<string, string | undefined>): Promise<AiModelSettings>
export function getActiveAiModel(env?: Record<string, string | undefined>): Promise<{ id: string; model: string; provider: string; apiKey: string; baseUrl?: string }>
export function testAiModelKey(input: { modelId: string; apiKey?: string }, env?: Record<string, string | undefined>): Promise<{ ok: boolean; detail: string }>
export const supportedAiModels: Array<{ id: string; name: string; provider: string; model: string }>
export default function handler(request: any, response: any, env?: Record<string, string | undefined>): Promise<unknown>
