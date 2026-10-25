import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Complexity caught an unhandled runtime error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('gemini_offline_conversations');
      localStorage.removeItem('gemini_offline_active_conv');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c0d12] text-zinc-200 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-zinc-100">Complexity Studio</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An unexpected render issue occurred ({this.state.error?.message || 'unknown'}). Tap below to reload fresh.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 transition active:scale-95"
              >
                Reload
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition active:scale-95"
              >
                Reset Stored State
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
