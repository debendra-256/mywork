const maxImageBytes = 3 * 1024 * 1024
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
import { getActiveAiModel } from './ai-model-settings.js'
import { buildChatRequest, providerFailure, readChatCompletion } from './provider-request.js'
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

  const selected = await getActiveAiModel(env)
  if (!selected.apiKey) throw new Error(`Add an API key for the active model in Admin → AI models.`)
  const photoSystemPrompt = 'You are a reverse-prompt engine. Write ONE dense image-generation prompt that would recreate the supplied photo as closely as possible. Cover, in this order: subject and apparent age range; face shape, eyes, brows, nose, lips, expression; skin tone and texture; hair colour, texture and style; wardrobe including fabric, cut, colours and pattern; pose, body angle and hand placement; framing and composition; camera height, angle, lens, aperture, focus and depth of field; lighting direction, quality, colour temperature, shadow and highlight shape; the exact colour palette and the tone or film grade; background, setting, props and depth; mood, era and photographic style; aspect ratio and grain. Match the reference faithfully instead of improving it. Never name or identify a real person, never invent details that are not visible, and never add text, headings, bullet points or explanations. Return only the prompt.'
  const ideaSystemPrompt = 'Write one detailed, ready-to-use image-generation prompt for the idea supplied, covering subject, composition, pose, clothing, setting, lighting, colour palette, camera perspective and visual style. Avoid identifying real people or adding text, headings, explanations, or claims about facts. Return only the prompt.'
  const systemPrompt = image ? photoSystemPrompt : ideaSystemPrompt
  const userText = image ? 'Recreate this exact photo as an image-generation prompt. Match the face, skin tone, hair, wardrobe, pose, lighting, colour tone and background precisely.' : `Create an image-generation prompt for this idea: ${cleanedInstruction}`
  const { endpoint, headers, body } = buildChatRequest(selected, { systemText: systemPrompt, userText, image })
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(providerFailure(result, response.status, selected.name))
  const prompt = readChatCompletion(selected, result)
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
