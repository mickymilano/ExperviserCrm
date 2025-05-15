import { useState } from 'react';
import { Bug, AlertTriangle } from 'lucide-react';
import { useDebugConsoleStore } from '@/stores/debugConsoleStore';
import { useDebugLogs } from '@/hooks/useDebugLogs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export default function DebugButton() {
  const { toggleVisibility, isVisible } = useDebugConsoleStore();
  const { logs } = useDebugLogs();
  
  // Conteggio errori e avvisi
  const errorCount = logs.filter(log => log.level === 'error').length;
  const warningCount = logs.filter(log => log.level === 'warn').length;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="relative h-8 w-8 rounded-full"
            onClick={toggleVisibility}
          >
            <Bug className="h-4 w-4" />
            
            {/* Badge per mostrare errori */}
            {errorCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center"
              >
                {errorCount}
              </Badge>
            )}
            
            {/* Indicatore di avvisi (solo se non ci sono errori) */}
            {errorCount === 0 && warningCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-yellow-500"
              >
                {warningCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isVisible ? 'Nascondi' : 'Mostra'} Console Debug</p>
          {(errorCount > 0 || warningCount > 0) && (
            <div className="flex gap-2 mt-1 text-xs">
              {errorCount > 0 && (
                <span className="text-red-500">{errorCount} errori</span>
              )}
              {warningCount > 0 && (
                <span className="text-yellow-500">{warningCount} avvisi</span>
              )}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}