import { useState, useEffect } from "react";
import { useDebugConsoleStore } from "../../stores/debugConsoleStore";
import { useDebugLogs } from "../../hooks/useDebugLogs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XIcon, 
  MinimizeIcon, 
  MaximizeIcon, 
  ClipboardCopyIcon,
  RefreshCwIcon, 
  FilterIcon,
  AlertTriangleIcon,
  InfoIcon, 
  AlertCircleIcon
} from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { type LogEntry, type LogLevel } from "../../lib/debugContext";

export default function DebugConsole() {
  const { 
    isVisible, 
    isMinimized, 
    activeTab, 
    toggleVisibility, 
    toggleMinimize, 
    setActiveTab 
  } = useDebugConsoleStore();
  
  const { logs, clearLogs } = useDebugLogs();
  
  // Stato locale per filtri
  const [levelFilters, setLevelFilters] = useState<LogLevel[]>([
    'error', 'warn', 'info', 'debug', 'log'
  ]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(logs);
  
  // Aggiorna i log filtrati quando cambiano i filtri o i log
  useEffect(() => {
    const filtered = logs.filter(log => {
      // Filtro per livello di log
      if (!levelFilters.includes(log.level)) {
        return false;
      }
      
      // Filtro per testo di ricerca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const messageMatch = log.message.toLowerCase().includes(query);
        const componentMatch = log.component?.toLowerCase().includes(query);
        const detailsMatch = log.details ? 
          JSON.stringify(log.details).toLowerCase().includes(query) : false;
        
        return messageMatch || componentMatch || detailsMatch;
      }
      
      return true;
    });
    
    setFilteredLogs(filtered);
  }, [logs, levelFilters, searchQuery]);
  
  // Conteggi per tipologia di log
  const errorCount = logs.filter(log => log.level === 'error').length;
  const warningCount = logs.filter(log => log.level === 'warn').length;
  const infoCount = logs.filter(log => log.level === 'info').length;
  const debugCount = logs.filter(log => log.level === 'debug').length;
  
  // Handler per il click sul filtro per livello
  const toggleLevelFilter = (level: LogLevel) => {
    setLevelFilters(prev => {
      if (prev.includes(level)) {
        return prev.filter(l => l !== level);
      } else {
        return [...prev, level];
      }
    });
  };
  
  // Handler per la copia dei log negli appunti
  const copyLogsToClipboard = () => {
    const logText = filteredLogs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const level = log.level.toUpperCase();
        const component = log.component ? `[${log.component}]` : '';
        const details = log.details ? `\n  ${JSON.stringify(log.details, null, 2)}` : '';
        
        return `${timestamp} ${level} ${component} ${log.message}${details}`;
      })
      .join('\n');
    
    navigator.clipboard.writeText(logText)
      .then(() => {
        alert('Log copiati negli appunti');
      })
      .catch(err => {
        console.error('Errore durante la copia dei log:', err);
      });
  };
  
  if (!isVisible) {
    return null;
  }
  
  const getLogIcon = (level: LogLevel) => {
    switch(level) {
      case 'error':
        return <AlertCircleIcon className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <InfoIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <InfoIcon className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getLogLevelClass = (level: LogLevel) => {
    switch(level) {
      case 'error':
        return 'text-red-500 border-red-300 bg-red-50';
      case 'warn':
        return 'text-yellow-500 border-yellow-300 bg-yellow-50';
      case 'info':
        return 'text-blue-500 border-blue-300 bg-blue-50';
      case 'debug':
      case 'log':
      default:
        return 'text-gray-500 border-gray-300 bg-gray-50';
    }
  };
  
  // Formattatore per timestamp
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    }).format(date);
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed bottom-20 right-4 z-50 h-[70vh] w-[90vw] overflow-hidden rounded-lg border bg-white shadow-2xl md:right-8 md:w-[80vw] lg:w-[70vw] xl:w-[60vw] ${
          isMinimized ? 'h-auto' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-4 py-2 text-white">
          <h3 className="flex items-center text-sm font-medium">
            <span className="mr-2">Debug Console</span>
            <Badge variant="outline" className="bg-white/10 text-white">
              {logs.length} entries
            </Badge>
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-primary-foreground/10"
              onClick={toggleMinimize}
              title={isMinimized ? "Espandi" : "Minimizza"}
            >
              {isMinimized ? <MaximizeIcon className="h-3 w-3" /> : <MinimizeIcon className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-primary-foreground/10"
              onClick={toggleVisibility}
              title="Chiudi"
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b bg-muted/30 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <FilterIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filtra log..."
                    className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-2 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-1 text-xs">
                  <Button
                    variant={levelFilters.includes('error') ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => toggleLevelFilter('error')}
                  >
                    Errori
                    {errorCount > 0 && (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {errorCount}
                      </Badge>
                    )}
                  </Button>
                  
                  <Button
                    variant={levelFilters.includes('warn') ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => toggleLevelFilter('warn')}
                  >
                    Warning
                    {warningCount > 0 && (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {warningCount}
                      </Badge>
                    )}
                  </Button>
                  
                  <Button
                    variant={levelFilters.includes('info') ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => toggleLevelFilter('info')}
                  >
                    Info
                    {infoCount > 0 && (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {infoCount}
                      </Badge>
                    )}
                  </Button>
                  
                  <Button
                    variant={levelFilters.includes('debug') ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => toggleLevelFilter('debug')}
                  >
                    Debug
                    {debugCount > 0 && (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {debugCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="mt-2 flex gap-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={clearLogs}
                >
                  <RefreshCwIcon className="mr-1 h-3 w-3" />
                  Pulisci
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={copyLogsToClipboard}
                >
                  <ClipboardCopyIcon className="mr-1 h-3 w-3" />
                  Copia
                </Button>
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(tab: any) => setActiveTab(tab)} className="h-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="logs">Log</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="settings">Impostazioni</TabsTrigger>
              </TabsList>
              
              <TabsContent value="logs" className="h-[calc(100%-40px)]">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-4">
                    {filteredLogs.length === 0 ? (
                      <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                        <InfoIcon className="mb-2 h-10 w-10 opacity-20" />
                        <p className="text-sm">Nessun log disponibile con i filtri correnti</p>
                      </div>
                    ) : (
                      filteredLogs.map((log) => (
                        <Card
                          key={log.id}
                          className={`overflow-hidden border p-2 text-xs ${getLogLevelClass(log.level)}`}
                        >
                          <div className="flex items-start gap-2">
                            {getLogIcon(log.level)}
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-baseline justify-between">
                                <span className="font-medium">{log.message}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatTimestamp(log.timestamp)}
                                </span>
                              </div>
                              
                              {log.component && (
                                <div className="mt-1 text-[10px] text-muted-foreground">
                                  Componente: {log.component}
                                </div>
                              )}
                              
                              {log.details && (
                                <div className="mt-1">
                                  <Separator className="my-1 opacity-30" />
                                  <pre className="max-h-32 overflow-auto rounded-sm bg-black/5 p-1 text-[10px]">
                                    {typeof log.details === 'object'
                                      ? JSON.stringify(log.details, null, 2)
                                      : String(log.details)}
                                  </pre>
                                </div>
                              )}
                              
                              {log.stack && (
                                <div className="mt-1">
                                  <Separator className="my-1 opacity-30" />
                                  <details>
                                    <summary className="cursor-pointer text-[10px] font-medium">
                                      Stack Trace
                                    </summary>
                                    <pre className="mt-1 max-h-32 overflow-auto rounded-sm bg-black/5 p-1 text-[10px]">
                                      {log.stack}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="network" className="h-[calc(100%-40px)]">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p className="text-sm">Monitoraggio rete in fase di implementazione</p>
                </div>
              </TabsContent>
              
              <TabsContent value="performance" className="h-[calc(100%-40px)]">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p className="text-sm">Monitoraggio performance in fase di implementazione</p>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="h-[calc(100%-40px)]">
                <div className="p-4">
                  <h3 className="mb-4 text-sm font-medium">Impostazioni Debug Console</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-xs font-medium">Limite massimo log</h4>
                      <div className="text-xs text-muted-foreground">
                        Massimo 1000 log memorizzati
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="mb-2 text-xs font-medium">Opzioni di tracciamento</h4>
                      <div className="text-xs text-muted-foreground">
                        - Tracciamento errori API ✓
                        <br />
                        - Tracciamento errori React Query ✓
                        <br />
                        - Override metodi console ✓
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="mb-2 text-xs font-medium">Versione Debug Tools</h4>
                      <div className="text-xs text-muted-foreground">
                        v1.0.0
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}