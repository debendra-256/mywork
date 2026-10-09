const maxImageBytes = 3 * 1024 * 1024
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
import { getActiveAiModel } from './ai-model-settings.js'
const requestsByIp = new Map()
const requestLimit = 20
const requestWindowMs = 60 * 60 * 1000

function sendError(response, status, message) {
  return response.status(status).json({ error: message })
}

function isRateLimited(request) {
  const forwardedFor = request.headers['x-forwarded-for']
  const ip = String(Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || request.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  const now = Date.now()
  const recent = (requestsByIp.get(ip) ?? []).filter((timestamp) => now - timestamp < requestWindowMs)
  if (recent.length >= requestLimit) { requestsByIp.set(ip, recent); return true }
  recent.push(now)
  requestsByIp.set(ip, recent)
  if (requestsByIp.size > 5000) {
    for (const [key, timestamps] of requestsByIp) if (!timestamps.some((timestamp) => now - timestamp < requestWindowMs)) requestsByIp.delete(key)
  }
  return false
}

export async function generatePrompt({ image = '', instruction = '' }, env = process.env) {
  if (image) {
    const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
    if (!match || !allowedImageTypes.has(match[1])) throw new Error('Choose a JPG, PNG, or WebP photo.')
    const imageBytes = Math.floor(match[2].length * 3 / 4)
    if (imageBytes > maxImageBytes) throw new Error('Choose an image smaller than 3 MB.')
  }
  const cleanedInstruction = instruction.trim().slice(0, 1200)
  if (!image && !cleanedInstruction) throw new Error('Describe the image you want or attach a photo.')
  const userContent = [{ type: 'text', text: `${cleanedInstruction ? `Create an image-generation prompt for this idea: ${cleanedInstruction}` : 'Create an image-generation prompt inspired by this photo.'}` }]
  if (image) userContent.push({ type: 'image_url', image_url: { url: image, detail: 'high' } })

  const selected = await getActiveAiModel(env)
  if (!selected.apiKey) throw new Error(`Add an API key for the active model in Admin → AI models.`)
  const systemPrompt = 'Write one detailed, ready-to-use image-generation prompt. When a photo is included, describe visible subject, composition, pose, clothing, setting, lighting, color palette, camera perspective, and visual style. Avoid identifying people or adding text, headings, explanations, or claims about facts not visible in the photo. Return only the prompt.'
  const userText = cleanedInstruction ? `Create an image-generation prompt for this idea: ${cleanedInstruction}` : 'Create an image-generation prompt inspired by this photo.'
  let endpoint
  let headers
  let body
  if (selected.provider === 'google') {
    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selected.model)}:generateContent`
    headers = { 'x-goog-api-key': selected.apiKey, 'Content-Type': 'application/json' }
    const parts = [{ text: userText }]
    if (image) {
      const [, mimeType, data] = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
      parts.push({ inlineData: { mimeType, data } })
    }
    body = { systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.6, maxOutputTokens: 700 } }
  } else if (selected.provider === 'anthropic') {
    endpoint = 'https://api.anthropic.com/v1/messages'
    headers = { 'x-api-key': selected.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
    const content = [{ type: 'text', text: userText }]
    if (image) {
      const [, media_type, data] = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
      content.push({ type: 'image', source: { type: 'base64', media_type, data } })
    }
    body = { model: selected.model, max_tokens: 700, temperature: 0.6, system: systemPrompt, messages: [{ role: 'user', content }] }
  } else {
    endpoint = 'https://api.openai.com/v1/chat/completions'
    headers = { Authorization: `Bearer ${selected.apiKey}`, 'Content-Type': 'application/json' }
    body = { model: selected.model, temperature: 0.6, max_tokens: 700, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }] }
  }
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error?.message || result.error?.status || result.message || `${selected.name} could not generate a prompt (${response.status}).`)
  const prompt = selected.provider === 'google'
    ? result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
    : selected.provider === 'anthropic'
      ? result.content?.filter((part) => part.type === 'text').map((part) => part.text).join('').trim()
      : result.choices?.[0]?.message?.content?.trim()
  if (!prompt) throw new Error(`${selected.name} returned an empty prompt. Try again.`)
  return prompt
}

export default async function handler(request, response, env = process.env) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return sendError(response, 405, 'Method not allowed.')
  }
  try {
    if (isRateLimited(request)) return sendError(response, 429, 'You have reached the generation limit. Please try again later.')
    const image = typeof request.body?.image === 'string' ? request.body.image : ''
    const instruction = typeof request.body?.instruction === 'string' ? request.body.instruction : ''
    if (!image && !instruction.trim()) return sendError(response, 400, 'Describe the image you want or attach a photo.')
    const prompt = await generatePrompt({ image, instruction }, env)
    return response.status(200).json({ prompt })
  } catch (error) {
    return sendError(response, 500, error instanceof Error ? error.message : 'Could not generate a prompt.')
  }
}
