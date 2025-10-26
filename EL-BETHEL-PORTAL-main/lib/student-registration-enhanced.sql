-- ============================================
-- ENHANCED STUDENT REGISTRATION MIGRATION
-- Updates subjects table and students table with department/term support
-- Adds smart admission number generation
-- ============================================

-- ============================================
-- 1. UPDATE SUBJECTS TABLE
-- ============================================

-- Add new columns to subjects table if they don't exist
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS class_level TEXT CHECK (class_level IN ('JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3')),
ADD COLUMN IF NOT EXISTS department TEXT CHECK (department IN ('Science', 'Arts', 'Commercial')),
ADD COLUMN IF NOT EXISTS term TEXT CHECK (term IN ('1st Term', '2nd Term', '3rd Term'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_subjects_class_level ON public.subjects(class_level);
CREATE INDEX IF NOT EXISTS idx_subjects_department ON public.subjects(department);
CREATE INDEX IF NOT EXISTS idx_subjects_term ON public.subjects(term);
CREATE INDEX IF NOT EXISTS idx_subjects_combined ON public.subjects(class_level, department, term);

-- ============================================
-- 2. UPDATE STUDENTS TABLE
-- ============================================

-- Add new columns to students table if they don't exist
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS department TEXT CHECK (department IN ('Science', 'Arts', 'Commercial')),
ADD COLUMN IF NOT EXISTS term TEXT CHECK (term IN ('1st Term', '2nd Term', '3rd Term')),
ADD COLUMN IF NOT EXISTS passport_photo_url TEXT,
ADD COLUMN IF NOT EXISTS selected_subjects UUID[] DEFAULT '{}';

-- Create index for department and term
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students(department);
CREATE INDEX IF NOT EXISTS idx_students_term ON public.students(term);

-- ============================================
-- 3. POPULATE SUBJECTS TABLE WITH SAMPLE DATA
-- ============================================

-- Clear existing subjects (optional - comment out if you have existing data)
-- DELETE FROM public.subjects;

-- Insert all core subjects for JSS1-JSS3 and SSS1-SSS3 across all terms and departments
-- This creates subject sets for each class level, department, and term combination

-- JSS SUBJECTS (Available for all departments in JSS)
-- English Language
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'English Language', 'ENG-J1T1', 'JSS1', 'Science', '1st Term' 
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ENG-J1T1' AND class_level = 'JSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'English Language', 'ENG-J1T2', 'JSS1', 'Science', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ENG-J1T2' AND class_level = 'JSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'English Language', 'ENG-J1T3', 'JSS1', 'Science', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ENG-J1T3' AND class_level = 'JSS1' AND department = 'Science');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'English Language', 'ENG-J1T1', 'JSS1', 'Arts', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ENG-J1T1' AND class_level = 'JSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'English Language', 'ENG-J1T2', 'JSS1', 'Arts', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ENG-J1T2' AND class_level = 'JSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'English Language', 'ENG-J1T3', 'JSS1', 'Arts', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ENG-J1T3' AND class_level = 'JSS1' AND department = 'Arts');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'English Language', 'ENG-J1T1', 'JSS1', 'Commercial', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ENG-J1T1' AND class_level = 'JSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'English Language', 'ENG-J1T2', 'JSS1', 'Commercial', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ENG-J1T2' AND class_level = 'JSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'English Language', 'ENG-J1T3', 'JSS1', 'Commercial', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ENG-J1T3' AND class_level = 'JSS1' AND department = 'Commercial');

-- Mathematics (For all departments in JSS)
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Mathematics', 'MTH-J1T1', 'JSS1', 'Science', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MTH-J1T1' AND class_level = 'JSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Mathematics', 'MTH-J1T2', 'JSS1', 'Science', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MTH-J1T2' AND class_level = 'JSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Mathematics', 'MTH-J1T3', 'JSS1', 'Science', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MTH-J1T3' AND class_level = 'JSS1' AND department = 'Science');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Mathematics', 'MTH-J1T1', 'JSS1', 'Arts', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MTH-J1T1' AND class_level = 'JSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Mathematics', 'MTH-J1T2', 'JSS1', 'Arts', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MTH-J1T2' AND class_level = 'JSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Mathematics', 'MTH-J1T3', 'JSS1', 'Arts', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MTH-J1T3' AND class_level = 'JSS1' AND department = 'Arts');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Mathematics', 'MTH-J1T1', 'JSS1', 'Commercial', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MTH-J1T1' AND class_level = 'JSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Mathematics', 'MTH-J1T2', 'JSS1', 'Commercial', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MTH-J1T2' AND class_level = 'JSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Mathematics', 'MTH-J1T3', 'JSS1', 'Commercial', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MTH-J1T3' AND class_level = 'JSS1' AND department = 'Commercial');

-- Basic Science (For all JSS)
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Basic Science', 'BSC-J1T1', 'JSS1', 'Science', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BSC-J1T1' AND class_level = 'JSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Basic Science', 'BSC-J1T2', 'JSS1', 'Science', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BSC-J1T2' AND class_level = 'JSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Basic Science', 'BSC-J1T3', 'JSS1', 'Science', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BSC-J1T3' AND class_level = 'JSS1' AND department = 'Science');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Basic Science', 'BSC-J1T1', 'JSS1', 'Arts', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BSC-J1T1' AND class_level = 'JSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Basic Science', 'BSC-J1T2', 'JSS1', 'Arts', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BSC-J1T2' AND class_level = 'JSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Basic Science', 'BSC-J1T3', 'JSS1', 'Arts', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BSC-J1T3' AND class_level = 'JSS1' AND department = 'Arts');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Basic Science', 'BSC-J1T1', 'JSS1', 'Commercial', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BSC-J1T1' AND class_level = 'JSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Basic Science', 'BSC-J1T2', 'JSS1', 'Commercial', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BSC-J1T2' AND class_level = 'JSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Basic Science', 'BSC-J1T3', 'JSS1', 'Commercial', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BSC-J1T3' AND class_level = 'JSS1' AND department = 'Commercial');

-- Civic Education (For all JSS)
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Civic Education', 'CIV-J1T1', 'JSS1', 'Science', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CIV-J1T1' AND class_level = 'JSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Civic Education', 'CIV-J1T2', 'JSS1', 'Science', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CIV-J1T2' AND class_level = 'JSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Civic Education', 'CIV-J1T3', 'JSS1', 'Science', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CIV-J1T3' AND class_level = 'JSS1' AND department = 'Science');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Civic Education', 'CIV-J1T1', 'JSS1', 'Arts', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CIV-J1T1' AND class_level = 'JSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Civic Education', 'CIV-J1T2', 'JSS1', 'Arts', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CIV-J1T2' AND class_level = 'JSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Civic Education', 'CIV-J1T3', 'JSS1', 'Arts', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CIV-J1T3' AND class_level = 'JSS1' AND department = 'Arts');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Civic Education', 'CIV-J1T1', 'JSS1', 'Commercial', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CIV-J1T1' AND class_level = 'JSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Civic Education', 'CIV-J1T2', 'JSS1', 'Commercial', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CIV-J1T2' AND class_level = 'JSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Civic Education', 'CIV-J1T3', 'JSS1', 'Commercial', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CIV-J1T3' AND class_level = 'JSS1' AND department = 'Commercial');

-- SSS SUBJECTS (SCIENCE STUDENTS)
-- Physics, Chemistry, Biology for SSS
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Physics', 'PHY-S1T1', 'SSS1', 'Science', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'PHY-S1T1' AND class_level = 'SSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Physics', 'PHY-S1T2', 'SSS1', 'Science', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'PHY-S1T2' AND class_level = 'SSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Physics', 'PHY-S1T3', 'SSS1', 'Science', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'PHY-S1T3' AND class_level = 'SSS1' AND department = 'Science');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Chemistry', 'CHM-S1T1', 'SSS1', 'Science', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CHM-S1T1' AND class_level = 'SSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Chemistry', 'CHM-S1T2', 'SSS1', 'Science', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CHM-S1T2' AND class_level = 'SSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Chemistry', 'CHM-S1T3', 'SSS1', 'Science', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'CHM-S1T3' AND class_level = 'SSS1' AND department = 'Science');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Biology', 'BIO-S1T1', 'SSS1', 'Science', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BIO-S1T1' AND class_level = 'SSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Biology', 'BIO-S1T2', 'SSS1', 'Science', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BIO-S1T2' AND class_level = 'SSS1' AND department = 'Science');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Biology', 'BIO-S1T3', 'SSS1', 'Science', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BIO-S1T3' AND class_level = 'SSS1' AND department = 'Science');

-- SSS SUBJECTS (ARTS STUDENTS)
-- History, Government, Literature in English for Arts
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'History', 'HIS-S1T1', 'SSS1', 'Arts', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'HIS-S1T1' AND class_level = 'SSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'History', 'HIS-S1T2', 'SSS1', 'Arts', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'HIS-S1T2' AND class_level = 'SSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'History', 'HIS-S1T3', 'SSS1', 'Arts', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'HIS-S1T3' AND class_level = 'SSS1' AND department = 'Arts');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Government', 'GOV-S1T1', 'SSS1', 'Arts', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'GOV-S1T1' AND class_level = 'SSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Government', 'GOV-S1T2', 'SSS1', 'Arts', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'GOV-S1T2' AND class_level = 'SSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Government', 'GOV-S1T3', 'SSS1', 'Arts', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'GOV-S1T3' AND class_level = 'SSS1' AND department = 'Arts');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Literature in English', 'LIT-S1T1', 'SSS1', 'Arts', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'LIT-S1T1' AND class_level = 'SSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Literature in English', 'LIT-S1T2', 'SSS1', 'Arts', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'LIT-S1T2' AND class_level = 'SSS1' AND department = 'Arts');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Literature in English', 'LIT-S1T3', 'SSS1', 'Arts', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'LIT-S1T3' AND class_level = 'SSS1' AND department = 'Arts');

-- SSS SUBJECTS (COMMERCIAL STUDENTS)
-- Accounting, Economics, Commerce for Commercial
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Accounting', 'ACC-S1T1', 'SSS1', 'Commercial', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ACC-S1T1' AND class_level = 'SSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Accounting', 'ACC-S1T2', 'SSS1', 'Commercial', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ACC-S1T2' AND class_level = 'SSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Accounting', 'ACC-S1T3', 'SSS1', 'Commercial', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ACC-S1T3' AND class_level = 'SSS1' AND department = 'Commercial');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Economics', 'ECO-S1T1', 'SSS1', 'Commercial', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ECO-S1T1' AND class_level = 'SSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Economics', 'ECO-S1T2', 'SSS1', 'Commercial', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ECO-S1T2' AND class_level = 'SSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Economics', 'ECO-S1T3', 'SSS1', 'Commercial', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'ECO-S1T3' AND class_level = 'SSS1' AND department = 'Commercial');

INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Commerce', 'COM-S1T1', 'SSS1', 'Commercial', '1st Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'COM-S1T1' AND class_level = 'SSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Commerce', 'COM-S1T2', 'SSS1', 'Commercial', '2nd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'COM-S1T2' AND class_level = 'SSS1' AND department = 'Commercial');
INSERT INTO public.subjects (name, code, class_level, department, term)
SELECT 'Commerce', 'COM-S1T3', 'SSS1', 'Commercial', '3rd Term'
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code = 'COM-S1T3' AND class_level = 'SSS1' AND department = 'Commercial');

-- ============================================
-- 4. CREATE/UPDATE FUNCTION FOR AUTO-ADMISSION NUMBER
-- ============================================

CREATE OR REPLACE FUNCTION generate_smart_admission_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  class_code TEXT;
  dept_code TEXT;
  sequence_num INTEGER;
  new_admission_number TEXT;
BEGIN
  -- Skip if admission_number is already set
  IF NEW.admission_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get year (last 2 digits)
  year_suffix := TO_CHAR(NOW(), 'YY');

  -- Get class code from class_level (JSS1 -> J1, SSS2 -> S2)
  IF NEW.class_level IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN NEW.class_level LIKE 'JSS%' THEN 'J' || SUBSTRING(NEW.class_level, 4, 1)
        WHEN NEW.class_level LIKE 'SSS%' THEN 'S' || SUBSTRING(NEW.class_level, 4, 1)
        ELSE 'XX'
      END INTO class_code;
  ELSE
    class_code := 'XX';
  END IF;

  -- Get department code (Science -> S, Arts -> A, Commercial -> C)
  dept_code := CASE 
    WHEN NEW.department = 'Science' THEN 'S'
    WHEN NEW.department = 'Arts' THEN 'A'
    WHEN NEW.department = 'Commercial' THEN 'C'
    ELSE 'X'
  END;

  -- Build the base: ELBA/YY/CLASSDEPT (e.g., ELBA/25/J1S)
  -- Count existing with this pattern
  SELECT COUNT(*) INTO sequence_num FROM public.students 
  WHERE admission_number LIKE 'ELBA/' || year_suffix || '/' || class_code || dept_code || '/%';

  -- Generate the full admission number: ELBA/YY/J1S/001
  new_admission_number := 'ELBA/' || year_suffix || '/' || class_code || dept_code || '/' || LPAD((sequence_num + 1)::TEXT, 3, '0');

  NEW.admission_number := new_admission_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_smart_admission_number ON public.students;

-- Create new trigger
CREATE TRIGGER trigger_smart_admission_number
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION generate_smart_admission_number();

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Count subjects by class level and department
-- SELECT class_level, department, COUNT(*) as count 
-- FROM public.subjects 
-- GROUP BY class_level, department;

-- List all available subjects for a specific class and department
-- SELECT name, code, class_level, department, term 
-- FROM public.subjects 
-- WHERE class_level = 'JSS1' AND department = 'Science'
-- ORDER BY name, term;

-- Test the trigger
-- INSERT INTO public.students (user_id, class_level, department, gender, date_of_birth)
-- VALUES ('user-uuid-here', 'SSS1', 'Science', 'Male', '2006-01-15')
-- RETURNING admission_number;
