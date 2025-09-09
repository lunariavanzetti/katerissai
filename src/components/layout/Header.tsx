import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { config } from '../../config/env';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Generate', href: '/generate', requiresAuth: true },
    { name: 'Dashboard', href: '/dashboard', requiresAuth: true },
    { name: 'Pricing', href: '/pricing', requiresAuth: false },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 w-full bg-white border-b-3 border-black z-50 shadow-brutal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
          >
            <div className="w-8 h-8 bg-primary border-2 border-black shadow-brutal group-hover:shadow-brutal-lg transition-all duration-200 group-hover:transform group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]">
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
            </div>
            <span className="font-bold text-xl text-black group-hover:text-primary transition-colors">
              {config.app.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              if (item.requiresAuth && !user) return null;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`font-medium transition-colors hover:text-primary ${
                    isActivePath(item.href) 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-black'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth?mode=signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className={`w-6 h-6 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t-3 border-black bg-white shadow-brutal-lg">
          <div className="px-4 py-4 space-y-4">
            {navigation.map((item) => {
              if (item.requiresAuth && !user) return null;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block py-2 px-4 font-medium transition-colors hover:bg-gray-100 ${
                    isActivePath(item.href) 
                      ? 'text-primary bg-gray-100' 
                      : 'text-black'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
            
            <div className="pt-4 border-t-2 border-gray-200">
              {user ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 px-4">
                    Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link to="/auth?mode=signin" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};