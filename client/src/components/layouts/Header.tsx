import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, Bell, Search, Plus, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ContactModal from "@/components/modals/ContactModal";
import LeadModal from "@/components/modals/LeadModal";
import CompanyModal from "@/components/modals/CompanyModal";
import ImprovedDealModal from "@/components/modals/ImprovedDealModal";
import { useAuth } from "@/hooks/useAuth";

// User Profile Menu Component
function UserProfileMenu() {
  const { user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    
    const nameParts = user.fullName?.split(" ") || [];
    if (nameParts.length === 0) return "U";
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // First character of first name and first character of last name
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src="" alt="Profile picture" />
            <AvatarFallback className="bg-primary text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.fullName || "User"}</p>
            <p className="text-xs leading-none text-neutral-medium">{user?.email || ""}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  
  // Get page title based on current route
  const getPageTitle = () => {
    switch(location) {
      case "/":
      case "/dashboard":
        return "Dashboard";
      case "/contacts":
        return "Contacts";
      case "/companies":
        return "Companies";
      case "/deals":
        return "Deals";
      case "/synergies":
        return "Synergies";
      case "/email":
        return "Email";
      case "/calendar":
        return "Calendar";
      case "/tasks":
        return "Tasks";
      case "/settings":
        return "Settings";
      default:
        return "EXPERVISER CRM";
    }
  };

  return (
    <header className="h-16 flex items-center justify-between bg-white border-b border-neutral-light px-4 md:px-6">
      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden text-neutral-dark hover:text-primary"
        onClick={toggleSidebar}
        type="button"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      {/* Page Title (Desktop) */}
      <h1 className="text-xl font-semibold text-neutral-dark hidden md:block">
        {getPageTitle()}
      </h1>
      
      {/* Search */}
      <div className="flex-1 max-w-lg px-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search contacts, companies or deals..." 
            className="w-full py-2 pl-10 pr-4 bg-neutral-lightest border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Search className="h-5 w-5 text-neutral-medium absolute left-3 top-2.5" />
        </div>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full"></span>
        </Button>
        
        {/* Add New - Desktop */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="hidden sm:flex items-center">
              <Plus className="h-5 w-5 mr-1" />
              <span>Add New</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowLeadModal(true)}>
              Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowContactModal(true)}>
              Contact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCompanyModal(true)}>
              Company
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDealModal(true)}>
              Deal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Add New - Mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="sm:hidden">
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowLeadModal(true)}>
              Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowContactModal(true)}>
              Contact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCompanyModal(true)}>
              Company
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDealModal(true)}>
              Deal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User Profile Menu */}
        <UserProfileMenu />
      </div>
      
      {/* Modals */}
      <LeadModal
        open={showLeadModal}
        onOpenChange={setShowLeadModal}
      />
      <ContactModal
        open={showContactModal}
        onOpenChange={setShowContactModal}
      />
      <CompanyModal
        open={showCompanyModal}
        onOpenChange={setShowCompanyModal}
        initialData={null}
      />
      <ImprovedDealModal
        open={showDealModal}
        onOpenChange={setShowDealModal}
      />
    </header>
  );
}
