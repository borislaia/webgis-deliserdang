'use client'
import { Component, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

/**
 * Props untuk ErrorBoundary component
 */
interface Props {
  /** Children components yang akan di-wrap */
  children: ReactNode
  /** Custom fallback UI jika terjadi error (opsional) */
  fallback?: ReactNode
  /** Callback yang dipanggil saat error terjadi (opsional) */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * State untuk ErrorBoundary component
 */
interface State {
  /** Apakah error sudah terjadi */
  hasError: boolean
  /** Error object yang terjadi */
  error: Error | null
}

/**
 * Error Boundary component untuk menangani React errors.
 * 
 * Component ini menangkap error di component tree dan menampilkan fallback UI
 * daripada crash seluruh aplikasi.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorPage />}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#dc2626',
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>Terjadi Kesalahan</h2>
          <p style={{ marginBottom: '1rem' }}>
            Maaf, terjadi kesalahan yang tidak terduga. Silakan refresh halaman atau hubungi administrator.
          </p>
          {this.state.error && process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '1rem', textAlign: 'left' }}>
              <summary>Detail Error (Development Only)</summary>
              <pre style={{ marginTop: '0.5rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.25rem', overflow: 'auto' }}>
                {this.state.error.toString()}
                {this.state.error.stack && (
                  <>
                    {'\n\n'}
                    {this.state.error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Refresh Halaman
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
