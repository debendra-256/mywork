import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { isValidAdminSession } from './admin-auth.js'

const builtInModels = [
  { id: 'openai-gpt-4o', name: 'GPT-4o', provider: 'openai', model: 'gpt-4o' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', model: 'gemini-2.5-flash' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'anthropic', model: 'claude-sonnet-4-6' },
]

function configFile(env) {
  return path.resolve(env.AI_MODEL_CONFIG_FILE || path.join(process.cwd(), 'data', 'ai-model-settings.json'))
}

async function readConfig(env) {
  try {
    const text = await readFile(configFile(env), 'utf8')
    const config = JSON.parse(text)
    if (config.version !== 1 || !Array.isArray(config.customModels) || typeof config.apiKeys !== 'object' || !config.apiKeys) throw new Error('AI model config file is invalid.')
    return config
  } catch (error) {
    if (error?.code === 'ENOENT') return { version: 1, activeModel: env.OPENAI_API_KEY ? 'openai-gpt-4o' : null, customModels: [], apiKeys: {} }
    throw error
  }
}

async function writeConfig(env, config) {
  const target = configFile(env)
  await mkdir(path.dirname(target), { recursive: true })
  const temporary = `${target}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`
  await writeFile(temporary, `${JSON.stringify(config, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  await rename(temporary, target)
}

function encryptionKey(env) {
  if (!env.AI_SETTINGS_ENCRYPTION_KEY) throw new Error('Set AI_SETTINGS_ENCRYPTION_KEY to encrypt provider API keys before saving them.')
  return createHash('sha256').update(env.AI_SETTINGS_ENCRYPTION_KEY).digest()
}

function encrypt(value, env) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(env), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`
}

function decrypt(value, env) {
  const [iv, tag, encrypted] = value.split(':')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(env), Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]).toString('utf8')
}

function allModels(config) {
  return [...builtInModels, ...config.customModels.map((model) => ({ ...model, custom: true }))]
}

async function readState(env) {
  const config = await readConfig(env)
  const models = allModels(config)
  const activeModel = Object.hasOwn(config, 'activeModel') ? config.activeModel : 'openai-gpt-4o'
  return {
    activeModel,
    models: models.map(({ id, name, provider, model, custom }) => ({
      id, name, provider, model,
      configured: Boolean(config.apiKeys[id]) || (id === 'openai-gpt-4o' && Boolean(env.OPENAI_API_KEY)),
      ...(custom ? { custom: true } : {}),
    })),
  }
}

export async function getAiModelSettings(env = process.env) {
  return readState(env)
}

export async function saveAiModelSettings({ activeModel = null, apiKeys = {}, customModels = [] }, env = process.env) {
  const config = await readConfig(env)
  const customCatalog = new Map(config.customModels.map((model) => [model.id, model]))
  if (!Array.isArray(customModels)) throw new Error('Custom models must be a list.')
  for (const item of customModels) {
    const provider = String(item?.provider ?? '').toLowerCase()
    const model = String(item?.model ?? '').trim()
    const name = String(item?.name ?? '').trim()
    const id = String(item?.id ?? '').trim()
    if (!/^[a-z0-9][a-z0-9._-]{1,79}$/i.test(id) || !name || name.length > 80 || !model || model.length > 160 || !['openai', 'google', 'anthropic'].includes(provider)) throw new Error('Enter a valid provider, model name, and model ID.')
    if (builtInModels.some((builtIn) => builtIn.id === id)) throw new Error('That model ID is reserved for a built-in model.')
    customCatalog.set(id, { id, name, provider, model })
  }

  const nextConfig = { ...config, customModels: [...customCatalog.values()] }
  const models = allModels(nextConfig)
  if (activeModel && !models.some((model) => model.id === activeModel)) throw new Error('Choose a supported AI model.')
  if (!apiKeys || typeof apiKeys !== 'object' || Array.isArray(apiKeys)) throw new Error('API keys must be a model-to-key map.')
  const nextKeys = { ...config.apiKeys }
  for (const { id } of models) {
    const apiKey = typeof apiKeys[id] === 'string' ? apiKeys[id].trim() : ''
    if (apiKey) nextKeys[id] = encrypt(apiKey, env)
  }
  if (activeModel && !nextKeys[activeModel] && !(activeModel === 'openai-gpt-4o' && env.OPENAI_API_KEY)) throw new Error('Add an API key for the model you want to activate.')

  nextConfig.activeModel = activeModel || null
  nextConfig.apiKeys = nextKeys
  nextConfig.updatedAt = new Date().toISOString()
  await writeConfig(env, nextConfig)
  return readState(env)
}

export async function getActiveAiModel(env = process.env) {
  const config = await readConfig(env)
  const state = await readState(env)
  if (!state.activeModel) throw new Error('Enable an AI model in Admin → AI models before generating prompts.')
  const selected = allModels(config).find((model) => model.id === state.activeModel)
  if (!selected) throw new Error('The active AI model is unavailable. Choose another model in Admin → AI models.')
  const encryptedKey = config.apiKeys[selected.id]
  if (encryptedKey) return { ...selected, apiKey: decrypt(encryptedKey, env) }
  if (selected.id === 'openai-gpt-4o' && env.OPENAI_API_KEY) return { ...selected, apiKey: env.OPENAI_API_KEY }
  throw new Error(`Add an API key for ${selected.name} in Admin → AI models.`)
}

export const supportedAiModels = builtInModels

async function hasBloggerAuthorization(request) {
  const token = String(request.headers.authorization ?? '').match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return false
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`)
  if (!response.ok) return false
  const tokenInfo = await response.json()
  return String(tokenInfo.scope ?? '').split(' ').includes('https://www.googleapis.com/auth/blogger')
}

export default async function handler(request, response, env = process.env) {
  if (!['GET', 'PUT'].includes(request.method)) {
    response.setHeader('Allow', 'GET, PUT')
    return response.status(405).json({ error: 'Method not allowed.' })
  }
  try {
    if (!isValidAdminSession(request, env) && !(await hasBloggerAuthorization(request))) return response.status(401).json({ error: 'Sign in to manage AI models.' })
    if (request.method === 'GET') return response.status(200).json(await getAiModelSettings(env))
    return response.status(200).json(await saveAiModelSettings(request.body ?? {}, env))
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Could not save AI model settings.' })
  }
}
