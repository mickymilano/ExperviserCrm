import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Euro, Plus } from "lucide-react";
import TaskModal from "../modals/TaskModal";
import { formatCurrency } from "@/lib/utils";

interface TaskListProps {
  entityId?: number;
  entityType: 'contact' | 'company' | 'lead' | 'deal';
  title?: string;
}

export default function TaskList({ entityId, entityType, title = "Attività" }: TaskListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { t } = useTranslation();

  // Costruisci il parametro di query appropriato in base al tipo di entità
  const queryParams = entityId ? `?${getEntityParam(entityType)}=${entityId}` : '';
  
  // Query per caricare i task
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['/api/tasks', entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!entityId,
  });

  // Funzione per ottenere il parametro di query corretto
  function getEntityParam(type: string) {
    switch (type) {
      case 'contact': return 'contactId';
      case 'company': return 'companyId';
      case 'lead': return 'leadId';
      case 'deal': return 'dealId';
      default: return '';
    }
  }

  // Funzione per ottenere i parametri corretti da passare al TaskModal
  function getEntityProps() {
    const props: any = {};
    switch (entityType) {
      case 'contact':
        props.contactId = entityId;
        break;
      case 'company':
        props.companyId = entityId;
        break;
      case 'lead':
        props.leadId = entityId;
        break;
      case 'deal':
        props.dealId = entityId;
        break;
    }
    return props;
  }

  // Apri il modal per creare un nuovo task
  const openCreateModal = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  // Apri il modal per modificare un task esistente
  const openEditModal = (task: any) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Chiudi il modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <Button onClick={openCreateModal} variant="ghost" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('tasks.new')}
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          // Stato di caricamento
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="mb-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))
        ) : tasks.length === 0 ? (
          // Nessun task
          <div className="text-center py-6 text-muted-foreground">
            <p>{t('tasks.empty.title')}</p>
            <p className="text-sm mt-1">{t('tasks.empty.description')}</p>
          </div>
        ) : (
          // Lista dei task
          <div className="space-y-4">
            {tasks.map((task: any) => (
              <div
                key={task.id}
                className="border rounded-md p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => openEditModal(task)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={task.completed} />
                    <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h4>
                  </div>
                  {task.isCalendarEvent && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Calendario
                    </Badge>
                  )}
                </div>

                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                )}

                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{t('tasks.due_date')}: {format(new Date(task.dueDate), "d MMM yyyy", { locale: it })}</span>
                    </div>
                  )}
                  
                  {task.startDateTime && task.endDateTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(task.startDateTime), "d MMM HH:mm", { locale: it })} - 
                        {format(new Date(task.endDateTime), "d MMM HH:mm", { locale: it })}
                      </span>
                    </div>
                  )}
                  
                  {task.taskValue > 0 && (
                    <div className="flex items-center gap-1">
                      <Euro className="h-3 w-3" />
                      <span>{t('tasks.value')}: {formatCurrency(task.taskValue)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={closeModal}
          initialData={selectedTask}
          {...getEntityProps()}
        />
      )}
    </Card>
  );
}