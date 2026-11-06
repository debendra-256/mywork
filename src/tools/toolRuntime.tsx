import { Suspense, lazy, useEffect, useState, type ComponentType, type LazyExoticComponent } from 'react'
import type { ToolDefinition } from '../config/ToolsConfig'
import { loadEditorFonts } from './shared/editorFonts'

const componentCache = new Map<string, LazyExoticComponent<ComponentType<any>>>()

function toolComponent(tool: ToolDefinition): LazyExoticComponent<ComponentType<any>> {
  let component = componentCache.get(tool.id)
  if (!component) {
    if (!tool.load) throw new Error(`Tool "${tool.id}" has no module to load.`)
    component = lazy(tool.load)
    componentCache.set(tool.id, component)
  }
  return component
}

function ToolLoading({ label }: { label: string }) {
  return <div className="tool-loading" role="status" aria-live="polite">
    <span className="tool-loading-dot" aria-hidden="true" />
    <p>{label}</p>
  </div>
}

/** Waits for the shared editor font stylesheet so canvas text paints in the picked family. */
function useEditorFontsReady(required: boolean): boolean {
  const [ready, setReady] = useState(!required)
  useEffect(() => {
    if (!required) return
    let active = true
    void loadEditorFonts().then(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [required])
  return ready
}

/**
 * Renders a tool from ToolsConfig. The tool's chunk is requested on first render
 * (never at app start), and font-dependent editors mount only once their fonts
 * are available.
 */
export function ToolSurface({ tool, ...props }: { tool: ToolDefinition } & Record<string, unknown>) {
  const fontsReady = useEditorFontsReady(tool.editorFonts === true)
  if (tool.editorFonts && !fontsReady) return <ToolLoading label={`Loading ${tool.title} fonts…`} />
  const Component = toolComponent(tool)
  return <Suspense fallback={<ToolLoading label={`Loading ${tool.title}…`} />}><Component {...props} /></Suspense>
}
