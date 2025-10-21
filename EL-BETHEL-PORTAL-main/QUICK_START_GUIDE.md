# Quick Start Guide - El Bethel Academy Portal

## What's Ready ✅

Your El Bethel Academy Portal is fully implemented with:
- ✅ Admin-only student registration with auto-generated registration numbers
- ✅ Student login using registration number or email
- ✅ Admin user management dashboard
- ✅ Supabase authentication integration
- ✅ Database schema (20+ tables)
- ✅ Row-level security policies

## 🚀 Getting Started (3 Steps)

### Step 1: Set Up Supabase Database (5 minutes)

1. Open your Supabase project dashboard: [https://app.supabase.com](https://app.supabase.com)
2. Click **"SQL Editor"** in the left menu
3. Click **"New Query"**
4. Copy this entire content and paste into the editor:
   ```
   File: EL-BETHEL-PORTAL-main/lib/complete-migration.sql
   ```
5. Click **"Run"** button
6. Wait for completion ✓

**That's it!** Your database is now ready.

### Step 2: Test Admin Registration (2 minutes)

1. Go to: http://localhost:3000/admin/registrations/create-student
2. Fill in the form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@test.com`
   - Password: `Test@1234`
   - Gender: `Male`
   - Date of Birth: Any date
   - Class: `SS3 A`
   - Guardian Name: `Jane Doe`
   - Guardian Phone: `+234 800 000 0000`
3. Click **"Create Student"**
4. **Save the registration number** shown (e.g., `ELBA/25/SS3/001`)

### Step 3: Test Student Login (1 minute)

1. Go to: http://localhost:3000/auth/login
2. Click **"Registration #"** tab
3. Enter:
   - Registration Number: Use the one from Step 2
   - Password: `Test@1234`
4. Click **"Sign In"**
5. Should show student dashboard ✓

## 🎯 Key Features

### For Admins
- **Create Students** → `/admin/registrations/create-student`
- **Manage Users** → `/admin/users`
- **View All Registrations** → `/admin/registrations`
- **Suspend/Delete Users** → From user management page
- **Reset Passwords** → From user management page

### For Students
- **Login Options:**
  - Using registration number (easier for schools)
  - Using email address
- **Dashboard** → After login at `/student-dashboard`
- **View Results** → Coming soon
- **View Attendance** → Coming soon
- **Submit Assignments** → Coming soon

## 📋 Important Info

### Registration Number Format
`ELBA/25/SS3/001`
- `ELBA` = School name code
- `25` = Current year (2025)
- `SS3` = Class level
- `001` = Sequential number (auto-increments)

### Default Test Credentials
After creating a student:
- **Email:** The email you entered
- **Registration Number:** Auto-generated (shown on success)
- **Password:** The password you set

### How Registration Works
1. Admin fills form with student details
2. System creates Supabase Auth account
3. Registration number auto-generated
4. Student record stored with guardian info
5. Admin shares registration number with student
6. Student logs in with reg number + password

## ⚡ Admin Checklist

Start by doing this:

- [ ] Run SQL migration in Supabase
- [ ] Verify tables created (should see 20+ tables)
- [ ] Create test student
- [ ] Test login with registration number
- [ ] Test login with email
- [ ] Go to user management
- [ ] Try suspending/activating user
- [ ] Try resetting password
- [ ] Test searching/filtering users

## 🆘 Troubleshooting

### Tables Not Created?
- Make sure you ran the complete SQL migration
- Check for error messages in Supabase SQL editor
- Try running in smaller chunks if timeout occurs

### Can't Login?
- Check registration number format: `ELBA/YY/CLASS/###`
- Verify password is correct
- Check that user exists in database

### Supabase Error?
- Verify environment variables are set
- Restart the dev server
- Check browser console (F12) for errors

## 📚 Documentation

- **Full Setup Guide**: `SUPABASE_SETUP_INSTRUCTIONS.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY_2025.md`
- **Database Schema**: See `lib/complete-migration.sql`

## 🎓 What Students Can Do (Next Phase)

When we build the student dashboards, students will be able to:
- ✓ View their profile & attendance
- ✓ Take exams (CBT)
- ✓ View results & grades
- ✓ Submit assignments
- ✓ Pay school fees (Paystack)
- ✓ View announcements
- ✓ Message teachers

## 🏫 What Teachers Can Do (Next Phase)

When we build the teacher dashboards, teachers will be able to:
- ✓ Create exams with questions
- ✓ Mark attendance
- ✓ Grade assignments
- ✓ View class results
- ✓ Post announcements
- ✓ Message students & parents

## 🔐 Security

Your system is secure:
- Passwords hashed by Supabase
- Row-level security prevents data leaks
- Students only see their own data
- Admins can see everything
- Email verification available

## 💡 Quick Tips

1. **Bulk Import Students** → Can create import feature later
2. **Reset Classes** → Modify `lib/complete-migration.sql` to match your school
3. **Customize Registration Fields** → Update form in `/admin/registrations/create-student/page.tsx`
4. **Change School Logo** → Update `public/placeholder-logo.svg`

## 📞 Need Help?

- **Setup Issues**: Check `SUPABASE_SETUP_INSTRUCTIONS.md`
- **Feature Questions**: Check `IMPLEMENTATION_SUMMARY_2025.md`
- **Database Questions**: View `lib/complete-migration.sql`
- **Supabase Support**: https://supabase.com/docs

## 🎉 Next Steps

1. ✅ Run the SQL migration (already prepared)
2. ✅ Test with sample student (instructions above)
3. ✅ Create real students for your school
4. 📅 Schedule: Build teacher dashboards
5. 📅 Schedule: Build student dashboards
6. 📅 Schedule: Add payment integration

---

**Status**: Ready to test and deploy
**Estimated Setup Time**: 15 minutes
**Support**: All files documented in project root

Good luck! 🚀
