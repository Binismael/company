import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export interface StudentProfile {
  id: string
  user_id: string
  registration_number: string
  class_level: string
  department?: string
  admission_date: string
  date_of_birth?: string
  gender?: string
  address?: string
  phone?: string
}

export interface StudentOverview {
  total_classes: number
  total_subjects: number
  total_exams: number
  total_fees: number
  fees_paid: number
  fees_balance: number
  next_exam?: string
  latest_result?: {
    subject: string
    score: number
    grade: string
  }
}

export function useStudentProfile(userId: string | null) {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (err) throw err
        setProfile(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch student profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  return { profile, loading, error }
}

export function useStudentClasses(userId: string | null) {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: student, error: studentErr } = await supabase
          .from('students')
          .select('class_level')
          .eq('user_id', userId)
          .single()

        if (studentErr) throw studentErr

        const { data, error: err } = await supabase
          .from('classes')
          .select('*')
          .eq('level', student.class_level)

        if (err) throw err
        setClasses(data || [])
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

export function useStudentSubjects(userId: string | null) {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchSubjects = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: student, error: studentErr } = await supabase
          .from('students')
          .select('class_level')
          .eq('user_id', userId)
          .single()

        if (studentErr) throw studentErr

        const { data, error: err } = await supabase
          .from('subjects')
          .select('*')
          .eq('class_level', student.class_level)

        if (err) throw err
        setSubjects(data || [])
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

export function useStudentExams(userId: string | null) {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchExams = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: student, error: studentErr } = await supabase
          .from('students')
          .select('class_level')
          .eq('user_id', userId)
          .single()

        if (studentErr) throw studentErr

        const { data, error: err } = await supabase
          .from('exams')
          .select('*')
          .eq('class_level', student.class_level)
          .eq('status', 'active')

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

export function useStudentResults(userId: string | null) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchResults = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: student, error: studentErr } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (studentErr) throw studentErr

        const { data, error: err } = await supabase
          .from('results')
          .select('*, subjects(name), exams(name, date)')
          .eq('student_id', student.id)

        if (err) throw err
        setResults(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [userId])

  return { results, loading, error }
}

export function useStudentFees(userId: string | null) {
  const [fees, setFees] = useState<any[]>([])
  const [totalFees, setTotalFees] = useState(0)
  const [paidFees, setPaidFees] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchFees = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: student, error: studentErr } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (studentErr) throw studentErr

        const { data, error: err } = await supabase
          .from('fees')
          .select('*')
          .eq('student_id', student.id)

        if (err) throw err

        setFees(data || [])

        const total = data?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0
        const paid = data?.reduce(
          (sum, fee) => sum + (fee.status === 'paid' ? fee.amount || 0 : 0),
          0
        ) || 0

        setTotalFees(total)
        setPaidFees(paid)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch fees')
      } finally {
        setLoading(false)
      }
    }

    fetchFees()
  }, [userId])

  return { fees, totalFees, paidFees, loading, error, balance: totalFees - paidFees }
}

export function useStudentAttendance(userId: string | null) {
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchAttendance = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: student, error: studentErr } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (studentErr) throw studentErr

        const { data, error: err } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', student.id)

        if (err) throw err
        setAttendance(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch attendance')
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [userId])

  return { attendance, loading, error }
}
