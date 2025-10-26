import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export interface AdminOverview {
  total_students: number
  total_teachers: number
  total_classes: number
  total_subjects: number
  total_fees_expected: number
  total_fees_paid: number
  pending_exams: number
  pending_results: number
}

export function useAdminOverview() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true)
        setError(null)

        const [
          { count: studentCount },
          { count: teacherCount },
          { count: classCount },
          { count: subjectCount },
          { data: feeData },
          { count: pendingExamsCount },
          { count: pendingResultsCount },
        ] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact' }),
          supabase.from('teachers').select('id', { count: 'exact' }),
          supabase.from('classes').select('id', { count: 'exact' }),
          supabase.from('subjects').select('id', { count: 'exact' }),
          supabase.from('fees').select('amount, status'),
          supabase.from('exams').select('id', { count: 'exact' }).eq('status', 'pending'),
          supabase.from('exam_results').select('id', { count: 'exact' }).eq('status', 'pending'),
        ])

        const totalFees = feeData?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0
        const paidFees =
          feeData?.reduce((sum, fee) => sum + (fee.status === 'paid' ? fee.amount || 0 : 0), 0) ||
          0

        setOverview({
          total_students: studentCount || 0,
          total_teachers: teacherCount || 0,
          total_classes: classCount || 0,
          total_subjects: subjectCount || 0,
          total_fees_expected: totalFees,
          total_fees_paid: paidFees,
          pending_exams: pendingExamsCount || 0,
          pending_results: pendingResultsCount || 0,
        })
      } catch (err: any) {
        setError(err.message || 'Failed to fetch overview')
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [])

  return { overview, loading, error }
}

export function useAllStudents() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('students')
          .select('*, users(email, full_name)')
          .order('created_at', { ascending: false })

        if (err) throw err
        setStudents(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  return { students, loading, error }
}

export function useAllTeachers() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('teachers')
          .select('*, users(email, full_name)')
          .order('created_at', { ascending: false })

        if (err) throw err
        setTeachers(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch teachers')
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  return { teachers, loading, error }
}

export function useAllClasses() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('classes')
          .select('*')
          .order('level', { ascending: true })

        if (err) throw err
        setClasses(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch classes')
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  return { classes, loading, error }
}

export function useAllSubjects() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('subjects')
          .select('*')
          .order('name', { ascending: true })

        if (err) throw err
        setSubjects(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch subjects')
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [])

  return { subjects, loading, error }
}

export function useAllExams() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('exams')
          .select('*, teachers(users(full_name))')
          .order('created_at', { ascending: false })

        if (err) throw err
        setExams(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch exams')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  return { exams, loading, error }
}

export function useAllFees() {
  const [fees, setFees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('fees')
          .select('*, students(registration_number, users(full_name))')
          .order('created_at', { ascending: false })

        if (err) throw err
        setFees(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch fees')
      } finally {
        setLoading(false)
      }
    }

    fetchFees()
  }, [])

  return { fees, loading, error }
}

export function useAllResults() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: err } = await supabase
          .from('exam_results')
          .select('*, exams(name), students(registration_number)')
          .order('created_at', { ascending: false })

        if (err) throw err
        setResults(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  return { results, loading, error }
}

export function usePendingApprovals() {
  const [pending, setPending] = useState({
    students: [],
    exams: [],
    results: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true)
        setError(null)

        const [
          { data: pendingStudents },
          { data: pendingExams },
          { data: pendingResults },
        ] = await Promise.all([
          supabase
            .from('students')
            .select('*')
            .eq('status', 'pending'),
          supabase
            .from('exams')
            .select('*')
            .eq('status', 'pending'),
          supabase
            .from('exam_results')
            .select('*')
            .eq('status', 'pending'),
        ])

        setPending({
          students: pendingStudents || [],
          exams: pendingExams || [],
          results: pendingResults || [],
        })
      } catch (err: any) {
        setError(err.message || 'Failed to fetch pending approvals')
      } finally {
        setLoading(false)
      }
    }

    fetchPending()
  }, [])

  return { pending, loading, error }
}
