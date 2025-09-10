import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import GeneratePage from './pages/GeneratePage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import AuthPage from './pages/AuthPage';
import { AuthGuard } from './components/auth/AuthGuard';

// Styles
import './styles/globals.css';
import './styles/brutalist.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="brutal-card p-8">
              <h1 className="text-2xl font-bold mb-4 text-black">⚠️ Something went wrong</h1>
              <p className="text-gray-600 mb-4">
                The app encountered an error. Please check the console for details.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary"
              >
                Reload Page
              </button>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                  <pre className="mt-2 text-xs text-red-600 bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  console.log('🚀 Kateriss AI App starting...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
          <div className="min-h-screen bg-white font-primary">
            <Header />
            <main className="pt-20 min-h-screen">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route 
                  path="/generate" 
                  element={
                    <AuthGuard>
                      <GeneratePage />
                    </AuthGuard>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <AuthGuard>
                      <DashboardPage />
                    </AuthGuard>
                  } 
                />
              </Routes>
            </main>
            <Footer />
            <Toaster 
              position="bottom-right"
              toastOptions={{
                className: 'brutal-toast',
                style: {
                  background: '#ff0080',
                  color: '#fff',
                  border: '3px solid #000',
                  boxShadow: '4px 4px 0px #000',
                  fontFamily: 'Space Grotesk, monospace',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;