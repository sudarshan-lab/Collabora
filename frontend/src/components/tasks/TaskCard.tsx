import React from 'react';
import { motion } from 'framer-motion';

export function TaskCard({ task, onStatusChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-900">{task.task_name}</h3>
      <p className="text-sm text-gray-700 mt-1">{task.task_description}</p>
      {task.due_date && (
        <p className="text-sm text-gray-500 mt-2">
          Due: {new Date(task.due_date).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}
