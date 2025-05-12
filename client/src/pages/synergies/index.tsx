import { SynergiesList } from "@/components/SynergiesList";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake } from "lucide-react";

// Nota: Questa pagina mostra solo sinergie esistenti.
// La creazione di sinergie avviene solo attraverso il processo di Deal
export default function Synergies() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <PageTitle 
          title="Synergies" 
          subtitle="View business relationships between contacts and companies"
          icon={<Handshake className="h-6 w-6 text-primary" />}
        />
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
          <SynergiesList showTitle={false} hideAddButton={true} hideDeleteButtons={true} />
        </CardContent>
      </Card>
    </div>
  );
}