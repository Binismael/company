# El Bethel Academy Portal - Quick Reference Guide

## ⚡ Super Quick Start

### 1. Login to App
Visit: `http://localhost:3000/auth/login`

### 2. Try These Credentials

**Option A: Email Login**
```
Email: admin@elbethel.edu
Password: admin123
```

**Option B: Registration Number Login** (Student)
```
Registration #: ELBA/25/SS3A/001
Password: Test123
```

### 3. Where to Go
- **Admin** → `/admin-dashboard`
- **Student** → `/student-dashboard`
- **Teacher** → `/teacher-dashboard`
- **Parent** → `/parent-dashboard`
- **Bursar** → `/bursar-dashboard`

---

## 📚 Documentation Map

| Document | Read This When... | Location |
|----------|------------------|----------|
| **IMPLEMENTATION_COMPLETE.md** | Want overview of what's built | Root |
| **COMPLETE_SETUP_GUIDE.md** | Setting up the system for production | Root |
| **DATABASE_TABLES_CHECKLIST.md** | Need to verify database tables | Root |
| **QUICK_REFERENCE.md** | This file - quick answers | Root |
| **IMPLEMENTATION_SUMMARY.md** | Original project summary | Root |

---

## 🔑 Admin Credentials

```
Email:    admin@elbethel.edu
Password: admin123
Role:     Admin
Access:   Admin Dashboard
```

---

## 🎓 Student Registration Numbers

Auto-generated format: `ELBA/YY/CLASSFORM/SEQUENCE`

Examples:
- `ELBA/25/SS3A/001` - Student 1, SS3 A class, 2025
- `ELBA/25/SS3B/002` - Student 2, SS3 B class, 2025
- `ELBA/25/JSS1A/001` - Student 1, JSS1 A class, 2025

Login with registration number + password instead of email!

---

## 📁 Important Directories

```
lib/
├── registration-utils.ts      ← Registration number functions
├── db-queries.ts              ← Database queries
├── auth-utils.ts              ← Authentication functions
├── supabase-client.ts         ← Supabase connection
├── supabase-schema.sql        ← Base schema (14 tables)
├── supabase-migrations.sql    ← NEW: Exams + reg system
└── database-setup.sql         ← Complete setup

app/
├── admin-dashboard/           ← Admin command center
├��─ student-dashboard/         ← Student portal
├── teacher-dashboard/         ← Teacher portal
├── parent-dashboard/          ← Parent monitor
├── bursar-dashboard/          ← Finance manager
└── api/                       ← API endpoints

components/
└── ui/                        ← 50+ UI components
```

---

## 🚀 5-Minute Setup Checklist

- [ ] App running at localhost:3000
- [ ] Can access login page
- [ ] Can login with email/password
- [ ] Can login with registration number
- [ ] Admin dashboard loads
- [ ] Student dashboard loads
- [ ] See all 5 role dashboards

---

## 🔐 The 15 Database Tables

1. **users** - Login accounts
2. **classes** - School classes (SS1-SS3, JSS1-JSS3)
3. **subjects** - School subjects
4. **class_subjects** - Class-subject-teacher mapping
5. **students** - Student profiles (with reg numbers!)
6. **attendance** - Daily attendance records
7. **results** - Academic grades/scores
8. **assignments** - Teacher assignments
9. **assignment_submissions** - Student submissions
10. **announcements** - School announcements
11. **notifications** - User notifications
12. **messages** - Internal messaging
13. **fees** - Student fee records
14. **payments** - Payment transactions
15. **exams** - Exam scheduling ← NEW!

---

## 💡 What Each Dashboard Does

### Admin Dashboard
```
What: Complete school management
See: User stats, class stats, fees collected, attendance %
Do: Create classes, add subjects, manage users, send announcements
```

### Student Dashboard
```
What: View your academic progress
See: Your results, attendance %, assignments, profile
Do: View grades, download transcripts, check assignments
```

### Teacher Dashboard
```
What: Manage your classes
See: List of your classes, students, attendance records
Do: Mark attendance, record grades, view student results
```

### Parent Dashboard
```
What: Monitor your child
See: Child's results, attendance, profile info
Do: Track grades, check attendance, download reports
```

### Bursar Dashboard
```
What: Manage school finances
See: Total fees, payments collected, pending, overdue
Do: Record payments, verify transactions, generate reports
```

---

## 🔗 Key API Routes

**For Developers:**

```
POST   /api/auth/login              # Login
POST   /api/auth/signup             # Register
GET    /api/student/results         # Get results
POST   /api/teacher/attendance      # Mark attendance
POST   /api/payments/submit         # Record payment
GET    /api/admin/users             # List users
```

---

## 🎯 Common Tasks

### How to: Create a Student
1. Go to Admin Dashboard
2. (Feature ready - endpoint exists at `/api/admin/users`)
3. Database table: `students` with auto-generated `reg_number`

### How to: Mark Attendance
1. Go to Teacher Dashboard
2. Select class
3. Click "Attendance" tab
4. Pick date and mark status for each student

### How to: Record Student Result
1. Go to Teacher Dashboard
2. Select class
3. Click "Results" tab
4. Enter score (auto-calculates grade: A/B/C/D/F)

### How to: Record Payment
1. Go to Bursar Dashboard
2. Click "Record Payment"
3. Enter amount, method, reference
4. Verify payment from list

### How to: View Child's Grades
1. Go to Parent Dashboard
2. Select child from list
3. Click "Results" tab
4. See all grades with export option

---

## 🐛 Troubleshooting Quick Answers

| Problem | Solution |
|---------|----------|
| Can't login with email | Check admin@elbethel.edu exists in users table |
| Can't login with reg number | Verify student.reg_number field in database |
| Admin dashboard won't load | Make sure user role = 'admin' |
| Student sees no results | Check results table has entries for that student |
| Teacher can't mark attendance | Verify teacher is assigned to class |
| Payment not showing | Check payment was inserted in payments table |

---

## 📊 Database Entry Count (Sample)

| Table | Records | Purpose |
|-------|---------|---------|
| users | 5+ | Admin, teachers, students, parents, bursar |
| classes | 6 | SS3A, SS3B, SS2A, SS1A, JSS3A, JSS2A |
| subjects | 12 | Math, English, Physics, Chemistry, etc. |
| students | Variable | One per student with auto-generated reg number |
| results | Variable | One per student per subject per term |
| attendance | Variable | One per student per day |
| fees | Variable | One per student per term |
| payments | Variable | One per payment transaction |

---

## 🔐 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Role-based access control
- ✅ Password hashing in Supabase
- ✅ Session management
- ✅ Protected API routes
- ✅ User data isolation by role

---

## 📱 Responsive Design

All dashboards are:
- ✅ Mobile-friendly
- ✅ Tablet-optimized
- ✅ Desktop-full featured
- ✅ Dark mode ready (theme toggle available)

---

## 🎯 Registration Number System Explained

### Generation Process
1. Student is created in system
2. Gets assigned to a class (e.g., SS3A)
3. System counts students in that class (e.g., 5th student)
4. Generates: `ELBA/25/SS3A/005`
5. Stored in `students.reg_number`

### Usage
1. Can login with reg number instead of email
2. Used as student identifier
3. Printed on certificates/transcripts
4. Cannot be duplicated (UNIQUE constraint)

### Format Breakdown
```
ELBA   = School code (El Bethel Academy)
25     = Year (2025)
SS3A   = Class form (Senior Secondary 3, Group A)
005    = Sequential number (padded to 3 digits)
```

---

## 🚀 Deployment Checklist

- [ ] All database tables created (run database-setup.sql)
- [ ] Environment variables set (.env.local)
- [ ] Test login (email & registration number)
- [ ] Test each dashboard
- [ ] Run on production server
- [ ] Set up SSL/HTTPS
- [ ] Configure custom domain
- [ ] Set up backups
- [ ] Monitor error logs
- [ ] Create admin accounts
- [ ] Train staff

---

## 📞 File Reference

**To fix login issues:** Check `lib/auth-utils.ts`
**To add new API:** Create in `app/api/`
**To fix dashboard:** Edit `app/*/page.tsx`
**To modify database:** Update `lib/database-setup.sql`
**To understand data:** Read `lib/db-queries.ts`

---

## ✨ Pro Tips

1. **Faster login:** Use registration number instead of email
2. **Bulk operations:** Use database queries directly for large imports
3. **Custom reports:** Extend Bursar dashboard with more analytics
4. **Notifications:** WebSocket integration ready (use notifications table)
5. **Mobile app:** All APIs are RESTful - easy to build mobile version

---

## 🎓 Features by User Role

### 👨‍💼 Admin
- [ ] Create classes
- [ ] Create subjects
- [ ] View all users
- [ ] Send announcements
- [ ] View system statistics
- [ ] Manage fees

### 👨‍🏫 Teacher
- [ ] Mark attendance
- [ ] Record results
- [ ] View assigned classes
- [ ] View students list
- [ ] Create assignments

### 👨‍🎓 Student
- [ ] View own results
- [ ] Check attendance
- [ ] View assignments
- [ ] See own profile
- [ ] Download transcripts

### 👨‍👩‍👧 Parent
- [ ] Monitor children
- [ ] View grades
- [ ] Check attendance
- [ ] See profile info
- [ ] Download reports

### 💰 Bursar
- [ ] Record payments
- [ ] Verify transactions
- [ ] View fees
- [ ] Generate reports
- [ ] Analytics

---

## 🏁 You're All Set!

Everything is built and ready. Just:

1. **Run the app:** `npm run dev`
2. **Login:** Use credentials above
3. **Explore:** Visit each dashboard
4. **Deploy:** Follow COMPLETE_SETUP_GUIDE.md

**Questions?** Check the documentation files!

**Ready for production?** Run the deployment checklist above!

---

**Happy teaching, learning, and managing! 🎓**
