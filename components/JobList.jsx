import React, { useState, useEffect } from 'react';
import { jobs } from '../supabaseClient';
import JobDetail from './JobDetail';

export default function JobList({ user }) {
  const [jobList, setJobList] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filter, setFilter] = useState('all');
  const [priority, setPriority] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();

    // Subscribe to real-time updates
    const unsubscribe = jobs.subscribe((payload) => {
      loadJobs();
    });

    return () => {
      if (unsubscribe) unsubscribe.unsubscribe();
    };
  }, [user.id]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const filters = {};

      if (filter !== 'all') filters.status = filter;
      
      if (user.user_type === 'staff') {
        filters.assignedTo = user.id;
      }

      const { data, error } = await jobs.getAll(filters);

      if (error) throw error;

      let filtered = data || [];
      if (priority !== 'all') {
        filtered = filtered.filter(j => j.priority === priority);
      }

      setJobList(filtered);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handlePriorityChange = (newPriority) => {
    setPriority(newPriority);
  };

  if (selectedJob) {
    return (
      <JobDetail 
        jobId={selectedJob} 
        user={user}
        onBack={() => setSelectedJob(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2">Status:</p>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'assigned', 'in_progress', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  filter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'all' ? '📋 Tất cả' : 
                 status === 'pending' ? '⏳ Chưa Giao' :
                 status === 'assigned' ? '📤 Đã Giao' :
                 status === 'in_progress' ? '⚙️ Đang Làm' : '✅ Xong'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2">Priority:</p>
          <div className="flex gap-2">
            {['all', 'normal', 'urgent'].map(p => (
              <button
                key={p}
                onClick={() => handlePriorityChange(p)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  priority === p
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {p === 'all' ? '📊 Tất cả' : p === 'normal' ? '⚪ Bình Thường' : '🔴 Gấp'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">⏳ Đang tải...</p>
        </div>
      ) : jobList.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600 text-lg">📭 Không có công việc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobList.map(job => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job.id)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg cursor-pointer transition border-l-4"
              style={{
                borderColor: job.priority === 'urgent' ? '#ef4444' : '#3b82f6'
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800 flex-1 line-clamp-2">
                  {job.title}
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${
                  job.priority === 'urgent'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {job.priority === 'urgent' ? '🔴 Gấp' : '⚪ Bình thường'}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                📍 {job.location}
              </p>

              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Status:</span>{' '}
                  {job.status === 'pending' ? '⏳ Chưa giao' :
                   job.status === 'assigned' ? '📤 Đã giao' :
                   job.status === 'in_progress' ? '⚙️ Đang làm' : '✅ Xong'}
                </p>

                {job.deadline && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Deadline:</span>{' '}
                    {new Date(job.deadline).toLocaleDateString('vi-VN')}
                  </p>
                )}

                <p className="text-gray-600 text-xs">
                  🕐 {new Date(job.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t">
                <p className="text-xs text-gray-500">
                  👆 Click để xem chi tiết
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
