import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useUser } from '../contexts/UserContext'
import { useRoom } from '../contexts/RoomContext'
import { useSyncRef } from './useSyncRef'
import { loadAvatarConfig } from '../services/avatarService'

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
  avatarConfig?: Record<string, unknown>
  itemCount?: number
  ghostChipCount?: number
}

interface MemberRecord {
  userId: string
  userName: string | null
  hasVoted: boolean
  vote: string | null
  availableCards: SpecialCardType[]
  isOnline: boolean
  lastSeen: number
  graceTimerId: ReturnType<typeof setTimeout> | null
  avatarConfig?: Record<string, unknown>
  itemCount?: number
  ghostChipCount?: number
  pokerFaceActive?: boolean
}

const GRACE_PERIOD_MS = 900_000
const BG_HEARTBEAT_INTERVAL_MS = 45_000
const FG_HEARTBEAT_INTERVAL_MS = 20_000

export type GameState = 'VOTING' | 'REVEALED' | 'QUICK_DRAW'
export type VotingMode = 'fibonacci' | 'tshirt'

export const TSHIRT_SIZES = ['S', 'M', 'L', 'XL'] as const
export const TSHIRT_NUMERIC_MAP: Record<string, number> = { S: 2, M: 5, L: 8, XL: 13 }
export const NUMERIC_TSHIRT_MAP: Record<number, string> = { 2: 'S', 5: 'M', 8: 'L', 13: 'XL' }

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
  type: 'join' | 'leave' | 'vote' | 'reveal' | 'reset' | 'poke' | 'block' | 'copy' | 'shuffle' | 'ticket' | 'info' | 'quickdraw';
  message: string;
  userName?: string | null;
  icon: string;
}

export interface QuickDrawState {
  active: boolean;
  cards: string[]; // The 3 card options
  endTime: number; // Timestamp when quick draw ends
  participants: Map<string, string>; // UserId -> their quick draw vote
  triggeredBy: string | null;
  triggeredByName: string | null;
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
  const { roomId, getRoomAdmin, setRoomAdmin } = useRoom()
  const [count, setCount] = useState(0)
  const [roomCreator, setRoomCreator] = useState<string | null>(() => {
    return roomId ? getRoomAdmin(roomId) : null
  })
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
  const [quickDraw, setQuickDraw] = useState<QuickDrawState>({
    active: false,
    cards: [],
    endTime: 0,
    participants: new Map(),
    triggeredBy: null,
    triggeredByName: null,
  })
  const [doublePowerPlayers, setDoublePowerPlayers] = useState<Set<string>>(new Set())
  const [halfPowerPlayers, setHalfPowerPlayers] = useState<Set<string>>(new Set())
  const [rainEvent, setRainEvent] = useState<{ size: 'small' | 'medium' | 'large'; id: string } | null>(null)
  const [tomatoSplats, setTomatoSplats] = useState<Map<string, { thrownBy: string; id: string }>>(new Map())
  const [applauseEvents, setApplauseEvents] = useState<Map<string, { userName: string; id: string }>>(new Map())
  const [megaphoneEvents, setMegaphoneEvents] = useState<Map<string, { userName: string; id: string }>>(new Map())
  const [earthquakeActive, setEarthquakeActive] = useState(false)
  const [feltColor, setFeltColor] = useState<string | null>(null)
  const [diceRollEvent, setDiceRollEvent] = useState<{ userName: string; value: string; scale: string[] } | null>(null)
  const [resetRound, setResetRound] = useState(0)
  const [votingMode, setVotingMode] = useState<VotingMode>('fibonacci')
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now())
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([])
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success',
  })
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const userNameRef = useRef(userName)
  const knownUsersRef = useRef<Set<string>>(new Set())
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isReconnectingRef = useRef(false)
  const memberMapRef = useRef<Map<string, MemberRecord>>(new Map())
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      quickdraw: '⚡',
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
  const isFirstUserRef = useRef(
    roomId ? getRoomAdmin(roomId) === userId : false
  )
  const countRef = useSyncRef(count)
  const roomCreatorRef = useSyncRef(roomCreator)
  const activeUsersRef = useSyncRef(activeUsers)
  const ticketsRef = useSyncRef(tickets)
  const activeTicketIdRef = useSyncRef(activeTicketId)
  const specialCardsRef = useSyncRef(specialCards)
  const quickDrawRef = useSyncRef(quickDraw)
  const votingModeRef = useSyncRef(votingMode)

  const hasVotedRef = useRef(false)
  const currentVoteRef = useRef<string | null>(null)
  const itemCountRef = useRef(0)
  const ghostChipCountRef = useRef(0)
  const pokerFaceActiveRef = useRef(false)

  const buildPresence = (overrides?: Record<string, unknown>) => ({
    userId,
    userName: userNameRef.current || null,
    hasVoted: hasVotedRef.current,
    vote: currentVoteRef.current,
    availableCards: specialCardsRef.current.length > 0
      ? specialCardsRef.current.map(c => c.type)
      : ALL_SPECIAL_CARD_TYPES,
    avatarConfig: loadAvatarConfig(),
    itemCount: itemCountRef.current,
    ghostChipCount: ghostChipCountRef.current,
    pokerFaceActive: pokerFaceActiveRef.current,
    online_at: new Date().toISOString(),
    ...overrides,
  })
  useEffect(() => {
    const myPlayer = players.find(p => p.userId === userId)
    hasVotedRef.current = myPlayer?.hasVoted ?? false
    currentVoteRef.current = myPlayer?.vote ?? null
  }, [players, userId])

  const syncStateFromMemberMap = () => {
    const map = memberMapRef.current
    const newPlayers: Player[] = []
    const newActiveUsers: RoomUser[] = []

    map.forEach((record) => {
      newActiveUsers.push({ userId: record.userId, userName: record.userName })
      // Poker Face: hide voted status from other players (not from self)
      const effectiveHasVoted = record.pokerFaceActive && record.userId !== userId
        ? false
        : record.hasVoted
      newPlayers.push({
        userId: record.userId,
        userName: record.userName,
        hasVoted: effectiveHasVoted,
        vote: record.vote,
        isOnline: record.isOnline,
        availableCards: record.availableCards,
        avatarConfig: record.avatarConfig,
        itemCount: record.itemCount,
        ghostChipCount: record.ghostChipCount,
      })
    })

    setActiveUsers(newActiveUsers)
    setPlayers(newPlayers)
  }

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
      memberMapRef.current.forEach((record) => {
        if (record.graceTimerId) clearTimeout(record.graceTimerId)
      })
      memberMapRef.current.clear()
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

    const startGraceTimer = (uid: string, record: MemberRecord) => {
      if (record.graceTimerId) return
      record.graceTimerId = setTimeout(() => {
        memberMapRef.current.delete(uid)
        knownUsersRef.current.delete(uid)
        addLogEntry('leave', `${record.userName || 'Someone'} left the room`, record.userName)

        if (uid === roomCreatorRef.current) {
          const remaining = Array.from(memberMapRef.current.keys()).sort()
          if (remaining.length > 0) {
            const newAdmin = remaining[0]
            setRoomCreator(newAdmin)
            if (roomId) setRoomAdmin(roomId, newAdmin)
            isFirstUserRef.current = newAdmin === userId
            if (newAdmin === userId) {
              addLogEntry('info', 'You are now the room admin', userNameRef.current)
              setNotification({ open: true, message: 'Previous admin left. You are now the room admin.', severity: 'info' })
            }
          }
        }

        syncStateFromMemberMap()
      }, GRACE_PERIOD_MS)
    }

    // Track presence (who's in the room) using a membership map
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const onlineUserIds = new Set<string>()

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[]
          presences.forEach((presence) => {
            const uid = presence.userId as string
            onlineUserIds.add(uid)

            const existing = memberMapRef.current.get(uid)

            if (existing?.graceTimerId) {
              clearTimeout(existing.graceTimerId)
              existing.graceTimerId = null
            }

            memberMapRef.current.set(uid, {
              userId: uid,
              userName: presence.userName || null,
              hasVoted: presence.hasVoted || false,
              vote: presence.vote || null,
              availableCards: presence.availableCards || [],
              avatarConfig: presence.avatarConfig || undefined,
              itemCount: presence.itemCount || 0,
              ghostChipCount: presence.ghostChipCount || 0,
              pokerFaceActive: presence.pokerFaceActive || false,
              isOnline: true,
              lastSeen: Date.now(),
              graceTimerId: null,
            })
          })
        })

        memberMapRef.current.forEach((record, uid) => {
          if (!onlineUserIds.has(uid) && record.isOnline) {
            record.isOnline = false
            startGraceTimer(uid, record)
          }
        })

        syncStateFromMemberMap()

        const allUsers = Array.from(memberMapRef.current.values())
        const persistedAdmin = roomId ? getRoomAdmin(roomId) : null
        if (persistedAdmin) {
          setRoomCreator(persistedAdmin)
          isFirstUserRef.current = persistedAdmin === userId
        } else if (allUsers.length === 1 && allUsers[0].userId === userId) {
          isFirstUserRef.current = true
          setRoomCreator(userId)
          if (roomId) setRoomAdmin(roomId, userId)
        } else if (allUsers.length === 1) {
          setRoomCreator(allUsers[0].userId)
          if (roomId) setRoomAdmin(roomId, allUsers[0].userId)
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          const uid = presence.userId as string
          const existing = memberMapRef.current.get(uid)

          if (existing?.graceTimerId) {
            clearTimeout(existing.graceTimerId)
            existing.graceTimerId = null
          }

          if (existing) {
            existing.isOnline = true
            existing.lastSeen = Date.now()
            existing.userName = presence.userName || existing.userName
          }

          if (uid !== userId && !knownUsersRef.current.has(uid)) {
            knownUsersRef.current.add(uid)
            addLogEntry('join', `${presence.userName || 'Someone'} joined the room`, presence.userName)
          }
        })

        syncStateFromMemberMap()

        // If we ARE the creator (first user) and someone joins, send them current state
        if (isFirstUserRef.current && newPresences.length > 0) {
          const newUserId = newPresences[0].userId
          if (newUserId !== userId) {
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
                  votingMode: votingModeRef.current,
                  userId,
                  userName: userNameRef.current,
                  timestamp: new Date().toISOString(),
                },
              })
            }, 500)
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          const uid = presence.userId as string
          const record = memberMapRef.current.get(uid)
          if (record && record.isOnline) {
            record.isOnline = false
            record.lastSeen = Date.now()
            startGraceTimer(uid, record)
          }
        })

        syncStateFromMemberMap()
      })

    // Listen for state sync (when we join and someone sends us the state)
    channel.on('broadcast', { event: 'state_sync' }, (payload) => {
      console.log('Received room state:', payload)
      const { count: syncCount, roomCreator: creator, tickets: syncTickets, activeTicketId: syncActiveTicketId, votingMode: syncVotingMode } = payload.payload

      setCount(syncCount)
      setRoomCreator(creator)
      if (roomId && creator) setRoomAdmin(roomId, creator)
      setTickets(syncTickets || [])
      setActiveTicketId(syncActiveTicketId || null)
      if (syncVotingMode) setVotingMode(syncVotingMode)
      
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
      // Clear double/half power after it's been used for this round
      setDoublePowerPlayers(new Set())
      setHalfPowerPlayers(new Set())
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
      setEarthquakeActive(false)
      pokerFaceActiveRef.current = false
      hasVotedRef.current = false
      currentVoteRef.current = null
      setResetRound(r => r + 1)

      // Reset our own voting state (keep current available cards)
      if (channelRef.current) {
        channelRef.current.track(buildPresence({ hasVoted: false, vote: null, pokerFaceActive: false }))
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

    // Listen for quick draw start event
    channel.on('broadcast', { event: 'quick_draw_start' }, (payload) => {
      console.log('Received quick draw start event:', payload)
      const { cards, endTime } = payload.payload
      const triggeredByName = payload.payload.userName || 'Admin'
      const triggeredById = payload.payload.userId
      
      setGameState('QUICK_DRAW')
      setQuickDraw({
        active: true,
        cards,
        endTime,
        participants: new Map(),
        triggeredBy: triggeredById,
        triggeredByName,
      })
      
      addLogEntry('quickdraw', `⚡ ${triggeredByName} triggered QUICK DRAW! Choose fast!`, triggeredByName)
      
      setNotification({
        open: true,
        message: `⚡ QUICK DRAW! Choose one of ${cards.join(', ')} before time runs out!`,
        severity: 'info',
      })
    })

    // Listen for quick draw vote event
    channel.on('broadcast', { event: 'quick_draw_vote' }, (payload) => {
      console.log('Received quick draw vote event:', payload)
      const { oderId, vote } = payload.payload
      
      setQuickDraw((prev) => {
        const newParticipants = new Map(prev.participants)
        newParticipants.set(oderId, vote)
        return { ...prev, participants: newParticipants }
      })
    })

    // Listen for quick draw end event
    channel.on('broadcast', { event: 'quick_draw_end' }, (payload) => {
      console.log('Received quick draw end event:', payload)
      const { participantIds, participantVotes, winningVote } = payload.payload
      
      // Grant double power to participants
      setDoublePowerPlayers(new Set(participantIds))
      
      // Update current user's vote if they participated
      const myVote = participantVotes?.[userId]
      if (myVote && channelRef.current) {
        channelRef.current.track(buildPresence({ hasVoted: true, vote: myVote }))
      }
      
      // Check if current user participated
      const participated = participantIds.includes(userId)
      
      addLogEntry('quickdraw', `⚡ Quick Draw ended! Consensus: ${winningVote}. ${participantIds.length} players earned DOUBLE POWER!`, null)
      
      // Set to REVEALED to show results
      setGameState('REVEALED')
      setQuickDraw({
        active: false,
        cards: [],
        endTime: 0,
        participants: new Map(),
        triggeredBy: null,
        triggeredByName: null,
      })
      
      if (participated) {
        setNotification({
          open: true,
          message: `🎉 Quick Draw result: ${winningVote}! You earned DOUBLE POWER for next round!`,
          severity: 'success',
        })
      } else {
        setNotification({
          open: true,
          message: `Quick Draw ended. Consensus: ${winningVote}`,
          severity: 'info',
        })
      }
    })

    // Listen for coffee select events
    channel.on('broadcast', { event: 'coffee_select' }, (payload) => {
      console.log('Received coffee select event:', payload)
      const { oderId, odeName } = payload.payload
      
      // Add to half power players
      setHalfPowerPlayers((prev) => {
        const newSet = new Set(prev)
        newSet.add(oderId)
        return newSet
      })
      
      if (oderId !== userId) {
        addLogEntry('info', `☕ ${odeName || 'Someone'} is taking a coffee break (0.5x next round)`, odeName)
      }
    })

    // Listen for grant double power events
    channel.on('broadcast', { event: 'grant_double_power' }, (payload) => {
      console.log('Received grant double power event:', payload)
      const { targetUserId, targetUserName } = payload.payload
      const senderName = payload.payload.userName || 'Admin'
      
      setDoublePowerPlayers((prev) => {
        const newSet = new Set(prev)
        newSet.add(targetUserId)
        return newSet
      })
      
      if (targetUserId === userId) {
        setNotification({
          open: true,
          message: `⚡ ${senderName} granted you Double Power! Your next vote counts for 2!`,
          severity: 'success',
        })
      }
      
      addLogEntry('info', `⚡ ${senderName} granted Double Power to ${targetUserName || 'someone'}`, senderName)
    })

    // Listen for voting mode change events
    channel.on('broadcast', { event: 'voting_mode_change' }, (payload) => {
      console.log('Received voting mode change event:', payload)
      const { mode } = payload.payload
      const senderName = payload.payload.userName || 'Admin'

      setVotingMode(mode)
      addLogEntry('info', `${senderName} switched to ${mode === 'tshirt' ? 'T-Shirt sizing (S/M/L/XL)' : 'Fibonacci sizing'}`, senderName)
      setNotification({
        open: true,
        message: `${senderName} switched to ${mode === 'tshirt' ? 'T-Shirt sizing (S/M/L/XL)' : 'Fibonacci sizing'}`,
        severity: 'info',
      })
    })

    // Listen for grant half power events
    channel.on('broadcast', { event: 'grant_half_power' }, (payload) => {
      console.log('Received grant half power event:', payload)
      const { targetUserId, targetUserName } = payload.payload
      const senderName = payload.payload.userName || 'Admin'
      
      setHalfPowerPlayers((prev) => {
        const newSet = new Set(prev)
        newSet.add(targetUserId)
        return newSet
      })
      
      if (targetUserId === userId) {
        setNotification({
          open: true,
          message: `☕ ${senderName} gave you Half Power. Your next vote counts for 0.5x`,
          severity: 'info',
        })
      }
      
      addLogEntry('info', `☕ ${senderName} gave Half Power to ${targetUserName || 'someone'}`, senderName)
    })

    channel.on('broadcast', { event: 'make_it_rain' }, (payload) => {
      const { size, userName: senderName } = payload.payload
      setRainEvent({ size, id: `${Date.now()}` })
      addLogEntry('info', `💰 ${senderName || 'Admin'} made it rain! (${size})`, senderName)
      setNotification({
        open: true,
        message: `💰 ${senderName || 'Admin'} made it rain! Catch the chips!`,
        severity: 'info',
      })
    })

    channel.on('broadcast', { event: 'tomato_throw' }, (payload) => {
      const { targetUserId, thrownByName } = payload.payload
      const splatId = `${Date.now()}`
      setTomatoSplats(prev => {
        const next = new Map(prev)
        next.set(targetUserId, { thrownBy: thrownByName, id: splatId })
        return next
      })
      addLogEntry('info', `🍅 ${thrownByName || 'Someone'} threw a tomato at ${targetUserId === userId ? 'you' : 'someone'}!`, thrownByName)
      if (targetUserId === userId) {
        setNotification({ open: true, message: `🍅 ${thrownByName || 'Someone'} threw a tomato at you!`, severity: 'info' })
      }
      setTimeout(() => {
        setTomatoSplats(prev => {
          const next = new Map(prev)
          if (next.get(targetUserId)?.id === splatId) next.delete(targetUserId)
          return next
        })
      }, 3000)
    })

    channel.on('broadcast', { event: 'applause' }, (payload) => {
      const { userId: senderId, userName: senderName } = payload.payload
      const eventId = `${Date.now()}`
      setApplauseEvents(prev => {
        const next = new Map(prev)
        next.set(senderId, { userName: senderName || 'Someone', id: eventId })
        return next
      })
      addLogEntry('info', `👏 ${senderName || 'Someone'} triggered applause!`, senderName)
      setTimeout(() => {
        setApplauseEvents(prev => {
          const next = new Map(prev)
          if (next.get(senderId)?.id === eventId) next.delete(senderId)
          return next
        })
      }, 2500)
    })

    channel.on('broadcast', { event: 'dice_roll' }, (payload) => {
      const { userName: senderName, value, scale } = payload.payload
      setDiceRollEvent({ userName: senderName || 'Someone', value, scale })
      addLogEntry('info', `🎲 ${senderName || 'Someone'} rolled the dice!`, senderName)
    })

    channel.on('broadcast', { event: 'megaphone_vote' }, (payload) => {
      const { userId: senderId, userName: senderName } = payload.payload
      const eventId = `${Date.now()}`
      setMegaphoneEvents(prev => {
        const next = new Map(prev)
        next.set(senderId, { userName: senderName || 'Someone', id: eventId })
        return next
      })
      addLogEntry('info', `📢 ${senderName || 'Someone'} VOTED with a megaphone!`, senderName)
      setTimeout(() => {
        setMegaphoneEvents(prev => {
          const next = new Map(prev)
          if (next.get(senderId)?.id === eventId) next.delete(senderId)
          return next
        })
      }, 3000)
    })

    channel.on('broadcast', { event: 'earthquake' }, (payload) => {
      const senderName = payload.payload.userName || 'Someone'
      setEarthquakeActive(true)
      addLogEntry('info', `🌍 ${senderName} triggered an earthquake! Seats shuffling!`, senderName)
      setNotification({
        open: true,
        message: `🌍 ${senderName} caused an earthquake! Hold on!`,
        severity: 'info',
      })
    })

    channel.on('broadcast', { event: 'felt_color' }, (payload) => {
      const senderName = payload.payload.userName || 'Someone'
      const color = payload.payload.color as string
      setFeltColor(color)
      const label = color === 'rainbow' ? '🌈 Rainbow Table' : `🟩 ${color} felt`
      addLogEntry('info', `${senderName} changed the table to ${label}!`, senderName)
      setNotification({
        open: true,
        message: `${senderName} changed the felt to ${label}!`,
        severity: 'info',
      })
    })

    const trackPresence = async () => {
      const presenceData = buildPresence()
      console.log('Tracking presence:', presenceData)
      await channel.track(presenceData)
      console.log('Presence tracked successfully')
    }

    let hasInitialized = false

    const handleSubscriptionStatus = async (status: string) => {
      console.log(`Channel status: ${status}`)

      if (status === 'SUBSCRIBED') {
        isReconnectingRef.current = false

        if (!hasInitialized) {
          hasInitialized = true
          console.log(`Connected to room: ${roomId}`)
          const initialCards = generateInitialCards('system', 'Game Start')
          setSpecialCards(initialCards)
        } else {
          console.log(`Reconnected to room: ${roomId}`)
          setNotification({
            open: true,
            message: 'Reconnected to room',
            severity: 'success',
          })
        }

        await trackPresence()
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`Channel ${status}, will attempt reconnect...`)
        isReconnectingRef.current = true
        setNotification({
          open: true,
          message: 'Connection lost. Reconnecting...',
          severity: 'error',
        })
      }

      if (status === 'CLOSED') {
        console.log('Channel closed')
        isReconnectingRef.current = false
      }
    }

    channel.subscribe(handleSubscriptionStatus)

    channelRef.current = channel

    const sendHeartbeat = async () => {
      if (!channelRef.current) return
      try {
        await channelRef.current.track(buildPresence())
        setLastHeartbeat(Date.now())
      } catch (err) {
        console.warn('Heartbeat track failed:', err)
      }
    }

    const startHeartbeat = (intervalMs: number) => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, intervalMs)
    }

    startHeartbeat(FG_HEARTBEAT_INTERVAL_MS)

    const handleVisibilityChange = async () => {
      if (!channelRef.current) return

      if (document.visibilityState === 'visible') {
        startHeartbeat(FG_HEARTBEAT_INTERVAL_MS)

        const socket = (supabase as any).realtime
        const isConnected = socket?.isConnected?.() ?? socket?.conn?.readyState === 1

        if (!isConnected) {
          setNotification({ open: true, message: 'Reconnecting after inactivity...', severity: 'info' })
          socket?.connect?.()
          return
        }

        try {
          await sendHeartbeat()
        } catch (err) {
          console.error('Failed to re-track presence, forcing reconnect:', err)
          channel.unsubscribe()
          setTimeout(() => {
            channel.subscribe(handleSubscriptionStatus)
          }, 1000)
        }
      } else {
        startHeartbeat(BG_HEARTBEAT_INTERVAL_MS)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      memberMapRef.current.forEach((record) => {
        if (record.graceTimerId) clearTimeout(record.graceTimerId)
      })
      memberMapRef.current.clear()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      channel.unsubscribe()
    }
  }, [roomId, userId])

  const sendEvent = async (eventType: string, eventData: any, maxRetries = 3): Promise<boolean> => {
    const retryDelayMs = 500
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
          console.log(`Event sent (attempt ${attempt}):`, eventType, eventData)
          return true
        }
        throw new Error(`Send returned: ${response}`)
      } catch (err) {
        console.warn(`Event ${eventType} attempt ${attempt}/${maxRetries} failed:`, err)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt))
        } else {
          console.error(`Event ${eventType} failed after ${maxRetries} attempts`)
          setNotification({
            open: true,
            message: `Failed to send ${eventType}. Please try again.`,
            severity: 'error',
          })
          return false
        }
      }
    }
    return false
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

  const handleResetVoting = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    const success = await sendEvent('reset_voting', { action: 'reset_voting' })
    if (!success) { setIsProcessing(false); return }

    setGameState('VOTING')
    setBlockedPlayers(new Map())
    setActiveTargeting(null)
    setCopyVoteRelations([])
    setCopyRevealEffects([])
    setShuffleEffect(null)
    setEarthquakeActive(false)
    pokerFaceActiveRef.current = false
    hasVotedRef.current = false
    currentVoteRef.current = null
    setResetRound(r => r + 1)

    if (channelRef.current) {
      channelRef.current.track(buildPresence({ hasVoted: false, vote: null, pokerFaceActive: false }))
    }
    setIsProcessing(false)
  }

  const handleRevealCards = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const success = await sendEvent('reveal_cards', { action: 'reveal' })
      if (success) {
        setGameState('REVEALED')
        setDoublePowerPlayers(new Set())
        setHalfPowerPlayers(new Set())
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const updateVotingStatus = async (hasVoted: boolean, vote: string | null = null) => {
    if (channelRef.current) {
      await channelRef.current.track(buildPresence({ hasVoted, vote }))
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
    
    // Consume the card (unless admin - admin has unlimited cards)
    const isAdmin = userId === roomCreatorRef.current
    if (!isAdmin) {
      const newCards = specialCardsRef.current.filter((c) => c.id !== activeTargeting.cardId)
      setSpecialCards(newCards)
      
      // Update presence with new available cards
      if (channelRef.current) {
        channelRef.current.track(buildPresence({ availableCards: newCards.map(c => c.type) }))
      }
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
    if (votingMode === 'tshirt') {
      const validVotes = players
        .filter((p) => !blockedPlayers.has(p.userId) && p.vote !== null)
        .map((p) => TSHIRT_NUMERIC_MAP[p.vote!])
        .filter((v) => v !== undefined)

      if (validVotes.length === 0) return 'M'

      const avg = validVotes.reduce((acc, v) => acc + v, 0) / validVotes.length
      const tshirtValues = [2, 5, 8, 13]
      const closestNum = tshirtValues.reduce((prev, curr) =>
        Math.abs(curr - avg) < Math.abs(prev - avg) ? curr : prev
      )
      return NUMERIC_TSHIRT_MAP[closestNum]
    }

    const validVotes = players
      .filter((p) => !blockedPlayers.has(p.userId) && p.vote !== null)
      .map((p) => parseFloat(p.vote!))
      .filter((v) => !isNaN(v))

    if (validVotes.length === 0) return '0'

    const sum = validVotes.reduce((acc, v) => acc + v, 0)
    const avg = sum / validVotes.length

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
    
    // Consume the card (unless admin - admin has unlimited cards)
    const isAdmin = userId === roomCreatorRef.current
    if (!isAdmin) {
      const newCards = specialCardsRef.current.filter((c) => c.id !== activeTargeting.cardId)
      setSpecialCards(newCards)
      
      // Update presence with new available cards
      if (channelRef.current) {
        channelRef.current.track(buildPresence({ availableCards: newCards.map(c => c.type) }))
      }
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
    
    // Generate random card order
    const cardOrder = votingMode === 'tshirt'
      ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] // 10 items: 0-3 = S,M,L,XL + 4-9 = decoys
      : [0, 1, 2, 3, 4, 5, 6, 7]        // 8 items: Fibonacci indices
    for (let i = cardOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardOrder[i], cardOrder[j]] = [cardOrder[j], cardOrder[i]];
    }
    
    // Broadcast the shuffle event
    sendEvent('shuffle_player', { targetUserId, targetUserName, cardOrder })
    
    // Consume the card (unless admin - admin has unlimited cards)
    const isAdmin = userId === roomCreatorRef.current
    if (!isAdmin) {
      const newCards = specialCardsRef.current.filter((c) => c.id !== activeTargeting.cardId)
      setSpecialCards(newCards)
      
      // Update presence with new available cards
      if (channelRef.current) {
        channelRef.current.track(buildPresence({ availableCards: newCards.map(c => c.type) }))
      }
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

  // Calculate vote spread (difference between min and max)
  const calculateVoteSpread = (): { min: number; max: number; spread: number; average: number } => {
    const numericVotes = players
      .filter(p => p.vote !== null)
      .map(p => parseFloat(p.vote!))
      .filter(v => !isNaN(v))
    
    if (numericVotes.length < 2) return { min: 0, max: 0, spread: 0, average: 0 }
    
    const min = Math.min(...numericVotes)
    const max = Math.max(...numericVotes)
    const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
    
    return { min, max, spread: max - min, average }
  }

  // Get 3 card options around the average for quick draw
  const getQuickDrawCards = (average: number): string[] => {
    const FIBONACCI = [0, 1, 2, 3, 5, 8, 13, 21]
    
    // Find the closest fibonacci numbers to the average
    const sortedByDistance = [...FIBONACCI].sort((a, b) => 
      Math.abs(a - average) - Math.abs(b - average)
    )
    
    // Take 3 closest values
    return sortedByDistance.slice(0, 3).sort((a, b) => a - b).map(String)
  }

  // Trigger Quick Draw event (admin only)
  const handleTriggerQuickDraw = () => {
    const { average } = calculateVoteSpread()
    const cards = getQuickDrawCards(average)
    const endTime = Date.now() + 5000 // 5 seconds
    
    // Set local state first
    setGameState('QUICK_DRAW')
    setQuickDraw({
      active: true,
      cards,
      endTime,
      participants: new Map(),
      triggeredBy: userId,
      triggeredByName: userNameRef.current,
    })
    
    // Broadcast to others
    sendEvent('quick_draw_start', { cards, endTime })
    
    addLogEntry('quickdraw', `⚡ You triggered QUICK DRAW!`, userNameRef.current)
    
    // Auto-end quick draw after timer
    setTimeout(() => {
      handleEndQuickDraw()
    }, 5000)
  }

  // Participate in quick draw
  const handleQuickDrawVote = (vote: string) => {
    if (!quickDraw.active) return
    
    // Update local state
    setQuickDraw((prev) => {
      const newParticipants = new Map(prev.participants)
      newParticipants.set(userId, vote)
      return { ...prev, participants: newParticipants }
    })
    
    // Broadcast vote
    sendEvent('quick_draw_vote', { oderId: userId, odeName: userNameRef.current, vote })
    
    setNotification({
      open: true,
      message: `⚡ You picked ${vote}! Waiting for Quick Draw to end...`,
      severity: 'success',
    })
  }

  // End quick draw and award double power
  const handleEndQuickDraw = () => {
    // Use ref to get current state (avoid stale closure from setTimeout)
    const currentQuickDraw = quickDrawRef.current
    
    // Only end if still active
    if (!currentQuickDraw.active) return
    
    const participantIds = Array.from(currentQuickDraw.participants.keys())
    const participantVotes = Object.fromEntries(currentQuickDraw.participants)
    
    // Calculate winning vote (most common)
    const voteCounts = new Map<string, number>()
    currentQuickDraw.participants.forEach((vote) => {
      voteCounts.set(vote, (voteCounts.get(vote) || 0) + 1)
    })
    
    let winningVote = currentQuickDraw.cards[1] || '5' // Default to middle card
    let maxCount = 0
    voteCounts.forEach((count, vote) => {
      if (count > maxCount) {
        maxCount = count
        winningVote = vote
      }
    })
    
    // Grant double power to participants
    setDoublePowerPlayers(new Set(participantIds))
    
    // Broadcast end event with participant votes
    sendEvent('quick_draw_end', { participantIds, participantVotes, winningVote })
    
    // Update current user's vote if they participated
    const myVote = currentQuickDraw.participants.get(userId)
    if (myVote && channelRef.current) {
      channelRef.current.track(buildPresence({ hasVoted: true, vote: myVote }))
    }

    // Set to REVEALED to show results
    setGameState('REVEALED')
    setQuickDraw({
      active: false,
      cards: [],
      endTime: 0,
      participants: new Map(),
      triggeredBy: null,
      triggeredByName: null,
    })
    
    addLogEntry('quickdraw', `⚡ Quick Draw ended! Consensus: ${winningVote}`, null)
  }

  // Check if player has double power
  const hasDoublePower = (playerId: string): boolean => {
    return doublePowerPlayers.has(playerId)
  }

  // Check if player has half power
  const hasHalfPower = (playerId: string): boolean => {
    return halfPowerPlayers.has(playerId)
  }

  // Handle coffee selection - gives half power for next round
  const handleCoffeeSelect = () => {
    // Add current user to half power for next round
    setHalfPowerPlayers((prev) => {
      const newSet = new Set(prev)
      newSet.add(userId)
      return newSet
    })
    
    // Broadcast coffee selection
    sendEvent('coffee_select', { oderId: userId, odeName: userNameRef.current })
    
    addLogEntry('info', `☕ ${userNameRef.current || 'Someone'} is taking a coffee break (0.5x next round)`, userNameRef.current)
  }

  // Grant double power to a player (admin action)
  const handleGrantDoublePower = (targetUserId: string, targetUserName: string | null) => {
    setDoublePowerPlayers((prev) => {
      const newSet = new Set(prev)
      newSet.add(targetUserId)
      return newSet
    })
    
    sendEvent('grant_double_power', { targetUserId, targetUserName })
    
    addLogEntry('info', `⚡ ${userNameRef.current || 'Admin'} granted Double Power to ${targetUserName || 'someone'}`, userNameRef.current)
    
    setNotification({
      open: true,
      message: `⚡ Granted Double Power to ${targetUserName || 'player'}!`,
      severity: 'success',
    })
  }

  // Switch voting mode (admin action)
  const handleSetVotingMode = (mode: VotingMode) => {
    setVotingMode(mode)
    sendEvent('voting_mode_change', { mode })
    addLogEntry('info', `Switched to ${mode === 'tshirt' ? 'T-Shirt sizing (S/M/L/XL)' : 'Fibonacci sizing'}`, userNameRef.current)
  }

  // Grant half power to a player (admin action)
  const handleGrantHalfPower = (targetUserId: string, targetUserName: string | null) => {
    setHalfPowerPlayers((prev) => {
      const newSet = new Set(prev)
      newSet.add(targetUserId)
      return newSet
    })
    
    sendEvent('grant_half_power', { targetUserId, targetUserName })
    
    addLogEntry('info', `☕ ${userNameRef.current || 'Admin'} gave Half Power to ${targetUserName || 'someone'}`, userNameRef.current)
    
    setNotification({
      open: true,
      message: `☕ Gave Half Power to ${targetUserName || 'player'}!`,
      severity: 'success',
    })
  }

  const handleApplause = () => {
    const eventId = `${Date.now()}`
    sendEvent('applause', {})
    // Also show locally (broadcast self:false means sender doesn't get own event)
    setApplauseEvents(prev => {
      const next = new Map(prev)
      next.set(userId, { userName: userNameRef.current || 'You', id: eventId })
      return next
    })
    addLogEntry('info', `👏 You triggered applause!`, userNameRef.current)
    setTimeout(() => {
      setApplauseEvents(prev => {
        const next = new Map(prev)
        if (next.get(userId)?.id === eventId) next.delete(userId)
        return next
      })
    }, 2500)
  }

  const handleDiceRoll = (value: string, scale: string[]) => {
    sendEvent('dice_roll', { value, scale })
    // Show locally too (self:false means sender doesn't get own broadcast)
    setDiceRollEvent({ userName: userNameRef.current || 'You', value, scale })
    addLogEntry('info', `🎲 You rolled the dice!`, userNameRef.current)
  }

  const handleMegaphoneVote = () => {
    const eventId = `${Date.now()}`
    sendEvent('megaphone_vote', {})
    setMegaphoneEvents(prev => {
      const next = new Map(prev)
      next.set(userId, { userName: userNameRef.current || 'You', id: eventId })
      return next
    })
    addLogEntry('info', `📢 You VOTED with a megaphone!`, userNameRef.current)
    setTimeout(() => {
      setMegaphoneEvents(prev => {
        const next = new Map(prev)
        if (next.get(userId)?.id === eventId) next.delete(userId)
        return next
      })
    }, 3000)
  }

  const handleEarthquake = () => {
    sendEvent('earthquake', {})
    setEarthquakeActive(true)
    addLogEntry('info', '🌍 You triggered an earthquake!', userNameRef.current)
    setNotification({ open: true, message: '🌍 EARTHQUAKE! Seats keep shuffling!', severity: 'info' })
  }

  const handleSetFeltColor = (color: string) => {
    sendEvent('felt_color', { color })
    setFeltColor(color)
    const label = color === 'rainbow' ? '🌈 Rainbow Table' : `🟩 ${color} felt`
    addLogEntry('info', `You changed the table to ${label}!`, userNameRef.current)
    setNotification({ open: true, message: `Table felt changed to ${label}!`, severity: 'info' })
  }

  const handleThrowTomato = (targetUserId: string, targetUserName: string | null) => {
    sendEvent('tomato_throw', { targetUserId, targetUserName, thrownByName: userNameRef.current })
    setTomatoSplats(prev => {
      const next = new Map(prev)
      const splatId = `${Date.now()}`
      next.set(targetUserId, { thrownBy: userNameRef.current || 'You', id: splatId })
      setTimeout(() => {
        setTomatoSplats(p => {
          const n = new Map(p)
          if (n.get(targetUserId)?.id === splatId) n.delete(targetUserId)
          return n
        })
      }, 3000)
      return next
    })
    addLogEntry('info', `🍅 You threw a tomato at ${targetUserName || 'someone'}!`, userNameRef.current)
  }

  const setItemCount = (count: number) => {
    itemCountRef.current = count
  }

  const setGhostChipCount = (count: number) => {
    ghostChipCountRef.current = count
  }

  const setPokerFaceActive = (active: boolean) => {
    pokerFaceActiveRef.current = active
    if (channelRef.current) {
      channelRef.current.track(buildPresence())
    }
  }

  const refreshPresence = () => {
    if (channelRef.current) {
      channelRef.current.track(buildPresence())
    }
  }

  const handleMakeItRain = (size: 'small' | 'medium' | 'large') => {
    sendEvent('make_it_rain', { size, userName: userNameRef.current })
    addLogEntry('info', `💰 ${userNameRef.current || 'Admin'} made it rain! (${size})`, userNameRef.current)
  }

  return {
    count,
    roomCreator,
    activeUsers,
    players,
    gameState,
    votingMode,
    lastHeartbeat,
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
    quickDraw,
    doublePowerPlayers,
    halfPowerPlayers,
    actionLog,
    isProcessing,
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
    clearDiceRollEvent: () => setDiceRollEvent(null),
    megaphoneEvents,
    earthquakeActive,
    feltColor,
    refreshPresence,
    setItemCount,
    setGhostChipCount,
    setPokerFaceActive,
    resetRound,
    rainEvent,
    clearRainEvent: () => setRainEvent(null),
    clearActionLog,
    clearCopyRevealEffects,
    clearPokeEvent,
    closeNotification,
    showNotification,
  }
}

