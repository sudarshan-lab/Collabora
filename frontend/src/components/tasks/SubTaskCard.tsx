import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, User, CheckCircle, Circle } from 'lucide-react';
import { Task, Comment } from '../../types/task';
import { format } from 'date-fns';
import { CommentList } from '../comments/CommentList';

interface SubTaskCardProps {
  subTask: Task;
  onStatusChange: (taskId: number, status: Task['status']) => void;
  onAssignUser: (taskId: number, userId: number) => void;
  onAddComment: (taskId: number, content: string) => void;
}

export function SubTaskCard({ 
  subTask, 
  onStatusChange, 
  onAssignUser,
  onAddComment 
}: SubTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 flex items-start gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(
              subTask.task_id,
              subTask.status === 'completed' ? 'open' : 'completed'
            );
          }}
          className="mt-1"
        >
          {subTask.status === 'completed' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-300" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">
              {subTask.task_name}
            </h4>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Due {format(new Date(subTask.due_date), 'MMM d')}</span>
            </div>
            {subTask.user_id && (
              <div className="flex items-center gap-1">
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium text-white"
                  style={{
                    background: `linear-gradient(135deg, #${Math.floor(Math.random() * 16777215).toString(16)} 0%, #${Math.floor(Math.random() * 16777215).toString(16)} 100%)`,
                  }}
                >
                  {subTask.first_name[0]}
                  {subTask.last_name[0]}
                </div>
                <span>{subTask.first_name + " " + subTask.last_name}</span>
              </div>
            )}

          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-700 mb-4">
                {subTask.task_description}
              </p>
              
              <div className="flex items-center gap-4 mb-6">
                <select
                  value={subTask.status}
                  onChange={(e) => onStatusChange(subTask.task_id, e.target.value as Task['status'])}
                  className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  onClick={() => onAssignUser(subTask.task_id, 1)}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <User className="w-4 h-4" />
                  {subTask.user_id ? 'Reassign' : 'Assign'}
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-4">Comments</h5>
                <CommentList
                  comments={subTask.comments || []}
                  onAddComment={(content) => onAddComment(subTask.task_id, content)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}