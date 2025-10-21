# Student Registration System - Quick Reference

## 🎯 At a Glance

**What:** Professional student registration portal with admin approval workflow
**Where:** `/register/student` (form) & `/admin/registrations` (admin panel)
**Database:** Supabase with auto-admission numbers
**Tech:** Next.js, React, Tailwind, Radix UI, Zod, React Hook Form

---

## 📝 Form Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/register/student` | GET | Show registration form | Public |
| `/api/auth/signup` | POST | Create user account | Public |
| `/admin/registrations` | GET | Admin approval panel | Admin only |

---

## 🔧 Key Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `app/register/student/page.tsx` | Registration form UI | Default component |
| `app/admin/registrations/page.tsx` | Admin dashboard | Default component |
| `lib/student-registration-service.ts` | Business logic | `registerStudent()`, `approveStudent()`, `getPendingStudents()` |
| `lib/student-approval-utils.ts` | Helper functions | `exportPendingStudentsToCSV()`, `bulkApproveStudents()` |
| `lib/student-registration-validation.ts` | Zod schemas | `studentRegistrationSchema`, `NIGERIAN_STATES` |
| `lib/student-registration-complete.sql` | Database setup | SQL migrations |

---

## 🚀 Quick Start

```bash
# 1. Run database migrations
# Open Supabase SQL Editor → Execute lib/student-registration-complete.sql

# 2. Create storage bucket
# Supabase Dashboard → Storage → New Bucket → Name: "student-documents"

# 3. Start app
npm run dev

# 4. Test
# Navigate to http://localhost:3000/register/student
```

---

## 📋 Form Fields

### Account (Step 1)
```typescript
email: string        // Required, unique
password: string     // Min 8 chars, uppercase+lowercase+numbers
confirmPassword: string
```

### Personal (Step 2)
```typescript
firstName: string    // 2-50 chars
lastName: string     // 2-50 chars
gender: 'Male' | 'Female' | 'Other'
dateOfBirth: string  // Age 5-25 validation
```

### Contact (Step 3)
```typescript
phone: string        // 10+ chars
address: string      // 5-255 chars
state: string        // Nigerian state (37 options)
lga: string         // 2-100 chars
```

### Guardian (Step 4)
```typescript
guardianName: string
guardianPhone: string
guardianEmail: string
guardianRelationship: string  // Father, Mother, Guardian, etc.
```

### Academic (Step 5)
```typescript
classId?: string            // Optional
previousSchool?: string     // Optional
```

### Documents (Step 6 - Optional)
```typescript
photo?: File          // PNG, JPG, WebP, max 5MB
birthCertificate?: File  // PDF, PNG, JPG, max 5MB
idProof?: File       // PDF, PNG, JPG, max 5MB
```

---

## 🔐 Key Security Features

| Feature | Implementation |
|---------|-----------------|
| RLS | Enabled on all tables |
| Password | 8+ chars, uppercase, lowercase, numbers |
| Email | Unique validation, format check |
| File Size | Max 5MB per file |
| File Type | Whitelist PNG, JPG, WebP, PDF |
| Age | 5-25 year validation |
| Storage | User-scoped folders in Supabase |

---

## 📊 Database Tables

```sql
-- Students (Enhanced)
CREATE TABLE students (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  admission_number TEXT UNIQUE,  -- Auto-generated: STD-YYMMDD-####
  first_name, last_name,
  gender, date_of_birth,
  phone, address, state, lga,
  guardian_* (name, phone, email, relationship),
  photo_url, birth_certificate_url, id_proof_url,
  previous_school,
  approved BOOLEAN DEFAULT false,
  created_at, updated_at
);

-- Student Documents (New)
CREATE TABLE student_documents (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students,
  document_type TEXT,  -- 'photo', 'birth_certificate', 'id_proof'
  file_name, file_url, file_size, mime_type,
  created_at
);

-- Student Approvals (New)
CREATE TABLE student_approvals (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students UNIQUE,
  status TEXT,  -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES users,
  reviewed_at TIMESTAMP,
  comments TEXT,
  created_at
);
```

---

## 🎯 Key Functions

### Registration Service
```typescript
// Register new student
registerStudent(formData, files?) → { success, userId, studentId, admissionNumber, message }

// Upload files
uploadStudentDocuments(userId, files) → { photoUrl, birthCertificateUrl, idProofUrl }

// Get pending registrations
getPendingStudents() → Array<StudentRegistration>

// Get student with documents
getStudentWithDocuments(studentId) → { student, documents, approval }

// Approve student
approveStudent(studentId, adminId, comments?) → { success, error? }

// Reject student
rejectStudent(studentId, adminId, reason) → { success, error? }

// Get statistics
getStudentRegistrationStats() → { total, approved, pending, rejected }
```

### Approval Utils
```typescript
// Export to CSV
exportPendingStudentsToCSV() → string (CSV content)

// Bulk approve
bulkApproveStudents(studentIds[], adminId) → { success, failed, errors }

// Search students
searchStudents(filters) → Array<StudentData>

// Generate report
generateApprovalReport(startDate, endDate) → ReportData
```

---

## 🧪 Common Testing Scenarios

### Test Registration Success
```
1. Fill form with valid data
2. Upload optional files
3. Submit → Check for admission number in toast
4. Verify student record in database
5. Check approval status = false
```

### Test Admin Approval
```
1. Navigate to /admin/registrations
2. Click View on pending student
3. Verify all data displays correctly
4. Click Approve with comment
5. Check database: approved = true
6. Verify approval record created
```

### Test Invalid Data
```
1. Email: "invalid-email" → Error
2. Password: "weak" → Error
3. Age: DOB = 2020 → Error (age < 5)
4. File: 10MB → Error (too large)
5. Phone: "123" → Error (too short)
```

---

## 🐛 Debugging Tips

| Issue | Check | Solution |
|-------|-------|----------|
| Admission # not generated | Database trigger | Re-run migration SQL |
| Files not uploading | Storage bucket | Create "student-documents" bucket |
| RLS blocking access | User role | Check `users.role` = 'admin' |
| Form validation failing | Zod schema | Check field types match schema |
| Environment vars missing | .env.local | Set NEXT_PUBLIC_SUPABASE_* vars |
| Storage 403 error | Bucket public | Make bucket public in Supabase |

---

## 📱 UI Components Used

- **Button** - Actions
- **Input** - Text fields
- **Label** - Field labels
- **Card** - Content containers
- **Alert** - Info/warnings
- **Select** - Dropdowns
- **Dialog** - Modals
- **Tabs** - Tab groups
- **AlertDialog** - Confirmation dialogs

All from `@/components/ui/*`

---

## 🎨 Styling Reference

```css
/* Primary Colors */
--primary: #1e40af (Blue)
--secondary: #eab308 (Gold)

/* Text Colors */
--gray-900: #1f2937 (Dark)
--gray-600: #4b5563 (Medium)
--gray-500: #6b7280 (Light)

/* Utilities */
grid-cols-1 md:grid-cols-2 → Responsive grid
space-y-4 → Vertical spacing
p-4 → Padding
rounded-lg → Border radius
shadow-xl → Elevation
```

---

## 🔄 Approval Flow State Diagram

```
REGISTERED
    ↓
[approved = false]
    ↓
PENDING ADMIN REVIEW
    ↓
    ├→ APPROVED [approved = true]
    │   ↓
    │   ACTIVE (can login)
    │
    └→ REJECTED
        ↓
        INACTIVE (removed)
```

---

## 🚨 Error Handling

```typescript
// Registration errors
- "Authentication error: {message}"
- "User record creation failed: {message}"
- "Student record creation failed: {message}"
- "File upload failed: {message}"

// Approval errors
- "Failed to approve student: {message}"
- "Failed to reject student: {message}"

// Validation errors (shown per field)
- "Email is required"
- "Password must be at least 8 characters"
- "Password must contain uppercase, lowercase, and numbers"
- "Passwords do not match"
- "Please enter a valid email address"
```

---

## 📊 Admin Dashboard Metrics

```
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│  Total Students │  Approved    │   Pending    │   Rejected   │
│      100        │      75      │      20      │       5      │
└─────────────────┴──────────────┴───���──────────┴──────────────┘
```

---

## 🔗 Related Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/auth/login` | Login page | Public |
| `/auth/register` | General registration | Public |
| `/register/student` | **Student registration** | Public |
| `/student-dashboard` | Student portal | Authenticated |
| `/admin/registrations` | **Admin approvals** | Admin only |
| `/admin/users` | Manage users | Admin only |
| `/admin/classes` | Manage classes | Admin only |

---

## 🎯 Validation Rules Summary

| Field | Rules |
|-------|-------|
| Email | Required, format, unique |
| Password | Min 8, uppercase, lowercase, numbers |
| First Name | 2-50 chars |
| Phone | 10+ chars, phone format |
| Age (from DOB) | 5-25 years |
| Address | 5-255 chars |
| File Size | Max 5MB |
| File Type | PNG, JPG, WebP, PDF |

---

## 💾 Database Indexes

```sql
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_admission ON students(admission_number);
CREATE INDEX idx_student_documents_student ON student_documents(student_id);
CREATE INDEX idx_approvals_student ON student_approvals(student_id);
CREATE INDEX idx_approvals_status ON student_approvals(status);
```

---

## 🚀 Performance Tips

1. **Pagination**: Form is multi-step (reduces initial load)
2. **Lazy Loading**: Documents loaded on demand
3. **Indexing**: Key fields indexed in database
4. **Caching**: Use SWR for API calls in future
5. **Images**: Use Next.js Image component if needed

---

## 📞 Quick Help

**How to approve students?**
→ `/admin/registrations` → Select student → Click Approve

**How to see admission number?**
→ Registration success toast shows admission number

**How to change password?**
→ Use Supabase Auth's password reset

**How to re-upload documents?**
→ Currently manual process (enhancement idea)

**How to bulk import students?**
→ Feature for Phase 2

---

## ✅ Verification Checklist

- [ ] All migrations applied
- [ ] Storage bucket created
- [ ] Form loads at `/register/student`
- [ ] Admin panel loads at `/admin/registrations`
- [ ] Can register new student
- [ ] Admission number generates
- [ ] Can upload files
- [ ] Admin can see pending students
- [ ] Admin can approve/reject
- [ ] RLS policies working
- [ ] No console errors

---

**Last Updated:** 2025-01-21
**Quick Ref Version:** 1.0
**Developers:** Ready to implement! 🚀
