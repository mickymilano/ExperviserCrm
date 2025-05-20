import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  AlertCircle, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  RefreshCw, 
  Star,
  StarOff,
  ToggleLeft,
  ToggleRight,
  Trash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

import type { EmailAccount } from '../../../../shared/schema';
import { useEmailAccounts, useDeleteEmailAccount, useSyncEmailAccount, useSyncAllEmailAccounts } from '../../hooks/useEmailAccounts';
import { useSetPrimaryEmailAccount, useToggleEmailAccountActive, useAccountStatusColor } from '../../hooks/useEmailSettings';
import { useToast } from '../../hooks/use-toast';

export function EmailAccountList() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [expandedAccountId, setExpandedAccountId] = useState<number | null>(null);
  
  const { data: accounts = [], isLoading } = useEmailAccounts();
  const deleteAccount = useDeleteEmailAccount();
  const syncAccount = useSyncEmailAccount();
  const syncAllAccounts = useSyncAllEmailAccounts();
  const setPrimaryAccount = useSetPrimaryEmailAccount();
  const toggleAccountActive = useToggleEmailAccountActive();
  const getStatusColor = useAccountStatusColor;
  
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this email account?')) {
      try {
        await deleteAccount.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete account:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete email account.',
          variant: 'destructive',
        });
      }
    }
  };
  
  const handleSync = async (id: number) => {
    try {
      await syncAccount.mutateAsync(id);
    } catch (error) {
      console.error('Failed to sync account:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync email account.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSyncAll = async () => {
    try {
      await syncAllAccounts.mutateAsync();
    } catch (error) {
      console.error('Failed to sync all accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync email accounts.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSetPrimary = async (id: number) => {
    try {
      await setPrimaryAccount.mutateAsync(id);
    } catch (error) {
      console.error('Failed to set primary account:', error);
      toast({
        title: 'Error',
        description: 'Failed to set primary account.',
        variant: 'destructive',
      });
    }
  };
  
  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await toggleAccountActive.mutateAsync({ id, isActive });
    } catch (error) {
      console.error('Failed to toggle account status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account status.',
        variant: 'destructive',
      });
    }
  };
  
  const toggleExpand = (id: number) => {
    setExpandedAccountId(prevId => prevId === id ? null : id);
  };
  
  if (isLoading) {
    return <div className="p-4">Loading email accounts...</div>;
  }
  
  if (!accounts.length) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">No email accounts configured</p>
        <Button onClick={() => navigate('/email/accounts/add')}>Add Email Account</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Email Accounts</h2>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={syncAllAccounts.isPending}>
            {syncAllAccounts.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync All
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => navigate('/email/accounts/add')}>Add Account</Button>
        </div>
      </div>
      
      {accounts.map((account) => (
        <Card key={account.id} className={account.isActive === false ? 'opacity-60' : ''}>
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 mr-2"
                  onClick={() => toggleExpand(account.id)}
                >
                  {expandedAccountId === account.id ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </Button>
                
                <div className="flex items-center gap-2">
                  {/* Status indicator */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(account.status)}`}></div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {account.status === 'ok' ? 'Connected' : 
                         account.status === 'error' ? 'Error: ' + account.lastError : 
                         account.status === 'warning' ? 'Warning' : 'Unknown status'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <CardTitle className="text-base">{account.displayName}</CardTitle>
                  <span className="text-sm text-muted-foreground">{account.email}</span>
                  
                  {account.isPrimary && (
                    <Badge variant="outline" className="ml-2 bg-amber-100">Primary</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Sync button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSync(account.id)}
                        disabled={syncAccount.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 ${syncAccount.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sync Account</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Set as primary */}
                {!account.isPrimary && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetPrimary(account.id)}
                          disabled={setPrimaryAccount.isPending}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Set as Primary</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Toggle active state */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(account.id, !account.isActive)}
                        disabled={toggleAccountActive.isPending}
                      >
                        {account.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {account.isActive ? 'Disable Account' : 'Enable Account'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Edit button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/email/accounts/${account.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Account</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Delete button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(account.id)}
                        disabled={deleteAccount.isPending}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Account</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          
          {expandedAccountId === account.id && (
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">IMAP Settings</p>
                  <p>Host: {account.imapHost}</p>
                  <p>Port: {account.imapPort}</p>
                  <p>Secure: {account.imapSecure ? 'Yes' : 'No'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">SMTP Settings</p>
                  <p>Host: {account.smtpHost}</p>
                  <p>Port: {account.smtpPort}</p>
                  <p>Secure: {account.smtpSecure ? 'Yes' : 'No'}</p>
                </div>
                {account.lastSyncTime && (
                  <div className="col-span-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(account.lastSyncTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}