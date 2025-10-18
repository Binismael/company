# El Bethel Academy Portal - Complete Setup Guide

## Overview
This is a fully-functional secondary school management portal built with Next.js, Supabase, and Tailwind CSS. It supports 5 user roles: Admin, Teacher, Student, Parent, and Bursar.

## ✅ What's Been Implemented

### 🗄️ Database
- Complete Supabase schema with 15 tables
- Row Level Security (RLS) policies for all roles
- Proper relationships and constraints
- Sample data included

### 🔐 Authentication
- User registration with role selection
- Secure login system
- JWT-based session management
- Password reset functionality

### 📱 User Dashboards
- **Admin**: Manage users, classes, subjects
- **Teacher**: View classes, mark attendance, record results
- **Student**: View results, attendance, profile
- **Parent**: Monitor child's progress and results
- **Bursar**: Manage fees and payments

### 🔌 API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

**Student Endpoints:**
- `GET /api/student/profile` - Get student profile
- `GET /api/student/results` - Get student results
- `GET /api/student/attendance` - Get student attendance

**Teacher Endpoints:**
- `GET /api/teacher/classes` - Get assigned classes
- `GET /api/teacher/attendance` - Get/Mark attendance
- `POST /api/teacher/attendance` - Mark attendance
- `GET /api/teacher/results` - Get class results
- `POST /api/teacher/results` - Submit results

**Admin Endpoints:**
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `GET /api/admin/classes` - List all classes
- `POST /api/admin/classes` - Create class
- `PUT /api/admin/classes` - Update class
- `GET /api/admin/subjects` - List all subjects
- `POST /api/admin/subjects` - Create subject

## 🚀 Quick Start

### 1. Environment Setup
Supabase credentials are already configured in the dev server environment:
```
NEXT_PUBLIC_SUPABASE_URL=https://uolerptbkdswauraases.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Run the Development Server
The server is already running on port 3000.

### 3. Create Database Schema

Go to your Supabase SQL editor and run the SQL from `lib/supabase-schema.sql`:
- This creates all tables with proper relationships
- Sets up RLS policies for each role
- Includes sample data initialization

### 4. Access the Portal

**Landing Page:**
- Navigate to: `http://localhost:3000`
- Click "Register" or "Login"

**Registration Flow:**
1. Go to `/auth/register`
2. Fill in your details
3. Choose your role (Student, Teacher, Parent, Admin, Bursar)
4. Create account
5. You'll be redirected to login

**Login Flow:**
1. Go to `/auth/login`
2. Enter email and password
3. You'll be redirected to your dashboard based on your role

## 🧪 Testing Workflow

### Complete Flow: Register → Login → Dashboard → Manage Data

#### Test 1: Student Registration & Login
```
1. Register at /auth/register
   - Email: student@example.com
   - Password: password123
   - Role: Student
   
2. Login at /auth/login
   - Email: student@example.com
   - Password: password123
   
3. You should see:
   - Student Dashboard with GPA, Attendance, Subjects
   - Results tab with grades and scores
   - Attendance tab with history
   - Profile tab with personal info
```

#### Test 2: Teacher Workflow
```
1. Register as Teacher
   - Email: teacher@example.com
   - Password: password123
   - Role: Teacher
   
2. Login and access Teacher Dashboard
   
3. Features available:
   - View assigned classes
   - See student lists
   - API endpoints to mark attendance
   - API endpoints to submit results
```

#### Test 3: Admin Management
```
1. Register as Admin
   - Email: admin@example.com
   - Password: password123
   - Role: Admin
   
2. Login to Admin Dashboard
   
3. Features:
   - View all users with role badges
   - Create new classes
   - View all classes and subjects
   - Manage system users
```

#### Test 4: Parent & Bursar
```
1. Register as Parent or Bursar
   
2. Parent Dashboard:
   - View children's information
   - Monitor results and attendance
   
3. Bursar Dashboard:
   - View fee records
   - Track payments
   - Financial statistics
```

## 📊 API Testing with cURL

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newstudent@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newstudent@example.com",
    "password": "password123"
  }'
```

### Get Student Profile (requires Bearer token from login)
```bash
curl -X GET http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Student Results
```bash
curl -X GET http://localhost:3000/api/student/results?session=2025/2026&term=First+Term \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Mark Attendance (Teacher)
```bash
curl -X POST http://localhost:3000/api/teacher/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "studentId": "student-uuid",
    "classId": "class-uuid",
    "date": "2025-01-20",
    "status": "Present"
  }'
```

### Submit Results (Teacher)
```bash
curl -X POST http://localhost:3000/api/teacher/results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "studentId": "student-uuid",
    "subjectId": "subject-uuid",
    "classId": "class-uuid",
    "term": "First Term",
    "session": "2025/2026",
    "score": 85
  }'
```

### Create Class (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -d '{
    "name": "SS3A",
    "form_level": "SS3",
    "capacity": 40
  }'
```

## 🔑 Sample Test Accounts

After running the SQL schema, you can use these test accounts:

```
Admin:
Email: admin@elbethel.edu
(Create password via registration)

Or create your own:
- Register with any email
- Choose your role
- Login with created credentials
```

## 📁 Project Structure

```
EL-BETHEL-PORTAL-main/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx       # Login UI
│   │   └── register/page.tsx     # Registration UI
│   ├── student-dashboard/        # Student portal
│   ├── teacher-dashboard/        # Teacher portal
│   ├── admin-dashboard/          # Admin portal
│   ├── parent-dashboard/         # Parent portal
│   ├── bursar-dashboard/         # Bursar portal
│   ├── api/
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── student/              # Student API
│   │   ├── teacher/              # Teacher API
│   │   └── admin/                # Admin API
│   └── page.tsx                  # Landing page
├── lib/
│   ├── supabase-client.ts        # Supabase client config
│   ├── auth-utils.ts             # Auth utilities
│   ├── db-queries.ts             # Database queries
│   ├── supabase-schema.sql       # Database schema
│   └── auth-context.tsx          # Auth context
├── components/
│   └── ui/                       # UI components (buttons, cards, etc.)
└── styles/
    └── globals.css               # Global styles
```

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Role-based access control (RBAC)
- Supabase Auth for secure authentication
- Password hashing via Supabase
- JWT token validation
- Environment variable protection

## 🛠️ Troubleshooting

### Login fails
- Make sure you've registered first
- Check that your email and password are correct
- Verify Supabase is properly connected

### Dashboard shows no data
- Ensure you've run the SQL schema in Supabase
- Check that your role is correctly set
- Verify RLS policies are active

### API returns 401 Unauthorized
- Include proper Authorization header with Bearer token
- Ensure token is valid (not expired)
- Check that user exists in database

### Students don't appear in teacher's class
- Admin needs to assign students to class
- Verify class_id is set in students table

## 📖 API Documentation

See the API endpoints defined in `app/api/` directories for complete endpoint documentation.

Key response formats:
```json
// Success response
{
  "message": "Operation successful",
  "data": { /* results */ }
}

// Error response
{
  "error": "Error message describing what went wrong"
}
```

## ✨ Next Steps

1. **Customize branding**: Update colors and logo
2. **Add more features**: Assignments, messages, announcements
3. **Set up email notifications**: Integrate with email service
4. **Deploy**: Use Netlify or Vercel for hosting
5. **Mobile app**: Build React Native version

## 📞 Support

For issues or questions:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review Next.js docs: https://nextjs.org/docs
3. Check component documentation in components/ui/

## 📝 License

This project is part of El Bethel Academy portal system.
