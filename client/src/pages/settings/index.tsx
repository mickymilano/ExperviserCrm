import { useState } from "react";
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

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  // Email accounts state and handlers
  const { data: accounts, isLoading } = useEmailAccounts();
  const deleteAccountMutation = useDeleteEmailAccount();
  const createAccountMutation = useCreateEmailAccount();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<EmailAccount | null>(null);
  
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

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully",
    });
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
                    <Input id="fullName" defaultValue="John Smith" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="john@experviser.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue="+1 (555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" defaultValue="Consultant" />
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
                    <Input id="timezone" className="w-64" defaultValue="America/New_York" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred language
                      </p>
                    </div>
                    <Input id="language" className="w-64" defaultValue="English" />
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
                  Add Account
                </Button>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : accounts && accounts.length > 0 ? (
                <div className="space-y-4">
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
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteAccount(account)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="md:col-span-2">
                    <Separator />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>
                <Button variant="outline">Change Password</Button>
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
