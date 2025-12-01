import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import App from './App'
import { UserProvider } from './contexts/UserContext'
import { RoomProvider } from './contexts/RoomContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <RoomProvider>
        <CssBaseline />
        <App />
      </RoomProvider>
    </UserProvider>
  </React.StrictMode>,
)

