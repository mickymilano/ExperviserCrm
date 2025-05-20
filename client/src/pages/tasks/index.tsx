import { useState } from "react";
import { useTasks } from "../../hooks/useTasks";
import { useContacts } from "../../hooks/useContacts";
import { useCompanies } from "../../hooks/useCompanies";
import { Task } from "../../types";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock,
  User,
  Building,
  CheckSquare,
  AlarmClock,
  Tag,
  Edit,
  Trash
} from "lucide-react";
import TaskModal from "../../components/modals/TaskModal";
import { Skeleton } from "../../components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { formatDistanceToNow, isPast, isToday, isTomorrow, format } from "date-fns";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { cn } from "../../lib/utils";

export default function Tasks() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [taskView, setTaskView] = useState<"all" | "today" | "upcoming" | "completed">("all");
  const { tasks, isLoading, completeTask, deleteTask } = useTasks();
  const { contacts } = useContacts();
  const { companies } = useCompanies();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Get contact name from id
  const getContactName = (contactId: number | null): string => {
    if (!contactId) return "";
    const contact = contacts?.find((c) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : "";
  };

  // Get company name from id
  const getCompanyName = (companyId: number | null): string => {
    if (!companyId) return "";
    const company = companies?.find((c) => c.id === companyId);
    return company ? company.name : "";
  };

  // Filter tasks based on search term and view
  const filteredTasks = tasks && Array.isArray(tasks) ? tasks.filter((task: Task) => {
    // First apply the tab filter
    if (taskView === "today" && (!task.dueDate || !isToday(new Date(task.dueDate)))) {
      return false;
    } else if (taskView === "upcoming" && (!task.dueDate || isToday(new Date(task.dueDate)) || task.completed)) {
      return false;
    } else if (taskView === "completed" && !task.completed) {
      return false;
    }

    // Then apply the search term filter
    if (!searchTerm) return true;
    const searchTermLower = searchTerm.toLowerCase();
    
    return (
      task.title.toLowerCase().includes(searchTermLower) ||
      (task.description && task.description.toLowerCase().includes(searchTermLower)) ||
      getContactName(task.contactId).toLowerCase().includes(searchTermLower) ||
      getCompanyName(task.companyId).toLowerCase().includes(searchTermLower)
    );
  }) : [];

  // Group tasks based on due date
  const groupedTasks = {
    overdue: filteredTasks.filter((task: Task) => 
      !task.completed && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
    ),
    today: filteredTasks.filter((task: Task) => 
      task.dueDate && isToday(new Date(task.dueDate))
    ),
    tomorrow: filteredTasks.filter((task: Task) => 
      task.dueDate && isTomorrow(new Date(task.dueDate))
    ),
    upcoming: filteredTasks.filter((task: Task) => 
      task.dueDate && !isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !isTomorrow(new Date(task.dueDate))
    ),
    noDueDate: filteredTasks.filter((task: Task) => !task.dueDate),
    completed: filteredTasks.filter((task: Task) => task.completed)
  };

  // Handle complete task
  const handleCompleteTask = (id: number, currentStatus: boolean) => {
    if (!currentStatus) {
      completeTask.mutate(id);
    }
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  // Handle delete task
  const handleDeleteTask = (id: number) => {
    if (window.confirm("Sei sicuro di voler eliminare questa attività?")) {
      deleteTask.mutate(id);
    }
  };

  // Render task group
  const renderTaskGroup = (title: string, tasks: Task[] | undefined, className?: string) => {
    if (!tasks || tasks.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h3 className={cn("text-sm font-medium mb-3", className)}>{title}</h3>
        <div className="space-y-2">
          {tasks.map(task => (
            <Card key={task.id} className="relative overflow-hidden">
              {task.completed && (
                <div className="absolute top-0 left-0 h-full w-1 bg-success" />
              )}
              {!task.completed && task.dueDate && isPast(new Date(task.dueDate)) && (
                <div className="absolute top-0 left-0 h-full w-1 bg-destructive" />
              )}
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1"
                    checked={task.completed}
                    onCheckedChange={(checked) => 
                      handleCompleteTask(task.id, task.completed)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className={cn(
                        "font-medium",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTask(task)}>
                              Modifica Attività
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Elimina Attività
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 mb-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {task.dueDate && (
                        <Badge variant="outline" className={cn(
                          "flex items-center gap-1 text-xs",
                          !task.completed && isPast(new Date(task.dueDate)) && "bg-red-50 text-red-800 border-red-200"
                        )}>
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </Badge>
                      )}
                      
                      {task.contactId && (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3" />
                          {getContactName(task.contactId)}
                        </Badge>
                      )}
                      
                      {task.companyId && (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <Building className="h-3 w-3" />
                          {getCompanyName(task.companyId)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Attività</h1>
        <Button onClick={() => {
          setSelectedTask(null);
          setShowModal(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Aggiungi Attività
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca attività..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="md:w-auto">
              <Filter className="mr-2 h-4 w-4" /> Filtra
            </Button>
          </div>
          
          <Tabs value={taskView} onValueChange={(value) => setTaskView(value as "all" | "today" | "upcoming" | "completed")} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Tutte</TabsTrigger>
              <TabsTrigger value="today">Oggi</TabsTrigger>
              <TabsTrigger value="upcoming">In Arrivo</TabsTrigger>
              <TabsTrigger value="completed">Completate</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredTasks && filteredTasks.length > 0 ? (
        <div>
          {renderTaskGroup("In Ritardo", groupedTasks.overdue, "text-destructive")}
          {renderTaskGroup("Oggi", groupedTasks.today)}
          {renderTaskGroup("Domani", groupedTasks.tomorrow)}
          {renderTaskGroup("In Arrivo", groupedTasks.upcoming)}
          {renderTaskGroup("Senza Scadenza", groupedTasks.noDueDate)}
          {renderTaskGroup("Completate", groupedTasks.completed, "text-muted-foreground")}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <CheckSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nessuna attività trovata</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "Prova a modificare i termini di ricerca."
                : taskView === "today"
                ? "Non hai attività in scadenza oggi."
                : taskView === "upcoming"
                ? "Non hai attività in arrivo."
                : taskView === "completed"
                ? "Non hai ancora completato nessuna attività."
                : "Inizia aggiungendo la tua prima attività."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Aggiungi Attività
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <TaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={selectedTask}
      />
    </div>
  );
}
