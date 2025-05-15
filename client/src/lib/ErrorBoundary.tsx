import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  component?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Componente ErrorBoundary avanzato per catturare errori non gestiti nei componenti
 * e tracciare il percorso dell'errore.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log dell'errore con informazioni di contesto
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Callback personalizzata se fornita
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Segnala a Sentry
    Sentry.withScope((scope) => {
      scope.setTag('component', this.props.component || 'unknown');
      scope.setExtra('componentStack', errorInfo.componentStack);
      Sentry.captureException(error);
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Visualizza il fallback personalizzato o il fallback predefinito
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Si è verificato un errore</h3>
          <p className="text-red-600 mb-3">Si è verificato un errore durante il rendering di questo componente.</p>
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer">Dettagli errore</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Riprova
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;