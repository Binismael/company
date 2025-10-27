'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
import {
  Check,
  X,
  Loader2,
  AlertTriangle,
  Eye,
  Mail,
} from 'lucide-react'

interface PendingStudent {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  gender?: string
  class: string
  section: string
  guardian_name: string
  guardian_phone: string
  guardian_email?: string
  reg_number?: string
  created_at: string
  approved: boolean
}

async function fetchPendingStudents(): Promise<PendingStudent[]> {
  try {
    // Debug probe: check table access and RLS
    console.log('🔍 Checking students table...')
    const { data: probeData, error: probeError } = await supabase
      .from('students')
      .select('*')
      .limit(5)
    console.log('📦 Raw data:', probeData)
    console.log('⚠️ Error info:', probeError)
    if (!probeData || probeData.length === 0) {
      toast.warning('No student records found — check table name or RLS.')
    }

    // Actual fetch for pending approvals
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('approved', false)

    if (error) {
      toast.error('Supabase error while loading students')
      console.error('Supabase error details:', {
        message: error.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      })
      return []
    }

    return (data as PendingStudent[]) || []
  } catch (err) {
    console.error('❌ Fetch error:', err)
    toast.error('Unexpected error loading pending students')
    return []
  }
}

export default function PendingStudentsPage() {
  const [students, setStudents] = useState<PendingStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<Record<string, boolean>>({})
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const base = await fetchPendingStudents()
      if (base.length > 0) {
        const userIds = base.map((s) => s.user_id)
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds)

        if (!userError && users) {
          const userMap = new Map(users.map((u) => [u.id, u.email]))
          const enriched = base.map((student) => ({
            ...student,
            email: userMap.get(student.user_id) || 'N/A',
          }))
          setStudents(enriched)
        } else {
          setStudents(base)
        }
      } else {
        setStudents(base)
      }
      setLoading(false)
    }
    load()
  }, [])

  const approveStudent = async (studentId: string) => {
    try {
      setApproving((prev) => ({ ...prev, [studentId]: true }))

      const { error } = await supabase
        .from('students')
        .update({ approved: true })
        .eq('id', studentId)

      if (error) {
        console.error('Supabase error details:', error?.message, error?.details, error)
        toast.error(getErrorMessage(error, 'Failed to approve student'))
        return
      }

      // Log approval
      const student = students.find(s => s.id === studentId)
      if (student) {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase
          .from('student_approval_logs')
          .insert([{
            student_id: studentId,
            admin_user_id: user?.id,
            action: 'approved',
            note: 'Approved by admin'
          }])
      }

      setStudents((prev) => prev.filter((s) => s.id !== studentId))
      toast.success('Student approved successfully')
    } catch (error) {
      console.error('Error approving student:', error)
      toast.error(getErrorMessage(error, 'An error occurred'))
    } finally {
      setApproving((prev) => ({ ...prev, [studentId]: false }))
    }
  }

  const rejectStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to reject this registration? The student will need to re-register.')) {
      return
    }

    try {
      setApproving((prev) => ({ ...prev, [studentId]: true }))

      // Log rejection
      const student = students.find(s => s.id === studentId)
      if (student) {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase
          .from('student_approval_logs')
          .insert([{
            student_id: studentId,
            admin_user_id: user?.id,
            action: 'rejected',
            note: 'Rejected by admin'
          }])
      }

      const { error } = await supabase
        .from('students')
        .update({ approved: false })
        .eq('id', studentId)

      if (error) {
        console.error('Supabase error details:', error?.message, error?.details, error)
        toast.error(getErrorMessage(error, 'Failed to reject student'))
        return
      }

      setStudents((prev) => prev.filter((s) => s.id !== studentId))
      toast.success('Student registration marked as rejected')
    } catch (error) {
      console.error('Error rejecting student:', error)
      toast.error(getErrorMessage(error, 'An error occurred'))
    } finally {
      setApproving((prev) => ({ ...prev, [studentId]: false }))
    }
  }

  const StudentDetailModal = ({ student }: { student: PendingStudent }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>
                {student.first_name} {student.last_name}
              </CardTitle>
              <CardDescription>{student.email}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedStudent(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="font-semibold mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">First Name</p>
                <p className="font-medium">{student.first_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Last Name</p>
                <p className="font-medium">{student.last_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Gender</p>
                <p className="font-medium">{student.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-medium">{student.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div>
            <h3 className="font-semibold mb-3">Academic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Class</p>
                <p className="font-medium">{student.class}</p>
              </div>
              <div>
                <p className="text-gray-600">Section</p>
                <p className="font-medium">{student.section}</p>
              </div>
              <div>
                <p className="text-gray-600">Registration Number</p>
                <p className="font-medium">{student.reg_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{student.email}</p>
              </div>
            </div>
          </div>

          {/* Guardian Info */}
          <div>
            <h3 className="font-semibold mb-3">Guardian Information</h3>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Guardian Name</p>
                <p className="font-medium">{student.guardian_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium">{student.guardian_phone}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">{student.guardian_email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-sm text-gray-600 border-t pt-4">
            Registered on {new Date(student.created_at).toLocaleString()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 border-t pt-4">
            <Button
              onClick={() => approveStudent(student.id)}
              disabled={approving[student.id]}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {approving[student.id] ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
            <Button
              onClick={() => rejectStudent(student.id)}
              disabled={approving[student.id]}
              variant="destructive"
              className="flex-1"
            >
              {approving[student.id] ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Pending Student Registrations</h1>
          <p className="text-gray-600 mt-1">
            {students.length} registration(s) awaiting approval
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Pending Approvals</p>
                <p className="text-3xl font-bold mt-2">{students.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert */}
        {students.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              Please review and approve student registrations. Students will be unable to access their portal until approval.
            </AlertDescription>
          </Alert>
        )}

        {/* Student List */}
        {students.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-gray-600">No pending registrations</p>
              <p className="text-gray-500 text-sm mt-1">
                All student registrations have been processed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {students.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-gray-600">Class</p>
                          <p className="font-medium">{student.class}{student.section}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Phone</p>
                          <p className="font-medium">{student.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Guardian</p>
                          <p className="font-medium">{student.guardian_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Reg. Number</p>
                          <p className="font-medium text-xs">{student.reg_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Registered</p>
                          <p className="font-medium">
                            {new Date(student.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedStudent(student)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => approveStudent(student.id)}
                        disabled={approving[student.id]}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approving[student.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => rejectStudent(student.id)}
                        disabled={approving[student.id]}
                        variant="destructive"
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedStudent && <StudentDetailModal student={selectedStudent} />}
    </div>
  )
}
