// Scanned elements API for saving and serving elements to all users.
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { safeWriteJson, safeReadJson } from './config-writer.js'
import { isValidAdminSession } from './admin-auth.js'
import { hasBloggerAuthorization } from './tools-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

function getElementsFile(env = process.env) {
  if (env.SCANNED_ELEMENTS_FILE) return path.resolve(env.SCANNED_ELEMENTS_FILE)
  const candidate = path.join(ROOT_DIR, 'data', 'scanned-elements.json')
  if (fs.existsSync(candidate)) return candidate
  const cwdCandidate = path.resolve(process.cwd(), 'data', 'scanned-elements.json')
  if (fs.existsSync(cwdCandidate)) return cwdCandidate
  return candidate
}

function getUploadDirs() {
  const dirs = new Set()
  dirs.add(path.join(ROOT_DIR, 'public', 'ScannedElement'))
  const distDir = path.join(ROOT_DIR, 'dist', 'ScannedElement')
  if (fs.existsSync(path.dirname(distDir))) {
    dirs.add(distDir)
  }
  const cwdPublic = path.resolve(process.cwd(), 'public', 'ScannedElement')
  if (fs.existsSync(path.dirname(cwdPublic))) {
    dirs.add(cwdPublic)
  }
  return Array.from(dirs)
}

async function saveBase64Image(id, dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return null
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
  if (!match) return null
  const rawExt = match[1].toLowerCase()
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'svg+xml' ? 'svg' : rawExt
  const buffer = Buffer.from(match[2], 'base64')
  const filename = `${id}.${ext}`
  const uploadDirs = getUploadDirs()
  let savedAny = false

  for (const dir of uploadDirs) {
    try {
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, filename), buffer)
      savedAny = true
    } catch (err) {
      console.warn(`Could not write image to ${dir}:`, err?.message)
    }
  }

  return savedAny ? `/ScannedElement/${filename}` : null
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
    src: '/ScannedElement/el_tricolour_nameplate.png',
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
  {
    id: 'el_event_birthday_splash',
    name: 'Happy Birthday Vibrant Splash',
    tag: 'Events',
    src: '/ScannedElement/el_event_birthday_splash.png',
    aspect: 1.122,
    width: 698,
    height: 622,
    slots: [],
    createdAt: 1731450000000,
  },
  {
    id: 'el_event_birthday_cake',
    name: 'Happy Birthday Cake Badge',
    tag: 'Events',
    src: '/ScannedElement/el_event_birthday_cake.png',
    aspect: 1.659,
    width: 672,
    height: 405,
    slots: [],
    createdAt: 1731450001000,
  },
  {
    id: 'el_event_anniversary_lettering',
    name: 'Happy Anniversary Lettering',
    tag: 'Events',
    src: '/ScannedElement/el_event_anniversary_lettering.png',
    aspect: 2.196,
    width: 582,
    height: 265,
    slots: [],
    createdAt: 1731450002000,
  },
  {
    id: 'el_event_birthday_gold_red',
    name: 'Happy Birthday Gold & Red',
    tag: 'Events',
    src: '/ScannedElement/el_event_birthday_gold_red.png',
    aspect: 1.82,
    width: 699,
    height: 384,
    slots: [],
    createdAt: 1731450003000,
  },
  {
    id: 'el_event_new_year_2026',
    name: 'Happy New Year 2026',
    tag: 'Events',
    src: '/ScannedElement/el_event_new_year_2026.png',
    aspect: 1.11,
    width: 596,
    height: 537,
    slots: [],
    createdAt: 1731450004000,
  },
  {
    id: 'el_event_first_birthday_decor',
    name: 'Kids First Birthday Decor',
    tag: 'Events',
    src: '/ScannedElement/el_event_first_birthday_decor.png',
    aspect: 0.869,
    width: 611,
    height: 703,
    slots: [],
    createdAt: 1731450005000,
  },
  {
    id: 'el_event_nav_varsh_creative',
    name: 'Nav Varsh Hindi Calligraphy',
    tag: 'Events',
    src: '/ScannedElement/el_event_nav_varsh_creative.png',
    aspect: 1.017,
    width: 593,
    height: 583,
    slots: [],
    createdAt: 1731450006000,
  },
  {
    id: 'el_event_nav_varsh_hardik',
    name: 'Nav Varsh Hardik Shubhkamnaye',
    tag: 'Events',
    src: '/ScannedElement/el_event_nav_varsh_hardik.png',
    aspect: 1.132,
    width: 283,
    height: 250,
    slots: [],
    createdAt: 1731450007000,
  },
  {
    id: 'el_event_anniversary_hearts',
    name: 'Happy Anniversary Hearts',
    tag: 'Events',
    src: '/ScannedElement/el_event_anniversary_hearts.png',
    aspect: 1.18,
    width: 649,
    height: 550,
    slots: [],
    createdAt: 1731450008000,
  },
  {
    id: 'el_festival_chhath_puja_arghya',
    name: 'Chhath Puja Arghya Clipart',
    tag: 'Festivals',
    src: '/ScannedElement/el_festival_chhath_puja_arghya.png',
    aspect: 1.491,
    width: 689,
    height: 462,
    slots: [],
    createdAt: 1731450009000,
  },
  {
    id: 'el_festival_diwali_shubh_calligraphy',
    name: 'Shubh Diwali Calligraphy',
    tag: 'Festivals',
    src: '/ScannedElement/el_festival_diwali_shubh_calligraphy.png',
    aspect: 1.177,
    width: 578,
    height: 491,
    slots: [],
    createdAt: 1731450010000,
  },
  {
    id: 'el_festival_diwali_diya_rangoli',
    name: 'Diwali Diya & Rangoli Decor',
    tag: 'Festivals',
    src: '/ScannedElement/el_festival_diwali_diya_rangoli.png',
    aspect: 1.01,
    width: 712,
    height: 705,
    slots: [],
    createdAt: 1731450011000,
  },
  {
    id: 'el_festival_chhath_puja_wishes',
    name: 'Chhath Puja Mahaparv Wishes',
    tag: 'Festivals',
    src: '/ScannedElement/el_festival_chhath_puja_wishes.png',
    aspect: 1.761,
    width: 699,
    height: 397,
    slots: [],
    createdAt: 1731450012000,
  },
  {
    id: 'el_festival_happy_diwali_oil_lamp',
    name: 'Happy Diwali Oil Lamp Greeting',
    tag: 'Festivals',
    src: '/ScannedElement/el_festival_happy_diwali_oil_lamp.png',
    aspect: 1.004,
    width: 735,
    height: 732,
    slots: [],
    createdAt: 1731450013000,
  },
  {
    id: 'el_festival_diwali_multicolor',
    name: 'Happy Diwali Multicolor Typography',
    tag: 'Festivals',
    src: '/ScannedElement/el_festival_diwali_multicolor.png',
    aspect: 1.822,
    width: 614,
    height: 337,
    slots: [],
    createdAt: 1731450014000,
  },
  {
    id: 'el_other_comic_boom_yellow',
    name: 'Comic Boom Yellow Splash',
    tag: 'Others',
    src: '/ScannedElement/el_other_comic_boom_yellow.png',
    aspect: 1.208,
    width: 598,
    height: 495,
    slots: [],
    createdAt: 1731450015000,
  },
  {
    id: 'el_other_comic_boom_cyan',
    name: 'Comic Boom Cyan Splash',
    tag: 'Others',
    src: '/ScannedElement/el_other_comic_boom_cyan.png',
    aspect: 1.237,
    width: 736,
    height: 595,
    slots: [],
    createdAt: 1731450016000,
  },
  {
    id: 'el_festival_ratha_yatra_odia',
    name: 'Ratha Yatra Shubhechha (Odia)',
    tag: 'Festivals',
    src: '/ScannedElement/el_festival_ratha_yatra_odia.png',
    aspect: 1.478,
    width: 1008,
    height: 682,
    slots: [],
    createdAt: 1731450017000,
  },
  {
    id: 'el_event_republic_day_red_fort',
    name: 'Republic Day Red Fort & Chakra',
    tag: 'Events',
    src: '/ScannedElement/el_event_republic_day_red_fort.png',
    aspect: 1.293,
    width: 490,
    height: 379,
    slots: [],
    createdAt: 1731460000000,
  },
  {
    id: 'el_event_tricolor_crowd_celebration',
    name: 'Tricolor Flag National Celebration',
    tag: 'Events',
    src: '/ScannedElement/el_event_tricolor_crowd_celebration.png',
    aspect: 1.832,
    width: 667,
    height: 364,
    slots: [],
    createdAt: 1731460001000,
  },
  {
    id: 'el_event_gandhi_jayanti_charkha',
    name: 'Gandhi Jayanti Charkha Greeting',
    tag: 'Events',
    src: '/ScannedElement/el_event_gandhi_jayanti_charkha.png',
    aspect: 0.846,
    width: 735,
    height: 869,
    slots: [],
    createdAt: 1731460002000,
  },
  {
    id: 'el_event_gandhi_jayanti_2nd_october',
    name: 'Happy Gandhi Jayanti 2nd October',
    tag: 'Events',
    src: '/ScannedElement/el_event_gandhi_jayanti_2nd_october.png',
    aspect: 0.905,
    width: 687,
    height: 759,
    slots: [],
    createdAt: 1731460003000,
  },
  {
    id: 'el_event_womens_day_young_girl',
    name: "International Women's Day Celebration",
    tag: 'Events',
    src: '/ScannedElement/el_event_womens_day_young_girl.png',
    aspect: 1.015,
    width: 671,
    height: 661,
    slots: [],
    createdAt: 1731460004000,
  },
  {
    id: 'el_event_republic_day_wings',
    name: 'Happy Republic Day Tricolor Wings',
    tag: 'Events',
    src: '/ScannedElement/el_event_republic_day_wings.png',
    aspect: 1.0,
    width: 736,
    height: 736,
    slots: [],
    createdAt: 1731460005000,
  },
  {
    id: 'el_event_multitasking_woman',
    name: 'Multitasking Woman Illustration',
    tag: 'Events',
    src: '/ScannedElement/el_event_multitasking_woman.png',
    aspect: 1.0,
    width: 736,
    height: 736,
    slots: [],
    createdAt: 1731460006000,
  },
  {
    id: 'el_event_national_youth_day_swamiji_banner',
    name: 'National Youth Day Swamiji Banner',
    tag: 'Events',
    src: '/ScannedElement/el_event_national_youth_day_swamiji_banner.png',
    aspect: 0.735,
    width: 548,
    height: 746,
    slots: [],
    createdAt: 1731460007000,
  },
  {
    id: 'el_event_yuwa_diwas_vivekananda',
    name: 'Yuwa Diwas Swami Vivekananda',
    tag: 'Events',
    src: '/ScannedElement/el_event_yuwa_diwas_vivekananda.png',
    aspect: 0.712,
    width: 333,
    height: 468,
    slots: [],
    createdAt: 1731460008000,
  },
  {
    id: 'el_event_national_youth_day_12_jan',
    name: 'National Youth Day 12 January',
    tag: 'Events',
    src: '/ScannedElement/el_event_national_youth_day_12_jan.png',
    aspect: 0.866,
    width: 528,
    height: 610,
    slots: [],
    createdAt: 1731460009000,
  },
  {
    id: 'el_event_women_in_aesthetics',
    name: 'Women in Aesthetics Graphic',
    tag: 'Events',
    src: '/ScannedElement/el_event_women_in_aesthetics.png',
    aspect: 2.494,
    width: 591,
    height: 237,
    slots: [],
    createdAt: 1731460010000,
  },
  {
    id: 'el_festival_ganesh_chaturthi_calligraphy',
    name: 'Happy Ganesh Chaturthi Calligraphy',
    tag: 'Festivals',
    src: '/ScannedElement/el_festival_ganesh_chaturthi_calligraphy.png',
    aspect: 1.313,
    width: 541,
    height: 412,
    slots: [],
    createdAt: 1731460011000,
  },
  {
    id: 'el_festival_ganesh_chaturthi_vector_art',
    name: 'Ganesh Chaturthi Celebration Art',
    tag: 'Festivals',
    src: '/ScannedElement/el_festival_ganesh_chaturthi_vector_art.png',
    aspect: 1.069,
    width: 571,
    height: 534,
    slots: [],
    createdAt: 1731460012000,
  },
]

async function readAllElements(env) {
  const filePath = getElementsFile(env)
  try {
    const data = await safeReadJson(filePath)
    if (Array.isArray(data) && data.length > 0) {
      const elementMap = new Map()
      for (const b of DEFAULT_BUILTIN) {
        if (b && b.id) elementMap.set(b.id, b)
      }
      for (const el of data) {
        if (el && el.id) elementMap.set(el.id, el)
      }
      return Array.from(elementMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    }
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

      // If src is a base64 Data URL, save it into public/ScannedElement/ and dist/ScannedElement/
      if (src.startsWith('data:image/')) {
        const savedSrc = await saveBase64Image(id, src)
        if (savedSrc) src = savedSrc
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
      const elementMap = new Map()

      // 1. Builtins as foundation
      for (const b of DEFAULT_BUILTIN) {
        if (b && b.id) elementMap.set(b.id, b)
      }

      // 2. Existing server elements
      for (const el of elements) {
        if (el && el.id) elementMap.set(el.id, el)
      }

      // 3. Client elements (so previously scanned elements in client cache are NEVER lost!)
      const clientElements = Array.isArray(body.clientElements) ? body.clientElements : []
      for (const el of clientElements) {
        if (el && el.id && !elementMap.has(el.id)) {
          let elSrc = el.src
          if (typeof elSrc === 'string' && elSrc.startsWith('data:image/')) {
            const savedElSrc = await saveBase64Image(el.id, elSrc)
            if (savedElSrc) elSrc = savedElSrc
          }
          elementMap.set(el.id, { ...el, src: elSrc })
        }
      }

      // 4. Update with the newly scanned element
      elementMap.set(id, newElement)

      const nextElements = Array.from(elementMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

      await safeWriteJson(getElementsFile(env), nextElements)
      response.status(200).json({ success: true, element: newElement, elements: nextElements })
    } catch (err) {
      response.status(500).json({ success: false, error: err?.message || 'Failed to save scanned element' })
    }
    return
  }

  // DELETE: Remove a scanned element (Admin only from Admin Panel)
  if (method === 'DELETE') {
    if (!isValidAdminSession(request, env) && !(await hasBloggerAuthorization(request))) {
      response.status(401).json({ success: false, error: 'Only admins can delete scanned elements from the Admin Panel.' })
      return
    }

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
          for (const dir of getUploadDirs()) {
            try {
              await unlink(path.join(dir, filename))
            } catch {}
          }
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
