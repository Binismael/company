import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export interface TeacherProfile {
  id: string
  user_id: string
  employee_id: string
  qualification?: string
  specialization?: string
  date_of_employment?: string
  phone?: string
}

export function useTeacherProfile(userId: string | null) {
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (err) throw err
        setProfile(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch teacher profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  return { profile, loading, error }
}

export function useTeacherClasses(userId: string | null) {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: teacher, error: teacherErr } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (teacherErr) throw teacherErr

        const { data, error: err } = await supabase
          .from('class_assignments')
          .select('classes(*)')
          .eq('teacher_id', teacher.id)

        if (err) throw err
        setClasses(data?.map((item: any) => item.classes) || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch classes')
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [userId])

  return { classes, loading, error }
}

export function useTeacherSubjects(userId: string | null) {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchSubjects = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: teacher, error: teacherErr } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (teacherErr) throw teacherErr

        const { data, error: err } = await supabase
          .from('subject_assignments')
          .select('subjects(*)')
          .eq('teacher_id', teacher.id)

        if (err) throw err
        setSubjects(data?.map((item: any) => item.subjects) || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch subjects')
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [userId])

  return { subjects, loading, error }
}

export function useTeacherExams(userId: string | null) {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchExams = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: teacher, error: teacherErr } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (teacherErr) throw teacherErr

        const { data, error: err } = await supabase
          .from('exams')
          .select('*')
          .eq('created_by', teacher.id)

        if (err) throw err
        setExams(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch exams')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [userId])

  return { exams, loading, error }
}

export function useTeacherStudents(userId: string | null) {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchStudents = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: teacher, error: teacherErr } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (teacherErr) throw teacherErr

        const { data: classes, error: classErr } = await supabase
          .from('class_assignments')
          .select('class_id')
          .eq('teacher_id', teacher.id)

        if (classErr) throw classErr

        const classIds = classes?.map((c: any) => c.class_id) || []

        const { data, error: err } = await supabase
          .from('students')
          .select('*, users(email, full_name)')
          .in('class_id', classIds)

        if (err) throw err
        setStudents(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [userId])

  return { students, loading, error }
}

export function useTeacherPendingGrading(userId: string | null) {
  const [pendingGrading, setPendingGrading] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchPendingGrading = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: teacher, error: teacherErr } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (teacherErr) throw teacherErr

        const { data, error: err } = await supabase
          .from('exam_results')
          .select('*, exams(name), students(registration_number)')
          .eq('teacher_id', teacher.id)
          .eq('status', 'pending')

        if (err) throw err
        setPendingGrading(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch pending grading')
      } finally {
        setLoading(false)
      }
    }

    fetchPendingGrading()
  }, [userId])

  return { pendingGrading, loading, error }
}

export function useTeacherAttendance(classId: string | null) {
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!classId) return

    const fetchAttendance = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('attendance')
          .select('*, students(registration_number)')
          .eq('class_id', classId)

        if (err) throw err
        setAttendance(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch attendance')
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [classId])

  return { attendance, loading, error }
}
