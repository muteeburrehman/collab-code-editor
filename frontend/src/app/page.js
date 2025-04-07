'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './contexts/AuthContext'
import Link from 'next/link'
import CollaboratorsList from "@/app/components/CollaboratorsList";
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('javascript')
  const { user, token, isAuthenticated } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    fetchDocuments()
  }, [isAuthenticated, router])
  
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      } else {
        console.log('Failed to fetch documents')
      }
    } catch (error) {
      console.log('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createDocument = async (e) => {
    e.preventDefault()

    if (!title.trim()) return

    try {
      const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          language,
          content: ''
        })
      })

      if (response.ok) {
        const newDocument = await response.json()
        setDocuments([...documents, newDocument])
        setTitle('')
        router.push(`/editor/${newDocument.id}`)
      }
    } catch (error) {
      console.log('Error creating document:', error)
    }
  }

  const deleteDocument = async (id) => {
    try {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== id))
      }
    } catch (error) {
      console.log('Error deleting document:', error)
    }
  }

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' }
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
<div className="container mx-auto px-4 py-8">
  <div className="flex justify-between items-center mb-8">
    <h1 className="text-3xl font-bold text-indigo-700">Collaborative Code Editor</h1>
    <div className="flex items-center">
      <span className="mr-4 text-gray-700">Welcome, {user?.username}</span>
      <button
        onClick={() => router.push('/logout')}
        className="bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded"
      >
        Logout
      </button>
    </div>
  </div>

  <div className="bg-white rounded-lg shadow p-6 mb-8">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Document</h2>
    <form onSubmit={createDocument} className="flex flex-col md:flex-row gap-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Document Title"
        className="flex-grow border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        required
      />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {languageOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded"
      >
        Create
      </button>
    </form>
  </div>

  <div className="bg-white rounded-lg shadow">
    <h2 className="text-xl font-semibold p-6 border-b border-gray-200 text-gray-800">Your Documents</h2>
    {documents.length === 0 ? (
      <div className="p-6 text-center text-gray-500">
        You haven’t created any documents yet
      </div>
    ) : (
      <ul className="divide-y divide-gray-200">
        {documents.map(doc => (
          <li key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div>
              <Link href={`/editor/${doc.id}`} className="text-lg font-medium text-indigo-600 hover:underline">
                {doc.title}
              </Link>
              <p className="text-sm text-gray-500">Language: {doc.language}</p>
            </div>
            <div className="flex space-x-2">
              <Link
                href={`/editor/${doc.id}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 text-sm rounded"
              >
                Edit
              </Link>
              <CollaboratorsList
                collaborators={doc.shared_with || []}
                currentUserId={user?.id}
              />
              <button
                onClick={() => deleteDocument(doc.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white py-1 px-3 text-sm rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
</div>

  )
}