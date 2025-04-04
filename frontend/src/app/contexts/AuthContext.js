// app/contexts/AuthContext.js
'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
    }

    setLoading(false)
  }, [])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', authToken)
  }

// Enhanced logout function for AuthContext.js
const logout = () => {
  setUser(null)
  setToken(null)
  localStorage.removeItem('user')
  localStorage.removeItem('token')

  // Clear any other potential stored data
  sessionStorage.clear() // Clear session storage too if you're using it

  // You could also add this if needed
  window.location.href = '/login' // Force a full page reload to clear any in-memory state
}
  // Add this computed property
  const isAuthenticated = !!user && !!token

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}