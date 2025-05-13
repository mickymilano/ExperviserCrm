import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Handshake, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function SynergiesOverview() {
  const [, setLocation] = useLocation();
  
  // Ottieni tutte le sinergie per la dashboard
  const { data: synergies = [], isLoading } = useQuery({
    queryKey: ['/api/synergies'],
  });

  const getSynergyStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Pending':
        return 'bg-yellow-500';
      case 'Inactive':
        return 'bg-gray-500';
      case 'On Hold':
        return 'bg-blue-500';
      case 'Completed':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium">Sinergie Recenti</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          <Handshake className="h-4 w-4 mr-2" />
          Sinergie Recenti
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        {synergies.length === 0 ? (
          <div className="text-center py-6">
            <Handshake className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nessuna sinergia trovata nel sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {synergies.slice(0, 5).map((synergy: any) => (
              <div 
                key={synergy.id}
                className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <div className="font-medium text-sm">
                    {synergy.type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Contatto #{synergy.contactId} ↔ Azienda #{synergy.companyId}
                  </div>
                </div>
                <Badge className={getSynergyStatusColor(synergy.status)}>
                  {synergy.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => setLocation('/synergies')}
        >
          Vedi tutte le sinergie
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}