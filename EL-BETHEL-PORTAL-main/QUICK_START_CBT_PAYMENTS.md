# Quick Start: CBT Exam & Payment System

## ⚡ Get Up & Running in 5 Steps

### Step 1: Set Up the Database (5 minutes)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the entire content of `lib/cbt-payment-migrations.sql`
4. Paste into the SQL Editor
5. Click **Execute**

✅ You'll see 6 new tables in your Supabase console:
- exam_sessions
- exam_questions
- exam_attempts
- student_answers
- exam_results
- payment_records

### Step 2: Create Storage Bucket for Payment Proofs (3 minutes)

1. Go to **Storage** in Supabase
2. Click **New Bucket**
3. Name: `payment-proofs`
4. Make it **Public**
5. Click **Create Bucket**

This allows students to upload payment proof images.

### Step 3: Add a Sample Exam (2 minutes)

**As a Teacher:**
1. Log in and go to `/teacher/exams`
2. Click **Create Exam**
3. Fill in:
   - Title: "First Term Mathematics Exam"
   - Class: Select any class
   - Subject: Mathematics
   - Start Time: Tomorrow at 10:00 AM
   - End Time: Tomorrow at 11:00 AM
   - Duration: 60 minutes
   - Total Marks: 100
4. Click **Create Exam**

**Add Questions:**
1. Click **Manage Questions**
2. Click **Add Question**
3. Enter:
   - Question: "What is 2 + 2?"
   - Type: Multiple Choice
   - Options: A=3, B=4, C=5, D=6
   - Correct Answer: B
   - Marks: 1
4. Click **Add Question**
5. Repeat for 2-3 more questions

### Step 4: Activate the Exam (1 minute)

**As an Admin:**
1. Go to `/admin/exams`
2. Find your exam
3. Click **Change Status**
4. Select **Active**
5. Click **Update Status**

Now students can see it!

### Step 5: Test as a Student (5 minutes)

**As a Student:**
1. Log in and go to `/student/exams`
2. You'll see your exam listed
3. Click **Start Exam**
4. Answer the questions (timer counts down)
5. Click **Submit Exam**

**Results:**
- Go to `/admin/exams/[examId]/results`
- Click **Release All Results**
- Student can now see results at `/student/exams`

---

## 💳 Testing Payments

### Option 1: Online Payment (Paystack)

**Test Card:** 
- Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

1. Student goes to `/student/payments`
2. Clicks **Pay Online**
3. Gets redirected to Paystack
4. Uses test card above
5. Payment is verified automatically

### Option 2: Manual Payment Upload

1. Student goes to `/student/payments`
2. Clicks **Upload Proof**
3. Uploads any image/PDF
4. Admin goes to `/admin/payments`
5. Clicks checkmark to verify
6. Payment status changes to "Verified"

---

## 📊 Key URLs for Each Role

### Students
- View Exams: `/student/exams`
- Take Exam: `/student/exams/[examId]/take`
- View Payments: `/student/payments`

### Teachers
- Create Exams: `/teacher/exams`
- Add Questions: `/teacher/exams/[examId]/questions`
- View Results: `/teacher/exams/[examId]/results`

### Admins
- Manage Exams: `/admin/exams`
- Release Results: `/admin/exams/[examId]/results`
- Verify Payments: `/admin/payments`

---

## ✅ Verification Checklist

- [ ] Paystack keys are set (Check: Environment variables)
- [ ] Database tables created (Check: Supabase SQL)
- [ ] Storage bucket created (Check: Supabase Storage)
- [ ] Can create exam as teacher
- [ ] Can take exam as student
- [ ] Can see exam in results
- [ ] Can pay online (test mode)
- [ ] Can upload payment proof
- [ ] Can verify payment as admin
- [ ] Can release results as admin

---

## 🆘 Troubleshooting

### "No exams available"
- Check exam status is "Active"
- Check current time is within exam window
- Student must be in the exam's assigned class

### "Payment failed"
- Verify Paystack keys are correct
- Check test mode is enabled in Paystack
- Try test card: `4111 1111 1111 1111`

### "Can't upload proof"
- Check storage bucket exists and is public
- Verify file is image or PDF
- Check file size < 5MB

### "Results not visible"
- Go to `/admin/exams/[examId]/results`
- Click "Release All Results"
- Student must be logged in to see

---

## 🎯 Next: Customize Your System

1. **Add Your Classes & Subjects**
   - Create classes in Supabase (SS1, SS2, SS3, etc.)
   - Add subjects (Math, English, etc.)

2. **Import Student Data**
   - Bulk upload student records
   - Set class assignments

3. **Configure Grading**
   - Edit grade thresholds (A=70, B=60, etc.)
   - Set passing marks per exam

4. **Add More Features**
   - Email notifications
   - SMS alerts
   - Result PDFs with school letterhead

---

## 📚 Full Documentation

See `CBT_PAYMENT_IMPLEMENTATION.md` for:
- Complete API reference
- Database schema
- Security features
- Advanced configuration

---

**Ready?** Start with Step 1! ���
