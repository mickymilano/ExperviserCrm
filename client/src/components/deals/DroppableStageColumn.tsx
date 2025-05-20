import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';

interface DroppableStageColumnProps {
  id: string;
  children: React.ReactNode;
  isActive: boolean;
}

export function DroppableStageColumn({ id, children, isActive }: DroppableStageColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] p-1 rounded border-2 border-transparent transition-colors h-full flex items-center justify-center",
        isOver && "border-primary border-dashed bg-primary/5",
        !isActive && !isOver && "border-dashed border-muted"
      )}
    >
      {children}
    </div>
  );
}