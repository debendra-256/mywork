import { removeWatermark } from './engine'

self.onmessage = (event) => {
  const message = event.data
  if (!message || message.type !== 'run') return
  try {
    const pixels = removeWatermark({
      width: message.width,
      height: message.height,
      rgba: new Uint8ClampedArray(message.rgba),
      mask: new Uint8Array(message.mask),
      quality: message.quality || 'fast',
      strength: message.strength ?? 1,
      feather: message.feather ?? 3,
      passes: message.passes ?? 3,
      patchRadius: message.patchRadius ?? 8,
      onProgress: (value, label) => self.postMessage({ type: 'progress', value, label }),
    })
    self.postMessage({ type: 'done', width: message.width, height: message.height, rgba: pixels.buffer }, [pixels.buffer])
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Could not remove the watermark.' })
  }
}
