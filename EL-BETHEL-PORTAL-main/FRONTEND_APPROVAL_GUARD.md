# Frontend Approval Guard Implementation

This guide explains the frontend approval guard system that prevents unapproved students from accessing the student portal.

---

## Overview

The frontend approval guard is a React hook that checks if a student's account has been approved by an admin before allowing access to protected pages. If the student is not approved, they are automatically redirected to the `/pending-approval` page.

**Key Features:**
- ✅ Automatic approval status verification
- ✅ Redirect to pending page if not approved
- ✅ Loading state handling
- ✅ Reusable hook pattern
- ✅ Works with Next.js App Router

---

## Architecture

### Components Involved:

1. **`useStudentApprovalGuard` Hook** (`hooks/use-student-approval-guard.tsx`)
   - Checks if current user is authenticated
   - Fetches student approval status from Supabase
   - Redirects if not approved
   - Returns loading state and approval status

2. **Student Portal Layout** (`components/student-portal-layout.tsx`)
   - Uses the approval guard hook
   - Shows loading state while checking approval
   - Blocks UI if user is not approved

3. **Student Dashboard** (`app/student-dashboard/page.tsx`)
   - Uses the approval guard hook
   - Double-checks approval status
   - Prevents data loading if not approved

4. **Pending Approval Page** (`app/pending-approval/page.tsx`)
   - Shows message to unapproved students
   - Displays registration details
   - "Check Status Again" button
   - Logout button

---

## How It Works

### Step 1: Student Logs In
```
User → Login Page → Email + Password
    ↓
Supabase Auth validates credentials
    ↓
User authenticated (session created)
```

### Step 2: Student Tries to Access Portal
```
Student navigates to /student-dashboard
    ↓
StudentPortalLayout component mounts
    ↓
useStudentApprovalGuard() hook runs
```

### Step 3: Approval Check
```
Hook fetches current authenticated user
    ↓
Hook queries students table: SELECT approved WHERE user_id = ?
    ↓
If approved = true → Render dashboard
    ↓
If approved = false → Redirect to /pending-approval
```

### Step 4: Unapproved Student Flow
```
User sees pending approval message
    ↓
Option 1: Click "Check Status Again" → Re-runs approval check
    ↓
Option 2: Click "Log Out" → Sign out and return to login
```

---

## Implementation Details

### `useStudentApprovalGuard` Hook

**Location:** `hooks/use-student-approval-guard.tsx`

```typescript
interface UseStudentApprovalGuardResult {
  isLoading: boolean      // True while checking status
  isApproved: boolean     // True if student.approved = true
  error: string | null    // Error message if something fails
  studentId: string | null // ID of approved student
}

export function useStudentApprovalGuard(): UseStudentApprovalGuardResult
```

**Usage in Component:**

```typescript
import { useStudentApprovalGuard } from '@/hooks/use-student-approval-guard'

export default function MyPage() {
  const { isLoading, isApproved, error } = useStudentApprovalGuard()

  if (isLoading) return <LoadingSpinner />
  if (!isApproved) return <PendingApprovalMessage />

  return <ProtectedContent />
}
```

---

## Protected Pages

The following pages now have approval guards:

### 1. **Student Portal Layout**
- **Path:** `components/student-portal-layout.tsx`
- **Protection:** Entire student portal sidebar + navigation
- **Behavior:** Shows loading spinner while checking, blocks UI if not approved

### 2. **Student Dashboard**
- **Path:** `app/student-dashboard/page.tsx`
- **Protection:** Dashboard overview, stats, assignments, exams
- **Behavior:** Double-checks approval, shows pending message if not approved

### 3. **Student Routes** (via StudentPortalLayout)
- `/student/profile`
- `/student/exams`
- `/student/results`
- `/student/assignments`
- `/student/payments`
- `/student/courses`
- `/student/attendance`
- `/student/messages`
- `/student/ai-tutor`
- `/student/settings`
- `/student/support`

All inherit the protection from `StudentPortalLayout`.

---

## Pending Approval Page

**Path:** `app/pending-approval/page.tsx`

Shows unapproved students:

- ✅ Registration confirmation message
- ✅ Student information summary
  - Name
  - Registration number
  - Class + Section
  - Email
  - Days since registration
- ✅ "What happens next?" timeline
- ✅ "Check Approval Status" button (polls approval status)
- ✅ "Log Out" button

**Example Flow:**

```
Student sees: "Your account is pending approval"
             "Registered 2 days ago"
             [Check Approval Status] [Log Out]
                          ↓
              (clicks Check Status)
                          ↓
             Admin approves → immediate redirect
             Admin not approved yet → shows error message
```

---

## Security Notes

### ✅ What's Protected:

1. **Database Level:**
   - RLS policies prevent unapproved students from reading most data
   - Only approved students can see their own records

2. **Frontend Level:**
   - Approval check prevents UI from loading
   - Redirect to pending page happens automatically
   - No sensitive data visible to unapproved users

### ⚠️ Not Protected (frontend only):

If a user somehow bypasses the frontend check (e.g., via browser DevTools), the backend RLS policies will still block their queries. The frontend guard is for UX convenience, not security.

---

## Error Handling

### If Approval Check Fails:

```typescript
{
  isLoading: false,
  isApproved: false,
  error: "Failed to verify account status",
  studentId: null
}
```

**Possible Error Messages:**
- "Not authenticated" → User not logged in
- "Failed to verify account status" → Database error
- "Student record not found" → No student record for this user

---

## Adding Approval Guard to New Pages

To protect a new student page with approval guard:

### Option A: Use the Hook (Recommended)

```typescript
'use client'

import { useStudentApprovalGuard } from '@/hooks/use-student-approval-guard'

export default function MyNewPage() {
  const { isLoading, isApproved } = useStudentApprovalGuard()

  if (isLoading) return <LoadingSpinner />
  if (!isApproved) return null // Hook redirects automatically

  return <PageContent />
}
```

### Option B: Use StudentPortalLayout (Recommended)

If the page is already wrapped in `StudentPortalLayout`, it's automatically protected:

```typescript
import StudentPortalLayout from '@/components/student-portal-layout'

export default function MyPage() {
  return (
    <StudentPortalLayout>
      <PageContent />
    </StudentPortalLayout>
  )
}
```

---

## Testing the Guard

### Test 1: Unapproved Student Access

1. Go to `/auth/register`
2. Create a student account
3. Try to access `/student-dashboard`
4. **Expected:** Redirect to `/pending-approval`

### Test 2: After Approval

1. Log in to `/auth/login` with admin account
2. Go to `/admin/registrations/pending`
3. Approve the student from Test 1
4. Log out and log back in as that student
5. **Expected:** Can access `/student-dashboard`

### Test 3: Status Check Button

1. As unapproved student, go to `/pending-approval`
2. Click "Check Approval Status"
3. **Expected:** Shows "still pending" message
4. (Have admin approve while you wait)
5. Click "Check Approval Status" again
6. **Expected:** Redirects to `/student-dashboard`

---

## Customizing the Guard

### Change Redirect URL

In `hooks/use-student-approval-guard.tsx`:

```typescript
// Change this:
router.push('/pending-approval')

// To something else:
router.push('/approval-pending') // or any other URL
```

### Change Loading Component

In `components/student-portal-layout.tsx`:

```typescript
if (approvalLoading) {
  return (
    <div>YOUR_CUSTOM_LOADING_COMPONENT</div>
  )
}
```

### Add Approval Check to Admin Pages

```typescript
// In admin dashboard
const { isLoading, isApproved } = useStudentApprovalGuard()

// This would fail for admin (they don't have a student record)
// So instead, check user role first:

const [userRole, setUserRole] = useState<string | null>(null)

useEffect(() => {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
  setUserRole(userData?.[0].role)
}, [])

// Only run guard for students
if (userRole === 'student') {
  const approval = useStudentApprovalGuard()
  if (!approval.isApproved) return <PendingMessage />
}
```

---

## Performance Notes

**Approval Check Queries:**

Each guard check runs one query:

```sql
SELECT id, approved, user_id 
FROM students 
WHERE user_id = 'current_user_id'
LIMIT 1
```

**Optimization Tips:**

1. **Caching:** You could cache approval status in React Context
2. **Subscription:** Use Supabase real-time subscriptions for instant updates
3. **Session:** Store in sessionStorage after first check

Example with caching:

```typescript
const approvalStatus = sessionStorage.getItem('student_approved')

if (approvalStatus) {
  setIsApproved(approvalStatus === 'true')
} else {
  // fetch and cache
  const { data: student } = await supabase...
  sessionStorage.setItem('student_approved', String(student.approved))
}
```

---

## FAQ

### Q: What if a student's approval status changes while they're logged in?

A: They would see the pending page next time they reload. Use Supabase real-time subscriptions to update in real-time:

```typescript
supabase
  .channel(`public:students:user_id=eq.${user.id}`)
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'students' },
    (payload) => {
      setIsApproved(payload.new.approved)
    }
  )
  .subscribe()
```

### Q: Can I show a "pending" badge in the navbar?

A: Yes, use the hook:

```typescript
const { isApproved } = useStudentApprovalGuard()

return (
  <>
    {!isApproved && <Badge>Pending Approval</Badge>}
    <Navbar />
  </>
)
```

### Q: What if the approval check fails with an error?

A: The hook returns the error. You can display it:

```typescript
const { error } = useStudentApprovalGuard()

if (error) {
  return (
    <Alert>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}
```

### Q: Can non-student users (teachers, admin) access the approval guard?

A: The hook assumes there's a `students` record. For non-students, it would fail. To handle this, check user role first:

```typescript
const [userRole, setUserRole] = useState<string | null>(null)

// Fetch user role
// Only use guard if role === 'student'
```

---

## Troubleshooting

### Issue: "Infinite redirect loop"

**Cause:** The hook keeps redirecting to `/pending-approval` because the page itself also uses the guard.

**Solution:** Don't use the guard on `/pending-approval` page.

---

### Issue: "Hook called at wrong time" or "can't use hooks conditionally"

**Cause:** Trying to use the hook inside a conditional.

**Solution:** Always call hooks at component level, never inside `if` statements.

```typescript
// �� Wrong
if (userRole === 'student') {
  const approval = useStudentApprovalGuard()
}

// ✅ Right
const approval = useStudentApprovalGuard()

if (approval.isApproved || userRole !== 'student') {
  return <PageContent />
}
```

---

### Issue: "Students can see pending page by manually typing /pending-approval"

**Expected:** Approved students should be redirected away from pending page.

**Current Behavior:** Page just shows their info.

**Enhancement:** Add guard to pending page too:

```typescript
// In /pending-approval/page.tsx
if (isApproved) {
  router.push('/student-dashboard')
}
```

---

## Summary

**Frontend Approval Guard System:**
- ✅ Reusable hook: `useStudentApprovalGuard()`
- ✅ Protects: Student portal, dashboard, all student routes
- ✅ Redirects: Unapproved students to `/pending-approval`
- ✅ UX-friendly: Loading states, error handling, status check button
- ✅ Secure: Backend RLS policies enforce security regardless

**Next Steps:**
1. Test the guard with unapproved student account
2. Verify admin approval flow
3. Customize pending page if needed
4. Add to any new student pages
