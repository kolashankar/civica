import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsApi } from '../../services/api';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_inspection_id?: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(
        notifications.map((notif) =>
          notif._id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map((notif) => ({ ...notif, is_read: true })));
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inspection_assigned':
        return '📋';
      case 'inspection_submitted':
        return '✅';
      case 'response_required':
        return '⚠️';
      case 'govt_review':
        return '👁️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'inspection_assigned':
        return 'bg-blue-50 border-blue-200';
      case 'inspection_submitted':
        return 'bg-green-50 border-green-200';
      case 'response_required':
        return 'bg-orange-50 border-orange-200';
      case 'govt_review':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-600">You'll see notifications here when there's activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`border rounded-lg p-4 transition-all ${
                notification.is_read
                  ? 'bg-white border-gray-200'
                  : `${getNotificationColor(notification.type)} border-l-4`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                      )}
                    </div>
                    <p className={`mt-1 text-sm ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
