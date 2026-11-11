import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './app/App'
import './styles.css'
import './landing/landing.css'
import './theme/themes.css'
import './tools/sidebar/sidebarLayout.css'
import { applyCachedTheme, ensureSiteTheme } from './theme/siteTheme'
import { ensureSidebarSettings } from './tools/sidebar/sidebarSettings'

applyCachedTheme()
void ensureSiteTheme()
void ensureSidebarSettings()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter><App /></BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
