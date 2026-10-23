import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'
import { globaleFehlerAbfangen } from './ui/protokoll.ts'
import { darstellungAnwenden } from './daten/einstellungen.ts'

globaleFehlerAbfangen()
darstellungAnwenden()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
