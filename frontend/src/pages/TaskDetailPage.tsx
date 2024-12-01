import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { TaskDetailHeader } from '../components/tasks/TaskDetailHeader';
import { SubTaskCard } from '../components/tasks/SubTaskCard';
import { CommentList } from '../components/comments/CommentList';
import { TaskDetailSidebar } from '../components/tasks/TaskDetailSidebar';
import { Task, Comment } from '../types/task';
import { Pencil, Trash, X } from 'lucide-react';

import {
  addTaskComment,
  assignUserToTask,
  createTask,
  deleteTask,
  deleteTaskComment,
  fetchTaskById,
  updateTaskDueDate,
  updateTaskNameAndDescription,
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
  const [editMode, setEditMode] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);




  const navigate = useNavigate();

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId || !token) return;

      try {
        setIsLoading(true);
        const data = await fetchTaskById(token, taskId);
        setTask(data.task);
        setSubTask(data.subtasks);
        setEditTaskName(data.task.task_name);
        setEditTaskDescription(data.task.task_description);
      } catch (error) {
        console.error('Error fetching task:', error.message);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId, token]);

  useEffect(() => {
    if (
      editTaskName.trim() !== task?.task_name ||
      editTaskDescription.trim() !== task?.task_description
    ) {
      setIsButtonEnabled(true);
    } else {
      setIsButtonEnabled(false);
    }
  }, [editTaskName, editTaskDescription, task]);


  const handleAssignUser = async (taskId: number, userId: number) => {
    try {
      setTask({ ...task, status: 'open' });
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

  const handleAddComment = async (content: string) => {
    if (!task || !token) return;
  
    try {
      const { comment } = await addTaskComment(token, task.task_id, content);
      setTask({
        ...task,
        comments: [...(task.comments || []), comment],
      });
    } catch (error: any) {
      console.error('Failed to add comment:', error.message);
      alert(error.message || 'Error adding comment. Please try again.');
    }
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

  const handleEditTask = async () => {
    setIsSaving(true);
    const token = sessionStorage.getItem('Token'); 
    try {
      await updateTaskNameAndDescription(task!.task_id, {
        task_name: editTaskName,
        task_description: editTaskDescription,
      }, token);
      setTask((prevTask) => ({
        ...prevTask!,
        task_name: editTaskName,
        task_description: editTaskDescription,
      }));
      setShowEditForm(false);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update task:', error.message);
      alert(error.message || 'Error updating task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  
  const handleDeleteTask = async () => {
    try {
      setIsDeleting(true);
      await deleteTask(task!.task_id, token);
      navigate(`/team/${teamId}/tasks/`);
    } catch (error) {
      console.error('Failed to delete task:', error.message);
      alert('Error deleting task. Please try again.');
    }
    finally{
      setIsDeleting(false);
    }
  };
  

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
              className="bg-white rounded-lg shadow-sm p-6 relative"
            >
              <h2 className="text-xl font-semibold mb-4">Description</h2>

              {/* Toggle Between Pencil and Close Icons */}
              <button
                onClick={() => setEditMode(!editMode)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label={editMode ? 'Close' : 'Edit'}
              >
                {editMode ? (
                  <X className="w-4 h-4" /> // Close (X) Icon
                ) : (
                  <Pencil className="w-4 h-4" /> // Pencil Icon
                )}
              </button>

              {/* Description */}
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.task_description}
              </p>

              {/* Edit/Delete Icons with Tooltips */}
              {editMode && (
                <div className="flex justify-end gap-4 mt-4">
                  <div className="relative group">
                    <button
                      onClick={() => setShowEditForm(true)}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <Pencil className="w-4 h-4" /> {/* Edit Icon */}
                    </button>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-xs text-white bg-gray-700 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Edit Task
                    </span>
                  </div>

                  <div className="relative group">
                    <button
                      onClick={() => setShowDeleteConfirmation(true)}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <Trash className="w-4 h-4" /> {/* Delete Icon */}
                    </button>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-xs text-white bg-gray-700 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Delete Task
                    </span>
                  </div>
                </div>
              )}
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
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <CommentList
                  comments={task.comments || []}
                  onAddComment={handleAddComment}
                  onDeleteComment={async (commentId) => {
                    try {
                      await deleteTaskComment(token, task.task_id, commentId);
                      setTask((prevTask) => ({
                        ...prevTask,
                        comments: prevTask.comments?.filter((comment) => comment.comment_id !== commentId) || [],
                      }));
                    } catch (error) {
                      alert('Failed to delete comment. Please try again.');
                    }
                  }}
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
      {showEditForm && (
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
            <h2 className="text-lg font-semibold mb-4 text-center">Edit Task</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditTask();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Task Name
                </label>
                <input
                  type="text"
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                  className="w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Task Description
                </label>
                <textarea
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  className="w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                ></textarea>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                type="submit"
                className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 ${
                  isButtonEnabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!isButtonEnabled || isSaving} // Disable if no changes or saving in progress
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      {showDeleteConfirmation && (
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
              Confirm Deletion
            </h2>
            <p className="text-sm text-gray-700 mb-6 text-center">
              Are you sure you want to delete this task? All the subtasks associated will be deleted
              and cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                disabled={isDeleting} 
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                disabled={isDeleting} 
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Task'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}


    </Layout>
  );
}
