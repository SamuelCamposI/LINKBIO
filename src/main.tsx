import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PublicProfile from './PublicProfile.tsx'

const isPublicProfile = window.location.pathname === '/fckn.daybeat' || window.location.pathname === '/fckn.daybeat/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPublicProfile ? <PublicProfile /> : <App />}
  </StrictMode>,
)
