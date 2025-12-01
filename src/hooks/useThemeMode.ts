import { useState, useEffect } from 'react'
import { PaletteMode, useMediaQuery } from '@mui/material'

export const useThemeMode = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode') as PaletteMode | null
    return savedMode || (prefersDarkMode ? 'dark' : 'light')
  })

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode')
    if (!savedMode) {
      setMode(prefersDarkMode ? 'dark' : 'light')
    }
  }, [prefersDarkMode])

  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light'
      localStorage.setItem('themeMode', newMode)
      return newMode
    })
  }

  return { mode, toggleColorMode }
}

