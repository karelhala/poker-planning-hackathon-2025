import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import App from './App'
import { JiraProvider } from './JiraContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <JiraProvider>
      <CssBaseline />
      <App />
    </JiraProvider>
  </React.StrictMode>,
)

