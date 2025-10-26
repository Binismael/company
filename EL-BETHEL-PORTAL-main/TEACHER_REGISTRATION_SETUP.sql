-- ============================================
-- Teacher Registration System Setup SQL
-- ============================================
-- Run this in Supabase SQL Editor to ensure all required tables and columns exist
-- This is safe to run even if tables already exist (uses IF NOT EXISTS)

-- 1. Ensure users table has all required columns
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 2. Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  form_level TEXT,
  class_teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  capacity INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create class_subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, subject_id)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_form_level ON public.classes(form_level);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(class_teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(code);
CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject ON public.class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher ON public.class_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 6. Verify data with these queries
-- Run these to check if your setup is complete:

-- Check classes
-- SELECT COUNT(*) as class_count FROM public.classes;

-- Check subjects
-- SELECT COUNT(*) as subject_count FROM public.subjects;

-- Check class_subjects combinations
-- SELECT COUNT(*) as combinations FROM public.class_subjects;

-- Check teachers
-- SELECT COUNT(*) as teacher_count FROM public.users WHERE role = 'teacher';

-- ============================================
-- Sample Data Insertion (Optional)
-- ============================================
-- Uncomment and run if you want to populate with sample data

/*
-- Insert sample classes
INSERT INTO public.classes (name, form_level)
SELECT 'JSS1 A', 'JSS1' WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name='JSS1 A');
INSERT INTO public.classes (name, form_level)
SELECT 'JSS1 B', 'JSS1' WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name='JSS1 B');
INSERT INTO public.classes (name, form_level)
SELECT 'JSS2 A', 'JSS2' WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name='JSS2 A');
INSERT INTO public.classes (name, form_level)
SELECT 'JSS2 B', 'JSS2' WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name='JSS2 B');
INSERT INTO public.classes (name, form_level)
SELECT 'JSS3 A', 'JSS3' WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name='JSS3 A');
INSERT INTO public.classes (name, form_level)
SELECT 'SS1 A', 'SS1' WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name='SS1 A');
INSERT INTO public.classes (name, form_level)
SELECT 'SS1 B', 'SS1' WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name='SS1 B');
INSERT INTO public.classes (name, form_level)
SELECT 'SS2 A', 'SS2' WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name='SS2 A');
INSERT INTO public.classes (name, form_level)
SELECT 'SS3 A', 'SS3' WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE name='SS3 A');

-- Insert sample subjects
INSERT INTO public.subjects (name, code)
SELECT 'Mathematics', 'MATH' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='MATH');
INSERT INTO public.subjects (name, code)
SELECT 'English Language', 'ENG' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='ENG');
INSERT INTO public.subjects (name, code)
SELECT 'Physics', 'PHY' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='PHY');
INSERT INTO public.subjects (name, code)
SELECT 'Chemistry', 'CHEM' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='CHEM');
INSERT INTO public.subjects (name, code)
SELECT 'Biology', 'BIO' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='BIO');
INSERT INTO public.subjects (name, code)
SELECT 'History', 'HIST' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='HIST');
INSERT INTO public.subjects (name, code)
SELECT 'Geography', 'GEO' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='GEO');
INSERT INTO public.subjects (name, code)
SELECT 'Government', 'GOV' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='GOV');
INSERT INTO public.subjects (name, code)
SELECT 'Economics', 'ECON' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='ECON');
INSERT INTO public.subjects (name, code)
SELECT 'Basic Science', 'SCI' WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE code='SCI');

-- Create some class-subject combinations
-- For JSS1 A, add all subjects
INSERT INTO public.class_subjects (class_id, subject_id)
SELECT c.id, s.id FROM public.classes c, public.subjects s
WHERE c.name = 'JSS1 A'
ON CONFLICT DO NOTHING;

-- For SS1 A, add all subjects
INSERT INTO public.class_subjects (class_id, subject_id)
SELECT c.id, s.id FROM public.classes c, public.subjects s
WHERE c.name = 'SS1 A'
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- Verification Queries
-- ============================================
-- Use these to check if everything is set up correctly

-- Count of classes by form level
SELECT form_level, COUNT(*) as count FROM public.classes GROUP BY form_level;

-- Count of subjects
SELECT COUNT(*) as total_subjects FROM public.subjects;

-- Count of class-subject combinations without teachers
SELECT COUNT(*) as unassigned FROM public.class_subjects WHERE teacher_id IS NULL;

-- List all registered teachers
SELECT 
  id,
  email,
  full_name,
  role,
  phone_number,
  metadata
FROM public.users
WHERE role = 'teacher'
ORDER BY created_at DESC;

-- Teachers with their assigned classes and subjects
SELECT 
  u.full_name as teacher_name,
  c.name as class_name,
  s.name as subject_name
FROM public.users u
JOIN public.class_subjects cs ON u.id = cs.teacher_id
JOIN public.classes c ON cs.class_id = c.id
JOIN public.subjects s ON cs.subject_id = s.id
WHERE u.role = 'teacher'
ORDER BY u.full_name, c.name, s.name;
