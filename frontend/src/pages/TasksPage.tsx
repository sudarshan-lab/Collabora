import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { createTask, fetchAllTasks } from '../components/service/service';

export function TasksPage() {
  const { teamId } = useParams();
  const token = sessionStorage.getItem('Token');
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const navigate = useNavigate();

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
        due_date: dueDate,
        team_id: teamId,
      };

      const createdTask = await createTask(token, newTask); // Service call to create a task

      setTasks([...tasks, createdTask]);
      setTaskName('');
      setTaskDescription('');
      setDueDate('');
      setShowTaskForm(false);
    } catch (error) {
      alert('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskStatusChange = (taskId, newStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.task_id === taskId ? { ...task, status: newStatus } : task
      )
    );
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

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-gray-900"
          >
            Tasks
          </motion.h1>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setShowTaskForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md"
          >
            <Plus className="w-5 h-5" />
            New Task
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {tasks.map((task) => (
            <motion.div
              key={task.task_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg cursor-pointer"
              onClick={() => handleNavigation(`/team/${teamId}/tasks/${task.task_id}`)}
              
            >
              <h3 className="text-lg font-semibold text-gray-900">{task.task_name}</h3>
              <p className="text-sm text-gray-700 mt-1">{task.task_description}</p>
              {task.due_date && (
                <p className="text-sm text-gray-500 mt-2">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </p>
              )}
              <div className="mt-4 flex justify-between items-center">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  task.status === 'open'
                    ? 'bg-blue-100 text-blue-600'
                    : task.status === 'in-progress'
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-green-100 text-green-600'
                }`}
              >
                {task.status}
              </span>
              <p className="text-sm text-gray-600">
                {task.user_id
                  ? `${task.first_name} ${task.last_name}`
                  : 'Unassigned'}
              </p>
            </div>

            </motion.div>
          ))}
        </motion.div>

        {showTaskForm && (
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
                Create New Task
              </h2>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
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
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
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
      </motion.div>
    </Layout>
  );
}
