'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Download, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface ExamResult {
  id: string
  exam_session: {
    title: string
    subject: { name: string }
    term: string
    session: string
  }
  total_score: number
  total_marks: number
  percentage: number
  grade: string
  passed: boolean
  can_download_pdf: boolean
  visible_to_student: boolean
  released_at?: string
}

export default function StudentResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const loadResults = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

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

        const { data: resultsData } = await supabase
          .from('exam_results')
          .select(`
            *,
            exam_session:exam_sessions(
              title,
              term,
              session,
              subject:subjects(name)
            )
          `)
          .eq('student_id', studentData.id)
          .eq('visible_to_student', true)
          .order('released_at', { ascending: false })

        setResults(resultsData || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [router])

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

  const handleDownloadPDF = (resultId: string) => {
    toast.success('PDF download feature coming soon')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading your results...</div>
      </div>
    )
  }

  const passedCount = results.filter((r) => r.passed).length
  const averageScore =
    results.length > 0
      ? (results.reduce((sum, r) => sum + r.total_score, 0) / results.length).toFixed(1)
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
        <p className="text-gray-600 mt-2">Your exam performance and grades</p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No results available yet</p>
              <p className="text-sm text-gray-500 mb-6">
                Your exam results will appear here once they are released by your teacher
              </p>
              <Button onClick={() => router.push('/student/exams')} variant="outline">
                View Available Exams
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Exams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{results.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Passed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{passedCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{averageScore}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{result.exam_session.title}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="space-y-1">
                          <p>Subject: {result.exam_session.subject?.name}</p>
                          <p className="text-xs">
                            {result.exam_session.term} - {result.exam_session.session}
                          </p>
                          <p className="text-xs text-gray-500">
                            Released: {new Date(result.released_at || '').toLocaleDateString()}
                          </p>
                        </div>
                      </CardDescription>
                    </div>
                    <Badge className={getGradeColor(result.grade)}>
                      {result.grade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Score</p>
                        <p className="text-lg font-semibold">
                          {result.total_score} / {result.total_marks}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Percentage</p>
                        <p className="text-lg font-semibold">{result.percentage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="text-lg font-semibold">
                          {result.passed ? (
                            <span className="text-green-600">Passed</span>
                          ) : (
                            <span className="text-red-600">Not Passed</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {result.can_download_pdf && (
                      <Button
                        onClick={() => handleDownloadPDF(result.id)}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Result PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
