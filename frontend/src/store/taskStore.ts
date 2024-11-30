import { create } from 'zustand';
import type { Task } from '../types';
import { mockTasks } from '../components/data/MockData';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  setCurrentTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: mockTasks,
  currentTask: null,
  loading: false,
  error: null,
  setTasks: (tasks) => set({ tasks }),
  addTask: (taskData) => {
    const newTask: Task = {
      id: Date.now().toString(),
      createdAt: new Date(),
      ...taskData,
    };
    set(state => ({ tasks: [...state.tasks, newTask] }));
  },
  updateTaskStatus: (taskId, status) =>
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      ),
    })),
  setCurrentTask: (task) => set({ currentTask: task }),
}));