'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import {
  getPendingStudents,
  getStudentWithDocuments,
  approveStudent,
  rejectStudent,
  getStudentRegistrationStats,
} from '@/lib/student-registration-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  FileText,
  Phone,
  MapPin,
  Calendar,
  Users,
  GraduationCap,
  Loader2,
  Clock,
  Eye,
} from 'lucide-react'

interface StudentRegistration {
  id: string
  admission_number: string
  first_name: string
  last_name: string
  gender: string
  date_of_birth: string
  phone: string
  address: string
  state: string
  lga: string
  guardian_name: string
  guardian_phone: string
  guardian_email: string
  email: string
  created_at: string
  approval_status: string
  reviewed_at: string
}

export default function StudentRegistrationsPage() {
  const router = useRouter()
  const [pendingStudents, setPendingStudents] = useState<StudentRegistration[]>([])
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<StudentRegistration | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approveComments, setApproveComments] = useState('')
  const [processing, setProcessing] = useState(false)
  const [studentDetails, setStudentDetails] = useState<any>(null)
  const [filterText, setFilterText] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [studentsData, statsData] = await Promise.all([
        getPendingStudents(),
        getStudentRegistrationStats(),
      ])

      setPendingStudents(studentsData || [])
      setStats(statsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (student: StudentRegistration) => {
    setSelectedStudent(student)
    try {
      const details = await getStudentWithDocuments(student.id)
      setStudentDetails(details)
    } catch (error) {
      console.error('Error fetching details:', error)
      toast.error('Failed to load student details')
    }
    setShowDetailDialog(true)
  }

  const handleApprove = async () => {
    if (!selectedStudent) return

    setProcessing(true)
    try {
      const { user } = await supabase.auth.getUser()
      const result = await approveStudent(selectedStudent.id, user?.id || '', approveComments)

      if (result.success) {
        toast.success(`${selectedStudent.first_name} approved successfully!`)
        setShowApproveDialog(false)
        setApproveComments('')
        await loadData()
      } else {
        toast.error(result.error || 'Failed to approve student')
      }
    } catch (error) {
      console.error('Error approving student:', error)
      toast.error('Failed to approve student')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedStudent || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setProcessing(true)
    try {
      const { user } = await supabase.auth.getUser()
      const result = await rejectStudent(selectedStudent.id, user?.id || '', rejectReason)

      if (result.success) {
        toast.success(`${selectedStudent.first_name} registration rejected`)
        setShowRejectDialog(false)
        setRejectReason('')
        await loadData()
      } else {
        toast.error(result.error || 'Failed to reject student')
      }
    } catch (error) {
      console.error('Error rejecting student:', error)
      toast.error('Failed to reject student')
    } finally {
      setProcessing(false)
    }
  }

  const filteredStudents = pendingStudents.filter((student) =>
    `${student.first_name} ${student.last_name} ${student.email} ${student.admission_number}`
      .toLowerCase()
      .includes(filterText.toLowerCase())
  )

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Registrations</h1>
          <p className="text-gray-600">Manage and approve registrations</p>
          <div className="mt-4 flex gap-4">
            <Button
              onClick={() => router.push('/admin/registrations/create-student')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Student
            </Button>
            <Button
              onClick={() => router.push('/admin/registrations/create-teacher')}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Teacher
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={stats.total}
            color="bg-blue-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Approved"
            value={stats.approved}
            color="bg-green-500"
          />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-yellow-500" />
          <StatCard icon={XCircle} label="Rejected" value={stats.rejected} color="bg-red-500" />
        </div>

        {/* Registrations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Registrations</CardTitle>
            <CardDescription>Review and approve new student registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="pending">Pending ({pendingStudents.length})</TabsTrigger>
                <TabsTrigger value="all">All Registrations</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                {/* Search */}
                <div className="mb-6">
                  <Input
                    placeholder="Search by name, email, or admission number..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>No Pending Registrations</AlertTitle>
                    <AlertDescription>
                      All student registrations have been processed
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Admission #</th>
                          <th className="text-left py-3 px-4 font-semibold">Student Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Email</th>
                          <th className="text-left py-3 px-4 font-semibold">Phone</th>
                          <th className="text-left py-3 px-4 font-semibold">State</th>
                          <th className="text-left py-3 px-4 font-semibold">Applied</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{student.admission_number}</td>
                            <td className="py-3 px-4">
                              {student.first_name} {student.last_name}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{student.email}</td>
                            <td className="py-3 px-4 text-sm">{student.phone}</td>
                            <td className="py-3 px-4 text-sm">{student.state}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {new Date(student.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(student)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedStudent(student)
                                    setShowApproveDialog(true)
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedStudent(student)
                                    setShowRejectDialog(true)
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                <Alert>
                  <AlertDescription>
                    View all registrations including approved and rejected. Coming soon...
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogTitle>
            <DialogDescription>{selectedStudent?.email}</DialogDescription>
          </DialogHeader>

          {studentDetails ? (
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium">{studentDetails.student?.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium">
                      {new Date(studentDetails.student?.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{studentDetails.student?.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">
                        {studentDetails.student?.address}, {studentDetails.student?.state},{' '}
                        {studentDetails.student?.lga}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardian Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Guardian Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Guardian Name</p>
                    <p className="font-medium">{studentDetails.student?.guardian_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Relationship</p>
                    <p className="font-medium">
                      {studentDetails.student?.guardian_relationship}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{studentDetails.student?.guardian_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{studentDetails.student?.guardian_email}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {studentDetails.documents?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                  <div className="space-y-2">
                    {studentDetails.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{doc.document_type}</p>
                          <p className="text-xs text-gray-500">{doc.file_name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Status */}
              {studentDetails.approval && (
                <Alert>
                  <AlertDescription>
                    Status: <span className="font-semibold">{studentDetails.approval.status}</span>
                    {studentDetails.approval.reviewed_at && (
                      <>
                        <br />
                        Reviewed: {new Date(studentDetails.approval.reviewed_at).toLocaleString()}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {selectedStudent?.first_name}{' '}
              {selectedStudent?.last_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Input
              id="comments"
              placeholder="Add approval comments or notes..."
              value={approveComments}
              onChange={(e) => setApproveComments(e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="flex justify-end gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting {selectedStudent?.first_name}'s registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <textarea
              id="reason"
              placeholder="Explain why this registration is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full mt-2 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
