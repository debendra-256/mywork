const MAX_EDGE = 2600
const MAX_BYTES = 25 * 1024 * 1024
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')) }
    img.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read that image'))
    reader.readAsDataURL(blob)
  })
}

async function publishBlob(blob, apiBase) {
  if (apiBase) {
    try {
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
      const form = new FormData()
      form.append('image', new File([blob], `photo.${ext}`, { type: blob.type }))
      const res = await fetch(`${apiBase}/uploads`, { method: 'POST', headers: { Accept: 'application/json' }, body: form })
      if (res.ok) {
        const data = await res.json()
        if (data?.url) return data.url
      }
    } catch {
      /* offline / API unavailable — embed the image in the design instead */
    }
  }
  return blobToDataUrl(blob)
}

export async function preparePhotoFile(file, apiBase = '/api') {
  if (!file) throw new Error('Choose an image')
  if (!ACCEPTED.includes(file.type)) throw new Error('Use a PNG, JPG, WebP or GIF image')
  if (file.size > MAX_BYTES) throw new Error('Photo is larger than 25 MB')

  const bitmap = await loadBitmap(file)
  const width = bitmap.width || bitmap.naturalWidth
  const height = bitmap.height || bitmap.naturalHeight
  if (!width || !height) throw new Error('Could not read that image')

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  if (bitmap.close) bitmap.close()

  let blob = await canvasToBlob(canvas, 'image/webp', 0.92)
  if (!blob) blob = await canvasToBlob(canvas, 'image/png')
  if (!blob) throw new Error('Could not prepare that image')

  return publishBlob(blob, apiBase)
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read that image'))
    img.src = src
  })
}

const CUT_EDGE = 1600

// Edge-connected chroma key: removes plain backdrops without any external model.
export async function removePhotoBackground(src, { apiBase = '/api', tolerance = 30 } = {}) {
  if (!src) throw new Error('Add a photo first')
  const img = await loadImageElement(src)
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) throw new Error('Could not read that image')

  const scale = Math.min(1, CUT_EDGE / Math.max(iw, ih))
  const w = Math.max(1, Math.round(iw * scale))
  const h = Math.max(1, Math.round(ih * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  let imageData
  try {
    imageData = ctx.getImageData(0, 0, w, h)
  } catch {
    throw new Error('That photo cannot be edited here — upload it again to make a cut-out')
  }
  const data = imageData.data

  const ring = []
  for (let x = 0; x < w; x++) { ring.push(x, (h - 1) * w + x) }
  for (let y = 0; y < h; y++) { ring.push(y * w, y * w + w - 1) }
  let transparentEdge = 0
  for (let i = 0; i < ring.length; i++) {
    if (data[ring[i] * 4 + 3] < 12) transparentEdge++
  }
  if (transparentEdge > ring.length * 0.5) {
    throw new Error('This element already has a transparent background')
  }
  const channels = [[], [], []]
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i] * 4
    channels[0].push(data[p])
    channels[1].push(data[p + 1])
    channels[2].push(data[p + 2])
  }
  const median = (values) => {
    values.sort((a, b) => a - b)
    return values[values.length >> 1]
  }
  const bg = [median(channels[0]), median(channels[1]), median(channels[2])]
  const limit2 = 3 * tolerance * tolerance

  const mask = new Uint8Array(w * h)
  const queue = new Int32Array(w * h)
  let head = 0
  let tail = 0
  const near = (idx) => {
    const p = idx * 4
    const dr = data[p] - bg[0]
    const dg = data[p + 1] - bg[1]
    const db = data[p + 2] - bg[2]
    return dr * dr + dg * dg + db * db <= limit2
  }
  for (let i = 0; i < ring.length; i++) {
    const idx = ring[i]
    if (!mask[idx] && near(idx)) {
      mask[idx] = 1
      queue[tail++] = idx
    }
  }
  while (head < tail) {
    const idx = queue[head++]
    const x = idx % w
    const y = (idx / w) | 0
    if (x > 0) { const n = idx - 1; if (!mask[n] && near(n)) { mask[n] = 1; queue[tail++] = n } }
    if (x < w - 1) { const n = idx + 1; if (!mask[n] && near(n)) { mask[n] = 1; queue[tail++] = n } }
    if (y > 0) { const n = idx - w; if (!mask[n] && near(n)) { mask[n] = 1; queue[tail++] = n } }
    if (y < h - 1) { const n = idx + w; if (!mask[n] && near(n)) { mask[n] = 1; queue[tail++] = n } }
  }
  if (tail < (w * h) / 20) {
    throw new Error('No plain background found — try a photo with a simpler backdrop')
  }

  // Erode the background twice so thin colour leaks (lit skin meeting a beige
  // wall) break off; the trapped islands are put back as subject below.
  let opened = mask
  for (let pass = 0; pass < 2; pass++) {
    const source = opened
    opened = new Uint8Array(w * h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        if (!source[i]) continue
        let solid = true
        for (let dy = -1; dy <= 1 && solid; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            const xx = x + dx
            const yy = y + dy
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
            if (!source[yy * w + xx]) {
              solid = false
              break
            }
          }
        }
        if (solid) opened[i] = 1
      }
    }
  }

  const isBg = new Uint8Array(w * h)
  head = 0
  tail = 0
  const seed = (i) => {
    if (opened[i] && !isBg[i]) {
      isBg[i] = 1
      queue[tail++] = i
    }
  }
  for (let x = 0; x < w; x++) {
    seed(x)
    seed((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    seed(y * w)
    seed(y * w + w - 1)
  }
  while (head < tail) {
    const i = queue[head++]
    const x = i % w
    const y = (i / w) | 0
    if (x > 0) seed(i - 1)
    if (x < w - 1) seed(i + 1)
    if (y > 0) seed(i - w)
    if (y < h - 1) seed(i + w)
  }

  // Keep the subject and anything comparably sized; drop stray background
  // leftovers the flood could not reach.
  const comp = new Int32Array(w * h).fill(-1)
  const areas = []
  const stack = new Int32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    if (isBg[i] || comp[i] >= 0) continue
    const id = areas.length
    let sp = 0
    let area = 0
    stack[sp++] = i
    comp[i] = id
    while (sp > 0) {
      const j = stack[--sp]
      area++
      const x = j % w
      const y = (j / w) | 0
      const visit = (n) => {
        if (!isBg[n] && comp[n] < 0) {
          comp[n] = id
          stack[sp++] = n
        }
      }
      if (x > 0) visit(j - 1)
      if (x < w - 1) visit(j + 1)
      if (y > 0) visit(j - w)
      if (y < h - 1) visit(j + w)
    }
    areas.push(area)
  }
  let largest = 0
  for (const area of areas) if (area > largest) largest = area
  if (!largest) throw new Error('No subject found — try a photo with a simpler backdrop')
  const keep = largest * 0.08

  // Feather the cut edge by blurring the mask once.
  const alpha = new Uint8Array(w * h)
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = !isBg[i] && comp[i] >= 0 && areas[comp[i]] >= keep ? 255 : 0
  }
  const blurred = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      let count = 0
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= w) continue
          sum += alpha[yy * w + xx]
          count++
        }
      }
      blurred[y * w + x] = Math.round(sum / count)
    }
  }
  for (let i = 0; i < blurred.length; i++) data[i * 4 + 3] = blurred[i]
  ctx.putImageData(imageData, 0, 0)

  let blob = await canvasToBlob(canvas, 'image/webp', 0.92)
  if (!blob) blob = await canvasToBlob(canvas, 'image/png')
  if (!blob) throw new Error('Could not prepare that image')
  return publishBlob(blob, apiBase)
}
