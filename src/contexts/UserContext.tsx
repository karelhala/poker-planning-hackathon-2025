import React, { createContext, useContext, useState, ReactNode } from 'react'

interface UserContextType {
  userId: string
  userName: string | null
  setUserName: (name: string | null) => void
  jiraToken: string | null
  setJiraToken: (token: string | null) => void
  hasJiraToken: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

// Generate a UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Initialize or generate user ID
  const [userId] = useState<string>(() => {
    const existingUserId = localStorage.getItem('userId')
    if (existingUserId) {
      console.log('Existing user ID found:', existingUserId)
      return existingUserId
    }
    
    // Generate new UUID for first-time user
    const newUserId = generateUUID()
    localStorage.setItem('userId', newUserId)
    console.log('New user ID generated:', newUserId)
    return newUserId
  })

  // Initialize username from localStorage
  const [userName, setUserNameState] = useState<string | null>(() => {
    return localStorage.getItem('userName')
  })

  const setUserName = (name: string | null) => {
    if (name && name.trim()) {
      localStorage.setItem('userName', name.trim())
      setUserNameState(name.trim())
    } else {
      localStorage.removeItem('userName')
      setUserNameState(null)
    }
  }

  // Initialize JIRA token from localStorage
  const [jiraToken, setJiraTokenState] = useState<string | null>(() => {
    return localStorage.getItem('jiraToken')
  })

  const setJiraToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('jiraToken', token)
      setJiraTokenState(token)
    } else {
      localStorage.removeItem('jiraToken')
      setJiraTokenState(null)
    }
  }

  const hasJiraToken = Boolean(jiraToken)

  return (
    <UserContext.Provider value={{ userId, userName, setUserName, jiraToken, setJiraToken, hasJiraToken }}>
      {children}
    </UserContext.Provider>
  )
}

