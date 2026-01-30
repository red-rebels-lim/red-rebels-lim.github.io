import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a1810] text-white">
          <div className="text-center p-8 rounded-2xl border-2 border-[rgba(224,37,32,0.4)] bg-[rgba(10,24,16,0.6)]">
            <h1 className="text-2xl font-extrabold text-[#E02520] mb-4">Something went wrong</h1>
            <a
              href="."
              onClick={() => window.location.reload()}
              className="text-red-300 underline hover:text-white transition-colors"
            >
              Reload the page
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
