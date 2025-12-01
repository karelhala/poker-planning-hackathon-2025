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

export const useSupabaseRealtime = () => {
  const { userId, userName } = useUser()
  const { roomId } = useRoom()
  const [count, setCount] = useState(0)
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: '',
    severity: 'success',
  })
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Only connect if in a room
    if (!roomId) {
      // No room - disconnect any existing channel
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      return
    }

    // Create room-specific channel
    const channelName = `poker-planning-room-${roomId}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
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

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Connected to room: ${roomId}`)
      }
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

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

  const closeNotification = () => {
    setNotification({ ...notification, open: false })
  }

  const showNotification = (message: string, severity: 'success' | 'error' | 'info') => {
    setNotification({ open: true, message, severity })
  }

  return {
    count,
    notification,
    handleIncrement,
    handleReset,
    closeNotification,
    showNotification,
  }
}

