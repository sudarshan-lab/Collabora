import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, Users } from 'lucide-react';
import { fetchAllTasks } from '../service/service';
import { format } from 'date-fns';

type Task = {
  task_id: string;
  task_name: string;
  due_date: string;
  status: 'open' | 'in-progress' | 'completed';
  first_name: string;
  last_name: string;
  user_id: string;
  created_at: string;
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const { teamId } = useParams<{ teamId: string }>();
  const token = sessionStorage.getItem('Token');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!token || !teamId) return;

      try {
        setLoadingTasks(true);
        const data = await fetchAllTasks(token, teamId);
        const latestTasks = (data.tasks || [])
          .sort((a: Task, b: Task) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);

        setTasks(latestTasks);
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

  const handleTaskClick = (taskId: string) => {
    sessionStorage.setItem('ActiveNav', 'tasks');
    navigate(`/team/${teamId}/tasks/${taskId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
      </div>
      {loadingTasks ? (
          <div className="px-6 py-4 text-center text-gray-500">
            <svg
              className="animate-spin h-5 w-5 text-gray-500 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="mt-2">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="col-span-full text-center py-12">
              <Users className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
          </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <div
              key={task.task_id}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleTaskClick(task.task_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle
                    className={`h-5 w-5 ${
                      task.status === 'completed' ? 'text-green-500' : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-900">{task.task_name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {task.user_id ? (
                    <span>{task.first_name} {task.last_name}</span>
                    ):(
                      <span>Unassigned</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                  <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
