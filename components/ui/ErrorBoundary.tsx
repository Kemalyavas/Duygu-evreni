'use client'

import { Component, ReactNode } from 'react'
import trMessages from '@/lib/i18n/translations/tr.json'
import enMessages from '@/lib/i18n/translations/en.json'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const lang =
        typeof window !== 'undefined' && localStorage.getItem('language') === 'en'
          ? 'en'
          : 'tr'
      const tx = lang === 'en' ? enMessages : trMessages

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="glass rounded-2xl p-8 max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">
              {tx.errors.generic}
            </h2>
            <p className="text-white/60 mb-6">
              {tx.misc.refreshToRetry}
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
            >
              {tx.misc.refreshPage}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
