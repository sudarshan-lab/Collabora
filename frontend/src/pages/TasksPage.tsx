import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Plus, Users, Calendar, LayoutGrid, List, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { createTask, fetchAllTasks, updateTaskStatus } from '../components/service/service';
import {
  COLUMNS, columnForStatus, deriveType, derivePriority, issueKey,
  Avatar, TypeIcon, PriorityIcon,
} from '../lib/issue';
import { AIAssistant } from '../components/ai/AIAssistant';
import { KanbanBoard } from '../components/tasks/KanbanBoard';

export function TasksPage() {
  const { teamId } = useParams();
  const token = sessionStorage.getItem('Token');
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState('task');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [showAI, setShowAI] = useState(false);
  const navigate = useNavigate();
  const activeTeam = JSON.parse(sessionStorage.getItem('ActiveTeam') || 'null');
  const teamName = activeTeam?.team_name;

  // Fetch all tasks for the team
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const data = await fetchAllTasks(token, teamId);
        setTasks(data.tasks || []);
      } catch (error) {
        console.error(error.message || 'Failed to fetch tasks');
        sessionStorage.clear();
        navigate('/login');
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [teamId, token, navigate]);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!taskName || !taskDescription || !dueDate) {
      alert('All fields are required.');
      return;
    }

    const selectedDueDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDueDate < today) {
      alert('Due date cannot be earlier than today.');
      return;
    }

    setIsLoading(true);

    try {
      const newTask = {
        task_name: taskName,
        task_description: taskDescription,
        issue_type: taskType,
        priority: taskPriority,
        due_date: dueDate,
        team_id: teamId,
      };

      await createTask(token, newTask); // Service call to create a task

      setTaskName('');
      setTaskDescription('');
      setDueDate('');
      setShowTaskForm(false);
      window.location.reload();
    } catch (error) {
      alert('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  if (loadingTasks) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="loader w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Optimistically move a card to a new column, then persist.
  const handleMove = async (taskId: number, newStatus: string) => {
    const prev = tasks;
    setTasks((ts: any) => ts.map((t: any) => (t.task_id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch {
      setTasks(prev); // revert on failure
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">{teamName || 'Tasks'} <span className="brand-text">Board</span></h1>
            <p className="mt-1 text-sm text-gray-500">{tasks.length} issue{tasks.length !== 1 ? 's' : ''} across {COLUMNS.length} columns</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="seg">
              <button onClick={() => setView('board')} className={`seg-btn ${view === 'board' ? 'seg-btn-active' : ''}`}>
                <LayoutGrid className="h-4 w-4" /> Board
              </button>
              <button onClick={() => setView('list')} className={`seg-btn ${view === 'list' ? 'seg-btn-active' : ''}`}>
                <List className="h-4 w-4" /> List
              </button>
            </div>
            <button onClick={() => setShowAI(true)} className="btn-outline">
              <Sparkles className="h-4 w-4 text-pink-500" /> AI Assistant
            </button>
            <button onClick={() => setShowTaskForm(true)} className="btn-brand">
              <Plus className="w-5 h-5" /> New Issue
            </button>
          </div>
        </div>

        {showAI && (
          <AIAssistant
            teamId={teamId!}
            teamName={teamName}
            onClose={() => setShowAI(false)}
            onCreated={() => window.location.reload()}
          />
        )}

        {tasks.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <Users className="h-7 w-7 text-blue-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">No issues yet</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first issue to get the board going.</p>
            <button onClick={() => setShowTaskForm(true)} className="btn-brand mt-5">
              <Plus className="w-4 h-4" /> New Issue
            </button>
          </div>
        ) : view === 'board' ? (
          <KanbanBoard
            tasks={tasks}
            teamName={teamName}
            onOpen={(id) => handleNavigation(`/team/${teamId}/tasks/${id}`)}
            onMove={handleMove}
          />
        ) : (
          <div className="card divide-y divide-gray-100 overflow-hidden">
            {tasks.map((task) => {
              const type = deriveType(task);
              const prio = derivePriority(task);
              const col = columnForStatus(task.status);
              return (
                <div
                  key={task.task_id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-blue-50/40"
                  onClick={() => handleNavigation(`/team/${teamId}/tasks/${task.task_id}`)}
                >
                  <TypeIcon type={type} />
                  <span className="w-20 shrink-0 text-xs font-bold tracking-wide text-gray-400">{issueKey(teamName, task.task_id)}</span>
                  <span className="flex-1 truncate text-sm font-semibold text-gray-900">{task.task_name}</span>
                  <PriorityIcon priority={prio} />
                  <span className={`chip hidden sm:inline-flex bg-gray-100 ${col.accent}`}>{col.title}</span>
                  {task.due_date && (
                    <span className="hidden items-center gap-1 text-xs text-gray-400 md:flex">
                      <Calendar className="h-3.5 w-3.5" />{new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                  {task.user_id ? <Avatar first={task.first_name} last={task.last_name} /> : <span className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300" />}
                </div>
              );
            })}
          </div>
        )}

        {showTaskForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-card"
            >
              <h2 className="mb-1 text-lg font-bold text-gray-900">Create new issue</h2>
              <p className="mb-5 text-sm text-gray-500">Add an issue with a type, priority and due date.</p>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Type</label>
                    <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="input-field">
                      <option value="story">Story</option>
                      <option value="task">Task</option>
                      <option value="bug">Bug</option>
                      <option value="epic">Epic</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Priority</label>
                    <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="input-field">
                      <option value="highest">Highest</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="lowest">Lowest</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Issue name</label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Design the landing page"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="input-field h-auto py-2.5"
                    placeholder="What needs to be done?"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowTaskForm(false)} className="btn-ghost" disabled={isLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-brand" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Creating...
                      </>
                    ) : (
                      'Create task'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
