import { useState } from 'react'
import { ArrowUpRight, Check, Globe, Palette, ShieldCheck } from 'lucide-react'
import { themeList, themeVariables, type ThemeDefinition, type ThemeId } from '../../theme/themes'
import { saveSiteTheme, useSiteTheme, useSiteThemeStatus } from '../../theme/siteTheme'
import { saveSidebarVisible, useSidebarVisible } from '../sidebar/sidebarSettings'
import './ThemeManager.css'

/**
 * Admin → Site Theme. One click repaints the whole site for every visitor: the
 * choice is written to `data/site-theme.json` and read back on each page load,
 * so there is no separate save step. The sidebar switch on this page is the
 * layout half of the same appearance decision.
 */
export default function ThemeManager() {
  const theme = useSiteTheme()
  const status = useSiteThemeStatus()
  const sidebar = useSidebarVisible()
  const [busy, setBusy] = useState(false)
  const [sidebarBusy, setSidebarBusy] = useState(false)
  const [error, setError] = useState('')

  const choose = async (id: ThemeId) => {
    if (busy || id === theme) return
    setBusy(true)
    setError('')
    try { await saveSiteTheme(id) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save the site theme.') }
    finally { setBusy(false) }
  }

  const toggleSidebar = async () => {
    if (sidebarBusy) return
    setSidebarBusy(true)
    setError('')
    try { await saveSidebarVisible(!sidebar) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save the sidebar setting.') }
    finally { setSidebarBusy(false) }
  }

  return <>
    <div className="admin-page-heading">
      <div>
        <span className="admin-kicker">IMGMOJO / APPEARANCE</span>
        <h1>Site theme</h1>
        <p>Four complete palettes for the whole app — landing page, library, store, sign-in and this workspace.</p>
      </div>
      <a className="admin-secondary" href="/" target="_blank" rel="noreferrer">View site <ArrowUpRight size={15} /></a>
    </div>

    <div className="menu-manager-notice"><ShieldCheck size={16} /><span>Clicking a theme applies it instantly and saves it on the server in <code>data/site-theme.json</code>. Every visitor gets the new palette on their next page load — there is nothing else to press.</span></div>
    {status === 'loading' && <p className="menu-manager-message">Syncing the saved theme…</p>}
    {status === 'error' && <p className="editor-error" role="alert">Could not reach the theme API. Showing the last theme this browser saw.</p>}
    {error && <p className="editor-error" role="alert">{error}</p>}

    <div className="theme-manager-grid">
      {themeList.map((item) => <ThemeCard key={item.id} theme={item} active={item.id === theme} busy={busy} onChoose={() => void choose(item.id)} />)}
    </div>

    <div className="theme-sidebar-option">
      <div>
        <strong>Sidebar</strong>
        <p>Show or hide the public navigation rail beside the library. Hidden means the tools, prompts and the landing hero fill the whole window. Same switch as Admin → Sidebar.</p>
      </div>
      <button className={`ai-model-toggle ${sidebar ? 'enabled' : ''}`} type="button" role="switch" aria-checked={sidebar} aria-label={`${sidebar ? 'Hide' : 'Show'} the sidebar`} disabled={sidebarBusy} onClick={() => void toggleSidebar()}><span />{sidebarBusy ? 'Saving…' : sidebar ? 'ON' : 'OFF'}</button>
    </div>

    <div className="theme-manager-foot"><Globe size={15} /><span>Themes only change colours. Layout, tools and every responsive breakpoint stay identical across all four.</span></div>
  </>
}

/** A selectable palette card whose mock window is painted by that theme's own tokens. */
function ThemeCard({ theme, active, busy, onChoose }: { theme: ThemeDefinition; active: boolean; busy: boolean; onChoose: () => void }) {
  return <article className={`theme-card ${active ? 'is-active' : ''}`} style={themeVariables(theme)}>
    <div className="theme-card-preview" aria-hidden="true">
      <div className="theme-preview-bar"><i /><i /><i /></div>
      <div className="theme-preview-hero">
        <span className="theme-preview-pill"><Palette size={9} /> {theme.dark ? 'Dark' : 'Light'} palette</span>
        <div className="theme-preview-lines"><em /><em /><em /></div>
        <div className="theme-preview-actions"><b>Explore tools</b><i /></div>
      </div>
      <div className="theme-preview-cards"><span /><span /><span /></div>
    </div>

    <div className="theme-card-copy">
      <div className="theme-card-head"><span className="theme-card-number">{theme.number}</span><strong>{theme.name}</strong>{active && <span className="theme-card-live"><Check size={12} /> Live now</span>}</div>
      <p>{theme.tagline}</p>
      <div className="theme-card-swatches">{theme.swatches.map((color) => <i style={{ background: color }} key={color} title={color} />)}</div>
    </div>

    <button type="button" className="theme-card-apply" disabled={active || busy} onClick={onChoose}>{active ? 'Currently applied' : busy ? 'Applying…' : `Apply ${theme.name}`}</button>
  </article>
}
