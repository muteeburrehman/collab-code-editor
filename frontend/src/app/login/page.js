'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import '@/styles/globals.css';
// Ensure this matches your environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }).toString(),
      })

      const data = await response.json()

      if (response.ok) {
        // Ensure these match your API response structure
        const userId = data.user_id || data.id
        const accessToken = data.access_token || data.token

        if (!userId || !accessToken) {
          throw new Error('Missing user data in response')
        }

        login({ username, id: userId }, accessToken)
        router.push('/')
      } else {
        setError(data.detail || data.message || 'Login failed')
      }
    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
<div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500">
  <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
    <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">Log In</h1>

    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>

    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600">
        Don't have an account?{' '}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700">
          Register
        </Link>
      </p>
    </div>
  </div>
</div>

  )
}