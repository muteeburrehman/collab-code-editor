// app/register/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '@/styles/globals.css';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Registration failed')
      }

      // Redirect with success state
      router.push('/login?registered=true')
    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.')
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500">
  <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
    <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">Create an Account</h1>

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
          value={formData.username}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
          minLength={3}
        />
      </div>

      <div className="mb-5">
        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
          minLength={6}
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
          minLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? 'Creating Account...' : 'Register'}
      </button>
    </form>

    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700">
          Log In
        </Link>
      </p>
    </div>
  </div>
</div>

  )
}