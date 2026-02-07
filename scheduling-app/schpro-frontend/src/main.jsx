import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './services/backboneSync' // Configure Backbone to use Axios
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
