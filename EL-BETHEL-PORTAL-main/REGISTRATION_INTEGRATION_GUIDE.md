# Student Registration System - Integration Guide

This guide shows how to integrate the Student Registration system into your existing El Bethel Academy Portal.

---

## 🔗 Navigation Integration

### 1. Add to Main Navigation

**File**: `components/role-nav.tsx` or your main navigation component

```tsx
import Link from 'next/link'

export function MainNavigation() {
  return (
    <nav>
      {/* ... existing navigation ... */}
      
      {/* Add Student Registration Link */}
      <Link href="/register/student" className="nav-link">
        Student Registration
      </Link>
    </nav>
  )
}
```

### 2. Add to Landing Page

**File**: `app/page.tsx`

Find the "Get Started" or CTA section and add:

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div>
      {/* ... existing content ... */}
      
      {/* Student Registration CTA */}
      <section className="py-12 bg-gradient-to-r from-primary to-secondary">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join El Bethel Academy?
          </h2>
          <p className="text-white/80 mb-6">
            Complete your registration and start your journey with us
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register/student">
                Register as Student
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/auth/login">
                Already Registered? Login
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
```

### 3. Add to Role Selection Page

**File**: `app/page.tsx` or role selection component

If you have a "Choose Your Role" section, add Student option:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Student Option */}
  <Card className="hover:shadow-lg transition">
    <CardHeader>
      <CardTitle>Student</CardTitle>
      <CardDescription>Register as a student</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-600 mb-4">
        Create an account and register for classes
      </p>
      <Button asChild className="w-full">
        <Link href="/register/student">
          Get Started
        </Link>
      </Button>
    </CardContent>
  </Card>

  {/* ... other roles ... */}
</div>
```

---

## 🔐 Authentication Integration

### 1. Update Login Page

**File**: `app/auth/login/page.tsx`

Add link to registration:

```tsx
<div className="text-center mt-6">
  <p className="text-gray-600">
    Don't have an account?{' '}
    <Link 
      href="/register/student" 
      className="text-primary font-semibold hover:underline"
    >
      Register here
    </Link>
  </p>
</div>
```

### 2. Handle Post-Registration Redirect

Already implemented in registration form (`app/register/student/page.tsx`):

```typescript
// After successful registration, redirects to:
router.push('/auth/login?message=registration-pending')
```

Update your login page to handle this message:

```tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return (
    <div>
      {message === 'registration-pending' && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Registration successful! Your account is awaiting admin approval. 
            You'll receive an email once approved.
          </AlertDescription>
        </Alert>
      )}

      {/* ... rest of login form ... */}
    </div>
  )
}
```

---

## 📊 Admin Integration

### 1. Add Admin Navigation Link

**File**: `components/admin-portal-layout.tsx` or admin navigation

```tsx
import Link from 'next/link'

export function AdminNavigation() {
  return (
    <nav className="space-y-2">
      {/* ... existing admin links ... */}

      {/* Registrations Section */}
      <div className="space-y-1">
        <p className="px-4 py-2 text-sm font-semibold text-gray-600">
          Registrations
        </p>
        <Link 
          href="/admin/registrations/pending"
          className="block px-4 py-2 hover:bg-gray-100 rounded"
        >
          Pending Approvals
        </Link>
        <Link 
          href="/admin/registrations/approved"
          className="block px-4 py-2 hover:bg-gray-100 rounded"
        >
          Approved Students
        </Link>
      </div>
    </nav>
  )
}
```

### 2. Add Admin Dashboard Widget

**File**: `app/admin-dashboard/page.tsx`

Add registration statistics:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getRegistrationStats } from '@/app/actions/registration'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export function RegistrationWidget() {
  const [stats, setStats] = useState({ pending: 0, approved: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const data = await getRegistrationStats()
      setStats(data)
      setLoading(false)
    }
    loadStats()
  }, [])

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Registrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">Pending Approval</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-gray-600">Approved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>

        {stats.pending > 0 && (
          <Button asChild className="w-full">
            <Link href="/admin/registrations/pending">
              Review {stats.pending} Pending Approvals
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 📧 Email Integration (Optional)

### 1. Send Approval Notification

**File**: `lib/email-service.ts` (create new)

```typescript
import { supabase } from './supabase-client'

export async function sendApprovalEmail(studentEmail: string, admissionNumber: string) {
  try {
    // Using Resend or SendGrid
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: studentEmail,
        template: 'student_approved',
        data: {
          admissionNumber,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendRejectionEmail(studentEmail: string, reason?: string) {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: studentEmail,
        template: 'student_rejected',
        data: {
          reason: reason || 'Your registration did not meet our requirements',
          reapplyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/register/student`,
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}
```

### 2. Update Admin Actions

**File**: `app/admin/registrations/pending/page.tsx`

Trigger email on approval:

```typescript
const approveStudent = async (studentId: string) => {
  try {
    // Approve in database
    const { error, data } = await supabase
      .from('students')
      .update({ approved: true })
      .eq('id', studentId)
      .select()

    if (error) {
      toast.error('Failed to approve student')
      return
    }

    const student = data[0]
    
    // Send email notification
    const emailSent = await sendApprovalEmail(
      student.email,
      student.admission_number
    )

    if (emailSent) {
      toast.success('Student approved and notified via email')
    } else {
      toast.success('Student approved (email notification failed)')
    }

    // Remove from list
    setStudents((prev) => prev.filter((s) => s.id !== studentId))
  } catch (error) {
    console.error('Error approving student:', error)
    toast.error('An error occurred')
  }
}
```

---

## 🔄 Database Integration

### 1. Link to Classes

The registration form allows students to select a class. Ensure your `classes` table exists:

```sql
-- Verify classes table
SELECT * FROM classes LIMIT 1;

-- Should have columns: id, name, form_level
-- Example: id=uuid, name='SS3A', form_level='SS3'
```

### 2. Student Profile Integration

After approval, students can access their profile:

**File**: `app/student/profile/page.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StudentProfile() {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setStudent(data)
      }
      
      setLoading(false)
    }

    loadProfile()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Admission Number</p>
            <p className="text-lg font-semibold">{student?.admission_number}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">
                {student?.first_name} {student?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-medium">{student?.gender}</p>
            </div>
          </div>

          {/* ... more fields ... */}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🎨 Styling & Branding

### 1. Update Form Colors

**File**: `app/register/student/page.tsx`

The form uses Tailwind color classes. Update to match your branding:

```tsx
// Change from:
className="bg-gradient-to-r from-blue-600 to-purple-600"

// To:
className="bg-gradient-to-r from-primary to-secondary"
```

The `primary` and `secondary` colors are defined in `tailwind.config.ts`:

```typescript
colors: {
  primary: { 500: '#1e40af' },      // Your brand blue
  secondary: { 500: '#eab308' }    // Your brand gold
}
```

### 2. Add Custom Branding

**File**: `app/register/student/page.tsx`

Update the header section:

```tsx
<div className="text-center mb-8">
  <div className="mb-4">
    {/* Add your school logo */}
    <img 
      src="/your-logo.svg" 
      alt="El Bethel Academy" 
      className="h-16 mx-auto"
    />
  </div>
  <h1 className="text-4xl font-bold text-gray-900 mb-2">
    Student Registration
  </h1>
  <p className="text-gray-600">
    El Bethel Academy - Excellence in Education
  </p>
</div>
```

---

## 📱 Mobile App Integration (Future)

If you plan to create a mobile app, the same API endpoints work:

```javascript
// React Native Example
const registerStudent = async (formData) => {
  const response = await fetch('https://your-api.com/api/student/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseToken}`
    },
    body: JSON.stringify(formData)
  })
  
  return response.json()
}
```

---

## 🔄 API Integration with Third Parties

### 1. Webhook for External Systems

If you need to send registration data to an external system:

**File**: `app/api/webhooks/registration/route.ts`

```typescript
export async function POST(request: Request) {
  const data = await request.json()

  try {
    // Call external API
    const response = await fetch('https://external-system.com/api/students', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return Response.json({ success: response.ok })
  } catch (error) {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### 2. Sync with External Database

Create a sync job:

```typescript
// lib/sync-external-db.ts
export async function syncStudentToExternal(studentId: string) {
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  // Send to external system
  const response = await fetch('https://external-system.com/api/students', {
    method: 'POST',
    body: JSON.stringify(student),
    headers: {
      'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`,
    },
  })

  return response.ok
}
```

---

## 🧪 Testing Integration

### 1. End-to-End Test Flow

```
1. Student navigates to /register/student
   ↓
2. Fills form and submits
   ↓
3. Redirected to /auth/login with message
   ↓
4. Admin sees pending registration at /admin/registrations/pending
   ↓
5. Admin approves
   ↓
6. Student can login
   ↓
7. Student sees profile with admission number
```

### 2. Testing Checklist

- [ ] Registration form loads
- [ ] All fields validate correctly
- [ ] Form submits successfully
- [ ] Student appears in admin dashboard
- [ ] Admin can view details
- [ ] Approval works
- [ ] Student can login after approval
- [ ] Profile shows correct data
- [ ] Emails sent (if configured)

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Database migration executed
- [ ] Storage bucket created
- [ ] Environment variables configured
- [ ] Navigation links added
- [ ] Login page updated
- [ ] Admin dashboard integrated
- [ ] Email service configured (optional)
- [ ] Testing completed
- [ ] Backup strategy in place
- [ ] Monitoring configured

---

## 📞 Support

Refer to:
- [Main README](./REGISTRATION_SYSTEM_README.md)
- [Implementation Guide](./STUDENT_REGISTRATION_IMPLEMENTATION.md)
- [Setup Checklist](./STUDENT_REGISTRATION_SETUP_CHECKLIST.md)

---

**Version**: 1.0  
**Last Updated**: 2025
