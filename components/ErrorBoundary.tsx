'use client'

import React, { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * General Error Boundary component
 * Catches JavaScript errors anywhere in child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <div className="text-red-400 text-lg mb-4">Bir şeyler yanlış gitti</div>
          <p className="text-white/60 text-sm mb-4">
            Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Specialized Error Boundary for 3D Canvas
 * Provides a fallback UI when Three.js/R3F crashes
 */
interface Canvas3DErrorBoundaryProps {
  children: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface Canvas3DErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class Canvas3DErrorBoundary extends Component<Canvas3DErrorBoundaryProps, Canvas3DErrorBoundaryState> {
  constructor(props: Canvas3DErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Canvas3DErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Canvas3DErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0A0E27] to-black">
          <div className="glass rounded-2xl p-8 max-w-md text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              3D Sahne Yüklenemedi
            </h2>

            <p className="text-white/60 text-sm mb-6">
              3D evren yüklenirken bir sorun oluştu. Bu genellikle tarayıcı
              uyumluluk sorunlarından veya grafik sürücüsü problemlerinden
              kaynaklanır.
            </p>

            {/* Error Details (collapsed by default in production) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-white/40 text-xs cursor-pointer hover:text-white/60">
                  Hata Detayları
                </summary>
                <pre className="mt-2 p-2 bg-black/50 rounded text-red-300 text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                Tekrar Dene
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors text-sm"
              >
                Sayfayı Yenile
              </button>
            </div>

            <p className="text-white/40 text-xs mt-4">
              Sorun devam ederse farklı bir tarayıcı deneyin veya{' '}
              <a
                href="mailto:destek@duygu-evreni.com"
                className="text-purple-400 hover:underline"
              >
                destek ekibimize
              </a>{' '}
              ulaşın.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}
