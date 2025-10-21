# Student Registration System - Complete Implementation Guide

## 📋 Overview

This document provides a comprehensive guide to the **Professional-Grade Student Registration Portal** integrated with your El Bethel Academy Portal. The system includes:

✅ **Multi-Step Form** with React Hook Form & Zod validation  
✅ **Supabase Integration** for authentication and data storage  
✅ **Automatic Admission Number Generation** with database triggers  
✅ **File Upload Support** (Passport photo, Birth Certificate, ID Proof)  
✅ **Admin Approval Workflow**  
✅ **Email Verification & Security**  
✅ **Responsive Design** matching your school's branding

---

## 🚀 Quick Start

### Prerequisites

- Supabase project already configured (using provided env vars)
- Node.js 18+ and Next.js 15+
- All UI components from Radix UI (already in your project)

### 1. Database Setup

Run the migration SQL file to add necessary fields and auto-generation functions:

**File**: `lib/student-registration-migration.sql`

Execute in your Supabase SQL Editor:

```sql
-- Copy the entire content of lib/student-registration-migration.sql
-- and execute it in Supabase Dashboard > SQL Editor
```

This will:
- Add missing columns to the `students` table
- Create auto-admission number generation function
- Create triggers for automatic updates

### 2. Enable Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a bucket named `student-documents` (if it doesn't exist)
3. Set policies to allow authenticated users to upload/read

**Sample policy**:
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'student-documents');
```

### 3. File Structure

```
EL-BETHEL-PORTAL-main/
├── app/
│   ├── register/student/
│   │   └── page.tsx (Main registration form)
│   └── actions/
│       └── registration.ts (Server actions)
├── lib/
│   ├── student-registration-migration.sql (Database setup)
│   ├── student-registration-validation.ts (Zod schemas)
│   └── student-registration-service.ts (Supabase integration)
└── STUDENT_REGISTRATION_IMPLEMENTATION.md (This file)
```

---

## 📝 Form Structure

### Multi-Step Form (6 Steps)

#### Step 1: Account Information
- Email (unique validation)
- Password (8+ chars, uppercase, lowercase, numbers)
- Confirm Password

#### Step 2: Personal Information
- First Name
- Last Name
- Gender (Male/Female/Other)
- Date of Birth (5-25 years age range)

#### Step 3: Contact Information
- Phone Number
- Address
- State (Nigerian states dropdown)
- LGA (Local Government Area)

#### Step 4: Guardian Information
- Guardian Full Name
- Guardian Phone
- Guardian Email
- Relationship (Father/Mother/Guardian/etc.)

#### Step 5: Academic Information
- Class (Optional - can be assigned later)
- Previous School (Optional)

#### Step 6: Document Upload
- Passport Photo (JPEG/PNG/WebP, max 5MB)
- Birth Certificate (PDF/Image, max 5MB)
- ID Proof (PDF/Image, max 5MB)

---

## 🛠️ Technical Implementation

### 1. Validation Schema (Zod)

**File**: `lib/student-registration-validation.ts`

Features:
- Email validation with uniqueness check
- Strong password requirements
- Age validation (5-25 years)
- Nigerian states enumeration
- File size and type validation
- Custom error messages

Usage:
```typescript
import { studentRegistrationSchema } from '@/lib/student-registration-validation'

const data = await studentRegistrationSchema.parseAsync(formData)
```

### 2. Supabase Integration

**File**: `lib/student-registration-service.ts`

Key functions:

```typescript
// Register a new student
registerStudent(formData, files)

// Upload files to storage
uploadStudentDocuments(userId, files)

// Check email existence
checkEmailExists(email)

// Fetch available classes
fetchClasses()

// Admin: Get pending students
getPendingStudents()

// Admin: Approve/Reject students
approveStudent(studentId)
rejectStudent(studentId)
```

### 3. Auto-Admission Number Generation

The database trigger automatically generates admission numbers in format:
```
STD-YY-CLASS-XXXX
Example: STD-25-SS3-1001
```

**How it works**:
1. Student registers → Student record inserted
2. Trigger fires `generate_admission_number()` function
3. Admission number auto-generated and stored
4. Admin can approve with admission number already assigned

### 4. File Upload Process

Files are uploaded to Supabase Storage with structure:
```
student-documents/
└── {userId}/
    ├── passport_photo_{timestamp}
    ���── birth_certificate_{timestamp}
    └── id_proof_{timestamp}
```

URLs are stored in the `students` table for easy access.

---

## 🔐 Security & Validation

### Authentication Flow
1. User submits registration form
2. Email uniqueness verified (server-side)
3. Supabase Auth creates user with password
4. User record created in `public.users` table
5. Student record created with `approved = false`
6. Admin notified of pending approval

### Email Verification (Optional Setup)
To require email verification:
1. Go to Supabase Dashboard → Authentication → Settings
2. Enable "Confirm email" option
3. Users will receive confirmation email

### Data Validation
- Client-side: React Hook Form + Zod
- Server-side: Supabase policies and triggers
- Database constraints: CHECK constraints, UNIQUE indexes

---

## 📊 Database Schema

### Students Table Extensions

```sql
ALTER TABLE students ADD COLUMN (
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  state TEXT,
  lga TEXT,
  guardian_relationship TEXT,
  previous_school TEXT,
  photo_url TEXT,
  birth_certificate_url TEXT,
  id_proof_url TEXT,
  approved BOOLEAN DEFAULT FALSE
);
```

### Sequences & Triggers

- **admission_number_seq**: Auto-increments admission number sequence
- **trigger_auto_admission_number**: Generates admission number on insert
- **trigger_update_students_timestamp**: Updates timestamp on modification

---

## 🎨 UI/UX Features

### Design System
- Tailwind CSS for styling
- Radix UI components for accessibility
- Dark mode support via `next-themes`
- School branding colors (primary blue, secondary gold)

### User Experience
- Multi-step form with progress indicator
- Step validation before proceeding
- Clear error messages
- Toast notifications (via Sonner)
- Responsive design (mobile-first)
- Accessibility: ARIA labels, keyboard navigation

### Animations
- Step transitions
- Progress indicator animations
- Loading states with spinners
- Success/error toast notifications

---

## 🔌 Integration Points

### Navigation Links
Add these links to your main navigation:

```tsx
// Student Login
<Link href="/auth/login">Student Login</Link>

// Student Registration
<Link href="/register/student">Student Registration</Link>
```

### Landing Page CTA
Update your landing page (`app/page.tsx`) to link to registration:

```tsx
<Button asChild>
  <Link href="/register/student">Register as Student</Link>
</Button>
```

---

## 👨‍💼 Admin Approval Workflow

### Create Admin Panel
Create `app/admin/registrations/pending/page.tsx`:

```typescript
import { getPendingStudents, approveStudent, rejectStudent } from '@/app/actions/registration'
import { Button } from '@/components/ui/button'

export default async function PendingStudents() {
  const students = await getPendingStudents()

  return (
    <div className="space-y-4">
      {students.map((student) => (
        <div key={student.id} className="p-4 border rounded-lg">
          <h3>{student.first_name} {student.last_name}</h3>
          <p>Email: {student.email}</p>
          <p>Applied: {new Date(student.created_at).toLocaleDateString()}</p>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={() => approveStudent(student.id)}>
              Approve
            </Button>
            <Button variant="destructive" onClick={() => rejectStudent(student.id)}>
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 🧪 Testing

### Test Email
```
test@example.com
Password: TestPassword123
```

### Test Data
- Name: Test Student
- DOB: 01/01/2008 (age ~16)
- Gender: Male
- Phone: +2348000000000
- State: Lagos
- Guardian: Parent Name

### Verify in Supabase
1. Check `students` table for new record
2. Verify `admission_number` auto-generated
3. Check `users` table for new user record
4. Verify files in Storage bucket

---

## 🐛 Troubleshooting

### Email Already Registered
- **Error**: "Email already registered"
- **Solution**: Email uniqueness check is working. Use different email.

### Admission Number Not Generated
- **Cause**: Migration SQL not executed
- **Solution**: Run `lib/student-registration-migration.sql` in Supabase

### File Upload Fails
- **Cause**: Storage bucket doesn't exist or policies not set
- **Solution**: Create `student-documents` bucket with proper policies

### Form Validation Errors
- **Cause**: Invalid input format
- **Solution**: Check error messages for specific field requirements

### Supabase Connection Issues
- **Cause**: Missing environment variables
- **Solution**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📧 Email Templates (Future)

Implement email notifications:

```typescript
// Email on registration
- Welcome email with instructions
- Confirmation link (if email verification enabled)

// Email on approval
- Admission number assigned
- Login instructions
- Portal access details

// Email on rejection
- Reason for rejection
- Reapplication instructions
```

---

## 🔄 Continuous Improvements

### Phase 2 Enhancements
- [ ] SMS notifications (via Twilio)
- [ ] WhatsApp notifications
- [ ] Email verification with link
- [ ] Document verification checklist
- [ ] Student bio data import from Excel
- [ ] Guardian portal access
- [ ] Payment integration for registration fee

### Phase 3 Advanced Features
- [ ] AI-powered document verification
- [ ] Liveness detection for photo
- [ ] Auto-class assignment based on placement exam
- [ ] Bulk import from previous school
- [ ] Document retention policy

---

## 📞 Support & Maintenance

### Regular Maintenance
- Monitor pending registrations dashboard
- Archive old registration records (annually)
- Update class offerings
- Review and update validation rules

### Performance Optimization
- Index on `approved` field
- Cache class list
- Paginate student listings
- Compress uploaded files

---

## 📚 API Reference

### Server Actions (`app/actions/registration.ts`)

```typescript
// Check email uniqueness
checkEmailUniqueness(email): Promise<{ available: boolean }>

// Get available classes
getAvailableClasses(): Promise<Array<{ id, name, form_level }>>

// Create registration
createStudentRegistration(formData): Promise<{ success, studentId, admissionNumber }>

// Get stats
getRegistrationStats(): Promise<{ pending, approved, total }>

// Approve/Reject
approveStudentRegistration(studentId): Promise<{ success, data }>
rejectStudentRegistration(studentId, reason?): Promise<{ success, message }>
```

### Service Functions (`lib/student-registration-service.ts`)

```typescript
registerStudent(formData, files)
uploadStudentDocuments(userId, files)
checkEmailExists(email)
fetchClasses()
getPendingStudents()
approveStudent(studentId)
rejectStudent(studentId)
```

---

## 🎓 Best Practices

1. **Always validate on both client and server**
2. **Never expose sensitive file paths in UI**
3. **Use Row-Level Security (RLS) policies in Supabase**
4. **Implement rate limiting for registration endpoints**
5. **Log registration attempts for audit trail**
6. **Archive old records regularly**
7. **Use environment variables for sensitive data**

---

## 📝 Changelog

**v1.0 - Initial Release**
- Multi-step registration form
- Supabase integration
- Auto-admission number generation
- File upload support
- Admin approval workflow

---

## 📄 License

This implementation is part of El Bethel Academy Portal and follows your project's license.

---

For questions or issues, contact your development team.
