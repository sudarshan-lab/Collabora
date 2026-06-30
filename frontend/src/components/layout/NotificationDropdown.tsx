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
        className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {notifications.some((n) => n.read_status === 0) && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-4">
            <h3 className="text-base font-bold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && !loading && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">You're all caught up 🎉</p>
            )}
            {notifications.map((notification, index) => (
              <div
                key={notification.notification_id || index}
                className={`cursor-pointer border-b border-gray-50 p-4 transition-colors hover:bg-gray-50 ${
                  notification.read_status === 0 ? 'bg-blue-50/60' : ''
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
