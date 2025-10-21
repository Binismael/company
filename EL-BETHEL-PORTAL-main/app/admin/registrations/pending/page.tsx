'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  Check,
  X,
  Loader2,
  AlertTriangle,
  Download,
  Eye,
} from 'lucide-react'

interface PendingStudent {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  gender: string
  date_of_birth: string
  phone: string
  address: string
  state: string
  lga: string
  guardian_name: string
  guardian_phone: string
  guardian_email: string
  guardian_relationship: string
  previous_school?: string
  photo_url?: string
  birth_certificate_url?: string
  id_proof_url?: string
  created_at: string
  class_id?: string
}

export default function PendingStudentsPage() {
  const [students, setStudents] = useState<PendingStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<Record<string, boolean>>({})
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null)

  useEffect(() => {
    fetchPendingStudents()
  }, [])

  const fetchPendingStudents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to load pending registrations')
        console.error(error)
        return
      }

      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const approveStudent = async (studentId: string) => {
    try {
      setApproving((prev) => ({ ...prev, [studentId]: true }))

      const { error } = await supabase
        .from('students')
        .update({ approved: true })
        .eq('id', studentId)

      if (error) {
        toast.error('Failed to approve student')
        return
      }

      setStudents((prev) => prev.filter((s) => s.id !== studentId))
      toast.success('Student approved successfully')
    } catch (error) {
      console.error('Error approving student:', error)
      toast.error('An error occurred')
    } finally {
      setApproving((prev) => ({ ...prev, [studentId]: false }))
    }
  }

  const rejectStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to reject this registration? This action cannot be undone.')) {
      return
    }

    try {
      setApproving((prev) => ({ ...prev, [studentId]: true }))

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (error) {
        toast.error('Failed to reject student')
        return
      }

      setStudents((prev) => prev.filter((s) => s.id !== studentId))
      toast.success('Student registration rejected')
    } catch (error) {
      console.error('Error rejecting student:', error)
      toast.error('An error occurred')
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
                <p className="text-gray-600">Gender</p>
                <p className="font-medium">{student.gender}</p>
              </div>
              <div>
                <p className="text-gray-600">Date of Birth</p>
                <p className="font-medium">
                  {new Date(student.date_of_birth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-medium">{student.phone}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{student.email}</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Address</p>
                <p className="font-medium">{student.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">State</p>
                  <p className="font-medium">{student.state}</p>
                </div>
                <div>
                  <p className="text-gray-600">LGA</p>
                  <p className="font-medium">{student.lga}</p>
                </div>
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
                  <p className="font-medium">{student.guardian_email}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600">Relationship</p>
                <p className="font-medium">{student.guardian_relationship}</p>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div>
            <h3 className="font-semibold mb-3">Academic Information</h3>
            <div className="grid grid-cols-1 gap-4 text-sm">
              {student.previous_school && (
                <div>
                  <p className="text-gray-600">Previous School</p>
                  <p className="font-medium">{student.previous_school}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          {(student.photo_url || student.birth_certificate_url || student.id_proof_url) && (
            <div>
              <h3 className="font-semibold mb-3">Uploaded Documents</h3>
              <div className="space-y-2">
                {student.photo_url && (
                  <a
                    href={student.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded bg-gray-100 hover:bg-gray-200 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Passport Photo</span>
                  </a>
                )}
                {student.birth_certificate_url && (
                  <a
                    href={student.birth_certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded bg-gray-100 hover:bg-gray-200 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Birth Certificate</span>
                  </a>
                )}
                {student.id_proof_url && (
                  <a
                    href={student.id_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded bg-gray-100 hover:bg-gray-200 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">ID Proof</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-sm text-gray-600 border-t pt-4">
            Registered on {new Date(student.created_at).toLocaleString()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 border-t pt-4">
            <Button
              onClick={() => approveStudent(student.id)}
              disabled={approving[student.id]}
              className="flex-1"
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
              Please review and approve student registrations. Students will be notified of approval
              status via email.
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

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-gray-600">Gender</p>
                          <p className="font-medium">{student.gender}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Phone</p>
                          <p className="font-medium">{student.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Guardian</p>
                          <p className="font-medium">{student.guardian_name}</p>
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
