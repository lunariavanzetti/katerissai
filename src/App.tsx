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
import AuthGuard from './components/auth/AuthGuard';

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

function App() {
  return (
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
  );
}

export default App;