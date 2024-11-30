import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar as CalendarIcon, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Calendar } from '../ui/calendar'; // Use the Calendar component

interface TaskDetailSidebarProps {
  task: Task;
  onAssignUser: (userId: number) => void;
  onUpdateDueDate: (newDueDate: Date) => void; // Callback to update the due date
}

export function TaskDetailSidebar({ task, onAssignUser, onUpdateDueDate }: TaskDetailSidebarProps) {
  const availableUsers = JSON.parse(sessionStorage.getItem('TeamMembers')) || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false); // Toggle for calendar

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDueDateChange = async (newDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ensure no time in today's date
    if (newDate >= today) {
      setShowDatePicker(false);
      await onUpdateDueDate(newDate); // Call parent handler
    } else {
      alert('Due date cannot be earlier than today.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg shadow-sm p-6 space-y-6"
    >
      {/* Assignee Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Assignee</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              {task.user_id ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                    style={{
                      background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                    }}
                  >
                    {task.first_name[0]}
                    {task.last_name[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {task.first_name.trim()} {task.last_name.trim()}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Assign task
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-full max-w-sm max-h-64 bg-white overflow-y-auto shadow-lg rounded-md border p-2"
          >
            <div className="relative mb-2">
              <Search className="absolute top-2 left-2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-md border border-gray-300 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <DropdownMenuItem
                  key={user.user_id}
                  onClick={() => onAssignUser(user.user_id)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                    style={{
                      background: `linear-gradient(135deg, #${Math.floor(
                        Math.random() * 16777215
                      ).toString(16)} 0%, #${Math.floor(
                        Math.random() * 16777215
                      ).toString(16)} 100%)`,
                    }}
                  >
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-900">
                      {user.first_name.trim()} {user.last_name.trim()}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </DropdownMenuItem>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-sm text-gray-500 text-center">No users found</p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Due Date Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
        <div className="flex items-center gap-2 relative text-sm text-gray-900">
          <CalendarIcon
            className="w-4 h-4 cursor-pointer"
            onClick={() => setShowDatePicker(!showDatePicker)}
          />
          <span
            className="cursor-pointer"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            {format(new Date(task.due_date), 'MMM d, yyyy')}
          </span>
          {showDatePicker && (
            <div className="absolute top-10 left-0 bg-white shadow-lg rounded-md z-10">
              <Calendar
                mode="single"
                selected={new Date(task.due_date)}
                onSelect={(date) => date && handleDueDateChange(date)}
                fromDate={new Date()} // Disable past dates
              />
            </div>
          )}
        </div>
      </div>

      {/* Created Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
        <div className="flex items-center gap-2 text-sm text-gray-900">
          <Clock className="w-4 h-4 text-gray-400" />
          {format(new Date(task.created_at), 'MMM d, yyyy')}
        </div>
      </div>

      {/* Team Members Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Team Members</h3>
        <div className="flex -space-x-2">
          {availableUsers.map((user) => (
            <div
              key={user.user_id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white border-2 border-white cursor-pointer"
              title={`${user.first_name} ${user.last_name}`}
              style={{
                background: `linear-gradient(135deg, #${Math.floor(
                  Math.random() * 16777215
                ).toString(16)} 0%, #${Math.floor(
                  Math.random() * 16777215
                ).toString(16)} 100%)`,
              }}
            >
              {user.first_name[0]}
              {user.last_name[0]}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
