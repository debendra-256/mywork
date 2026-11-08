import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { isValidAdminSession } from './admin-auth.js'
import { hasBloggerAuthorization } from './tools-config.js'
import { safeWriteJson, safeReadJson } from './config-writer.js'

const defaultSettings = { version: 1, visible: true }

function configFile(env) {
  return path.resolve(env.SIDEBAR_SETTINGS_FILE || path.join(process.cwd(), 'data', 'sidebar-settings.json'))
}

function normalizeSettings(input) {
  const value = input && typeof input === 'object' ? input.visible : input
  return { version: 1, visible: value !== false }
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
      // A broken settings file must never take the public site down.
      return response.status(200).json(defaultSettings)
    }
  }
  if (request.method === 'PUT') {
    if (!isValidAdminSession(request, env) && !(await hasBloggerAuthorization(request))) {
      return response.status(401).json({ error: 'Admin sign-in is required to change the sidebar setting.' })
    }
    try {
      const next = normalizeSettings(request.body ?? {})
      await writeSettings(env, next)
      return response.status(200).json(next)
    } catch (error) {
      return response.status(400).json({ error: error instanceof Error ? error.message : 'Could not save the sidebar setting.' })
    }
  }
  response.setHeader('Allow', 'GET, PUT')
  return response.status(405).json({ error: 'Method not allowed.' })
}
