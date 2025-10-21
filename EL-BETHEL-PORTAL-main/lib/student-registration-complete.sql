-- ============================================
-- STUDENT REGISTRATION ENHANCEMENTS
-- ============================================

-- 1. Update STUDENTS table to include all registration fields and auto-admission number
ALTER TABLE students
ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS lga TEXT,
ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS birth_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS id_proof_url TEXT,
ADD COLUMN IF NOT EXISTS previous_school TEXT,
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Create or update the admission number generation function
CREATE OR REPLACE FUNCTION generate_admission_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admission_number IS NULL THEN
    NEW.admission_number := 'STD-' || 
      TO_CHAR(NOW(), 'YYMMDD') || '-' || 
      LPAD(
        (SELECT COUNT(*) + 1 FROM students WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 
        4, 
        '0'
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_generate_admission_number ON students;

-- 4. Create trigger for auto-generating admission numbers
CREATE TRIGGER auto_generate_admission_number
BEFORE INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION generate_admission_number();

-- 5. Create Supabase Storage bucket for student documents (execute in Supabase SQL editor)
-- Note: Storage buckets must be created via Supabase dashboard or Storage API
-- But we can create a tracking table for uploads

CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('photo', 'birth_certificate', 'id_proof')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_student_documents_student ON student_documents(student_id);
CREATE INDEX idx_student_documents_type ON student_documents(document_type);

-- 6. Create table for student registration approval workflow
CREATE TABLE IF NOT EXISTS student_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  comments TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id)
);

CREATE INDEX idx_approvals_student ON student_approvals(student_id);
CREATE INDEX idx_approvals_status ON student_approvals(status);

-- 7. Enable RLS on new tables
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_approvals ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for student_documents
CREATE POLICY "Students can view own documents" ON student_documents
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all documents" ON student_documents
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Students can insert own documents" ON student_documents
FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- 9. RLS Policies for student_approvals
CREATE POLICY "Students can view own approval status" ON student_approvals
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage approvals" ON student_approvals
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 10. Create view for pending registrations (for admin dashboard)
CREATE OR REPLACE VIEW pending_student_registrations AS
SELECT 
  s.id,
  s.admission_number,
  s.first_name,
  s.last_name,
  s.gender,
  s.date_of_birth,
  s.phone,
  s.address,
  s.state,
  s.lga,
  s.guardian_name,
  s.guardian_phone,
  s.guardian_email,
  u.email,
  s.created_at,
  sa.status as approval_status,
  sa.reviewed_at
FROM students s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN student_approvals sa ON s.id = sa.student_id
WHERE s.approved = false
ORDER BY s.created_at DESC;

-- 11. Create function to approve student and auto-generate admission number
CREATE OR REPLACE FUNCTION approve_student_registration(
  p_student_id UUID,
  p_admin_id UUID,
  p_comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update student as approved
  UPDATE students
  SET 
    approved = true,
    approval_date = NOW()
  WHERE id = p_student_id;

  -- Update or create approval record
  INSERT INTO student_approvals (student_id, status, reviewed_by, reviewed_at, comments)
  VALUES (p_student_id, 'approved', p_admin_id, NOW(), p_comments)
  ON CONFLICT (student_id) DO UPDATE
  SET 
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    comments = p_comments;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to reject student registration
CREATE OR REPLACE FUNCTION reject_student_registration(
  p_student_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update rejection reason
  UPDATE students
  SET rejection_reason = p_reason
  WHERE id = p_student_id;

  -- Update or create approval record
  INSERT INTO student_approvals (student_id, status, reviewed_by, reviewed_at, comments)
  VALUES (p_student_id, 'rejected', p_admin_id, NOW(), p_reason)
  ON CONFLICT (student_id) DO UPDATE
  SET 
    status = 'rejected',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    comments = p_reason;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION generate_admission_number TO authenticated;
GRANT EXECUTE ON FUNCTION approve_student_registration TO authenticated;
GRANT EXECUTE ON FUNCTION reject_student_registration TO authenticated;
