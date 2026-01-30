import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Backbone from 'backbone'
import './index.css'
import App from './App.jsx'

// Import Backbone.sync override (must be imported before any models/collections)
import './services/backboneSync.js'
// Initialize mock authentication
import './services/mockAuth.js'

// Start Backbone history for routing (if using Backbone router)
// Backbone.history.start({ pushState: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
