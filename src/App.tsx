import { useState, useEffect, useRef } from 'react'
import { 
  ThemeProvider, 
  createTheme, 
  Container, 
  Box, 
  Typography, 
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Alert,
  Snackbar
} from '@mui/material'
import { Casino as CasinoIcon } from '@mui/icons-material'
import { supabase } from './supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

function App() {
  const [count, setCount] = useState(0)
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Initialize Supabase Realtime channel
  useEffect(() => {
    // Create a channel for poker planning events
    const channel = supabase.channel('poker-planning-events', {
      config: {
        broadcast: { self: false }, // Don't receive our own events
      },
    })

    // Listen for increment events from other users
    channel.on('broadcast', { event: 'button_click_increment' }, (payload) => {
      console.log('Received increment event from another user:', payload)
      const newCount = payload.payload.count
      setCount(newCount)
      setNotification({
        open: true,
        message: `Another user incremented count to ${newCount}`,
        severity: 'success'
      })
    })

    // Listen for reset events from other users
    channel.on('broadcast', { event: 'button_click_reset' }, (payload) => {
      console.log('Received reset event from another user:', payload)
      setCount(0)
      setNotification({
        open: true,
        message: 'Another user reset the count',
        severity: 'success'
      })
    })

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to Supabase Realtime channel')
      }
    })

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      channel.unsubscribe()
    }
  }, [])

  const sendEvent = async (eventType: string, eventData: any) => {
    try {
      if (!channelRef.current) {
        throw new Error('Realtime channel not initialized')
      }

      // Send event via WebSocket using broadcast
      const response = await channelRef.current.send({
        type: 'broadcast',
        event: eventType,
        payload: {
          ...eventData,
          timestamp: new Date().toISOString()
        }
      })

      if (response === 'ok') {
        console.log('Event sent via WebSocket:', eventType, eventData)
        // Don't show notification for own events since we see the UI update
      } else {
        throw new Error('Failed to send event')
      }
    } catch (err) {
      console.error('Error sending event:', err)
      setNotification({
        open: true,
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error'
      })
    }
  }

  const handleIncrement = () => {
    const newCount = count + 1
    setCount(newCount)
    sendEvent('button_click_increment', { count: newCount, action: 'increment' })
  }

  const handleReset = () => {
    setCount(0)
    sendEvent('button_click_reset', { count: 0, action: 'reset' })
  }

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <CasinoIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Poker Planning
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome to Poker Planning
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Real-time ticket sizing for your team
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={handleIncrement}
                  sx={{ mr: 2 }}
                >
                  Count: {count}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={3000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}

export default App

