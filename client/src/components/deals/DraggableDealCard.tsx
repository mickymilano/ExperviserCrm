import { useDraggable } from '@dnd-kit/core';
import { DealInfo } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { DollarSign, Calendar, MoreHorizontal, Building2, User } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { Link } from 'wouter';

interface DraggableDealCardProps {
  deal: DealInfo;
  getCompanyName: (companyId: number | null) => string;
  getContactName?: (contactId: number | null) => string;
  onClick: () => void;
}

export function DraggableDealCard({ deal, getCompanyName, getContactName, onClick }: DraggableDealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
  } : undefined;

  // Handle navigation to company or contact without triggering card click
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="touch-manipulation"
    >
      <Card 
        className="cursor-grab active:cursor-grabbing border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-150"
        onClick={onClick}
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
              {getContactName && deal.contactId && (
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
    </div>
  );
}