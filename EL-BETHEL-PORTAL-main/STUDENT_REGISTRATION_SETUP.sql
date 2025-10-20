-- ============================================
-- STUDENT REGISTRATION PORTAL - SUPABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Before running, ensure you have:
-- 1. Created auth users via signUp()
-- 2. Have a classes table (reference below)

-- ============================================
-- 1. ENSURE USERS TABLE EXISTS (Supabase Auth)
-- ============================================
-- Supabase automatically creates an 'auth.users' table
-- We create a public users table to extend it with custom fields

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text CHECK (role IN ('admin', 'teacher', 'student', 'parent')) DEFAULT 'student',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. CLASSES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  form_level text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. STUDENTS TABLE (Main Registration Table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  admission_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text CHECK (gender IN ('Male', 'Female', 'Other')),
  date_of_birth date,
  phone text,
  address text,
  state text,
  lga text,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  guardian_relationship text,
  photo_url text,
  birth_certificate_url text,
  id_proof_url text,
  previous_school text,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_students_approved ON public.students(approved);
CREATE INDEX idx_students_admission_number ON public.students(admission_number);
CREATE INDEX idx_students_created_at ON public.students(created_at);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Users can only view/update their own profile
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Students can view/update their own registration
CREATE POLICY "Students can view their own registration"
ON public.students FOR SELECT
USING (user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Students can insert their own registration"
ON public.students FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update their own registration if not approved"
ON public.students FOR UPDATE
USING (
  (user_id = auth.uid() AND approved = false) OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
ON public.students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update registrations
CREATE POLICY "Admins can approve registrations"
ON public.students FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 6. STORAGE BUCKET FOR UPLOADS
-- ============================================
-- Create this bucket in Supabase Storage:
-- Bucket name: student-documents
-- Public: false (or true if you want public access)

-- After creating the bucket, add this RLS policy in Storage:
-- Allow authenticated users to upload to their own folder:
-- (bucket_id = 'student-documents' and (auth.uid())::text = (storage.foldername(name))[1])

-- ============================================
-- 7. FUNCTION TO AUTO-GENERATE ADMISSION NUMBER
-- ============================================
CREATE OR REPLACE FUNCTION generate_admission_number()
RETURNS text AS $$
DECLARE
  year_part text;
  count_part text;
  admission_num text;
BEGIN
  year_part := to_char(now(), 'YYMMDD');
  count_part := lpad((SELECT count(*) + 1 FROM public.students)::text, 4, '0');
  admission_num := 'STD-' || year_part || '-' || count_part;
  RETURN admission_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. TRIGGER TO AUTO-FILL ADMISSION_NUMBER
-- ============================================
CREATE OR REPLACE FUNCTION auto_admission_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admission_number IS NULL THEN
    NEW.admission_number := generate_admission_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_admission_number
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION auto_admission_number();

-- ============================================
-- 9. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 10. SAMPLE DATA (OPTIONAL)
-- ============================================
-- Insert sample classes
INSERT INTO public.classes (id, name, form_level) VALUES
  (gen_random_uuid(), 'JSS 1A', 'JSS1'),
  (gen_random_uuid(), 'JSS 1B', 'JSS1'),
  (gen_random_uuid(), 'SSS 1A', 'SSS1'),
  (gen_random_uuid(), 'SSS 2A', 'SSS2'),
  (gen_random_uuid(), 'SSS 3A', 'SSS3')
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTES
-- ============================================
-- 1. Create a 'student-documents' bucket in Supabase Storage
-- 2. Ensure email verification is enabled in Auth settings
-- 3. Set up email templates for welcome/approval notifications
-- 4. The admission_number is auto-generated on insert
-- 5. RLS policies ensure data privacy and security
-- 6. Remember to create corresponding indexes for better query performance
