import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock Supabase client used by the dashboard page
vi.mock('@/lib/supabase/client', () => {
  const getUser = vi.fn().mockResolvedValue({ data: { user: { email: 'tester@example.com' } } })
  const selectLimit = vi.fn().mockResolvedValue({ data: [], error: null })
  return {
    createClient: () => ({
      auth: { getUser, signOut: vi.fn() },
      from: () => ({
        select: () => ({
          limit: selectLimit,
        }),
      }),
    }),
  }
})

import DashboardPage from '../app/dashboard/page'

describe('DashboardPage', () => {
  it('renders and toggles Users panel', async () => {
    render(<DashboardPage />)

    // Ensure base content is present
    expect(screen.getByText(/WebGIS Deli Serdang/i)).toBeInTheDocument()

    const usersButton = screen.getByRole('button', { name: /Users/i })
    fireEvent.click(usersButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /User Management/i })).toBeInTheDocument()
    })
  })
})
