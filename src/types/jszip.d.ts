declare module 'jszip' {
  interface JSZipGenerateOptions {
    type: 'blob' | 'base64' | 'uint8array' | 'arraybuffer' | 'nodebuffer' | 'binarystring'
    compression?: 'STORE' | 'DEFLATE'
    compressionOptions?: { level: number }
  }

  interface JSZipMetadata {
    percent: number
    currentFile: string | null
  }

  class JSZip {
    folder(name: string): JSZip
    file(name: string, data: Blob | string | ArrayBuffer | Uint8Array): this
    generateAsync(
      options: JSZipGenerateOptions,
      onUpdate?: (metadata: JSZipMetadata) => void
    ): Promise<Blob>
  }

  export default JSZip
}
