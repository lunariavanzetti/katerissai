import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './config/env'

console.log('✅ Environment configuration loaded')

// Initialize app with error handling
try {
  console.log('🚀 Mounting React app...')
  
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  
  console.log('✅ React app mounted successfully')
} catch (error) {
  console.error('❌ Failed to mount React app:', error)
  
  // Fallback UI if React fails to mount
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', monospace; background: white; padding: 20px;">
        <div style="max-width: 500px; text-align: center; border: 3px solid black; padding: 40px; box-shadow: 8px 8px 0px black;">
          <h1 style="color: #ff0080; font-size: 24px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">⚠️ Kateriss AI</h1>
          <p style="color: #333; margin-bottom: 20px; line-height: 1.5;">
            The application failed to initialize. This is likely due to missing configuration.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="background: #ff0080; color: white; border: 2px solid black; padding: 12px 24px; font-family: inherit; font-weight: bold; text-transform: uppercase; cursor: pointer; box-shadow: 4px 4px 0px black;"
            onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='6px 6px 0px black'"
            onmouseout="this.style.transform='translate(0, 0)'; this.style.boxShadow='4px 4px 0px black'"
          >
            Reload Page
          </button>
          <details style="margin-top: 20px; text-align: left; font-size: 12px;">
            <summary style="cursor: pointer; color: #666;">Technical Details</summary>
            <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; border: 1px solid #ccc; overflow: auto; color: #d63384;">${error}</pre>
          </details>
        </div>
      </div>
    `
  }
}