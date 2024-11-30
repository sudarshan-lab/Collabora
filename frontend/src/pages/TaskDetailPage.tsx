import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { TaskDetailHeader } from '../components/tasks/TaskDetailHeader';
import { SubTaskCard } from '../components/tasks/SubTaskCard';
import { CommentList } from '../components/comments/CommentList';
import { TaskDetailSidebar } from '../components/tasks/TaskDetailSidebar';
import { Task, Comment } from '../types/task';
import {
  assignUserToTask,
  createTask,
  fetchTaskById,
  updateTaskDueDate,
  updateTaskStatus,
  updateTaskUser,
  //createSubTask, // Add this service function for creating a sub-task
} from '../components/service/service';

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { teamId } = useParams<{ teamId: string }>();
  const token = sessionStorage.getItem('Token');
  const [task, setTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'subtasks' | 'comments'>('subtasks');
  const [isLoading, setIsLoading] = useState(true);
  const [showSubTaskForm, setShowSubTaskForm] = useState(false);
  const [subTaskName, setSubTaskName] = useState('');
  const [subTaskDescription, setSubTaskDescription] = useState('');
  const [subTaskDueDate, setSubTaskDueDate] = useState('');
  const [isCreatingSubTask, setIsCreatingSubTask] = useState(false);
  const [subTask, setSubTask] = useState<Task | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId || !token) return;

      try {
        setIsLoading(true);
        const data = await fetchTaskById(token, taskId);
        setTask(data.task);
        setSubTask(data.subtasks);
      } catch (error) {
        console.error('Error fetching task:', error.message);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId, token]);

  const handleSubTaskStatusChange = (subTaskId: number, newStatus: Task['status']) => {
    if (!task) return;

    setTask({
      ...task,
      sub_tasks: task.sub_tasks?.map((subTask) =>
        subTask.task_id === subTaskId
          ? { ...subTask, status: newStatus }
          : subTask
      ),
    });
  };

  const handleAssignUser = async (taskId: number, userId: number) => {
    try {
      setTask({ ...task, status: 'in-progress' });
      if (task.user_id) {
        await updateTaskUser(taskId, userId);
      } else {
        await assignUserToTask(taskId, userId);
      }
    } catch (error) {
      console.error('Error assigning user:', error.message);
      alert(error.message || 'Failed to assign/update user for the task.');
    } finally {
      window.location.reload();
    }
  };

  const handleAddComment = (content: string) => {
    if (!task) return;

    const newComment: Comment = {
      id: Date.now(),
      task_id: task.task_id,
      user_id: 1,
      content,
      created_at: new Date().toISOString(),
      user: {
        id: 1,
        name: 'Current User',
        avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=32&h=32&fit=crop&crop=faces',
        email: 'current@example.com',
        role: 'Developer',
      },
    };

    setTask({
      ...task,
      comments: [...(task.comments || []), newComment],
    });
  };

  const handleCreateSubTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subTaskName || !subTaskDescription || !subTaskDueDate) {
      alert('All fields are required.');
      return;
    }

    const selectedDueDate = new Date(subTaskDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDueDate < today) {
      alert('Due date cannot be earlier than today.');
      return;
    }
    if (task?.due_date) {
      const parentDueDate = new Date(task.due_date);
      if (selectedDueDate > parentDueDate) {
        alert('Subtask due date cannot be later than the parent task due date.');
        return;
      }
    }
    

    try {
      setIsCreatingSubTask(true);

      
      const newSubTask = {
        task_name: subTaskName,
        task_description: subTaskDescription,
        due_date: subTaskDueDate,
        parent_task_id: task?.task_id,
        team_id: teamId,
      };

      await createTask(token, newSubTask);

      setSubTaskName('');
      setSubTaskDescription('');
      setSubTaskDueDate('');
      setShowSubTaskForm(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to create sub-task:', error.message);
      alert('Error creating sub-task. Please try again.');
    } finally {
      setIsCreatingSubTask(false);
    }
  };

  if (isLoading || !task) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <TaskDetailHeader
          task={task}
          onUpdateStatus={async (newStatus) => {
            try {
              await updateTaskStatus(task.task_id, newStatus);
              setTask({ ...task, status: newStatus });
            } catch (error) {
              console.error('Failed to update task status:', error.message);
              alert('Error updating status. Please try again.');
            }
          }}
          onUpdateDueDate={async (newDueDate) => {
            try {
              await updateTaskDueDate(task.task_id, newDueDate);
              setTask({ ...task, due_date: newDueDate.toISOString() });
            } catch (error) {
              console.error('Failed to update due date:', error.message);
              alert('Error updating due date. Please try again.');
            }
          }}
        />

        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.task_description}
              </p>
            </motion.div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setActiveTab('subtasks')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'subtasks'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sub-tasks ({subTask?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'comments'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Comments ({task.comments?.length || 0})
                </button>
              </div>

              {activeTab === 'subtasks' ? (
                <div>
                  <button
                    onClick={() => setShowSubTaskForm(true)}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
                  >
                    Create Subtask
                  </button>
                  <div className="space-y-4">
                    {subTask?.map((subTask) => (
                      <SubTaskCard
                        key={subTask.task_id}
                        subTask={subTask}
                        onStatusChange={handleSubTaskStatusChange}
                        onAssignUser={handleAssignUser}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <CommentList
                  comments={task.comments || []}
                  onAddComment={handleAddComment}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <TaskDetailSidebar
              task={task}
              onAssignUser={(userId) => handleAssignUser(task.task_id, userId)}
              onUpdateDueDate={async (newDueDate) => {
                try {
                  await updateTaskDueDate(task.task_id, newDueDate);
                  setTask({ ...task, due_date: newDueDate.toISOString() });
                } catch (error) {
                  console.error('Failed to update due date:', error.message);
                  alert('Error updating due date. Please try again.');
                }
              }}
            />
          </div>
        </div>

        {showSubTaskForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
            >
              <h2 className="text-lg font-semibold mb-4 text-center">
                Create Subtask
              </h2>
              <form onSubmit={handleCreateSubTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subtask Name
                  </label>
                  <input
                    type="text"
                    value={subTaskName}
                    onChange={(e) => setSubTaskName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={subTaskDescription}
                    onChange={(e) => setSubTaskDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={subTaskDueDate}
                    onChange={(e) => setSubTaskDueDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSubTaskForm(false)}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    disabled={isCreatingSubTask}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    disabled={isCreatingSubTask}
                  >
                    {isCreatingSubTask ? (
                      <>
                        <div className="loader w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
