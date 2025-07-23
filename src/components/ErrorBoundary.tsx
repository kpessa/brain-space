import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { logger } from '../services/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  isolate?: boolean
  context?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, context } = this.props

    logger.error('ERROR_BOUNDARY', `Error caught in ${context || 'component'}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context,
    })

    this.setState({ errorInfo })

    if (onError) {
      onError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetError()
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError()
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback, isolate, context } = this.props

    if (hasError && error) {
      if (fallback) {
        return <>{fallback}</>
      }

      const errorMessage = error.message || 'An unexpected error occurred'
      const isReactFlowError =
        error.message?.includes('Parent node') && error.message?.includes('not found')

      return (
        <div
          className={`${isolate ? 'relative' : 'min-h-screen'} flex items-center justify-center p-4`}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h2 className="text-lg font-semibold">
                {isReactFlowError ? 'Flow Sync Error' : `Error in ${context || 'Application'}`}
              </h2>
            </div>

            <div className="space-y-3">
              <p className="text-gray-600">
                {isReactFlowError
                  ? 'The flow diagram is out of sync. This usually happens when switching between brain dumps.'
                  : errorMessage}
              </p>

              {process.env.NODE_ENV === 'development' && errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Show technical details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-gray-600 overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={this.resetError}
                  className="flex-1 px-4 py-2 bg-brain-600 text-white rounded-lg hover:bg-brain-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                {!isolate && (
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Reload Page
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

// Higher-order component for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
