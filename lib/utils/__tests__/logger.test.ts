import { logger } from '../logger'

// Mock console methods
const originalEnv = process.env.NODE_ENV
const mockConsoleLog = jest.fn()
const mockConsoleError = jest.fn()
const mockConsoleWarn = jest.fn()
const mockConsoleInfo = jest.fn()

beforeAll(() => {
  global.console.log = mockConsoleLog
  global.console.error = mockConsoleError
  global.console.warn = mockConsoleWarn
  global.console.info = mockConsoleInfo
})

afterAll(() => {
  process.env.NODE_ENV = originalEnv
  jest.restoreAllMocks()
})

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('in development mode', () => {
    beforeAll(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log messages', () => {
      logger.log('test message')
      expect(mockConsoleLog).toHaveBeenCalledWith('[LOG]', 'test message')
    })

    it('should warn messages', () => {
      logger.warn('warning message')
      expect(mockConsoleWarn).toHaveBeenCalledWith('[WARN]', 'warning message')
    })

    it('should info messages', () => {
      logger.info('info message')
      expect(mockConsoleInfo).toHaveBeenCalledWith('[INFO]', 'info message')
    })

    it('should always log errors', () => {
      logger.error('error message')
      expect(mockConsoleError).toHaveBeenCalledWith('[ERROR]', 'error message')
    })
  })

  describe('in production mode', () => {
    beforeAll(() => {
      process.env.NODE_ENV = 'production'
    })

    it('should not log messages', () => {
      logger.log('test message')
      expect(mockConsoleLog).not.toHaveBeenCalled()
    })

    it('should not warn messages', () => {
      logger.warn('warning message')
      expect(mockConsoleWarn).not.toHaveBeenCalled()
    })

    it('should not info messages', () => {
      logger.info('info message')
      expect(mockConsoleInfo).not.toHaveBeenCalled()
    })

    it('should always log errors', () => {
      logger.error('error message')
      expect(mockConsoleError).toHaveBeenCalledWith('[ERROR]', 'error message')
    })
  })
})
