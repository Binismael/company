'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, Check } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string
  class: { name: string }
  subject: { name: string }
  due_date: string
}

interface Submission {
  id: string
  student_id: string
  student: { user: { full_name: string }; admission_number: string }
  submitted_at: string
  file_url: string
  score: number | null
  feedback: string | null
  status: string
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.assignmentId as string

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeForm, setGradeForm] = useState({
    score: '',
    feedback: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get assignment
        const { data: assignmentData } = await supabase
          .from('assignments')
          .select(`
            *,
            class:classes(name),
            subject:subjects(name)
          `)
          .eq('id', assignmentId)
          .eq('teacher_id', authUser.id)
          .single()

        setAssignment(assignmentData)

        // Get submissions
        const { data: submissionsData } = await supabase
          .from('assignment_submissions')
          .select(`
            *,
            student:students(user:users(full_name),admission_number)
          `)
          .eq('assignment_id', assignmentId)
          .order('submitted_at', { ascending: false })

        setSubmissions(submissionsData || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [assignmentId, router])

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedSubmission) return

    try {
      const { error: err } = await supabase
        .from('assignment_submissions')
        .update({
          score: parseFloat(gradeForm.score),
          feedback: gradeForm.feedback,
          status: 'Graded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedSubmission.id)

      if (err) throw err

      // Update local state
      setSubmissions(
        submissions.map(s =>
          s.id === selectedSubmission.id
            ? {
                ...s,
                score: parseFloat(gradeForm.score),
                feedback: gradeForm.feedback,
                status: 'Graded',
              }
            : s
        )
      )

      setSuccess('Submission graded successfully!')
      setSelectedSubmission(null)
      setGradeForm({ score: '', feedback: '' })
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Assignment not found</p>
      </div>
    )
  }

  const submittedCount = submissions.filter(s => s.status !== 'Not Submitted').length
  const gradedCount = submissions.filter(s => s.status === 'Graded').length

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Assignment Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{assignment.title}</CardTitle>
          <CardDescription className="mt-2">
            {assignment.class.name} • {assignment.subject.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignment.description && (
              <div>
                <p className="text-sm text-gray-600">{assignment.description}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-gray-500">Due Date</p>
                <p className="font-medium">
                  {new Date(assignment.due_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Submissions</p>
                <p className="font-medium">
                  {submittedCount}/{submissions.length}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Graded</p>
                <p className="font-medium">{gradedCount}/{submittedCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions & Grading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {submissions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No submissions</p>
                ) : (
                  submissions.map((submission) => (
                    <button
                      key={submission.id}
                      onClick={() => {
                        setSelectedSubmission(submission)
                        setGradeForm({
                          score: submission.score?.toString() || '',
                          feedback: submission.feedback || '',
                        })
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSubmission?.id === submission.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {submission.student.user.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {submission.student.admission_number}
                          </p>
                        </div>
                        <Badge
                          variant={submission.status === 'Graded' ? 'default' : 'secondary'}
                          className="flex-shrink-0"
                        >
                          {submission.status === 'Not Submitted' ? 'Missing' : submission.status}
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grading Form */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <Card>
              <CardHeader>
                <CardTitle>Grade Submission</CardTitle>
                <CardDescription>
                  {selectedSubmission.student.user.full_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSubmission.file_url && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Submitted File:
                    </p>
                    <a
                      href={selectedSubmission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {selectedSubmission.file_url.split('/').pop()}
                    </a>
                  </div>
                )}

                {selectedSubmission.submitted_at && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                    </p>
                  </div>
                )}

                <form onSubmit={handleGradeSubmission} className="space-y-4">
                  <div>
                    <Label htmlFor="score">Score (out of 100)</Label>
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="Enter score"
                      value={gradeForm.score}
                      onChange={(e) =>
                        setGradeForm({ ...gradeForm, score: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Provide feedback to the student..."
                      rows={6}
                      value={gradeForm.feedback}
                      onChange={(e) =>
                        setGradeForm({ ...gradeForm, feedback: e.target.value })
                      }
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    <Check className="h-4 w-4" />
                    Save Grade & Feedback
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">
                  Select a submission to grade
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
