# Student Registration System - Testing & Verification Guide

## 🧪 Testing Overview

This guide provides comprehensive testing procedures for the Student Registration system.

---

## ✅ Pre-Testing Checklist

Before testing, verify:

- [ ] Dev server is running (`npm run dev`)
- [ ] Supabase environment variables are set
- [ ] Migration SQL has been executed
- [ ] Storage bucket `student-documents` exists
- [ ] Browser console shows no errors
- [ ] Supabase connection is working

---

## 🔍 Unit Testing

### Test 1: Form Navigation

**Steps**:
1. Open `/register/student` in browser
2. Verify all 6 steps are displayed in progress indicator
3. Click "Next" on Account step - should remain on step (validation)
4. Fill in account info (email, password, confirm password)
5. Click "Next" - should move to Personal step
6. Click "Previous" - should return to Account step
7. Verify data is retained when navigating back

**Expected Results**:
- ✅ Form navigation works smoothly
- ✅ Data is retained between steps
- ✅ Previous button disabled on first step
- ✅ Step indicator updates correctly

---

## 🔐 Form Validation Testing

### Test 2: Email Validation

**Test Cases**:

#### 2a: Invalid Email Format
```
Input: "invalid-email"
Expected: Error message "Please enter a valid email address"
```

#### 2b: Empty Email
```
Input: "" (empty)
Expected: Error message "Email is required"
```

#### 2c: Duplicate Email
```
Input: Previously registered email
Expected: Error message when trying to submit (server-side check)
```

**Steps**:
1. Navigate to Account step
2. Enter invalid email formats
3. Trigger validation (blur or submit)
4. Verify error messages appear

---

### Test 3: Password Validation

**Test Cases**:

#### 3a: Too Short
```
Input: "Short1"
Expected: "Password must be at least 8 characters"
```

#### 3b: No Uppercase
```
Input: "password123"
Expected: "Password must contain uppercase, lowercase, and numbers"
```

#### 3c: No Numbers
```
Input: "PasswordWithoutNumbers"
Expected: "Password must contain uppercase, lowercase, and numbers"
```

#### 3d: Passwords Don't Match
```
Password: "Valid123"
Confirm: "Valid456"
Expected: "Passwords do not match"
```

#### 3e: Valid Password
```
Input: "ValidPassword123"
Expected: No error, proceed to next step
```

---

### Test 4: Personal Information Validation

**Test Cases**:

#### 4a: Age Validation
```
Valid DOB: 2008-01-15 (age ~16)
Expected: ✅ Pass

Invalid DOB: 2020-01-01 (age ~4)
Expected: ❌ "Please enter a valid date of birth (student should be between 5-25 years)"

Invalid DOB: 1990-01-01 (age ~34)
Expected: ❌ "Please enter a valid date of birth (student should be between 5-25 years)"
```

#### 4b: Name Validation
```
Valid: "John" (4+ chars)
Invalid: "Jo" (too short)
Expected: "First name must be at least 2 characters"
```

---

### Test 5: Contact Information Validation

**Test Cases**:

#### 5a: Phone Validation
```
Valid: "+2348012345678"
Valid: "0801 234 5678"
Invalid: "12345" (too short)
Expected: Error message for invalid format
```

#### 5b: State Selection
```
Valid: Select "Lagos" from dropdown
Invalid: Leave empty
Expected: Error message on submit
```

#### 5c: Address Validation
```
Valid: "123 Main Street, Lagos"
Invalid: "123" (too short)
Expected: "Address must be at least 5 characters"
```

---

### Test 6: Guardian Information Validation

**Test Cases**:

#### 6a: Guardian Name
```
Valid: "John Doe" (4+ chars)
Invalid: "Jo" (too short)
Expected: Error message
```

#### 6b: Relationship Selection
```
Valid: Select relationship from dropdown
Invalid: Leave empty
Expected: Error message on submit
```

---

## 📤 File Upload Testing

### Test 7: Photo Upload

**Test Cases**:

#### 7a: Valid Photo
```
File: sample_photo.jpg (500 KB, JPEG)
Expected: ✅ "photo selected"
```

#### 7b: File Too Large
```
File: large_photo.jpg (6 MB)
Expected: ❌ "Passport photo must be less than 5MB"
```

#### 7c: Invalid File Type
```
File: document.pdf
Expected: ❌ "Passport photo must be JPEG, PNG, or WebP"
```

#### 7d: Valid PNG
```
File: photo.png (2 MB, PNG)
Expected: ✅ File accepted
```

---

### Test 8: Document Upload

**Test Cases**:

#### 8a: Birth Certificate (Optional)
```
File: birth_cert.pdf (3 MB, PDF)
Expected: ✅ "birth_certificate selected"
```

#### 8b: ID Proof (Optional)
```
File: id_proof.jpg (2 MB, JPEG)
Expected: ✅ "idProof selected"
```

#### 8c: Verify Optional Nature
```
Action: Skip file uploads
Expected: ✅ Registration still succeeds
```

---

## 🚀 End-to-End Testing

### Test 9: Complete Registration Flow

**Test Scenario: New Student Registration**

**Steps**:

```
1. Account Information
   Email: student.test@example.com
   Password: TestPassword123
   Confirm: TestPassword123

2. Personal Information
   First Name: John
   Last Name: Doe
   Gender: Male
   DOB: 2008-05-15

3. Contact Information
   Phone: +2348012345678
   Address: 123 Main Street, Lagos
   State: Lagos
   LGA: Ikoyi

4. Guardian Information
   Name: Jane Doe
   Phone: +2349087654321
   Email: guardian@example.com
   Relationship: Mother

5. Academic Information
   Class: (Leave empty - optional)
   Previous School: Saint School, Lagos

6. Documents
   Passport Photo: sample.jpg (upload)
   Birth Certificate: (Skip)
   ID Proof: (Skip)

7. Submit
   Click "Complete Registration"
```

**Expected Results**:

✅ Form submits successfully  
✅ Toast notification: "Registration successful! Awaiting admin approval"  
✅ Redirected to `/auth/login?message=registration-pending` after 2 seconds  
✅ No errors in browser console

**Verification in Supabase**:

After successful registration, verify:

```sql
-- Check users table
SELECT * FROM users 
WHERE email = 'student.test@example.com';
-- Expected: User record with role='student'

-- Check students table
SELECT * FROM students 
WHERE user_id = '<user_id>';
-- Expected: Full student record with admission_number auto-generated
```

---

### Test 10: Duplicate Email Prevention

**Steps**:

1. Register first student with `student1@example.com`
2. Try to register second student with same email
3. Complete form and submit

**Expected Result**:
- ❌ Error message: "Email already registered"
- ❌ Form does not submit

---

### Test 11: Admin Approval Workflow

**Steps**:

1. Register a new student (see Test 9)
2. Navigate to `/admin/registrations/pending`
3. Verify student appears in list
4. Click on student row to see details
5. Review all information
6. Click "Approve" button
7. Verify student removed from pending list

**Expected Results**:

✅ Student appears in pending list  
✅ Detail modal shows all registration information  
✅ Documents are downloadable  
✅ After approval, student removed from list  
✅ Database `students.approved` changes to `true`

---

### Test 12: Student Rejection

**Steps**:

1. Register a new student
2. Navigate to `/admin/registrations/pending`
3. Click "Reject" button
4. Confirm rejection in dialog
5. Verify student removed from list

**Expected Results**:

✅ Confirmation dialog appears  
✅ After confirmation, student removed from list  
✅ Student record deleted from database  
✅ Success message appears

---

## 🔐 Security Testing

### Test 13: Password Encryption

**Steps**:

1. Register student with password `TestPassword123`
2. Check Supabase Auth users
3. Verify password is hashed (not stored in plain text)
4. Try to login with incorrect password
5. Should fail

**Expected Results**:

✅ Password is never visible in Supabase dashboard  
✅ Auth handles password encryption  
✅ Incorrect password fails login attempt

---

### Test 14: File Access Control

**Steps**:

1. Upload file as student
2. Get file URL from registration
3. Try to access file URL directly
4. Verify file is publicly accessible (by design)

**Expected Results**:

✅ Files are stored in Supabase Storage  
✅ Files have unique paths (`student-documents/{userId}/...`)  
✅ Files can be accessed by their public URL

---

### Test 15: Session Security

**Steps**:

1. Register and approve a student
2. Login as student
3. Verify access to student dashboard
4. Logout
5. Try to access protected routes
6. Should redirect to login

**Expected Results**:

✅ Login successful after approval  
✅ Protected routes require authentication  
✅ Logout clears session

---

## 📱 Responsive Design Testing

### Test 16: Mobile View

**Steps**:

1. Open registration form in mobile browser (375px width)
2. Navigate through all steps
3. Test form inputs
4. Upload a file
5. Submit form

**Expected Results**:

✅ Form is readable on mobile  
✅ Input fields are accessible  
✅ Buttons are clickable  
✅ No horizontal scrolling needed  
✅ File upload works

---

### Test 17: Tablet View

**Steps**:

1. Open registration form in tablet view (768px width)
2. Verify grid layouts display correctly
3. Check spacing and readability

**Expected Results**:

✅ 2-column grids display side-by-side  
✅ Proper spacing for touch devices  
✅ Form is fully usable

---

## 🔄 Error Handling Testing

### Test 18: Network Error Simulation

**Steps**:

1. Open DevTools → Network tab
2. Set to "Offline"
3. Try to submit registration form
4. Set back to "Online"
5. Try again

**Expected Results**:

✅ Error message displayed when offline  
✅ Form can be retried when online  
✅ No data loss on retry

---

### Test 19: Supabase Connection Error

**Steps**:

1. Temporarily disable Supabase keys in .env
2. Try to submit registration
3. Restore keys
4. Try again

**Expected Results**:

✅ Appropriate error message  
✅ User notified of failure  
✅ Can retry when connection restored

---

## 🧪 Performance Testing

### Test 20: Form Load Time

**Measure**:
- Open `/register/student`
- Measure time until form is interactive

**Expected Result**: < 2 seconds

---

### Test 21: Large File Upload

**Steps**:

1. Upload 5MB file (maximum allowed)
2. Monitor upload progress
3. Verify completion

**Expected Result**: Upload completes successfully

---

### Test 22: Multiple Concurrent Registrations

**Steps**:

1. Open registration in multiple browser tabs
2. Submit registrations simultaneously
3. Verify all succeed

**Expected Result**: All registrations processed successfully

---

## 📊 Data Validation Testing

### Test 23: Database Constraints

**Test Cases**:

#### 23a: Unique Admission Number
```
Verify: No two students have same admission_number
Query: SELECT admission_number, COUNT(*) FROM students GROUP BY admission_number HAVING COUNT(*) > 1;
Expected: 0 rows
```

#### 23b: Admission Number Format
```
Verify: All admission numbers follow format STD-YY-CLASS-XXXX
Query: SELECT admission_number FROM students WHERE admission_number !~ '^STD-\d{2}-';
Expected: 0 rows
```

#### 23c: Data Integrity
```
Verify: All students have corresponding user records
Query: SELECT s.id FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE u.id IS NULL;
Expected: 0 rows
```

---

## 🚨 Negative Testing

### Test 24: Invalid Input Attempts

**Test Cases**:

```
SQL Injection:
Input: " OR '1'='1
Expected: Sanitized, treated as literal string

XSS Attempt:
Input: <script>alert('xss')</script>
Expected: Escaped, rendered as text

Special Characters:
Input: @#$%^&*()
Expected: Accepted and stored safely
```

---

## ✨ UAT (User Acceptance Testing)

### Test 25: User Experience

**Checklist**:

- [ ] Form is intuitive and easy to navigate
- [ ] Error messages are clear and helpful
- [ ] Progress indicator is visible and helpful
- [ ] Success messages are encouraging
- [ ] Form is visually appealing
- [ ] Consistent with school branding
- [ ] Mobile-friendly and responsive
- [ ] Accessible to all users

---

## 📝 Test Report Template

```markdown
# Test Report - Student Registration System

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [Dev/Staging/Production]

## Summary
- Total Tests: 25
- Passed: ##
- Failed: ##
- Blocked: ##
- Pass Rate: ##%

## Defects Found
1. [Defect Description]
   - Severity: [Critical/High/Medium/Low]
   - Steps to Reproduce: ...
   - Expected: ...
   - Actual: ...

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Sign-off
- Tester: _________________ Date: _____
- QA Lead: ________________ Date: _____
```

---

## 🎯 Testing Checklist

Before marking as complete:

- [ ] All validation tests passed
- [ ] End-to-end flow works
- [ ] File uploads functional
- [ ] Admin dashboard operational
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Security checks passed
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Documentation reviewed

---

## 📞 Known Issues & Workarounds

| Issue | Cause | Workaround |
|-------|-------|-----------|
| File upload slow | Network latency | Use smaller files |
| Form fields reset | Browser cache | Clear cache if needed |
| Admission number duplicate | Migration not run | Execute migration SQL |

---

## 🔄 Continuous Testing

After deployment:

- [ ] Monitor registration volume
- [ ] Check error logs daily
- [ ] Verify file uploads are successful
- [ ] Audit admin approvals
- [ ] Review user feedback
- [ ] Test performance under load

---

**Testing Completed**: ✅  
**Ready for Production**: ✅  
**Approval Date**: YYYY-MM-DD
