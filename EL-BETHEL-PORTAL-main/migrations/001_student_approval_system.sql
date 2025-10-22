-- ============================================================================
-- El Bethel Academy - Student Approval System Migration
-- ============================================================================
-- Run this SQL in Supabase → SQL Editor to set up the approval system
--
-- This migration:
-- 1. Adds 'approved' column to students table (if not exists)
-- 2. Creates admins table to track admin users
-- 3. Creates audit log table for approval actions
-- 4. Sets up Row-Level Security (RLS) policies
--
-- Important: After running this, manually insert your admin user ID into
-- the admins table using:
-- INSERT INTO admins (user_id) VALUES ('YOUR_ADMIN_USER_ID');
-- ============================================================================

-- Step 1: Create extension for UUID generation
create extension if not exists "pgcrypto";

-- Step 2: Add 'approved' column to students table if it doesn't exist
alter table if exists students
add column if not exists approved boolean default false;

alter table if exists students
add column if not exists gender text check (gender in ('Male', 'Female', 'Other'));

alter table if exists students
add column if not exists address text;

alter table if exists students
add column if not exists state text;

alter table if exists students
add column if not exists lga text;

alter table if exists students
add column if not exists guardian_email text;

alter table if exists students
add column if not exists previous_school text;

alter table if exists students
add column if not exists photo_url text;

-- Step 3: Create ADMINS table to track admin users
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  created_at timestamptz default now(),
  constraint fk_admins_users foreign key (user_id) references auth.users(id) on delete cascade
);

-- Step 4: Create APPROVAL LOGS table for audit trail
create table if not exists student_approval_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete set null,
  action text check (action in ('approved', 'rejected', 'pending')),
  note text,
  created_at timestamptz default now()
);

-- Step 5: Create indexes for performance
create index if not exists idx_students_user_id on students(user_id);
create index if not exists idx_students_approved on students(approved);
create index if not exists idx_approval_logs_student_id on student_approval_logs(student_id);
create index if not exists idx_admins_user_id on admins(user_id);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on students table
alter table students enable row level security;

-- Policy: Anyone (unauthenticated) can insert their own student record
create policy if not exists "allow_insert_own_student" on students
  for insert
  with check (true);

-- Policy: Students can read their own record; approved students visible to all authenticated users; admins see all
create policy if not exists "select_students_owner_approved_admin" on students
  for select
  using (
    (user_id is not null and user_id = auth.uid()) -- student reading own record
    or approved = true -- approved students visible to authenticated users
    or exists (select 1 from admins where user_id = auth.uid()) -- admins see all
  );

-- Policy: Students can update their own profile (limited fields); Admins can update any record
create policy if not exists "update_students_owner_or_admin" on students
  for update
  using (
    (user_id = auth.uid()) or -- students updating own
    (exists (select 1 from admins where user_id = auth.uid())) -- admins can update any
  )
  with check (
    (user_id = auth.uid()) or -- students can update their own
    (exists (select 1 from admins where user_id = auth.uid())) -- admins can update approved flag
  );

-- Policy: Only admins can delete student records
create policy if not exists "delete_students_admin_only" on students
  for delete
  using (exists (select 1 from admins where user_id = auth.uid()));

-- Enable RLS on admins table
alter table admins enable row level security;

-- Policy: Only admins can read the admins table
create policy if not exists "select_admins_only_admins" on admins
  for select
  using (exists (select 1 from admins a2 where a2.user_id = auth.uid()));

-- Policy: Only system can insert into admins (via SQL or API with admin key)
create policy if not exists "insert_admins_admin_only" on admins
  for insert
  with check (exists (select 1 from admins where user_id = auth.uid()));

-- Enable RLS on approval logs
alter table student_approval_logs enable row level security;

-- Policy: Only admins and the student can read approval logs
create policy if not exists "select_approval_logs" on student_approval_logs
  for select
  using (
    exists (select 1 from admins where user_id = auth.uid()) or
    exists (
      select 1 from students
      where students.id = student_approval_logs.student_id
      and students.user_id = auth.uid()
    )
  );

-- Policy: Only admins can insert approval logs
create policy if not exists "insert_approval_logs_admin" on student_approval_logs
  for insert
  with check (exists (select 1 from admins where user_id = auth.uid()));
