import React, { createContext, useContext, useState, ReactNode } from 'react'

interface UserContextType {
  userId: string
  userName: string | null
  setUserName: (name: string | null) => void
  jiraToken: string | null
  setJiraToken: (token: string | null) => void
  jiraDomain: string | null
  setJiraDomain: (domain: string | null) => void
  jiraEmail: string | null
  setJiraEmail: (email: string | null) => void
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

  // Initialize JIRA credentials from localStorage
  const [jiraToken, setJiraTokenState] = useState<string | null>(() => {
    return localStorage.getItem('jiraToken')
  })

  const [jiraDomain, setJiraDomainState] = useState<string | null>(() => {
    return localStorage.getItem('jiraDomain')
  })

  const [jiraEmail, setJiraEmailState] = useState<string | null>(() => {
    return localStorage.getItem('jiraEmail')
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

  const setJiraDomain = (domain: string | null) => {
    if (domain) {
      localStorage.setItem('jiraDomain', domain)
      setJiraDomainState(domain)
    } else {
      localStorage.removeItem('jiraDomain')
      setJiraDomainState(null)
    }
  }

  const setJiraEmail = (email: string | null) => {
    if (email) {
      localStorage.setItem('jiraEmail', email)
      setJiraEmailState(email)
    } else {
      localStorage.removeItem('jiraEmail')
      setJiraEmailState(null)
    }
  }

  const hasJiraToken = Boolean(jiraToken && jiraDomain && jiraEmail)

  return (
    <UserContext.Provider value={{ 
      userId, 
      userName, 
      setUserName, 
      jiraToken, 
      setJiraToken, 
      jiraDomain,
      setJiraDomain,
      jiraEmail,
      setJiraEmail,
      hasJiraToken 
    }}>
      {children}
    </UserContext.Provider>
  )
}

