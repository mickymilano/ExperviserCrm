import { useState, useEffect } from "react";
import { useEmailAccounts, EmailAccount } from "@/hooks/useEmailAccounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Lock, 
  Mail, 
  Bell, 
  Settings, 
  Share2, 
  Shield, 
  Trash2, 
  Plus,
  Info,
  Edit,
  Database,
  Upload,
  Download,
  FileDown,
  FileUp
} from "lucide-react";

// Import dei componenti per la gestione dati
import { ImportExportManager } from "@/components/import-export/ImportExportManager";
import { DuplicateAnalyzer } from "@/components/import-export/DuplicateAnalyzer";
import { AIEnhancer } from "@/components/import-export/AIEnhancer";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";
import { useTheme } from "@/components/layouts/ThemeProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserProfile } from "@/hooks/useUserProfile";
import { EmailAccountForm } from "@/components/email/EmailAccountForm";

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  // User profile state and handlers
  const { user, isLoading: isUserLoading, updateProfile, updatePassword } = useUserProfile();
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    timezone: "Europe/Rome",
    language: "English",
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Email accounts state and handlers
  const { emailAccounts, isLoading, deleteAccount, updateAccount } = useEmailAccounts();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<EmailAccount | null>(null);
  const [accountToEdit, setAccountToEdit] = useState<EmailAccount | null>(null);
  
  // Initialize profile form with user data when loaded
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "Michele Ardoni",
        email: user.email || "michele@experviser.com",
        phone: user.phone || "+39 123 456 7890",
        jobTitle: user.jobTitle || "CEO",
        timezone: user.timezone || "Europe/Rome",
        language: user.language || "English",
      });
    }
  }, [user]);
  
  // Handle profile form changes
  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value,
    });
  };
  
  // Handle password form changes
  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value,
    });
  };

  const handleEditAccount = (account: EmailAccount) => {
    setAccountToEdit(account);
    setShowEditModal(true);
  };

  const handleDeleteAccount = (account: EmailAccount) => {
    setAccountToDelete(account);
    setShowDeleteAlert(true);
  };

  const confirmDeleteAccount = async () => {
    if (accountToDelete) {
      try {
        await deleteAccount(accountToDelete.id);
        setShowDeleteAlert(false);
        setAccountToDelete(null);
        toast({
          title: "Account email eliminato",
          description: "L'account email è stato eliminato con successo.",
        });
      } catch (error: any) {
        toast({
          title: "Errore",
          description: error.message || "Si è verificato un errore durante l'eliminazione dell'account email.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Save profile settings
  const saveProfile = () => {
    // Il toast viene già mostrato nel hook useUserProfile, quindi non lo aggiungiamo qui
    updateProfile.mutate(profileForm);
  };
  
  // Save password settings
  const savePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }
    
    updatePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }, {
      onSuccess: () => {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    });
  };
  
  // Save general settings
  const saveSettings = () => {
    // Call saveProfile to actually save the user data
    saveProfile();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Settings</h1>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="datamgmt">Gestione Dati</TabsTrigger>
        </TabsList>
        
        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      name="fullName"
                      value={profileForm.fullName}
                      onChange={handleProfileFormChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileFormChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileFormChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input 
                      id="jobTitle" 
                      name="jobTitle"
                      value={profileForm.jobTitle}
                      onChange={handleProfileFormChange}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <p className="text-sm text-muted-foreground">
                        Set your local timezone for accurate scheduling
                      </p>
                    </div>
                    <Select 
                      name="timezone" 
                      defaultValue="Europe/Rome"
                      onValueChange={(value) => setProfileForm({...profileForm, timezone: value})}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="h-80">
                        <SelectGroup>
                          <SelectLabel>Europe</SelectLabel>
                          <SelectItem value="Europe/Rome">Europe/Rome</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                          <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                          <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                          <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
                          <SelectItem value="Europe/Athens">Europe/Athens</SelectItem>
                          <SelectItem value="Europe/Moscow">Europe/Moscow</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>America</SelectLabel>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                          <SelectItem value="America/Denver">America/Denver</SelectItem>
                          <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                          <SelectItem value="America/Toronto">America/Toronto</SelectItem>
                          <SelectItem value="America/Mexico_City">America/Mexico_City</SelectItem>
                          <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Asia</SelectLabel>
                          <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                          <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                          <SelectItem value="Asia/Hong_Kong">Asia/Hong_Kong</SelectItem>
                          <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                          <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                          <SelectItem value="Asia/Bangkok">Asia/Bangkok</SelectItem>
                          <SelectItem value="Asia/Seoul">Asia/Seoul</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred language
                      </p>
                    </div>
                    <Select 
                      name="language" 
                      defaultValue="English"
                      onValueChange={(value) => setProfileForm({...profileForm, language: value})}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="h-80">
                        <SelectGroup>
                          <SelectLabel>Europe</SelectLabel>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Italian">Italian</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveSettings}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Manage your email accounts and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Accounts
                </h3>
                <Button onClick={() => setShowEmailModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Account
                </Button>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : emailAccounts && emailAccounts.length > 0 ? (
                <div className="space-y-4">
                  {emailAccounts.map(account => (
                    <Card key={account.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{account.name}</h4>
                          <p className="text-sm text-muted-foreground">{account.email}</p>
                          <div className="mt-1 flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                            <span className="text-xs text-muted-foreground">Connesso</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifica
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteAccount(account)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Rimuovi
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <Mail className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium mb-1">Nessun Account Email</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      Connetti i tuoi account email per inviare e ricevere email direttamente dal CRM.
                    </p>
                    <Button onClick={() => setShowEmailModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Account Email
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important events
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Default Signature</Label>
                      <p className="text-sm text-muted-foreground">
                        Select your default email signature
                      </p>
                    </div>
                    <Select defaultValue="default">
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select signature" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Professional Signature</SelectItem>
                        <SelectItem value="casual">Casual Signature</SelectItem>
                        <SelectItem value="minimal">Minimal Signature</SelectItem>
                        <SelectItem value="none">No Signature</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage when and how you get notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  In-App Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Task Assigned</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you are assigned a new task
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Deals</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new deals are created
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Appointment Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders for upcoming appointments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Share2 className="h-5 w-5 mr-2" />
                  Push Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow notifications on your device
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Theme</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Button 
                    variant={theme === "light" ? "default" : "outline"}
                    className="flex flex-col items-center justify-center h-24"
                    onClick={() => setTheme("light")}
                  >
                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-md mb-2 shadow-sm" />
                    Light
                  </Button>
                  <Button 
                    variant={theme === "dark" ? "default" : "outline"}
                    className="flex flex-col items-center justify-center h-24"
                    onClick={() => setTheme("dark")}
                  >
                    <div className="w-12 h-12 bg-gray-900 border border-gray-700 rounded-md mb-2 shadow-sm" />
                    Dark
                  </Button>
                  <Button 
                    variant={theme === "system" ? "default" : "outline"}
                    className="flex flex-col items-center justify-center h-24"
                    onClick={() => setTheme("system")}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-900 rounded-md mb-2 shadow-sm" />
                    System
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Layout Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Reduce spacing to show more content
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveSettings}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Password
                </h3>
                <form onSubmit={savePassword} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input 
                        id="currentPassword" 
                        name="currentPassword"
                        type="password" 
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword" 
                        name="newPassword"
                        type="password" 
                        value={passwordForm.newPassword}
                        onChange={handlePasswordFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword" 
                        name="confirmPassword"
                        type="password" 
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordFormChange}
                      />
                    </div>
                  </div>
                  <Button type="submit">Update Password</Button>
                </form>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Account Security
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Gestione Dati Settings */}
        <TabsContent value="datamgmt">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Dati</CardTitle>
              <CardDescription>
                Importa ed esporta dati da e verso il sistema CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Colonna Contatti */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <h3 className="text-lg font-medium mb-4">Contatti</h3>
                    <ImportExportManager
                      entityType="contacts"
                      title="Contatti"
                    />
                  </CardContent>
                </Card>

                {/* Colonna Aziende */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <h3 className="text-lg font-medium mb-4">Aziende</h3>
                    <ImportExportManager
                      entityType="companies"
                      title="Aziende"
                    />
                  </CardContent>
                </Card>

                {/* Colonna Opportunità */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <h3 className="text-lg font-medium mb-4">Opportunità</h3>
                    <ImportExportManager
                      entityType="leads"
                      title="Opportunità"
                    />
                  </CardContent>
                </Card>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Strumenti Avanzati
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <CardContent className="p-0">
                      <DuplicateAnalyzer entityType="contacts" />
                    </CardContent>
                  </Card>

                  <Card className="p-6">
                    <CardContent className="p-0">
                      <AIEnhancer entityType="contacts" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog per l'aggiunta di account email */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Aggiungi Account Email</DialogTitle>
            <DialogDescription>
              Connetti il tuo account email per inviare e ricevere messaggi direttamente dal CRM.
            </DialogDescription>
          </DialogHeader>
          
          <EmailAccountForm 
            onSuccess={() => {
              setShowEmailModal(false);
              // La notifica viene gestita all'interno di useEmailAccounts
            }}
            onCancel={() => setShowEmailModal(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Dialog per la modifica di un account email */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifica account email</DialogTitle>
            <DialogDescription>
              Modifica le impostazioni del tuo account email. Lascia vuota la password se non vuoi cambiarla.
            </DialogDescription>
          </DialogHeader>
          
          <EmailAccountForm 
            onSuccess={() => {
              setShowEditModal(false);
              setAccountToEdit(null);
              // La notifica viene gestita all'interno di useEmailAccounts
            }}
            onCancel={() => {
              setShowEditModal(false);
              setAccountToEdit(null);
            }}
            accountToEdit={accountToEdit}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>
      
      {/* Alert per la conferma di eliminazione account */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione rimuoverà l'account email "{accountToDelete?.email}" dal tuo CRM.
              Potrai sempre aggiungerlo nuovamente in seguito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAccount} className="bg-destructive text-destructive-foreground">
              Rimuovi Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}