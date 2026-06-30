import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import {
  COLUMNS, columnForStatus, deriveType, derivePriority, issueKey,
  Avatar, TypeIcon, PriorityIcon,
} from '../../lib/issue';

type Task = any;

function IssueCard({ task, teamName, onOpen, dragging }: { task: Task; teamName?: string; onOpen?: () => void; dragging?: boolean }) {
  const type = deriveType(task);
  const prio = derivePriority(task);
  return (
    <div className={`issue-card ${dragging ? 'rotate-2 shadow-lg ring-2 ring-blue-300' : ''}`} onClick={onOpen}>
      <p className="mb-1.5 text-sm font-semibold leading-snug text-gray-900">{task.task_name}</p>
      {task.task_description && (
        <p className="mb-2 line-clamp-2 text-xs text-gray-500">{task.task_description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TypeIcon type={type} />
          <span className="text-[11px] font-bold tracking-wide text-gray-400">{issueKey(teamName, task.task_id)}</span>
          <PriorityIcon priority={prio} />
        </div>
        {task.user_id ? (
          <Avatar first={task.first_name} last={task.last_name} />
        ) : (
          <span className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300" title="Unassigned" />
        )}
      </div>
    </div>
  );
}

function DraggableCard({ task, teamName, onOpen }: { task: Task; teamName?: string; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: String(task.task_id), data: { task } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? 'opacity-40' : ''}>
      <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <IssueCard task={task} teamName={teamName} onOpen={onOpen} />
      </motion.div>
    </div>
  );
}

function Column({ col, tasks, teamName, onOpen }: { col: typeof COLUMNS[number]; tasks: Task[]; teamName?: string; onOpen: (id: number) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border bg-white/50 p-3 backdrop-blur-sm transition-colors ${
        isOver ? 'border-blue-300 bg-blue-50/60 ring-2 ring-blue-200' : 'border-white/70'
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${col.dot}`} />
          <h2 className={`text-xs font-bold uppercase tracking-wide ${col.accent}`}>{col.title}</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500 shadow-sm">{tasks.length}</span>
      </div>
      <div className="space-y-2.5 min-h-[60px]">
        {tasks.map((task) => (
          <DraggableCard key={task.task_id} task={task} teamName={teamName} onOpen={() => onOpen(task.task_id)} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400">Drop issues here</div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  tasks, teamName, onOpen, onMove,
}: {
  tasks: Task[];
  teamName?: string;
  onOpen: (id: number) => void;
  onMove: (taskId: number, newStatus: string) => void;
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragStart = (e: DragStartEvent) => setActiveTask(e.active.data.current?.task || null);
  const onDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const overKey = e.over?.id as string | undefined;
    const task = e.active.data.current?.task;
    if (!overKey || !task) return;
    const target = COLUMNS.find((c) => c.key === overKey);
    if (!target) return;
    if (columnForStatus(task.status).key === overKey) return; // same column
    onMove(Number(task.task_id), target.value);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            col={col}
            teamName={teamName}
            onOpen={onOpen}
            tasks={tasks.filter((t) => columnForStatus(t.status).key === col.key)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-72">
            <IssueCard task={activeTask} teamName={teamName} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
