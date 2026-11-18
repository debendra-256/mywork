import path from 'node:path'
import { isValidAdminSession } from './admin-auth.js'
import { hasBloggerAuthorization } from './tools-config.js'
import { safeWriteJson, safeReadJson } from './config-writer.js'

const defaultSettings = {
  version: 1,
  postIds: [],
  customItems: [],
  hashtag: 'Political',
}

function configFile(env) {
  return path.resolve(env.TRENDING_TODAY_FILE || path.join(process.cwd(), 'data', 'trending-today.json'))
}

function normalizeSettings(input) {
  const source = input && typeof input === 'object' ? input : {}
  const postIds = Array.isArray(source.postIds)
    ? source.postIds.map((id) => String(id ?? '').trim()).filter(Boolean).slice(0, 24)
    : []
  const customItems = Array.isArray(source.customItems)
    ? source.customItems
        .map((item) => ({
          id: String(item?.id ?? '').trim(),
          title: String(item?.title ?? '').trim().slice(0, 140),
          image: String(item?.image ?? '').trim(),
          slug: String(item?.slug ?? '').trim(),
        }))
        .filter((item) => item.id && item.image)
        .slice(0, 24)
    : []
  const hashtag = String(source.hashtag ?? 'Political').trim().slice(0, 60) || 'Political'
  return { version: 1, postIds, customItems, hashtag }
}

async function readSettings(env) {
  try {
    return normalizeSettings(await safeReadJson(configFile(env)))
  } catch (error) {
    if (error?.code === 'ENOENT') return defaultSettings
    throw error
  }
}

async function writeSettings(env, config) {
  const target = configFile(env)
  await safeWriteJson(target, config)
}

export default async function handler(request, response, env = process.env) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method === 'GET') {
    try {
      return response.status(200).json(await readSettings(env))
    } catch {
      return response.status(200).json(defaultSettings)
    }
  }
  if (request.method === 'PUT') {
    if (!isValidAdminSession(request, env) && !(await hasBloggerAuthorization(request))) {
      return response.status(401).json({ error: 'Admin sign-in is required to update Trending Today posts.' })
    }
    try {
      const next = normalizeSettings(request.body ?? {})
      await writeSettings(env, next)
      return response.status(200).json(next)
    } catch (error) {
      return response.status(400).json({ error: error instanceof Error ? error.message : 'Could not save Trending Today settings.' })
    }
  }
  response.setHeader('Allow', 'GET, PUT')
  return response.status(405).json({ error: 'Method not allowed.' })
}
