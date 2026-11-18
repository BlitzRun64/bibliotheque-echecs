import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Polices hébergées sur le site lui-même (paquets Fontsource, licence OFL) : aucune requête
// vers Google Fonts, donc pas de transfert de l'adresse IP des visiteurs (RGPD).
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
