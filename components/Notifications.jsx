import React, { useState, useEffect } from 'react';
import { notifications } from '../supabaseClient';

export default function Notifications({ userId, onClose }) {
  const [notificationList, setNotificationList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    // Subscribe to new notifications
    const unsubscribe = notifications.subscribe(userId, (newNotif) => {
      setNotificationList(prev => [newNotif, ...prev]);
    });

    return () => {
      if (unsubscribe) unsubscribe.unsubscribe();
    };
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await notifications.getAll(userId);
      if (error) throw error;
      setNotificationList(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await notifications.markAsRead(notifId);
      setNotificationList(prev =>
        prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'assigned':
        return '📤';
      case 'status_changed':
        return '🔄';
      case 'urgent':
        return '🔴';
      case 'message':
        return '💬';
      default:
        return '📢';
    }
  };

  return (
    <div className="max-h-96 overflow-y-auto p-4">
      <div className="flex justify-between items-center mb-4 pb-3 border-b">
        <h3 className="font-bold text-gray-800">🔔 Thông Báo</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <p className="text-gray-600">⏳ Đang tải...</p>
        </div>
      ) : notificationList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">📭 Không có thông báo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificationList.map(notif => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg border-l-4 cursor-pointer transition ${
                notif.is_read
                  ? 'bg-gray-50 border-gray-300'
                  : 'bg-blue-50 border-blue-500 hover:bg-blue-100'
              }`}
              onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getIcon(notif.type)}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-xs text-gray-600 mt-1">
                      {notif.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    🕐 {new Date(notif.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                {!notif.is_read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
