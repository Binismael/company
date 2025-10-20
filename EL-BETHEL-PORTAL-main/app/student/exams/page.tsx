'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ExamSession {
  id: string
  title: string
  description: string
  subject: { name: string; code: string }
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
  total_marks: number
}

interface ExamAttempt {
  id: string
  exam_session_id: string
  status: string
  started_at: string
  submitted_at?: string
  total_score?: number
  total_marks?: number
}

export default function StudentExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<ExamSession[]>([])
  const [attempts, setAttempts] = useState<Record<string, ExamAttempt>>({})
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const initializePage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!studentData) {
          toast.error('Student profile not found')
          return
        }

        setStudentId(studentData.id)

        const response = await fetch(`/api/exams/sessions?role=student&userId=${user.id}`)
        const examsData = await response.json()
        setExams(examsData.data || [])

        const attemptsResponse = await fetch(`/api/exams/attempts?studentId=${studentData.id}`)
        const attemptsData = await attemptsResponse.json()

        const attemptsMap: Record<string, ExamAttempt> = {}
        attemptsData.data?.forEach((attempt: ExamAttempt) => {
          attemptsMap[attempt.exam_session_id] = attempt
        })
        setAttempts(attemptsMap)
      } catch (error: any) {
        toast.error(error.message || 'Failed to load exams')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [router])

  const handleStartExam = async (examId: string) => {
    if (!studentId) {
      toast.error('Student profile not found')
      return
    }

    try {
      const response = await fetch('/api/exams/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examSessionId: examId,
          studentId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to start exam')
        return
      }

      toast.success('Exam started! Good luck!')
      router.push(`/student/exams/${examId}/take?attemptId=${data.data.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to start exam')
    }
  }

  const handleContinueExam = (examId: string, attemptId: string) => {
    router.push(`/student/exams/${examId}/take?attemptId=${attemptId}`)
  }

  const getExamStatus = (exam: ExamSession, attempt?: ExamAttempt) => {
    if (attempt?.status === 'submitted') {
      return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }

    const now = new Date()
    const startTime = new Date(exam.start_time)
    const endTime = new Date(exam.end_time)

    if (attempt?.status === 'in_progress') {
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Clock }
    }

    if (now < startTime) {
      return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    }

    if (now > endTime) {
      return { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    }

    return { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading exams...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
        <p className="text-gray-600 mt-2">View and take available exams</p>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No exams available at this time</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => {
            const attempt = attempts[exam.id]
            const { label, color, icon: IconComponent } = getExamStatus(exam, attempt)

            return (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{exam.title}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="space-y-1">
                          <p>Subject: {exam.subject?.name}</p>
                          <p>Duration: {exam.duration_minutes} minutes</p>
                          <p>Total Marks: {exam.total_marks}</p>
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
                    {exam.description && (
                      <p className="text-sm text-gray-600">{exam.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Start Time</p>
                        <p className="font-medium">
                          {new Date(exam.start_time).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">End Time</p>
                        <p className="font-medium">
                          {new Date(exam.end_time).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {attempt?.status === 'submitted' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-800">
                          Exam submitted on {new Date(attempt.submitted_at!).toLocaleString()}
                        </p>
                        {attempt.total_score !== undefined && (
                          <p className="text-sm text-green-700 mt-1">
                            Score: {attempt.total_score} / {attempt.total_marks}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      {!attempt ? (
                        <Button
                          onClick={() => handleStartExam(exam.id)}
                          className="w-full"
                          disabled={new Date() > new Date(exam.end_time)}
                        >
                          Start Exam
                        </Button>
                      ) : attempt.status === 'in_progress' ? (
                        <Button
                          onClick={() => handleContinueExam(exam.id, attempt.id)}
                          className="w-full"
                          variant="outline"
                        >
                          Continue Exam
                        </Button>
                      ) : null}
                    </div>
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
