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
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success',
  })
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isFirstUserRef = useRef(false)
  const countRef = useRef(count)
  const roomCreatorRef = useRef(roomCreator)
  const activeUsersRef = useRef(activeUsers)
  const ticketsRef = useRef(tickets)
  const activeTicketIdRef = useRef(activeTicketId)

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
      isFirstUserRef.current = false
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
                  userName,
                  timestamp: new Date().toISOString(),
                },
              })
            }, 500) // Small delay to ensure they're subscribed
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences)
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
      
      // Reset our own voting state
      if (channelRef.current) {
        channelRef.current.track({
          userId,
          userName: userName || null,
          hasVoted: false,
          vote: null,
          online_at: new Date().toISOString(),
        })
      }
      
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
      const { targetUserId } = payload.payload
      const senderName = payload.payload.userName || 'Someone'
      
      // Only show poke effect if we are the target
      if (targetUserId === userId) {
        setPokeEvent({
          id: `${Date.now()}-${Math.random()}`,
          pokedBy: payload.payload.userId,
          pokedByName: senderName,
        })
      }
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Connected to room: ${roomId}`)
        
        // Track this user's presence with voting status
        await channel.track({
          userId,
          userName: userName || null,
          hasVoted: false,
          vote: null,
          online_at: new Date().toISOString(),
        })
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [roomId, userId, userName])

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
    sendEvent('reset_voting', { action: 'reset_voting' })
    
    // Reset our own voting status
    if (channelRef.current) {
      channelRef.current.track({
        userId,
        userName: userName || null,
        hasVoted: false,
        vote: null,
        online_at: new Date().toISOString(),
      })
    }
  }

  const handleRevealCards = () => {
    setGameState('REVEALED')
    sendEvent('reveal_cards', { action: 'reveal' })
  }

  const updateVotingStatus = async (hasVoted: boolean, vote: string | null = null) => {
    if (channelRef.current) {
      await channelRef.current.track({
        userId,
        userName: userName || null,
        hasVoted,
        vote,
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

  const clearPokeEvent = () => {
    setPokeEvent({ id: null, pokedBy: null, pokedByName: null })
  }

  const closeNotification = () => {
    setNotification({ ...notification, open: false })
  }

  const showNotification = (message: string, severity: 'success' | 'error' | 'info') => {
    setNotification({ open: true, message, severity })
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
    clearPokeEvent,
    closeNotification,
    showNotification,
  }
}

