// Tools configuration API with safe write for read‑only Vercel environments.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isValidAdminSession } from './admin-auth.js';
import { safeWriteJson, safeReadJson } from './config-writer.js';

export async function hasBloggerAuthorization(request) {
  const token = String(request.headers.authorization ?? '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return false;
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);
  if (!response.ok) return false;
  const tokenInfo = await response.json();
  return String(tokenInfo.scope ?? '').split(' ').includes('https://www.googleapis.com/auth/blogger');
}

const toolIcons = [
  'images', 'youtube', 'image-plus', 'video', 'qr-code', 'download', 'scan', 'layers',
  'message', 'network', 'eraser', 'sparkles', 'wand', 'bot', 'monitor-play', 'zap',
  'instagram', 'smile', 'palette'
];
const idPattern = /^[a-z0-9][a-z0-9-]{1,47}$/;

function configFile(env) {
  return path.resolve(env.TOOLS_CONFIG_FILE || path.join(process.cwd(), 'data', 'tools-config.json'));
}

function emptyConfig() {
  return { version: 1, overrides: {}, customTools: [] };
}

function normalizeConfig(input) {
  const source = input && typeof input === 'object' ? input : {};
  const overrides = {};
  if (source.overrides && typeof source.overrides === 'object' && !Array.isArray(source.overrides)) {
    for (const [id, enabled] of Object.entries(source.overrides)) {
      if (!idPattern.test(id)) throw new Error(`Tool ID "${id}" must use lowercase letters, numbers or dashes.`);
      if (typeof enabled !== 'boolean') throw new Error('Each tool override must be true or false.');
      overrides[id] = enabled;
    }
  }
  if (Object.keys(overrides).length > 100) throw new Error('Too many tool overrides.');

  const customTools = [];
  if (Array.isArray(source.customTools)) {
    for (const item of source.customTools) {
      const id = String(item?.id ?? '').trim();
      const title = String(item?.title ?? '').trim();
      const href = String(item?.href ?? '').trim();
      const icon = String(item?.icon ?? '');
      if (!idPattern.test(id)) throw new Error('Each custom tool needs a lowercase ID.');
      if (!title || title.length > 60) throw new Error('Custom tool titles must be 1–60 characters.');
      if (!/^https?:\/\/\S+$/i.test(href) && !/^\/[^/]/.test(href))
        throw new Error('Custom tool links must be an http(s) URL or an app path starting with "/".');
      if (!toolIcons.includes(icon)) throw new Error('Choose a supported icon for each custom tool.');
      if (customTools.some(t => t.id === id))
        throw new Error(`Two custom tools share the ID "${id}".`);
      customTools.push({ id, title, href, icon, enabled: item?.enabled !== false });
    }
  }
  if (customTools.length > 40) throw new Error('Manage up to 40 custom tools.');
  return { version: 1, overrides, customTools };
}

async function readConfig(env) {
  try {
    return normalizeConfig(await safeReadJson(configFile(env)));
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyConfig();
    throw error;
  }
}

async function writeConfig(env, config) {
  const target = configFile(env);
  await safeWriteJson(target, config);
}

export default async function handler(request, response, env = process.env) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'GET') {
    try {
      return response.status(200).json(await readConfig(env));
    } catch {
      return response.status(200).json(emptyConfig());
    }
  }
  if (request.method === 'PUT') {
    if (!isValidAdminSession(request, env) && !(await hasBloggerAuthorization(request)))
      return response.status(401).json({ error: 'Admin sign-in is required to manage tools.' });
    try {
      const next = normalizeConfig(request.body ?? {});
      await writeConfig(env, next);
      return response.status(200).json(next);
    } catch (error) {
      return response.status(400).json({ error: error instanceof Error ? error.message : 'Could not save tool settings.' });
    }
  }
  response.setHeader('Allow', 'GET, PUT');
  return response.status(405).json({ error: 'Method not allowed.' });
}
