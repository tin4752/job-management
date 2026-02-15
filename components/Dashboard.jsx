import React, { useState, useEffect } from 'react';
import { auth, jobs, notifications } from '../supabaseClient';
import JobList from './JobList';
import JobForm from './JobForm';
import Notifications from './Notifications';

export default function Dashboard({ user, session }) {
  const [currentView, setCurrentView] = useState('jobs');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notifications.subscribe(user.id, (newNotification) => {
      setUnreadCount(prev => prev + 1);
    });

    // Get initial unread count
    fetchUnreadCount();

    return () => {
      if (unsubscribe) unsubscribe.unsubscribe();
    };
  }, [user.id]);

  const fetchUnreadCount = async () => {
    try {
      const { data, error } = await notifications.getAll(user.id);
      if (!error && data) {
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600">📋 Job Management</h1>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              {user.user_type === 'admin' ? '👨‍💼 Admin' : user.user_type === 'staff' ? '👷 Nhân viên' : '👤 Khách hàng'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
                  <Notifications userId={user.id} onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <img
                src={user.avatar_url || '👤'}
                alt={user.full_name}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-700">{user.full_name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
            >
              Đăng Xuất
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 flex space-x-4">
          <button
            onClick={() => setCurrentView('jobs')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              currentView === 'jobs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            📋 Công Việc
          </button>

          {user.user_type !== 'staff' && (
            <button
              onClick={() => setCurrentView('create')}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                currentView === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              ➕ Tạo Công Việc
            </button>
          )}

          {user.user_type === 'admin' && (
            <button
              onClick={() => setCurrentView('stats')}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                currentView === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              📊 Thống Kê
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'jobs' && <JobList user={user} />}
        {currentView === 'create' && <JobForm userId={user.id} userType={user.user_type} />}
        {currentView === 'stats' && user.user_type === 'admin' && <AdminStats />}
      </main>
    </div>
  );
}

function AdminStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600 text-sm font-semibold mb-2">Tổng Công Việc</h3>
        <p className="text-3xl font-bold text-blue-600">-</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600 text-sm font-semibold mb-2">Đang Xử Lý</h3>
        <p className="text-3xl font-bold text-yellow-600">-</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600 text-sm font-semibold mb-2">Hoàn Thành</h3>
        <p className="text-3xl font-bold text-green-600">-</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600 text-sm font-semibold mb-2">Quá Hạn</h3>
        <p className="text-3xl font-bold text-red-600">-</p>
      </div>
    </div>
  );
}
