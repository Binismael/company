-- ============================================
-- MIGRATION: Add EXAMS table (15th table)
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

CREATE INDEX idx_exams_class ON exams(class_id);
CREATE INDEX idx_exams_subject ON exams(subject_id);
CREATE INDEX idx_exams_scheduled ON exams(scheduled_at);
CREATE INDEX idx_exams_created_by ON exams(created_by);

-- ============================================
-- MIGRATION: Add student registration number system
-- ============================================

-- Add reg_number column to students table if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS reg_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS admission_year INT DEFAULT 2025,
ADD COLUMN IF NOT EXISTS session_admitted TEXT DEFAULT '2024/2025';

CREATE INDEX IF NOT EXISTS idx_students_reg_number ON students(reg_number);

-- ============================================
-- MIGRATION: Add exams RLS policies
-- ============================================

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their class exams" ON exams
FOR SELECT USING (
  class_id IN (SELECT class_id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers can view their subject exams" ON exams
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM class_subjects 
    WHERE subject_id = exams.subject_id 
    AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all exams" ON exams
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- MIGRATION: Create view for easier data access
-- ============================================

CREATE OR REPLACE VIEW submissions AS
SELECT 
  assignment_submissions.id,
  assignment_submissions.assignment_id,
  assignment_submissions.student_id,
  assignment_submissions.submitted_at,
  assignment_submissions.score,
  assignment_submissions.feedback,
  assignment_submissions.file_url,
  assignment_submissions.status,
  assignment_submissions.created_at,
  assignment_submissions.updated_at
FROM assignment_submissions;

-- ============================================
-- MIGRATION: Add helper functions
-- ============================================

-- Function to generate student registration number
CREATE OR REPLACE FUNCTION generate_student_reg_number(
  p_school_code TEXT,
  p_year INT,
  p_class_code TEXT,
  p_sequence INT
)
RETURNS TEXT AS $$
DECLARE
  formatted_sequence TEXT;
BEGIN
  formatted_sequence := LPAD(p_sequence::TEXT, 3, '0');
  RETURN p_school_code || '/' || p_year || '/' || p_class_code || '/' || formatted_sequence;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign registration numbers to new students
CREATE OR REPLACE FUNCTION auto_assign_reg_number()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
  v_class_code TEXT;
  v_year INT;
BEGIN
  IF NEW.reg_number IS NULL THEN
    -- Get the class code from the class_id
    SELECT form_level INTO v_class_code FROM classes WHERE id = NEW.class_id;
    
    -- Get year (current year - 2000 if >2000, else just year)
    v_year := EXTRACT(YEAR FROM CURRENT_DATE) - 2000;
    
    -- Count existing students in this class to get sequence
    SELECT COUNT(*) + 1 INTO v_count FROM students 
    WHERE class_id = NEW.class_id AND reg_number IS NOT NULL;
    
    -- Generate reg number: ELBA/25/SS3B/001
    NEW.reg_number := generate_student_reg_number('ELBA', v_year::INT, v_class_code, v_count);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_reg_number ON students;
CREATE TRIGGER trigger_auto_assign_reg_number
BEFORE INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION auto_assign_reg_number();

-- ============================================
-- MIGRATION: Add audit columns to key tables
-- ============================================

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE results ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- MIGRATION: Sample data for testing
-- ============================================

-- Insert additional subjects if not already present
INSERT INTO subjects (name, code) VALUES
  ('Computer Science', 'CS101'),
  ('History', 'HIS101'),
  ('Geography', 'GEO101'),
  ('Agricultural Science', 'AGS101')
ON CONFLICT DO NOTHING;

-- Sample exams
INSERT INTO exams (title, description, class_id, subject_id, scheduled_at, duration_minutes, exam_type) 
SELECT 
  'Mathematics First Term Test',
  'First term assessment for mathematics',
  c.id,
  s.id,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  60,
  'Written'
FROM classes c, subjects s
WHERE c.name = 'SS3 A' AND s.code = 'MATH101'
ON CONFLICT DO NOTHING;

-- Sample exams for other classes
INSERT INTO exams (title, class_id, scheduled_at, duration_minutes, exam_type)
SELECT 
  'General First Term Exam - ' || c.name,
  c.id,
  CURRENT_TIMESTAMP + INTERVAL '14 days',
  120,
  'Written'
FROM classes c
ON CONFLICT DO NOTHING;
