/**
 * Watermark removal engine.
 *
 * Only the painted area is rebuilt, and only inside a padded crop around it, so
 * a corner logo costs a fraction of a frame. Two fills are available:
 *   fast     — multi-scale diffusion (pull/push pyramid + Gauss-Seidel sweeps).
 *              Cheap enough to run on every frame of a clip.
 *   detailed — the exemplar-based PatchMatch completion from the object remover,
 *              which copies real texture instead of smoothing it away.
 * The fill is finally blended back with a distance-based feather so the seam
 * around the watermark disappears, and a strength knob leaves part of the
 * original pixels behind for semi-transparent marks.
 */

import { inpaint } from '../remove-object/inpainting'

const GROW_PX = 2
const MAX_MASK_RATIO = 0.85
const MIN_LEVEL_SIDE = 24
const MAX_LEVELS = 6

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value)

function maskBounds(mask, w, h) {
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y += 1) {
    const row = y * w
    for (let x = 0; x < w; x += 1) {
      if (!mask[row + x]) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY }
}

/** Grows the mask so the soft, anti-aliased rim of a watermark is covered too. */
function growMask(mask, w, h, steps) {
  let current = mask
  for (let step = 0; step < steps; step += 1) {
    const next = current.slice()
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const index = y * w + x
        if (!current[index]) continue
        if (x > 0) next[index - 1] = 1
        if (x < w - 1) next[index + 1] = 1
        if (y > 0) next[index - w] = 1
        if (y < h - 1) next[index + w] = 1
      }
    }
    current = next
  }
  return current
}

/**
 * Distance of every masked pixel to the nearest known pixel. A pixel that sits
 * on the edge of the mask is 0, so the feather ramp starts right where the fill
 * meets untouched image data.
 */
function inwardDistances(mask, w, h) {
  const size = w * h
  const distance = new Int32Array(size).fill(-1)
  const queue = new Int32Array(size)
  let head = 0
  let tail = 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const index = y * w + x
      if (!mask[index]) continue
      const border = x === 0 || y === 0 || x === w - 1 || y === h - 1
        || !mask[index - 1] || !mask[index + 1] || !mask[index - w] || !mask[index + w]
      if (!border) continue
      distance[index] = 0
      queue[tail] = index
      tail += 1
    }
  }
  while (head < tail) {
    const index = queue[head]
    head += 1
    const x = index % w
    const y = (index / w) | 0
    const next = distance[index] + 1
    if (x > 0 && mask[index - 1] && distance[index - 1] < 0) { distance[index - 1] = next; queue[tail] = index - 1; tail += 1 }
    if (x < w - 1 && mask[index + 1] && distance[index + 1] < 0) { distance[index + 1] = next; queue[tail] = index + 1; tail += 1 }
    if (y > 0 && mask[index - w] && distance[index - w] < 0) { distance[index - w] = next; queue[tail] = index - w; tail += 1 }
    if (y < h - 1 && mask[index + w] && distance[index + w] < 0) { distance[index + w] = next; queue[tail] = index + w; tail += 1 }
  }
  return distance
}

/* ------------------------------------------------------- diffusion (fast) */

function levelFromPixels(w, h, data, mask) {
  const size = w * h
  const rgb = new Float32Array(size * 3)
  const known = new Uint8Array(size)
  for (let index = 0; index < size; index += 1) {
    const source = index * 4
    rgb[index * 3] = data[source]
    rgb[index * 3 + 1] = data[source + 1]
    rgb[index * 3 + 2] = data[source + 2]
    known[index] = mask[index] ? 0 : 1
  }
  return { w, h, rgb, known }
}

/** Box average of the known pixels only, so holes never bleed dark into the mip. */
function pullLevel(parent) {
  const { w, h, rgb, known } = parent
  const nw = Math.max(1, (w + 1) >> 1)
  const nh = Math.max(1, (h + 1) >> 1)
  const out = { w: nw, h: nh, rgb: new Float32Array(nw * nh * 3), known: new Uint8Array(nw * nh) }
  for (let y = 0; y < nh; y += 1) {
    for (let x = 0; x < nw; x += 1) {
      let red = 0, green = 0, blue = 0, count = 0
      for (let dy = 0; dy < 2; dy += 1) {
        const yy = y * 2 + dy
        if (yy >= h) continue
        for (let dx = 0; dx < 2; dx += 1) {
          const xx = x * 2 + dx
          if (xx >= w) continue
          const index = yy * w + xx
          if (!known[index]) continue
          count += 1
          red += rgb[index * 3]
          green += rgb[index * 3 + 1]
          blue += rgb[index * 3 + 2]
        }
      }
      const target = y * nw + x
      if (!count) continue
      out.known[target] = 1
      out.rgb[target * 3] = red / count
      out.rgb[target * 3 + 1] = green / count
      out.rgb[target * 3 + 2] = blue / count
    }
  }
  return out
}

/**
 * Grow the fill one pixel from already-known cells each sweep. Neighbour tests
 * use the support mask from the start of the sweep so a hole cannot copy its
 * own still-watermarked colour in the same pass.
 */
function smoothHoles(level, sweeps) {
  const { w, h, rgb, known } = level
  const support = known.slice()
  for (let sweep = 0; sweep < sweeps; sweep += 1) {
    const ready = support.slice()
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const index = y * w + x
        if (support[index]) continue
        let red = 0, green = 0, blue = 0, count = 0
        if (x > 0 && ready[index - 1]) { count += 1; red += rgb[(index - 1) * 3]; green += rgb[(index - 1) * 3 + 1]; blue += rgb[(index - 1) * 3 + 2] }
        if (x < w - 1 && ready[index + 1]) { count += 1; red += rgb[(index + 1) * 3]; green += rgb[(index + 1) * 3 + 1]; blue += rgb[(index + 1) * 3 + 2] }
        if (y > 0 && ready[index - w]) { count += 1; red += rgb[(index - w) * 3]; green += rgb[(index - w) * 3 + 1]; blue += rgb[(index - w) * 3 + 2] }
        if (y < h - 1 && ready[index + w]) { count += 1; red += rgb[(index + w) * 3]; green += rgb[(index + w) * 3 + 1]; blue += rgb[(index + w) * 3 + 2] }
        if (!count) continue
        rgb[index * 3] = red / count
        rgb[index * 3 + 1] = green / count
        rgb[index * 3 + 2] = blue / count
        support[index] = 1
      }
    }
  }
}

/** Copy the coarse field back into the holes, bilinearly, then walk down. */
function pushLevel(target, source) {
  const { w, h, rgb, known } = target
  const { w: sw, h: sh, rgb: sourceRgb, known: sourceKnown } = source
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const index = y * w + x
      if (known[index]) continue
      const fx = sw === 1 ? 0 : clamp(((x + 0.5) * sw) / w - 0.5, 0, sw - 1)
      const fy = sh === 1 ? 0 : clamp(((y + 0.5) * sh) / h - 0.5, 0, sh - 1)
      const x0 = Math.min(sw - 1, Math.floor(fx))
      const y0 = Math.min(sh - 1, Math.floor(fy))
      const x1 = Math.min(sw - 1, x0 + 1)
      const y1 = Math.min(sh - 1, y0 + 1)
      const tx = fx - x0
      const ty = fy - y0
      for (let channel = 0; channel < 3; channel += 1) {
        const top = sourceRgb[(y0 * sw + x0) * 3 + channel] * (1 - tx) + sourceRgb[(y0 * sw + x1) * 3 + channel] * tx
        const bottom = sourceRgb[(y1 * sw + x0) * 3 + channel] * (1 - tx) + sourceRgb[(y1 * sw + x1) * 3 + channel] * tx
        rgb[index * 3 + channel] = top * (1 - ty) + bottom * ty
      }
    }
  }
}

/** In-place Gauss-Seidel passes over the holes; alternating direction converges faster. */
function refineHoles(w, h, rgb, mask, sweeps) {
  const order = []
  for (let index = 0; index < w * h; index += 1) if (mask[index]) order.push(index)
  if (!order.length) return
  for (let sweep = 0; sweep < sweeps; sweep += 1) {
    const forward = sweep % 2 === 0
    for (let step = 0; step < order.length; step += 1) {
      const index = order[forward ? step : order.length - 1 - step]
      const x = index % w
      const y = (index / w) | 0
      let red = 0, green = 0, blue = 0, count = 0
      if (x > 0) { count += 1; red += rgb[(index - 1) * 3]; green += rgb[(index - 1) * 3 + 1]; blue += rgb[(index - 1) * 3 + 2] }
      if (x < w - 1) { count += 1; red += rgb[(index + 1) * 3]; green += rgb[(index + 1) * 3 + 1]; blue += rgb[(index + 1) * 3 + 2] }
      if (y > 0) { count += 1; red += rgb[(index - w) * 3]; green += rgb[(index - w) * 3 + 1]; blue += rgb[(index - w) * 3 + 2] }
      if (y < h - 1) { count += 1; red += rgb[(index + w) * 3]; green += rgb[(index + w) * 3 + 1]; blue += rgb[(index + w) * 3 + 2] }
      if (!count) continue
      rgb[index * 3] = red / count
      rgb[index * 3 + 1] = green / count
      rgb[index * 3 + 2] = blue / count
    }
  }
}

function diffusionFill(w, h, data, mask) {
  let level = levelFromPixels(w, h, data, mask)
  const pyramid = [level]
  while (pyramid.length < MAX_LEVELS && Math.min(level.w, level.h) > MIN_LEVEL_SIDE * 2) {
    level = pullLevel(level)
    pyramid.push(level)
  }
  smoothHoles(pyramid[pyramid.length - 1], 48)
  for (let index = pyramid.length - 2; index >= 0; index -= 1) {
    pushLevel(pyramid[index], pyramid[index + 1])
    if (index > 0) smoothHoles(pyramid[index], 3)
  }
  let holes = 0
  for (let pixel = 0; pixel < mask.length; pixel += 1) if (mask[pixel]) holes += 1
  refineHoles(w, h, pyramid[0].rgb, mask, holes > 60000 ? 24 : clamp(Math.round((w + h) * 0.5), 16, 120))
  const base = pyramid[0]
  for (let index = 0; index < w * h; index += 1) {
    if (!mask[index]) continue
    const target = index * 4
    data[target] = base.rgb[index * 3]
    data[target + 1] = base.rgb[index * 3 + 1]
    data[target + 2] = base.rgb[index * 3 + 2]
  }
}

/* ------------------------------------------------------------- entry point */

/**
 * Removes whatever was painted over.
 * @returns {Uint8ClampedArray} full-size RGBA with the masked area rebuilt.
 */
export function removeWatermark({
  width,
  height,
  rgba,
  mask,
  quality = 'fast',
  strength = 1,
  feather = 3,
  passes = 3,
  patchRadius = 8,
  onProgress = () => {},
}) {
  const w = Math.floor(width)
  const h = Math.floor(height)
  strength = clamp(Number(strength) || 0, 0, 1)
  feather = Math.max(0, Math.round(Number(feather) || 0))
  if (!(w > 0 && h > 0)) throw new Error('This frame has no pixels.')
  if (rgba.length !== w * h * 4) throw new Error('The frame data is invalid.')
  if (mask.length !== w * h) throw new Error('The selection does not match this frame.')

  onProgress(0.05, 'Reading the selection')
  const painted = maskBounds(mask, w, h)
  if (!painted) {
    onProgress(1, 'Nothing selected')
    return rgba.slice()
  }
  const grown = growMask(mask, w, h, GROW_PX)
  const bounds = maskBounds(grown, w, h)
  let masked = 0
  for (let index = 0; index < grown.length; index += 1) if (grown[index]) masked += 1
  if (masked > grown.length * MAX_MASK_RATIO) {
    throw new Error('The selection is too large. Paint only over the watermark itself.')
  }

  // A tight crop keeps the work proportional to the watermark, but the fill needs
  // real image around it: widen the pad until enough context survives.
  const minContext = quality === 'detailed' ? Math.max(48, patchRadius * 6) : 24
  let pad = minContext
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const area = (Math.min(w, bounds.maxX + pad + 1) - Math.max(0, bounds.minX - pad))
      * (Math.min(h, bounds.maxY + pad + 1) - Math.max(0, bounds.minY - pad))
    if (area <= 0 || masked / area < 0.45 || (pad >= 256 && area >= w * h)) break
    pad *= 2
  }

  const minX = Math.max(0, bounds.minX - pad)
  const minY = Math.max(0, bounds.minY - pad)
  const maxX = Math.min(w - 1, bounds.maxX + pad)
  const maxY = Math.min(h - 1, bounds.maxY + pad)
  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  const cropData = new Uint8ClampedArray(cw * ch * 4)
  const cropMask = new Uint8Array(cw * ch)
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const from = ((minY + y) * w + minX + x)
      const to = y * cw + x
      cropData[to * 4] = rgba[from * 4]
      cropData[to * 4 + 1] = rgba[from * 4 + 1]
      cropData[to * 4 + 2] = rgba[from * 4 + 2]
      cropData[to * 4 + 3] = rgba[from * 4 + 3]
      cropMask[to] = grown[from]
    }
  }

  onProgress(0.2, quality === 'detailed' ? 'Matching textures' : 'Rebuilding the area')
  let filled
  if (quality === 'detailed' && cw > patchRadius * 2 + 3 && ch > patchRadius * 2 + 3) {
    try {
      filled = inpaint({
        width: cw,
        height: ch,
        rgba: cropData,
        mask: cropMask,
        passes,
        patchRadius,
        onProgress: (value) => onProgress(0.2 + value * 0.6, 'Matching textures'),
      })
    } catch {
      // A selection that leaves no usable source patch falls back to diffusion.
      diffusionFill(cw, ch, cropData, cropMask)
      filled = cropData
    }
  } else {
    diffusionFill(cw, ch, cropData, cropMask)
    filled = cropData
  }

  onProgress(0.85, 'Blending the edges')
  const distance = inwardDistances(cropMask, cw, ch)
  const out = rgba.slice()
  const ramp = feather > 0 ? feather + 1 : 1
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const local = y * cw + x
      if (!cropMask[local]) continue
      const alpha = strength * (feather > 0 ? Math.min(1, (distance[local] + 1) / ramp) : 1)
      if (alpha <= 0) continue
      const target = (((minY + y) * w) + minX + x) * 4
      out[target] = out[target] + (filled[local * 4] - out[target]) * alpha
      out[target + 1] = out[target + 1] + (filled[local * 4 + 1] - out[target + 1]) * alpha
      out[target + 2] = out[target + 2] + (filled[local * 4 + 2] - out[target + 2]) * alpha
      out[target + 3] = filled[local * 4 + 3]
    }
  }
  onProgress(1, 'Done')
  return out
}

/** Counts painted pixels so the UI can refuse an empty selection early. */
export function countPainted(mask) {
  let painted = 0
  for (let index = 0; index < mask.length; index += 1) if (mask[index]) painted += 1
  return painted
}

export const ENGINE_DEFAULTS = { quality: 'fast', strength: 1, feather: 3, passes: 3, patchRadius: 8 }
