# Supabase Setup Instructions for El Bethel Academy Portal

This guide will walk you through setting up the Supabase database for the El Bethel Academy Portal.

## Prerequisites

- Supabase account (already set up with credentials in environment variables)
- Supabase project created
- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables configured

## Step 1: Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section
3. Click **"New Query"** to create a new SQL query
4. Copy and paste the contents of `lib/complete-migration.sql` into the editor
5. Click **"Run"** to execute the migration
6. Wait for the migration to complete successfully

The migration will create:
- `users` - User authentication and roles
- `students` - Student records with registration numbers
- `teachers` - Teacher records
- `classes` - Class definitions
- `subjects` - Subject listings
- `attendance` - Attendance tracking
- `exams` - Exam definitions
- `exam_questions` - Multiple choice and essay questions
- `exam_answers` - Student exam responses
- `exam_attempts` - Student exam attempts with scores
- `results` - Final grades and scores
- `assignments` - Teacher assignments
- `assignment_submissions` - Student submissions
- `announcements` - School announcements
- `notifications` - User notifications
- `messages` - Internal messaging
- `fees` - School fees tracking
- `payments` - Payment records
- And their supporting tables

## Step 2: Verify Tables Were Created

In the Supabase SQL Editor, run this verification query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see approximately **20+ tables** created.

## Step 3: Enable Row Level Security (RLS)

The migration script automatically enables RLS policies for:
- Students can only see their own data
- Teachers can see their assigned class data
- Admins can see all data
- Bursars and admins can manage fees and payments

These policies are already configured in the migration script.

## Step 4: Set Up Authentication

1. Go to **Authentication** → **Users** in Supabase dashboard
2. The system will create users automatically when:
   - Admin creates a student via the registration form
   - Admin creates a teacher
   - Users sign up themselves

## Step 5: Enable Realtime Features (Optional)

To enable real-time updates for notifications and messages:

1. Go to **Realtime** in Supabase dashboard
2. Enable replication for these tables:
   - `notifications`
   - `messages`
   - `announcements`

## Step 6: Test the System

### Test Admin Registration
1. Navigate to http://localhost:3000/admin/registrations/create-student
2. Fill in the form with:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@example.com"
   - Password: "Test@1234"
   - Gender: "Male"
   - Date of Birth: Any valid date
   - Class: Select "SS3 A"
   - Guardian Name: "Jane Doe"
   - Guardian Phone: "+234 800 000 0000"
3. Click "Create Student"
4. System should generate a registration number (e.g., ELBA/25/SS3/001)
5. Save the registration number

### Test Student Login
1. Navigate to http://localhost:3000/auth/login
2. Select "Registration #" tab
3. Enter the registration number from the previous step
4. Enter password: "Test@1234"
5. Click "Sign In"
6. Should redirect to student dashboard

### Test User Management
1. Navigate to http://localhost:3000/admin/users
2. View all created users
3. Try suspending/activating a user
4. Try resetting a user's password

## Step 7: Configure Environment Variables (if not done)

Make sure these are set in your environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://uolerptbkdswauraases.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

### Tables Not Created
- Check the SQL Editor for error messages
- Ensure you're using a PostgreSQL-compatible SQL syntax
- Try running the migration in smaller chunks if you get a timeout

### Authentication Errors
- Verify your SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check browser console for detailed error messages
- Ensure the user email doesn't already exist in the system

### Student Registration Number Not Generated
- Verify the `classes` table has data with proper `form_level` values
- Check browser console for JavaScript errors
- Ensure the selected class exists in the database

### Login Issues with Registration Number
- Verify the registration number format (ELBA/YY/CLASSID/### )
- Ensure the student record exists in the `students` table
- Check that the user record exists in the `users` table with the correct email

## Next Steps

1. **Set Up Classes & Subjects**: Add your school's classes and subjects in the database
2. **Create Teachers**: Use admin to create teacher accounts
3. **Import Students**: Bulk import student records (if needed)
4. **Configure Exams**: Set up exam templates and questions
5. **Enable Payments**: Configure Paystack integration for school fees (in next phase)

## Database Schema Overview

```
users (base table for all roles)
├── students (extends users)
│   ├── exams
│   │   ├── exam_questions
│   │   ├── exam_answers
│   │   └── exam_attempts
│   ├── results
│   ├── attendance
│   ├── assignments
│   │   └── assignment_submissions
│   ├── fees
│   └── payments
├── teachers (extends users)
│   ├── class_subjects (teaches subjects to classes)
│   └── assignments (creates assignments)
├── admins
└── bursar/parent (extends users)
```

## Support

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify all environment variables are set correctly
4. Ensure you're using the latest version of the code

## Security Notes

- The current setup uses RLS policies for row-level access control
- Admin users bypass most RLS policies to manage the system
- Students can only see their own records
- Teachers can only see their assigned students
- All authentication goes through Supabase Auth service
- Passwords are securely hashed by Supabase

---

For more information, visit the [Supabase Documentation](https://supabase.com/docs)
