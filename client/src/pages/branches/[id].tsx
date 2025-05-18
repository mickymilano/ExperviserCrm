import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building, Phone, Mail, MapPin, Info, Users, Edit } from "lucide-react";
import BranchModal from "@/components/modals/BranchModal";
import BranchManagersViewer from "@/components/branches/BranchManagersViewer";

export default function BranchDetail() {
  const { t } = useTranslation();
  const params = useParams();
  const [_, navigate] = useLocation();
  const branchId = parseInt(params.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch branch data
  const { data: branch, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["/api/branches", branchId],
    queryFn: async () => {
      const res = await fetch(`/api/branches/${branchId}`);
      if (!res.ok) throw new Error("Failed to fetch branch");
      return res.json();
    },
    enabled: !isNaN(branchId),
  });

  // Fetch company data if we have a companyId
  const { data: company } = useQuery({
    queryKey: ["/api/companies", branch?.companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${branch.companyId}`);
      if (!res.ok) throw new Error("Failed to fetch company");
      return res.json();
    },
    enabled: !!branch?.companyId,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/branches")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/branches")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        <Card className="text-center p-6">
          <CardTitle className="text-xl mb-4">{t('branches.detail.errorTitle')}</CardTitle>
          <p className="text-muted-foreground mb-4">
            {t('branches.detail.errorDescription')}
          </p>
          <Button onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Intestazione e pulsanti */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => branch?.companyId ? navigate(`/companies/${branch.companyId}`) : navigate("/branches")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {branch?.companyId ? t('branches.detail.backToCompany') : t('common.back')}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{branch?.name}</h1>
          {branch?.isHeadquarters && (
            <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {t('branches.detail.headquartersBadge')}
            </span>
          )}
        </div>
        <Button onClick={() => setIsEditModalOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          {t('common.edit')}
        </Button>
      </div>

      {/* Tabs di navigazione */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <Info className="h-4 w-4 mr-2" />
            {t('branches.detail.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="managers">
            <Users className="h-4 w-4 mr-2" />
            {t('branches.detail.tabs.managers')}
          </TabsTrigger>
        </TabsList>
        
        {/* Contenuto della scheda Panoramica */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informazioni generali */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Building className="h-5 w-5 mr-2 inline-block" />
                  {t('branches.detail.generalInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('branches.detail.companyLabel')}
                  </h3>
                  <p className="text-base">
                    {company?.name || branch?.companyName || '-'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('branches.detail.typeLabel')}
                  </h3>
                  <p className="text-base">
                    {branch?.type || '-'}
                  </p>
                </div>
                {branch?.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t('branches.detail.descriptionLabel')}
                    </h3>
                    <p className="text-base">
                      {branch.description}
                    </p>
                  </div>
                )}
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('branches.detail.createdAtLabel')}
                  </h3>
                  <p className="text-base">
                    {branch?.createdAt 
                      ? new Date(branch.createdAt).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Informazioni di contatto */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <MapPin className="h-5 w-5 mr-2 inline-block" />
                  {t('branches.detail.contactInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {branch?.address && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t('branches.detail.addressLabel')}
                    </h3>
                    <p className="text-base flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-1 shrink-0" />
                      <span>
                        {branch.address}
                        {branch.city && `, ${branch.city}`}
                        {branch.region && `, ${branch.region}`}
                        {branch.postalCode && ` ${branch.postalCode}`}
                        {branch.country && `, ${branch.country}`}
                      </span>
                    </p>
                  </div>
                )}
                {branch?.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t('branches.detail.phoneLabel')}
                    </h3>
                    <p className="text-base flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${branch.phone}`} className="hover:underline">
                        {branch.phone}
                      </a>
                    </p>
                  </div>
                )}
                {branch?.email && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t('branches.detail.emailLabel')}
                    </h3>
                    <p className="text-base flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${branch.email}`} className="hover:underline">
                        {branch.email}
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Contenuto della scheda Manager */}
        <TabsContent value="managers">
          <BranchManagersViewer 
            branch={branch}
            onUpdate={refetch}
          />
        </TabsContent>
      </Tabs>

      {/* Modale di modifica */}
      <BranchModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialData={branch}
        onClose={refetch}
      />
    </div>
  );
}