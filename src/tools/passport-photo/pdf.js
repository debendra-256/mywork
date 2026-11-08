/**
 * Minimal PDF 1.4 writer. Passport offices want JPEG or PDF sheets, and adding a
 * PDF library for one button is not worth the bundle, so the structure is built
 * by hand: JPEG bytes go straight into an /XObject with /Filter /DCTDecode.
 */

const MM_TO_PT = 72 / 25.4

function ascii(text) {
  const bytes = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff
  return bytes
}

function concat(chunks) {
  let size = 0
  for (const chunk of chunks) size += chunk.length
  const out = new Uint8Array(size)
  let at = 0
  for (const chunk of chunks) {
    out.set(chunk, at)
    at += chunk.length
  }
  return out
}

function canvasJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    const flat = document.createElement('canvas')
    flat.width = canvas.width
    flat.height = canvas.height
    const ctx = flat.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, flat.width, flat.height)
    ctx.drawImage(canvas, 0, 0)
    flat.toBlob((blob) => {
      if (!blob) reject(new Error('Could not prepare the PDF image'))
      else resolve(blob)
    }, 'image/jpeg', quality)
  })
}

/**
 * Each page keeps its own paper size, so one photo and a whole A4 sheet use the
 * same code path. The image is letterbox-fitted and centred on the page.
 */
export async function buildPdf(pages, options = {}) {
  const quality = options.quality ?? 0.92
  const items = []
  for (const page of pages) {
    const blob = await canvasJpeg(page.canvas, quality)
    const bytes = new Uint8Array(await blob.arrayBuffer())
    if (!isJpeg(bytes)) throw new Error('The PDF image stream is not a JPEG')
    items.push({ bytes, width: page.canvas.width, height: page.canvas.height, page: page.page })
  }
  return writePdf(items, options.title || 'ImgMojo Passport Photo')
}

function isJpeg(bytes) {
  return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8
}

function writePdf(items, title) {
  const chunks = []
  const offsets = []
  let pos = 0
  const push = (bytes) => { chunks.push(bytes); pos += bytes.length }
  const str = (text) => push(ascii(text))
  const begin = (n) => { offsets[n] = pos; str(`${n} 0 obj\n`) }
  const end = () => str('endobj\n')

  // Page node, content stream, image — the xref must have exactly one entry per object written.
  const perPage = 3
  const firstPageObj = 3
  const infoObj = firstPageObj + perPage * items.length
  const xrefAt = (name, i) => `${name}${i}`

  str('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')

  begin(1)
  str('<< /Type /Catalog /Pages 2 0 R >>\n')
  end()

  begin(2)
  str(`<< /Type /Pages /Kids [${items.map((_, i) => `${firstPageObj + perPage * i} 0 R`).join(' ')}] /Count ${items.length} >>\n`)
  end()

  items.forEach((item, i) => {
    const pageObj = firstPageObj + perPage * i
    const contentObj = pageObj + 1
    const imageObj = pageObj + 2
    const name = xrefAt('Im', i)

    const pw = round(item.page.w * MM_TO_PT)
    const ph = round(item.page.h * MM_TO_PT)
    const fit = Math.min(pw / item.width, ph / item.height)
    const dw = round(item.width * fit)
    const dh = round(item.height * fit)
    const dx = round((pw - dw) / 2)
    const dy = round((ph - dh) / 2)

    begin(pageObj)
    str(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /${name} ${imageObj} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${contentObj} 0 R >>\n`)
    end()

    const content = `q ${dw} 0 0 ${dh} ${dx} ${dy} cm /${name} Do Q\n`
    begin(contentObj)
    str(`<< /Length ${content.length} >>\nstream\n${content}endstream\n`)
    end()

    begin(imageObj)
    str(`<< /Type /XObject /Subtype /Image /Width ${item.width} /Height ${item.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${item.bytes.length} >>\nstream\n`)
    push(item.bytes)
    str('\nendstream\n')
    end()
  })

  begin(infoObj)
  str(`<< /Producer (ImgMojo Passport Photo Maker) /Title (${escapeText(title)}) /CreationDate (${pdfDate()}) >>\n`)
  end()

  const xrefPos = pos
  const count = infoObj + 1
  str(`xref\n0 ${count}\n0000000000 65535 f \n`)
  for (let n = 1; n < count; n++) str(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`)
  str(`trailer\n<< /Size ${count} /Root 1 0 R /Info ${infoObj} 0 R /ID [<${hash(chunks)}> <${hash(chunks)}> >> >>\nstartxref\n${xrefPos}\n%%EOF\n`)

  return new Blob([concat(chunks)], { type: 'application/pdf' })
}

function round(value) {
  return Math.round(value * 100) / 100
}

function escapeText(text) {
  return String(text).replace(/[()\\]/g, '').slice(0, 120)
}

function pdfDate() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `D:${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function hash(chunks) {
  let h = 0x811c9dc5
  for (const chunk of chunks) {
    const n = Math.min(chunk.length, 512)
    for (let i = 0; i < n; i++) {
      h ^= chunk[i]
      h = Math.imul(h, 0x01000193)
    }
  }
  return (h >>> 0).toString(16).padStart(8, '0').repeat(4)
}
