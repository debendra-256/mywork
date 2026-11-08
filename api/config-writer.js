// Safe JSON writer for Vercel read‑only environments.
// On Vercel the /var/task filesystem is read‑only; /tmp is writable.
// This helper writes to /tmp first, then reads it back for the response.
// The data is ephemeral (lost on cold starts) but avoids EROFS errors.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** Resolve the /tmp mirror path for a given config file. */
function tmpMirror(target) {
  // e.g. /var/task/data/tools-config.json → /tmp/data/tools-config.json
  const relative = path.relative(process.cwd(), target)
  return path.join('/tmp', relative)
}

/**
 * Write JSON to a config file.
 * - Locally (or when the filesystem is writable): writes directly.
 * - On Vercel (EROFS): writes to /tmp mirror.
 */
export async function safeWriteJson(target, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`
  try {
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, json, { encoding: 'utf8' })
  } catch (error) {
    if (error?.code === 'EROFS' || error?.code === 'EACCES') {
      // Vercel read‑only FS – write to /tmp instead
      const mirror = tmpMirror(target)
      await mkdir(path.dirname(mirror), { recursive: true })
      await writeFile(mirror, json, { encoding: 'utf8' })
    } else {
      throw error
    }
  }
}

/**
 * Read JSON from a config file.
 * Checks /tmp mirror first (Vercel writes), then the bundled file.
 */
export async function safeReadJson(target) {
  const mirror = tmpMirror(target)
  // Try /tmp first (may have a newer version written at runtime)
  try {
    return JSON.parse(await readFile(mirror, 'utf8'))
  } catch {
    // fall through
  }
  // Fall back to the bundled file
  return JSON.parse(await readFile(target, 'utf8'))
}
