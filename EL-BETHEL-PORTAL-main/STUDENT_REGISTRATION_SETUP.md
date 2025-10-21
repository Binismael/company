# Student Registration System - Quick Setup Checklist

## ✅ Prerequisites

- [ ] Supabase project created and configured
- [ ] Environment variables set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Node.js 18+ installed
- [ ] npm/yarn/pnpm package manager

---

## 🗄️ Database Setup

### Phase 1: Create Tables and Functions

**Step 1: Run SQL Migration**
```bash
# Option A: Via Supabase Dashboard
1. Go to SQL Editor
2. Copy contents of lib/student-registration-complete.sql
3. Execute the SQL
```

**Step 2: Verify Migration Success**
```sql
-- Check if students table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students';

-- Should see: first_name, last_name, phone, address, state, lga, 
--            guardian_relationship, photo_url, birth_certificate_url,
--            id_proof_url, previous_school, approved, approval_date,
--            rejection_reason

-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'auto_generate_admission_number';

-- Check if view exists
SELECT * FROM information_schema.views WHERE table_name = 'pending_student_registrations';
```

### Phase 2: Create Storage Bucket

**Step 1: Create Bucket**
1. Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `student-documents`
4. Choose: **Public** bucket (for easier access) or **Private** (more secure)
5. Click "Create Bucket"

**Step 2: Configure Bucket Policy** (Optional, for fine-grained control)
```sql
-- Allow authenticated users to upload to their folder
CREATE POLICY "Allow user uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'student-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to read all files
CREATE POLICY "Allow admins to read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'student-documents' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### Phase 3: Enable Row-Level Security (RLS)

Verify RLS is enabled on all tables:
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('students', 'student_documents', 'student_approvals')
AND schemaname = 'public';

-- Should show: rowsecurity = true for all three tables
```

---

## 🚀 Application Setup

### Phase 1: Install Dependencies
```bash
cd EL-BETHEL-PORTAL-main
npm install
# or
yarn install
# or
pnpm install
```

### Phase 2: Verify Environment Variables
```bash
# Check .env.local or environment
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Should output your Supabase credentials (non-empty)
```

### Phase 3: Test Application
```bash
# Start dev server
npm run dev

# Navigate to http://localhost:3000/register/student
# You should see the student registration form
```

---

## 📝 Initial User Setup

### Create Admin Account

**Option A: Via Supabase Auth**
1. Supabase Dashboard → Authentication → Users
2. Click "Add user" / "Invite user"
3. Email: `admin@elbethel.edu`
4. Password: (set a secure password)
5. Click Create User

**Option B: Via Application**
1. Sign up as a new user
2. Register with email: `admin@elbethel.edu`
3. Update user role to `admin` via SQL:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@elbethel.edu';
```

### Create Test Student Account

1. Navigate to `/register/student`
2. Fill out the form with test data:
   - Email: `student@example.com`
   - Password: `TestPassword123`
   - Name: Test Student
   - Fill all required fields
3. Click "Complete Registration"
4. You should see: "Registration successful! Your admission number is STD-YYMMDD-0001"

---

## 🔍 Test the Complete Flow

### Step 1: Register a Student
```
URL: /register/student
Expected: Form loads with 6 steps
Actions: Fill form → Upload documents → Submit
Expected: Success message with admission number
```

### Step 2: Admin Approves
```
URL: /admin/registrations
Expected: See pending student
Actions: Click "View" → Review details → Click "Approve"
Expected: Student status changes to approved
```

### Step 3: Student Login
```
URL: /auth/login
Email: student@example.com
Password: TestPassword123
Expected: Successful login → Redirect to student dashboard
```

---

## 🐛 Verification Checklist

### Database Tables
- [ ] `students` table exists with all new columns
- [ ] `student_documents` table exists
- [ ] `student_approvals` table exists
- [ ] `users` table exists and linked to students

### Triggers & Functions
- [ ] `auto_generate_admission_number` trigger exists
- [ ] `generate_admission_number()` function exists
- [ ] `approve_student_registration()` RPC function exists
- [ ] `reject_student_registration()` RPC function exists

### Views
- [ ] `pending_student_registrations` view exists

### Storage
- [ ] `student-documents` bucket exists
- [ ] Bucket is public or has proper policies

### RLS Policies
- [ ] `students` table has RLS enabled
- [ ] `student_documents` table has RLS enabled
- [ ] `student_approvals` table has RLS enabled
- [ ] Policies allow appropriate access

### Application
- [ ] `/register/student` page loads
- [ ] `/admin/registrations` page loads
- [ ] Form validation works
- [ ] File uploads work
- [ ] Admission number auto-generates

---

## 🔧 Troubleshooting

### Issue: "Table 'students' doesn't exist"
**Solution:**
```bash
# Run the migration SQL in Supabase SQL Editor
# Copy contents of lib/student-registration-complete.sql
# Execute in Supabase → SQL Editor
```

### Issue: "Admission number not generating"
**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'auto_generate_admission_number';

-- If not found, re-run the migration:
-- Execute lib/student-registration-complete.sql again
```

### Issue: "Storage bucket not found"
**Solution:**
```
1. Supabase Dashboard → Storage
2. Create new bucket: "student-documents"
3. Set to Public bucket
```

### Issue: "RLS policy blocking inserts"
**Solution:**
```sql
-- Check which policy is blocking:
SELECT * FROM pg_policies WHERE tablename = 'students';

-- Temporarily disable RLS for testing:
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing:
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
```

### Issue: "File upload returns 403 Forbidden"
**Solution:**
1. Check bucket is Public
2. Verify bucket name is `student-documents`
3. Check CORS settings in Supabase Storage

### Issue: "Environment variables not loading"
**Solution:**
```bash
# Check if .env.local exists
ls -la .env.local

# Or check DevServerControl environment
# The system should have set these automatically

# Verify in browser console (Next.js will show errors)
```

---

## 📱 Testing User Flows

### Flow 1: Successful Registration
```
Step 1: Navigate to /register/student
Step 2: Fill in Account Info (email, password, confirm)
Step 3: Fill in Personal Info (name, gender, DOB)
Step 4: Fill in Contact Info (phone, address, state, LGA)
Step 5: Fill in Guardian Info (all fields)
Step 6: Fill in Academic Info (optional class selection)
Step 7: Upload Documents (optional but recommended)
Step 8: Click "Complete Registration"
Expected: Success toast with admission number
Expected: Redirect to /auth/login?message=registration-pending
```

### Flow 2: Admin Approval
```
Step 1: Navigate to /admin/registrations
Step 2: View pending registrations list
Step 3: Click "View" on a student
Step 4: Review all details and documents
Step 5: Click "Approve" or "Reject"
Step 6: If approve: add comments (optional)
Step 7: If reject: provide rejection reason
Step 8: Confirm action
Expected: Status updated in database
Expected: Toast confirmation
Expected: List refreshed
```

### Flow 3: Student Login (After Approval)
```
Step 1: Navigate to /auth/login
Step 2: Enter registered email
Step 3: Enter registered password
Step 4: Click "Login"
Expected: Successful authentication
Expected: Redirect to /student-dashboard
Expected: See student name in profile
```

---

## 📊 Database Queries for Admin

### Get All Pending Students
```sql
SELECT * FROM pending_student_registrations
ORDER BY created_at DESC;
```

### Get Approval Statistics
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN approved = true THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN approved = false THEN 1 ELSE 0 END) as pending
FROM students;
```

### Get Students by State
```sql
SELECT state, COUNT(*) as count
FROM students
GROUP BY state
ORDER BY count DESC;
```

### Get Approval Timeline
```sql
SELECT 
  first_name, 
  last_name, 
  created_at as application_date,
  approval_date,
  EXTRACT(EPOCH FROM (approval_date - created_at)) / 3600 as approval_hours
FROM students
WHERE approval_date IS NOT NULL
ORDER BY approval_date DESC;
```

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] All migrations applied successfully
- [ ] RLS policies are properly configured
- [ ] Storage bucket is created and accessible
- [ ] Environment variables are set in production
- [ ] Test registration form end-to-end
- [ ] Test admin approval flow
- [ ] Test student login after approval
- [ ] Configure email notifications (optional)
- [ ] Set up backup strategy
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring and logging
- [ ] Create admin accounts for staff

---

## 📞 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Zod Validation:** https://zod.dev
- **React Hook Form:** https://react-hook-form.com
- **Tailwind CSS:** https://tailwindcss.com
- **Radix UI:** https://www.radix-ui.com

---

## 🎉 Success Indicators

You'll know everything is set up correctly when:

✅ Student registration form loads and validates properly
✅ File uploads work without errors
✅ Admission numbers generate automatically (STD-YYMMDD-####)
✅ Admin can view pending registrations
✅ Admin can approve/reject students
✅ Students can login after approval
✅ All data persists in Supabase
✅ RLS policies prevent unauthorized access
✅ No console errors in browser
✅ No errors in Supabase logs

---

**Last Updated:** 2025-01-21
**Status:** Ready for Implementation ✅
