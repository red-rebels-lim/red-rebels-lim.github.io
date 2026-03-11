import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import i18n from '@/i18n';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // In production, could send to an error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a1810] text-slate-900 dark:text-white">
          <div className="text-center p-8 rounded-2xl border-2 border-[rgba(224,37,32,0.4)] bg-white dark:bg-[rgba(10,24,16,0.6)]">
            <h1 className="text-2xl font-extrabold text-[#E02520] mb-4">{i18n.t('error.title')}</h1>
            <a
              href="."
              onClick={() => window.location.reload()}
              className="text-red-600 dark:text-red-300 underline hover:text-red-800 dark:hover:text-white transition-colors"
            >
              {i18n.t('error.reload')}
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
