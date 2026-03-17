import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const ThemeContext = createContext(null)

const normalizeTheme = (value) => (value === 'dark' ? 'dark' : 'light')

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('light')

  const setTheme = useCallback((nextTheme) => {
    setThemeState(normalizeTheme(nextTheme))
  }, [])

  const refreshTheme = useCallback(async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      setTheme('light')
      return
    }

    try {
      const response = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTheme(response.data?.theme)
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
      }
      setTheme('light')
    }
  }, [setTheme])

  useEffect(() => {
    refreshTheme()
  }, [refreshTheme])

  useEffect(() => {
    document.body.classList.toggle('theme-dark', theme === 'dark')
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    refreshTheme
  }), [theme, setTheme, refreshTheme])

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
