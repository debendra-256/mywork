const imageDataPattern = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/

/** Admin-entered gateway root, e.g. https://api.zyloai.net/v1 — normalised so chat completions can be appended safely. */
export function normalizeBaseUrl(value) {
  const text = String(value ?? '').trim()
  if (!text) throw new Error('Enter the custom model API base URL, for example https://api.zyloai.net/v1.')
  let url
  try { url = new URL(text) } catch { throw new Error('The custom model API base URL is not a valid URL, for example https://api.zyloai.net/v1.') }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw new Error('The custom model API base URL must start with https://.')
  if (url.username || url.password) throw new Error('Keep the custom model API key in the API key field, out of its base URL.')
  url.hash = ''
  url.search = ''
  url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/(?:chat\/completions|completions)$/i, '')
  return url.toString().replace(/\/+$/, '')
}

/** Builds the provider-specific chat request for a configured model. Custom endpoints are OpenAI-compatible. */
export function buildChatRequest(selected, { systemText, userText, image = '', maxTokens = 700 }) {
  const inline = image ? image.match(imageDataPattern) : null
  if (selected.provider === 'google') {
    const parts = [{ text: userText }]
    if (inline) parts.push({ inlineData: { mimeType: inline[1], data: inline[2] } })
    return {
      endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selected.model)}:generateContent`,
      headers: { 'x-goog-api-key': selected.apiKey, 'Content-Type': 'application/json' },
      body: { systemInstruction: { parts: [{ text: systemText }] }, contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.6, maxOutputTokens: maxTokens } },
    }
  }
  if (selected.provider === 'anthropic') {
    const content = [{ type: 'text', text: userText }]
    if (inline) content.push({ type: 'image', source: { type: 'base64', media_type: inline[1], data: inline[2] } })
    return {
      endpoint: 'https://api.anthropic.com/v1/messages',
      headers: { 'x-api-key': selected.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: { model: selected.model, max_tokens: maxTokens, temperature: 0.6, system: systemText, messages: [{ role: 'user', content }] },
    }
  }
  const base = selected.provider === 'custom' ? normalizeBaseUrl(selected.baseUrl) : 'https://api.openai.com/v1'
  const userContent = [{ type: 'text', text: userText }]
  if (image) userContent.push({ type: 'image_url', image_url: { url: image, detail: 'high' } })
  return {
    endpoint: `${base}/chat/completions`,
    headers: { Authorization: `Bearer ${selected.apiKey}`, 'Content-Type': 'application/json' },
    body: { model: selected.model, temperature: 0.6, max_tokens: maxTokens, messages: [{ role: 'system', content: systemText }, { role: 'user', content: userContent }] },
  }
}

export function readChatCompletion(selected, result) {
  if (selected.provider === 'google') return result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  if (selected.provider === 'anthropic') return result.content?.filter((part) => part.type === 'text').map((part) => part.text).join('').trim()
  return result.choices?.[0]?.message?.content?.trim()
}

/** Gateways report failures in different shapes — Zylo uses a bare string, OpenAI an object. */
export function providerFailure(result, status, name) {
  const detail = typeof result?.error === 'string' ? result.error
    : result?.error?.message || result?.message || result?.detail || result?.error?.status || result?.error?.code || ''
  return detail ? `${name} (${status}): ${detail}` : `${name} could not be reached (${status}).`
}
