import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Catches render errors so a single broken component shows a graceful notice instead of blanking
 * the whole tool (e.g. the configurator infinite-loop crash). Error boundaries must be classes.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[demo-forge] render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-cream px-8 text-center">
          <div className="max-w-md">
            <h1 className="font-serif text-2xl text-charcoal">Something broke while rendering</h1>
            <p className="mt-2 font-sans text-sm text-charcoal-muted">{this.state.error.message}</p>
            <button type="button" onClick={() => window.location.reload()} className="ia-btn mt-5">
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
