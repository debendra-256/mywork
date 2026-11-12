import type { IncomingMessage, ServerResponse } from 'node:http'

export default function handler(
  request: IncomingMessage & { body?: any },
  response: ServerResponse & {
    status(code: number): ServerResponse & { json(data: any): void }
    json(data: any): void
  },
  env?: Record<string, string>
): Promise<void>
