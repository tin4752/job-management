import React, { useState, useEffect } from 'react';
import { jobs, supabase } from '../supabaseClient';

export default function JobForm({ userId, userType }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'normal',
    assigned_to: '',
    deadline: ''
  });
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (userType === 'admin') {
      loadStaff();
    }
  }, [userType]);

  const loadStaff = async () => {
    try {
      const { data, error: err } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('user_type', 'staff')
        .eq('is_active', true);

      if (err) throw err;
      setStaffList(data || []);
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.title.trim()) {
        throw new Error('Vui lòng nhập tên công việc');
      }

      if (!formData.location.trim()) {
        throw new Error('Vui lòng nhập địa điểm');
      }

      const jobData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        priority: formData.priority,
        created_by: userId,
        assigned_to: formData.assigned_to || null,
        deadline: formData.deadline || null,
        status: formData.assigned_to ? 'assigned' : 'pending'
      };

      const { data, error: submitError } = await jobs.create(jobData);

      if (submitError) throw submitError;

      setSuccess('✅ Tạo công việc thành công!');
      setFormData({
        title: '',
        description: '',
        location: '',
        priority: 'normal',
        assigned_to: '',
        deadline: ''
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ ' + err.message);
      console.error('Error creating job:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">➕ Tạo Công Việc Mới</h2>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tên Công Việc *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="VD: Lắp camera tại 123 Nguyễn Huệ"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mô Tả Chi Tiết
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Nhập mô tả chi tiết công việc..."
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Địa Điểm *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="VD: 123 Nguyễn Huệ, Q.1, HCM"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Độ Ưu Tiên
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">⚪ Bình Thường</option>
              <option value="urgent">🔴 Gấp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deadline
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {userType === 'admin' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Giao Cho Nhân Viên
            </label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn nhân viên (optional) --</option>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {loading ? '⏳ Đang xử lý...' : '✅ Tạo Công Việc'}
          </button>
          <button
            type="reset"
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
          >
            🔄 Reset
          </button>
        </div>
      </form>
    </div>
  );
}
