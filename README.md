# Job Management System - Giao & Nhận Việc

Ứng dụng web quản lý công việc cho nhân viên + khách hàng.

## 🎯 Features

- ✅ Giao việc cho nhân viên (5 người)
- ✅ Khách hàng đăng việc
- ✅ Real-time notification
- ✅ GPS location tracking
- ✅ Hình ảnh xác minh (before/after)
- ✅ Status tracking (pending → assigned → in_progress → completed)
- ✅ Độ ưu tiên (normal/urgent)
- ✅ Deadline management

## 🏗️ Tech Stack

**Backend:**
- Supabase (PostgreSQL + Real-time)
- PostgreSQL functions + RLS

**Frontend:**
- React 18+
- Supabase JS SDK
- Leaflet.js (Maps)
- React Query (Data fetching)
- TailwindCSS (Styling)

## 📦 Setup

### 1. Tạo Supabase Project
```bash
# Vào https://supabase.com
# Tạo project mới
# Copy API keys từ Settings
```

### 2. Chạy SQL Schema
```bash
# Copy nội dung file database-schema.sql
# Vào SQL Editor của Supabase
# Chạy script
```

### 3. Setup Frontend
```bash
npm create vite@latest job-management -- --template react
cd job-management
npm install
npm install @supabase/supabase-js
npm install leaflet react-leaflet
npm install react-query
npm install -D tailwindcss
npm run dev
```

### 4. Config Supabase Keys
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🗂️ File Structure

```
job-management/
├── database-schema.sql          # Database
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── JobList.jsx
│   │   │   ├── JobDetail.jsx
│   │   │   ├── JobForm.jsx
│   │   │   ├── Map.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   └── Notifications.jsx
│   │   ├── services/
│   │   │   └── supabaseClient.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useJobs.js
│   │   │   └── useLocation.js
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🚀 Deploy

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Option 2: Netlify
```bash
npm run build
# Deploy build folder to Netlify
```

### Option 3: Hostinger (PHP hosting)
- Build React: `npm run build`
- Upload `dist/` folder via cPanel
- Config: Redirect all routes to index.html

## 📝 Database Schema

### Users (nhân viên, khách hàng, admin)
- id, email, password, full_name, user_type, avatar_url

### Jobs (công việc)
- id, title, description, location, priority, status, deadline
- created_by, assigned_to
- scheduled_date, completed_at

### Job Images (hình ảnh xác minh)
- job_id, image_url, image_type (before/after/location)

### Job Locations (GPS tracking)
- job_id, latitude, longitude, recorded_at

### Notifications (thông báo real-time)
- user_id, job_id, type, title, is_read

## 🔒 Security

- Row-level Security (RLS) - Users chỉ thấy data của mình
- Auth via Supabase (email/password)
- File upload via Supabase Storage

## 📱 API Endpoints

Tất cả dùng Supabase JS SDK (real-time):

```javascript
// Create job
const { data, error } = await supabase
  .from('jobs')
  .insert([{ title, description, location, priority, created_by }]);

// Subscribe to job updates (real-time)
supabase
  .from('jobs')
  .on('*', payload => {
    console.log('Job updated:', payload);
  })
  .subscribe();

// Update job status
await supabase
  .from('jobs')
  .update({ status: 'completed' })
  .eq('id', jobId);
```

## 📊 Database Relationships

```
Users (1) ----< (Many) Jobs
         ----< (Many) Notifications
         ----< (Many) Job Updates
         ----< (Many) Job Images
         ----< (Many) Job Locations

Jobs (1) ----< (Many) Job Images
     ----< (Many) Job Locations
     ----< (Many) Job Updates
     ----< (Many) Notifications
```

## 🎨 UI/UX

- **Dashboard**: Danh sách jobs, status filter
- **Job Detail**: Info, images, GPS map, updates history
- **Create Job**: Form tạo việc mới
- **Notifications**: Real-time alerts
- **Profile**: Manage account

## 🧪 Testing

```bash
npm test
```

## 📞 Support

Liên hệ: support@example.com

---

Made with ❤️ by NaVid
