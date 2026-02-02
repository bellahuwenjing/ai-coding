import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Note: Backbone models now use Supabase directly (sync overridden in each model)
// No global Backbone.sync override or mock auth needed

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
