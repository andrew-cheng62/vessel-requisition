import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Could send to a logging service here (e.g. Sentry) in future
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-6">
              An unexpected error occurred. Please try refreshing the page. If the problem
              persists, contact your administrator.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
