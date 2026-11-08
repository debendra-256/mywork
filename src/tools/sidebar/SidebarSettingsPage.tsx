import { useState } from 'react'
import { ArrowUpRight, PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react'
import { appConfig } from '../../config/app.config'
import { saveSidebarVisible, useSidebarSettingsStatus, useSidebarVisible } from './sidebarSettings'
import './SidebarSettings.css'

/**
 * Admin → Sidebar. One switch decides whether visitors get the left navigation
 * rail; it writes to `data/sidebar-settings.json`, so the layout changes for
 * everyone without a separate save step.
 */
export default function SidebarSettingsPage() {
  const visible = useSidebarVisible()
  const status = useSidebarSettingsStatus()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try { await saveSidebarVisible(!visible) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save the sidebar setting.') }
    finally { setBusy(false) }
  }

  return <>
    <div className="admin-page-heading">
      <div>
        <span className="admin-kicker">{appConfig.appName.toUpperCase()} / LAYOUT</span>
        <h1>Sidebar</h1>
        <p>Turn the public left navigation rail on or off. With it off, the content and the landing hero take the full window.</p>
      </div>
      <a className="admin-secondary" href="/" target="_blank" rel="noreferrer">View site <ArrowUpRight size={15} /></a>
    </div>

    <div className="menu-manager-notice"><ShieldCheck size={16} /><span>Clicking the switch applies it instantly and saves it on the server in <code>data/sidebar-settings.json</code>. Visitors get the new layout on their next page load — there is nothing else to press.</span></div>
    {status === 'loading' && <p className="menu-manager-message">Syncing the saved sidebar setting…</p>}
    {status === 'error' && <p className="editor-error" role="alert">Could not reach the sidebar settings API. Showing the last setting this browser saw.</p>}
    {error && <p className="editor-error" role="alert">{error}</p>}

    <section className="sidebar-tool-card">
      <div className="sidebar-tool-mocks">
        <div className={`sidebar-tool-mock ${visible ? 'is-active' : ''}`}>
          <div className="sidebar-mock-window"><i className="sidebar-mock-rail" /><i className="sidebar-mock-body" /></div>
          <span><PanelLeftOpen size={13} /> With sidebar</span>
        </div>
        <div className={`sidebar-tool-mock ${visible ? '' : 'is-active'}`}>
          <div className="sidebar-mock-window"><i className="sidebar-mock-body is-wide" /></div>
          <span><PanelLeftClose size={13} /> Full width</span>
        </div>
      </div>

      <div className="sidebar-tool-control">
        <div>
          <strong>{visible ? 'Sidebar is shown' : 'Sidebar is hidden'}</strong>
          <p>{visible ? 'The navigation rail keeps its place beside the library, and the phone menu button opens it as a drawer.' : 'The library, landing page and tools fill the whole window on every screen size.'}</p>
        </div>
        <button className={`ai-model-toggle ${visible ? 'enabled' : ''}`} type="button" role="switch" aria-checked={visible} aria-label={`${visible ? 'Hide' : 'Show'} the sidebar`} disabled={busy} onClick={() => void toggle()}><span />{busy ? 'Saving…' : visible ? 'ON' : 'OFF'}</button>
      </div>
    </section>
  </>
}
