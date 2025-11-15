import { getErrorMessage, ERROR_MESSAGES } from '../errors'

describe('getErrorMessage', () => {
  it('should return network error message for network errors', () => {
    const error = new Error('Network request failed')
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.NETWORK_ERROR)
  })

  it('should return unauthorized message for unauthorized errors', () => {
    const error = new Error('Unauthorized access')
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.UNAUTHORIZED)
  })

  it('should return not found message for 404 errors', () => {
    const error = new Error('Not found 404')
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.NOT_FOUND)
  })

  it('should return validation error message for validation errors', () => {
    const error = new Error('Invalid validation')
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.VALIDATION_ERROR)
  })

  it('should return error message if error is Error instance', () => {
    const error = new Error('Custom error message')
    expect(getErrorMessage(error)).toBe('Custom error message')
  })

  it('should return fallback message if provided', () => {
    const error = new Error('Unknown error')
    expect(getErrorMessage(error, 'Custom fallback')).toBe('Custom fallback')
  })

  it('should return unknown error message for non-Error objects', () => {
    expect(getErrorMessage(null)).toBe(ERROR_MESSAGES.UNKNOWN_ERROR)
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.UNKNOWN_ERROR)
    expect(getErrorMessage('string')).toBe(ERROR_MESSAGES.UNKNOWN_ERROR)
  })

  it('should return fallback for non-Error objects if provided', () => {
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback')
  })
})
