import { useState, useMemo, useEffect, useCallback } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Box, Toolbar, Container, Grid, Paper } from '@mui/material'
import { Header } from './components/Header'
import { UserModal } from './components/UserModal'
import { RoomControls } from './components/RoomControls'
import { JoinRoomModal } from './components/JoinRoomModal'


import { NotificationSnackbar } from './components/NotificationSnackbar'
import { VotingCards } from './components/VotingCards'
import { PokerTable } from './components/PokerTable'
import { IssuesSidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, type Ticket } from './components/IssuesSidebar'

import { PokeEffect } from './components/PokeEffect'
import { CopycatRevealEffect } from './components/CopycatRevealEffect'
import { ActionLogDrawer } from './components/ActionLogDrawer'
import { QuickDrawOverlay } from './components/QuickDrawOverlay'
import { useUser } from './contexts/UserContext'
import { useRoom } from './contexts/RoomContext'
import { useThemeMode } from './hooks/useThemeMode'
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime'
import { usePoints } from './hooks/usePoints'
import { PointsFloater } from './components/PointsFloater'
import { PointsEconomyModal } from './components/PointsEconomyModal'
import { AvatarEditor } from './components/AvatarEditor'
import { MakeItRain } from './components/MakeItRain'
import { TomatoSplash } from './components/TomatoSplash'
import { ShopModal } from './components/ShopModal'
import { FeltColorPicker } from './components/FeltColorPicker'
import { ConfettiEffect } from './components/ConfettiEffect'
import { DiceRollEffect } from './components/DiceRollEffect'
import { ChipStack } from './components/ChipStack'
import type { ShopItem } from './data/shopItems'
import { GHOST_STACK_CHIPS } from './data/shopItems'
import { supabase } from './supabaseClient'

function App() {
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false)
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [, setTickets] = useState<Ticket[]>([])
  const [actionLogOpen, setActionLogOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebarCollapsed')
    return stored === null ? true : stored === 'true'
  })
  const [economyModalOpen, setEconomyModalOpen] = useState(false)
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState(0)
  const [shopOpen, setShopOpen] = useState(false)
  const [ownedItems, setOwnedItems] = useState<string[]>([])
  const [consumableItems, setConsumableItems] = useState<string[]>([])
  const [itemTargeting, setItemTargeting] = useState<string | null>(null)
  const [megaphoneActive, setMegaphoneActive] = useState(false)
  const [feltPickerOpen, setFeltPickerOpen] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)
  const [myDiceValue, setMyDiceValue] = useState<string | null>(null)

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
    isProcessing,
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
    handleSetVotingMode,
    handleMakeItRain,
    handleThrowTomato,
    handleApplause,
    handleDiceRoll,
    handleMegaphoneVote,
    handleEarthquake,
    handleSetFeltColor,
    tomatoSplats,
    applauseEvents,
    diceRollEvent,
    clearDiceRollEvent,
    megaphoneEvents,
    earthquakeActive,
    feltColor,
    refreshPresence,
    setItemCount,
    setGhostChipCount,
    setPokerFaceActive,
    resetRound,
    rainEvent,
    clearRainEvent,
    votingMode,
    lastHeartbeat,
    clearCopyRevealEffects,
    clearActionLog,
    clearPokeEvent,
    closeNotification,
    showNotification,
  } = useSupabaseRealtime()

  const {
    points,
    recentEvents: pointEvents,
    onSessionJoin,
    onVoteCast,
    onReveal,
    awardCustomPoints,
    resetSession: resetPoints,
  } = usePoints()

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
    const wasAlreadyVoted = selectedVote !== null
    setSelectedVote(value)
    updateVotingStatus(true, value)
    if (!wasAlreadyVoted) {
      onVoteCast()
    }
    if (megaphoneActive) {
      handleMegaphoneVote()
      setMegaphoneActive(false)
    }
  }

  // Reset selected vote when voting is reset
  // resetRound ensures clearing even when gameState is already VOTING (e.g. reset without reveal)
  useEffect(() => {
    if (gameState === 'VOTING') {
      setSelectedVote(null)
    }
  }, [gameState, resetRound])

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

    const handleStatus = (status: string) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`Active-ticket channel ${status}, reconnecting...`)
      }
    }

    channel.subscribe(handleStatus)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const socket = (supabase as any).realtime
        const isConnected = socket?.isConnected?.() ?? socket?.conn?.readyState === 1
        if (!isConnected) {
          socket?.connect?.()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      channel.unsubscribe()
    }
  }, [roomId])

  // Award points on session join
  useEffect(() => {
    if (roomId && userName) {
      onSessionJoin()
    }
  }, [roomId, userName])

  // Award points on reveal
  useEffect(() => {
    if (gameState === 'REVEALED') {
      const spread = calculateVoteSpread()
      if (spread) {
        onReveal(
          spread.spread,
          userId,
          players.map(p => ({ userId: p.userId, vote: p.vote })),
          spread.average
        )
      }
    }
  }, [gameState])

  // Confetti cannon — auto-fire on consensus if player owns item
  useEffect(() => {
    if (gameState === 'REVEALED' && ownedItems.includes('confetti')) {
      const spread = calculateVoteSpread()
      if (spread && spread.spread === 0) {
        setConfettiActive(true)
      }
    }
  }, [gameState])

  // Derive ghost chip count from owned permanent ghost stacks (largest wins)
  const ghostChipCount = useMemo(() => {
    let max = 0
    for (const id of ownedItems) {
      const chips = GHOST_STACK_CHIPS[id]
      if (chips && chips > max) max = chips
    }
    return max
  }, [ownedItems])

  // Sync item count + ghost chip count to presence
  useEffect(() => {
    setItemCount(consumableItems.length)
    setGhostChipCount(ghostChipCount)
    if (roomId) refreshPresence()
  }, [consumableItems.length, ghostChipCount])

  // Reset points when leaving room
  useEffect(() => {
    if (!roomId) {
      resetPoints()
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

  const handleBuyItem = useCallback((item: ShopItem) => {
    if (points >= item.cost) {
      awardCustomPoints(-item.cost, `Bought ${item.name}`, '🛒')
      if (item.type === 'permanent') {
        setOwnedItems(prev => [...prev, item.id])
      } else {
        setConsumableItems(prev => [...prev, item.id])
      }
    }
  }, [points, awardCustomPoints])

  const handleUseItem = useCallback((itemId: string) => {
    if (itemId === 'tomato') {
      setItemTargeting('tomato')
      showNotification('🍅 Click on a player to throw a tomato!', 'info')
    } else if (itemId === 'applause') {
      handleApplause()
      setConsumableItems(prev => {
        const idx = prev.indexOf('applause')
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    } else if (itemId === 'megaphone') {
      if (megaphoneActive) {
        showNotification('📢 Megaphone already armed! Wait until you vote.', 'info')
        return
      }
      setMegaphoneActive(true)
      showNotification('📢 Megaphone armed! Your next vote will flash "VOTED!" to everyone.', 'info')
      setConsumableItems(prev => {
        const idx = prev.indexOf('megaphone')
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    } else if (itemId === 'earthquake') {
      handleEarthquake()
      setConsumableItems(prev => {
        const idx = prev.indexOf('earthquake')
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    } else if (itemId === 'table_cloth') {
      setFeltPickerOpen(true)
    } else if (itemId === 'rainbow_table') {
      handleSetFeltColor('rainbow')
      setConsumableItems(prev => {
        const idx = prev.indexOf('rainbow_table')
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    } else if (itemId === 'poker_face') {
      if (gameState !== 'VOTING') {
        showNotification('🃏 Can only use Poker Face during voting!', 'error')
        return
      }
      setPokerFaceActive(true)
      showNotification('🃏 Poker Face! Others can\'t see you\'ve voted.', 'success')
      setConsumableItems(prev => {
        const idx = prev.indexOf('poker_face')
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    } else if (itemId === 'dice') {
      if (gameState !== 'VOTING') {
        showNotification('🎲 Can only roll dice during voting!', 'error')
        return
      }
      if (diceRollEvent) return
      const pool = votingMode === 'tshirt'
        ? ['S', 'M', 'L', 'XL']
        : ['0', '1', '2', '3', '5', '8', '13', '21']
      const randomValue = pool[Math.floor(Math.random() * pool.length)]
      setMyDiceValue(randomValue)
      handleDiceRoll(randomValue, pool)
      setConsumableItems(prev => {
        const idx = prev.indexOf('dice')
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    }
  }, [handleApplause, megaphoneActive, handleEarthquake, handleSetFeltColor, gameState, votingMode, diceRollEvent, handleDiceRoll, setPokerFaceActive])

  const handleFeltColorSelect = useCallback((color: string) => {
    handleSetFeltColor(color)
    setConsumableItems(prev => {
      const idx = prev.indexOf('table_cloth')
      if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
      return prev
    })
  }, [handleSetFeltColor])

  const handleItemTargetSelect = useCallback((targetUserId: string, targetUserName: string | null) => {
    if (itemTargeting === 'tomato') {
      handleThrowTomato(targetUserId, targetUserName)
      setConsumableItems(prev => {
        const idx = prev.indexOf('tomato')
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
      setItemTargeting(null)
    }
  }, [itemTargeting, handleThrowTomato])

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebarCollapsed', String(next))
      return next
    })
  }, [])

  const currentSidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

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
          lastHeartbeat={lastHeartbeat}
          userId={userId}
          onOpenAvatarEditor={() => setAvatarEditorOpen(true)}
          onOpenShop={() => setShopOpen(true)}
          points={points}
        />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
            marginLeft: roomId ? `${currentSidebarWidth}px` : 0,
            transition: 'margin 225ms cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: roomId
              ? (theme) =>
                  theme.palette.mode === 'dark'
                    ? '#1a1a2e'
                    : '#2c3e50'
              : (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[100]
                    : theme.palette.grey[900],
          }}
        >
          <Toolbar />

          {/* Not in room — show room controls */}
          {!roomId && (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <RoomControls
                      onOpenJoinModal={handleOpenJoinRoomModal}
                      isConnected={!!roomId}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Container>
          )}

          {/* In room — poker table layout */}
          {roomId && (
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', p: 2, gap: 2 }}>
              {/* Room controls bar */}
              <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
                <RoomControls
                  onOpenJoinModal={handleOpenJoinRoomModal}
                  isConnected={!!roomId}
                  isAdmin={isRoomCreator}
                  votingMode={votingMode}
                  onSetVotingMode={handleSetVotingMode}
                />
              </Paper>

              {/* Poker Table */}
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <PokerTable
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
                  activeTicket={activeTicket}
                  votingMode={votingMode}
                  onRevealCards={handleRevealCards}
                  onResetVoting={handleResetVoting}
                  isProcessing={isProcessing}
                  voteSpread={calculateVoteSpread()}
                  onTriggerQuickDraw={handleTriggerQuickDraw}
                  points={points}
                  onOpenEconomyModal={() => setEconomyModalOpen(true)}
                  avatarVersion={avatarVersion}
                  onMakeItRain={handleMakeItRain}
                  tomatoSplats={tomatoSplats}
                  applauseEvents={applauseEvents}
                  megaphoneEvents={megaphoneEvents}
                  earthquakeActive={earthquakeActive}
                  feltColor={feltColor}
                  itemTargeting={itemTargeting}
                  onItemTargetSelect={handleItemTargetSelect}
                />
              </Box>

              {/* Voting Cards */}
              <Paper sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'center',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
              }}>
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
                  votingMode={votingMode}
                />
              </Paper>
            </Box>
          )}
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
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
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

      {/* Tomato splash (full screen on target) */}
      <TomatoSplash
        active={tomatoSplats.has(userId)}
        thrownBy={tomatoSplats.get(userId)?.thrownBy || ''}
        onEnd={() => {}}
      />

      {/* Chip Stack (consumable items) */}
      {roomId && <ChipStack items={consumableItems} onUseItem={handleUseItem} ghostChipCount={ghostChipCount} />}

      {/* Make It Rain overlay */}
      <MakeItRain
        active={!!rainEvent}
        size={rainEvent?.size || 'medium'}
        onCatch={() => awardCustomPoints(1, 'Chip caught!', '🪙')}
        onEnd={clearRainEvent}
      />

      {/* Points floating notifications */}
      <PointsFloater events={pointEvents} />

      {/* Avatar Editor */}
      <AvatarEditor
        open={avatarEditorOpen}
        onClose={() => setAvatarEditorOpen(false)}
        userId={userId}
        points={points}
        onSpendPoints={(amount) => awardCustomPoints(-amount, 'Purchase', '🛒')}
        onSave={() => { setAvatarVersion(v => v + 1); refreshPresence(); }}
      />

      {/* Item Shop */}
      <ShopModal
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        points={points}
        onBuy={handleBuyItem}
        ownedItems={ownedItems}
      />

      {/* Felt Color Picker */}
      <FeltColorPicker
        open={feltPickerOpen}
        onClose={() => setFeltPickerOpen(false)}
        onSelectColor={handleFeltColorSelect}
      />

      {/* Dice roll animation — visible to all players */}
      {diceRollEvent && (
        <DiceRollEffect
          active
          value={diceRollEvent.value}
          scale={diceRollEvent.scale}
          userName={diceRollEvent.userName}
          onEnd={() => {
            if (myDiceValue) {
              handleVote(myDiceValue)
              setMyDiceValue(null)
            }
            clearDiceRollEvent()
          }}
        />
      )}

      {/* Confetti cannon effect */}
      <ConfettiEffect active={confettiActive} onEnd={() => setConfettiActive(false)} />

      {/* Points economy info modal */}
      <PointsEconomyModal
        open={economyModalOpen}
        onClose={() => setEconomyModalOpen(false)}
      />
    </ThemeProvider>
  )
}

export default App
