-- ============================================
-- 1. ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);

-- ============================================
-- 2. SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('technical', 'payment', 'academic', 'other')),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);

-- ============================================
-- 3. FAQs TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  order_index INT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_active ON faqs(is_active);

-- ============================================
-- 4. ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO roles (id, name, description, is_system) VALUES
  (gen_random_uuid(), 'admin', 'Full system access', TRUE),
  (gen_random_uuid(), 'teacher', 'Teacher access', TRUE),
  (gen_random_uuid(), 'student', 'Student access', TRUE),
  (gen_random_uuid(), 'parent', 'Parent access', TRUE),
  (gen_random_uuid(), 'bursar', 'Bursar/Finance access', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO permissions (name, description, category) VALUES
  ('view_dashboard', 'Access main dashboard', 'dashboard'),
  ('manage_users', 'Create, edit, delete users', 'user_management'),
  ('manage_classes', 'Create and manage classes', 'class_management'),
  ('manage_subjects', 'Create and manage subjects', 'class_management'),
  ('manage_exams', 'Create and manage exams', 'exam_management'),
  ('mark_attendance', 'Record student attendance', 'attendance'),
  ('view_attendance', 'View attendance records', 'attendance'),
  ('submit_results', 'Submit student results', 'results'),
  ('manage_fees', 'Manage fee structures', 'fees'),
  ('process_payments', 'Process fee payments', 'fees'),
  ('view_reports', 'Access analytics and reports', 'reports'),
  ('manage_permissions', 'Manage roles and permissions', 'system'),
  ('manage_support_tickets', 'Manage support tickets', 'support'),
  ('create_support_ticket', 'Create support tickets', 'support'),
  ('manage_faqs', 'Manage FAQs', 'faqs'),
  ('send_notifications', 'Send notifications to users', 'notifications'),
  ('view_notifications', 'View notifications', 'notifications'),
  ('manage_assignments', 'Create and manage assignments', 'academic'),
  ('view_student_profile', 'View student profiles', 'student_management'),
  ('upload_materials', 'Upload educational materials', 'academic')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. ROLE_PERMISSIONS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Create index for fast lookups
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- ============================================
-- 7. USER_ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ============================================
-- 8. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'system', 'sms')),
  status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  action_url VARCHAR(500),
  related_entity_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);

-- ============================================
-- GRANT PERMISSIONS (if using RLS)
-- ============================================
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy for attendance: Teachers can view/insert their class attendance, admins see all
CREATE POLICY "Teachers view own class attendance" ON attendance
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM teachers WHERE id = (
        SELECT class_teacher_id FROM classes WHERE id = attendance.class_id
      )
    )
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policy for support_tickets: Users see own, admins see all
CREATE POLICY "Users view own tickets" ON support_tickets
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policy for FAQs: Everyone can view active FAQs, admins see all
CREATE POLICY "Public view active FAQs" ON faqs
  FOR SELECT
  USING (
    is_active = TRUE
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policy for notifications: Users see own, admins see all
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

COMMIT;
