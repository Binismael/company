-- ============================================
-- EL BETHEL ACADEMY PORTAL - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Authentication & Roles)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'bursar')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 2. CLASSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  form_level TEXT CHECK (form_level IN ('SS1', 'SS2', 'SS3', 'JSS1', 'JSS2', 'JSS3')),
  class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  capacity INT DEFAULT 40,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_classes_teacher ON classes(class_teacher_id);
CREATE UNIQUE INDEX idx_classes_name ON classes(name);

-- ============================================
-- 3. SUBJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 4. CLASS_SUBJECT JUNCTION (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

CREATE INDEX idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_subject ON class_subjects(subject_id);
CREATE INDEX idx_class_subjects_teacher ON class_subjects(teacher_id);

-- ============================================
-- 5. STUDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admission_number TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  date_of_birth DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated', 'Suspended')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_admission ON students(admission_number);

-- ============================================
-- 6. ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
  remarks TEXT,
  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, class_id, attendance_date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- ============================================
-- 7. RESULTS TABLE (Grades & Scores)
-- ============================================
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  term TEXT NOT NULL CHECK (term IN ('First Term', 'Second Term', 'Third Term')),
  session TEXT NOT NULL,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  grade TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, subject_id, class_id, term, session)
);

-- Function to auto-calculate grade
CREATE OR REPLACE FUNCTION calculate_grade(score NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF score >= 70 THEN RETURN 'A';
  ELSIF score >= 60 THEN RETURN 'B';
  ELSIF score >= 50 THEN RETURN 'C';
  ELSIF score >= 40 THEN RETURN 'D';
  ELSE RETURN 'F';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_subject ON results(subject_id);
CREATE INDEX idx_results_class ON results(class_id);
CREATE INDEX idx_results_session ON results(session);

-- ============================================
-- 8. ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- ============================================
-- 9. ASSIGNMENT_SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'Not Submitted' CHECK (status IN ('Not Submitted', 'Submitted', 'Graded')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);

-- ============================================
-- 10. ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  posted_by_role TEXT CHECK (posted_by_role IN ('admin', 'teacher')),
  target_roles TEXT[] DEFAULT ARRAY['student', 'teacher', 'parent'],
  published_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_announcements_author ON announcements(author_id);
CREATE INDEX idx_announcements_date ON announcements(published_at);

-- ============================================
-- 11. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('announcement', 'assignment', 'grade', 'attendance', 'message')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================
-- 12. MESSAGES TABLE (Internal Messaging)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_read ON messages(read);

-- ============================================
-- 13. FEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term TEXT NOT NULL CHECK (term IN ('First Term', 'Second Term', 'Third Term')),
  session TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  balance NUMERIC(10,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Paid', 'Overdue')),
  due_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, term, session)
);

CREATE INDEX idx_fees_student ON fees(student_id);
CREATE INDEX idx_fees_status ON fees(status);

-- ============================================
-- 14. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque', 'Card')),
  reference_number TEXT UNIQUE,
  payment_date DATE DEFAULT CURRENT_DATE,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- ============================================
-- 15. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 16. ROW LEVEL SECURITY POLICIES
-- ============================================

-- USERS TABLE POLICIES
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- STUDENTS TABLE POLICIES
CREATE POLICY "Students can view own profile" ON students
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can view their class students" ON students
FOR SELECT USING (
  class_id IN (SELECT id FROM classes WHERE class_teacher_id = auth.uid())
);

CREATE POLICY "Admins can view all students" ON students
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- RESULTS TABLE POLICIES
CREATE POLICY "Students can view own results" ON results
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers can view class results" ON results
FOR SELECT USING (
  class_id IN (SELECT id FROM classes WHERE class_teacher_id = auth.uid())
  OR teacher_id = auth.uid()
);

CREATE POLICY "Teachers can insert results for their subjects" ON results
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM class_subjects 
    WHERE subject_id = results.subject_id 
    AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all results" ON results
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ATTENDANCE TABLE POLICIES
CREATE POLICY "Students can view own attendance" ON attendance
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers can manage class attendance" ON attendance
FOR ALL USING (
  class_id IN (SELECT id FROM classes WHERE class_teacher_id = auth.uid())
);

CREATE POLICY "Admins can manage all attendance" ON attendance
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ASSIGNMENTS TABLE POLICIES
CREATE POLICY "Teachers can create assignments for their classes" ON assignments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM class_subjects 
    WHERE class_id = assignments.class_id 
    AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view assignments for their class" ON assignments
FOR SELECT USING (
  class_id IN (SELECT class_id FROM students WHERE user_id = auth.uid())
);

-- ANNOUNCEMENTS TABLE POLICIES
CREATE POLICY "Admins and teachers can create announcements" ON announcements
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

CREATE POLICY "Users can view announcements for their role" ON announcements
FOR SELECT USING (
  posted_by_role && ARRAY(
    SELECT role FROM users WHERE id = auth.uid()
  )
);

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

-- MESSAGES TABLE POLICIES
CREATE POLICY "Users can view own messages" ON messages
FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

-- FEES TABLE POLICIES
CREATE POLICY "Students can view own fees" ON fees
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Admins and bursars can manage fees" ON fees
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'bursar')
  )
);

-- PAYMENTS TABLE POLICIES
CREATE POLICY "Students can view own payments" ON payments
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Admins and bursars can manage payments" ON payments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'bursar')
  )
);

-- ============================================
-- 17. SAMPLE DATA (OPTIONAL)
-- ============================================

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, full_name, role, password_hash)
VALUES (
  'admin@elbethel.edu',
  'Admin User',
  'admin',
  '$2b$10$1234567890abcdef1234567890abcdef1234567890abcdef12345678'
) ON CONFLICT DO NOTHING;

-- Insert sample classes
INSERT INTO classes (name, form_level, capacity)
VALUES 
  ('SS3 A', 'SS3', 40),
  ('SS2 B', 'SS2', 38),
  ('JSS1 C', 'JSS1', 35)
ON CONFLICT DO NOTHING;

-- Insert sample subjects
INSERT INTO subjects (name, code)
VALUES 
  ('Mathematics', 'MATH101'),
  ('English Language', 'ENG101'),
  ('Physics', 'PHY101'),
  ('Chemistry', 'CHM101'),
  ('Biology', 'BIO101'),
  ('Literature in English', 'LIT101'),
  ('Government', 'GOV101'),
  ('Economics', 'ECN101')
ON CONFLICT DO NOTHING;
