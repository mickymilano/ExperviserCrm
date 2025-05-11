import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Network, RefreshCw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layouts/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  companyEmail?: string;
};

type Company = {
  id: number;
  name: string;
  email?: string;
};

type AreaOfActivity = {
  id: number;
  contactId: number;
  companyId: number | null;
  companyName: string | null;
  role: string | null;
  jobDescription: string | null;
  isPrimary: boolean | null;
};

function RelationsDebugPage() {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Fetch companies
  const { data: companies, isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Track relationships for each contact and company
  const [contactRelationships, setContactRelationships] = useState<
    Record<number, AreaOfActivity[]>
  >({});
  const [companyRelationships, setCompanyRelationships] = useState<
    Record<number, Contact[]>
  >({});

  // Load the relationships for a specific contact
  const loadContactRelationships = async (contactId: number) => {
    try {
      const areas = await apiRequest<AreaOfActivity[]>(
        `/api/contacts/${contactId}/areas-of-activity`,
        "GET"
      );
      setContactRelationships((prev) => ({
        ...prev,
        [contactId]: areas,
      }));
    } catch (error) {
      console.error("Failed to load contact relationships:", error);
    }
  };

  // Load the relationships for a specific company
  const loadCompanyRelationships = async (companyId: number) => {
    try {
      const contacts = await apiRequest<Contact[]>(
        `/api/companies/${companyId}/contacts`,
        "GET"
      );
      setCompanyRelationships((prev) => ({
        ...prev,
        [companyId]: contacts,
      }));
    } catch (error) {
      console.error("Failed to load company relationships:", error);
    }
  };

  // Load all relationships
  const loadAllRelationships = async () => {
    if (!contacts || !companies) return;

    // Load for all contacts
    for (const contact of contacts) {
      await loadContactRelationships(contact.id);
    }

    // Load for all companies
    for (const company of companies) {
      await loadCompanyRelationships(company.id);
    }
  };

  // Run maintenance script to fix relationships
  const fixRelationships = async () => {
    setIsFixing(true);
    try {
      await apiRequest("/api/maintenance/fix-contacts-relationships", "POST");
      toast({
        title: "Relazioni corrette",
        description: "Le relazioni tra contatti e aziende sono state corrette con successo.",
      });
      // Reload relationships
      await loadAllRelationships();
    } catch (error) {
      console.error("Failed to fix relationships:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la correzione delle relazioni.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Load relationships when data is available
  useEffect(() => {
    if (contacts && companies) {
      loadAllRelationships();
    }
  }, [contacts, companies]);

  // Count missing or problematic relationships
  const countProblems = () => {
    let problems = 0;
    
    // Companies with no contacts
    companies?.forEach(company => {
      const companyContacts = companyRelationships[company.id] || [];
      if (companyContacts.length === 0) {
        problems++;
      }
    });
    
    // Check bidirectional relationships
    contacts?.forEach(contact => {
      const areas = contactRelationships[contact.id] || [];
      areas.forEach(area => {
        if (area.companyId) {
          const companyContacts = companyRelationships[area.companyId] || [];
          const isConnectedBack = companyContacts.some(c => c.id === contact.id);
          if (!isConnectedBack) {
            problems++;
          }
        }
      });
    });
    
    return problems;
  };

  const relationshipProblems = countProblems();

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <Network className="mr-2 h-6 w-6" /> Contact-Company Relationship Debug
                </CardTitle>
                <CardDescription>
                  Tool for verifying and fixing relationships between contacts and companies
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAllRelationships}
                  disabled={contactsLoading || companiesLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={fixRelationships}
                  disabled={isFixing}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Fix Relationships
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                <ul className="space-y-2">
                  <li>Total contacts: {contacts?.length || 0}</li>
                  <li>Total companies: {companies?.length || 0}</li>
                  <li className="flex items-center">
                    Relationship issues: {relationshipProblems}
                    {relationshipProblems > 0 ? (
                      <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
                    ) : (
                      <Check className="ml-2 h-4 w-4 text-green-500" />
                    )}
                  </li>
                </ul>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Integrity Status</h3>
                {relationshipProblems === 0 ? (
                  <div className="flex items-center text-green-600">
                    <Check className="mr-2 h-5 w-5" />
                    <span>All relationships are intact and bidirectional</span>
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    <span>
                      {relationshipProblems} relationship issues detected
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="contacts">
          <TabsList className="mb-4">
            <TabsTrigger value="contacts">Contacts View</TabsTrigger>
            <TabsTrigger value="companies">Companies View</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts">
            <div className="grid grid-cols-1 gap-4">
              {contactsLoading ? (
                <div>Loading contacts...</div>
              ) : (
                contacts?.map((contact) => (
                  <Card key={contact.id}>
                    <CardHeader>
                      <CardTitle>
                        {contact.firstName} {contact.lastName}
                      </CardTitle>
                      <CardDescription>
                        {contact.companyEmail || "No company email"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2">Areas of Activity:</h3>
                      {contactRelationships[contact.id]?.length ? (
                        <ul className="space-y-2">
                          {contactRelationships[contact.id].map((area) => (
                            <li
                              key={area.id}
                              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">
                                    {area.companyName || "Company without name"}
                                    {area.isPrimary && (
                                      <Badge className="ml-2">Primary</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Role: {area.role || "Not specified"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Description: {area.jobDescription || "Not specified"}
                                  </div>
                                </div>
                                <div>
                                  {area.companyId ? (
                                    companyRelationships[area.companyId]?.some(
                                      (c) => c.id === contact.id
                                    ) ? (
                                      <Badge variant="outline" className="bg-green-100">
                                        <Check className="h-3 w-3 mr-1" /> Bidirectional
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-amber-100">
                                        <AlertTriangle className="h-3 w-3 mr-1" /> Contact → Company only
                                      </Badge>
                                    )
                                  ) : (
                                    <Badge variant="outline" className="bg-red-100">
                                      <AlertTriangle className="h-3 w-3 mr-1" /> Company not linked
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-500">
                          No areas of activity associated with this contact
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="companies">
            <div className="grid grid-cols-1 gap-4">
              {companiesLoading ? (
                <div>Loading companies...</div>
              ) : (
                companies?.map((company) => (
                  <Card key={company.id}>
                    <CardHeader>
                      <CardTitle>{company.name}</CardTitle>
                      <CardDescription>
                        {company.email || "No company email"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2">Associated Contacts:</h3>
                      {companyRelationships[company.id]?.length ? (
                        <ul className="space-y-2">
                          {companyRelationships[company.id].map((contact) => {
                            const area = (contactRelationships[contact.id] || []).find(
                              (a) => a.companyId === company.id
                            );
                            
                            return (
                              <li
                                key={contact.id}
                                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">
                                      {contact.firstName} {contact.lastName}
                                      {area?.isPrimary && (
                                        <Badge className="ml-2">Primary</Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Role: {area?.role || "Not specified"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Email: {contact.companyEmail || "Not specified"}
                                    </div>
                                  </div>
                                  <div>
                                    {area ? (
                                      <Badge variant="outline" className="bg-green-100">
                                        <Check className="h-3 w-3 mr-1" /> Bidirectional
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-amber-100">
                                        <AlertTriangle className="h-3 w-3 mr-1" /> Company → Contact only
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="text-gray-500">
                          No contacts associated with this company
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default RelationsDebugPage;