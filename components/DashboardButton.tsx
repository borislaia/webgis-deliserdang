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

  if (isAuthenticated === null) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  return <Link className="btn primary" href="/dashboard">Dashboard</Link>
}
