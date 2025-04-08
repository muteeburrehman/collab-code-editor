// app/contexts/AuthContext.js
'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth data
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      const storedAccessToken = localStorage.getItem('accessToken')
      const storedRefreshToken = localStorage.getItem('refreshToken')

      if (storedUser && (storedAccessToken || storedRefreshToken)) {
        try {
          setUser(JSON.parse(storedUser))
          setAccessToken(storedAccessToken)
          setRefreshToken(storedRefreshToken)

          // If we have a refresh token but no access token, get a new access token
          if (!storedAccessToken && storedRefreshToken) {
            refreshAccessToken(storedRefreshToken)
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          clearAuthData()
        }
      }

      setLoading(false)
    }
  }, [])

  const refreshAccessToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: token }),
      })

      if (response.ok) {
        const data = await response.json()
        setAccessToken(data.access_token)
        localStorage.setItem('accessToken', data.access_token)
        return data.access_token
      } else {
        // If refresh fails, log out the user
        logout()
        return null
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      logout()
      return null
    }
  }

  const login = (userData, authToken, refToken) => {
    setUser(userData)
    setAccessToken(authToken)
    setRefreshToken(refToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('accessToken', authToken)
    localStorage.setItem('refreshToken', refToken)
  }

  const logout = async () => {
    // If we have a refresh token, revoke it on the server
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      } catch (error) {
        console.error('Error during logout:', error)
      }
    }

    clearAuthData()
  }

  const clearAuthData = () => {
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    sessionStorage.clear()
  }

  // Add this computed property
  const isAuthenticated = !!user && (!!accessToken || !!refreshToken)

  // Function to get a valid token (refreshing if needed)
  const getValidToken = async () => {
    // If we have a valid access token, return it
    if (accessToken) {
      return accessToken
    }

    // If we have a refresh token, try to get a new access token
    if (refreshToken) {
      return await refreshAccessToken(refreshToken)
    }

    // No valid tokens, return null
    return null
  }

  return (
    <AuthContext.Provider value={{
      user,
      token: accessToken, // Keep 'token' for backward compatibility
      accessToken,
      refreshToken,
      login,
      logout,
      loading,
      isAuthenticated,
      getValidToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}