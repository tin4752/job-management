import React, { useRef, useState } from 'react';

export default function ImageUpload({ onUpload }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState([]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    
    // Show preview
    const previews = files.map(file => {
      const reader = new FileReader();
      return new Promise(resolve => {
        reader.onload = (e) => {
          resolve({
            file,
            url: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then(results => {
      setPreview(results);
    });
  };

  const handleUpload = async () => {
    if (preview.length === 0) return;

    try {
      setUploading(true);
      const files = preview.map(p => p.file);
      await onUpload(files);
      setPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('❌ Lỗi upload hình: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*"
          className="hidden"
          id="image-input"
        />
        <label
          htmlFor="image-input"
          className="cursor-pointer block"
        >
          <p className="text-2xl mb-2">📸</p>
          <p className="text-gray-700 font-semibold">Click để chọn hình</p>
          <p className="text-sm text-gray-500">hoặc kéo thả hình vào đây</p>
        </label>
      </div>

      {preview.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Đã chọn {preview.length} hình
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {preview.map((p, idx) => (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden"
              >
                <img
                  src={p.url}
                  alt={`preview-${idx}`}
                  className="w-full h-20 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPreview(preview.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold rounded transition"
          >
            {uploading ? '⏳ Đang upload...' : '✅ Upload'}
          </button>
        </div>
      )}
    </div>
  );
}
