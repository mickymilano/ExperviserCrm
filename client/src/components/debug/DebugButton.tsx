import { BugIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebugConsoleStore } from "@/stores/debugConsoleStore";
import { useDebugLogs } from "@/hooks/useDebugLogs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { debugContext } from "@/lib/debugContext";

export default function DebugButton() {
  const { toggleVisibility, isVisible } = useDebugConsoleStore();
  const { logs } = useDebugLogs();
  const [errorCount, setErrorCount] = useState(0);

  // Conta il numero di errori
  useEffect(() => {
    const count = logs.filter(log => log.level === 'error').length;
    setErrorCount(count);
    
    // Log per verificare che il componente funzioni
    debugContext.logInfo('Debug Button montato', { 
      errorCount: count,
      logsCount: logs.length
    }, { component: 'DebugButton' });
  }, [logs]);
  
  // Funzione che gestisce il click sul pulsante
  const handleButtonClick = () => {
    debugContext.logInfo('Debug Button cliccato', { 
      currentVisibility: isVisible
    }, { component: 'DebugButton' });
    
    toggleVisibility();
  };

  return (
    <Button
      variant={errorCount > 0 ? "destructive" : "outline"}
      size="sm"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full shadow-md"
      onClick={handleButtonClick}
      title="Apri console di debug"
    >
      <BugIcon className="h-4 w-4" />
      {errorCount > 0 && (
        <Badge variant="outline" className="ml-1 bg-white text-destructive">
          {errorCount}
        </Badge>
      )}
      <span className="ml-1 hidden md:inline">
        {isVisible ? "Chiudi Console" : "Debug Console"}
      </span>
    </Button>
  );
}