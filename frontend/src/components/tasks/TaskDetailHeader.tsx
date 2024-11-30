import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Calendar } from '../ui/calendar'; // Use the provided Calendar component
import { Task } from '../../types/task';
import { format } from 'date-fns';

interface TaskDetailHeaderProps {
  task: Task;
  onUpdateStatus: (newStatus: string) => void; // Callback to update task status
  onUpdateDueDate: (newDueDate: Date) => void; // Callback to update due date
}

export function TaskDetailHeader({ task, onUpdateStatus, onUpdateDueDate }: TaskDetailHeaderProps) {
  const navigate = useNavigate();
  const { teamId } = useParams(); // Get teamId from URL params
  const [selectedStatus, setSelectedStatus] = useState(task.status); // Track selected status
  const [showDatePicker, setShowDatePicker] = useState(false); // Toggle for date picker

  const handleStatusChange = async (newStatus: string) => {
    setSelectedStatus(newStatus); // Update local status
    await onUpdateStatus(newStatus); // Call the parent handler
  };

  const handleDueDateChange = async (newDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove time from today
    if (newDate >= today) {
      setShowDatePicker(false);
      await onUpdateDueDate(newDate); // Call parent handler
    } else {
      alert('Due date cannot be earlier than today.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 px-8 py-6"
    >
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate(`/team/${teamId}/tasks`)} // Navigate to the team's tasks page
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{task.task_name}</h1>
      </div>

      <div className="flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2 relative">
          <CalendarIcon className="w-4 h-4 cursor-pointer" onClick={() => setShowDatePicker(!showDatePicker)} />
          <span
            className="cursor-pointer"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            Due {format(new Date(task.due_date), 'MMM d, yyyy')}
          </span>
          {showDatePicker && (
            <div className="absolute top-10 left-0 bg-white shadow-lg rounded-md z-10">
              <Calendar
                mode="single"
                selected={new Date(task.due_date)}
                onSelect={(date) => date && handleDueDateChange(date)}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Created {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
        </div>

        {/* Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedStatus === 'open'
                  ? 'bg-blue-100 text-blue-600'
                  : selectedStatus === 'in-progress'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              {selectedStatus}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => handleStatusChange('open')}
            >
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => handleStatusChange('in-progress')}
            >
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => handleStatusChange('completed')}
            >
              Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
