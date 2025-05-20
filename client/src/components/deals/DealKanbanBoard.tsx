import { useState } from 'react';
import { DealInfo, PipelineStage } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, DollarSign, MoreHorizontal, Building2, User } from 'lucide-react';
import { Link } from 'wouter';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { SortableDealCard } from './SortableDealCard';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useDeals } from '@/hooks/useDeals';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface DealKanbanBoardProps {
  stages: PipelineStage[];
  deals: DealInfo[];
  getCompanyName: (companyId: number | null) => string;
  getContactName: (contactId: number | null) => string;
  onEditDeal: (deal: DealInfo) => void;
}

export function DealKanbanBoard({
  stages,
  deals,
  getCompanyName,
  getContactName,
  onEditDeal
}: DealKanbanBoardProps) {
  const { updateDeal } = useDeals();
  const [activeDeal, setActiveDeal] = useState<DealInfo | null>(null);
  const [activeStageId, setActiveStageId] = useState<number | null>(null);

  // Group deals by stage
  const dealsByStage = stages.map((stage) => ({
    ...stage,
    deals: deals.filter((deal) => deal.stageId === stage.id) || []
  }));

  // Create sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require a drag of at least 8px to start
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dealId = Number(active.id);
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      setActiveDeal(deal);
      setActiveStageId(deal.stageId);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;
    
    // Check if we're dragging over a stage container
    const overId = String(over.id);
    if (overId.startsWith('stage-')) {
      const stageId = Number(overId.split('-')[1]);
      setActiveStageId(stageId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over) {
      const dealId = Number(active.id);
      let newStageId: number | null = null;
      
      // Check if dropping directly on a stage container
      if (String(over.id).startsWith('stage-')) {
        newStageId = Number(String(over.id).split('-')[1]);
      } else {
        // We're using the tracked activeStageId
        newStageId = activeStageId;
      }
      
      // Find the deal
      const deal = deals.find(d => d.id === dealId);
      
      if (deal && newStageId && deal.stageId !== newStageId) {
        // Update the deal with the new stage
        updateDeal.mutate({ 
          id: dealId, 
          data: { 
            stageId: newStageId 
          } 
        });
      }
    }
    
    setActiveDeal(null);
    setActiveStageId(null);
  };

  const DealCardContent = ({ deal }: { deal: DealInfo }) => {
    // Handle navigation to company or contact without triggering card click
    const handleLinkClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };
    
    return (
      <Card className="mb-3 cursor-move border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-150">
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
              
              {/* Company link */}
              {deal.companyId && (
                <div className="text-xs mb-1 truncate">
                  <Link 
                    href={`/companies/${deal.companyId}`}
                    onClick={handleLinkClick}
                    className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {getCompanyName(deal.companyId)}
                  </Link>
                </div>
              )}
              
              {/* Contact link */}
              {deal.contactId && (
                <div className="text-xs truncate">
                  <Link 
                    href={`/contacts/${deal.contactId}`}
                    onClick={handleLinkClick}
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
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
        {dealsByStage.map((stage) => (
          <div key={stage.id} className="min-w-[270px] p-1 h-full">
            <div className="bg-muted rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">{stage.name}</h3>
                <div className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                  {stage.deals.length}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(stage.deals.reduce((acc, deal) => acc + deal.value, 0))}
              </div>
            </div>
            <Separator className="my-3" />
            <div
              id={`stage-${stage.id}`}
              className="min-h-[200px] h-full"
            >
              <SortableContext 
                items={stage.deals.map(d => d.id.toString())} 
                strategy={verticalListSortingStrategy}
              >
                {stage.deals.map((deal) => (
                  <SortableDealCard 
                    key={deal.id} 
                    deal={deal} 
                    getCompanyName={getCompanyName}
                    getContactName={getContactName}
                    onClick={() => onEditDeal(deal)}
                  />
                ))}
              </SortableContext>
            </div>
          </div>
        ))}
      </div>
      
      <DragOverlay>
        {activeDeal ? <DealCardContent deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  );
}