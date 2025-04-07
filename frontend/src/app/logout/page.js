// app/logout/page.js
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import '@/styles/globals.css';
export default function Logout() {
  const { logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    logout()
    router.push('/login')
  }, [logout, router])

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Logging out...</p>
      </div>
    </div>
  )
}