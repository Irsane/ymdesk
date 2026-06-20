import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { PlayerProvider } from './player.jsx'
import { ThemeProvider } from './theme.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <PlayerProvider>
        <App />
      </PlayerProvider>
    </ThemeProvider>
  </React.StrictMode>
)
