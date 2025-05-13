import { useState, useEffect } from "react";
import { useEmailAccounts, useDeleteEmailAccount, useCreateEmailAccount } from "@/hooks/useEmailAccounts";
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
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailAccount } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
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
  const { data: accounts, isLoading } = useEmailAccounts();
  const deleteAccountMutation = useDeleteEmailAccount();
  const createAccountMutation = useCreateEmailAccount();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<EmailAccount | null>(null);
  
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
  
  // Form state for email account
  const [emailForm, setEmailForm] = useState({
    email: "",
    displayName: "",
    imapHost: "",
    imapPort: 993,
    smtpHost: "",
    smtpPort: 587,
    username: "",
    password: "",
  });

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

  const handleEmailFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailForm({
      ...emailForm,
      [name]: name === "imapPort" || name === "smtpPort" ? parseInt(value) : value,
    });
  };

  const handleEmailFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate({
      ...emailForm,
      userId: 1, // Assuming user ID 1 for demo
    }, {
      onSuccess: () => {
        setShowEmailModal(false);
        setEmailForm({
          email: "",
          displayName: "",
          imapHost: "",
          imapPort: 993,
          smtpHost: "",
          smtpPort: 587,
          username: "",
          password: "",
        });
      }
    });
  };

  const handleDeleteAccount = (account: EmailAccount) => {
    setAccountToDelete(account);
    setShowDeleteAlert(true);
  };

  const confirmDeleteAccount = () => {
    if (accountToDelete) {
      deleteAccountMutation.mutate(accountToDelete.id);
      setShowDeleteAlert(false);
      setAccountToDelete(null);
    }
  };
  
  // Save profile settings
  const saveProfile = () => {
    updateProfile.mutate(profileForm, {
      onSuccess: () => {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });
      }
    });
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
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-5">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
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
                        <SelectGroup>
                          <SelectLabel>Australia/Pacific</SelectLabel>
                          <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                          <SelectItem value="Australia/Melbourne">Australia/Melbourne</SelectItem>
                          <SelectItem value="Australia/Perth">Australia/Perth</SelectItem>
                          <SelectItem value="Pacific/Auckland">Pacific/Auckland</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Africa</SelectLabel>
                          <SelectItem value="Africa/Cairo">Africa/Cairo</SelectItem>
                          <SelectItem value="Africa/Johannesburg">Africa/Johannesburg</SelectItem>
                          <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                          <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
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
                          <SelectItem value="Portuguese">Portuguese</SelectItem>
                          <SelectItem value="Dutch">Dutch</SelectItem>
                          <SelectItem value="Greek">Greek</SelectItem>
                          <SelectItem value="Swedish">Swedish</SelectItem>
                          <SelectItem value="Polish">Polish</SelectItem>
                          <SelectItem value="Russian">Russian</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Asia</SelectLabel>
                          <SelectItem value="Chinese">Chinese</SelectItem>
                          <SelectItem value="Japanese">Japanese</SelectItem>
                          <SelectItem value="Korean">Korean</SelectItem>
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="Arabic">Arabic</SelectItem>
                          <SelectItem value="Turkish">Turkish</SelectItem>
                          <SelectItem value="Thai">Thai</SelectItem>
                          <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Other</SelectLabel>
                          <SelectItem value="Afrikaans">Afrikaans</SelectItem>
                          <SelectItem value="Swahili">Swahili</SelectItem>
                          <SelectItem value="Hebrew">Hebrew</SelectItem>
                          <SelectItem value="Malay">Malay</SelectItem>
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
                <Button disabled title="Funzionalità in fase di sviluppo">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : accounts && Array.isArray(accounts) && accounts.length > 0 ? (
                <div className="space-y-4">
                  {/* Mostra un messaggio che indica che la funzionalità è temporaneamente disabilitata */}
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-4">
                    <div className="flex">
                      <Info className="h-5 w-5 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Funzionalità in fase di sviluppo</h3>
                        <p className="text-sm mt-1">
                          La gestione degli account email è temporaneamente disabilitata durante l'aggiornamento del sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mostra gli account in modalità di sola lettura */}
                  {accounts.map(account => (
                    <Card key={account.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{account.displayName}</h4>
                          <p className="text-sm text-muted-foreground">{account.email}</p>
                          <div className="mt-1 flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                            <span className="text-xs text-muted-foreground">Connected</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" disabled>Edit</Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled
                          >
                            Remove
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
                    <h3 className="text-lg font-medium mb-1">No Email Accounts</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      Connect your email accounts to send and receive emails directly from the CRM.
                    </p>
                    <Button onClick={() => setShowEmailModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Email Account
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
                      <Label>Email Signature</Label>
                      <p className="text-sm text-muted-foreground">
                        Set your default email signature
                      </p>
                    </div>
                    <Button variant="outline">Edit Signature</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Default Send Behavior</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose when to send emails by default
                      </p>
                    </div>
                    <Input className="w-64" defaultValue="Send immediately" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveSettings}>Save Changes</Button>
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
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications in your browser
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about upcoming tasks
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Meeting Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about upcoming meetings
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveSettings}>Save Changes</Button>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sidebar Width</Label>
                      <p className="text-sm text-muted-foreground">
                        Adjust the width of the sidebar
                      </p>
                    </div>
                    <Input className="w-64" defaultValue="Default" />
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
                    <div className="md:col-span-2">
                      <Separator />
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
                  <Button type="submit" disabled={updatePassword.isPending}>
                    {updatePassword.isPending ? "Updating..." : "Change Password"}
                  </Button>
                </form>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Options
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Setup</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Session Management</Label>
                      <p className="text-sm text-muted-foreground">
                        Manage active sessions and sign out remotely
                      </p>
                    </div>
                    <Button variant="outline">Manage</Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center text-destructive">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Danger Zone
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-destructive">Delete Account</Label>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all your data
                      </p>
                    </div>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Email Account Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Email Account</DialogTitle>
            <DialogDescription>
              Connect your email account to send and receive emails in the CRM.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEmailFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  value={emailForm.email}
                  onChange={handleEmailFormChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={emailForm.displayName}
                  onChange={handleEmailFormChange}
                  placeholder="Your Name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imapHost">IMAP Server</Label>
                  <Input
                    id="imapHost"
                    name="imapHost"
                    value={emailForm.imapHost}
                    onChange={handleEmailFormChange}
                    placeholder="imap.example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imapPort">IMAP Port</Label>
                  <Input
                    id="imapPort"
                    name="imapPort"
                    type="number"
                    value={emailForm.imapPort}
                    onChange={handleEmailFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Server</Label>
                  <Input
                    id="smtpHost"
                    name="smtpHost"
                    value={emailForm.smtpHost}
                    onChange={handleEmailFormChange}
                    placeholder="smtp.example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    name="smtpPort"
                    type="number"
                    value={emailForm.smtpPort}
                    onChange={handleEmailFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={emailForm.username}
                  onChange={handleEmailFormChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={emailForm.password}
                  onChange={handleEmailFormChange}
                  placeholder="••••••••••"
                  required
                />
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Info className="h-3 w-3 mr-1" />
                  For Gmail, you may need to create an App Password.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAccountMutation.isPending}>
                {createAccountMutation.isPending ? "Connecting..." : "Connect Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Account Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the email account "{accountToDelete?.email}" from your CRM.
              You can always add it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAccount} className="bg-destructive text-destructive-foreground">
              {deleteAccountMutation.isPending ? "Removing..." : "Remove Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
