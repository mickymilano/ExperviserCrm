import { useState } from "react";
import { SynergiesList } from "@/components/SynergiesList";
import { SynergyModal } from "@/components/modals/SynergyModal";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake } from "lucide-react";

export default function Synergies() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <PageTitle 
          title="Synergies" 
          subtitle="Manage special business relationships between contacts and companies"
          icon={<Handshake className="h-6 w-6 text-primary" />}
        />
        
        <Button onClick={() => setOpenModal(true)}>
          <Handshake className="mr-2 h-4 w-4" />
          New Synergy
        </Button>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Handshake className="mr-2 h-5 w-5" />
            All Synergies
          </CardTitle>
          <CardDescription>
            Track business relationships that are not part of standard contact-company connections
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <SynergiesList showTitle={false} />
        </CardContent>
      </Card>
      
      {/* Create Synergy Modal */}
      <SynergyModal 
        open={openModal} 
        onOpenChange={setOpenModal} 
        mode="create"
        onSuccess={() => setOpenModal(false)}
      />
    </div>
  );
}