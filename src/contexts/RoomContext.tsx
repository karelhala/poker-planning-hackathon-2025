import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface RoomContextType {
  roomId: string | null
  createRoom: () => void
  joinRoom: (id: string) => void
  leaveRoom: () => void
}

const RoomContext = createContext<RoomContextType | undefined>(undefined)

export const useRoom = () => {
  const context = useContext(RoomContext)
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider')
  }
  return context
}

interface RoomProviderProps {
  children: ReactNode
}

// Generate a short UUID for rooms (8 characters)
const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(() => {
    // Check URL for room ID on initial load
    const path = window.location.pathname
    const match = path.match(/\/room\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  })

  // Update URL when room changes
  useEffect(() => {
    if (roomId) {
      const newPath = `/room/${roomId}`
      window.history.pushState({}, '', newPath)
    } else {
      window.history.pushState({}, '', '/')
    }
  }, [roomId])

  const createRoom = () => {
    const newRoomId = generateRoomId()
    setRoomId(newRoomId)
  }

  const joinRoom = (id: string) => {
    setRoomId(id.toUpperCase())
  }

  const leaveRoom = () => {
    setRoomId(null)
  }

  return (
    <RoomContext.Provider value={{ roomId, createRoom, joinRoom, leaveRoom }}>
      {children}
    </RoomContext.Provider>
  )
}

