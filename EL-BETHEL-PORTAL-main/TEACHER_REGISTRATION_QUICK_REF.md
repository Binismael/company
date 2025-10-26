# Teacher Registration System - Quick Reference

## 🚀 Quick Start

### 1. Database Setup (One-time)
Run the SQL setup script in Supabase SQL Editor:
- **File:** `TEACHER_REGISTRATION_SETUP.sql`
- **What it does:** Creates/verifies tables and adds sample data

### 2. Access the Form
**URL:** `http://localhost:3000/admin/registrations/create-teacher`

### 3. Fill the Form
| Field | Required | Notes |
|-------|----------|-------|
| First Name | ✅ | |
| Last Name | ✅ | |
| Email | ✅ | Must be unique, valid format |
| Password | ✅ | Min 6 characters |
| Confirm Password | ✅ | Must match password |
| Phone | ❌ | Optional |
| Qualification | ❌ | Optional (e.g., B.Ed, M.Sc) |
| Classes | ❌ | Select one or more |
| Subjects | ❌ | Select one or more |

### 4. Submit
Click "Create Teacher" button

### 5. Success
View registration details and choose to create another or return

---

## 📂 Files Created/Modified

### New Files (3)
```
app/api/teachers/register/route.ts          # Registration API endpoint
app/api/teachers/dropdown-data/route.ts     # Fetch classes/subjects
app/admin/registrations/create-teacher/page.tsx  # Registration form UI
```

### Modified Files (2)
```
lib/admin-service.ts                        # Added createTeacherWithAssignments()
app/admin/registrations/page.tsx            # Added Create Teacher button
```

### Documentation Files (3)
```
TEACHER_REGISTRATION_GUIDE.md               # Detailed implementation guide
TEACHER_REGISTRATION_SETUP.sql              # Database setup SQL
TEACHER_REGISTRATION_QUICK_REF.md          # This file
```

---

## 🔌 API Endpoints

### Register Teacher
```
POST /api/teachers/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+234800123456",
  "qualification": "B.Ed",
  "assignedClasses": ["uuid1", "uuid2"],
  "assignedSubjects": ["uuid3", "uuid4"]
}

Response: { success: true, message: "...", data: {...} }
```

### Get Dropdown Data
```
GET /api/teachers/dropdown-data

Response: {
  success: true,
  classes: [{id, name, form_level}, ...],
  subjects: [{id, name, code}, ...]
}
```

---

## 🗄️ Database Schema

### users (existing)
```
id, auth_id, email, full_name, role, phone_number, metadata, ...
- role: 'teacher' for teachers
- metadata: {qualification: "..."} for additional info
```

### classes (existing)
```
id, name, form_level, class_teacher_id, capacity, created_at, updated_at
- form_level: 'JSS1', 'JSS2', 'SS1', etc.
```

### subjects (existing)
```
id, name, code, description, created_at, updated_at
- code: 'MATH', 'ENG', etc.
```

### class_subjects (existing)
```
id, class_id, subject_id, teacher_id, created_at
- Links teacher to class-subject combination
```

---

## ✅ Verification Checklist

- [ ] Database tables created (run TEACHER_REGISTRATION_SETUP.sql)
- [ ] Classes exist in database (at least 2-3)
- [ ] Subjects exist in database (at least 2-3)
- [ ] class_subjects combinations exist
- [ ] Can access `/admin/registrations/create-teacher`
- [ ] Form loads without errors
- [ ] Dropdowns show classes and subjects
- [ ] Can submit registration form
- [ ] Success page displays after submission
- [ ] Check database for new user record with role='teacher'
- [ ] Check class_subjects for teacher assignments

---

## 🐛 Common Issues & Fixes

### **Issue:** "Classes/Subjects not loading"
**Solution:**
1. Check Supabase connection
2. Verify classes/subjects tables have data
3. Open browser DevTools → Network tab → check API response
4. Check console for errors

### **Issue:** "Email already exists"
**Solution:**
1. Use a unique email address
2. Check if user already registered in Supabase

### **Issue:** "Form validation errors"
**Solution:**
1. Ensure email format is valid (contains @)
2. Password must be 6+ characters
3. Passwords must match
4. All required fields must be filled

### **Issue:** "Teacher not saved to database"
**Solution:**
1. Check browser console for JavaScript errors
2. Check API response (DevTools → Network)
3. Verify Supabase is accessible
4. Check Supabase RLS policies allow inserts

### **Issue:** "Classes/subjects not assigned"
**Solution:**
1. Verify you selected at least one class and subject
2. Check class_subjects table has these combinations
3. Verify teacher_id is being updated in class_subjects

---

## 🔐 Security Notes

- Passwords are hashed by Supabase Auth
- Email must be unique (enforced by Supabase)
- Consider adding admin-only access to the registration page
- Qualification and other sensitive data can be encrypted if needed
- Use environment variables for API keys

---

## 📱 Usage Examples

### In Admin Dashboard
```tsx
import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <Link href="/admin/registrations/create-teacher">
      <Button>Register New Teacher</Button>
    </Link>
  )
}
```

### In Backend Service
```typescript
import { createTeacherWithAssignments } from '@/lib/admin-service'

const result = await createTeacherWithAssignments(
  'teacher@example.com',
  'password123',
  'John',
  'Doe',
  '+234800123456',
  'B.Ed Mathematics',
  ['class-uuid-1'],
  ['subject-uuid-1']
)
```

---

## 📊 Success Indicators

After registration, you should see:
1. ✅ Success confirmation page
2. ✅ New record in `users` table with role='teacher'
3. ✅ Updated `class_subjects` records with teacher_id
4. ✅ Teacher can login with email/password (in login flow)

---

## 📖 Additional Resources

- **Full Guide:** `TEACHER_REGISTRATION_GUIDE.md`
- **Database Setup:** `TEACHER_REGISTRATION_SETUP.sql`
- **API Code:** `app/api/teachers/*`
- **UI Code:** `app/admin/registrations/create-teacher/page.tsx`
- **Service:** `lib/admin-service.ts` → `createTeacherWithAssignments()`

---

## 🎯 Next Steps

1. Run database setup SQL
2. Test the registration form
3. Verify data in Supabase
4. Add navigation links from admin dashboard
5. Set up admin-only access control
6. Consider adding bulk import feature

---

## 📞 Support

For detailed information, see `TEACHER_REGISTRATION_GUIDE.md`

Common commands:
```bash
# Check if dev server is running
curl http://localhost:3000/api/teachers/dropdown-data

# Check Supabase connection
# Use Supabase dashboard → SQL Editor to run verification queries
```

---

**Version:** 1.0  
**Last Updated:** 2025  
**Status:** Ready to Use ✅
