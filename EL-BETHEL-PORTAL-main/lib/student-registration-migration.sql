-- ============================================
-- STUDENT REGISTRATION ENHANCEMENT MIGRATION
-- Adds missing fields and auto-admission number generation
-- ============================================

-- 1. Add missing columns to students table if they don't exist
ALTER TABLE students
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS lga TEXT,
ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
ADD COLUMN IF NOT EXISTS previous_school TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS birth_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS id_proof_url TEXT,
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- 2. Create sequence for admission numbers (per class)
CREATE SEQUENCE IF NOT EXISTS admission_number_seq START 1001;

-- 3. Create function to auto-generate admission number
CREATE OR REPLACE FUNCTION generate_admission_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  class_code TEXT;
  sequence_num INTEGER;
  new_admission_number TEXT;
BEGIN
  -- Skip if admission_number is already set
  IF NEW.admission_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get year (last 2 digits)
  year_suffix := TO_CHAR(NOW(), 'YY');

  -- Get class code (if class_id exists, fetch from classes table)
  IF NEW.class_id IS NOT NULL THEN
    SELECT form_level INTO class_code FROM classes WHERE id = NEW.class_id;
  ELSE
    class_code := 'STD'; -- Default for unassigned students
  END IF;

  -- Get next sequence number
  sequence_num := nextval('admission_number_seq');

  -- Generate admission number: STD-YY-CLASS-XXXX
  new_admission_number := 'STD-' || year_suffix || '-' || COALESCE(class_code, 'UNASSIGNED') || '-' || LPAD(sequence_num::TEXT, 4, '0');

  NEW.admission_number := new_admission_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-generate admission number on insert
DROP TRIGGER IF EXISTS trigger_auto_admission_number ON students;
CREATE TRIGGER trigger_auto_admission_number
BEFORE INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION generate_admission_number();

-- 5. Add index on approval status for admin queries
CREATE INDEX IF NOT EXISTS idx_students_approved ON students(approved);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- 6. Add update trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_students_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_students_timestamp ON students;
CREATE TRIGGER trigger_update_students_timestamp
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_students_timestamp();

-- ============================================
-- VERIFICATION QUERY
-- Run this to verify the migration was successful
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'students' ORDER BY ordinal_position;

-- ============================================
-- TEST INSERTION (Optional)
-- Uncomment to test auto-admission number generation
-- ============================================
-- INSERT INTO students (user_id, first_name, last_name, gender, date_of_birth, class_id)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'John', 'Doe', 'Male', '2010-01-15', NULL)
-- RETURNING admission_number;
