-- ============================================
-- Job Management System - Database Schema
-- ============================================

-- 1. Users table (nhân viên + khách hàng)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'staff', 'customer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Jobs table (công việc)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('normal', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Job images (hình ảnh xác minh)
CREATE TABLE job_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT CHECK (image_type IN ('before', 'after', 'location')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID NOT NULL REFERENCES users(id)
);

-- 4. Job locations (GPS tracking)
CREATE TABLE job_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID NOT NULL REFERENCES users(id)
);

-- 5. Job updates (nhật ký cập nhật)
CREATE TABLE job_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id),
    old_status TEXT,
    new_status TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notifications table (thông báo)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('assigned', 'status_changed', 'urgent', 'message')),
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES (tối ưu query)
-- ============================================

CREATE INDEX idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_priority ON jobs(priority);
CREATE INDEX idx_jobs_deadline ON jobs(deadline);
CREATE INDEX idx_job_images_job_id ON job_images(job_id);
CREATE INDEX idx_job_locations_job_id ON job_locations(job_id);
CREATE INDEX idx_job_updates_job_id ON job_updates(job_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: Mỗi user chỉ thấy profile của mình (admin thấy tất cả)
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id OR (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin');

-- Jobs: Người giao, người nhận, admin thấy được
CREATE POLICY "Jobs visible to creator, assignee, and admin"
ON jobs FOR SELECT
USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR 
    (SELECT user_type FROM users WHERE id = auth.uid()) = 'admin'
);

-- Notifications: User chỉ thấy notification của mình
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Auto-create notification khi assign job
CREATE OR REPLACE FUNCTION notify_job_assigned()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != OLD.assigned_to THEN
        INSERT INTO notifications (user_id, job_id, type, title, message)
        VALUES (
            NEW.assigned_to,
            NEW.id,
            'assigned',
            'Bạn được giao công việc mới: ' || NEW.title,
            'Độ ưu tiên: ' || NEW.priority || ' | Deadline: ' || NEW.deadline
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_assigned_trigger
AFTER UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION notify_job_assigned();

-- Commit
COMMIT;
