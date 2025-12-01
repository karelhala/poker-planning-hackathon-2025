import { useState, useMemo } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box, Toolbar, Container, Grid, Paper } from '@mui/material'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { UserModal } from './components/UserModal'
import { RoomControls } from './components/RoomControls'
import { JoinRoomModal } from './components/JoinRoomModal'
import { CollaborationControls } from './components/CollaborationControls'
import { NotificationSnackbar } from './components/NotificationSnackbar'
import { useUser } from './contexts/UserContext'
import { useRoom } from './contexts/RoomContext'
import { useThemeMode } from './hooks/useThemeMode'
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime'

function App() {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false)
  
  // Custom hooks
  const { mode, toggleColorMode } = useThemeMode()
  const { hasJiraToken, userId } = useUser()
  const { roomId } = useRoom()
  const {
    count,
    roomCreator,
    activeUsers,
    notification,
    handleIncrement,
    handleReset,
    closeNotification,
    showNotification,
  } = useSupabaseRealtime()

  // Create theme
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
    [mode]
  )

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleOpenUserModal = () => {
    setUserModalOpen(true)
  }

  const handleCloseUserModal = () => {
    setUserModalOpen(false)
  }

  const handleUserSave = (message: string, severity: 'success' | 'info') => {
    showNotification(message, severity)
  }

  const handleOpenJoinRoomModal = () => {
    setJoinRoomModalOpen(true)
  }

  const handleCloseJoinRoomModal = () => {
    setJoinRoomModalOpen(false)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header
          open={drawerOpen}
          mode={mode}
          hasJiraToken={hasJiraToken}
          onToggleDrawer={toggleDrawer}
          onToggleTheme={toggleColorMode}
          onOpenJiraModal={handleOpenUserModal}
        />

        <Sidebar open={drawerOpen} onToggleDrawer={toggleDrawer} />

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
              {/* Room Controls */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <RoomControls onOpenJoinModal={handleOpenJoinRoomModal} />
                </Paper>
              </Grid>

              {/* Collaboration Controls - only show when in a room */}
              {roomId && (
                <Grid item xs={12}>
                  <CollaborationControls
                    count={count}
                    roomCreator={roomCreator}
                    activeUsers={activeUsers}
                    currentUserId={userId}
                    onIncrement={handleIncrement}
                    onReset={handleReset}
                  />
                </Grid>
              )}
            </Grid>
          </Container>
        </Box>
      </Box>

      <UserModal
        open={userModalOpen}
        onClose={handleCloseUserModal}
        onSave={handleUserSave}
      />

      <JoinRoomModal
        open={joinRoomModalOpen}
        onClose={handleCloseJoinRoomModal}
      />

      <NotificationSnackbar
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={closeNotification}
      />
    </ThemeProvider>
  )
}

export default App
