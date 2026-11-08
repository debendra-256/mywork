import { useState } from 'react'
import { ArrowRight, ChevronDown, Copy, ImagePlus } from 'lucide-react'
import './PromptGenerator.css'

export default function PromptGenerator() {
  const [generatorMode, setGeneratorMode] = useState<'text' | 'image'>('text')
  const [photo, setPhoto] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [instruction, setInstruction] = useState('')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const choosePhoto = (file: File | undefined) => {
    setError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPG, PNG, or WebP photo.'); return }
    if (file.size > 3 * 1024 * 1024) { setError('Choose an image smaller than 3 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') { setPhoto(reader.result); setPhotoName(file.name) }
      else setError('Could not read this photo. Try another one.')
    }
    reader.onerror = () => setError('Could not read this photo. Try another one.')
    reader.readAsDataURL(file)
  }
  const generate = async () => {
    if (generatorMode === 'image' && !photo) { setError('Choose a photo first.'); return }
    if (generatorMode === 'text' && !instruction.trim()) { setError('Describe a prompt idea first.'); return }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: generatorMode === 'image' ? photo : '', instruction }),
      })
      const result = await response.json().catch(() => ({})) as { prompt?: string; error?: string }
      if (!response.ok || !result.prompt) throw new Error(result.error || `Prompt generation failed (${response.status}).`)
      setPrompt(result.prompt)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not generate a prompt from this photo.') }
    finally { setBusy(false) }
  }
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(prompt) } catch { setError('Could not copy the prompt. Select the text and copy it instead.') }
  }
  return <div className="prompt-generator-page"><section className="home-photo-generator" aria-labelledby="prompt-generator-title"><div className="home-photo-generator-heading"><span className="section-kicker">AI PROMPT GENERATOR</span><h2 id="prompt-generator-title">Free AI Prompt Generator</h2></div><div className="home-photo-generator-workspace"><div className="home-prompt-composer"><textarea aria-label="Describe an image to generate a prompt for" value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Generate a prompt for..." rows={5} /><div className="home-prompt-composer-footer"><label className="home-generator-mode"><select value={generatorMode} aria-label="Input mode" onChange={(event) => { const mode = event.target.value as 'text' | 'image'; setGeneratorMode(mode); setError('') }}><option value="text">Text</option><option value="image">Image</option></select><ChevronDown size={15} /></label><label className="home-image-attach"><ImagePlus size={15} />{photo ? photoName : 'Add image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setGeneratorMode('image'); choosePhoto(event.currentTarget.files?.[0]) }} /></label><button className="home-photo-generate-button" type="button" onClick={() => void generate()} disabled={busy || (generatorMode === 'image' ? !photo : !instruction.trim())}>{busy ? 'Generating…' : 'Generate'} <ArrowRight size={16} /></button></div></div>{generatorMode === 'image' && photo && <div className="home-photo-selected"><img src={photo} alt="Selected photo preview" /><span>{photoName}</span></div>}{prompt && <div className="home-generated-prompt"><label htmlFor="generated-prompt">Generated prompt</label><textarea id="generated-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={7} /><button type="button" onClick={() => void copyPrompt()}><Copy size={14} /> Copy prompt</button></div>}{error && <p className="editor-error" role="alert">{error}</p>}</div></section></div>
}
