'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import CollaborativeEditor from "@/app/components/CollaborativeEditor"
import ShareDocumentModal from '@/app/components/ShareDocumentModal' // Import the ShareDocumentModal

export default function EditorPage() {
  const { id } = useParams()
  const { user, token, isAuthenticated } = useAuth()
  const [document, setDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false) // State for modal visibility

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Fetch document details
    fetchDocument()
  }, [id, isAuthenticated])

  const fetchDocument = async () => {
    if (!id || !token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDocument(data)
      } else {
        console.error('Failed to fetch document')
        // Handle error - maybe redirect to home
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserJoined = (user) => {
    console.log(`User joined: ${user.username}`)
    // You could update a list of active users here
  }

  const handleUserLeft = (user) => {
    console.log(`User left: ${user.username}`)
    // You could update a list of active users here
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Document not found</h2>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

return (
  <div className="h-screen flex flex-col bg-[#1e1e2f] text-gray-200">
    <header className="bg-[#2a2a40] border-b border-[#3a3a55] py-4 px-6 flex justify-between items-center">
      <h1 className="text-xl font-bold text-white">{document.title}</h1>
      <div className="flex items-center space-x-4 text-sm">
        <span className="text-gray-400">Language: {document.language}</span>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white py-1 px-3 rounded shadow-sm transition"
        >
          Share
        </button>

        <button
          onClick={() => router.push('/')}
          className="bg-gray-700 hover:bg-gray-600 text-gray-100 py-1.5 px-4 rounded shadow-sm transition"
        >
          Back to Dashboard
        </button>
      </div>
    </header>

    <div className="flex-grow overflow-hidden">
      <CollaborativeEditor
        documentId={id}
        initialContent={document.content || ''}
        language={document.language || 'javascript'}
        userId={user?.id}
        username={user?.username}
        token={token}
        onUserJoined={handleUserJoined}
        onUserLeft={handleUserLeft}
      />
    </div>

    <ShareDocumentModal
      documentId={id}
      token={token}
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      onShare={() => setIsShareModalOpen(false)}
    />
  </div>
)
}