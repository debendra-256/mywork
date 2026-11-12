// Scanned elements API for saving and serving elements to all users.
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { safeWriteJson, safeReadJson } from './config-writer.js'

function getElementsFile(env = process.env) {
  return path.resolve(env.SCANNED_ELEMENTS_FILE || path.join(process.cwd(), 'data', 'scanned-elements.json'))
}

function getUploadDir() {
  return path.resolve(process.cwd(), 'public', 'ScannedElement')
}

const DEFAULT_BUILTIN = [
  {
    id: 'el_mwd32wmn_t1wqn',
    name: '03 Birthday Headline',
    tag: 'Birthday',
    src: '/ScannedElement/el_mwd32wmn_t1wqn.webp',
    aspect: 2.223021582733813,
    width: 309,
    height: 139,
    slots: [],
    createdAt: 1794459879599,
  },
  {
    id: 'el_tricolour_nameplate',
    name: 'Tricolour Name Plate',
    tag: 'NamePlate',
    src: '/templates/tricolour-card.png',
    aspect: 3.003,
    width: 1024,
    height: 341,
    w: 84,
    slots: [
      {
        id: 'slot_photo',
        kind: 'image',
        label: 'Photo',
        shape: 'circle',
        x: 3.7,
        y: 17.3,
        w: 21.1,
        h: 63.9,
        fit: 'cover',
      },
      {
        id: 'slot_name',
        kind: 'text',
        label: 'Name',
        text: 'आपका नाम',
        x: 32.5,
        y: 28.5,
        w: 48.0,
        h: 24.0,
        color: '#051d49',
        font: 'sans',
        align: 'left',
        size: 8.5,
        script: 'any',
      },
      {
        id: 'slot_title',
        kind: 'text',
        label: 'Designation / Post',
        text: 'पद / पदनाम (उदा. विधायक, सांसद, अध्यक्ष)',
        x: 29.5,
        y: 54.8,
        w: 58.4,
        h: 24.1,
        color: '#5c1d0b',
        font: 'sans',
        align: 'center',
        size: 4.2,
        script: 'any',
      },
    ],
    createdAt: 1700000000000,
  },
]

async function readAllElements(env) {
  const filePath = getElementsFile(env)
  try {
    const data = await safeReadJson(filePath)
    if (Array.isArray(data)) return data
  } catch {
    // File doesn't exist yet, seed with default
    try {
      await safeWriteJson(filePath, DEFAULT_BUILTIN)
    } catch {}
  }
  return DEFAULT_BUILTIN
}

export default async function handler(request, response, env = process.env) {
  const method = (request.method || 'GET').toUpperCase()

  if (method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.status(204).end()
    return
  }

  // GET: Return all scanned elements
  if (method === 'GET') {
    try {
      const elements = await readAllElements(env)
      response.status(200).json({ success: true, elements })
    } catch (err) {
      response.status(500).json({ success: false, error: err?.message || 'Failed to read elements' })
    }
    return
  }

  // POST: Add or update a scanned element
  if (method === 'POST') {
    try {
      const body = request.body || {}
      const id = String(body.id || `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`)
      const name = String(body.name || 'Scanned Element').trim().slice(0, 60) || 'Scanned Element'
      const tag = String(body.tag || 'Other').trim().slice(0, 40) || 'Other'
      let src = String(body.src || '')
      const aspect = Number(body.aspect) > 0 ? Number(body.aspect) : 1
      const width = Number(body.width) || 1
      const height = Number(body.height) || 1
      const w = Number(body.w) > 0 ? Number(body.w) : undefined
      const slots = Array.isArray(body.slots) ? body.slots : []
      const createdAt = Number(body.createdAt) || Date.now()

      // If src is a base64 Data URL, save it into public/ScannedElement/
      if (src.startsWith('data:image/')) {
        const match = src.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
        if (match) {
          const rawExt = match[1].toLowerCase()
          const ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'svg+xml' ? 'svg' : rawExt
          const buffer = Buffer.from(match[2], 'base64')
          const uploadDir = getUploadDir()
          const filename = `${id}.${ext}`
          const filepath = path.join(uploadDir, filename)

          try {
            await mkdir(uploadDir, { recursive: true })
            await writeFile(filepath, buffer)
            src = `/ScannedElement/${filename}`
          } catch (writeErr) {
            console.warn('Could not write image to public/ScannedElement, falling back to data URL:', writeErr?.message)
          }
        }
      }

      const newElement = {
        id,
        name,
        tag,
        src,
        aspect,
        width,
        height,
        ...(w ? { w } : {}),
        slots,
        createdAt,
      }

      const elements = await readAllElements(env)
      const existingIndex = elements.findIndex((el) => el.id === id)
      let nextElements
      if (existingIndex >= 0) {
        nextElements = [...elements]
        nextElements[existingIndex] = newElement
      } else {
        nextElements = [newElement, ...elements]
      }

      await safeWriteJson(getElementsFile(env), nextElements)
      response.status(200).json({ success: true, element: newElement, elements: nextElements })
    } catch (err) {
      response.status(500).json({ success: false, error: err?.message || 'Failed to save scanned element' })
    }
    return
  }

  // DELETE: Remove a scanned element
  if (method === 'DELETE') {
    try {
      const url = new URL(request.url || '', 'http://localhost')
      const id = String(url.searchParams.get('id') || request.body?.id || '').trim()
      if (!id) {
        response.status(400).json({ success: false, error: 'Element ID is required' })
        return
      }

      const elements = await readAllElements(env)
      const target = elements.find((el) => el.id === id)
      if (target && typeof target.src === 'string' && target.src.startsWith('/ScannedElement/')) {
        try {
          const filename = path.basename(target.src)
          await unlink(path.join(getUploadDir(), filename))
        } catch {}
      }

      const nextElements = elements.filter((el) => el.id !== id)
      await safeWriteJson(getElementsFile(env), nextElements)
      response.status(200).json({ success: true, elements: nextElements })
    } catch (err) {
      response.status(500).json({ success: false, error: err?.message || 'Failed to delete element' })
    }
    return
  }

  response.status(405).json({ success: false, error: 'Method not allowed' })
}
