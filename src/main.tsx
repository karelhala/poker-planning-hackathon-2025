import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import App from './App'
import { UserProvider } from './contexts/UserContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <CssBaseline />
      <App />
    </UserProvider>
  </React.StrictMode>,
)

