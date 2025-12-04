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

// Get base path from current URL (everything before /room)
const getBasePath = (): string => {
  const path = window.location.pathname
  const roomIndex = path.indexOf('/room')
  
  if (roomIndex > 0) {
    // URL contains /room, extract everything before it
    return path.substring(0, roomIndex)
  }
  
  // No /room in URL - remove trailing slash and return the path
  // This handles both "/" (dev) and "/poker-planning-hackathon-2025/" (prod)
  return path.replace(/\/+$/, '')
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const basePath = getBasePath()
  
  const [roomId, setRoomId] = useState<string | null>(() => {
    // Check URL for room ID on initial load
    const path = window.location.pathname
    const match = path.match(/\/room\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  })

  // Update URL when room changes
  useEffect(() => {
    if (roomId) {
      const newPath = `${basePath}/room/${roomId}`
      window.history.pushState({}, '', newPath)
    } else {
      // Stay on base path, don't go to root domain
      window.history.pushState({}, '', basePath + '/')
    }
  }, [roomId, basePath])

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

