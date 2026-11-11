import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { getSocialTrends } from './api/social-trends.js'
import generatePromptHandler from './api/generate-prompt.js'
import aiModelSettingsHandler from './api/ai-model-settings.js'
import adminAuthHandler from './api/admin-auth.js'
import socialAuthHandler from './api/social-auth.js'
import posterPhotoHandler from './api/poster-photo.js'
import youtubeStreamHandler from './api/youtube-stream.js'
import toolsConfigHandler from './api/tools-config.js'
import siteThemeHandler from './api/site-theme.js'
import sidebarSettingsHandler from './api/sidebar-settings.js'
import sendContactMailHandler from './api/contact.js'

type ApiHandler = (request: any, response: any, env: Record<string, string>) => Promise<unknown>

function localSocialTrendsApi() {
  let serverEnv: Record<string, string> = {}
  return {
    name: 'local-social-trends-api',
    config(_config: unknown, { mode }: { mode: string }) {
      serverEnv = loadEnv(mode, '.', '')
    },
    configureServer(server: ViteDevServer) {
      const jsonApi = (handler: ApiHandler) => async (request: any, response: any) => {
        let body = ''
        await new Promise<void>((resolve, reject) => {
          request.on('data', (chunk: { toString(): string } | undefined) => { body += chunk?.toString() ?? '' })
          request.on('end', () => resolve())
          request.on('error', (reason: unknown) => reject(reason))
        })
        try { request.body = body ? JSON.parse(body) : undefined }
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
        await handler(request, apiResponse, serverEnv)
      }
      server.middlewares.use('/api/tools-config', jsonApi(toolsConfigHandler))
      server.middlewares.use('/api/site-theme', jsonApi(siteThemeHandler))
      server.middlewares.use('/api/sidebar-settings', jsonApi(sidebarSettingsHandler))
      server.middlewares.use('/api/contact', jsonApi(sendContactMailHandler))
      server.middlewares.use('/api/social-auth', jsonApi(socialAuthHandler))
      server.middlewares.use('/api/poster-photo', posterPhotoHandler)
      server.middlewares.use('/api/youtube-stream', async (req, res) => {
        await youtubeStreamHandler(req, res)
      })
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
  build: {
    rollupOptions: {
      output: {
        // Framework code changes rarely; keeping it in its own chunk lets repeat
        // visits reuse it while the app chunk is replaced on deploy.
        manualChunks: { 'react-vendor': ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
})
