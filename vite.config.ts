import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { getSocialTrends } from './api/social-trends.js'
import { handleStoreRequest } from './api/store.js'
import generatePromptHandler from './api/generate-prompt.js'
import aiModelSettingsHandler from './api/ai-model-settings.js'
import adminAuthHandler from './api/admin-auth.js'

function localSocialTrendsApi() {
  let serverEnv: Record<string, string> = {}
  return {
    name: 'local-social-trends-api',
    config(_config: unknown, { mode }: { mode: string }) {
      serverEnv = loadEnv(mode, '.', '')
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/admin-auth', async (request, response) => {
        let body = ''
        await new Promise<void>((resolve, reject) => {
          const incoming = request as unknown as { on(event: string, listener: (value?: { toString(): string }) => void): void }
          incoming.on('data', (chunk) => { body += chunk?.toString() ?? '' })
          incoming.on('end', () => resolve())
          incoming.on('error', (reason) => reject(reason))
        })
        try { (request as typeof request & { body?: unknown }).body = body ? JSON.parse(body) : undefined }
        catch {
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: 'Invalid JSON request body.' }))
          return
        }
        const apiResponse = Object.assign(response, {
          status(code: number) { response.statusCode = code; return this },
          json(value: unknown) { response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(JSON.stringify(value)); return this },
        })
        await adminAuthHandler(request, apiResponse, serverEnv)
      })
      server.middlewares.use('/api/ai-model-settings', async (request, response) => {
        let body = ''
        await new Promise<void>((resolve, reject) => {
          const incoming = request as unknown as { on(event: string, listener: (value?: { toString(): string }) => void): void }
          incoming.on('data', (chunk) => { body += chunk?.toString() ?? '' })
          incoming.on('end', () => resolve())
          incoming.on('error', (reason) => reject(reason))
        })
        try { (request as typeof request & { body?: unknown }).body = body ? JSON.parse(body) : undefined }
        catch {
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: 'Invalid JSON request body.' }))
          return
        }
        const apiResponse = Object.assign(response, {
          status(code: number) { response.statusCode = code; return this },
          json(value: unknown) { response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(JSON.stringify(value)); return this },
        })
        await aiModelSettingsHandler(request, apiResponse, serverEnv)
      })
      server.middlewares.use('/api/generate-prompt', async (request, response) => {
        let body = ''
        await new Promise<void>((resolve, reject) => {
          const incoming = request as unknown as { on(event: string, listener: (value?: { toString(): string }) => void): void }
          incoming.on('data', (chunk) => { body += chunk?.toString() ?? '' })
          incoming.on('end', () => resolve())
          incoming.on('error', (reason) => reject(reason))
        })
        try { (request as typeof request & { body?: unknown }).body = body ? JSON.parse(body) : undefined }
        catch {
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: 'Invalid JSON request body.' }))
          return
        }
        const apiResponse = Object.assign(response, {
          status(code: number) { response.statusCode = code; return this },
          json(value: unknown) { response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(JSON.stringify(value)); return this },
        })
        await generatePromptHandler(request, apiResponse, serverEnv)
      })
      server.middlewares.use('/api/store/products', async (request, response) => {
        let body = ''
        await new Promise<void>((resolve, reject) => {
          const incoming = request as unknown as { on(event: string, listener: (value?: { toString(): string }) => void): void }
          incoming.on('data', (chunk) => { body += chunk?.toString() ?? '' })
          incoming.on('end', () => resolve())
          incoming.on('error', (reason) => reject(reason))
        })
        try { (request as typeof request & { body?: unknown }).body = body ? JSON.parse(body) : undefined }
        catch {
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: 'Invalid JSON request body.' }))
          return
        }
        const apiResponse = Object.assign(response, {
          status(code: number) { response.statusCode = code; return this },
          json(value: unknown) { response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(JSON.stringify(value)); return this },
        })
        await handleStoreRequest(request, apiResponse, serverEnv, 'products')
      })
      server.middlewares.use('/api/social-trends', async (request, response) => {
        if ((request as unknown as { method?: string }).method !== 'GET') {
          response.statusCode = 405
          response.setHeader('Allow', 'GET')
          response.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }
        try {
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(JSON.stringify(await getSocialTrends(serverEnv)))
        } catch {
          response.statusCode = 500
          response.end(JSON.stringify({ error: 'Could not load social trends.' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localSocialTrendsApi()],
  server: { port: 5174, strictPort: true },
})
