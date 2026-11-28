export interface EncryptionInfo {
  encrypted: boolean
  algorithm?: 'AES-256' | 'RC4' | string
  version?: number
  revision?: number
  keyLength?: number
}

export type DecryptStatus =
  | 'idle'
  | 'inspecting'
  | 'needs_password'
  | 'ready_to_unlock'
  | 'decrypting'
  | 'unlocked'
  | 'already_unlocked'
  | 'error'

export interface PdfFileState {
  file: File
  name: string
  size: number
  formattedSize: string
  status: DecryptStatus
  error?: string
  encryptionInfo?: EncryptionInfo
  requiresPassword?: boolean
  unlockedBlob?: Blob
  unlockedUrl?: string
  pageCount?: number
  unlockedSize?: number
}
