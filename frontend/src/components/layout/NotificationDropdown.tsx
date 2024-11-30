import React, { useState } from 'react';
import { Bell } from 'lucide-react';

const notifications = [
  {
    id: 1,
    title: "New comment on Project X",
    message: "Sarah left a comment on your task",
    time: "5m ago",
    unread: true,
  },
  {
    id: 2,
    title: "Task deadline approaching",
    message: "Design review due in 2 hours",
    time: "1h ago",
    unread: true,
  },
  {
    id: 3,
    title: "Team meeting reminder",
    message: "Weekly sync starts in 30 minutes",
    time: "2h ago",
    unread: false,
  },
];

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        className="p-2 rounded-md hover:bg-gray-100 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6 text-gray-500" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  notification.unread ? 'bg-blue-50' : ''
                }`}
              >
                <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <span className="text-xs text-gray-500 mt-1">{notification.time}</span>
              </div>
            ))}
          </div>
          {/* <div className="p-3 text-center border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View all notifications
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
}