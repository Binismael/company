'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Eye, Lock, Unlock, Download, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ExamResult {
  id: string
  student: {
    admission_number: string
  }
  total_score: number
  total_marks: number
  percentage: number
  grade: string
  visible_to_student: boolean
  can_download_pdf: boolean
  passed: boolean
}

export default function AdminResultsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string

  const [results, setResults] = useState<ExamResult[]>([])
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [releaseAll, setReleaseAll] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadResults = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        const { data: examData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', examId)
          .single()

        setExam(examData)

        const { data: resultsData } = await supabase
          .from('exam_results')
          .select(`
            *,
            student:students(admission_number)
          `)
          .eq('exam_session_id', examId)
          .order('created_at', { ascending: false })

        setResults(resultsData || [])
      } catch (error: any) {
        toast.error('Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [examId, router])

  const handleReleaseResult = async (resultId: string) => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .update({
          visible_to_student: true,
          released_by: userId,
          released_at: new Date().toISOString(),
        })
        .eq('id', resultId)
        .select()
        .single()

      if (error) throw error

      setResults(
        results.map((r) =>
          r.id === resultId ? { ...r, visible_to_student: true } : r
        )
      )

      toast.success('Result released to student')
    } catch (error: any) {
      toast.error('Failed to release result')
    }
  }

  const handleReleaseAll = async () => {
    try {
      const { error } = await supabase
        .from('exam_results')
        .update({
          visible_to_student: true,
          released_by: userId,
          released_at: new Date().toISOString(),
        })
        .eq('exam_session_id', examId)
        .eq('visible_to_student', false)

      if (error) throw error

      setResults(
        results.map((r) => ({ ...r, visible_to_student: true }))
      )

      toast.success('All results released')
      setOpenDialog(false)
    } catch (error: any) {
      toast.error('Failed to release results')
    }
  }

  const handleEnableDownload = async (resultId: string) => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .update({ can_download_pdf: true })
        .eq('id', resultId)
        .select()
        .single()

      if (error) throw error

      setResults(
        results.map((r) =>
          r.id === resultId ? { ...r, can_download_pdf: true } : r
        )
      )

      toast.success('PDF download enabled for this result')
    } catch (error: any) {
      toast.error('Failed to update download settings')
    }
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

  const releasedCount = results.filter((r) => r.visible_to_student).length
  const unreleased = results.filter((r) => !r.visible_to_student)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{exam?.title}</h1>
          <p className="text-gray-600 mt-2">Manage and Release Results</p>
        </div>
        <div className="flex gap-3">
          {unreleased.length > 0 && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Release All Results
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Release All Results?</DialogTitle>
                  <DialogDescription>
                    This will make all {unreleased.length} unreleased results visible to
                    students.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Students will receive notifications and be able to view their exam
                      results.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setOpenDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleReleaseAll} className="flex-1">
                      Release Results
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{results.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Released</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{releasedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unreleased</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{unreleased.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {results.length > 0
                ? ((results.filter((r) => r.passed).length / results.length) * 100).toFixed(1)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {results.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No results available yet</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Results List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Admission No.</th>
                    <th className="text-right py-3 px-4 font-medium">Score</th>
                    <th className="text-right py-3 px-4 font-medium">Percentage</th>
                    <th className="text-center py-3 px-4 font-medium">Grade</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{result.student.admission_number}</td>
                      <td className="text-right py-3 px-4 font-medium">
                        {result.total_score} / {result.total_marks}
                      </td>
                      <td className="text-right py-3 px-4">
                        {result.percentage.toFixed(1)}%
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge className={getGradeColor(result.grade)}>
                          {result.grade}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        {result.visible_to_student ? (
                          <Badge className="bg-green-100 text-green-800">Released</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Unreleased</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {!result.visible_to_student && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReleaseResult(result.id)}
                            >
                              <Unlock className="w-3 h-3" />
                            </Button>
                          )}
                          {!result.can_download_pdf && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEnableDownload(result.id)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
