import { useState } from "react";
import { useLocation } from "wouter";
import { useDeals, usePipelineStages } from "@/hooks/useDeals";
import { useContacts } from "@/hooks/useContacts";
import { useCompanies } from "@/hooks/useCompanies";
import { DealInfo } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, ChevronRight, TrendingUp, Calendar, DollarSign } from "lucide-react";
import NewDealModal from "@/components/modals/NewDealModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { DealPipelineBoard } from "@/components/deals/DealPipelineBoard";
import { useTranslation } from "react-i18next";

export default function Deals() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewType, setViewType] = useState<"board" | "list">("board");
  const { deals, isLoading } = useDeals({ status: 'active' });
  const { data: stages, isLoading: isLoadingStages } = usePipelineStages();
  const { contacts, isLoading: isLoadingContacts } = useContacts();
  const { companies, isLoading: isLoadingCompanies } = useCompanies();
  const [selectedDeal, setSelectedDeal] = useState<DealInfo | null>(null);
  const [, navigate] = useLocation();

  // Get contact name from id
  const getContactName = (contactId: number | null): string => {
    if (!contactId) return "-";
    const contact = contacts?.find((c) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : "-";
  };

  // Get company name from id
  const getCompanyName = (companyId: number | null): string => {
    if (!companyId) return "-";
    const company = companies?.find((c) => c.id === companyId);
    return company ? company.name : "-";
  };

  // Get stage name from id
  const getStageName = (stageId: number): string => {
    const stage = stages?.find((s) => s.id === stageId);
    return stage ? stage.name : "-";
  };

  // Filter deals based on search term
  const filteredDeals = deals?.filter((deal) => {
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      deal.name.toLowerCase().includes(searchTermLower) ||
      getContactName(deal.contactId).toLowerCase().includes(searchTermLower) ||
      getCompanyName(deal.companyId).toLowerCase().includes(searchTermLower)
    );
  });

  // Group deals by stage for board view
  const dealsByStage = stages?.map((stage) => ({
    ...stage,
    deals: filteredDeals?.filter((deal) => deal.stageId === stage.id) || []
  }));

  const isDataLoading = isLoading || isLoadingStages || isLoadingContacts || isLoadingCompanies;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">{t("deal.title")}</h1>
        <Button onClick={() => {
          setSelectedDeal(null);
          setShowModal(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> {t("deal.addDeal")}
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("deal.search")}
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="md:w-auto">
              <Filter className="mr-2 h-4 w-4" /> {t("deal.filter")}
            </Button>
          </div>
          
          <Tabs value={viewType} onValueChange={(value) => setViewType(value as "board" | "list")} className="w-full">
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="board">{t("deal.board")}</TabsTrigger>
              <TabsTrigger value="list">{t("deal.list")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {isDataLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : filteredDeals && filteredDeals.length > 0 ? (
        viewType === "board" ? (
          stages && stages.length > 0 ? (
            <DealPipelineBoard 
              stages={stages}
              deals={filteredDeals}
              getCompanyName={getCompanyName}
              getContactName={getContactName}
              onEditDeal={(deal) => {
                setSelectedDeal(deal);
                setShowModal(true);
              }}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-medium mb-2">{t("deal.notFound")}</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {t("deal.createFirstDeal")}
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">{t("deal.form.name")}</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">{t("deal.form.stage")}</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">{t("deal.form.value")}</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">{t("deal.form.company")}</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">{t("deal.form.contact")}</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">{t("deal.form.expectedCloseDate")}</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{deal.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2" />
                        {getStageName(deal.stageId)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(deal.value)}
                    </td>
                    <td className="py-3 px-4">{getCompanyName(deal.companyId)}</td>
                    <td className="py-3 px-4">{getContactName(deal.contactId)}</td>
                    <td className="py-3 px-4">
                      {deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), "MMM d, yyyy") : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8"
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        title="View Deal Details"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nessuna opportunità trovata</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "Prova a modificare i termini di ricerca."
                : "Inizia aggiungendo la tua prima opportunità."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Aggiungi Opportunità
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <NewDealModal
        open={showModal}
        onOpenChange={setShowModal}
        initialData={selectedDeal}
      />
    </div>
  );
}
