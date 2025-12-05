import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useUser } from '../contexts/UserContext'
import { useRoom } from '../contexts/RoomContext'

interface Notification {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'info'
}

interface RoomUser {
  userId: string
  userName: string | null
}

export interface Player {
  userId: string
  userName: string | null
  hasVoted: boolean
  vote: string | null
  isOnline: boolean
  availableCards: SpecialCardType[]
}

export type GameState = 'VOTING' | 'REVEALED'

export interface JiraTicket {
  id: string
  key: string
  addedBy: string
  addedByName: string | null
  timestamp: string
}

export interface PokeEvent {
  id: string | null;
  pokedBy: string | null;
  pokedByName: string | null;
}

// Special action card types
export type SpecialCardType = 'COPY' | 'SHUFFLE' | 'BLOCK';

export interface SpecialCard {
  id: string;
  type: SpecialCardType;
  grantedBy: string;
  grantedByName: string | null;
  grantedAt: string;
}

export interface BlockedPlayer {
  oderId: string;
  blockedByName: string | null;
  blockedAt: string;
}

export interface ActiveTargeting {
  cardId: string;
  cardType: SpecialCardType;
}

export interface CopyVoteRelation {
  copierUserId: string;
  copierUserName: string | null;
  targetUserId: string;
  targetUserName: string | null;
}

export interface CopyRevealEffect {
  id: string;
  copierUserId: string;
  copierUserName: string | null;
  targetUserId: string;
  targetUserName: string | null;
  copiedVote: string | null;
}

export interface ShuffleEffect {
  shuffledBy: string;
  shuffledByName: string | null;
  cardOrder: number[]; // Randomized indices
  isAnimating: boolean;
}

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  type: 'join' | 'leave' | 'vote' | 'reveal' | 'reset' | 'poke' | 'block' | 'copy' | 'shuffle' | 'ticket' | 'info';
  message: string;
  userName?: string | null;
  icon: string;
}

export const SPECIAL_CARD_INFO: Record<SpecialCardType, { label: string; description: string; icon: string; color: string }> = {
  COPY: {
    label: 'Copy Vote',
    description: 'Copy someone\'s value when they vote',
    icon: '📋',
    color: '#9c27b0', // Purple
  },
  SHUFFLE: {
    label: 'Shuffle',
    description: 'Hide and shuffle someone\'s card values',
    icon: '🔀',
    color: '#ff9800', // Orange
  },
  BLOCK: {
    label: 'Block',
    description: 'Block someone from voting',
    icon: '🚫',
    color: '#f44336', // Red
  },
};

// All available special card types
export const ALL_SPECIAL_CARD_TYPES: SpecialCardType[] = ['COPY', 'SHUFFLE', 'BLOCK'];

// Generate initial set of all special cards for a player
const generateInitialCards = (grantedBy: string, grantedByName: string | null): SpecialCard[] => {
  return ALL_SPECIAL_CARD_TYPES.map(type => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${type}`,
    type,
    grantedBy,
    grantedByName,
    grantedAt: new Date().toISOString(),
  }));
};

export const useSupabaseRealtime = () => {
  const { userId, userName } = useUser()
  const { roomId } = useRoom()
  const [count, setCount] = useState(0)
  const [roomCreator, setRoomCreator] = useState<string | null>(null)
  const [activeUsers, setActiveUsers] = useState<RoomUser[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState>('VOTING')
  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [pokeEvent, setPokeEvent] = useState<PokeEvent>({ id: null, pokedBy: null, pokedByName: null })
  const [specialCards, setSpecialCards] = useState<SpecialCard[]>([])
  const [blockedPlayers, setBlockedPlayers] = useState<Map<string, { blockedBy: string; blockedByName: string | null }>>(new Map())
  const [activeTargeting, setActiveTargeting] = useState<ActiveTargeting | null>(null)
  const [copyVoteRelations, setCopyVoteRelations] = useState<CopyVoteRelation[]>([])
  const [copyRevealEffects, setCopyRevealEffects] = useState<CopyRevealEffect[]>([])
  const [shuffleEffect, setShuffleEffect] = useState<ShuffleEffect | null>(null)
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([])
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success',
  })
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const userNameRef = useRef(userName)
  const knownUsersRef = useRef<Set<string>>(new Set()) // Track users we've seen to avoid duplicate join/leave logs
  
  // Keep userName ref in sync
  useEffect(() => {
    userNameRef.current = userName
  }, [userName])
  
  // Helper to add action log entry - using ref to avoid stale closures in event handlers
  const addLogEntryRef = useRef<(type: ActionLogEntry['type'], message: string, userName?: string | null) => void>(() => {})
  
  addLogEntryRef.current = (type: ActionLogEntry['type'], message: string, userName?: string | null) => {
    const icons: Record<ActionLogEntry['type'], string> = {
      join: '👋',
      leave: '🚪',
      vote: '🗳️',
      reveal: '👁️',
      reset: '🔄',
      poke: '👆',
      block: '🚫',
      copy: '📋',
      shuffle: '🔀',
      ticket: '🎫',
      info: 'ℹ️',
    }
    
    setActionLog(prev => [{
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      userName,
      icon: icons[type],
    }, ...prev].slice(0, 100)) // Keep last 100 entries
  }
  
  const addLogEntry = (type: ActionLogEntry['type'], message: string, userName?: string | null) => {
    addLogEntryRef.current(type, message, userName)
  }
  const isFirstUserRef = useRef(false)
  const countRef = useRef(count)
  const roomCreatorRef = useRef(roomCreator)
  const activeUsersRef = useRef(activeUsers)
  const ticketsRef = useRef(tickets)
  const activeTicketIdRef = useRef(activeTicketId)
  const specialCardsRef = useRef(specialCards)
  const blockedPlayersRef = useRef(blockedPlayers)
  const copyVoteRelationsRef = useRef(copyVoteRelations)

  // Keep refs in sync with state
  useEffect(() => {
    countRef.current = count
  }, [count])

  useEffect(() => {
    roomCreatorRef.current = roomCreator
  }, [roomCreator])

  useEffect(() => {
    activeUsersRef.current = activeUsers
  }, [activeUsers])

  useEffect(() => {
    ticketsRef.current = tickets
  }, [tickets])

  useEffect(() => {
    activeTicketIdRef.current = activeTicketId
  }, [activeTicketId])

  useEffect(() => {
    specialCardsRef.current = specialCards
  }, [specialCards])

  useEffect(() => {
    blockedPlayersRef.current = blockedPlayers
  }, [blockedPlayers])

  useEffect(() => {
    copyVoteRelationsRef.current = copyVoteRelations
  }, [copyVoteRelations])

  useEffect(() => {
    // Only connect if in a room
    if (!roomId) {
      // No room - disconnect and reset state
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      setCount(0)
      setRoomCreator(null)
      setActiveUsers([])
      setPlayers([])
      setGameState('VOTING')
      setTickets([])
      setActiveTicketId(null)
      setSpecialCards([])
      setBlockedPlayers(new Map())
      setActiveTargeting(null)
      setCopyVoteRelations([])
      setCopyRevealEffects([])
      setShuffleEffect(null)
      isFirstUserRef.current = false
      knownUsersRef.current.clear()
      return
    }

    // Create room-specific channel with presence
    const channelName = `poker-planning-room-${roomId}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    })

    // Track presence (who's in the room)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: RoomUser[] = []
        const playersList: Player[] = []
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[]
          presences.forEach((presence) => {
            users.push({
              userId: presence.userId,
              userName: presence.userName || null,
            })
            playersList.push({
              userId: presence.userId,
              userName: presence.userName || null,
              hasVoted: presence.hasVoted || false,
              vote: presence.vote || null,
              isOnline: true,
              availableCards: presence.availableCards || [],
            })
          })
        })
        
        setActiveUsers(users)
        setPlayers(playersList)
        console.log('Active users in room:', users)
        console.log('Players with voting status:', playersList)

        // If this is the first user in the room, they become the creator
        if (users.length === 1 && users[0].userId === userId) {
          isFirstUserRef.current = true
          setRoomCreator(userId)
          console.log('You are the room creator')
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences)
        
        // Log the join event only for truly new users (not presence updates)
        newPresences.forEach((presence: any) => {
          if (presence.userId !== userId && !knownUsersRef.current.has(presence.userId)) {
            knownUsersRef.current.add(presence.userId)
            addLogEntry('join', `${presence.userName || 'Someone'} joined the room`, presence.userName)
          }
        })
        
        // If we ARE the creator (first user) and someone joins, send them current state
        if (isFirstUserRef.current && newPresences.length > 0) {
          const newUserId = newPresences[0].userId
          if (newUserId !== userId) {
            // Send current state to new user
            setTimeout(() => {
              channel.send({
                type: 'broadcast',
                event: 'state_sync',
                payload: {
                  count: countRef.current,
                  roomCreator: roomCreatorRef.current,
                  activeUsers: activeUsersRef.current,
                  tickets: ticketsRef.current,
                  activeTicketId: activeTicketIdRef.current,
                  userId,
                  userName: userNameRef.current,
                  timestamp: new Date().toISOString(),
                },
              })
            }, 500) // Small delay to ensure they're subscribed
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences)
        // Log the leave event only for users actually leaving (check against current presence state)
        const currentState = channel.presenceState()
        leftPresences.forEach((presence: any) => {
          // Only log if user is not in current state (truly left, not just a presence update)
          if (!currentState[presence.userId]) {
            knownUsersRef.current.delete(presence.userId)
            addLogEntry('leave', `${presence.userName || 'Someone'} left the room`, presence.userName)
          }
        })
      })

    // Listen for state sync (when we join and someone sends us the state)
    channel.on('broadcast', { event: 'state_sync' }, (payload) => {
      console.log('Received room state:', payload)
      const { count: syncCount, roomCreator: creator, tickets: syncTickets, activeTicketId: syncActiveTicketId } = payload.payload
      
      setCount(syncCount)
      setRoomCreator(creator)
      setTickets(syncTickets || [])
      setActiveTicketId(syncActiveTicketId || null)
      
      const senderName = payload.payload.userName || 'Another user'
      setNotification({
        open: true,
        message: `Synced with room. Current count: ${syncCount}`,
        severity: 'success',
      })
      console.log(`State synced from ${senderName}`)
    })

    channel.on('broadcast', { event: 'button_click_increment' }, (payload) => {
      console.log('Received increment event from another user:', payload)
      const newCount = payload.payload.count
      const senderName = payload.payload.userName || 'Another user'
      const senderId = payload.payload.userId
      
      setCount(newCount)
      setNotification({
        open: true,
        message: `${senderName} incremented count to ${newCount}`,
        severity: 'info',
      })
      console.log(`Event from user ${senderId}: increment to ${newCount}`)
    })

    channel.on('broadcast', { event: 'button_click_reset' }, (payload) => {
      console.log('Received reset event from another user:', payload)
      const senderName = payload.payload.userName || 'Another user'
      const senderId = payload.payload.userId
      
      setCount(0)
      setNotification({
        open: true,
        message: `${senderName} reset the count`,
        severity: 'info',
      })
      console.log(`Event from user ${senderId}: reset count`)
    })

    // Listen for reveal event
    channel.on('broadcast', { event: 'reveal_cards' }, (payload) => {
      console.log('Received reveal event:', payload)
      const senderName = payload.payload.userName || 'Admin'
      setGameState('REVEALED')
      addLogEntry('reveal', `${senderName} revealed all cards`, senderName)
      setNotification({
        open: true,
        message: `${senderName} revealed all cards`,
        severity: 'info',
      })
    })

    // Listen for reset voting event (different from old reset counter)
    channel.on('broadcast', { event: 'reset_voting' }, (payload) => {
      console.log('Received reset voting event:', payload)
      const senderName = payload.payload.userName || 'Admin'
      setGameState('VOTING')
      
      // Clear blocked players, copy relations, and shuffle for new round
      // Note: Special cards are NOT refreshed - they persist from game start
      setBlockedPlayers(new Map())
      setCopyVoteRelations([])
      setCopyRevealEffects([])
      setShuffleEffect(null)
      
      // Reset our own voting state (keep current available cards)
      if (channelRef.current) {
        channelRef.current.track({
          userId,
          userName: userNameRef.current || null,
          hasVoted: false,
          vote: null,
          availableCards: specialCardsRef.current.map(c => c.type),
          online_at: new Date().toISOString(),
        })
      }
      
      addLogEntry('reset', `${senderName} started a new round`, senderName)
      setNotification({
        open: true,
        message: `${senderName} reset the voting`,
        severity: 'info',
      })
    })

    // Listen for ticket events
    channel.on('broadcast', { event: 'ticket_add' }, (payload) => {
      console.log('Received ticket add event:', payload)
      const ticket: JiraTicket = payload.payload.ticket
      const senderName = payload.payload.userName || 'Another user'
      
      setTickets((prev) => [...prev, ticket])
      addLogEntry('ticket', `${senderName} added ticket ${ticket.key}`, senderName)
      setNotification({
        open: true,
        message: `${senderName} added ticket ${ticket.key}`,
        severity: 'info',
      })
    })

    channel.on('broadcast', { event: 'ticket_remove' }, (payload) => {
      console.log('Received ticket remove event:', payload)
      const ticketId = payload.payload.ticketId
      const senderName = payload.payload.userName || 'Another user'
      
      setTickets((prev) => prev.filter((t) => t.id !== ticketId))
      // If removed ticket was active, clear active ticket
      setActiveTicketId((prev) => prev === ticketId ? null : prev)
      setNotification({
        open: true,
        message: `${senderName} removed a ticket`,
        severity: 'info',
      })
    })

    // Listen for ticket selection event
    channel.on('broadcast', { event: 'ticket_select' }, (payload) => {
      console.log('Received ticket select event:', payload)
      const { ticketId, ticketKey } = payload.payload
      const senderName = payload.payload.userName || 'Admin'
      
      setActiveTicketId(ticketId)
      setNotification({
        open: true,
        message: ticketKey ? `${senderName} selected ticket ${ticketKey}` : `${senderName} cleared active ticket`,
        severity: 'info',
      })
    })

    // Listen for ticket edit event
    channel.on('broadcast', { event: 'ticket_edit' }, (payload) => {
      console.log('Received ticket edit event:', payload)
      const { ticketId, newKey } = payload.payload
      const senderName = payload.payload.userName || 'Another user'
      
      setTickets((prev) => 
        prev.map((t) => t.id === ticketId ? { ...t, key: newKey } : t)
      )
      setNotification({
        open: true,
        message: `${senderName} updated ticket to ${newKey}`,
        severity: 'info',
      })
    })

    // Listen for poke events
    channel.on('broadcast', { event: 'poke' }, (payload) => {
      console.log('Received poke event:', payload)
      const { targetUserId, targetUserName } = payload.payload
      const senderName = payload.payload.userName || 'Someone'
      
      addLogEntry('poke', `${senderName} poked ${targetUserName || 'someone'}`, senderName)
      
      // Only show poke effect if we are the target
      if (targetUserId === userId) {
        setPokeEvent({
          id: `${Date.now()}-${Math.random()}`,
          pokedBy: payload.payload.userId,
          pokedByName: senderName,
        })
      }
    })

    // Listen for special card grant events
    channel.on('broadcast', { event: 'grant_special_card' }, (payload) => {
      console.log('Received special card grant event:', payload)
      const { targetUserId, card } = payload.payload
      const senderName = payload.payload.userName || 'Admin'
      
      // Only add the card if we are the target
      if (targetUserId === userId) {
        setSpecialCards((prev) => [...prev, card])
        const cardInfo = SPECIAL_CARD_INFO[card.type as SpecialCardType]
        setNotification({
          open: true,
          message: `${senderName} granted you a ${cardInfo.label} card! ${cardInfo.icon}`,
          severity: 'success',
        })
      }
    })

    // Listen for block player events
    channel.on('broadcast', { event: 'block_player' }, (payload) => {
      console.log('Received block player event:', payload)
      const { targetUserId, targetUserName } = payload.payload
      const blockerName = payload.payload.userName || 'Someone'
      const blockerId = payload.payload.userId
      
      // Add to blocked players map
      setBlockedPlayers((prev) => {
        const newMap = new Map(prev)
        newMap.set(targetUserId, { blockedBy: blockerId, blockedByName: blockerName })
        return newMap
      })
      
      addLogEntry('block', `${blockerName} blocked ${targetUserName || 'someone'} from voting`, blockerName)
      
      // If we are the target, show notification
      if (targetUserId === userId) {
        setNotification({
          open: true,
          message: `${blockerName} blocked you from voting! 🚫 You will get the average vote.`,
          severity: 'info',
        })
      } else {
        setNotification({
          open: true,
          message: `${blockerName} blocked ${targetUserName || 'a player'} from voting! 🚫`,
          severity: 'info',
        })
      }
    })

    // Listen for copy vote events (secret - no notification until reveal)
    channel.on('broadcast', { event: 'copy_vote' }, (payload) => {
      console.log('Received copy vote event:', payload)
      const { targetUserId, targetUserName } = payload.payload
      const copierUserId = payload.payload.userId
      const copierUserName = payload.payload.userName || 'Someone'
      
      // Store the copy relationship - will be revealed later
      setCopyVoteRelations((prev) => [
        ...prev,
        { copierUserId, copierUserName, targetUserId, targetUserName }
      ])
      
      // Log the copy action (secretly noted in log)
      addLogEntry('copy', `${copierUserName} is copying ${targetUserName || 'someone'}`, copierUserName)
      
      // Only show subtle notification to the copier
      if (copierUserId === userId) {
        // Already handled in handleCopyPlayer
      }
    })

    // Listen for shuffle player events
    channel.on('broadcast', { event: 'shuffle_player' }, (payload) => {
      console.log('Received shuffle player event:', payload)
      const { targetUserId, cardOrder, targetUserName } = payload.payload
      const shufflerName = payload.payload.userName || 'Someone'
      const shufflerId = payload.payload.userId
      
      addLogEntry('shuffle', `${shufflerName} shuffled ${targetUserName || 'someone'}'s cards`, shufflerName)
      
      // Only apply shuffle effect if we are the target
      if (targetUserId === userId) {
        setShuffleEffect({
          shuffledBy: shufflerId,
          shuffledByName: shufflerName,
          cardOrder,
          isAnimating: true,
        })
        
        // Stop animation after 2 seconds
        setTimeout(() => {
          setShuffleEffect((prev) => prev ? { ...prev, isAnimating: false } : null)
        }, 2000)
        
        setNotification({
          open: true,
          message: `🔀 ${shufflerName} shuffled your cards! Good luck finding the right one!`,
          severity: 'info',
        })
      } else {
        setNotification({
          open: true,
          message: `🔀 ${shufflerName} shuffled ${payload.payload.targetUserName || 'someone'}'s cards!`,
          severity: 'info',
        })
      }
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Connected to room: ${roomId}`)
        
        // Grant all special cards to the user when joining
        const initialCards = generateInitialCards('system', 'Game Start')
        setSpecialCards(initialCards)
        
        // Track this user's presence with voting status and available cards
        await channel.track({
          userId,
          userName: userNameRef.current || null,
          hasVoted: false,
          vote: null,
          availableCards: ALL_SPECIAL_CARD_TYPES,
          online_at: new Date().toISOString(),
        })
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [roomId, userId]) // Removed userName to prevent reconnections on name change

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
          userId,
          userName: userName || null,
          timestamp: new Date().toISOString(),
        },
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
        severity: 'error',
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

  const handleResetVoting = () => {
    setGameState('VOTING')
    setBlockedPlayers(new Map())
    setActiveTargeting(null)
    setCopyVoteRelations([])
    setCopyRevealEffects([])
    setShuffleEffect(null)
    
    // Note: Special cards are NOT refreshed - they persist from game start
    // Cards are only granted when joining the room
    
    sendEvent('reset_voting', { action: 'reset_voting' })
    
    // Reset our own voting status (keep current available cards)
    if (channelRef.current) {
      channelRef.current.track({
        userId,
        userName: userName || null,
        hasVoted: false,
        vote: null,
        availableCards: getAvailableCardTypes(),
        online_at: new Date().toISOString(),
      })
    }
  }

  const handleRevealCards = () => {
    setGameState('REVEALED')
    sendEvent('reveal_cards', { action: 'reveal' })
  }

  // Get available card types from current special cards
  const getAvailableCardTypes = (): SpecialCardType[] => {
    return specialCardsRef.current.map(c => c.type)
  }

  const updateVotingStatus = async (hasVoted: boolean, vote: string | null = null) => {
    if (channelRef.current) {
      await channelRef.current.track({
        userId,
        userName: userName || null,
        hasVoted,
        vote,
        availableCards: getAvailableCardTypes(),
        online_at: new Date().toISOString(),
      })
      console.log(`Updated voting status: ${hasVoted ? 'Voted' : 'Thinking'}`, vote ? `Vote: ${vote}` : '')
    }
  }

  const handleAddTicket = (key: string) => {
    const ticket: JiraTicket = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      key,
      addedBy: userId,
      addedByName: userName || null,
      timestamp: new Date().toISOString(),
    }
    
    setTickets((prev) => [...prev, ticket])
    sendEvent('ticket_add', { ticket })
  }

  const handleRemoveTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId))
    // If removed ticket was active, clear active ticket
    if (activeTicketId === ticketId) {
      setActiveTicketId(null)
    }
    sendEvent('ticket_remove', { ticketId })
  }

  const handleSelectTicket = (ticketId: string | null) => {
    const ticket = tickets.find((t) => t.id === ticketId)
    setActiveTicketId(ticketId)
    sendEvent('ticket_select', { ticketId, ticketKey: ticket?.key || null })
  }

  const handleNextTicket = () => {
    if (tickets.length === 0) return
    
    const currentIndex = activeTicketId 
      ? tickets.findIndex((t) => t.id === activeTicketId)
      : -1
    
    const nextIndex = (currentIndex + 1) % tickets.length
    const nextTicket = tickets[nextIndex]
    
    setActiveTicketId(nextTicket.id)
    sendEvent('ticket_select', { ticketId: nextTicket.id, ticketKey: nextTicket.key })
  }

  const handleEditTicket = (ticketId: string, newKey: string) => {
    setTickets((prev) => 
      prev.map((t) => t.id === ticketId ? { ...t, key: newKey } : t)
    )
    sendEvent('ticket_edit', { ticketId, newKey })
  }

  const handlePokeUser = (targetUserId: string, targetUserName: string | null) => {
    sendEvent('poke', { targetUserId, targetUserName })
    setNotification({
      open: true,
      message: `You poked ${targetUserName || 'someone'}! 👆`,
      severity: 'info',
    })
  }

  const handleGrantSpecialCard = (targetUserId: string, targetUserName: string | null, cardType: SpecialCardType) => {
    const card: SpecialCard = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: cardType,
      grantedBy: userId,
      grantedByName: userName || null,
      grantedAt: new Date().toISOString(),
    }
    
    sendEvent('grant_special_card', { targetUserId, targetUserName, card })
    
    const cardInfo = SPECIAL_CARD_INFO[cardType]
    setNotification({
      open: true,
      message: `Granted ${cardInfo.label} card to ${targetUserName || 'player'}! ${cardInfo.icon}`,
      severity: 'success',
    })
  }

  // Activate a special card and enter targeting mode
  const activateSpecialCard = (cardId: string, cardType: SpecialCardType) => {
    setActiveTargeting({ cardId, cardType })
    const cardInfo = SPECIAL_CARD_INFO[cardType]
    setNotification({
      open: true,
      message: `${cardInfo.icon} Select a player to use ${cardInfo.label} on!`,
      severity: 'info',
    })
  }

  // Cancel targeting mode
  const cancelTargeting = () => {
    setActiveTargeting(null)
  }

  // Block a player from voting
  const handleBlockPlayer = (targetUserId: string, targetUserName: string | null) => {
    if (!activeTargeting || activeTargeting.cardType !== 'BLOCK') return
    
    // Add to local blocked players
    setBlockedPlayers((prev) => {
      const newMap = new Map(prev)
      newMap.set(targetUserId, { blockedBy: userId, blockedByName: userName || null })
      return newMap
    })
    
    // Broadcast the block event
    sendEvent('block_player', { targetUserId, targetUserName })
    
    // Consume the card
    const newCards = specialCardsRef.current.filter((c) => c.id !== activeTargeting.cardId)
    setSpecialCards(newCards)
    
    // Update presence with new available cards
    if (channelRef.current) {
      const currentPresence = channelRef.current.presenceState()[userId]?.[0] as any
      channelRef.current.track({
        ...currentPresence,
        availableCards: newCards.map(c => c.type),
        online_at: new Date().toISOString(),
      })
    }
    
    // Exit targeting mode
    setActiveTargeting(null)
    
    setNotification({
      open: true,
      message: `You blocked ${targetUserName || 'a player'} from voting! 🚫`,
      severity: 'success',
    })
  }

  const handleUseSpecialCard = (cardId: string, cardType: SpecialCardType) => {
    // For cards that need targeting, activate targeting mode
    if (cardType === 'BLOCK' || cardType === 'COPY' || cardType === 'SHUFFLE') {
      activateSpecialCard(cardId, cardType)
    }
  }

  // Check if current user is blocked
  const isCurrentUserBlocked = blockedPlayers.has(userId)

  // Calculate average vote from non-blocked players
  const calculateAverageVote = (): string => {
    const validVotes = players
      .filter((p) => !blockedPlayers.has(p.userId) && p.vote !== null)
      .map((p) => parseFloat(p.vote!))
      .filter((v) => !isNaN(v))
    
    if (validVotes.length === 0) return '0'
    
    const sum = validVotes.reduce((acc, v) => acc + v, 0)
    const avg = sum / validVotes.length
    
    // Round to nearest Fibonacci-ish number
    const fibNumbers = [0, 1, 2, 3, 5, 8, 13, 21]
    const closest = fibNumbers.reduce((prev, curr) => 
      Math.abs(curr - avg) < Math.abs(prev - avg) ? curr : prev
    )
    
    return closest.toString()
  }

  // Copy another player's vote (secret until reveal)
  const handleCopyPlayer = (targetUserId: string, targetUserName: string | null) => {
    if (!activeTargeting || activeTargeting.cardType !== 'COPY') return
    
    // Store the copy relationship locally
    setCopyVoteRelations((prev) => [
      ...prev,
      { 
        copierUserId: userId, 
        copierUserName: userName || null, 
        targetUserId, 
        targetUserName 
      }
    ])
    
    // Broadcast the copy event (other players will know but it's secret until reveal)
    sendEvent('copy_vote', { targetUserId, targetUserName })
    
    // Consume the card
    const newCards = specialCardsRef.current.filter((c) => c.id !== activeTargeting.cardId)
    setSpecialCards(newCards)
    
    // Update presence with new available cards
    if (channelRef.current) {
      const currentPresence = channelRef.current.presenceState()[userId]?.[0] as any
      channelRef.current.track({
        ...currentPresence,
        availableCards: newCards.map(c => c.type),
        online_at: new Date().toISOString(),
      })
    }
    
    // Exit targeting mode
    setActiveTargeting(null)
    
    setNotification({
      open: true,
      message: `🤫 Secretly copying ${targetUserName || 'a player'}'s vote... Shh!`,
      severity: 'success',
    })
  }

  // Shuffle another player's cards
  const handleShufflePlayer = (targetUserId: string, targetUserName: string | null) => {
    if (!activeTargeting || activeTargeting.cardType !== 'SHUFFLE') return
    
    // Generate random card order (shuffle the indices 0-7)
    const cardOrder = [0, 1, 2, 3, 4, 5, 6, 7]
    for (let i = cardOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardOrder[i], cardOrder[j]] = [cardOrder[j], cardOrder[i]];
    }
    
    // Broadcast the shuffle event
    sendEvent('shuffle_player', { targetUserId, targetUserName, cardOrder })
    
    // Consume the card
    const newCards = specialCardsRef.current.filter((c) => c.id !== activeTargeting.cardId)
    setSpecialCards(newCards)
    
    // Update presence with new available cards
    if (channelRef.current) {
      const currentPresence = channelRef.current.presenceState()[userId]?.[0] as any
      channelRef.current.track({
        ...currentPresence,
        availableCards: newCards.map(c => c.type),
        online_at: new Date().toISOString(),
      })
    }
    
    // Exit targeting mode
    setActiveTargeting(null)
    
    setNotification({
      open: true,
      message: `🔀 You shuffled ${targetUserName || 'a player'}'s cards! Let's see them try to vote now!`,
      severity: 'success',
    })
  }

  // Get the vote a player should have (handles copy relationships)
  const getEffectiveVote = (playerId: string): string | null => {
    // Find if this player is copying someone
    const copyRelation = copyVoteRelations.find(r => r.copierUserId === playerId)
    if (copyRelation) {
      // Get the target player's vote
      const targetPlayer = players.find(p => p.userId === copyRelation.targetUserId)
      return targetPlayer?.vote || null
    }
    // Return the player's own vote
    const player = players.find(p => p.userId === playerId)
    return player?.vote || null
  }

  // Check if current user is copying someone
  const currentUserCopyTarget = copyVoteRelations.find(r => r.copierUserId === userId)

  // Trigger copy reveal effects when cards are revealed
  const triggerCopyRevealEffects = () => {
    const effects: CopyRevealEffect[] = copyVoteRelations.map(relation => {
      const targetPlayer = players.find(p => p.userId === relation.targetUserId)
      return {
        id: `${Date.now()}-${Math.random()}`,
        copierUserId: relation.copierUserId,
        copierUserName: relation.copierUserName,
        targetUserId: relation.targetUserId,
        targetUserName: relation.targetUserName,
        copiedVote: targetPlayer?.vote || null,
      }
    })
    setCopyRevealEffects(effects)
  }

  // Clear copy reveal effects
  const clearCopyRevealEffects = () => {
    setCopyRevealEffects([])
  }

  // Handle target selection based on active targeting mode
  const handleTargetSelect = (targetUserId: string, targetUserName: string | null) => {
    if (!activeTargeting) return
    
    if (activeTargeting.cardType === 'BLOCK') {
      handleBlockPlayer(targetUserId, targetUserName)
    } else if (activeTargeting.cardType === 'COPY') {
      handleCopyPlayer(targetUserId, targetUserName)
    } else if (activeTargeting.cardType === 'SHUFFLE') {
      handleShufflePlayer(targetUserId, targetUserName)
    }
  }

  const clearPokeEvent = () => {
    setPokeEvent({ id: null, pokedBy: null, pokedByName: null })
  }

  const closeNotification = () => {
    setNotification({ ...notification, open: false })
  }

  const showNotification = (message: string, severity: 'success' | 'error' | 'info') => {
    setNotification({ open: true, message, severity })
  }

  const clearActionLog = () => {
    setActionLog([])
  }

  return {
    count,
    roomCreator,
    activeUsers,
    players,
    gameState,
    tickets,
    activeTicketId,
    pokeEvent,
    specialCards,
    blockedPlayers,
    activeTargeting,
    isCurrentUserBlocked,
    copyVoteRelations,
    copyRevealEffects,
    currentUserCopyTarget,
    shuffleEffect,
    actionLog,
    notification,
    handleIncrement,
    handleReset,
    handleResetVoting,
    handleRevealCards,
    updateVotingStatus,
    handleAddTicket,
    handleRemoveTicket,
    handleEditTicket,
    handleSelectTicket,
    handleNextTicket,
    handlePokeUser,
    handleGrantSpecialCard,
    handleUseSpecialCard,
    handleTargetSelect,
    cancelTargeting,
    calculateAverageVote,
    getEffectiveVote,
    triggerCopyRevealEffects,
    clearActionLog,
    clearCopyRevealEffects,
    clearPokeEvent,
    closeNotification,
    showNotification,
  }
}

