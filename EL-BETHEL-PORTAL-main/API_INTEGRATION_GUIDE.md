# API Integration Reference Guide

## Overview

This guide documents all API endpoints and data flows for the El Bethel Academy Portal.

---

## 🔐 Authentication Endpoints

### POST `/api/auth/login`
**Description:** Authenticate user with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "student"
  },
  "session": { "access_token": "..." }
}
```

### POST `/api/auth/signup`
**Description:** Register new user account

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "Jane Doe",
  "role": "student"
}
```

### POST `/api/auth/logout`
**Description:** Logout current user

### GET `/api/auth/user`
**Description:** Get current logged-in user

---

## 👨‍🎓 Student Endpoints

### GET `/api/student/profile`
**Description:** Get current student profile

**Query Params:**
- `student_id` (optional) - Specific student ID

**Response:**
```json
{
  "id": "student-id",
  "registration_number": "ELBA/25/SS3B/001",
  "class_level": "SS3",
  "class_id": "class-id",
  "date_of_birth": "2007-05-15",
  "gender": "M"
}
```

### GET `/api/student/classes`
**Description:** Get student's enrolled classes

**Response:**
```json
{
  "classes": [
    {
      "id": "class-id",
      "name": "SS3B",
      "level": "SS3",
      "form_teacher": "Mr. Okonkwo"
    }
  ]
}
```

### GET `/api/student/subjects`
**Description:** Get student's subjects

**Response:**
```json
{
  "subjects": [
    {
      "id": "subject-id",
      "name": "Mathematics",
      "code": "MATH",
      "teacher": "Dr. Amao",
      "class_level": "SS3"
    }
  ]
}
```

### GET `/api/student/exams`
**Description:** Get available exams

**Query Params:**
- `status` - 'active', 'upcoming', or 'completed'

**Response:**
```json
{
  "exams": [
    {
      "id": "exam-id",
      "name": "Mathematics Final Exam",
      "subject": "Mathematics",
      "start_time": "2025-01-15T09:00:00Z",
      "end_time": "2025-01-15T11:00:00Z",
      "duration": 120,
      "total_questions": 50,
      "status": "upcoming"
    }
  ]
}
```

### GET `/api/student/results`
**Description:** Get exam results

**Query Params:**
- `term` (optional) - Filter by term
- `session` (optional) - Filter by session

**Response:**
```json
{
  "results": [
    {
      "id": "result-id",
      "subject": "Mathematics",
      "score": 85,
      "grade": "A",
      "percentage": 85,
      "term": "First Term",
      "session": "2024/2025",
      "exam_date": "2024-12-10"
    }
  ]
}
```

### GET `/api/student/fees`
**Description:** Get fee records

**Response:**
```json
{
  "fees": [
    {
      "id": "fee-id",
      "description": "School Fees",
      "amount": 50000,
      "due_date": "2025-01-31",
      "status": "pending",
      "payment_date": null
    }
  ],
  "summary": {
    "total": 150000,
    "paid": 50000,
    "balance": 100000
  }
}
```

### GET `/api/student/attendance`
**Description:** Get attendance records

**Query Params:**
- `month` (optional) - Filter by month
- `year` (optional) - Filter by year

**Response:**
```json
{
  "attendance": [
    {
      "id": "attendance-id",
      "attendance_date": "2025-01-15",
      "status": "Present",
      "class": "SS3B",
      "remark": null
    }
  ],
  "statistics": {
    "total_records": 20,
    "present": 18,
    "absent": 1,
    "late": 1,
    "percentage": 95.0
  }
}
```

### GET `/api/student/messages`
**Description:** Get announcements and messages

**Response:**
```json
{
  "messages": [
    {
      "id": "message-id",
      "title": "Exam Schedule Released",
      "content": "Final exams will begin on January 20, 2025",
      "sender": "Admin",
      "type": "announcement",
      "created_at": "2025-01-10T10:00:00Z",
      "is_read": false,
      "priority": "high"
    }
  ]
}
```

---

## 👨‍🏫 Teacher Endpoints

### GET `/api/teacher/profile`
**Description:** Get teacher profile

**Response:**
```json
{
  "id": "teacher-id",
  "employee_id": "EMP001",
  "qualification": "BSc Mathematics",
  "specialization": "Pure Mathematics",
  "date_of_employment": "2020-01-15"
}
```

### GET `/api/teacher/classes`
**Description:** Get assigned classes

**Response:**
```json
{
  "classes": [
    {
      "id": "class-id",
      "name": "SS3B",
      "level": "SS3",
      "capacity": 45,
      "enrolled_students": 43
    }
  ]
}
```

### GET `/api/teacher/subjects`
**Description:** Get teaching subjects

**Response:**
```json
{
  "subjects": [
    {
      "id": "subject-id",
      "name": "Mathematics",
      "code": "MATH",
      "classes": ["SS3A", "SS3B"]
    }
  ]
}
```

### GET `/api/teacher/students`
**Description:** Get all students

**Query Params:**
- `class_id` (optional) - Filter by class

**Response:**
```json
{
  "students": [
    {
      "id": "student-id",
      "registration_number": "ELBA/25/SS3B/001",
      "name": "Chioma Okonkwo",
      "class": "SS3B",
      "email": "student@elbethel.com"
    }
  ]
}
```

### GET `/api/teacher/exams`
**Description:** Get teacher's exams

**Query Params:**
- `status` (optional) - 'active', 'upcoming', or 'completed'

**Response:**
```json
{
  "exams": [
    {
      "id": "exam-id",
      "name": "Term 1 Exam",
      "subject": "Mathematics",
      "total_questions": 50,
      "total_attempts": 43,
      "status": "completed"
    }
  ]
}
```

### POST `/api/teacher/exams`
**Description:** Create new exam

**Request Body:**
```json
{
  "name": "Quiz 1",
  "subject_id": "subject-id",
  "class_id": "class-id",
  "start_time": "2025-01-20T09:00:00Z",
  "end_time": "2025-01-20T10:00:00Z",
  "duration": 60,
  "questions": [
    {
      "question_text": "What is 2+2?",
      "options": ["3", "4", "5"],
      "correct_answer": "4",
      "points": 2
    }
  ]
}
```

### GET `/api/teacher/pending-grading`
**Description:** Get exams pending grading

**Response:**
```json
{
  "pending": [
    {
      "id": "result-id",
      "exam_name": "Final Exam",
      "student_name": "John Doe",
      "submitted_at": "2025-01-15T09:45:00Z",
      "score": null,
      "grade": null
    }
  ],
  "count": 12
}
```

### PUT `/api/teacher/grade/:resultId`
**Description:** Grade exam result

**Request Body:**
```json
{
  "score": 85,
  "grade": "A",
  "feedback": "Excellent work!"
}
```

### POST `/api/teacher/attendance`
**Description:** Record attendance

**Request Body:**
```json
{
  "class_id": "class-id",
  "attendance_date": "2025-01-15",
  "records": [
    {
      "student_id": "student-id",
      "status": "Present"
    }
  ]
}
```

---

## 🧑‍💼 Admin Endpoints

### GET `/api/admin/overview`
**Description:** Get dashboard overview statistics

**Response:**
```json
{
  "total_students": 250,
  "total_teachers": 35,
  "total_classes": 15,
  "total_subjects": 12,
  "total_fees_expected": 37500000,
  "total_fees_paid": 25000000,
  "pending_exams": 3,
  "pending_results": 15
}
```

### GET `/api/admin/students`
**Description:** Get all students

**Query Params:**
- `status` (optional) - 'active', 'pending', 'suspended'
- `class_id` (optional) - Filter by class
- `page` (optional) - Pagination

### GET `/api/admin/teachers`
**Description:** Get all teachers

**Query Params:**
- `status` (optional) - 'active', 'inactive'
- `page` (optional) - Pagination

### GET `/api/admin/classes`
**Description:** Get all classes

**Response:**
```json
{
  "classes": [
    {
      "id": "class-id",
      "name": "JSS1A",
      "level": "JSS1",
      "capacity": 45,
      "enrolled_students": 42,
      "form_teacher": "Mr. Smith"
    }
  ]
}
```

### POST `/api/admin/classes`
**Description:** Create new class

**Request Body:**
```json
{
  "name": "JSS3C",
  "level": "JSS3",
  "capacity": 45,
  "form_teacher_id": "teacher-id"
}
```

### GET `/api/admin/subjects`
**Description:** Get all subjects

**Query Params:**
- `class_level` (optional) - Filter by class level

### POST `/api/admin/subjects`
**Description:** Create new subject

**Request Body:**
```json
{
  "name": "English Language",
  "code": "ENG",
  "class_level": "SS3"
}
```

### GET `/api/admin/exams`
**Description:** Get all exams

**Query Params:**
- `status` (optional) - Filter by status

### PUT `/api/admin/exams/:examId`
**Description:** Update exam (e.g., toggle results visibility)

**Request Body:**
```json
{
  "status": "completed",
  "results_visible": true
}
```

### GET `/api/admin/fees`
**Description:** Get all fee records

**Query Params:**
- `status` (optional) - 'paid', 'pending', 'overdue'

### GET `/api/admin/results`
**Description:** Get all results

### POST `/api/admin/notifications`
**Description:** Send announcement/notification

**Request Body:**
```json
{
  "title": "Important Notice",
  "content": "School will close on Friday",
  "type": "announcement",
  "priority": "high",
  "target_audience": "all" | "students" | "teachers" | "specific_class"
}
```

### POST `/api/admin/approve-student/:studentId`
**Description:** Approve pending student registration

### GET `/api/admin/pending-approvals`
**Description:** Get pending registrations and approvals

---

## 💳 Payment Endpoints

### POST `/api/payments/initialize`
**Description:** Initialize Paystack payment

**Request Body:**
```json
{
  "amount": 50000,
  "email": "student@elbethel.com",
  "reference": "UNIQUE_REFERENCE",
  "metadata": {
    "fee_id": "fee-id",
    "student_id": "student-id"
  }
}
```

### POST `/api/payments/verify`
**Description:** Verify payment with Paystack

**Request Body:**
```json
{
  "reference": "paystack_reference",
  "fee_id": "fee-id"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Payment verified",
  "transaction_id": "tx-id",
  "amount": 50000,
  "paid_at": "2025-01-15T10:30:00Z"
}
```

### GET `/api/payments/records`
**Description:** Get payment history

**Response:**
```json
{
  "payments": [
    {
      "id": "payment-id",
      "amount": 50000,
      "reference": "ref-123",
      "status": "success",
      "payment_date": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## 📝 Data Models

### User
```typescript
{
  id: string
  auth_id: string
  email: string
  full_name: string
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'bursar'
  created_at: string
  updated_at: string
}
```

### Student
```typescript
{
  id: string
  user_id: string
  registration_number: string
  class_level: string
  class_id: string
  admission_date: string
  gender?: string
  date_of_birth?: string
  status: 'active' | 'pending' | 'suspended'
}
```

### Exam
```typescript
{
  id: string
  name: string
  subject_id: string
  class_id: string
  teacher_id: string
  start_time: string
  end_time: string
  duration: number
  total_questions: number
  status: 'pending' | 'active' | 'completed'
  instructions?: string
  created_at: string
}
```

### Result
```typescript
{
  id: string
  student_id: string
  exam_id: string
  score: number
  grade: string
  percentage: number
  term: string
  session: string
  teacher_feedback?: string
  created_at: string
}
```

---

## 🔄 Error Handling

All endpoints return standard error responses:

```json
{
  "error": true,
  "message": "Description of error",
  "code": "ERROR_CODE",
  "status": 400
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## 🔐 Authentication Headers

All protected endpoints require:

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## 📊 Pagination

Endpoints with large datasets support pagination:

```
GET /api/endpoint?page=1&limit=20

Response:
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "pages": 13
  }
}
```

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@elbethel.com",
    "password": "password123"
  }'
```

### Get Student Profile
```bash
curl -X GET http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer {access_token}"
```

### Get Admin Overview
```bash
curl -X GET http://localhost:3000/api/admin/overview \
  -H "Authorization: Bearer {access_token}"
```

---

**Last Updated:** 2025  
**API Version:** 1.0.0
