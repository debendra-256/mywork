/**
 * Exemplar-based object removal: a multi-scale PatchMatch completion. Masked
 * pixels are rebuilt from real, unmasked patches found elsewhere in the photo,
 * working from the mask edge inwards so textures and edges are copied rather
 * than smeared. Everything runs locally on the caller's pixels.
 */

const DEFAULT_PATCH_RADIUS = 8
const DEFAULT_PASSES = 3
const MAX_LEVELS = 5
const MIN_LEVEL_SIDE = 96
const MASK_GROW_PX = 2

function clampIndex(value, min, max) {
  return value < min ? min : value > max ? max : value
}

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

/** Grows the mask a little so anti-aliased object edges are covered too. */
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

function downsample(level) {
  const { w, h, data, mask } = level
  const nw = Math.max(1, w >> 1)
  const nh = Math.max(1, h >> 1)
  const out = new Uint8ClampedArray(nw * nh * 4)
  const outMask = new Uint8Array(nw * nh)
  for (let y = 0; y < nh; y += 1) {
    const sy = y * 2
    for (let x = 0; x < nw; x += 1) {
      const sx = x * 2
      let red = 0
      let green = 0
      let blue = 0
      let alpha = 0
      let count = 0
      let masked = 0
      for (let dy = 0; dy < 2; dy += 1) {
        const yy = sy + dy
        if (yy >= h) continue
        for (let dx = 0; dx < 2; dx += 1) {
          const xx = sx + dx
          if (xx >= w) continue
          const source = (yy * w + xx) * 4
          red += data[source]
          green += data[source + 1]
          blue += data[source + 2]
          alpha += data[source + 3]
          count += 1
          if (mask[yy * w + xx]) masked = 1
        }
      }
      const target = (y * nw + x) * 4
      out[target] = red / count
      out[target + 1] = green / count
      out[target + 2] = blue / count
      out[target + 3] = alpha / count
      outMask[y * nw + x] = masked
    }
  }
  return { w: nw, h: nh, data: out, mask: outMask }
}

/** Copies the coarse result into masked pixels only, keeping known pixels exact. */
function upscaleInto(target, source) {
  const { w, h, data, mask } = target
  const { w: sw, h: sh, data: sourceData } = source
  for (let y = 0; y < h; y += 1) {
    const sy = Math.min(sh - 1, Math.floor((y * sh) / h))
    for (let x = 0; x < w; x += 1) {
      const index = y * w + x
      if (!mask[index]) continue
      const sx = Math.min(sw - 1, Math.floor((x * sw) / w))
      const from = (sy * sw + sx) * 4
      const to = index * 4
      data[to] = sourceData[from]
      data[to + 1] = sourceData[from + 1]
      data[to + 2] = sourceData[from + 2]
    }
  }
}

function buildIntegral(mask, w, h) {
  const stride = w + 1
  const integral = new Uint32Array(stride * (h + 1))
  for (let y = 0; y < h; y += 1) {
    let rowSum = 0
    for (let x = 0; x < w; x += 1) {
      rowSum += mask[y * w + x]
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + rowSum
    }
  }
  return integral
}

function patchRun(integral, stride, x, y, radius) {
  const top = y - radius
  const bottom = y + radius + 1
  const left = x - radius
  const right = x + radius + 1
  return integral[bottom * stride + right] - integral[top * stride + right] - integral[bottom * stride + left] + integral[top * stride + left]
}

/** BFS distance of every masked pixel to the nearest original pixel. */
function edgeDistances(mask, w, h) {
  const size = w * h
  const distance = new Int32Array(size).fill(-1)
  const queue = new Int32Array(size)
  let head = 0
  let tail = 0
  for (let index = 0; index < size; index += 1) {
    if (mask[index]) continue
    distance[index] = 0
    queue[tail] = index
    tail += 1
  }
  while (head < tail) {
    const index = queue[head]
    head += 1
    const x = index % w
    const y = (index / w) | 0
    const next = distance[index] + 1
    if (x > 0 && distance[index - 1] < 0) { distance[index - 1] = next; queue[tail] = index - 1; tail += 1 }
    if (x < w - 1 && distance[index + 1] < 0) { distance[index + 1] = next; queue[tail] = index + 1; tail += 1 }
    if (y > 0 && distance[index - w] < 0) { distance[index - w] = next; queue[tail] = index - w; tail += 1 }
    if (y < h - 1 && distance[index + w] < 0) { distance[index + w] = next; queue[tail] = index + w; tail += 1 }
  }
  return distance
}

function solveLevel({ w, h, data, mask }, passes, patchRadius, report) {
  const size = w * h
  const radius = patchRadius
  const integral = buildIntegral(mask, w, h)
  const valid = new Uint8Array(size)
  const sources = []
  for (let y = radius; y < h - radius; y += 1) {
    for (let x = radius; x < w - radius; x += 1) {
      if (patchRun(integral, w + 1, x, y, radius) !== 0) continue
      const index = y * w + x
      valid[index] = 1
      sources.push(index)
    }
  }
  if (!sources.length) return false

  const targets = []
  for (let index = 0; index < size; index += 1) if (mask[index]) targets.push(index)
  if (!targets.length) return true

  const edge = edgeDistances(mask, w, h)
  targets.sort((a, b) => edge[a] - edge[b] || a - b)

  const filled = new Uint8Array(size)
  const sourceX = new Int32Array(size).fill(-1)
  const sourceY = new Int32Array(size).fill(-1)
  const sourceScore = new Float32Array(size).fill(1e9)
  const randomSource = () => sources[(Math.random() * sources.length) | 0]

  const distance = (tx, ty, sx, sy) => {
    let sum = 0
    let count = 0
    const startX = -Math.min(radius, tx)
    const endX = Math.min(radius, w - 1 - tx)
    const startY = -Math.min(radius, ty)
    const endY = Math.min(radius, h - 1 - ty)
    for (let dy = startY; dy <= endY; dy += 1) {
      let target = ((ty + dy) * w + tx + startX) * 4
      let source = ((sy + dy) * w + sx + startX) * 4
      let maskIndex = (ty + dy) * w + tx + startX
      for (let dx = startX; dx <= endX; dx += 1) {
        const centre = dx === 0 && dy === 0
        if (!centre && (!mask[maskIndex] || filled[maskIndex])) {
          const red = data[target] - data[source]
          const green = data[target + 1] - data[source + 1]
          const blue = data[target + 2] - data[source + 2]
          sum += red * red + green * green + blue * blue
          count += 1
        }
        target += 4
        source += 4
        maskIndex += 1
      }
    }
    return count ? sum / count : 1e9
  }

  const consider = (index, candidateX, candidateY) => {
    const candidateDist = distance(index % w, (index / w) | 0, candidateX, candidateY)
    if (candidateDist >= sourceScore[index]) return
    sourceScore[index] = candidateDist
    sourceX[index] = candidateX
    sourceY[index] = candidateY
  }

  for (let pass = 0; pass < passes; pass += 1) {
    if (pass > 0) filled.fill(1)

    for (const index of targets) {
      const x = index % w
      const y = (index / w) | 0

      if (sourceX[index] < 0) {
        const seed = randomSource()
        sourceX[index] = seed % w
        sourceY[index] = (seed / w) | 0
        sourceScore[index] = distance(x, y, sourceX[index], sourceY[index])
      } else {
        sourceScore[index] = distance(x, y, sourceX[index], sourceY[index])
      }

      const neighbours = [index - 1, index + 1, index - w, index + w]
      for (const neighbour of neighbours) {
        if (neighbour < 0 || neighbour >= size) continue
        if ((neighbour === index - 1 || neighbour === index + 1) && ((neighbour / w) | 0) !== y) continue
        if (sourceX[neighbour] < 0) continue
        const candidateX = sourceX[neighbour] + (x - (neighbour % w))
        const candidateY = sourceY[neighbour] + (y - ((neighbour / w) | 0))
        if (candidateX < radius || candidateX >= w - radius || candidateY < radius || candidateY >= h - radius) continue
        if (!valid[candidateY * w + candidateX]) continue
        consider(index, candidateX, candidateY)
      }

      let searchRadius = Math.max(w, h) >> 1
      for (let attempt = 0; attempt < 6 && searchRadius >= 1; attempt += 1) {
        const candidateX = clampIndex(sourceX[index] + Math.round((Math.random() * 2 - 1) * searchRadius), radius, w - 1 - radius)
        const candidateY = clampIndex(sourceY[index] + Math.round((Math.random() * 2 - 1) * searchRadius), radius, h - 1 - radius)
        if (valid[candidateY * w + candidateX]) consider(index, candidateX, candidateY)
        searchRadius >>= 1
      }

      const source = (sourceY[index] * w + sourceX[index]) * 4
      const target = index * 4
      data[target] = data[source]
      data[target + 1] = data[source + 1]
      data[target + 2] = data[source + 2]
      data[target + 3] = 255
      filled[index] = 1
    }

    report(pass + 1)
  }

  return true
}

export function inpaint({ width, height, rgba, mask, passes = DEFAULT_PASSES, patchRadius = DEFAULT_PATCH_RADIUS, onProgress = () => {} }) {
  const w = Math.floor(width)
  const h = Math.floor(height)
  if (!(w > 0 && h > 0)) throw new Error('The image has no pixels.')
  if (!(rgba instanceof Uint8ClampedArray) || rgba.length !== w * h * 4) throw new Error('The image data is invalid.')
  if (!(mask instanceof Uint8Array) || mask.length !== w * h) throw new Error('The mask data is invalid.')

  const pixelMask = growMask(mask, w, h, MASK_GROW_PX)
  if (!maskBounds(pixelMask, w, h)) {
    onProgress(1, 'Nothing to remove')
    return rgba.slice()
  }

  let known = 0
  for (let index = 0; index < pixelMask.length; index += 1) if (!pixelMask[index]) known += 1
  if (known < 64) throw new Error('The painted area covers the whole photo. Leave some background visible.')
  if (w < 2 * patchRadius + 3 || h < 2 * patchRadius + 3) throw new Error('This photo is too small to retouch.')

  const base = { w, h, data: rgba.slice(), mask: pixelMask }
  const levels = [base]
  while (levels.length < MAX_LEVELS) {
    const previous = levels[levels.length - 1]
    if (Math.min(previous.w, previous.h) < MIN_LEVEL_SIDE * 2) break
    const next = downsample(previous)
    if (Math.min(next.w, next.h) < MIN_LEVEL_SIDE) break
    levels.push(next)
  }

  const plans = levels.map((_, index) => index === levels.length - 1 ? 2 : passes)
  const total = plans.reduce((sum, value) => sum + value, 0)
  let completed = 0

  let result = levels[levels.length - 1]
  for (let index = levels.length - 1; index >= 0; index -= 1) {
    const level = levels[index]
    if (index !== levels.length - 1) upscaleInto(level, result)
    onProgress(completed / total, index === 0 ? 'Refining details' : 'Matching textures')
    const update = () => {
      completed += 1
      onProgress(Math.min(1, completed / total), index === 0 ? 'Refining details' : 'Matching textures')
    }
    if (!solveLevel(level, plans[index], patchRadius, update) && patchRadius > 3) {
      solveLevel(level, plans[index], 3, update)
    }
    result = level
  }

  onProgress(1, 'Done')
  return result.data
}

export const INPAINT_DEFAULTS = { passes: DEFAULT_PASSES, patchRadius: DEFAULT_PATCH_RADIUS }
