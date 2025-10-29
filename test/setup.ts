import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Stub next/image to a no-op component in tests
vi.mock('next/image', () => ({
  default: () => null,
}))
