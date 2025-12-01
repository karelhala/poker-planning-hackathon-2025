import React, { createContext, useContext, useState, ReactNode } from 'react'

interface JiraContextType {
  jiraToken: string | null
  setJiraToken: (token: string | null) => void
  hasToken: boolean
}

const JiraContext = createContext<JiraContextType | undefined>(undefined)

export const useJira = () => {
  const context = useContext(JiraContext)
  if (context === undefined) {
    throw new Error('useJira must be used within a JiraProvider')
  }
  return context
}

interface JiraProviderProps {
  children: ReactNode
}

export const JiraProvider: React.FC<JiraProviderProps> = ({ children }) => {
  const [jiraToken, setJiraTokenState] = useState<string | null>(() => {
    // Initialize from localStorage
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

  const hasToken = Boolean(jiraToken)

  return (
    <JiraContext.Provider value={{ jiraToken, setJiraToken, hasToken }}>
      {children}
    </JiraContext.Provider>
  )
}

