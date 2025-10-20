import { supabase } from './supabase-client'

// ============================================
// STUDENT QUERIES
// ============================================

export const getStudentProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      user_id,
      class:classes(name, form_level),
      user:users(full_name, email)
    `)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

export const getStudentResults = async (
  studentId: string,
  session?: string,
  term?: string
) => {
  let query = supabase
    .from('results')
    .select(`
      *,
      subject:subjects(name, code),
      class:classes(name)
    `)
    .eq('student_id', studentId)

  if (session) query = query.eq('session', session)
  if (term) query = query.eq('term', term)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getStudentAttendance = async (studentId: string) => {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      class:classes(name)
    `)
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false })

  if (error) throw error
  return data
}

export const getStudentAssignments = async (studentId: string) => {
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('class_id')
    .eq('user_id', studentId)
    .single()

  if (studentError) throw studentError

  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      subject:subjects(name),
      submissions:assignment_submissions(*)
    `)
    .eq('class_id', studentData.class_id)
    .order('due_date', { ascending: false })

  if (error) throw error
  return data
}

export const getStudentFees = async (studentId: string) => {
  const { data, error } = await supabase
    .from('fees')
    .select('*')
    .eq('student_id', studentId)
    .order('due_date', { ascending: false })

  if (error) throw error
  return data
}

// ============================================
// TEACHER QUERIES
// ============================================

export const getTeacherClasses = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      students:students(count)
    `)
    .eq('class_teacher_id', teacherId)

  if (error) throw error
  return data
}

export const getTeacherSubjects = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('class_subjects')
    .select(`
      *,
      subject:subjects(name, code),
      class:classes(name, form_level)
    `)
    .eq('teacher_id', teacherId)

  if (error) throw error
  return data
}

export const getClassStudents = async (classId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      user:users(full_name, email)
    `)
    .eq('class_id', classId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const markAttendance = async (
  studentId: string,
  classId: string,
  date: string,
  status: 'Present' | 'Absent' | 'Late' | 'Excused',
  teacherId: string
) => {
  const { data, error } = await supabase
    .from('attendance')
    .upsert([
      {
        student_id: studentId,
        class_id: classId,
        attendance_date: date,
        status,
        marked_by: teacherId,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) throw error
  return data
}

export const submitResult = async (
  studentId: string,
  subjectId: string,
  classId: string,
  term: string,
  session: string,
  score: number,
  teacherId: string
) => {
  const grade = calculateGrade(score)

  const { data, error } = await supabase
    .from('results')
    .upsert([
      {
        student_id: studentId,
        subject_id: subjectId,
        class_id: classId,
        term,
        session,
        score,
        grade,
        teacher_id: teacherId,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) throw error
  return data
}

export const getClassAttendance = async (classId: string, date?: string) => {
  let query = supabase
    .from('attendance')
    .select(`
      *,
      student:students(user:users(full_name), admission_number)
    `)
    .eq('class_id', classId)

  if (date) {
    query = query.eq('attendance_date', date)
  }

  const { data, error } = await query.order('attendance_date', {
    ascending: false,
  })

  if (error) throw error
  return data
}

export const getClassResults = async (
  classId: string,
  session?: string,
  term?: string
) => {
  let query = supabase
    .from('results')
    .select(`
      *,
      student:students(user:users(full_name), admission_number),
      subject:subjects(name, code)
    `)
    .eq('class_id', classId)

  if (session) query = query.eq('session', session)
  if (term) query = query.eq('term', term)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const createAssignment = async (
  classId: string,
  subjectId: string,
  title: string,
  description: string,
  dueDate: string,
  teacherId: string
) => {
  const { data, error } = await supabase
    .from('assignments')
    .insert([
      {
        class_id: classId,
        subject_id: subjectId,
        title,
        description,
        due_date: dueDate,
        teacher_id: teacherId,
      },
    ])
    .select()

  if (error) throw error
  return data
}

// ============================================
// ADMIN QUERIES
// ============================================

export const getAllUsers = async (role?: string) => {
  let query = supabase
    .from('users')
    .select('*')

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getAllClasses = async () => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      class_teacher:users(full_name),
      students:students(count)
    `)
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export const getAllSubjects = async () => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export const createClass = async (
  name: string,
  formLevel: string,
  classTeacherId?: string,
  capacity?: number
) => {
  const { data, error } = await supabase
    .from('classes')
    .insert([
      {
        name,
        form_level: formLevel,
        class_teacher_id: classTeacherId,
        capacity: capacity || 40,
      },
    ])
    .select()

  if (error) throw error
  return data
}

export const createSubject = async (
  name: string,
  code: string,
  description?: string
) => {
  const { data, error } = await supabase
    .from('subjects')
    .insert([
      {
        name,
        code,
        description,
      },
    ])
    .select()

  if (error) throw error
  return data
}

export const assignSubjectToClass = async (
  classId: string,
  subjectId: string,
  teacherId: string
) => {
  const { data, error } = await supabase
    .from('class_subjects')
    .insert([
      {
        class_id: classId,
        subject_id: subjectId,
        teacher_id: teacherId,
      },
    ])
    .select()

  if (error) throw error
  return data
}

export const assignStudentToClass = async (
  studentId: string,
  classId: string
) => {
  const { data, error } = await supabase
    .from('students')
    .update({ class_id: classId })
    .eq('id', studentId)
    .select()

  if (error) throw error
  return data
}

export const getAllStudents = async (classId?: string) => {
  let query = supabase
    .from('students')
    .select(`
      *,
      user:users(full_name, email),
      class:classes(name)
    `)

  if (classId) {
    query = query.eq('class_id', classId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) throw error
}

export const updateClass = async (
  classId: string,
  updates: {
    name?: string
    form_level?: string
    class_teacher_id?: string
    capacity?: number
  }
) => {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', classId)
    .select()

  if (error) throw error
  return data
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export const getAnnouncements = async (limit: number = 10) => {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      author:users(full_name)
    `)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export const createAnnouncement = async (
  title: string,
  content: string,
  authorId: string,
  postedByRole: string,
  targetRoles: string[]
) => {
  const { data, error } = await supabase
    .from('announcements')
    .insert([
      {
        title,
        content,
        author_id: authorId,
        posted_by_role: postedByRole,
        target_roles: targetRoles,
      },
    ])
    .select()

  if (error) throw error
  return data
}

// ============================================
// TEACHER EXAM QUERIES
// ============================================

export const createExam = async (
  title: string,
  subjectId: string,
  classId: string,
  teacherId: string,
  description?: string,
  startTime?: string,
  endTime?: string,
  durationMinutes?: number,
  totalMarks?: number,
  passingMarks?: number
) => {
  const { data, error } = await supabase
    .from('exams')
    .insert([
      {
        title,
        subject_id: subjectId,
        class_id: classId,
        teacher_id: teacherId,
        description,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes || 60,
        total_marks: totalMarks || 100,
        passing_marks: passingMarks || 40,
      },
    ])
    .select()

  if (error) throw error
  return data
}

export const getTeacherExams = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      subject:subjects(name, code),
      class:classes(name, form_level),
      questions:exam_questions(count),
      attempts:exam_attempts(count)
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getExamDetail = async (examId: string) => {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      subject:subjects(name, code),
      class:classes(name, form_level)
    `)
    .eq('id', examId)
    .single()

  if (error) throw error
  return data
}

export const getExamQuestions = async (examId: string) => {
  const { data, error } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data
}

export const addExamQuestion = async (
  examId: string,
  questionText: string,
  questionType: string,
  options: Record<string, string> | null,
  correctAnswer: string,
  explanation?: string,
  marks?: number,
  orderIndex?: number
) => {
  const { data, error } = await supabase
    .from('exam_questions')
    .insert([
      {
        exam_id: examId,
        question_text: questionText,
        question_type: questionType,
        options,
        correct_answer: correctAnswer,
        explanation,
        marks: marks || 1,
        order_index: orderIndex || 0,
      },
    ])
    .select()

  if (error) throw error
  return data
}

export const updateExamQuestion = async (
  questionId: string,
  updates: {
    question_text?: string
    options?: Record<string, string> | null
    correct_answer?: string
    explanation?: string
    marks?: number
  }
) => {
  const { data, error } = await supabase
    .from('exam_questions')
    .update(updates)
    .eq('id', questionId)
    .select()

  if (error) throw error
  return data
}

export const deleteExamQuestion = async (questionId: string) => {
  const { error } = await supabase
    .from('exam_questions')
    .delete()
    .eq('id', questionId)

  if (error) throw error
}

export const getExamAttempts = async (examId: string) => {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select(`
      *,
      student:students(user:users(full_name), admission_number),
      answers:exam_answers(*)
    `)
    .eq('exam_id', examId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getExamAttemptDetail = async (attemptId: string) => {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select(`
      *,
      student:students(user:users(full_name), admission_number),
      exam:exams(*)
    `)
    .eq('id', attemptId)
    .single()

  if (error) throw error
  return data
}

export const getAttemptAnswers = async (attemptId: string) => {
  const { data, error } = await supabase
    .from('exam_answers')
    .select(`
      *,
      question:exam_questions(*)
    `)
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const gradeExamAttempt = async (
  attemptId: string,
  teacherId: string,
  remarks?: string
) => {
  const { data, error } = await supabase
    .from('teacher_results')
    .insert([
      {
        attempt_id: attemptId,
        teacher_id: teacherId,
        remarks,
      },
    ])
    .select()

  if (error) throw error
  return data
}

export const releaseExamResults = async (examId: string) => {
  const { data, error } = await supabase
    .from('exams')
    .update({ results_released: true })
    .eq('id', examId)
    .select()

  if (error) throw error
  return data
}

export const getTeacherAssignments = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      subject:subjects(name, code),
      class:classes(name, form_level),
      submissions:assignment_submissions(count)
    `)
    .eq('teacher_id', teacherId)
    .order('due_date', { ascending: false })

  if (error) throw error
  return data
}

export const getAssignmentSubmissions = async (assignmentId: string) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      student:students(user:users(full_name), admission_number)
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data
}

export const gradeAssignmentSubmission = async (
  submissionId: string,
  score: number,
  feedback: string
) => {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update({
      score,
      feedback,
      status: 'Graded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()

  if (error) throw error
  return data
}

export const getTeacherProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

export const updateTeacherProfile = async (
  userId: string,
  updates: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    photo_url?: string
    bio?: string
    specialization?: string
    qualification?: string
  }
) => {
  const { data, error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('user_id', userId)
    .select()

  if (error) throw error
  return data
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export const calculateGrade = (score: number): string => {
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export const calculateAttendancePercentage = (
  attendanceRecords: any[]
): number => {
  if (attendanceRecords.length === 0) return 0
  const presentCount = attendanceRecords.filter(
    (r) => r.status === 'Present' || r.status === 'Late'
  ).length
  return (presentCount / attendanceRecords.length) * 100
}

export const getSessionAndTerm = (): { session: string; term: string } => {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  let session = `${year}/${year + 1}`
  let term = 'First Term'

  if (month >= 3 && month < 7) {
    term = 'Second Term'
  } else if (month >= 7 && month < 11) {
    term = 'Third Term'
  }

  return { session, term }
}
