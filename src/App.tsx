import { useState, useMemo, useEffect } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box, Toolbar, Container, Grid, Paper } from '@mui/material'
import { Header } from './components/Header'
import { UserModal } from './components/UserModal'
import { RoomControls } from './components/RoomControls'
import { JoinRoomModal } from './components/JoinRoomModal'
import { GameControls } from './components/GameControls'
import { VotingStats } from './components/VotingStats'
import { NotificationSnackbar } from './components/NotificationSnackbar'
import { VotingCards } from './components/VotingCards'
import { PlayersTable } from './components/PlayersTable'
import { IssuesSidebar, type Ticket } from './components/IssuesSidebar'
import { ActiveTicketDisplay } from './components/ActiveTicketDisplay'
import { PokeEffect } from './components/PokeEffect'
import { CopycatRevealEffect } from './components/CopycatRevealEffect'
import { ActionLogDrawer } from './components/ActionLogDrawer'
import { QuickDrawOverlay } from './components/QuickDrawOverlay'
import { useUser } from './contexts/UserContext'
import { useRoom } from './contexts/RoomContext'
import { useThemeMode } from './hooks/useThemeMode'
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime'
import { supabase } from './supabaseClient'

function App() {
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false)
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [actionLogOpen, setActionLogOpen] = useState(false)
  
  // Custom hooks
  const { mode, toggleColorMode } = useThemeMode()
  const { hasJiraToken, userId, userName, setUserName } = useUser()
  const { roomId, isCreator } = useRoom()
  const {
    roomCreator,
    players,
    gameState,
    pokeEvent,
    specialCards,
    blockedPlayers,
    activeTargeting,
    isCurrentUserBlocked,
    copyVoteRelations,
    copyRevealEffects,
    currentUserCopyTarget,
    shuffleEffect,
    quickDraw,
    doublePowerPlayers,
    actionLog,
    notification,
    handleResetVoting,
    handleRevealCards,
    updateVotingStatus,
    handlePokeUser,
    handleGrantSpecialCard,
    handleUseSpecialCard,
    handleTargetSelect,
    cancelTargeting,
    calculateAverageVote,
    calculateVoteSpread,
    getEffectiveVote,
    triggerCopyRevealEffects,
    handleTriggerQuickDraw,
    handleQuickDrawVote,
    hasDoublePower,
    hasHalfPower,
    handleCoffeeSelect,
    handleGrantDoublePower,
    handleGrantHalfPower,
    clearCopyRevealEffects,
    clearActionLog,
    clearPokeEvent,
    closeNotification,
    showNotification,
  } = useSupabaseRealtime()

  // User is admin if they're the room creator OR if they're the only user in the room
  const isRoomCreator = useMemo(() => {
    if (!roomId) return false
    
    // Check localStorage first - most reliable for the creator
    if (isCreator(roomId)) return true
    
    // If roomCreator is set and matches userId
    if (roomCreator && userId === roomCreator) return true
    
    // If we're the only player in the room
    if (players.length === 1 && players[0]?.userId === userId) return true
    
    // If roomCreator hasn't been set yet but we're in a room with players
    // and we're the first in the list, assume we're the creator
    if (!roomCreator && players.length > 0 && players[0]?.userId === userId) return true
    
    return false
  }, [roomId, userId, roomCreator, players, isCreator])

  // Debug: Log players array
  useEffect(() => {
    if (roomId) {
      console.log('Players in room:', players)
      console.log('Players count:', players.length)
    }
  }, [roomId, players])

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

  // Auto-set vote for blocked players when cards are revealed
  useEffect(() => {
    if (gameState === 'REVEALED' && isCurrentUserBlocked) {
      const avgVote = calculateAverageVote()
      setSelectedVote(avgVote)
      updateVotingStatus(true, avgVote)
      showNotification(`Your vote was automatically set to ${avgVote} (average of other votes)`, 'info')
    }
  }, [gameState, isCurrentUserBlocked])

  // Trigger copy reveal effects when cards are revealed
  useEffect(() => {
    if (gameState === 'REVEALED' && copyVoteRelations.length > 0) {
      // Small delay to let the reveal settle, then show the copycat effect
      const timer = setTimeout(() => {
        triggerCopyRevealEffects()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [gameState, copyVoteRelations.length])

  // Update copier's vote to match target when revealed
  useEffect(() => {
    if (gameState === 'REVEALED' && currentUserCopyTarget) {
      const targetPlayer = players.find(p => p.userId === currentUserCopyTarget.targetUserId)
      if (targetPlayer?.vote) {
        setSelectedVote(targetPlayer.vote)
        updateVotingStatus(true, targetPlayer.vote)
      }
    }
  }, [gameState, currentUserCopyTarget, players])

  const handleNameChange = (newName: string) => {
    setUserName(newName)
    showNotification('Name updated successfully!', 'success')
  }

  const handleSelectTicket = (ticket: Ticket) => {
    setActiveTicket(ticket)
    showNotification(`Selected: ${ticket.key}`, 'info')
    
    // Broadcast ticket selection to all players
    if (roomId) {
      const channelName = `poker-planning-room-${roomId}:active-ticket`
      const channel = supabase.channel(channelName)
      channel.send({
        type: 'broadcast',
        event: 'active_ticket_selected',
        payload: {
          ticket,
          userId,
          userName: userName || null,
          timestamp: new Date().toISOString(),
        },
      })
    }
  }

  const handleNextTicket = () => {
    if (tickets.length === 0) return
    
    const currentIndex = activeTicket 
      ? tickets.findIndex((t) => t.id === activeTicket.id)
      : -1
    
    const nextIndex = (currentIndex + 1) % tickets.length
    const nextTicket = tickets[nextIndex]
    
    handleSelectTicket(nextTicket)
  }

  // Listen for active ticket selection from other players
  useEffect(() => {
    if (!roomId) return

    const channelName = `poker-planning-room-${roomId}:active-ticket`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    })

    channel.on('broadcast', { event: 'active_ticket_selected' }, (payload) => {
      const selectedTicket = payload.payload.ticket
      setActiveTicket(selectedTicket)
    })

    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

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

  // Show notification when poked
  useEffect(() => {
    if (pokeEvent.id && pokeEvent.pokedByName) {
      showNotification(`${pokeEvent.pokedByName} poked you! 👆`, 'info')
    }
  }, [pokeEvent.id])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header
          mode={mode}
          hasJiraToken={hasJiraToken}
          onToggleTheme={toggleColorMode}
          onOpenJiraModal={handleOpenUserModal}
          onOpenActionLog={() => setActionLogOpen(true)}
          actionLogCount={actionLog.length}
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
            marginLeft: roomId ? '400px' : 0,
            transition: 'margin 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* Room Controls */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <RoomControls 
                    onOpenJoinModal={handleOpenJoinRoomModal}
                    isConnected={!!roomId}
                  />
                </Paper>
              </Grid>

              {/* Game Controls - Admin toolbar */}
              {roomId && (
                <Grid item xs={12}>
                  <GameControls
                    isAdmin={isRoomCreator}
                    gameState={gameState}
                    onRevealCards={handleRevealCards}
                    onResetVoting={handleResetVoting}
                    voteSpread={calculateVoteSpread()}
                    onTriggerQuickDraw={handleTriggerQuickDraw}
                    onNextTicket={handleNextTicket}
                    doublePowerCount={doublePowerPlayers.size}
                  />
                </Grid>
              )}

              {/* Players Table - only show when in a room */}
              {roomId && (
                <Grid item xs={12}>
                  <PlayersTable
                    players={players}
                    currentUserId={userId}
                    roomCreator={roomCreator}
                    gameState={gameState}
                    onNameChange={handleNameChange}
                    currentUserName={userName}
                    onPokeUser={handlePokeUser}
                    onGrantSpecialCard={handleGrantSpecialCard}
                    isAdmin={isRoomCreator}
                    blockedPlayers={blockedPlayers}
                    activeTargeting={activeTargeting}
                    onTargetSelect={handleTargetSelect}
                    copyVoteRelations={copyVoteRelations}
                    getEffectiveVote={getEffectiveVote}
                    hasDoublePower={hasDoublePower}
                    hasHalfPower={hasHalfPower}
                    onGrantDoublePower={handleGrantDoublePower}
                    onGrantHalfPower={handleGrantHalfPower}
                  />
                </Grid>
              )}

              {/* Active Ticket Display - only show when a ticket is selected */}
              {roomId && activeTicket && (
                <Grid item xs={12}>
                  <ActiveTicketDisplay ticket={activeTicket} />
                </Grid>
              )}

              {/* Voting Statistics - only show when cards are revealed */}
              {roomId && gameState === 'REVEALED' && (
                <Grid item xs={12}>
                  <VotingStats players={players} />
                </Grid>
              )}

              {/* Voting Cards - only show when in a room */}
              {roomId && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <VotingCards
                      selectedValue={selectedVote}
                      onVote={handleVote}
                      disabled={gameState === 'REVEALED' || gameState === 'QUICK_DRAW'}
                      specialCards={specialCards}
                      onUseSpecialCard={handleUseSpecialCard}
                      isBlocked={isCurrentUserBlocked}
                      activeTargeting={activeTargeting}
                      onCancelTargeting={cancelTargeting}
                      currentUserCopyTarget={currentUserCopyTarget}
                      shuffleEffect={shuffleEffect}
                      onCoffeeSelect={handleCoffeeSelect}
                    />
                  </Paper>
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

      {roomId && (
        <IssuesSidebar
          activeTicketId={activeTicket?.id || null}
          onSelectTicket={handleSelectTicket}
          onTicketsChange={setTickets}
          isAdmin={isRoomCreator}
        />
      )}

      {/* Poke Effect - shows particles and screen shake when poked */}
      <PokeEffect
        pokeId={pokeEvent.id}
        onAnimationEnd={clearPokeEvent}
      />

      {/* Copycat Reveal Effect - shows funny animation when copy cards are revealed */}
      <CopycatRevealEffect
        effects={copyRevealEffects}
        onAnimationEnd={clearCopyRevealEffects}
      />

      {/* Action Log Drawer */}
      <ActionLogDrawer
        open={actionLogOpen}
        onClose={() => setActionLogOpen(false)}
        actionLog={actionLog}
        onClear={clearActionLog}
      />

      {/* Quick Draw Overlay */}
      <QuickDrawOverlay
        quickDraw={quickDraw}
        onVote={handleQuickDrawVote}
        currentUserId={userId}
      />
    </ThemeProvider>
  )
}

export default App
