'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Download, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface ExamAttempt {
  id: string
  student: {
    admission_number: string
    user_id: string
  }
  total_score: number
  total_marks: number
  percentage: number
  status: string
  started_at: string
  submitted_at?: string
}

export default function TeacherResultsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string

  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    attempted: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    passRate: 0,
  })

  useEffect(() => {
    const loadResults = async () => {
      try {
        const { data: examData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', examId)
          .single()

        setExam(examData)

        const response = await fetch(`/api/exams/attempts?examSessionId=${examId}`)
        const attemptsData = await response.json()
        const data = attemptsData.data || []

        setAttempts(data)

        if (data.length > 0) {
          const submitted = data.filter((a: ExamAttempt) => a.status === 'submitted')
          const scores = submitted.map((a: ExamAttempt) => a.total_score || 0)
          const passingMark = examData.passing_mark || 40
          const percentages = submitted.map(
            (a: ExamAttempt) => ((a.total_score || 0) / (a.total_marks || 100)) * 100
          )

          setStats({
            totalStudents: data.length,
            attempted: submitted.length,
            averageScore:
              submitted.length > 0
                ? (scores.reduce((a: number, b: number) => a + b, 0) / submitted.length).toFixed(1)
                : 0,
            highestScore: submitted.length > 0 ? Math.max(...scores) : 0,
            lowestScore: submitted.length > 0 ? Math.min(...scores) : 0,
            passRate:
              submitted.length > 0
                ? (
                    (percentages.filter((p: number) => p >= passingMark).length /
                      submitted.length) *
                    100
                  ).toFixed(1)
                : 0,
          })
        }
      } catch (error: any) {
        toast.error('Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [examId])

  const getGrade = (percentage: number) => {
    if (percentage >= 70) return 'A'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C'
    if (percentage >= 40) return 'D'
    return 'F'
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800'
      case 'B':
        return 'bg-blue-100 text-blue-800'
      case 'C':
        return 'bg-yellow-100 text-yellow-800'
      case 'D':
        return 'bg-orange-100 text-orange-800'
      case 'F':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading results...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{exam?.title}</h1>
        <p className="text-gray-600 mt-2">Exam Results Summary</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalStudents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Attempted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.attempted}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.averageScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Highest</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.highestScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lowest</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.lowestScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.passRate}%</p>
          </CardContent>
        </Card>
      </div>

      {attempts.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No student attempts yet</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Student Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Admission No.</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Score</th>
                    <th className="text-right py-3 px-4 font-medium">Percentage</th>
                    <th className="text-center py-3 px-4 font-medium">Grade</th>
                    <th className="text-left py-3 px-4 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => {
                    const percentage =
                      attempt.total_marks > 0
                        ? ((attempt.total_score || 0) / attempt.total_marks) * 100
                        : 0
                    const grade = getGrade(percentage)

                    return (
                      <tr key={attempt.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{attempt.student.admission_number}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="capitalize">
                            {attempt.status}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {attempt.total_score} / {attempt.total_marks}
                        </td>
                        <td className="text-right py-3 px-4">
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge className={getGradeColor(grade)}>{grade}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {attempt.submitted_at
                            ? new Date(attempt.submitted_at).toLocaleString()
                            : 'Not submitted'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
