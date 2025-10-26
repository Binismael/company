# Teacher Registration System - Complete Implementation Guide

## 📋 Overview

This guide provides a comprehensive walkthrough of the complete teacher registration system for the El Bethel Academy Portal. Teachers can register themselves with profile information and be assigned to multiple classes and subjects.

---

## 🎯 Features

✅ **Full Teacher Registration Flow**
- Personal information (First Name, Last Name, Phone, Qualification)
- Email and password-based authentication
- Class assignment (multiple classes supported)
- Subject assignment (multiple subjects supported)

✅ **Secure Implementation**
- Password validation (minimum 6 characters)
- Password confirmation matching
- Supabase Auth integration
- Email uniqueness validation

✅ **Database Integration**
- Automatic user creation in `users` table with role="teacher"
- Class-subject assignment via `class_subjects` table
- Qualification stored in user metadata

✅ **User Experience**
- Success confirmation page with registration details
- Loading states for dropdowns
- Form validation with error messages
- Toast notifications for feedback

---

## 🏗️ Architecture

### Database Schema (Existing)

The implementation uses the existing database tables:

```
users (id, email, full_name, role, phone_number, metadata, ...)
classes (id, name, form_level, ...)
subjects (id, name, code, ...)
class_subjects (id, class_id, subject_id, teacher_id, ...)
```

**Note:** The system does NOT require a separate "teachers" table. Instead, it uses:
- `users` table with `role='teacher'`
- `class_subjects` table to link teachers to classes and subjects

### API Endpoints

#### 1. **Teacher Registration**
```
POST /api/teachers/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "secure_password_123",
  "phone": "+234 800 000 0000",
  "qualification": "B.Ed, M.Sc",
  "assignedClasses": ["class-id-1", "class-id-2"],
  "assignedSubjects": ["subject-id-1", "subject-id-2"]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Teacher registered successfully!",
  "data": {
    "userId": "user-uuid",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "classesAssigned": 2,
    "subjectsAssigned": 2
  }
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Error message describing what went wrong"
}
```

#### 2. **Fetch Dropdown Data**
```
GET /api/teachers/dropdown-data
```

**Response (Success - 200):**
```json
{
  "success": true,
  "classes": [
    { "id": "uuid", "name": "SS1 Science", "form_level": "SS1" },
    { "id": "uuid", "name": "SS1 Arts", "form_level": "SS1" }
  ],
  "subjects": [
    { "id": "uuid", "name": "Mathematics", "code": "MATH" },
    { "id": "uuid", "name": "English Language", "code": "ENG" }
  ]
}
```

### File Structure

```
app/
├── api/
│   └── teachers/
│       ├── register/
│       │   └── route.ts          # Teacher registration endpoint
│       └── dropdown-data/
│           └── route.ts           # Fetch classes and subjects
├── admin/
│   └── registrations/
│       └── create-teacher/
│           └── page.tsx           # Teacher registration UI
└── actions/
    └── registration.ts

lib/
├── admin-service.ts               # Service functions (updated)
└── supabase-client.ts

components/
└── ui/
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    ├── alert.tsx
    └── ...
```

---

## 🚀 How It Works

### Registration Flow

1. **User Access**: Admin navigates to `/admin/registrations/create-teacher`

2. **Load Data**: Page fetches available classes and subjects from `/api/teachers/dropdown-data`

3. **Fill Form**: User enters:
   - First Name, Last Name
   - Email, Password, Confirm Password
   - Phone (optional), Qualification (optional)
   - Select classes (checkboxes)
   - Select subjects (checkboxes)

4. **Validate**: Form validation checks:
   - Required fields (First Name, Last Name, Email, Password)
   - Valid email format
   - Password length ≥ 6 characters
   - Passwords match

5. **Submit**: POST request to `/api/teachers/register` with form data

6. **Backend Processing**:
   - Create Supabase Auth user
   - Insert user profile into `users` table with role='teacher'
   - Assign teacher to class-subject combinations via `class_subjects` table
   - Store qualification in user metadata

7. **Success Page**: Display registration details and options to create another or return

---

## 🔧 Implementation Details

### API Route: `/api/teachers/register`

**Key Logic:**

1. Validates input data
2. Creates auth user via `supabase.auth.signUp()`
3. Inserts user profile:
   ```sql
   INSERT INTO users (id, auth_id, email, full_name, role, phone_number)
   VALUES (user_id, user_id, email, fullName, 'teacher', phone)
   ```

4. Assigns to classes and subjects:
   ```sql
   UPDATE class_subjects 
   SET teacher_id = user_id 
   WHERE class_id IN (...) AND subject_id IN (...)
   ```

5. Stores qualification in metadata (if provided)

### Frontend: `/admin/registrations/create-teacher/page.tsx`

**Key Features:**

- React hooks for state management (`useState`, `useEffect`)
- Controlled form inputs
- Client-side validation with error display
- Checkbox groups for multi-select (classes and subjects)
- Loading states during API calls
- Success confirmation page
- Toast notifications via `sonner`

---

## 📝 Database Preparation

### Ensure Tables Exist

If not already created, run these SQL commands in Supabase SQL Editor:

```sql
-- Verify users table has role and metadata columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Verify classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  form_level TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verify subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verify class_subjects table
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, subject_id)
);
```

### Sample Data

Insert sample classes and subjects (if needed):

```sql
-- Insert sample classes
INSERT INTO public.classes (name, form_level) VALUES
('JSS1 A', 'JSS1'),
('JSS1 B', 'JSS1'),
('JSS2 A', 'JSS2'),
('SS1 A', 'SS1'),
('SS1 B', 'SS1');

-- Insert sample subjects
INSERT INTO public.subjects (name, code) VALUES
('Mathematics', 'MATH'),
('English Language', 'ENG'),
('Physics', 'PHY'),
('Chemistry', 'CHEM'),
('Biology', 'BIO'),
('History', 'HIST'),
('Geography', 'GEO');

-- Create class-subject combinations (without teachers initially)
INSERT INTO public.class_subjects (class_id, subject_id) VALUES
(SELECT id FROM classes WHERE name='SS1 A', SELECT id FROM subjects WHERE code='MATH'),
(SELECT id FROM classes WHERE name='SS1 A', SELECT id FROM subjects WHERE code='ENG'),
... etc
```

---

## 🧪 Testing the Implementation

### Manual Testing Steps

1. **Navigate to Registration Page**
   ```
   URL: http://localhost:3000/admin/registrations/create-teacher
   ```

2. **Fill in Test Data**
   ```
   First Name: John
   Last Name: Doe
   Email: john.doe@test.com
   Password: TestPassword123
   Confirm Password: TestPassword123
   Phone: +234 800 123 4567
   Qualification: B.Ed Mathematics
   Classes: Select 2-3 classes
   Subjects: Select 2-3 subjects
   ```

3. **Submit Form**
   - Click "Create Teacher" button
   - Should see loading state
   - Should see success page with registration details

4. **Verify Database**
   ```sql
   -- Check user created in users table
   SELECT * FROM public.users WHERE email='john.doe@test.com';
   
   -- Check class-subject assignments
   SELECT cs.*, c.name as class_name, s.name as subject_name 
   FROM public.class_subjects cs
   JOIN public.classes c ON cs.class_id = c.id
   JOIN public.subjects s ON cs.subject_id = s.id
   WHERE cs.teacher_id = (SELECT id FROM users WHERE email='john.doe@test.com');
   ```

### API Testing with cURL

```bash
# Test registration endpoint
curl -X POST http://localhost:3000/api/teachers/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@test.com",
    "password": "SecurePass123",
    "phone": "+234 800 987 6543",
    "qualification": "PGDE Physics",
    "assignedClasses": ["class-uuid-1", "class-uuid-2"],
    "assignedSubjects": ["subject-uuid-1"]
  }'

# Test dropdown data endpoint
curl http://localhost:3000/api/teachers/dropdown-data
```

---

## 🔐 Security Considerations

1. **Password Security**
   - Minimum 6 characters enforced
   - Supabase handles secure hashing

2. **Email Validation**
   - Format validation on frontend
   - Uniqueness check by Supabase Auth

3. **Database Access**
   - Supabase client uses public/anon key for registration
   - Should be fine for new user signup
   - Consider RLS policies for production

4. **Authorization**
   - Page should be protected to admin users only
   - Consider adding middleware to `/admin/registrations`

---

## 🐛 Troubleshooting

### Issue: "Classes/Subjects not loading"
**Solution:**
- Check Supabase connection in `lib/supabase-client.ts`
- Verify tables exist in Supabase
- Check browser console for API errors
- Ensure environment variables are set

### Issue: "Registration fails with auth error"
**Solution:**
- Check if email is already registered
- Verify password meets requirements
- Check Supabase Auth logs
- Ensure service role key is configured

### Issue: "Teachers not assigned to classes/subjects"
**Solution:**
- Verify class-subject combinations exist in `class_subjects` table
- Check if teacher_id field exists in `class_subjects` table
- Verify selected classes/subjects are valid UUIDs

### Issue: "Form shows validation errors"
**Solution:**
- Ensure all required fields are filled
- Check email format (must contain @)
- Verify passwords match
- Password must be at least 6 characters

---

## 📚 Integration with Existing System

### Linking to Registration Pages

Update `/app/admin/registrations/page.tsx` to include link to teacher registration:

```tsx
import Link from 'next/link'

export default function RegistrationsPage() {
  return (
    <div className="space-y-4">
      <Link href="/admin/registrations/create-teacher">
        <Button>Create Teacher</Button>
      </Link>
      <Link href="/admin/registrations/create-student">
        <Button>Create Student</Button>
      </Link>
    </div>
  )
}
```

### Service Function Usage

Use `createTeacherWithAssignments` in other parts of the application:

```typescript
import { createTeacherWithAssignments } from '@/lib/admin-service'

// In your code
const result = await createTeacherWithAssignments(
  'teacher@example.com',
  'password123',
  'John',
  'Doe',
  '+234800123456',
  'B.Ed',
  ['class-id-1'],
  ['subject-id-1']
)
```

---

## 🎓 Next Steps

1. **Test the System**: Follow the testing steps above
2. **Customize UI**: Update styles in `create-teacher/page.tsx` as needed
3. **Add Navigation**: Link to the teacher registration page from admin dashboard
4. **Configure Permissions**: Set up admin-only access restrictions
5. **Add Bulk Upload**: Consider adding CSV import for bulk teacher registration
6. **Integration Tests**: Create automated tests for the registration flow

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase logs
3. Check browser console for client-side errors
4. Verify database schema matches documentation

---

## 📄 Version History

- **v1.0** (Current): Complete teacher registration system with class/subject assignment
