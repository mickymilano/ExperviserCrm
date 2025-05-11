import { useLocation, Link } from "wouter";
import { 
  Home, 
  Users, 
  Building2, 
  TrendingUp, 
  Mail, 
  Calendar, 
  CheckSquare,
  Settings,
  Menu,
  UserPlus,
  Network,
  LifeBuoy,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <li className="mb-1">
      <Link href={href}>
        <a className={cn(
          "flex items-center px-4 py-3 rounded-lg mx-2",
          active 
            ? "text-primary bg-blue-50" 
            : "text-neutral-dark hover:bg-neutral-lightest"
        )}>
          <span className="w-6 h-6">{icon}</span>
          <span className="ml-3 hidden lg:inline-block">{label}</span>
        </a>
      </Link>
    </li>
  );
}

// Componente per mostrare le informazioni dell'utente corrente
function UserProfileSummary() {
  const { user, logout } = useAuth();
  
  // Ottieni le iniziali per l'avatar
  const getUserInitials = () => {
    if (!user) return "MA";
    
    // Estrai il nome completo in modo sicuro
    const fullName = typeof user === 'object' && user ? 
                    (user as any).fullName || 'Michele Ardoni' : 
                    'Michele Ardoni';
    
    const nameParts = fullName.split(" ") || [];
    if (nameParts.length === 0) return "MA";
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };
  
  // Estrai le informazioni dell'utente in modo sicuro
  const fullName = typeof user === 'object' && user ? 
                  (user as any).fullName || 'Michele Ardoni' : 
                  'Michele Ardoni';
                  
  const email = typeof user === 'object' && user ? 
               (user as any).email || 'michele@experviser.com' : 
               'michele@experviser.com';
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
          <span className="font-medium">{getUserInitials()}</span>
        </div>
        <div className="ml-3 hidden lg:block">
          <p className="text-sm font-medium">{fullName}</p>
          <p className="text-xs text-neutral-medium">{email}</p>
        </div>
      </div>
      
      <button 
        onClick={logout}
        className="flex items-center text-neutral-dark hover:text-red-500 mt-2 text-sm"
      >
        <LogOut className="h-4 w-4 mr-2" />
        <span className="hidden lg:inline-block">Logout</span>
      </button>
    </div>
  );
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar navigation */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-light flex-col md:static md:flex",
        open ? "flex" : "hidden md:flex",
        "md:w-16 lg:w-64 transition-all duration-300"
      )}>
        {/* Mobile close button */}
        <div className="md:hidden absolute right-4 top-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpen(false)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start px-4 border-b border-neutral-light">
          <span className="hidden lg:inline-block text-2xl font-bold text-primary">EXPERVISER</span>
          <span className="lg:hidden text-2xl font-bold text-primary">E</span>
        </div>
        
        {/* Primary Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
          <ul>
            <NavItem 
              href="/dashboard" 
              icon={<Home className="h-6 w-6" />} 
              label="Dashboard" 
              active={location === "/" || location === "/dashboard"} 
            />
            <NavItem 
              href="/contacts" 
              icon={<Users className="h-6 w-6" />} 
              label="Contacts" 
              active={location === "/contacts"} 
            />
            <NavItem 
              href="/leads" 
              icon={<UserPlus className="h-6 w-6" />} 
              label="Leads" 
              active={location === "/leads"} 
            />
            <NavItem 
              href="/companies" 
              icon={<Building2 className="h-6 w-6" />} 
              label="Companies" 
              active={location === "/companies"} 
            />
            <NavItem 
              href="/deals" 
              icon={<TrendingUp className="h-6 w-6" />} 
              label="Deals" 
              active={location === "/deals"} 
            />
            <NavItem 
              href="/email" 
              icon={<Mail className="h-6 w-6" />} 
              label="Email" 
              active={location === "/email"} 
            />
            <NavItem 
              href="/calendar" 
              icon={<Calendar className="h-6 w-6" />} 
              label="Calendar" 
              active={location === "/calendar"} 
            />
            <NavItem 
              href="/tasks" 
              icon={<CheckSquare className="h-6 w-6" />} 
              label="Tasks" 
              active={location === "/tasks"} 
            />
            
            {/* Debug section removed */}
          </ul>
        </nav>
        
        {/* Settings & User Menu */}
        <div className="border-t border-neutral-light p-4">
          <Link href="/settings">
            <a className="flex items-center text-neutral-dark hover:text-primary">
              <Settings className="h-6 w-6" />
              <span className="ml-3 hidden lg:inline-block">Settings</span>
            </a>
          </Link>
          
          <div className="mt-4 pt-4 border-t border-neutral-light">
            <UserProfileSummary />
          </div>
        </div>
      </div>
    </>
  );
}
