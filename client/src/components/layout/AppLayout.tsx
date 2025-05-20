import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  Users,
  Building2,
  Building,
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
  Handshake,
  CheckSquare,
  Plus
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';
import DebugConsole from '../../components/debug/DebugConsole';
import DebugButton from '../../components/debug/DebugButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";

// Struttura per le voci di menu
interface MenuItemProps {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

// Struttura di base per le voci del menu principale
// I badge verranno aggiunti dinamicamente dai dati della dashboard
const getMainMenuItems = (stats?: any): MenuItemProps[] => [
  {
    label: 'Dashboard',
    path: '/',
    icon: <Home className="h-5 w-5" />,
  },
  {
    label: 'Contatti',
    path: '/contacts',
    icon: <Users className="h-5 w-5" />,
    badge: stats?.contacts
  },
  {
    label: 'Aziende',
    path: '/companies',
    icon: <Building2 className="h-5 w-5" />,
    badge: stats?.companies
  },
  {
    label: 'Filiali',
    path: '/branches',
    icon: <Building className="h-5 w-5" />,
    badge: stats?.branches
  },
  {
    label: 'Opportunità',
    path: '/deals',
    icon: <Briefcase className="h-5 w-5" />,
    badge: stats?.deals
  },
  {
    label: 'Lead',
    path: '/leads',
    icon: <Target className="h-5 w-5" />,
    badge: stats?.leads
  },
  {
    label: 'Sinergie',
    path: '/synergies',
    icon: <Handshake className="h-5 w-5" />,
    badge: stats?.synergies
  },
  {
    label: 'Attività',
    path: '/tasks',
    icon: <CheckSquare className="h-5 w-5" />,
    badge: stats?.tasks?.upcomingCount
  },
  {
    label: 'Calendario',
    path: '/calendar',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: 'Email',
    path: '/emails/inbox',
    icon: <Mail className="h-5 w-5" />,
    badge: stats?.unreadEmails > 0 ? stats.unreadEmails : null
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
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                item.path.startsWith('/email') 
                ? 'bg-red-600 text-white' 
                : 'bg-primary/10 text-primary'
              }`}>
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
  
  // Recupera statistiche per i badge del menu
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
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
            {getMainMenuItems(stats).map((item) => (
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
            {/* Pulsante Azione Rapida */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative group">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9 transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md">
                    Azione Rapida
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  window.location.href = '/contacts';
                }} className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Nuovo Contatto</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  window.location.href = '/companies';
                }} className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Nuova Azienda</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  window.location.href = '/deals/new';
                }} className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Nuova Opportunità</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  window.location.href = '/leads';
                }} className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>Nuovo Lead</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  window.location.href = '/calendar';
                }} className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Nuovo Appuntamento</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  window.location.href = '/tasks';
                }} className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  <span>Nuova Attività</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Debug Button */}
            <div className="h-9 w-9 inline-flex items-center justify-center">
              <DebugButton />
            </div>
            
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
      
      {/* Debug Console */}
      <DebugConsole />
    </div>
  );
}