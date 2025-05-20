import React from 'react';
import { EntityEmailInbox } from '@/components/email/EntityEmailInbox';
import { Card } from '@/components/ui/card';

interface EntityEmailTabProps {
  entityId: string;
  entityType: 'contact' | 'company' | 'deal' | 'lead' | 'branch';
  entityName: string;
  entityEmail?: string;
}

/**
 * Scheda Email per i dettagli dell'entità (contatto, azienda, affare, lead)
 */
export const EntityEmailTab: React.FC<EntityEmailTabProps> = ({
  entityId,
  entityType,
  entityName
}) => {
  return (
    <div className="w-full">
      <EntityEmailInbox 
        entityId={entityId}
        entityType={entityType}
        entityName={entityName}
      />
    </div>
  );
};