'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Upload, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Assignment {
  id: string
  title: string
  description?: string
  subject: { name: string; code: string }
  due_date: string
  max_score: number
  created_at: string
}

interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  submitted_at: string
  file_url?: string
  score?: number
  feedback?: string
  status: string
}

export default function StudentAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({})
  const [loading, setLoading] = useState(true)
  const [classId, setClassId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [uploadDialog, setUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const initializePage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: studentData } = await supabase
          .from('students')
          .select('id, class_id')
          .eq('user_id', user.id)
          .single()

        if (!studentData) {
          toast.error('Student profile not found')
          return
        }

        setStudentId(studentData.id)
        setClassId(studentData.class_id)

        const response = await fetch(`/api/assignments/by-class?class_id=${studentData.class_id}`)
        const assignmentsData = await response.json()
        setAssignments(assignmentsData || [])

        const submissionsResponse = await fetch(`/api/submissions?studentId=${studentData.id}`)
        const submissionsData = await submissionsResponse.json()

        const submissionsMap: Record<string, AssignmentSubmission> = {}
        submissionsData.data?.forEach((submission: AssignmentSubmission) => {
          submissionsMap[submission.assignment_id] = submission
        })
        setSubmissions(submissionsMap)
      } catch (error: any) {
        toast.error(error.message || 'Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [router])

  const handleSubmitAssignment = async () => {
    if (!uploadFile || !selectedAssignment || !studentId) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    try {
      const fileName = `assignment_${selectedAssignment.id}_${studentId}_${Date.now()}`
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .upload(fileName, uploadFile)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('assignment-submissions')
        .getPublicUrl(fileName)

      const submitResponse = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          studentId,
          fileUrl: urlData.publicUrl,
          status: 'submitted',
        }),
      })

      if (!submitResponse.ok) {
        toast.error('Failed to submit assignment')
        return
      }

      const submissionData = await submitResponse.json()

      setSubmissions({
        ...submissions,
        [selectedAssignment.id]: submissionData.data,
      })

      toast.success('Assignment submitted successfully!')
      setUploadDialog(false)
      setUploadFile(null)
      setSelectedAssignment(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit assignment')
    } finally {
      setUploading(false)
    }
  }

  const isAssignmentOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const getAssignmentStatus = (assignment: Assignment, submission?: AssignmentSubmission) => {
    if (submission) {
      if (submission.status === 'graded') {
        return { label: 'Graded', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      }
      return { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Clock }
    }

    if (isAssignmentOverdue(assignment.due_date)) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    }

    return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Calendar }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading assignments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-gray-600 mt-2">View and submit class assignments</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No assignments available at this time</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const submission = submissions[assignment.id]
            const { label, color, icon: IconComponent } = getAssignmentStatus(assignment, submission)
            const isOverdue = isAssignmentOverdue(assignment.due_date)

            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="space-y-1">
                          <p>Subject: {assignment.subject?.name}</p>
                          <p>Max Score: {assignment.max_score} marks</p>
                        </div>
                      </CardDescription>
                    </div>
                    <Badge className={color}>
                      <IconComponent className="w-4 h-4 mr-1" />
                      {label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignment.description && (
                      <p className="text-sm text-gray-600">{assignment.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Due Date</p>
                        <p className="font-medium">
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      {isOverdue && !submission && (
                        <Alert className="flex-1">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800 text-xs">
                            This assignment is overdue. Submit as soon as possible.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {submission && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-800">
                          Submitted on {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                        {submission.status === 'graded' && submission.score !== undefined && (
                          <p className="text-sm text-blue-700 mt-1">
                            Score: {submission.score} / {assignment.max_score}
                          </p>
                        )}
                        {submission.feedback && (
                          <p className="text-sm text-blue-700 mt-2">
                            Feedback: {submission.feedback}
                          </p>
                        )}
                      </div>
                    )}

                    {!submission && (
                      <Dialog open={uploadDialog && selectedAssignment?.id === assignment.id} onOpenChange={setUploadDialog}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedAssignment(assignment)}
                            variant="outline"
                            disabled={isOverdue}
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Submit Assignment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Submit Assignment</DialogTitle>
                            <DialogDescription>
                              Upload your assignment file for {selectedAssignment?.title}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Select File</label>
                              <input
                                type="file"
                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Supported formats: PDF, DOC, DOCX, images
                              </p>
                            </div>

                            <Button
                              onClick={handleSubmitAssignment}
                              disabled={!uploadFile || uploading}
                              className="w-full"
                            >
                              {uploading ? 'Submitting...' : 'Submit Assignment'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
