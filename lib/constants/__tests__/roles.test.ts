import { ROLES, isValidRole } from '../roles'

describe('ROLES', () => {
  it('should have ADMIN role', () => {
    expect(ROLES.ADMIN).toBe('admin')
  })

  it('should have USER role', () => {
    expect(ROLES.USER).toBe('user')
  })
})

describe('isValidRole', () => {
  it('should return true for valid roles', () => {
    expect(isValidRole('admin')).toBe(true)
    expect(isValidRole('user')).toBe(true)
  })

  it('should return false for invalid roles', () => {
    expect(isValidRole('invalid')).toBe(false)
    expect(isValidRole('')).toBe(false)
    expect(isValidRole('ADMIN')).toBe(false) // case sensitive
    expect(isValidRole('Admin')).toBe(false) // case sensitive
  })
})
