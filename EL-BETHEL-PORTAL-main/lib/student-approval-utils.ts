import { supabase } from './supabase-client'

/**
 * Send approval notification email (optional - requires email service setup)
 */
export async function sendApprovalEmail(
  studentEmail: string,
  studentName: string,
  admissionNumber: string
): Promise<boolean> {
  try {
    // This would call a backend function that sends email
    // For now, just return true
    console.log(`[EMAIL] Approval sent to ${studentEmail}`, {
      studentName,
      admissionNumber,
    })
    return true
  } catch (error) {
    console.error('Error sending approval email:', error)
    return false
  }
}

/**
 * Send rejection notification email (optional)
 */
export async function sendRejectionEmail(
  studentEmail: string,
  studentName: string,
  reason: string
): Promise<boolean> {
  try {
    console.log(`[EMAIL] Rejection sent to ${studentEmail}`, {
      studentName,
      reason,
    })
    return true
  } catch (error) {
    console.error('Error sending rejection email:', error)
    return false
  }
}

/**
 * Get approval statistics by date range
 */
export async function getApprovalStats(
  startDate?: string,
  endDate?: string
): Promise<{
  total: number
  approved: number
  rejected: number
  pending: number
  approvalRate: number
}> {
  try {
    let query = supabase.from('student_approvals').select('status', { count: 'exact' })

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const allRes = await query

    const approvedRes = await supabase
      .from('student_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')

    const rejectedRes = await supabase
      .from('student_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected')

    const pendingRes = await supabase
      .from('student_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const total = allRes.count || 0
    const approved = approvedRes.count || 0
    const rejected = rejectedRes.count || 0
    const pending = pendingRes.count || 0

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    }
  } catch (error) {
    console.error('Error fetching approval stats:', error)
    return {
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      approvalRate: 0,
    }
  }
}

/**
 * Export pending students to CSV (for admin reports)
 */
export async function exportPendingStudentsToCSV(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('pending_student_registrations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!data || data.length === 0) {
      return null
    }

    // Create CSV header
    const headers = [
      'Admission Number',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Gender',
      'Date of Birth',
      'State',
      'LGA',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Email',
      'Created At',
    ]

    // Create CSV rows
    const rows = data.map((student: any) => [
      student.admission_number,
      student.first_name,
      student.last_name,
      student.email,
      student.phone,
      student.gender,
      student.date_of_birth,
      student.state,
      student.lga,
      student.guardian_name,
      student.guardian_phone,
      student.guardian_email,
      new Date(student.created_at).toLocaleString(),
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) =>
        row.map((cell: any) => `"${cell?.toString().replace(/"/g, '""') || ''}"`).join(',')
      ),
    ].join('\n')

    return csvContent
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    return null
  }
}

/**
 * Get student approval timeline (when they applied and reviewed)
 */
export async function getStudentApprovalTimeline(studentId: string) {
  try {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('created_at, approval_date')
      .eq('id', studentId)
      .single()

    if (studentError) throw studentError

    const { data: approval, error: approvalError } = await supabase
      .from('student_approvals')
      .select('status, created_at, reviewed_at')
      .eq('student_id', studentId)
      .single()

    if (approvalError && approvalError.code !== 'PGRST116') throw approvalError

    return {
      applicationDate: student?.created_at,
      approvalDate: student?.approval_date,
      approvalStatus: approval?.status,
      reviewedAt: approval?.reviewed_at,
    }
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return null
  }
}

/**
 * Generate approval report for a date range
 */
export async function generateApprovalReport(
  startDate: string,
  endDate: string
): Promise<{
  period: string
  totalApplications: number
  totalApproved: number
  totalRejected: number
  totalPending: number
  averageApprovalTime: string
}> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, created_at, approval_date')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (error) throw error

    const approvedStudents = data?.filter((s) => s.approval_date) || []

    let totalApprovalTime = 0
    approvedStudents.forEach((student) => {
      const applicationDate = new Date(student.created_at)
      const approvalDate = new Date(student.approval_date)
      const timeDiff = approvalDate.getTime() - applicationDate.getTime()
      totalApprovalTime += timeDiff
    })

    const averageTimeMs =
      approvedStudents.length > 0 ? totalApprovalTime / approvedStudents.length : 0
    const averageTimeHours = Math.round(averageTimeMs / (1000 * 60 * 60))

    return {
      period: `${startDate} to ${endDate}`,
      totalApplications: data?.length || 0,
      totalApproved: approvedStudents.length,
      totalRejected: 0, // Would need to fetch from student_approvals
      totalPending: (data?.length || 0) - approvedStudents.length,
      averageApprovalTime:
        averageTimeHours > 0 ? `${averageTimeHours} hours` : 'Pending',
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return {
      period: `${startDate} to ${endDate}`,
      totalApplications: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalPending: 0,
      averageApprovalTime: 'N/A',
    }
  }
}

/**
 * Bulk approve students (admin only)
 */
export async function bulkApproveStudents(studentIds: string[], adminId: string): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  try {
    for (const studentId of studentIds) {
      try {
        const { data, error } = await supabase.rpc('approve_student_registration', {
          p_student_id: studentId,
          p_admin_id: adminId,
          p_comments: 'Bulk approved',
        })

        if (error) {
          results.failed++
          results.errors.push(`${studentId}: ${error.message}`)
        } else if (data === true) {
          results.success++
        }
      } catch (error) {
        results.failed++
        results.errors.push(`${studentId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  } catch (error) {
    console.error('Error in bulk approval:', error)
  }

  return results
}

/**
 * Search students with advanced filters
 */
export async function searchStudents(filters: {
  query?: string
  state?: string
  gender?: string
  classId?: string
  approved?: boolean
}): Promise<any[]> {
  try {
    let query = supabase
      .from('pending_student_registrations')
      .select('*')

    if (filters.query) {
      query = query.or(
        `first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`
      )
    }

    if (filters.state) {
      query = query.eq('state', filters.state)
    }

    if (filters.gender) {
      query = query.eq('gender', filters.gender)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error searching students:', error)
    return []
  }
}
