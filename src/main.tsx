import './index.css'    
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { SatelliteProvider } from "./context/SatelliteContext";



createRoot(document.getElementById('root')!).render(
  
  <StrictMode>
    <SatelliteProvider>
      <App />
    </SatelliteProvider>
  </StrictMode>,
)
