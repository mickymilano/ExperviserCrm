import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// Icone
import {
  Home,
  User,
  Building2,
  DollarSign,
  UserPlus,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

  // Funzione per il logout
  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      // Reindirizza alla pagina di login
      window.location.href = '/login';
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  // Voci di menu
  const menuItems = [
    { label: 'Dashboard', path: '/', icon: <Home className="h-5 w-5" /> },
    { label: 'Contatti', path: '/contacts', icon: <User className="h-5 w-5" /> },
    { label: 'Aziende', path: '/companies', icon: <Building2 className="h-5 w-5" /> },
    { label: 'Opportunità', path: '/deals', icon: <DollarSign className="h-5 w-5" /> },
    { label: 'Lead', path: '/leads', icon: <UserPlus className="h-5 w-5" /> },
    { label: 'Impostazioni', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Barra superiore */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-4 py-3">
          {/* Logo e titolo */}
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 text-gray-500 dark:text-gray-400"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link href="/">
              <a className="flex items-center">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">EXPERVISER</span>
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">CRM</span>
              </a>
            </Link>
          </div>
          
          {/* Profilo utente */}
          <div className="relative">
            <button
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                ME
              </div>
              <span className="hidden md:inline font-medium">Michele Experviser</span>
              {isProfileMenuOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Michele Experviser</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">michele@experviser.com</p>
                </div>
                <div className="p-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex">
        {/* Menu laterale - Versione desktop */}
        <div className="hidden md:block w-64 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                    location === item.path
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-10 bg-gray-900/50">
            <div className="fixed top-14 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <a
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                        location === item.path
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
        
        {/* Contenuto principale */}
        <main className="flex-grow p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}