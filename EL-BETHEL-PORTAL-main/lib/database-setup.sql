-- ============================================
-- EL BETHEL ACADEMY PORTAL - COMPLETE DATABASE SETUP
-- All 15 Tables with Sample Data
-- ============================================

-- This script creates all 15 required tables and populates sample data
-- Execute this in Supabase SQL Editor to ensure full setup

-- ============================================
-- TABLE 1: USERS (Authentication & Roles)
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- TABLE 2: CLASSES
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  form_level TEXT CHECK (form_level IN ('SS1', 'SS2', 'SS3', 'JSS1', 'JSS2', 'JSS3')),
  class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  capacity INT DEFAULT 40,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(class_teacher_id);

-- ============================================
-- TABLE 3: SUBJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);

-- ============================================
-- TABLE 4: CLASS_SUBJECTS (Many-to-Many Junction)
-- ============================================
CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject ON class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher ON class_subjects(teacher_id);

-- ============================================
-- TABLE 5: STUDENTS
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admission_number TEXT UNIQUE NOT NULL,
  reg_number TEXT UNIQUE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  date_of_birth DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  admission_year INT DEFAULT 2025,
  session_admitted TEXT DEFAULT '2024/2025',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated', 'Suspended')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_reg_number ON students(reg_number);

-- ============================================
-- TABLE 6: ATTENDANCE
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

CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- ============================================
-- TABLE 7: RESULTS (Grades & Scores)
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

CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_subject ON results(subject_id);
CREATE INDEX IF NOT EXISTS idx_results_class ON results(class_id);
CREATE INDEX IF NOT EXISTS idx_results_session ON results(session);

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

-- ============================================
-- TABLE 8: ASSIGNMENTS
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

CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

-- ============================================
-- TABLE 9: ASSIGNMENT_SUBMISSIONS
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

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);

-- ============================================
-- TABLE 10: ANNOUNCEMENTS
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

CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(published_at);

-- ============================================
-- TABLE 11: NOTIFICATIONS
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

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================
-- TABLE 12: MESSAGES (Internal Messaging)
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

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- ============================================
-- TABLE 13: FEES
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

CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);

-- ============================================
-- TABLE 14: PAYMENTS
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

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ============================================
-- TABLE 15: EXAMS
-- ============================================
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 60,
  exam_type TEXT CHECK (exam_type IN ('CBT', 'Written', 'Practical', 'Oral')) DEFAULT 'Written',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exams_class ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_scheduled ON exams(scheduled_at);

-- ============================================
-- SAMPLE DATA - Insert for testing
-- ============================================

-- Clear existing data (optional - commented out for safety)
-- TRUNCATE TABLE users CASCADE;

-- Sample Users
INSERT INTO users (email, full_name, role, password_hash) VALUES
('admin@elbethel.edu', 'Admin User', 'admin', 'hashed_password_admin'),
('teacher1@elbethel.edu', 'Mr. Johnson', 'teacher', 'hashed_password_teacher1'),
('teacher2@elbethel.edu', 'Mrs. Smith', 'teacher', 'hashed_password_teacher2'),
('parent1@elbethel.edu', 'Mr. Akin', 'parent', 'hashed_password_parent1'),
('bursar@elbethel.edu', 'Bursar Officer', 'bursar', 'hashed_password_bursar')
ON CONFLICT (email) DO NOTHING;

-- Get IDs for sample data
-- Sample Classes
INSERT INTO classes (name, form_level) VALUES
('SS3 A', 'SS3'),
('SS3 B', 'SS3'),
('SS2 A', 'SS2'),
('SS1 A', 'SS1'),
('JSS3 A', 'JSS3'),
('JSS2 A', 'JSS2')
ON CONFLICT DO NOTHING;

-- Sample Subjects
INSERT INTO subjects (name, code) VALUES
('Mathematics', 'MATH101'),
('English Language', 'ENG101'),
('Physics', 'PHY101'),
('Chemistry', 'CHM101'),
('Biology', 'BIO101'),
('Literature in English', 'LIT101'),
('Government', 'GOV101'),
('Economics', 'ECN101'),
('Computer Science', 'CS101'),
('History', 'HIS101'),
('Geography', 'GEO101'),
('Agricultural Science', 'AGS101')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- Enable Row Level Security (RLS)
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
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERY - Run this to verify all tables exist
-- ============================================

-- Use this query to check all 15 tables:
/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

Expected 15 tables:
1. announcements
2. assignment_submissions
3. assignments
4. attendance
5. class_subjects
6. classes
7. exams
8. fees
9. messages
10. notifications
11. payments
12. results
13. students
14. subjects
15. users
*/
