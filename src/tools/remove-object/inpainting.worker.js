import { inpaint } from './inpainting'

self.onmessage = (event) => {
  const message = event.data
  if (!message || message.type !== 'run') return
  try {
    const pixels = inpaint({
      width: message.width,
      height: message.height,
      rgba: new Uint8ClampedArray(message.rgba),
      mask: new Uint8Array(message.mask),
      passes: message.passes,
      patchRadius: message.patchRadius,
      onProgress: (value, label) => self.postMessage({ type: 'progress', value, label }),
    })
    self.postMessage({ type: 'done', width: message.width, height: message.height, rgba: pixels.buffer }, [pixels.buffer])
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Could not remove the object.' })
  }
}
