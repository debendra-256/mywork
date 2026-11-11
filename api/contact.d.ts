import type { IncomingMessage, ServerResponse } from 'node:http'

export default function sendContactMailHandler(
  req: IncomingMessage & { body?: any },
  res: ServerResponse & { status: (code: number) => any; json: (value: unknown) => any },
  env?: Record<string, string>
): Promise<unknown>
