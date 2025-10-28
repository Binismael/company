import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

interface UseStudentApprovalGuardResult {
  isLoading: boolean
  isApproved: boolean
  error: string | null
  studentId: string | null
}

/**
 * Hook to verify student approval status
 * Redirects to pending-approval page if not approved
 * Returns approval status for conditional rendering
 */
export function useStudentApprovalGuard(): UseStudentApprovalGuardResult {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isApproved, setIsApproved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const checkApprovalStatus = async () => {
      try {
        // Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          // Not authenticated, redirect to login
          router.push('/auth/login')
          setError('Not authenticated')
          setIsLoading(false)
          return
        }

        // Fetch student record to check approval status
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (studentError) {
          console.error('Error fetching student approval status:', studentError.message || studentError)
          setError('Failed to verify account status')
          setIsLoading(false)
          return
        }

        if (!student) {
          console.error('No student record found for user:', user.id)
          setError('Student record not found')
          setIsLoading(false)
          return
        }

        setStudentId(student.id)

        // Check if student is approved using flexible schema (approved | is_approved | status)
        const approvedFlag = Boolean((student as any)?.approved ?? (student as any)?.is_approved ?? ((student as any)?.status === 'approved'))
        if (!approvedFlag) {
          router.push('/pending-approval')
          setIsApproved(false)
        } else {
          setIsApproved(true)
        }

        setIsLoading(false)
      } catch (err: any) {
        console.error('Approval guard error:', err)
        setError(err.message || 'Unknown error')
        setIsLoading(false)
      }
    }

    checkApprovalStatus()
  }, [router])

  return {
    isLoading,
    isApproved,
    error,
    studentId,
  }
}
