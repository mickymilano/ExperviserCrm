import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronUp, AlertCircle, Info, AlertTriangle, CheckCircle, Copy, Download, Trash, Maximize2, Minimize2 } from 'lucide-react';
import { useDebugLogs } from '@/hooks/useDebugLogs';
import { useDebugConsoleStore } from '@/stores/debugConsoleStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import * as Sentry from "@sentry/react";

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'log';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
  component?: string;
  stack?: string;
}

const LogLevelIcon = ({ level }: { level: LogLevel }) => {
  switch (level) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warn':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    case 'debug':
      return <Info className="h-4 w-4 text-purple-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

export default function DebugConsole() {
  const {
    isVisible,
    toggleVisibility,
    position,
    setPosition,
    size,
    setSize,
    isMinimized,
    toggleMinimized,
    isFilterPanelOpen,
    toggleFilterPanel
  } = useDebugConsoleStore();

  const { logs, clearLogs, setLogFilter, logFilter } = useDebugLogs();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filterText, setFilterText] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [downloadFormat, setDownloadFormat] = useState<'json' | 'txt'>('json');

  // Filtro dei log in base al tab attivo e al testo di ricerca
  const filteredLogs = logs.filter(log => {
    // Filtra per livello se non è selezionato "all"
    if (activeTab !== 'all' && log.level !== activeTab) {
      return false;
    }
    
    // Filtra per testo
    if (filterText) {
      const searchLower = filterText.toLowerCase();
      return (
        log.message.toLowerCase().includes(searchLower) ||
        (log.component && log.component.toLowerCase().includes(searchLower)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Auto-scroll alla fine
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  // Gestione del resize della console
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (isResizing) {
        // Calcolo nuove dimensioni
        const deltaY = resizeStart.y - e.clientY;
        setSize({
          width: size.width,
          height: size.height + deltaY
        });
        setResizeStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, resizeStart, size, setSize]);

  // Funzione per copiare i log negli appunti
  const copyLogsToClipboard = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp.toLocaleTimeString()}] [${log.level.toUpperCase()}] ${log.component ? `[${log.component}] ` : ''}${log.message}${log.details ? `\nDetails: ${JSON.stringify(log.details, null, 2)}` : ''}${log.stack ? `\nStack: ${log.stack}` : ''}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText)
      .then(() => {
        // Feedback visivo
        const tempLog = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
          level: 'info' as LogLevel,
          message: 'Logs copied to clipboard',
          component: 'DebugConsole'
        };
        // Qui potresti aggiungere un toast o un altro feedback visivo
      })
      .catch(err => {
        console.error('Failed to copy logs to clipboard:', err);
      });
  };

  // Funzione per scaricare i log
  const downloadLogs = () => {
    let content: string;
    let fileName: string;
    
    if (downloadFormat === 'json') {
      content = JSON.stringify(filteredLogs, null, 2);
      fileName = `experviser-crm-logs-${new Date().toISOString()}.json`;
    } else {
      content = filteredLogs.map(log => 
        `[${log.timestamp.toLocaleTimeString()}] [${log.level.toUpperCase()}] ${log.component ? `[${log.component}] ` : ''}${log.message}${log.details ? `\nDetails: ${JSON.stringify(log.details, null, 2)}` : ''}${log.stack ? `\nStack: ${log.stack}` : ''}`
      ).join('\n');
      fileName = `experviser-crm-logs-${new Date().toISOString()}.txt`;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bg-background border border-border shadow-lg rounded-t-md flex flex-col z-50 transition-all duration-200 ease-in-out`}
      style={{
        bottom: 0,
        right: 16,
        width: isMinimized ? '300px' : size.width,
        height: isMinimized ? '40px' : size.height,
        maxHeight: isMinimized ? '40px' : 'calc(100vh - 60px)',
      }}
    >
      {/* Header della console */}
      <div 
        className="bg-secondary p-2 flex items-center justify-between rounded-t-md cursor-move"
        onMouseDown={(e) => {
          // Handle dragging logic
        }}
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10">
            Debug Console
          </Badge>
          <Badge variant="outline" className="bg-destructive/10">
            {filteredLogs.filter(l => l.level === 'error').length} Errors
          </Badge>
          <Badge variant="outline" className="bg-warning/10">
            {filteredLogs.filter(l => l.level === 'warn').length} Warnings
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleFilterPanel()}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter Options</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleMinimized}>
                  {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMinimized ? 'Expand' : 'Minimize'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleVisibility}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Pannello filtri */}
          {isFilterPanelOpen && (
            <div className="bg-background/80 p-2 border-b border-border flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2">
                <Input 
                  type="text" 
                  placeholder="Filter logs..." 
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="h-7 text-xs w-44"
                />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center gap-1">
                  <Label htmlFor="auto-scroll" className="text-xs">Auto-scroll</Label>
                  <Switch id="auto-scroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyLogsToClipboard}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy to Clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={downloadLogs}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download Logs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearLogs}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear Logs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Tabs e contenuto */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="bg-background border-b border-border rounded-none justify-start h-8 px-2">
              <TabsTrigger value="all" className="h-7 text-xs">All ({logs.length})</TabsTrigger>
              <TabsTrigger value="error" className="h-7 text-xs">Errors ({logs.filter(l => l.level === 'error').length})</TabsTrigger>
              <TabsTrigger value="warn" className="h-7 text-xs">Warnings ({logs.filter(l => l.level === 'warn').length})</TabsTrigger>
              <TabsTrigger value="info" className="h-7 text-xs">Info ({logs.filter(l => l.level === 'info').length})</TabsTrigger>
              <TabsTrigger value="debug" className="h-7 text-xs">Debug ({logs.filter(l => l.level === 'debug').length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="flex-1 min-h-0 p-0 m-0">
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="p-1 space-y-1">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <LogEntryComponent key={log.id} log={log} />
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No logs to display</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Resize handle */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 cursor-row-resize"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
}

const LogEntryComponent = ({ log }: { log: LogEntry }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determina colore di background basato sul livello
  const getBgColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'bg-red-500/10 border-red-500/30';
      case 'warn': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'info': return 'bg-blue-500/10 border-blue-500/30';
      case 'debug': return 'bg-purple-500/10 border-purple-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const reportToDiagnostics = (log: LogEntry) => {
    if (log.level === 'error') {
      Sentry.captureException(new Error(log.message), {
        extra: {
          ...log.details,
          component: log.component,
          originalStack: log.stack
        }
      });
    } else {
      Sentry.captureMessage(log.message, {
        level: log.level as Sentry.SeverityLevel,
        extra: {
          ...log.details,
          component: log.component
        }
      });
    }
  };
  
  return (
    <div 
      className={`border text-xs rounded p-1.5 ${getBgColor(log.level)} transition-all duration-200`}
    >
      <div className="flex items-start gap-1">
        <LogLevelIcon level={log.level} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">{log.timestamp.toLocaleTimeString()}</span>
            
            {log.component && (
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {log.component}
              </Badge>
            )}
          </div>
          
          <p className="whitespace-pre-wrap break-words">{log.message}</p>
          
          {(log.details || log.stack) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] px-1 mt-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Less" : "More"}
              <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 ml-1"
          onClick={() => reportToDiagnostics(log)}
        >
          <AlertCircle className="h-3 w-3" />
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {log.details && (
            <div>
              <div className="font-semibold text-[10px] text-muted-foreground mb-1">Details:</div>
              <pre className="text-[10px] bg-background/50 p-1 rounded overflow-x-auto">
                {typeof log.details === 'string' 
                  ? log.details 
                  : JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
          
          {log.stack && (
            <div>
              <div className="font-semibold text-[10px] text-muted-foreground mb-1">Stack:</div>
              <pre className="text-[10px] bg-background/50 p-1 rounded overflow-x-auto">
                {log.stack}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};