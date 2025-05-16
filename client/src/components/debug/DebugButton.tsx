import { BugIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebugConsoleStore } from "@/stores/debugConsoleStore";
import { useDebugLogs } from "@/hooks/useDebugLogs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export default function DebugButton() {
  const { toggleVisibility, isVisible } = useDebugConsoleStore();
  const { logs } = useDebugLogs();
  const [errorCount, setErrorCount] = useState(0);

  // Conta il numero di errori
  useEffect(() => {
    const count = logs.filter(log => log.level === 'error').length;
    setErrorCount(count);
  }, [logs]);

  return (
    <Button
      variant={errorCount > 0 ? "destructive" : "outline"}
      size="sm"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full shadow-md"
      onClick={toggleVisibility}
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