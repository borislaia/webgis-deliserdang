"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function DashboardButton() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        setIsAuthenticated(!!data.user)
      } catch (error) {
        console.error('Gagal memeriksa status login', error)
        setIsAuthenticated(false)
      }
    }

    checkSession()
  }, [])

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        className="btn primary"
        disabled
        aria-disabled
        style={{ opacity: 0.5, cursor: 'not-allowed' }}
      >
        Dashboard
      </button>
    )
  }

  return <Link className="btn primary" href="/dashboard">Dashboard</Link>
}
