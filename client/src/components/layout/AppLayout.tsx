import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Cog,
  LogOut, 
  Menu,
  Moon,
  Sun,
  User,
  Users,
  Building2,
  Briefcase,
  Target,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';

import useTheme from '@/hooks/useTheme';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  
  // Ottieni i dati dell'utente
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/status'],
  });
  
  // Gestisci responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Imposta inizialmente
    handleResize();
    
    // Aggiunge event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Chiudi menu utente quando si clicca al di fuori
  useEffect(() => {
    const handleClickOutside = () => {
      setUserMenuOpen(false);
    };
    
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userMenuOpen]);
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border z-10">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo e controllo sidebar */}
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none"
            >
              <Menu size={20} />
            </button>
            <Link href="/" className="ml-2 text-xl font-bold text-primary">
              EXPERVISER CRM
            </Link>
          </div>
          
          {/* Menu utente */}
          <div className="flex items-center gap-2">
            {/* Cambio tema */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Avatar e menu utente */}
            <div className="relative" onClick={(e) => {
              e.stopPropagation();
              setUserMenuOpen(!userMenuOpen);
            }}>
              <button className="flex items-center text-sm p-2 rounded-md hover:bg-accent">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    {user?.user?.fullName ? user.user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="font-medium">{user?.user?.fullName || 'Utente'}</p>
                    <p className="text-xs text-muted-foreground">{user?.user?.email || ''}</p>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50">
                  <div className="block md:hidden px-4 py-2 border-b border-border">
                    <p className="font-medium">{user?.user?.fullName || 'Utente'}</p>
                    <p className="text-xs text-muted-foreground">{user?.user?.email || ''}</p>
                  </div>
                  <Link href="/settings/profile" className="block px-4 py-2 text-sm hover:bg-muted w-full text-left">
                    <span className="flex items-center gap-2">
                      <User size={16} />
                      Profilo
                    </span>
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm hover:bg-muted w-full text-left">
                    <span className="flex items-center gap-2">
                      <Cog size={16} />
                      Impostazioni
                    </span>
                  </Link>
                  <div className="border-t border-border"></div>
                  <Link href="/logout" className="block px-4 py-2 text-sm hover:bg-muted text-destructive w-full text-left">
                    <span className="flex items-center gap-2">
                      <LogOut size={16} />
                      Logout
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`bg-card border-r border-border w-64 flex-shrink-0 overflow-y-auto transition-all ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 absolute md:relative z-20 h-[calc(100vh-4rem)]`}
        >
          <nav className="p-4 space-y-1">
            <NavItem 
              href="/" 
              icon={<LayoutDashboard size={20} />} 
              title="Dashboard" 
            />
            <NavItem 
              href="/contacts" 
              icon={<User size={20} />} 
              title="Contatti" 
            />
            <NavItem 
              href="/companies" 
              icon={<Building2 size={20} />} 
              title="Aziende" 
            />
            <NavItem 
              href="/deals" 
              icon={<Briefcase size={20} />} 
              title="Opportunità" 
            />
            <NavItem 
              href="/leads" 
              icon={<Target size={20} />} 
              title="Lead" 
            />
            
            {/* Separatore */}
            <div className="border-t border-border my-4"></div>
            
            {/* Sezione Amministrazione (solo per admin) */}
            {user?.user?.role === 'admin' || user?.user?.role === 'super_admin' ? (
              <>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                  Amministrazione
                </div>
                <NavItem 
                  href="/users" 
                  icon={<Users size={20} />} 
                  title="Utenti" 
                />
                <NavItem 
                  href="/settings" 
                  icon={<Cog size={20} />} 
                  title="Impostazioni" 
                />
              </>
            ) : null}
          </nav>
        </aside>
        
        {/* Contenuto principale */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, title }: NavItemProps) {
  const [location] = useLocation();
  const isActive = location === href || (href !== '/' && location.startsWith(href));
  
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {icon}
      <span className="font-medium">{title}</span>
    </Link>
  );
}