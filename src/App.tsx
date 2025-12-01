import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Snackbar,
  PaletteMode,
  Chip,
  useMediaQuery
} from '@mui/material'
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  TrendingUp as TrendingUpIcon,
  Casino as CasinoIcon,
} from '@mui/icons-material'
import { supabase } from './supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

const drawerWidth = 240

function App() {
  // Detect system color scheme preference
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  
  // Initialize mode from localStorage or system preference
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode') as PaletteMode | null
    return savedMode || (prefersDarkMode ? 'dark' : 'light')
  })
  
  const [open, setOpen] = useState(true)
  const [count, setCount] = useState(0)
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Update theme when system preference changes (if user hasn't manually set a preference)
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode')
    if (!savedMode) {
      setMode(prefersDarkMode ? 'dark' : 'light')
    }
  }, [prefersDarkMode])

  // Create theme based on mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [mode],
  )

  // Toggle dark/light mode and save to localStorage
  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light'
      localStorage.setItem('themeMode', newMode)
      return newMode
    })
  }

  const toggleDrawer = () => {
    setOpen(!open)
  }

  // Initialize Supabase Realtime channel
  useEffect(() => {
    const channel = supabase.channel('poker-planning-events', {
      config: {
        broadcast: { self: false },
      },
    })

    channel.on('broadcast', { event: 'button_click_increment' }, (payload) => {
      console.log('Received increment event from another user:', payload)
      const newCount = payload.payload.count
      setCount(newCount)
      setNotification({
        open: true,
        message: `Another user incremented count to ${newCount}`,
        severity: 'info'
      })
    })

    channel.on('broadcast', { event: 'button_click_reset' }, (payload) => {
      console.log('Received reset event from another user:', payload)
      setCount(0)
      setNotification({
        open: true,
        message: 'Another user reset the count',
        severity: 'info'
      })
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to Supabase Realtime channel')
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const sendEvent = async (eventType: string, eventData: any) => {
    try {
      if (!channelRef.current) {
        throw new Error('Realtime channel not initialized')
      }

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
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* App Bar */}
        <AppBar position="absolute" sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: (theme) => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}>
          <Toolbar sx={{ pr: '24px' }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <CasinoIcon sx={{ mr: 2 }} />
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Poker Planning Dashboard
            </Typography>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            '& .MuiDrawer-paper': {
              position: 'relative',
              whiteSpace: 'nowrap',
              width: drawerWidth,
              transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              boxSizing: 'border-box',
              ...(!open && {
                overflowX: 'hidden',
                transition: (theme) => theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
                width: (theme) => theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                  width: theme.spacing(9),
                },
              }),
            },
          }}
        >
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            <ListItem disablePadding>
              <ListItemButton selected>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Users" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText primary="Tasks" />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>

              {/* Interactive Controls */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Real-time Collaboration Controls
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Click the buttons below to broadcast events to all connected users via Supabase Realtime.
                      All users will see the updates instantly through WebSocket connections.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleIncrement}
                        startIcon={<TrendingUpIcon />}
                      >
                        Increment: {count}
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={handleReset}
                        color="secondary"
                      >
                        Reset Counter
                      </Button>
                      <Chip 
                        label="WebSocket Connected" 
                        color="success" 
                        variant="outlined"
                        icon={<CasinoIcon />}
                      />
                    </Box>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        How it works:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Click increment → all users see the new count instantly<br />
                        • Click reset → everyone's counter resets to 0<br />
                        • Open multiple tabs to test real-time synchronization<br />
                        • All events are broadcast through Supabase Realtime channels
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

      {/* Notifications */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={4000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}

export default App
