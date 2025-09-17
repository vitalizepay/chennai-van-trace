-- Assign the first admin user to "New school" 
UPDATE user_roles 
SET school_id = '364b1dd2-61fb-48f4-ac04-ba9f8d3da28c'
WHERE user_id = '34b39ebd-3ca0-4eee-9fd1-5bb11c027497' 
AND role = 'admin';

-- Log the assignment
INSERT INTO user_activity_logs (user_id, action, details)
VALUES (
  '34b39ebd-3ca0-4eee-9fd1-5bb11c027497',
  'school_assigned_by_migration',
  jsonb_build_object(
    'school_id', '364b1dd2-61fb-48f4-ac04-ba9f8d3da28c',
    'school_name', 'New school',
    'assigned_at', now(),
    'assigned_by', 'system_migration'
  )
);