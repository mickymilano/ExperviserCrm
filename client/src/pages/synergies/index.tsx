import { useState } from "react";
import { Handshake, Plus, Filter, RefreshCw } from "lucide-react";
import { useSynergies } from "@/hooks/useSynergies";
import { SynergyModal } from "@/components/modals/SynergyModal";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function SynergiesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSynergy, setEditingSynergy] = useState<any>(null);
  const { data: synergies, isLoading, refetch } = useSynergies();

  const handleEditSynergy = (synergy: any) => {
    setEditingSynergy(synergy);
  };

  const handleCloseEditModal = () => {
    setEditingSynergy(null);
  };

  const getSynergyStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Pending":
        return "bg-yellow-500";
      case "Inactive":
        return "bg-gray-500";
      case "On Hold":
        return "bg-blue-500";
      case "Completed":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Handshake className="h-8 w-8 mr-2" />
              Business Synergies
            </h1>
            <p className="text-muted-foreground">
              Manage business relationships between contacts and companies
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Synergy
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : synergies && synergies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {synergies.map((synergy: any) => (
              <Card 
                key={synergy.id} 
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEditSynergy(synergy)}
              >
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{synergy.type}</CardTitle>
                    <Badge className={getSynergyStatusColor(synergy.status)}>
                      {synergy.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    ID: {synergy.id} • Created on {format(new Date(synergy.createdAt), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">
                      {synergy.description || "No description provided"}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Contact ID</p>
                      <p>{synergy.contactId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Company ID</p>
                      <p>{synergy.companyId}</p>
                    </div>
                  </div>
                  {synergy.dealId && (
                    <div className="mt-2">
                      <p className="text-muted-foreground mb-1 text-sm">Associated Deal</p>
                      <p className="text-sm">Deal #{synergy.dealId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Handshake className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-medium mb-2">No Business Synergies Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                There are currently no business synergies in the system. Start by creating
                your first synergy between a contact and a company.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Synergy
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Synergy Modal */}
      <SynergyModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
        onSuccess={() => refetch()}
      />

      {/* Edit Synergy Modal */}
      {editingSynergy && (
        <SynergyModal
          open={!!editingSynergy}
          onOpenChange={handleCloseEditModal}
          initialData={editingSynergy}
          mode="edit"
          onSuccess={() => refetch()}
        />
      )}
    </AppLayout>
  );
}