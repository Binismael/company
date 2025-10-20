# System Setup & Verification Checklist

## 🎯 Complete System Implementation for El Bethel Academy Portal

This checklist ensures all CBT Exam and Payment System components are properly configured.

---

## ✅ Pre-Flight Checks

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set
- [ ] `PAYSTACK_SECRET_KEY` is set
- [ ] Dev server is running (`npm run dev`)

### Supabase Connection
- [ ] Can log in to Supabase dashboard
- [ ] Can access SQL Editor
- [ ] Can access Storage

---

## 🗄️ Database Setup (Required)

### Step 1: Execute SQL Migration

```sql
-- File: lib/cbt-payment-migrations.sql
-- Location: Supabase SQL Editor
-- Time: ~2 minutes
```

**Action Items:**
- [ ] Open Supabase dashboard
- [ ] Go to SQL Editor
- [ ] Copy entire contents of `lib/cbt-payment-migrations.sql`
- [ ] Paste into SQL Editor
- [ ] Click **Execute**
- [ ] Wait for "Success" message

**Verification:**
- [ ] See 6 new tables in Table Editor:
  - exam_sessions
  - exam_questions
  - exam_attempts
  - student_answers
  - exam_results
  - payment_records

### Step 2: Verify Row-Level Security (RLS)

- [ ] Go to each table in Supabase
- [ ] Click **RLS** tab
- [ ] Verify "Enable RLS" is checked
- [ ] See RLS policies listed

---

## 💾 Storage Setup (Required for Payment Proofs)

### Create Payment Proofs Bucket

- [ ] Go to **Storage** in Supabase
- [ ] Click **New Bucket**
- [ ] Name: `payment-proofs`
- [ ] Make **Public**
- [ ] Click **Create**

**Verification:**
- [ ] Bucket appears in Storage list
- [ ] Can click into bucket without errors

---

## 🔐 Authentication Setup

### Verify Roles Exist

The following user roles should exist in your `users` table:
- [ ] `admin` - Full system access
- [ ] `teacher` - Can create exams and view results
- [ ] `student` - Can take exams and pay fees
- [ ] `parent` - Can view child's results (optional)
- [ ] `bursar` - Can manage payments

### Test User Creation

Create test users for each role:
- [ ] Admin user (e.g., admin@test.com)
- [ ] Teacher user (e.g., teacher@test.com)
- [ ] Student user (e.g., student@test.com)

---

## 🔗 API Endpoints Verification

### Test Exam Endpoints

- [ ] `GET /api/exams/sessions` returns list or empty array
- [ ] `POST /api/exams/sessions` creates exam (requires teacher auth)
- [ ] `GET /api/exams/questions?examSessionId=xxx` works
- [ ] `POST /api/exams/attempts` creates attempt
- [ ] `GET /api/exams/results?examSessionId=xxx` works

**Test with:**
```bash
# List exams
curl http://localhost:3000/api/exams/sessions

# Get results
curl http://localhost:3000/api/exams/results?examSessionId=test
```

### Test Payment Endpoints

- [ ] `GET /api/payments/records` returns list or empty array
- [ ] `POST /api/payments/records` creates payment record
- [ ] `POST /api/payments/paystack/initialize` initializes payment
- [ ] `POST /api/payments/paystack/verify` verifies payment

---

## 🖥️ Frontend Pages Verification

### Student Pages

- [ ] `/student/exams` - Page loads without errors
- [ ] `/student/payments` - Page loads without errors
- [ ] `/student/results` - Page loads without errors

### Teacher Pages

- [ ] `/teacher/exams` - Page loads without errors
- [ ] `/teacher/exams/[examId]/questions` - Page loads without errors
- [ ] `/teacher/exams/[examId]/results` - Page loads without errors

### Admin Pages

- [ ] `/admin/exams` - Page loads without errors
- [ ] `/admin/exams/[examId]/results` - Page loads without errors
- [ ] `/admin/payments` - Page loads without errors

**Verification Steps:**
1. Login as each role
2. Navigate to their pages
3. Check browser console for errors
4. Verify no 404 errors

---

## 🧪 End-to-End Functionality Tests

### Exam Creation & Taking Flow

1. **Create Exam (Teacher)**
   - [ ] Login as teacher
   - [ ] Go to `/teacher/exams`
   - [ ] Click "Create Exam"
   - [ ] Fill form and create
   - [ ] See new exam in list

2. **Add Questions (Teacher)**
   - [ ] Click "Manage Questions"
   - [ ] Click "Add Question"
   - [ ] Add multiple choice question
   - [ ] Save and see it listed

3. **Activate Exam (Admin)**
   - [ ] Login as admin
   - [ ] Go to `/admin/exams`
   - [ ] Find the exam
   - [ ] Click "Change Status"
   - [ ] Change to "Active"

4. **Take Exam (Student)**
   - [ ] Login as student
   - [ ] Go to `/student/exams`
   - [ ] See the active exam
   - [ ] Click "Start Exam"
   - [ ] Answer questions
   - [ ] Submit exam
   - [ ] See "submitted successfully" message

5. **Release Results (Admin)**
   - [ ] Go to `/admin/exams/[examId]/results`
   - [ ] See student attempt
   - [ ] Click "Release All Results"
   - [ ] Confirm

6. **View Results (Student)**
   - [ ] Go to `/student/results`
   - [ ] See exam grade and score

### Payment Flow

1. **View Fees (Student)**
   - [ ] Login as student
   - [ ] Go to `/student/payments`
   - [ ] See amount due, paid, balance

2. **Pay Online (Student)**
   - [ ] Click "Pay Online"
   - [ ] See Paystack popup
   - [ ] Use test card: `4111 1111 1111 1111`
   - [ ] Expiry: Any future date
   - [ ] CVV: Any 3 digits
   - [ ] Complete payment
   - [ ] See success message

3. **Payment Appears (Admin)**
   - [ ] Go to `/admin/payments`
   - [ ] See new payment record
   - [ ] Status shows "Verified"

4. **Upload Proof (Student - Alternate)**
   - [ ] Go to `/student/payments`
   - [ ] Click "Upload Proof"
   - [ ] Upload test image
   - [ ] See status "Pending"

5. **Verify Proof (Admin)**
   - [ ] Go to `/admin/payments`
   - [ ] Filter by "Pending"
   - [ ] Click checkmark icon
   - [ ] Add remarks if needed
   - [ ] Click "Verify Payment"
   - [ ] Status changes to "Verified"

---

## 🐛 Common Issues & Solutions

### Issue: "Tables don't exist"
**Solution:**
1. Check if SQL migration was executed
2. Verify in Supabase Table Editor
3. Run migration again if needed

### Issue: "Payment redirect fails"
**Solution:**
1. Verify Paystack keys are correct
2. Check Paystack test mode is enabled
3. Verify environment variables loaded

### Issue: "Can't upload payment proof"
**Solution:**
1. Verify `payment-proofs` bucket exists
2. Check bucket is set to Public
3. Verify file is image or PDF format

### Issue: "Exam not visible to students"
**Solution:**
1. Check exam status is "Active"
2. Check current time is within exam window
3. Check student is in assigned class
4. Verify RLS policies are correct

### Issue: "Results not visible after release"
**Solution:**
1. Verify "Release All Results" was clicked
2. Check `visible_to_student` field is true
3. Student must logout and login again

---

## 📊 Performance Verification

### Check Database Performance

```sql
-- Verify indexes are created
SELECT * FROM information_schema.statistics
WHERE table_name IN ('exam_sessions', 'exam_attempts', 'payment_records');
```

### Check Query Performance
- [ ] Exam list loads < 500ms
- [ ] Student answers save < 1000ms
- [ ] Results calculate < 500ms

---

## 🔒 Security Verification

### Test RLS Policies

1. **Student can only see own data:**
   - [ ] Student can't view other student's exams
   - [ ] Student can't view other student's results
   - [ ] Student can't view other student's payments

2. **Teacher can only see class data:**
   - [ ] Teacher can only see their class exams
   - [ ] Teacher can only see their assigned subjects

3. **Admin can see all data:**
   - [ ] Admin can view all exams
   - [ ] Admin can view all results
   - [ ] Admin can view all payments

### Test Authentication

- [ ] Can't access `/student/*` without login
- [ ] Can't access `/teacher/*` without teacher role
- [ ] Can't access `/admin/*` without admin role

---

## 📱 Browser Compatibility

Test on:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

**Check:**
- [ ] All pages render correctly
- [ ] Forms submit properly
- [ ] Modals open and close
- [ ] No console errors

---

## ✨ Final Sign-Off

- [ ] All database tables exist
- [ ] All API endpoints work
- [ ] All pages load without errors
- [ ] End-to-end exam flow works
- [ ] End-to-end payment flow works
- [ ] RLS policies working correctly
- [ ] No console errors in browser
- [ ] Ready for production use

---

## 📞 Support Resources

### Documentation Files
- `CBT_PAYMENT_IMPLEMENTATION.md` - Full system documentation
- `QUICK_START_CBT_PAYMENTS.md` - 5-minute quick start
- `lib/cbt-payment-migrations.sql` - Database schema

### Key Files
- API Routes: `app/api/exams/*` and `app/api/payments/*`
- Pages: `app/student/*`, `app/teacher/*`, `app/admin/*`
- Database: Supabase console

### Common URLs
- Student Exams: `http://localhost:3000/student/exams`
- Teacher Exams: `http://localhost:3000/teacher/exams`
- Admin Exams: `http://localhost:3000/admin/exams`
- Admin Payments: `http://localhost:3000/admin/payments`

---

**Status**: Ready for Verification

**Last Checked**: [Your Date]

**Verified By**: [Your Name]
