import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './OptiFlow-v17-fixed.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
