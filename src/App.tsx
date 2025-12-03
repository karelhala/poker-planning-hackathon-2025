import { useState, useMemo, useEffect } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box, Toolbar, Container, Grid, Paper } from '@mui/material'
import { Header } from './components/Header'
import { UserModal } from './components/UserModal'
import { RoomControls } from './components/RoomControls'
import { JoinRoomModal } from './components/JoinRoomModal'
import { CollaborationControls } from './components/CollaborationControls'
import { NotificationSnackbar } from './components/NotificationSnackbar'
import { VotingCards } from './components/VotingCards'
import { PlayersTable } from './components/PlayersTable'
import { useUser } from './contexts/UserContext'
import { useRoom } from './contexts/RoomContext'
import { useThemeMode } from './hooks/useThemeMode'
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime'

function App() {
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false)
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  
  // Custom hooks
  const { mode, toggleColorMode } = useThemeMode()
  const { hasJiraToken, userId, userName } = useUser()
  const { roomId } = useRoom()
  const {
    roomCreator,
    activeUsers,
    players,
    gameState,
    notification,
    handleResetVoting,
    handleRevealCards,
    updateVotingStatus,
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

  const handleVote = (value: string) => {
    console.log('Vote cast:', value)
    setSelectedVote(value)
    // Update presence to show user has voted, including the vote value
    updateVotingStatus(true, value)
  }

  // Reset selected vote when voting is reset
  useEffect(() => {
    if (gameState === 'VOTING') {
      setSelectedVote(null)
    }
  }, [gameState])

  // Prompt for name if user joins a room without a name
  useEffect(() => {
    if (roomId && !userName) {
      // Small delay to let the room load first
      const timer = setTimeout(() => {
        setUserModalOpen(true)
        showNotification('Please enter your name to join the room', 'info')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [roomId, userName])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header
          mode={mode}
          hasJiraToken={hasJiraToken}
          onToggleTheme={toggleColorMode}
          onOpenJiraModal={handleOpenUserModal}
        />

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

              {/* Players Table - only show when in a room */}
              {roomId && (
                <Grid item xs={12}>
                  <PlayersTable
                    players={players}
                    currentUserId={userId}
                    roomCreator={roomCreator}
                    gameState={gameState}
                  />
                </Grid>
              )}

              {/* Voting Cards - only show when in a room */}
              {roomId && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <VotingCards
                      selectedValue={selectedVote}
                      onVote={handleVote}
                      disabled={gameState === 'REVEALED'}
                    />
                  </Paper>
                </Grid>
              )}

              {/* Collaboration Controls - only show when in a room */}
              {roomId && (
                <Grid item xs={12}>
                  <CollaborationControls
                    roomCreator={roomCreator}
                    activeUsers={activeUsers}
                    currentUserId={userId}
                    gameState={gameState}
                    onResetVoting={handleResetVoting}
                    onRevealCards={handleRevealCards}
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
