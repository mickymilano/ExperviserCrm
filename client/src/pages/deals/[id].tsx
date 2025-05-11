import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useDeal, usePipelineStages } from "@/hooks/useDeals";
import { useCompanies } from "@/hooks/useCompanies";
import { useContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Briefcase, CircleDollarSign, Calendar, Edit,
  Building2, User, Clock, AlertCircle, CheckCircle, Trash, FileText, 
} from "lucide-react";
import { formatCurrency, formatDateToLocal } from "@/lib/utils";
import DealModal from "@/components/modals/DealModal";
import TaskList from "@/components/tasks/TaskList";
import { Link } from "wouter";

export default function DealDetail() {
  const params = useParams();
  const [_, navigate] = useLocation();
  const dealId = parseInt(params.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  
  // Fetch deal data
  const { data: deal, isLoading, isError } = useDeal(dealId);
  
  // Fetch related data
  const { data: stages } = usePipelineStages();
  const { companies } = useCompanies();
  const { contacts } = useContacts();
  
  // Helper functions
  const getStageName = (stageId: number) => {
    const stage = stages?.find(s => s.id === stageId);
    return stage ? stage.name : "Unknown Stage";
  };
  
  const getCompanyName = (companyId: number | null) => {
    if (!companyId) return "No Company";
    const company = companies?.find(c => c.id === companyId);
    return company ? company.name : "Unknown Company";
  };
  
  const getContactName = (contactId: number | null) => {
    if (!contactId) return "No Contact";
    const contact = contacts?.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : "Unknown Contact";
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/deals")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-9 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (isError || !deal) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/deals")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Deal Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-medium mb-2">Deal Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The deal you're looking for doesn't exist or you don't have access.
            </p>
            <Button onClick={() => navigate("/deals")}>
              Return to Deals
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header with back button and deal name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/deals")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{deal.name}</h1>
          <Badge className="ml-2">{getStageName(deal.stageId)}</Badge>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Deal Details
              </CardTitle>
              <CardDescription>Overview of the deal information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Key Information */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Value</h3>
                  <div className="text-2xl font-bold flex items-center">
                    <CircleDollarSign className="h-5 w-5 mr-2 text-primary" />
                    {formatCurrency(deal.value)}
                  </div>
                </div>
                
                {deal.expectedCloseDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Expected Close Date</h3>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>{formatDateToLocal(new Date(deal.expectedCloseDate))}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {getStageName(deal.stageId)}
                  </Badge>
                </div>
                
                {deal.tags && deal.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {deal.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Related Entities */}
              <div className="space-y-6">
                {deal.companyId && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Company</h3>
                          <Link 
                            href={`/companies/${deal.companyId}`}
                            className="group flex items-center text-primary hover:underline"
                          >
                            <Building2 className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="font-medium">{getCompanyName(deal.companyId)}</span>
                          </Link>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8"
                          onClick={() => navigate(`/companies/${deal.companyId}`)}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {deal.contactId && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact</h3>
                          <Link 
                            href={`/contacts/${deal.contactId}`}
                            className="group flex items-center text-primary hover:underline"
                          >
                            <User className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="font-medium">{getContactName(deal.contactId)}</span>
                          </Link>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8"
                          onClick={() => navigate(`/contacts/${deal.contactId}`)}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Notes */}
          {deal.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{deal.notes}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Task List Component */}
          <TaskList 
            entityId={dealId} 
            entityType="deal" 
            title="Tasks"
          />
        </TabsContent>
        
        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Activities
              </CardTitle>
              <CardDescription>
                Recent activities related to this deal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Activities Found</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  There are no recorded activities for this deal yet.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Deal Modal */}
      {showModal && (
        <DealModal
          open={showModal}
          onOpenChange={setShowModal}
          initialData={deal}
        />
      )}
    </div>
  );
}