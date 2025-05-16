import { useState, useEffect } from "react";
import { useCompanies, useCompany } from "@/hooks/useCompanies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import type { Company } from "@/types";
import { ChevronRight, ChevronDown, Building2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyHierarchyProps {
  companyId: number;
}

export function CompanyHierarchy({ companyId }: CompanyHierarchyProps) {
  const { data: allCompanies, isLoading: isLoadingCompanies } = useCompanies();
  const { data: currentCompany, isLoading: isLoadingCompany } = useCompany(companyId);
  const [hierarchyData, setHierarchyData] = useState<{
    parent: Company | null;
    current: Company | null;
    children: Company[];
  }>({
    parent: null,
    current: null,
    children: [],
  });
  
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (allCompanies && currentCompany) {
      // Trova l'azienda parent
      const parent = currentCompany.parentCompanyId
        ? allCompanies.find((c) => c.id === currentCompany.parentCompanyId)
        : null;
      
      // Trova le aziende figlie
      const children = allCompanies.filter(
        (c) => c.parentCompanyId === currentCompany.id
      );
      
      setHierarchyData({
        parent,
        current: currentCompany,
        children,
      });
    }
  }, [allCompanies, currentCompany]);

  const isLoading = isLoadingCompanies || isLoadingCompany;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Struttura Aziendale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Caricamento...
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasRelationships = hierarchyData.parent || hierarchyData.children.length > 0;

  if (!hasRelationships) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Struttura Aziendale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Nessuna relazione gerarchica
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle 
          className="text-sm font-medium flex items-center cursor-pointer" 
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 mr-1" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1" />
          )}
          Struttura Aziendale
        </CardTitle>
      </CardHeader>
      
      {expanded && (
        <CardContent>
          <div className="space-y-2">
            {/* Parent Company */}
            {hierarchyData.parent && (
              <div className="pl-2 border-l-2 border-gray-200">
                <div className="flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mr-1">Parent:</span>
                  <Link 
                    to={`/companies/${hierarchyData.parent.id}`} 
                    className="text-sm font-medium text-blue-600 hover:underline flex items-center"
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {hierarchyData.parent.name}
                  </Link>
                </div>
              </div>
            )}
            
            {/* Current Company */}
            <div className={cn(
              "pl-2",
              (hierarchyData.parent || hierarchyData.children.length > 0) && "border-l-2 border-blue-500"
            )}>
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-1 text-blue-600" />
                <span className="text-sm font-semibold">
                  {hierarchyData.current?.name}
                </span>
              </div>
            </div>
            
            {/* Child Companies */}
            {hierarchyData.children.length > 0 && (
              <div className="pl-2 border-l-2 border-gray-200 space-y-1.5">
                <span className="text-xs text-muted-foreground">Aziende Figlie:</span>
                {hierarchyData.children.map((child) => (
                  <div className="flex items-center pl-3" key={child.id}>
                    <Building2 className="h-3 w-3 mr-1" />
                    <Link 
                      to={`/companies/${child.id}`} 
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {child.name}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}