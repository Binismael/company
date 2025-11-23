-- ============================================
-- EXTENDED FEATURES MIGRATION
-- Parents Management, Timetables, Documents, Enhanced Messaging
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PARENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  occupation TEXT,
  phone_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parents_user ON parents(user_id);

-- ============================================
-- PARENT_STUDENT RELATIONSHIP TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parent_student (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('Father', 'Mother', 'Guardian', 'Other')),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student(student_id);

-- ============================================
-- TIMETABLE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS timetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('First Term', 'Second Term', 'Third Term')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(class_id, session, term)
);

CREATE INDEX IF NOT EXISTS idx_timetables_class ON timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_timetables_session ON timetables(session);

-- ============================================
-- TIMETABLE_SCHEDULE TABLE (Weekly Grid)
-- ============================================
CREATE TABLE IF NOT EXISTS timetable_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),  -- 1=Monday to 5=Friday
  period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 10),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(timetable_id, day_of_week, period_number)
);

CREATE INDEX IF NOT EXISTS idx_timetable_schedules_timetable ON timetable_schedules(timetable_id);
CREATE INDEX IF NOT EXISTS idx_timetable_schedules_subject ON timetable_schedules(subject_id);
CREATE INDEX IF NOT EXISTS idx_timetable_schedules_teacher ON timetable_schedules(teacher_id);

-- ============================================
-- DOCUMENTS TABLE (Unified storage metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('profile_picture', 'student_document', 'assignment_submission', 'receipt')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_student ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_assignment ON documents(assignment_id);

-- ============================================
-- CHAT_ROOMS TABLE (For organizing conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  participant_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(participant_1_id, participant_2_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant1 ON chat_rooms(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant2 ON chat_rooms(participant_2_id);

-- ============================================
-- CHAT_MESSAGES TABLE (Enhanced Realtime Messaging)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON chat_messages(is_read);

-- ============================================
-- SCHOOL_FEES_TEMPLATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS school_fees_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('First Term', 'Second Term', 'Third Term')),
  session TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  applicable_classes TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(name, term, session)
);

CREATE INDEX IF NOT EXISTS idx_fees_template_term_session ON school_fees_template(term, session);
CREATE INDEX IF NOT EXISTS idx_fees_template_created_by ON school_fees_template(created_by);

-- ============================================
-- PROFILE_ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profile_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  profile_picture_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_attachments_user ON profile_attachments(user_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_fees_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- PARENTS TABLE POLICIES
CREATE POLICY "Parents can view their own profile" ON parents
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all parents" ON parents
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Parents can update their own profile" ON parents
FOR UPDATE USING (user_id = auth.uid());

-- PARENT_STUDENT POLICIES
CREATE POLICY "Parents can view their children" ON parent_student
FOR SELECT USING (
  parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid())
);

CREATE POLICY "Students can view their parents" ON parent_student
FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage parent_student relationships" ON parent_student
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- TIMETABLES POLICIES
CREATE POLICY "Authenticated users can view timetables" ON timetables
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage timetables" ON timetables
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- TIMETABLE_SCHEDULES POLICIES
CREATE POLICY "Authenticated users can view schedules" ON timetable_schedules
FOR SELECT USING (auth.role() = 'authenticated');

-- DOCUMENTS POLICIES
CREATE POLICY "Users can view their own documents" ON documents
FOR SELECT USING (user_id = auth.uid() OR uploaded_by = auth.uid());

CREATE POLICY "Students can view their documents" ON documents
FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all documents" ON documents
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can upload documents" ON documents
FOR INSERT WITH CHECK (user_id = auth.uid() OR uploaded_by = auth.uid());

-- CHAT_ROOMS POLICIES
CREATE POLICY "Users can view their chat rooms" ON chat_rooms
FOR SELECT USING (
  participant_1_id = auth.uid() OR participant_2_id = auth.uid()
);

CREATE POLICY "Users can create chat rooms" ON chat_rooms
FOR INSERT WITH CHECK (
  participant_1_id = auth.uid() OR participant_2_id = auth.uid()
);

-- CHAT_MESSAGES POLICIES
CREATE POLICY "Users can view messages in their rooms" ON chat_messages
FOR SELECT USING (
  chat_room_id IN (
    SELECT id FROM chat_rooms 
    WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages in their rooms" ON chat_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  chat_room_id IN (
    SELECT id FROM chat_rooms 
    WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  )
);

-- SCHOOL_FEES_TEMPLATE POLICIES
CREATE POLICY "Admins can manage fees templates" ON school_fees_template
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'bursar'))
);

CREATE POLICY "Authenticated users can view templates" ON school_fees_template
FOR SELECT USING (auth.role() = 'authenticated');

-- PROFILE_ATTACHMENTS POLICIES
CREATE POLICY "Users can view their profile" ON profile_attachments
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profile_attachments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can update their profile" ON profile_attachments
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their profile" ON profile_attachments
FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parents_timestamp
BEFORE UPDATE ON parents
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_timetables_timestamp
BEFORE UPDATE ON timetables
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_timetable_schedules_timestamp
BEFORE UPDATE ON timetable_schedules
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_documents_timestamp
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_chat_rooms_timestamp
BEFORE UPDATE ON chat_rooms
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_chat_messages_timestamp
BEFORE UPDATE ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_school_fees_template_timestamp
BEFORE UPDATE ON school_fees_template
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_profile_attachments_timestamp
BEFORE UPDATE ON profile_attachments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
