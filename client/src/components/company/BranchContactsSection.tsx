import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Map, Building, Mail, Phone, ChevronRight, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatPhoneNumber } from "@/lib/utils";

interface BranchContact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyEmail?: string;
  privateEmail?: string;
  mobilePhone?: string;
  officePhone?: string;
  role?: string;
  areasOfActivity?: {
    id: number;
    companyId: number;
    companyName: string;
    contactId: number;
    role: string;
    branchId?: number;
    isPrimary?: boolean;
  }[];
}

interface Branch {
  id: number;
  name: string;
  companyId: number;
  address?: string;
  managers?: {
    id: string;
    name: string;
    role: string;
    contactId?: string;
  }[];
}

interface BranchContactsSectionProps {
  companyId: number;
}

export default function BranchContactsSection({ companyId }: BranchContactsSectionProps) {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  
  // Fetch branches
  const { 
    data: branches, 
    isLoading: isLoadingBranches, 
    error: branchesError
  } = useQuery({
    queryKey: ["/api/branches/company", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/branches/company/${companyId}`);
      if (!res.ok) throw new Error("Failed to fetch branches");
      const data = await res.json();
      console.log(`Retrieved ${data.length} branches for company ${companyId}`);
      return data;
    }
  });

  // Fetch contacts with areas of activity
  const { 
    data: allContacts,
    isLoading: isLoadingContacts,
    error: contactsError
  } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch(`/api/contacts?includeAreas=true`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
    enabled: !!branches && branches.length > 0
  });

  // Group contacts by branch
  const branchContacts = useMemo(() => {
    if (!branches || !allContacts) return {};

    const contactsByBranch: Record<number, BranchContact[]> = {};
    
    // Initialize empty arrays for each branch
    branches.forEach(branch => {
      contactsByBranch[branch.id] = [];
    });

    // Find branch managers from branches data
    branches.forEach(branch => {
      if (branch.managers && branch.managers.length > 0) {
        branch.managers.forEach(manager => {
          if (manager.contactId) {
            // Find the contact for this manager
            const contact = allContacts.find(c => c.id.toString() === manager.contactId);
            if (contact) {
              // Add it to the branch contacts with special role
              const managerContact = {
                ...contact,
                role: manager.role || t('branches.detail.manager')
              };
              
              if (!contactsByBranch[branch.id].some(c => c.id === contact.id)) {
                contactsByBranch[branch.id].push(managerContact);
              }
            }
          }
        });
      }
    });

    // Add contacts with branch associations through areasOfActivity
    allContacts.forEach(contact => {
      if (contact.areasOfActivity && contact.areasOfActivity.length > 0) {
        contact.areasOfActivity.forEach(area => {
          if (area.branchId && area.companyId === companyId) {
            // Check if this contact is already in the branch list (as a manager)
            if (!contactsByBranch[area.branchId].some(c => c.id === contact.id)) {
              contactsByBranch[area.branchId].push({
                ...contact,
                role: area.role || t('branches.contact.employee')
              });
            }
          }
        });
      }
    });

    return contactsByBranch;
  }, [branches, allContacts, companyId, t]);

  // Check if we have any branch with at least one contact
  const hasAnyBranchContacts = useMemo(() => {
    if (!branches || !branchContacts) return false;
    return branches.some(branch => 
      branchContacts[branch.id] && branchContacts[branch.id].length > 0
    );
  }, [branches, branchContacts]);

  // Error and loading states
  const isLoading = isLoadingBranches || isLoadingContacts;
  const hasError = branchesError || contactsError;

  // Helper function to get initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            <Skeleton className="h-5 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-6 w-32 mb-2" />
                <div className="pl-4 space-y-4">
                  {Array.from({ length: 2 }).map((_, contactIndex) => (
                    <div key={contactIndex} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            {t('company.branches.contacts.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <X className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-medium mb-2">{t("company.branches.contacts.errorTitle")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("company.branches.contacts.errorDescription")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!branches || branches.length === 0) {
    return null; // Don't show anything if there are no branches
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="h-5 w-5 mr-2" />
          {t('company.branches.contacts.title')}
        </CardTitle>
        <CardDescription>
          {t('company.branches.contacts.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAnyBranchContacts ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-medium mb-2">{t("company.branches.contacts.emptyTitle")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("company.branches.contacts.emptyDescription")}
            </p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={branches.map(branch => `branch-${branch.id}`)}>
            {branches.map(branch => {
              const contacts = branchContacts[branch.id] || [];
              if (contacts.length === 0) return null;
              
              return (
                <AccordionItem key={branch.id} value={`branch-${branch.id}`} className="border-b">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center text-left">
                      <Map className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{branch.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {contacts.length} {contacts.length === 1 
                          ? t('company.branches.contacts.contact') 
                          : t('company.branches.contacts.contacts')}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-2">
                      {contacts.map(contact => (
                        <div key={contact.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(contact.firstName, contact.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">
                                {contact.firstName} {contact.lastName}
                              </h4>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8"
                                onClick={() => navigate(`/contacts/${contact.id}`)}
                              >
                                <span className="sr-only">{t('common.view')}</span>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {contact.role && (
                              <p className="text-sm text-muted-foreground">
                                {contact.role}
                              </p>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {(contact.email || contact.companyEmail || contact.privateEmail) && (
                                <div className="flex items-center text-sm">
                                  <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                                  <a
                                    href={`mailto:${contact.email || contact.companyEmail || contact.privateEmail}`}
                                    className="text-primary hover:underline truncate"
                                  >
                                    {contact.email || contact.companyEmail || contact.privateEmail}
                                  </a>
                                </div>
                              )}
                              
                              {(contact.phone || contact.mobilePhone || contact.officePhone) && (
                                <div className="flex items-center text-sm">
                                  <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                                  <span>
                                    {formatPhoneNumber(contact.phone || contact.mobilePhone || contact.officePhone)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-2 pb-4 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/branches/${branch.id}`)}
                        >
                          {t('company.branches.contacts.viewBranchDetails')}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}