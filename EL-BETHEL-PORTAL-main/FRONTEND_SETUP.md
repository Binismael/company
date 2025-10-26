# El Bethel Academy Portal - Frontend Implementation Guide

## 🎯 Overview

This document provides a complete guide to the frontend implementation of the El Bethel Academy portal. The system is fully connected to Supabase and includes comprehensive UI components for Students, Teachers, and Admins.

---

## 📦 What's Included

### ✅ Completed Modules

#### 1. **Authentication System** (`/app/auth`)
- **Login Page** (`/auth/login`) - Multi-tab login for students (registration # or email), teachers, and admins
- **Registration** (`/auth/register`) - Role-based registration flow
- **Password Recovery** (`/auth/forgot-password`)
- **Password Reset** (`/auth/reset-password`)

#### 2. **Student Portal** (`/app/student`)
- **Dashboard** (`/student-dashboard`) - Overview with stats, upcoming exams, classes, fees summary
- **Exams** (`/student/exams`) - View upcoming, active, and completed exams
- **Results** (`/student/results`) - View grades and performance by term
- **Payments** (`/student/payments`) - Fee payment with **Paystack integration**
- **Attendance** (`/student/attendance`) - Track attendance records
- **Messages** (`/student/messages`) - Announcements and messages

#### 3. **Teacher Portal** (`/app/teacher`)
- **Dashboard** (`/teacher-dashboard`) - Overview with classes, subjects, pending grading
- **Students** (`/teacher/students`) - Manage students in assigned classes
- **Exams** (`/teacher/exams`) - Create and manage exams
- **Attendance** (`/teacher/attendance`) - Take attendance
- **Results** (`/teacher/results`) - Grade exam results
- **Messages** (`/teacher/messages`) - Communicate with students

#### 4. **Admin Portal** (`/app/admin`)
- **Dashboard** (`/admin-dashboard`) - System overview with all metrics
- **Users Management** (`/admin/users`) - Manage all users
- **Classes** (`/admin/classes`) - Create and manage classes
- **Subjects** (`/admin/subjects`) - Manage subjects
- **Exams** (`/admin/exams`) - Oversee all exams
- **Fees** (`/admin/payments`) - Monitor payment collection
- **Announcements** (`/admin/announcements`) - Send announcements
- **Approvals** (`/admin/registrations/pending`) - Approve new users
- **Reports** (`/admin/reports`) - Generate reports

---

## 🔧 Key Features

### Data Hooks (Automatic Supabase Integration)

All pages use custom React hooks for Supabase queries:

#### Student Hooks (`hooks/use-student-data.ts`)
```typescript
- useStudentProfile(userId) - Fetch student profile
- useStudentClasses(userId) - Get assigned classes
- useStudentSubjects(userId) - Get enrolled subjects
- useStudentExams(userId) - Get exams for student
- useStudentResults(userId) - Fetch exam results
- useStudentFees(userId) - Get fee records
- useStudentAttendance(userId) - Track attendance
```

#### Teacher Hooks (`hooks/use-teacher-data.ts`)
```typescript
- useTeacherProfile(userId) - Fetch teacher profile
- useTeacherClasses(userId) - Get assigned classes
- useTeacherSubjects(userId) - Get teaching subjects
- useTeacherExams(userId) - Get created exams
- useTeacherStudents(userId) - Get all students
- useTeacherPendingGrading(userId) - Get pending exams
- useTeacherAttendance(classId) - Class attendance
```

#### Admin Hooks (`hooks/use-admin-data.ts`)
```typescript
- useAdminOverview() - System statistics
- useAllStudents() - All students in system
- useAllTeachers() - All teachers in system
- useAllClasses() - All classes
- useAllSubjects() - All subjects
- useAllExams() - All exams
- useAllFees() - All fee records
- useAllResults() - All results
- usePendingApprovals() - Pending items to approve
```

### Payment Integration (Paystack)

The payments page includes complete Paystack integration:

```javascript
// Features:
- Individual fee payment
- Bulk payment (all outstanding fees)
- Payment verification
- Receipt download
- Payment history
- Status tracking
```

**Setup Required:**
1. Get your Paystack Public Key from https://dashboard.paystack.com
2. Add to environment:
   ```
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_public_key_here
   ```

### Authentication & Authorization

- **Supabase Auth** for user management
- **Role-based access control** (student, teacher, admin, parent, bursar)
- **Session management** with automatic redirects
- **User approval workflow** for new registrations

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account with database setup

### 1. Install Dependencies

```bash
cd EL-BETHEL-PORTAL-main
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file in the root directory:

```env
# Supabase Configuration (Already set in the project)
NEXT_PUBLIC_SUPABASE_URL=https://uolerptbkdswauraases.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Paystack (Get from https://dashboard.paystack.com)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx

# Admin Registration Code
ADMIN_REG_CODE=ELBETA2025ADMIN
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Default Test Accounts

Create test accounts in Supabase:

**Student Account:**
- Registration #: `ELBA/25/SS3B/001`
- Email: `student@elbethel.com`
- Password: `test@123`

**Teacher Account:**
- Email: `teacher@elbethel.com`
- Password: `test@123`

**Admin Account:**
- Email: `admin@elbethel.com`
- Password: `test@123`
- Registration Code: `ELBETA2025ADMIN`

---

## 📊 Supabase Database Schema

The system requires the following tables in Supabase:

### Core Tables
- `users` - All system users
- `students` - Student records
- `teachers` - Teacher records
- `admins` - Admin records
- `parents` - Parent/guardian records

### Academic Tables
- `classes` - Class levels (JSS1, SS3, etc.)
- `subjects` - Course subjects
- `exams` - Exam records
- `exam_questions` - Questions for exams
- `exam_results` - Student exam results
- `results` - Grade records

### Administrative Tables
- `attendance` - Attendance records
- `fees` - Fee records
- `notifications` - Messages and announcements
- `assignments` - Homework/assignments

---

## 🎨 UI Components Used

The system uses shadcn/ui components:

- **Button** - Interactive buttons
- **Card** - Content containers
- **Tabs** - Tabbed interfaces
- **Badge** - Status indicators
- **Alert** - Messages and warnings
- **Input** - Form fields
- **Select** - Dropdown selections
- **Dialog** - Modal dialogs

All styling uses Tailwind CSS with responsive design for mobile, tablet, and desktop.

---

## 🔐 Security Considerations

### Already Implemented
- ✅ Supabase Auth with secure password hashing
- ✅ Role-based access control
- ✅ User approval workflow
- ✅ Session management
- ✅ HTTPS for payment processing

### Recommended Enhancements
- Add API route validation
- Implement request rate limiting
- Add CORS configuration
- Enable database row-level security (RLS)
- Regular security audits

---

## 📱 Responsive Design

All pages are fully responsive:
- **Mobile** (320px - 640px)
- **Tablet** (640px - 1024px)
- **Desktop** (1024px+)

---

## 🔄 API Routes

The system includes API routes for backend operations:

```
/api/auth/* - Authentication endpoints
/api/student/* - Student data endpoints
/api/teacher/* - Teacher data endpoints
/api/admin/* - Admin operations
/api/payments/* - Payment processing
/api/announcements/* - Announcements
/api/attendance/* - Attendance tracking
```

---

## 🚧 Common Tasks

### Add a New Student Page

1. Create file: `/app/student/[feature]/page.tsx`
2. Import hooks from `hooks/use-student-data.ts`
3. Use StudentPortalLayout wrapper
4. Fetch data with hooks
5. Display with shadcn/ui components

### Add a New Admin Function

1. Create file: `/app/admin/[feature]/page.tsx`
2. Use `useAdminData.ts` hooks
3. Use AdminPortalLayout wrapper
4. Implement CRUD operations via API routes

### Handle Payments

```typescript
// Use the Paystack handler in any component
const handlePay = async () => {
  const handler = window.PaystackPop.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    email: userEmail,
    amount: totalAmount * 100,
    callback: async (response) => {
      // Handle successful payment
    }
  })
  handler.openIframe()
}
```

---

## 📈 Performance Tips

1. **Use React.memo** for components that don't change
2. **Lazy load** non-critical components
3. **Cache** Supabase queries when possible
4. **Optimize images** before uploading
5. **Use CDN** for static assets

---

## 🐛 Troubleshooting

### Pages Not Loading
- Check Supabase connection in DevTools
- Verify environment variables are set
- Check browser console for errors

### Authentication Issues
- Clear browser cache and cookies
- Verify user role in Supabase
- Check RLS policies on tables

### Paystack Payment Not Working
- Verify Paystack public key is correct
- Check payment amount is > 0
- Ensure email is valid

---

## 📞 Support

For issues or questions:
1. Check Supabase dashboard for data
2. Review browser DevTools console
3. Check API response status codes
4. Verify environment variables

---

## 📝 File Structure

```
EL-BETHEL-PORTAL-main/
├── app/
│   ├── auth/                    # Authentication pages
│   ├── student/                 # Student portal
│   ├── teacher/                 # Teacher portal
│   ├── admin/                   # Admin portal
│   ├── api/                     # API routes
│   ├── student-dashboard/       # Student home
│   ├── teacher-dashboard/       # Teacher home
│   └── admin-dashboard/         # Admin home
├── components/
│   ├── ui/                      # shadcn components
│   ├── student-portal-layout.tsx
│   ├── teacher-portal-layout.tsx
│   └── admin-portal-layout.tsx
├── hooks/
│   ├── use-student-data.ts      # Student hooks
│   ├── use-teacher-data.ts      # Teacher hooks
│   └── use-admin-data.ts        # Admin hooks
├── lib/
│   ├── supabase-client.ts       # Supabase setup
│   ├── auth-utils.ts            # Auth functions
│   └── utils.ts                 # Utilities
└── public/
    └── assets/                  # Images and media
```

---

## ✨ Next Steps

1. **Customize branding** - Update colors, logo, school name
2. **Configure Paystack** - Add your merchant details
3. **Set up email notifications** - Configure Supabase email
4. **Create admin accounts** - For your staff
5. **Test thoroughly** - All workflows with test data
6. **Deploy** - To production (Vercel, Netlify, etc.)

---

## 📚 Documentation Links

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [Paystack Docs](https://paystack.com/docs)

---

**Version:** 1.0.0  
**Last Updated:** 2025  
**Status:** ✅ Production Ready
