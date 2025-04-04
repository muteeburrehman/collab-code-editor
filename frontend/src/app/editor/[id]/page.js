// app/editor/[id]/page.js
'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import the editor component to avoid SSR issues
const CollaborativeEditor = dynamic(
  () => import('../../components/CollaborativeEditor'),
  { ssr: false }
)

export default function EditorPage() {
  const { id } = useParams()
  const { user, token, isAuthenticated } = useAuth()
  const router = useRouter()
  const [document, setDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [isEditorReady, setIsEditorReady] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchDocument()
  }, [id, isAuthenticated, router])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDocument(data)
        setIsEditorReady(true)
      } else if (response.status === 404) {
        setError('Document not found')
      } else if (response.status === 403) {
        setError('You do not have permission to access this document')
      } else {
        setError('Failed to load document')
      }
    } catch (error) {
      console.error('Error fetching document:', error)
      setError('An error occurred while loading the document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserJoined = (userData) => {
    setConnectedUsers(prev => {
      if (!prev.some(u => u.id === userData.id)) {
        return [...prev, userData]
      }
      return prev
    })
  }

  const handleUserLeft = (userId) => {
    setConnectedUsers(prev => prev.filter(user => user.id !== userId))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Documents
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white shadow p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              {'< Back to Documents'}
            </Link>
            <h1 className="text-xl font-semibold">{document?.title || 'Document'}</h1>
            <span className="bg-gray-200 px-2 py-1 rounded text-sm">{document?.language || 'unknown'}</span>
          </div>
          <div className="flex items-center">
            <div className="mr-4">
              <span className="text-sm text-gray-500 mr-2">Connected:</span>
              <span className="font-medium">{connectedUsers.length + 1}</span>
            </div>
            <div className="flex -space-x-2">
              {/* Current user avatar */}
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-white z-10">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              {/* Other connected users avatars */}
              {connectedUsers.slice(0, 3).map((connectedUser, index) => (
                <div
                  key={connectedUser.id}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white"
                  style={{
                    backgroundColor: `hsl(${(connectedUser.id * 137) % 360}, 70%, 60%)`,
                    zIndex: 9 - index
                  }}
                >
                  {connectedUser.username?.charAt(0).toUpperCase()}
                </div>
              ))}
              {connectedUsers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs border-2 border-white">
                  +{connectedUsers.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        {isEditorReady && document && (
          <CollaborativeEditor
            documentId={id}
            initialContent={document.content}
            language={document.language}
            userId={user?.id}
            username={user?.username}
            token={token}
            onUserJoined={handleUserJoined}
            onUserLeft={handleUserLeft}
          />
        )}
      </main>
    </div>
  )
}