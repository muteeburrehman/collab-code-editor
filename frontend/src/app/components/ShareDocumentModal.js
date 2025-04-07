// components/ShareDocumentModal.jsx
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-semibold mb-4">Share Document</h2>

        <form onSubmit={handleShare}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username to share with"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}

          {success && (
            <div className="mb-4 text-green-500 text-sm">Document shared successfully!</div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              {isLoading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}