import React, { useState, useEffect } from 'react';
import { jobs, images, locations, supabase } from '../supabaseClient';
import ImageUpload from './ImageUpload';

export default function JobDetail({ jobId, user, onBack }) {
  const [job, setJob] = useState(null);
  const [jobImages, setJobImages] = useState([]);
  const [jobLocation, setJobLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadJobDetail();
  }, [jobId]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);

      const { data: jobData, error: jobError } = await jobs.getById(jobId);
      if (jobError) throw jobError;

      setJob(jobData);
      setNewStatus(jobData.status);

      const { data: imageData, error: imageError } = await images.getByJobId(jobId);
      if (!imageError && imageData) {
        setJobImages(imageData);
      }

      const { data: locationData, error: locationError } = await locations.getByJobId(jobId);
      if (!locationError && locationData && locationData.length > 0) {
        setJobLocation(locationData[0]);
      }
    } catch (err) {
      console.error('Error loading job detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (newStatus === job.status) return;

    try {
      setUpdating(true);

      const { error } = await jobs.update(jobId, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date() : null
      });

      if (error) throw error;

      // Save to updates table
      await supabase
        .from('job_updates')
        .insert([{
          job_id: jobId,
          updated_by: user.id,
          old_status: job.status,
          new_status: newStatus,
          message: `Cập nhật trạng thái từ ${job.status} thành ${newStatus}`
        }]);

      setJob(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error updating status:', err);
      setNewStatus(job.status);
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (files) => {
    for (const file of files) {
      await images.upload(jobId, file, 'before');
    }
    loadJobDetail();
  };

  const handleRecordLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          const { error } = await locations.record(jobId, latitude, longitude, accuracy);

          if (error) {
            console.error('Error recording location:', error);
          } else {
            alert('✅ Vị trí đã được lưu!');
            loadJobDetail();
          }
        },
        (error) => {
          alert('❌ Không thể lấy vị trí: ' + error.message);
        }
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">⏳ Đang tải...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">❌ Không tìm thấy công việc</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          ← Quay Lại
        </button>
      </div>
    );
  }

  const canEdit = user.user_type === 'admin' || user.id === job.created_by || user.id === job.assigned_to;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-semibold"
        >
          ← Quay Lại
        </button>
        <h1 className="text-3xl font-bold text-gray-800 flex-1 text-center px-4">
          {job.title}
        </h1>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Details Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">📋 Chi Tiết</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold">📍 Địa Điểm</p>
              <p className="text-gray-800">{job.location}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">🎯 Độ Ưu Tiên</p>
              <p className={job.priority === 'urgent' ? 'text-red-600 font-bold' : 'text-blue-600'}>
                {job.priority === 'urgent' ? '🔴 Gấp' : '⚪ Bình Thường'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">📅 Deadline</p>
              <p className="text-gray-800">
                {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không có'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">✅ Hoàn Thành</p>
              <p className="text-gray-800">
                {job.completed_at ? new Date(job.completed_at).toLocaleDateString('vi-VN') : 'Chưa'}
              </p>
            </div>
          </div>

          {job.description && (
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-2">📝 Mô Tả</p>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {/* Images Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🖼️ Hình Ảnh Xác Minh</h3>

            {canEdit && (
              <ImageUpload onUpload={handleImageUpload} />
            )}

            {jobImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {jobImages.map(img => (
                  <div key={img.id} className="rounded-lg overflow-hidden">
                    <img
                      src={img.image_url}
                      alt={img.image_type}
                      className="w-full h-40 object-cover hover:scale-105 transition"
                    />
                    <p className="text-xs text-gray-600 text-center py-1">
                      {img.image_type === 'before' ? '📸 Trước' :
                       img.image_type === 'after' ? '📸 Sau' : '📍 Vị Trí'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">📭 Chưa có hình ảnh</p>
            )}
          </div>

          {/* Location Section */}
          {jobLocation && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">📍 GPS Tracking</h3>
              <p className="text-sm text-gray-600">
                Vĩ độ: {jobLocation.latitude.toFixed(6)} | Kinh độ: {jobLocation.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-gray-500">
                Lúc: {new Date(jobLocation.recorded_at).toLocaleString('vi-VN')}
              </p>
            </div>
          )}
        </div>

        {/* Status Card */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4 h-fit">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">⚙️ Trạng Thái</h2>

          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">Tình Trạng Hiện Tại</p>
            <div className="text-2xl font-bold mb-3">
              {job.status === 'pending' ? '⏳ Chưa Giao' :
               job.status === 'assigned' ? '📤 Đã Giao' :
               job.status === 'in_progress' ? '⚙️ Đang Làm' :
               job.status === 'completed' ? '✅ Hoàn Thành' : '❌ Hủy'}
            </div>
          </div>

          {canEdit && (
            <div>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">⏳ Chưa Giao</option>
                <option value="assigned">📤 Đã Giao</option>
                <option value="in_progress">⚙️ Đang Làm</option>
                <option value="completed">✅ Hoàn Thành</option>
                <option value="cancelled">❌ Hủy</option>
              </select>

              <button
                onClick={handleStatusChange}
                disabled={updating || newStatus === job.status}
                className="w-full mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold rounded transition"
              >
                {updating ? '⏳ Đang cập nhật...' : '💾 Lưu Trạng Thái'}
              </button>
            </div>
          )}

          {/* Location Recording */}
          {user.user_type === 'staff' && (
            <button
              onClick={handleRecordLocation}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded transition"
            >
              📍 Ghi Lại Vị Trí
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
