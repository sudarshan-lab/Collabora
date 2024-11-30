import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Task } from '../../types/task';

interface SubTaskListProps {
  subTasks: Task[];
  onStatusChange: (taskId: number, status: Task['status']) => void;
}

export function SubTaskList({ subTasks, onStatusChange }: SubTaskListProps) {
    const availableUsers = JSON.parse(sessionStorage.getItem('TeamMembers')) || [];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {subTasks.map((subTask) => (
        <motion.div
          key={subTask.task_id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() =>
                onStatusChange(
                  subTask.task_id,
                  subTask.status === 'completed' ? 'open' : 'completed'
                )
              }
              className="mt-1"
            >
              {subTask.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </button>
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900">
                {subTask.task_name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {subTask.task_description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(subTask.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}