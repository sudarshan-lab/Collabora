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
      <div className="min-h-full">
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
              className="card relative p-6"
            >
              <h2 className="mb-4 text-lg font-bold text-gray-900">Description</h2>

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



            <div className="card p-6">
              <div className="mb-6 flex gap-2 border-b border-gray-100 pb-4">
                <button
                  onClick={() => setActiveTab('subtasks')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === 'subtasks'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  Sub-tasks ({subTask?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === 'comments'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  Comments ({task.comments?.length || 0})
                </button>
              </div>

              {activeTab === 'subtasks' ? (
                <div>
                  <button onClick={() => setShowSubTaskForm(true)} className="btn-brand mb-4">
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
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-card"
            >
              <h2 className="mb-1 text-lg font-bold text-gray-900">Create subtask</h2>
              <p className="mb-5 text-sm text-gray-500">Break this task into smaller pieces.</p>
              <form onSubmit={handleCreateSubTask} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Subtask name</label>
                  <input
                    type="text"
                    value={subTaskName}
                    onChange={(e) => setSubTaskName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={subTaskDescription}
                    onChange={(e) => setSubTaskDescription(e.target.value)}
                    className="input-field h-auto py-2.5"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Due date</label>
                  <input
                    type="date"
                    value={subTaskDueDate}
                    onChange={(e) => setSubTaskDueDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowSubTaskForm(false)} className="btn-ghost" disabled={isCreatingSubTask}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-brand" disabled={isCreatingSubTask}>
                    {isCreatingSubTask ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Creating...
                      </>
                    ) : (
                      'Create subtask'
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
          className="modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="modal-card"
          >
            <h2 className="mb-5 text-lg font-bold text-gray-900">Edit task</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditTask();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Task name</label>
                <input
                  type="text"
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Task description</label>
                <textarea
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  className="input-field h-auto py-2.5"
                  rows={4}
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowEditForm(false)} className="btn-ghost">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={isButtonEnabled ? 'btn-brand' : 'btn-brand opacity-50 cursor-not-allowed'}
                  disabled={!isButtonEnabled || isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
          className="modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="modal-card"
          >
            <h2 className="text-lg font-bold text-gray-900">Delete task?</h2>
            <p className="mt-2 mb-6 text-sm text-gray-600">
              Are you sure you want to delete this task? All associated subtasks will be deleted and this cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirmation(false)} className="btn-ghost" disabled={isDeleting}>
                Cancel
              </button>
              <button onClick={handleDeleteTask} className="btn-danger" disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
