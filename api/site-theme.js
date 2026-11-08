import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { isValidAdminSession } from './admin-auth.js'
import { hasBloggerAuthorization } from './tools-config.js'
import { safeWriteJson, safeReadJson } from './config-writer.js'

const themeIds = ['premium-purple', 'dark-neon', 'ocean-cyan', 'sunset-gradient']
const defaultTheme = themeIds[0]

function configFile(env) {
  return path.resolve(env.SITE_THEME_FILE || path.join(process.cwd(), 'data', 'site-theme.json'))
}

function normalizeTheme(input) {
  const value = input && typeof input === 'object' ? input.theme : input
  if (!themeIds.includes(String(value))) throw new Error('Choose one of the built-in site themes.')
  return { version: 1, theme: String(value) }
}

async function readTheme(env) {
  try {
    return normalizeTheme(await safeReadJson(configFile(env)))
  } catch (error) {
    if (error?.code === 'ENOENT') return { version: 1, theme: defaultTheme }
    throw error
  }
}

async function writeTheme(env, config) {
  const target = configFile(env)
  await safeWriteJson(target, config)
}

export default async function handler(request, response, env = process.env) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method === 'GET') {
    try {
      return response.status(200).json(await readTheme(env))
    } catch {
      // A broken settings file must never take the public site down.
      return response.status(200).json({ version: 1, theme: defaultTheme })
    }
  }
  if (request.method === 'PUT') {
    if (!isValidAdminSession(request, env) && !(await hasBloggerAuthorization(request))) {
      return response.status(401).json({ error: 'Admin sign-in is required to change the site theme.' })
    }
    try {
      const next = normalizeTheme(request.body ?? {})
      await writeTheme(env, next)
      return response.status(200).json(next)
    } catch (error) {
      return response.status(400).json({ error: error instanceof Error ? error.message : 'Could not save the site theme.' })
    }
  }
  response.setHeader('Allow', 'GET, PUT')
  return response.status(405).json({ error: 'Method not allowed.' })
}
