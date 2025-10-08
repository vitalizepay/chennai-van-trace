-- Add performance indexes for scalability with 1000+ users

-- Critical indexes for parent dashboard queries
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_students_van_id ON public.students(van_id) WHERE status = 'active';

-- Indexes for driver dashboard queries
CREATE INDEX IF NOT EXISTS idx_vans_driver_id ON public.vans(driver_id) WHERE status = 'active';

-- Indexes for admin dashboard and school filtering
CREATE INDEX IF NOT EXISTS idx_vans_school_id ON public.vans(school_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_school_id ON public.user_roles(school_id);

-- Composite index for student boarding status queries
CREATE INDEX IF NOT EXISTS idx_students_van_boarding ON public.students(van_id, boarded, dropped) WHERE status = 'active';

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_vans_location ON public.vans(current_lat, current_lng) WHERE status = 'active';

-- Index for user activity logs (for admin reporting)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON public.user_activity_logs(user_id, created_at DESC);

-- Analyze tables to update statistics for query planner
ANALYZE public.students;
ANALYZE public.vans;
ANALYZE public.user_roles;
ANALYZE public.profiles;