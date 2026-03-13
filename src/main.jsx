import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initSentry } from './sentry.js'
import { validateEnv } from './env.js'
import './index.css'
import App from './App.jsx'

// Boot sequence
validateEnv();
initSentry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
