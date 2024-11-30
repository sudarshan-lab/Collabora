import React from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  assignee: string;
};

const tasks: Task[] = [
  {
    id: '1',
    title: 'Update project documentation',
    dueDate: '2024-03-20',
    status: 'pending',
    assignee: 'Sarah Wilson'
  },
  {
    id: '2',
    title: 'Review pull requests',
    dueDate: '2024-03-19',
    status: 'completed',
    assignee: 'John Davis'
  },
  {
    id: '3',
    title: 'Prepare sprint presentation',
    dueDate: '2024-03-22',
    status: 'pending',
    assignee: 'Mike Johnson'
  }
];

export function TaskList() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {tasks.map((task) => (
          <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle 
                  className={`h-5 w-5 ${
                    task.status === 'completed' 
                      ? 'text-green-500' 
                      : 'text-gray-400'
                  }`} 
                />
                <span className="text-sm font-medium text-gray-900">
                  {task.title}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{task.assignee}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{task.dueDate}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}