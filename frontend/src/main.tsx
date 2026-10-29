import { Component, StrictMode } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '600px', width: '100%', backgroundColor: '#1e293b', padding: '32px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f43f5e', marginBottom: '16px' }}>Ha ocurrido un error en la aplicación</h2>
            <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
              Se ha detectado un problema al renderizar los componentes:
            </p>
            <pre style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', color: '#fca5a5', fontSize: '12px', overflowX: 'auto', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.message || 'Error desconocido'}
            </pre>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={this.handleReset}
                style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Limpiar datos locales y reiniciar
              </button>
              <button 
                onClick={() => window.location.reload()}
                style={{ backgroundColor: '#334155', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

