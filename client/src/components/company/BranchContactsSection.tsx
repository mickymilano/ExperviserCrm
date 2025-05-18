import React, { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Contact } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Phone, Mail, Building, ChevronRight, Users, Briefcase } from 'lucide-react';

// Tipo per le filiali (branches)
interface Branch {
  id: number;
  name: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  isHeadquarters: boolean;
}

// Tipo per i contatti collegati a filiali
interface BranchWithContacts {
  branch: Branch;
  contacts: Contact[];
}

interface BranchContactsSectionProps {
  companyId: number;
  companyName: string;
}

export default function BranchContactsSection({ companyId, companyName }: BranchContactsSectionProps) {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Recupera l'elenco delle filiali dell'azienda
  const { 
    data: branches, 
    isLoading: isLoadingBranches,
    error: branchesError
  } = useQuery({
    queryKey: ['/api/branches/company', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/branches/company/${companyId}`);
      if (!res.ok) throw new Error(t('company.branches.errors.fetchBranches'));
      const data = await res.json();
      console.log(`Retrieved ${data.length} branches for company ${companyId}`);
      return data;
    },
    enabled: !!companyId
  });

  // Recupera tutti i contatti con le loro aree di attività
  const { 
    data: allContacts, 
    isLoading: isLoadingContacts,
    error: contactsError 
  } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      const res = await fetch(`/api/contacts?includeAreas=true`);
      if (!res.ok) throw new Error(t('company.contacts.errors.fetchContacts'));
      const data = await res.json();
      console.log(`Retrieved ${data.length} total contacts with their areas`);
      return data;
    }
  });

  // Organizziamo i contatti per filiale
  const branchesWithContacts = useMemo(() => {
    if (!branches || !allContacts) return [];

    // Filtra i contatti che hanno aree di attività associate a filiali di questa azienda
    const branchContactMap: Record<number, Contact[]> = {};
    
    // Inizializza la mappa con tutte le filiali (anche quelle senza contatti)
    branches.forEach(branch => {
      branchContactMap[branch.id] = [];
    });
    
    // Aggiungi i contatti alle filiali appropriate
    allContacts.forEach(contact => {
      if (!contact.areasOfActivity) return;
      
      // Per ogni contatto, controlla le aree di attività
      contact.areasOfActivity.forEach(area => {
        // Se l'area è associata a una filiale di questa azienda
        if (area.branchId && branches.some(branch => branch.id === area.branchId)) {
          // Aggiungi il contatto all'elenco della filiale
          if (!branchContactMap[area.branchId].some(c => c.id === contact.id)) {
            branchContactMap[area.branchId].push(contact);
          }
        }
      });
    });
    
    // Converti la mappa in un array di oggetti {branch, contacts}
    return branches
      .map(branch => ({
        branch,
        contacts: branchContactMap[branch.id] || []
      }))
      // Filtra solo le filiali che hanno contatti, a meno che non vogliamo mostrare tutte le filiali
      .filter(item => item.contacts.length > 0);
  }, [branches, allContacts]);

  // Calcola il numero totale di contatti nelle filiali
  const totalBranchContacts = useMemo(() => {
    // Usare un Set per evitare di contare duplicati (contatti che appartengono a più filiali)
    const uniqueContactIds = new Set<number>();
    
    branchesWithContacts.forEach(item => {
      item.contacts.forEach(contact => {
        uniqueContactIds.add(contact.id);
      });
    });
    
    return uniqueContactIds.size;
  }, [branchesWithContacts]);

  // Gestisci stato di caricamento
  if (isLoadingBranches || isLoadingContacts) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            {t('company.branchContacts.title')}
          </CardTitle>
          <CardDescription>
            {t('company.branchContacts.loading')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gestisci errori
  if (branchesError || contactsError) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-red-500">
            <Building className="h-5 w-5 mr-2" />
            {t('company.branchContacts.errorTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            {t('company.branchContacts.errorMessage')}
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/branches/company', companyId] });
              queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
            }}
          >
            {t('common.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se non ci sono filiali con contatti, non mostrare la sezione
  if (!branchesWithContacts || branchesWithContacts.length === 0) {
    // Opzionale: restituire null per nascondere completamente la sezione
    // return null;
    
    // Oppure mostrare un messaggio
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Contatti dalle Filiali
          </CardTitle>
          <CardDescription>
            Nessun contatto dalle filiali di {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {t('company.branchContacts.noContacts')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="h-5 w-5 mr-2" />
          {t('company.branchContacts.title')} ({totalBranchContacts})
        </CardTitle>
        <CardDescription>
          {t('company.branchContacts.description', { companyName })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-4">
          {branchesWithContacts.map((item) => (
            <AccordionItem key={item.branch.id} value={`branch-${item.branch.id}`} className="border rounded-md">
              <AccordionTrigger className="px-4 py-2 hover:bg-accent hover:text-accent-foreground group rounded-t-md">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{item.branch.name}</span>
                    {item.branch.isHeadquarters && (
                      <Badge variant="outline" className="ml-2">
                        {t('company.branches.headquarters')}
                      </Badge>
                    )}
                  </div>
                  <Badge className="ml-2 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    {item.contacts.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-2 bg-accent/10">
                <div className="space-y-4 py-2">
                  {item.contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start space-x-4 p-3 rounded-lg bg-background">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{contact.firstName} {contact.lastName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {contact.role || t('company.contacts.noRoleSpecified')}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                            className="ml-2"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap mt-2 gap-2 text-sm">
                          {contact.companyEmail && (
                            <a 
                              href={`mailto:${contact.companyEmail}`} 
                              className="flex items-center text-muted-foreground hover:text-foreground"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              {contact.companyEmail}
                            </a>
                          )}
                          {contact.mobilePhone && (
                            <a 
                              href={`tel:${contact.mobilePhone}`} 
                              className="flex items-center text-muted-foreground hover:text-foreground"
                            >
                              <Phone className="h-3.5 w-3.5 mr-1" />
                              {contact.mobilePhone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}