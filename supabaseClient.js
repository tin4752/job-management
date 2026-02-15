import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth functions
export const auth = {
    // Đăng ký
    signUp: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });
        return { data, error };
    },

    // Đăng nhập
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    // Đăng xuất
    signOut: async () => {
        await supabase.auth.signOut();
    },

    // Lấy session hiện tại
    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        return { data, error };
    },

    // Subscribe to auth state
    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Jobs functions
export const jobs = {
    // Lấy danh sách jobs
    getAll: async (filters = {}) => {
        let query = supabase.from('jobs').select('*');
        
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.priority) query = query.eq('priority', filters.priority);
        if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        return { data, error };
    },

    // Lấy job detail
    getById: async (id) => {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    },

    // Tạo job mới
    create: async (jobData) => {
        const { data, error } = await supabase
            .from('jobs')
            .insert([jobData])
            .select();
        return { data, error };
    },

    // Cập nhật job
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('jobs')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select();
        return { data, error };
    },

    // Delete job
    delete: async (id) => {
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id);
        return { error };
    },

    // Subscribe to real-time updates
    subscribe: (callback) => {
        return supabase
            .from('jobs')
            .on('*', payload => {
                callback(payload);
            })
            .subscribe();
    }
};

// Images functions
export const images = {
    // Upload image
    upload: async (jobId, file, imageType = 'before') => {
        const fileName = `${jobId}/${imageType}-${Date.now()}.jpg`;
        
        const { data, error } = await supabase.storage
            .from('job-images')
            .upload(fileName, file);
        
        if (error) return { error };
        
        const { data: { publicUrl } } = supabase.storage
            .from('job-images')
            .getPublicUrl(fileName);
        
        // Save to DB
        const { error: dbError } = await supabase
            .from('job_images')
            .insert([{
                job_id: jobId,
                image_url: publicUrl,
                image_type: imageType,
                uploaded_by: (await supabase.auth.getSession()).data.session.user.id
            }]);
        
        return { publicUrl, error: dbError };
    },

    // Get images
    getByJobId: async (jobId) => {
        const { data, error } = await supabase
            .from('job_images')
            .select('*')
            .eq('job_id', jobId);
        return { data, error };
    }
};

// Locations functions
export const locations = {
    // Record location
    record: async (jobId, latitude, longitude, accuracy = null) => {
        const { data, error } = await supabase
            .from('job_locations')
            .insert([{
                job_id: jobId,
                latitude,
                longitude,
                accuracy,
                recorded_by: (await supabase.auth.getSession()).data.session.user.id
            }]);
        return { data, error };
    },

    // Get locations
    getByJobId: async (jobId) => {
        const { data, error } = await supabase
            .from('job_locations')
            .select('*')
            .eq('job_id', jobId)
            .order('recorded_at', { ascending: false });
        return { data, error };
    }
};

// Notifications functions
export const notifications = {
    // Get notifications
    getAll: async (userId) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    // Mark as read
    markAsRead: async (id) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        return { error };
    },

    // Subscribe to notifications
    subscribe: (userId, callback) => {
        return supabase
            .from(`notifications:user_id=eq.${userId}`)
            .on('INSERT', payload => {
                callback(payload.new);
            })
            .subscribe();
    }
};

export default supabase;
