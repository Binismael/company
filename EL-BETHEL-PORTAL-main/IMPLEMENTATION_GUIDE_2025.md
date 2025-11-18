# El Bethel Academy Portal - Implementation Guide 2025

## Overview

This is a comprehensive School Management System built with Next.js 15, TypeScript, Supabase, and modern UI components (shadcn/ui). The system provides role-based access for Admin, Teachers, Students, and Parents with complete features for academic management, messaging, timetabling, fees, and documents.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15.2.4, React 19, TypeScript
- **UI Components**: shadcn/ui (built on Radix UI)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: Tailwind CSS 3.4.17
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Sonner

### Database Schema

#### Core Tables
- **users** - All users with roles (admin, teacher, student, parent, bursar)
- **students** - Student profiles with admission details
- **teachers** - Teacher profiles
- **parents** - Parent profiles
- **classes** - Class definitions
- **subjects** - Subject catalog

#### Academic Tables
- **attendance** - Daily attendance records
- **results** - Student exam results and grades
- **assignments** - Teacher assignments
- **assignment_submissions** - Student submissions

#### Examination Tables
- **exams** - Exam definitions
- **exam_questions** - Multiple choice questions
- **exam_answers** - Student answers
- **exam_attempts** - Exam submission tracking

#### Timetable & Schedule
- **timetables** - Timetable templates
- **timetable_schedules** - Weekly class periods

#### Messaging & Communication
- **chat_rooms** - Direct message conversations
- **chat_messages** - Realtime messages with Supabase subscriptions
- **messages** - Legacy message system
- **announcements** - School-wide announcements
- **notifications** - User notifications

#### Financial Management
- **fees** - Student fee records
- **payments** - Payment transactions
- **school_fees_template** - Reusable fee templates

#### Document Management
- **documents** - File metadata for storage
- **profile_attachments** - User profile information
- **parent_student** - Parent-child relationships

## Pages & Features

### 1. Authentication Pages

#### `/auth/login`
- Student/Teacher/Admin login
- Email & password validation
- Role-based redirect

#### `/auth/register`
- Student registration with role selection
- Email & password validation
- Auto-login after registration
- Supabase Auth integration

#### `/auth/parent-login`
- Dedicated parent login interface
- Clean, professional UI
- Password visibility toggle

#### `/auth/forgot-password`
- Password reset flow
- Email verification

### 2. Parent Portal

#### `/parent-dashboard`
- **Features:**
  - View multiple children's records
  - Academic results and scores
  - Attendance tracking
  - School announcements
  - Statistics (average score, attendance %)
  - Real-time updates

#### `/parent-dashboard/fees`
- **Features:**
  - View all fee statements
  - Payment status tracking
  - Payment history
  - Download receipts
  - Payment method selection
  - Balance calculation

#### `/parent-dashboard/profile`
- Profile management
- Contact information
- Profile picture upload

### 3. Timetable System

#### `/timetable`
- **Features:**
  - Weekly grid layout (5 days × 10 periods)
  - Teacher and class-specific views
  - Subject and location display
  - Filter by class selection
  - Download as PDF
  - Print functionality

### 4. Messaging System

#### `/messages`
- **Real-time Features:**
  - Supabase Realtime subscriptions
  - Live message updates
  - Chat room management
  - User search
  - New conversation creation
  - Message read status
  - Timestamp display
  - User status indicator

### 5. Admin Management

#### `/admin/classes-management`
- **Class Management:**
  - Create/edit classes
  - Assign class teachers
  - Set class capacity
  - Delete classes

- **Subject Management:**
  - Create subjects
  - Subject codes
  - Descriptions
  - Delete subjects

#### `/admin/fees-setup`
- **Fee Templates:**
  - Create reusable templates
  - Multiple terms support
  - Applicable class selection
  - Template deletion

- **Fee Assignment:**
  - Assign fees to students
  - Per-term configuration
  - Due date setting
  - Status tracking

### 6. Other Features

#### Student Dashboard
- Grades and results
- Assignments
- Attendance
- Timetable
- Messages

#### Teacher Dashboard
- Class management
- Grading system
- Assignment distribution
- Attendance marking
- Messaging with students

## API Routes

### Parents
- `GET /api/parents` - Get all parents or specific parent
- `POST /api/parents` - Create parent profile
- `PUT /api/parents` - Update parent profile

### Timetables
- `GET /api/timetables` - Get timetables by class
- `POST /api/timetables` - Create timetable

### Timetable Schedules
- `GET /api/timetables/schedules` - Get schedules
- `POST /api/timetables/schedules` - Add schedule slot
- `PUT /api/timetables/schedules` - Update schedule
- `DELETE /api/timetables/schedules` - Remove schedule

### Chat/Messaging
- `GET /api/chat/rooms` - Get user's chat rooms
- `POST /api/chat/rooms` - Create new chat room
- `GET /api/chat/messages` - Get messages from room
- `POST /api/chat/messages` - Send message
- `PUT /api/chat/messages` - Mark as read
- `PATCH /api/chat/messages` - Mark all as read

### Documents
- `GET /api/documents` - Get documents by type/user
- `POST /api/documents` - Create document metadata
- `DELETE /api/documents` - Delete document

### Fees
- `GET /api/fees` - Get fees by student/status
- `POST /api/fees` - Create fee record
- `PUT /api/fees` - Update payment status

## Setup Instructions

### 1. Database Setup

#### Create Tables & Migrations

Run the following SQL files in Supabase SQL Editor:

```bash
# Migration 1 - Complete base schema
EL-BETHEL-PORTAL-main/lib/complete-migration.sql

# Migration 2 - Extended features (parents, timetables, messaging)
EL-BETHEL-PORTAL-main/migrations/002_extended_features.sql
```

**Order of execution is important!**

### 2. Storage Setup

Create the following buckets in Supabase Storage:

1. **profiles** (Public)
   - Profile pictures
   - Path: `/profiles/{user-id}/profile.jpg`

2. **documents** (Private)
   - Student documents
   - Path: `/documents/{student-id}/{doc-name}`

3. **assignments** (Private)
   - Assignment submissions
   - Path: `/assignments/{assignment-id}/{student-id}`

4. **receipts** (Private)
   - Payment receipts
   - Path: `/receipts/{student-id}/{receipt-id}`

Detailed instructions in: `SUPABASE_STORAGE_SETUP.md`

### 3. Environment Variables

Set these in Builder.io or `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_REG_CODE=your-admin-code
NEXT_PUBLIC_MAIN_ADMIN_EMAIL=admin@elbethel.edu
```

### 4. Create Super Admin

Run this in Supabase SQL Editor:

```sql
-- 1. Create admin user in auth.users
-- Use Supabase Auth UI or API

-- 2. Create admin profile
INSERT INTO users (id, email, full_name, role, is_approved)
VALUES (
  'user-id-from-auth',
  'admin@elbethel.edu',
  'Super Admin',
  'admin',
  true
);
```

### 5. Initial Data

Seed the database with:
- 12 standard classes (JSS1-SS3)
- 16 subjects
- Sample announcements

## Row-Level Security (RLS)

All tables have RLS enabled with policies for:

- **Students**: View own data, can't view others
- **Teachers**: View class data and assigned students
- **Parents**: View children's data
- **Admins**: Full access
- **Bursars**: Fee and payment access

Policies are automatically created in migration files.

## Real-time Features

### Chat Messages
Uses Supabase Realtime with:
```typescript
supabase.channel('chat_messages').on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `chat_room_id=eq.${roomId}`
  },
  (payload) => { /* handle new message */ }
)
```

Custom hook: `hooks/use-realtime.ts`

## File Upload Configuration

### Profile Picture Upload
```typescript
const { data } = await supabase.storage
  .from('profiles')
  .upload(`profiles/${userId}/profile.jpg`, file, { upsert: true })
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('profiles')
  .getPublicUrl(`profiles/${userId}/profile.jpg`)
```

### Get Signed URL (Private Files)
```typescript
const { data } = await supabase.storage
  .from('documents')
  .createSignedUrl(`documents/${studentId}/cert.pdf`, 3600) // 1 hour
```

## Component Structure

### UI Components (shadcn/ui)
- Button
- Input
- Card
- Dialog
- Tabs
- Select
- Textarea
- Alert
- Avatar
- ScrollArea
- Badge

### Custom Components
- Layouts (AdminPortalLayout, AdminSidebar)
- Charts (Dashboard analytics)
- Forms (Registration, Login)
- Data Tables
- Message components

## Authentication Flow

### Student Registration
1. User fills registration form
2. Supabase Auth creates user
3. User record created in `users` table
4. Student record created in `students` table
5. Auto-login on success

### Parent Login
1. Email & password verification
2. Check `users.role === 'parent'`
3. Redirect to parent dashboard
4. Load parent's children via `parent_student` junction

### Admin Access
1. Verify `users.role === 'admin'`
2. Check `users.is_approved === true`
3. Grant admin dashboard access

## Security Best Practices

1. **RLS Enabled**: All tables have Row-Level Security
2. **Service Role Key**: Stored only in server environment
3. **Email Verification**: Can be enabled in Supabase Auth
4. **Password Requirements**: Minimum 6 characters
5. **API Protection**: All routes validate user role

## Performance Optimization

1. **Database Indexes**: Created on frequently queried columns
2. **Select Optimization**: Specific field selection in queries
3. **Pagination**: Implemented for large datasets
4. **Real-time Limits**: Messages load last 100 by default
5. **Lazy Loading**: Components load data as needed

## Troubleshooting

### "Invalid API Key" Error
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Regenerate keys in Supabase dashboard
- Check CORS settings

### Realtime Messages Not Appearing
- Verify RLS policies allow message insertion
- Check `chat_rooms` table for valid room
- Ensure Realtime is enabled in Supabase

### Storage Upload Failing
- Check bucket is created and public/private setting
- Verify RLS policies for bucket
- Check file size (max 100MB)

### Login Redirect Issues
- Clear browser cache/cookies
- Verify user role in `users` table
- Check `is_approved` status

## Testing

### Manual Testing Checklist

- [ ] Register student account
- [ ] Login as different roles
- [ ] Parent can see children's data
- [ ] Messages appear in real-time
- [ ] Can upload profile picture
- [ ] Timetable displays correctly
- [ ] Fees calculate correctly
- [ ] Announcements visible to appropriate users
- [ ] Admin can create classes/subjects
- [ ] Attendance marking works

### API Testing

Use curl or Postman:

```bash
# Create parent
curl -X POST http://localhost:3000/api/parents \
  -H "Content-Type: application/json" \
  -d '{"userId":"xxx","phoneNumber":"08012345678"}'

# Get chat rooms
curl http://localhost:3000/api/chat/rooms?userId=xxx

# Send message
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Content-Type: application/json" \
  -d '{
    "chatRoomId":"xxx",
    "senderId":"yyy",
    "content":"Hello"
  }'
```

## Future Enhancements

1. **SMS Notifications** - Send alerts via SMS
2. **Mobile App** - React Native/Flutter app
3. **Advanced Analytics** - Performance dashboards
4. **Video Calls** - Built-in video conferencing
5. **Payment Gateway** - Paystack/Stripe integration
6. **Bulk Operations** - Import students from CSV
7. **AI Tutor** - AI-powered learning assistant
8. **Offline Mode** - Progressive Web App support
9. **Multi-language** - I18n support
10. **API Webhooks** - External system integration

## File Structure

```
EL-BETHEL-PORTAL-main/
├── app/
│   ├── api/                    # API routes
│   │   ├── parents/
│   │   ├── timetables/
│   │   ├── chat/
│   │   ├── documents/
│   │   └── fees/
│   ├── auth/                   # Auth pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── parent-login/
│   │   └── forgot-password/
│   ├── parent-dashboard/       # Parent pages
│   ├── admin/                  # Admin pages
│   ├── messages/               # Messaging
│   ├── timetable/              # Timetables
│   └── layout.tsx
├── components/
│   ├── ui/                     # shadcn components
│   └── [custom components]
├── hooks/
│   ├── use-realtime.ts         # Realtime subscriptions
│   └── [other hooks]
├── lib/
│   ├── supabase-client.ts      # Client initialization
│   ├── supabase-admin.ts       # Admin client
│   └── [utilities]
├── migrations/
│   ├── 001_base_schema.sql
│   └── 002_extended_features.sql
└── SUPABASE_STORAGE_SETUP.md
```

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com
- **Supabase Discord**: https://discord.supabase.io

## Version Info

- **Build Date**: January 2025
- **Next.js**: 15.2.4
- **React**: 19
- **Supabase JS**: 2.57.4
- **Tailwind CSS**: 3.4.17

## License

All rights reserved © 2025 El Bethel Academy

---

**Last Updated**: January 2025
**Maintainer**: El Bethel Academy Development Team
