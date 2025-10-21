# Student Registration System - Setup Checklist

Complete this checklist to ensure your Student Registration system is fully operational.

## ✅ Phase 1: Database Setup

- [ ] Access your Supabase Dashboard
- [ ] Open the SQL Editor
- [ ] Copy the entire content from `lib/student-registration-migration.sql`
- [ ] Execute the migration SQL in Supabase
- [ ] Verify the migration completed without errors
- [ ] Check that new columns were added to the `students` table:
  - `first_name`, `last_name`, `phone`, `address`, `state`, `lga`
  - `guardian_relationship`, `previous_school`, `photo_url`, `birth_certificate_url`, `id_proof_url`
  - `approved`

### Verification Query
Run this in Supabase SQL Editor to verify:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
```

---

## ✅ Phase 2: Supabase Storage Setup

- [ ] Go to Supabase Dashboard → Storage
- [ ] Create a bucket named `student-documents` (if it doesn't exist)
- [ ] Set the bucket to **Public** (or configure policies)
- [ ] Create RLS policies for the bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' 
  AND bucket_id = 'student-documents'
);

-- Allow public read access to documents
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'student-documents');
```

- [ ] Verify bucket creation in Storage console

---

## ✅ Phase 3: Environment Variables

Your environment variables are already configured:
- ✓ `NEXT_PUBLIC_SUPABASE_URL`
- ✓ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Verify they're working:
- [ ] Open the dev server
- [ ] Check browser console for any Supabase connection errors
- [ ] Verify you can see the registration form at `/register/student`

---

## ✅ Phase 4: Application Setup

- [ ] Verify all files are created:
  - [ ] `app/register/student/page.tsx` (Registration form)
  - [ ] `lib/student-registration-migration.sql` (Database migration)
  - [ ] `lib/student-registration-validation.ts` (Validation schemas)
  - [ ] `lib/student-registration-service.ts` (Service functions)
  - [ ] `app/actions/registration.ts` (Server actions)

- [ ] Check that dev server is running:
  ```bash
  cd EL-BETHEL-PORTAL-main
  npm run dev
  ```

- [ ] Verify form loads at: `http://localhost:3000/register/student`
- [ ] Test form navigation between steps
- [ ] Check console for any JavaScript errors

---

## ✅ Phase 5: Testing

### Test Case 1: Basic Registration
1. Navigate to `/register/student`
2. Fill in all required fields:
   - Email: `student.test@example.com`
   - Password: `TestPassword123`
   - Name: `Test Student`
   - Gender: `Male`
   - DOB: `01/01/2008`
   - Phone: `+2348000000000`
   - Address: `123 Main St`
   - State: `Lagos`
   - LGA: `Ikeja`
   - Guardian: `Test Parent`
   - Guardian Phone: `+2348111111111`
   - Guardian Email: `parent@example.com`
   - Relationship: `Mother`

3. Click "Complete Registration"
4. Should see success message: "Registration successful! Awaiting admin approval"

### Test Case 2: Email Validation
1. Try registering with same email again
2. Should show error: "Email already registered"

### Test Case 3: File Upload
1. Navigate to Documents step
2. Upload a passport photo (PNG/JPG, < 5MB)
3. Should show file name after selection
4. Complete registration
5. Files should be uploaded to Supabase Storage

### Test Case 4: Form Validation
1. Try to proceed with empty fields
2. Should show validation errors
3. Try password with < 8 characters
4. Should show password requirement error

### Verification in Supabase
After successful registration:
1. [ ] Check `users` table for new user record
2. [ ] Check `students` table for student record with:
   - `approved = false`
   - `admission_number` auto-generated (format: STD-YY-CLASS-XXXX)
   - All fields populated
3. [ ] Check Storage bucket for uploaded files under `student-documents/{userId}/`

---

## ✅ Phase 6: Integration

### Update Navigation
- [ ] Add link to registration form in your main navigation:
  ```tsx
  <Link href="/register/student">Student Registration</Link>
  ```

### Update Landing Page
- [ ] Update `app/page.tsx` to link to `/register/student`
- [ ] Example button:
  ```tsx
  <Button asChild>
    <Link href="/register/student">Get Started - Register as Student</Link>
  </Button>
  ```

### Update Login Page
- [ ] Ensure login page at `/auth/login` works
- [ ] Add link to registration form for new students:
  ```tsx
  <p>
    Don't have an account?{' '}
    <Link href="/register/student">Register here</Link>
  </p>
  ```

---

## ✅ Phase 7: Admin Approval System (Optional)

To create an admin panel for approving registrations:

1. [ ] Create `app/admin/registrations/page.tsx`
2. [ ] Implement using `getPendingStudents` from server actions
3. [ ] Add approve/reject buttons using `approveStudentRegistration` and `rejectStudentRegistration`
4. [ ] Add admin navigation link

---

## ✅ Phase 8: Email Notifications (Optional)

To enable email verification:

1. [ ] Go to Supabase Dashboard → Authentication → Settings
2. [ ] Enable "Confirm email"
3. [ ] Configure SMTP settings for email delivery
4. [ ] Test email delivery with a test registration

---

## ✅ Phase 9: Security Review

- [ ] Verify Row-Level Security (RLS) policies are enabled on `students` table
- [ ] Check that users can only see their own records
- [ ] Verify passwords are never logged or exposed
- [ ] Check file upload validation (size, type, etc.)
- [ ] Review Supabase authentication policies

**RLS Policy Example**:
```sql
-- Students can only see their own record
CREATE POLICY "Users can view own student record"
ON students
FOR SELECT
USING (auth.uid() = user_id);
```

---

## ✅ Phase 10: Performance & Optimization

- [ ] Test form with slow network (DevTools throttling)
- [ ] Verify file uploads with large files (test with 5MB max)
- [ ] Check page load time (should be < 3 seconds)
- [ ] Verify form validation is snappy (no lag)
- [ ] Test on mobile devices (responsive design)

---

## ✅ Phase 11: Production Deployment

Before deploying to production:

- [ ] All tests passing
- [ ] Environment variables configured in production
- [ ] Database backups enabled in Supabase
- [ ] Email notifications tested
- [ ] Admin approval workflow documented
- [ ] Support process for registration issues

---

## 🐛 Troubleshooting Checklist

If you encounter issues, check these:

### 400 Bad Request / Form Won't Submit
- [ ] Check browser console for errors
- [ ] Verify Supabase environment variables
- [ ] Check that all required fields are filled
- [ ] Verify form validation passes

### Email Already Registered But New User
- [ ] Check Supabase `users` table for existing record
- [ ] May need to manually delete if registration failed partway

### Files Not Uploading
- [ ] Check Supabase Storage bucket exists
- [ ] Verify bucket policies allow uploads
- [ ] Check file size (max 5MB)
- [ ] Check file type (JPEG/PNG/PDF)
- [ ] Check browser console for upload errors

### Admission Number Not Generated
- [ ] Verify migration SQL was executed
- [ ] Check that `admission_number_seq` sequence exists
- [ ] Check that trigger exists on `students` table
- [ ] Try inserting a test student manually

### Supabase Connection Issues
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- [ ] Check that keys haven't expired
- [ ] Check browser console for detailed error messages

---

## 📞 Support

If you need help:

1. Check the full documentation: `STUDENT_REGISTRATION_IMPLEMENTATION.md`
2. Review server logs in the dev console
3. Check Supabase logs in the dashboard
4. Contact your development team with detailed error messages

---

## ✨ Summary

Your Student Registration System includes:

✅ **Professional multi-step form** with validation  
✅ **Supabase authentication** integration  
✅ **Automatic admission number generation**  
✅ **Secure file uploads** to Supabase Storage  
✅ **Admin approval workflow**  
✅ **Responsive mobile-friendly design**  
✅ **Comprehensive error handling**  
✅ **Email and validation support**  

**Status**: Ready for testing and deployment!

---

**Last Updated**: 2025  
**Version**: 1.0  
**Maintenance**: Regular security updates and feature enhancements planned
