'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ShareDocumentModal({ documentId, token, isOpen, onClose, onShare }) {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleShare = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username })
      })

      if (response.ok) {
        setSuccess(true)
        setUsername('')
        onShare && onShare()
      } else {
        const data = await response.json()
        setError(data.detail || 'Failed to share document')
      }
    } catch (error) {
      setError('An error occurred while sharing the document')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#2a2a40] text-gray-200 rounded-xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">🔗 Share Document</h2>

        <form onSubmit={handleShare}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-[#1e1e2f] border border-gray-600 text-white rounded px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {error && (
            <div className="mb-3 text-red-400 text-sm">{error}</div>
          )}

          {success && (
            <div className="mb-3 text-emerald-400 text-sm">Document shared successfully!</div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'
              } text-white px-4 py-2 rounded transition`}
            >
              {isLoading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
