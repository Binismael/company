-- ============================================
-- EL BETHEL ACADEMY PORTAL - COMPLETE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Auth users with roles)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'bursar')),
  phone_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================
-- CLASSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  form_level TEXT NOT NULL CHECK (form_level IN ('SS1', 'SS2', 'SS3', 'JSS1', 'JSS2', 'JSS3')),
  class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  capacity INT DEFAULT 40,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(class_teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_form_level ON classes(form_level);

-- ============================================
-- SUBJECTS TABLE
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
-- TEACHERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  teacher_code TEXT UNIQUE NOT NULL,
  department TEXT,
  qualification TEXT,
  years_of_experience INT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_code ON teachers(teacher_code);

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  admission_number TEXT UNIQUE NOT NULL,
  reg_number TEXT UNIQUE NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- ============================================
-- CLASS_SUBJECTS (Many-to-Many)
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
-- ATTENDANCE TABLE
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
-- EXAMS TABLE
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
  total_questions INT,
  total_marks NUMERIC(10,2),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exams_class ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_scheduled ON exams(scheduled_at);

-- ============================================
-- EXAM_QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple-choice', 'short-answer', 'essay')),
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  option_e TEXT,
  correct_answer TEXT NOT NULL,
  marks NUMERIC(5,2) DEFAULT 1,
  question_number INT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);

-- ============================================
-- EXAM_ANSWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  student_answer TEXT,
  is_correct BOOLEAN,
  marks_awarded NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(exam_id, student_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_answers_exam ON exam_answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_student ON exam_answers(student_id);

-- ============================================
-- EXAM_ATTEMPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP,
  total_marks NUMERIC(10,2),
  percentage NUMERIC(5,2),
  grade TEXT,
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'submitted', 'graded')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);

-- ============================================
-- RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  term TEXT NOT NULL CHECK (term IN ('First Term', 'Second Term', 'Third Term')),
  session TEXT NOT NULL,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  grade TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_released BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, subject_id, class_id, term, session)
);

CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_subject ON results(subject_id);
CREATE INDEX IF NOT EXISTS idx_results_class ON results(class_id);
CREATE INDEX IF NOT EXISTS idx_results_session ON results(session);

-- ============================================
-- ASSIGNMENTS TABLE
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
-- ASSIGNMENT_SUBMISSIONS TABLE
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
-- ANNOUNCEMENTS TABLE
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
-- NOTIFICATIONS TABLE
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
-- MESSAGES TABLE
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
-- FEES TABLE
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
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque', 'Card', 'Paystack')),
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
-- SAMPLE DATA
-- ============================================

-- Sample Classes
INSERT INTO classes (name, form_level) VALUES
  ('SS3 A', 'SS3'),
  ('SS3 B', 'SS3'),
  ('SS2 A', 'SS2'),
  ('SS2 B', 'SS2'),
  ('SS1 A', 'SS1'),
  ('SS1 B', 'SS1'),
  ('JSS3 A', 'JSS3'),
  ('JSS2 A', 'JSS2'),
  ('JSS1 A', 'JSS1')
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
  ('Agricultural Science', 'AGS101'),
  ('Further Mathematics', 'FM101'),
  ('Visual Arts', 'ART101'),
  ('Physical Education', 'PE101'),
  ('Music', 'MUS101')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- USERS TABLE POLICIES
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- STUDENTS TABLE POLICIES
CREATE POLICY "Students can view their own profile" ON students
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
CREATE POLICY "Students can view their own results" ON results
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers can view their class results" ON results
FOR SELECT USING (
  class_id IN (SELECT id FROM classes WHERE class_teacher_id = auth.uid())
  OR teacher_id = auth.uid()
);

CREATE POLICY "Admins can manage all results" ON results
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ATTENDANCE TABLE POLICIES
CREATE POLICY "Students can view their own attendance" ON attendance
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

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

-- MESSAGES TABLE POLICIES
CREATE POLICY "Users can view their own messages" ON messages
FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

-- FEES TABLE POLICIES
CREATE POLICY "Students can view their own fees" ON fees
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
CREATE POLICY "Students can view their own payments" ON payments
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
-- VERIFICATION
-- ============================================
-- Run this query to verify all tables are created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;
