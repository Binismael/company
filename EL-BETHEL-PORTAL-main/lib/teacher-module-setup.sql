-- ============================================
-- EL BETHEL ACADEMY - TEACHER MODULE SETUP
-- ============================================
-- Run this migration in Supabase SQL Editor
-- Creates teacher-specific tables and RLS policies

-- ============================================
-- 1. TEACHERS TABLE (Profile Info)
-- ============================================
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  photo_url text,
  bio text,
  specialization text,
  qualification text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);

-- ============================================
-- 2. EXAMS TABLE (Teacher Creates)
-- ============================================
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES users(id) ON DELETE SET NULL,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes int DEFAULT 60,
  total_marks int DEFAULT 100,
  passing_marks int DEFAULT 40,
  results_released boolean DEFAULT false,
  download_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_exams_teacher ON exams(teacher_id);
CREATE INDEX idx_exams_class ON exams(class_id);
CREATE INDEX idx_exams_subject ON exams(subject_id);

-- ============================================
-- 3. EXAM QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'theory', 'fill_blank', 'true_false')),
  options jsonb, -- {"A":"Option A", "B":"Option B", "C":"Option C", "D":"Option D"}
  correct_answer text NOT NULL, -- e.g. "A" for multiple choice
  explanation text,
  marks int DEFAULT 1,
  order_index int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_exam_questions_exam ON exam_questions(exam_id);

-- ============================================
-- 4. EXAM ATTEMPTS TABLE (Student Takes Exam)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  start_time timestamptz,
  end_time timestamptz,
  submitted_at timestamptz,
  score numeric(5,2),
  raw_score numeric(5,2),
  submitted boolean DEFAULT false,
  graded boolean DEFAULT false,
  auto_graded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

CREATE INDEX idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_student ON exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_graded ON exam_attempts(graded);

-- ============================================
-- 5. EXAM ANSWERS TABLE (Student Answers Per Attempt)
-- ============================================
CREATE TABLE IF NOT EXISTS exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  selected_option text,
  answer_text text,
  is_correct boolean DEFAULT false,
  marks_awarded numeric(5,2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_exam_answers_attempt ON exam_answers(attempt_id);
CREATE INDEX idx_exam_answers_question ON exam_answers(question_id);

-- ============================================
-- 6. TEACHER RESULTS TABLE (Pending Admin Approval)
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  score numeric(5,2),
  remarks text,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_teacher_results_exam ON teacher_results(exam_id);
CREATE INDEX idx_teacher_results_attempt ON teacher_results(attempt_id);
CREATE INDEX idx_teacher_results_approved ON teacher_results(approved);

-- ============================================
-- 7. ENABLE RLS FOR TEACHER TABLES
-- ============================================
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- ===== TEACHERS TABLE POLICIES =====
CREATE POLICY "teachers_select_policy" ON teachers
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "teachers_insert_policy" ON teachers
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "teachers_update_policy" ON teachers
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ===== EXAMS TABLE POLICIES =====
CREATE POLICY "exams_select_policy" ON exams
  FOR SELECT USING (
    teacher_id = (SELECT id FROM users WHERE auth.uid() = id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    OR class_id IN (
      SELECT class_id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "exams_insert_policy" ON exams
  FOR INSERT WITH CHECK (
    teacher_id = (SELECT id FROM users WHERE auth.uid() = id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "exams_update_policy" ON exams
  FOR UPDATE USING (
    teacher_id = (SELECT id FROM users WHERE auth.uid() = id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "exams_delete_policy" ON exams
  FOR DELETE USING (
    teacher_id = (SELECT id FROM users WHERE auth.uid() = id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ===== EXAM QUESTIONS POLICIES =====
CREATE POLICY "exam_questions_teacher_view" ON exam_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_questions.exam_id AND e.teacher_id = (SELECT id FROM users WHERE auth.uid() = id))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "exam_questions_teacher_manage" ON exam_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_questions.exam_id AND e.teacher_id = (SELECT id FROM users WHERE auth.uid() = id))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Students can only see questions during/after exam is released
CREATE POLICY "exam_questions_student_view" ON exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_questions.exam_id
      AND e.results_released = true
      AND e.class_id IN (SELECT class_id FROM students WHERE user_id = auth.uid())
    )
  );

-- ===== EXAM ATTEMPTS POLICIES =====
CREATE POLICY "exam_attempts_student_insert" ON exam_attempts
  FOR INSERT WITH CHECK (
    student_id = (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "exam_attempts_student_select" ON exam_attempts
  FOR SELECT USING (
    student_id = (SELECT id FROM students WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_attempts.exam_id
      AND e.teacher_id = (SELECT id FROM users WHERE auth.uid() = id)
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "exam_attempts_teacher_update" ON exam_attempts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = exam_attempts.exam_id
      AND e.teacher_id = (SELECT id FROM users WHERE auth.uid() = id)
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ===== EXAM ANSWERS POLICIES =====
CREATE POLICY "exam_answers_student_insert" ON exam_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      WHERE ea.id = exam_answers.attempt_id
      AND ea.student_id = (SELECT id FROM students WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "exam_answers_student_select" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      WHERE ea.id = exam_answers.attempt_id
      AND ea.student_id = (SELECT id FROM students WHERE user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.id = exam_answers.attempt_id
      AND e.teacher_id = (SELECT id FROM users WHERE auth.uid() = id)
    )
  );

-- ===== TEACHER RESULTS POLICIES =====
CREATE POLICY "teacher_results_teacher_manage" ON teacher_results
  FOR ALL USING (
    teacher_id = (SELECT id FROM users WHERE auth.uid() = id)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "teacher_results_student_view" ON teacher_results
  FOR SELECT USING (
    student_id = (SELECT id FROM students WHERE user_id = auth.uid())
    AND approved = true
  );

-- ============================================
-- 9. AUTO GRADING FUNCTION (Optional)
-- ============================================
CREATE OR REPLACE FUNCTION grade_exam_attempt(attempt_id uuid)
RETURNS void AS $$
DECLARE
  total_marks int;
  earned_marks numeric;
BEGIN
  -- Calculate marks for all answers
  UPDATE exam_answers
  SET marks_awarded = CASE
    WHEN is_correct THEN (SELECT marks FROM exam_questions WHERE id = exam_answers.question_id)
    ELSE 0
  END
  WHERE attempt_id = $1 AND is_correct IS NOT NULL;

  -- Sum up total marks
  SELECT SUM(COALESCE(marks_awarded, 0)) INTO earned_marks
  FROM exam_answers
  WHERE attempt_id = $1;

  -- Update exam_attempts with score
  UPDATE exam_attempts
  SET score = COALESCE(earned_marks, 0),
      raw_score = COALESCE(earned_marks, 0),
      auto_graded = true,
      graded = true
  WHERE id = $1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. TRIGGER FOR AUTO-GRADING ON SUBMISSION
-- ============================================
CREATE OR REPLACE FUNCTION auto_grade_on_submit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.submitted = true AND OLD.submitted = false THEN
    PERFORM grade_exam_attempt(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_attempt_auto_grade
AFTER UPDATE ON exam_attempts
FOR EACH ROW
WHEN (NEW.submitted = true AND OLD.submitted = false)
EXECUTE FUNCTION auto_grade_on_submit();

-- ============================================
-- Done! Teacher Module is Ready
-- ============================================
