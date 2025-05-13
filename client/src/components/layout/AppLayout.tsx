import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  Users,
  Building2,
  Briefcase,
  Target,
  Calendar,
  Mail,
  Settings,
  HelpCircle,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
  BellRing,
  Handshake
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

// Struttura per le voci di menu
interface MenuItemProps {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

// Array delle voci del menu principale
const mainMenuItems: MenuItemProps[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: <Home className="h-5 w-5" />,
  },
  {
    label: 'Contatti',
    path: '/contacts',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Aziende',
    path: '/companies',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    label: 'Opportunità',
    path: '/deals',
    icon: <Briefcase className="h-5 w-5" />,
    badge: 3,
  },
  {
    label: 'Lead',
    path: '/leads',
    icon: <Target className="h-5 w-5" />,
  },
  {
    label: 'Sinergie',
    path: '/synergies',
    icon: <Handshake className="h-5 w-5" />,
  },
  {
    label: 'Calendario',
    path: '/calendar',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: 'Email',
    path: '/emails',
    icon: <Mail className="h-5 w-5" />,
    badge: 5,
  },
];

// Array delle voci del menu secondario
const secondaryMenuItems: MenuItemProps[] = [
  {
    label: 'Impostazioni',
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    label: 'Aiuto',
    path: '/help',
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

// Componente per un elemento del menu
function MenuItem({ item, isOpen }: { item: MenuItemProps; isOpen: boolean }) {
  const [location] = useLocation();
  const isActive = location === item.path;
  
  return (
    <Link href={item.path}>
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <div>{item.icon}</div>
        {isOpen && (
          <div className="flex-1 flex items-center justify-between">
            <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Dati utente corrente
  const { data: user } = useQuery<{
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
  }>({
    queryKey: ['/api/auth/me'],
  });
  
  // Gestione responsive della sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Imposta lo stato iniziale
    handleResize();
    
    // Aggiungi event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Se è mobile chiudi il menu quando viene selezionato un link
  const handleMobileLinkClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };
  
  // Alterna tema tra chiaro e scuro
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  // Gestione logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Reindirizza alla pagina di login
      window.location.href = '/login';
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };
  
  return (
    <div className="flex h-screen bg-background">
      {/* Overlay per menu mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-transform duration-300 md:relative md:translate-x-0',
          isSidebarOpen ? 'w-64' : 'w-16',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo e controllo sidebar */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          <div className="flex items-center">
            {/* Logo */}
            <div className="font-bold text-primary text-lg">
              {isSidebarOpen ? 'EXPERVISER CRM' : 'EX'}
            </div>
          </div>
          
          {/* Pulsante per nascondere/mostrare sidebar (solo desktop) */}
          <button
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
          
          {/* Pulsante per chiudere menu (solo mobile) */}
          <button
            className="md:hidden h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Contenuto sidebar */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Sezione utente */}
          <div className="mb-4 flex flex-col gap-1">
            <div className={cn(
              'flex items-center gap-3 rounded-md p-2 mb-2',
              isSidebarOpen ? 'justify-start' : 'justify-center'
            )}>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-medium">{user?.fullName || 'Utente'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email || 'utente@experviser.com'}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Menu principale */}
          <nav className="space-y-1 mb-6">
            {mainMenuItems.map((item) => (
              <MenuItem key={item.path} item={item} isOpen={isSidebarOpen} />
            ))}
          </nav>
          
          {/* Menu secondario */}
          <nav className="space-y-1">
            {secondaryMenuItems.map((item) => (
              <MenuItem key={item.path} item={item} isOpen={isSidebarOpen} />
            ))}
          </nav>
        </div>
        
        {/* Footer della sidebar */}
        <div className="mt-auto p-3 border-t border-border">
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground w-full',
              isSidebarOpen ? 'justify-start' : 'justify-center'
            )}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {isSidebarOpen && <span>Cambia tema</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full mt-1',
              isSidebarOpen ? 'justify-start' : 'justify-center'
            )}
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
      
      {/* Contenuto principale */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border px-4 flex items-center justify-between bg-card">
          {/* Pulsante mobile menu */}
          <button
            className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Titolo pagina */}
          <div className="md:hidden font-semibold">EXPERVISER CRM</div>
          
          {/* Spazio vuoto per desktop */}
          <div className="hidden md:block"></div>
          
          {/* Azioni header */}
          <div className="flex items-center gap-2">
            {/* Notifiche */}
            <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent relative">
              <BellRing className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
            </button>
            
            {/* Profilo utente */}
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-md hover:bg-accent px-2 py-1.5"
                onClick={() => {}}
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline font-medium">{user?.fullName || 'Utente'}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Contenuto della pagina */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}