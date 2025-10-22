# Student Approval System Setup Guide

This guide walks you through setting up the hybrid student registration and approval system for El Bethel Academy.

## System Overview

**Hybrid Model:**
- ✅ Students can create their own accounts at `/auth/register`
- ⏳ Accounts are created with `approved = false` status
- 🔒 Students cannot log in until admin approves their account
- ✅ Admins can approve/reject registrations from `/admin/registrations/pending`

---

## Step 1: Run the SQL Migration

The system requires specific database tables and Row-Level Security (RLS) policies.

### Steps:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Open the file: `EL-BETHEL-PORTAL-main/migrations/001_student_approval_system.sql`
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** button

This migration will:
- Add `approved`, `gender`, `address`, `state`, `lga`, `guardian_email`, `previous_school`, `photo_url` columns to `students` table
- Create `admins` table
- Create `student_approval_logs` table
- Create indexes for performance
- Set up Row-Level Security (RLS) policies

### Expected Tables After Migration:

```
students
├── id (uuid)
├── user_id (uuid) - links to auth user
├── first_name (text)
├── last_name (text)
├── email (via users table join)
├── phone (text)
├── gender (text)
├── class (text) - JSS1, JSS2, etc.
├── section (text) - A, B, C
├── guardian_name (text)
├── guardian_phone (text)
├── guardian_email (text)
├── address (text)
├── state (text)
├── lga (text)
├── approved (boolean) - DEFAULT false
├── created_at (timestamptz)
└── reg_number (text) - UNIQUE

admins
├── id (uuid)
├── user_id (uuid) - links to auth user
└── created_at (timestamptz)

student_approval_logs
├── id (uuid)
├── student_id (uuid)
├── admin_user_id (uuid)
├── action (text) - 'approved' or 'rejected'
├── note (text)
└── created_at (timestamptz)
```

---

## Step 2: Create Your First Admin User

Before you can approve students, you need to set up an admin account.

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** button
3. Enter:
   - **Email:** admin@elba.edu.ng (or your preferred email)
   - **Password:** Choose a strong password
4. Click **"Create User"**
5. The system will show you the new user's **ID** (a long UUID). Copy this ID.

### Option B: Self-Signup (if you allow it)

If you've enabled self-signup on `/auth/register`, you can sign up as admin and then manually add yourself to the admins table.

### Step 2B: Register Your Admin in the Admins Table

Once you have the admin user ID:

1. Go to **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Run this SQL:

```sql
INSERT INTO admins (user_id) 
VALUES ('PASTE_YOUR_ADMIN_USER_ID_HERE');
```

Replace `PASTE_YOUR_ADMIN_USER_ID_HERE` with the actual user ID you got from step 1.

✅ **Done!** You're now an admin. You can access the approval page at `/admin/registrations/pending`

---

## Step 3: Update Environment Variables (if using API endpoints)

If you want to use the API endpoints for approval (instead of Supabase table editor), you'll need:

Add to your `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **Important:** The service role key is secret and should NOT be exposed to the frontend. Only use it in server-side endpoints (like `/app/api` routes).

Find this in **Supabase Dashboard** → **Project Settings** → **API** → **Service Role Key**

---

## Step 4: Test the System

### Test as a Student:

1. Go to `/auth/register`
2. Select **"Student"** role
3. Fill in all required fields:
   - First Name
   - Last Name
   - Email
   - Phone (optional)
   - Gender
   - Date of Birth (optional)
   - Class (JSS1-SS3)
   - Section (A, B, C)
   - Guardian Name
   - Guardian Phone (optional)
   - Guardian Email (optional)
   - Address (optional)
4. Create a password
5. Click **"Create Account"**
6. You should see: _"Your account is pending admin approval. Check your email for updates."_
7. Try to log in → Should get error: _"Your account is pending admin approval"_

### Test as Admin:

1. Log in to `/auth/login` with your admin credentials
2. Go to `/admin/registrations/pending`
3. You should see the student(s) you just created
4. Click **"View Details"** (eye icon) to see full student profile
5. Click **"Approve"** button (green checkmark)
6. Student will be removed from pending list

### Verify Approval:

1. Log out (if logged in as admin)
2. Go to `/auth/login`
3. Log in with the student account (email + password)
4. Should now have access to `/student-dashboard`

---

## Step 5: Understanding Registration Numbers

Registration numbers are auto-generated in format:

```
ELBA/YY/CLASSECTION/NNN
```

Example:
- `ELBA/25/JSS2B/045` (El Bethel 2025, JSS2 Section B, sequence 045)
- `ELBA/25/SS3A/102` (El Bethel 2025, SS3 Section A, sequence 102)

**Generated automatically when student signs up.**

---

## Step 6: User Flows

### Student Registration Flow:
```
Student visits /auth/register
    ↓
Fills form (first_name, last_name, email, class, section, guardian_info)
    ↓
System creates:
   1. User in Supabase Auth (email + password)
   2. Record in "users" table (role = 'student', is_approved = false)
   3. Record in "students" table (approved = false, auto-generated reg_number)
    ↓
Student sees: "Your account is pending admin approval"
    ↓
Student can NOT log in (login checks approved = true)
```

### Admin Approval Flow:
```
Admin logs in to /auth/login
    ↓
Navigates to /admin/registrations/pending
    ↓
Sees list of pending students with details
    ↓
Clicks "Approve" or "View Details" → "Approve"
    ↓
System updates:
   1. students.approved = true
   2. Creates log entry in student_approval_logs
    ↓
Student removed from pending list
    ↓
Student can now log in and access portal
```

### Student Login After Approval:
```
Student visits /auth/login
    ↓
Enters email + password
    ↓
System checks:
   1. Email and password valid? → Auth success
   2. Is student.approved = true? → YES
    ↓
Student logged in and redirected to /student-dashboard
```

---

## Step 7: RLS (Row-Level Security) Policies

The system uses RLS to automatically protect data:

| Table | Policy | Who can access? |
|-------|--------|-----------------|
| `students` | **SELECT** | Student can read own record, anyone can read approved=true students, admins see all |
| `students` | **INSERT** | Anyone can insert (open signup) |
| `students` | **UPDATE** | Student can update own record (limited fields), admins can update any |
| `students` | **DELETE** | Only admins |
| `admins` | All operations | Only admins |
| `student_approval_logs` | **SELECT** | Admins + student of that log |
| `student_approval_logs` | **INSERT** | Only admins |

---

## Step 8: Common Issues & Solutions

### Issue: "User is not an admin" when trying to approve students

**Solution:** Make sure your admin account is registered in the `admins` table:

```sql
SELECT * FROM admins WHERE user_id = 'your_user_id';
```

If empty, insert it:
```sql
INSERT INTO admins (user_id) VALUES ('your_user_id');
```

---

### Issue: "Column 'approved' does not exist"

**Solution:** You didn't run the SQL migration. Go back to **Step 1** and run the migration.

---

### Issue: RLS policy errors ("new row violates row level security policy")

**Solution:** This usually means:
1. You're not using the service role key on server-side
2. The row doesn't match the RLS policy conditions
3. Make sure `approved` column exists (run migration)

---

### Issue: Student account was created but email not found in users table

**Solution:** Check if there are linking issues:

```sql
-- Check if student record exists
SELECT * FROM students WHERE reg_number = 'ELBA/25/JSS2B/001';

-- Check if corresponding user exists
SELECT * FROM users WHERE id = 'student_user_id_from_above';

-- If missing, manually create:
INSERT INTO users (id, email, full_name, role, is_approved)
VALUES ('user_id', 'email@example.com', 'Student Name', 'student', false);
```

---

## Step 9: Additional Configuration (Optional)

### Add Email Notifications

When a student is approved, you can send them an email. This requires:

1. Set up Resend or similar email service
2. Create an API endpoint that sends email when `students.approved` is updated
3. Trigger it via Supabase webhooks or server-side logic

Example endpoint you can create:
```
POST /api/emails/student-approval-notification
```

---

### Sequential Registration Numbers (Instead of Random)

Current system generates random numbers. For sequential:

1. Create a Postgres function to increment counters per class
2. Call it when creating student record
3. Replace the JavaScript number generation with the function result

Example function:
```sql
CREATE OR REPLACE FUNCTION generate_sequential_reg_number(p_class text, p_section text)
RETURNS text AS $$
DECLARE
  v_year text;
  v_counter int;
  v_reg_number text;
BEGIN
  v_year := to_char(now(), 'YY');
  
  -- Get next counter for this class+section
  v_counter := COALESCE(
    (SELECT COUNT(*) + 1 FROM students 
     WHERE class = p_class AND section = p_section),
    1
  );
  
  v_reg_number := 'ELBA/' || v_year || '/' || p_class || p_section || '/' || LPAD(v_counter::text, 3, '0');
  
  RETURN v_reg_number;
END;
$$ LANGUAGE plpgsql;
```

---

## Next Steps

1. ✅ Run the SQL migration (Step 1)
2. ✅ Create admin user (Step 2)
3. ✅ Test student registration (Step 4)
4. ✅ Test admin approval (Step 4)
5. ✅ Verify student can log in after approval (Step 4)
6. 📧 (Optional) Set up email notifications
7. 🔢 (Optional) Switch to sequential registration numbers

---

## Support

If you encounter issues:

1. Check **Step 8: Common Issues**
2. Review Supabase logs in Dashboard → **Logs**
3. Check browser console for errors (F12)
4. Verify environment variables are set correctly
5. Ensure RLS is enabled on tables

Good luck! 🎓
