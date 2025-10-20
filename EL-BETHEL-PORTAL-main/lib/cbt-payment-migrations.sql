-- ============================================
-- CBT EXAM SYSTEM & PAYMENT SYSTEM TABLES
-- ============================================

-- ============================================
-- TABLE 1: EXAM_SESSIONS (Main exam information)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  term TEXT NOT NULL DEFAULT 'First Term',
  session TEXT NOT NULL DEFAULT '2024/2025',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  total_marks INT NOT NULL DEFAULT 100,
  passing_mark INT DEFAULT 40,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  show_results BOOLEAN DEFAULT FALSE,
  allow_result_download BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(title, class_id, subject_id, term, session)
);

CREATE INDEX idx_exam_sessions_class ON exam_sessions(class_id);
CREATE INDEX idx_exam_sessions_subject ON exam_sessions(subject_id);
CREATE INDEX idx_exam_sessions_teacher ON exam_sessions(teacher_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_exam_sessions_dates ON exam_sessions(start_time, end_time);

-- ============================================
-- TABLE 2: EXAM_QUESTIONS (Questions with options and correct answer)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'short_answer', 'true_false')),
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT NOT NULL,
  marks INT NOT NULL DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(exam_session_id, question_number)
);

CREATE INDEX idx_exam_questions_exam ON exam_questions(exam_session_id);

-- ============================================
-- TABLE 3: EXAM_ATTEMPTS (Student exam participation record)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP,
  total_score NUMERIC(5,2),
  total_marks INT,
  percentage NUMERIC(5,2),
  grade TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'flagged')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(exam_session_id, student_id)
);

CREATE INDEX idx_exam_attempts_exam ON exam_attempts(exam_session_id);
CREATE INDEX idx_exam_attempts_student ON exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_status ON exam_attempts(status);

-- ============================================
-- TABLE 4: STUDENT_ANSWERS (Student responses to each question)
-- ============================================
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN,
  marks_obtained NUMERIC(5,2),
  time_spent_seconds INT,
  answered_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(exam_attempt_id, question_id)
);

CREATE INDEX idx_student_answers_attempt ON student_answers(exam_attempt_id);
CREATE INDEX idx_student_answers_question ON student_answers(question_id);

-- ============================================
-- TABLE 5: EXAM_RESULTS (Final results visible to students)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  total_score NUMERIC(5,2) NOT NULL,
  total_marks INT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  grade TEXT,
  passed BOOLEAN DEFAULT FALSE,
  visible_to_student BOOLEAN DEFAULT FALSE,
  can_download_pdf BOOLEAN DEFAULT FALSE,
  released_by UUID REFERENCES users(id) ON DELETE SET NULL,
  released_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(exam_session_id, student_id)
);

CREATE INDEX idx_exam_results_exam ON exam_results(exam_session_id);
CREATE INDEX idx_exam_results_student ON exam_results(student_id);
CREATE INDEX idx_exam_results_visible ON exam_results(visible_to_student);

-- ============================================
-- TABLE 6: PAYMENT_RECORDS (School fee payments)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term TEXT NOT NULL DEFAULT 'First Term',
  session TEXT NOT NULL DEFAULT '2024/2025',
  amount_due NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  balance NUMERIC(10,2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
  payment_method TEXT CHECK (payment_method IN ('online', 'bank_transfer', 'cash', 'cheque', 'proof_upload')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'verified', 'failed')),
  paystack_reference TEXT,
  receipt_url TEXT,
  proof_uploaded_at TIMESTAMP,
  payment_completed_at TIMESTAMP,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, term, session)
);

CREATE INDEX idx_payment_records_student ON payment_records(student_id);
CREATE INDEX idx_payment_records_status ON payment_records(payment_status);
CREATE INDEX idx_payment_records_term ON payment_records(term, session);
CREATE INDEX idx_payment_records_reference ON payment_records(paystack_reference);

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR CBT TABLES
-- ============================================

-- EXAM_SESSIONS: Teachers can create/edit their own, students/admins can view
CREATE POLICY "Teachers can create exam sessions" ON exam_sessions
FOR INSERT WITH CHECK (
  teacher_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view active exam sessions" ON exam_sessions
FOR SELECT USING (
  status IN ('active', 'completed') OR
  teacher_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
  class_id IN (SELECT class_id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers and admins can update exam sessions" ON exam_sessions
FOR UPDATE USING (
  teacher_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- EXAM_QUESTIONS: Only visible to teacher and admin
CREATE POLICY "Questions visible to exam creator and admin" ON exam_questions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_sessions 
    WHERE id = exam_session_id AND (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  )
);

-- EXAM_ATTEMPTS: Students see own, teachers see their class's
CREATE POLICY "Students can view own exam attempts" ON exam_attempts
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers can view class exam attempts" ON exam_attempts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_sessions es
    JOIN classes c ON es.class_id = c.id
    WHERE es.id = exam_session_id AND c.class_teacher_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE id = exam_session_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all exam attempts" ON exam_attempts
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- STUDENT_ANSWERS: Students see own, teacher/admin see theirs
CREATE POLICY "Students can view own answers" ON student_answers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_attempts ea
    WHERE ea.id = exam_attempt_id AND ea.student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Teachers can view class student answers" ON student_answers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_attempts ea
    JOIN exam_sessions es ON ea.exam_session_id = es.id
    WHERE ea.exam_attempt_id = exam_attempt_id AND es.teacher_id = auth.uid()
  )
);

-- EXAM_RESULTS: Visible based on release settings
CREATE POLICY "Students see own results if released" ON exam_results
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) AND visible_to_student = TRUE
);

CREATE POLICY "Teachers see class results" ON exam_results
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE id = exam_session_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all results" ON exam_results
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- RLS POLICIES FOR PAYMENT TABLES
-- ============================================

-- PAYMENT_RECORDS: Students see own, admins/bursars see all
CREATE POLICY "Students see own payment records" ON payment_records
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Admins and bursars manage payment records" ON payment_records
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'bursar'))
);

-- ============================================
-- HELPER FUNCTION: Auto-grade exam based on answers
-- ============================================

CREATE OR REPLACE FUNCTION calculate_exam_grade(score NUMERIC, total NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF total = 0 THEN RETURN 'F'; END IF;
  
  DECLARE
    percentage NUMERIC := (score / total) * 100;
  BEGIN
    IF percentage >= 70 THEN RETURN 'A';
    ELSIF percentage >= 60 THEN RETURN 'B';
    ELSIF percentage >= 50 THEN RETURN 'C';
    ELSIF percentage >= 40 THEN RETURN 'D';
    ELSE RETURN 'F';
    END IF;
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-calculate score when answer is submitted
-- ============================================

CREATE OR REPLACE FUNCTION update_attempt_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE exam_attempts
  SET total_score = (
    SELECT COALESCE(SUM(marks_obtained), 0)
    FROM student_answers
    WHERE exam_attempt_id = NEW.exam_attempt_id
  ),
  total_marks = (
    SELECT COALESCE(SUM(marks), 0)
    FROM exam_questions eq
    WHERE eq.exam_session_id = (
      SELECT exam_session_id FROM exam_attempts WHERE id = NEW.exam_attempt_id
    )
  ),
  updated_at = now()
  WHERE id = NEW.exam_attempt_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attempt_score
AFTER INSERT OR UPDATE ON student_answers
FOR EACH ROW
EXECUTE FUNCTION update_attempt_score();

-- ============================================
-- VERIFICATION QUERY
-- ============================================

/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('exam_sessions', 'exam_questions', 'exam_attempts', 'student_answers', 'exam_results', 'payment_records')
ORDER BY table_name;

Expected 6 tables:
1. exam_attempts
2. exam_questions
3. exam_results
4. exam_sessions
5. payment_records
6. student_answers
*/
