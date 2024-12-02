import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { fetchNotifications, updateNotificationReadStatus } from '../service/service';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';


export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const token = sessionStorage.getItem('Token');
  const limit = 4;
  const navigate = useNavigate();


  const loadNotifications = async () => {
    if (!token || loading) return;
  
    try {
      setLoading(true);
      const newNotifications = await fetchNotifications(token, limit, offset);
      const unreadNotifications = newNotifications.filter((notification) => notification.read_status === 0);
  
      setNotifications((prev) => [...prev, ...unreadNotifications]);
      setOffset((prev) => prev + limit);
  
      if (unreadNotifications.length < limit) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error.message);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications();
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        className="p-2 rounded-md hover:bg-gray-100 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6 text-gray-500" />
        {notifications.some((n) => n.read_status === 0) && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification, index) => (
              <div
                key={notification.notification_id || index}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  notification.read_status === 0 ? 'bg-blue-50' : ''
                }`}
                onClick={async () => {
                  if (notification.read_status === 0) {
                    try {
                      await updateNotificationReadStatus(token, notification.notification_id);
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.notification_id === notification.notification_id
                            ? { ...n, read_status: 1 }
                            : n
                        )
                      );
                    } catch (error) {
                      console.error('Failed to update notification read status:', error.message);
                    }
                  }
                  if (notification.link) {
                    navigate(notification.link);
                  }
                }}
              >
                <h4 className="text-sm font-semibold text-gray-900">
                  {notification.team_name ? `${notification.team_name}: ` : ''}
                  {notification.notification_type}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <span className="text-xs text-gray-500 mt-1">
                {format(new Date(notification.notified_at), 'MMM d, yyyy')}
              </span>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="p-3 text-center">
              <button
                onClick={loadNotifications}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
