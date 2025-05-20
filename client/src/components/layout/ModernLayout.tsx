import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Users,
  Building2,
  BarChart3,
  Mail,
  Calendar,
  Settings,
  Menu,
  X,
  Home,
  Users2,
  Briefcase,
  Share2,
  HelpCircle,
  Bell,
  Search,
  UserCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

interface ModernLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  count?: number;
}

export default function ModernLayout({ children }: ModernLayoutProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <Home size={20} />, href: '/' },
    { label: 'Contatti', icon: <Users size={20} />, href: '/contacts', count: 94 },
    { label: 'Aziende', icon: <Building2 size={20} />, href: '/companies', count: 18 },
    { label: 'Opportunità', icon: <BarChart3 size={20} />, href: '/deals', count: 8 },
    { label: 'Lead', icon: <Users2 size={20} />, href: '/leads', count: 4 },
    { label: 'Sinergie', icon: <Share2 size={20} />, href: '/synergies', count: 5 },
    { label: 'Email', icon: <Mail size={20} />, href: '/emails' },
    { label: 'Calendario', icon: <Calendar size={20} />, href: '/calendar' },
  ];

  const secondaryNavItems: NavItem[] = [
    { label: 'Impostazioni', icon: <Settings size={20} />, href: '/settings' },
    { label: 'Aiuto', icon: <HelpCircle size={20} />, href: '/help' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar mobile toggle */}
      <div className="fixed bottom-4 left-4 z-40 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-white shadow-md"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b px-4">
            <h1 className="text-xl font-bold text-blue-700">EXPERVISER CRM</h1>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {mainNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      location === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                    {item.count !== undefined && (
                      <span className={cn(
                        "ml-auto rounded-full px-2 py-0.5 text-xs",
                        location === item.href
                          ? "bg-blue-200 text-blue-800"
                          : "bg-gray-200 text-gray-700"
                      )}>
                        {item.count}
                      </span>
                    )}
                  </a>
                </Link>
              ))}
            </nav>

            <div className="mt-8">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sistema
              </h3>
              <nav className="mt-2 space-y-1 px-2">
                {secondaryNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={cn(
                        "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        location === item.href
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </a>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* User profile */}
          <div className="border-t p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                  <UserCircle size={24} />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">Admin Utente</p>
                <p className="text-xs text-gray-500">admin@experviser.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top navigation */}
        <header className="bg-white border-b shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center lg:w-64">
              <button
                className="text-gray-500 focus:outline-none lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu size={24} />
              </button>
            </div>
            
            {/* Search */}
            <div className="flex w-full max-w-md">
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search size={18} className="text-gray-400" />
                </div>
                <Input 
                  type="search" 
                  placeholder="Cerca contatti, aziende o opportunità..." 
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Bell size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <HelpCircle size={18} />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}