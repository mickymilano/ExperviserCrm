import { useState, useEffect } from 'react';
import { DealInfo, PipelineStage } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, DollarSign, MoreHorizontal, Building2, User } from 'lucide-react';
import { Link } from 'wouter';
import { useDeals } from '@/hooks/useDeals';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DealPipelineBoardProps {
  stages: PipelineStage[];
  deals: DealInfo[];
  getCompanyName: (companyId: number | null) => string;
  getContactName: (contactId: number | null) => string;
  onEditDeal: (deal: DealInfo) => void;
}

export function DealPipelineBoard({
  stages,
  deals,
  getCompanyName,
  getContactName,
  onEditDeal
}: DealPipelineBoardProps) {
  const { updateDeal } = useDeals();
  const { toast } = useToast();
  const [localDeals, setLocalDeals] = useState<DealInfo[]>([]);
  const [draggedDeal, setDraggedDeal] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Update localDeals when deals prop changes
  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  // Group deals by stage for column display
  const dealsByStage = stages.map((stage) => ({
    ...stage,
    deals: localDeals.filter((deal) => deal.stageId === stage.id) || []
  }));

  // Calculate total values per stage
  const stageTotals = dealsByStage.map(stage => ({
    id: stage.id,
    name: stage.name,
    count: stage.deals.length,
    value: stage.deals.reduce((acc, deal) => acc + deal.value, 0)
  }));

  const handleDragStart = (dealId: number) => {
    setDraggedDeal(dealId);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, stageId: number) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, stageId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedDeal) return;
    
    // Find the deal that's being dragged
    const deal = localDeals.find(d => d.id === draggedDeal);
    if (!deal) return;
    
    // Don't do anything if dropping in the same stage
    if (deal.stageId === stageId) {
      setDraggedDeal(null);
      setIsDragging(false);
      return;
    }
    
    console.log(`Moving deal ${draggedDeal} from stage ${deal.stageId} to stage ${stageId}`);
    
    // Optimistically update local state
    const updatedDeals = localDeals.map(d => {
      if (d.id === draggedDeal) {
        return { ...d, stageId };
      }
      return d;
    });
    
    setLocalDeals(updatedDeals);
    
    // Reset drag state
    setDraggedDeal(null);
    setIsDragging(false);
    
    // Update on the server
    updateDeal.mutate(
      {
        id: draggedDeal,
        data: { stageId }
      },
      {
        onSuccess: () => {
          toast({
            title: "Deal Updated",
            description: `Deal moved to ${stages.find(s => s.id === stageId)?.name || 'new stage'}`,
            variant: "default",
          });
        },
        onError: (error) => {
          console.error("Failed to update deal:", error);
          // Revert the optimistic update
          setLocalDeals(deals);
          toast({
            title: "Update Failed",
            description: "Failed to move deal. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="overflow-x-auto pb-6">
      <div className="min-w-[750px] relative">
        {/* Header row with stage names and values */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {stageTotals.map((stage) => (
            <div 
              key={stage.id} 
              className="bg-muted rounded-md p-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">{stage.name}</h3>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                  {stage.count}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(stage.value)}
              </div>
            </div>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        {/* Deal rows - Using traditional HTML5 drag and drop */}
        {localDeals.map(deal => (
          <div key={deal.id} className="grid grid-cols-5 gap-2 mb-2">
            {stages.map(stage => {
              const isActive = deal.stageId === stage.id;
              
              return (
                <div 
                  key={`${deal.id}-${stage.id}`}
                  data-stage-id={stage.id}
                  data-deal-id={deal.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={cn(
                    "min-h-[100px] p-1 rounded border-2 transition-colors h-full flex items-center justify-center",
                    isDragging && !isActive && "border-dashed border-primary/30 bg-primary/5",
                    !isDragging && !isActive && "border-dashed border-muted"
                  )}
                >
                  {isActive && (
                    <div 
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      className="w-full cursor-grab active:cursor-grabbing"
                    >
                      <Card 
                        className="border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-150"
                        onClick={() => onEditDeal(deal)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                              <h4 className="font-medium text-sm line-clamp-2 mb-1">{deal.name}</h4>
                              <div className="flex flex-wrap gap-2 text-xs mb-1.5">
                                <div className="flex items-center text-muted-foreground">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatCurrency(deal.value)}
                                </div>
                                {deal.expectedCloseDate && (
                                  <div className="flex items-center text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(deal.expectedCloseDate), "MMM d")}
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground truncate">
                                {/* Company link */}
                                {deal.companyId && (
                                  <Link 
                                    href={`/companies/${deal.companyId}`} 
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <Building2 className="h-3 w-3 mr-1" />
                                    {getCompanyName(deal.companyId)}
                                  </Link>
                                )}
                              </div>
                              
                              {/* Contact link */}
                              {deal.contactId && (
                                <div className="text-xs truncate mt-1">
                                  <Link 
                                    href={`/contacts/${deal.contactId}`} 
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <User className="h-3 w-3 mr-1" />
                                    {getContactName(deal.contactId)}
                                  </Link>
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}