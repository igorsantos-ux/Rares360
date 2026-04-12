import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { 
    Phone, 
    MessageCircle, 
    CheckCircle2, 
    XCircle,
    LayoutDashboard
} from 'lucide-react';

interface KanbanBoardProps {
  tasks: any[];
  onTaskMove: (taskId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: 'TODO', title: 'Para Contatar', icon: <Phone size={18} />, color: 'text-blue-500', bg: 'bg-blue-50/50' },
  { id: 'IN_PROGRESS', title: 'Em Negociação', icon: <MessageCircle size={18} />, color: 'text-amber-500', bg: 'bg-amber-50/50' },
  { id: 'DONE', title: 'Agendado (Ganho)', icon: <CheckCircle2 size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
  { id: 'LOST', title: 'Perdido', icon: <XCircle size={18} />, color: 'text-rose-500', bg: 'bg-rose-50/50' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskMove }) => {
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    onTaskMove(draggableId, destination.droppableId);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[70vh]">
        {COLUMNS.map(column => (
          <div key={column.id} className={`flex flex-col rounded-[2.5rem] border border-slate-100 ${column.bg} p-6 h-full`}>
            {/* Header da Coluna */}
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-white shadow-sm ${column.color}`}>
                  {column.icon}
                </div>
                <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">{column.title}</h3>
              </div>
              <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-slate-400 shadow-sm">
                {getTasksByStatus(column.id).length}
              </span>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex-1 space-y-4 min-h-[200px] transition-colors rounded-3xl ${
                    snapshot.isDraggingOver ? 'bg-white/40' : ''
                  }`}
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${snapshot.isDragging ? 'rotate-3 scale-105' : ''} transition-transform`}
                        >
                          <TaskCard 
                            task={task} 
                            onStatusChange={(status) => onTaskMove(task.id, status)} 
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {getTasksByStatus(column.id).length === 0 && !snapshot.isDraggingOver && (
                    <div className="h-32 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-40">
                       <LayoutDashboard size={24} className="text-slate-300 mb-2" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center px-4">Arraste para cá para mudar o status</span>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
