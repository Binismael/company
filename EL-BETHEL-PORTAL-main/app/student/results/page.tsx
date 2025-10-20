'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, Award, BarChart3, Download, AlertCircle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

interface Result {
  id: string
  subject: { name: string; code: string }
  score: number
  grade: string
  term: string
  session: string
  max_score: number
  teacher_comment?: string
  created_at: string
}

interface PerformanceSummary {
  averageScore: number
  totalSubjects: number
  excellentCount: number
  goodCount: number
  averageCount: number
  belowAverageCount: number
}

export default function StudentResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)

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

        const { data: resultsData, error } = await supabase
          .from('results')
          .select(`
            *,
            subject:subjects(name, code)
          `)
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setResults(resultsData || [])
        
        if (resultsData && resultsData.length > 0) {
          const latestResult = resultsData[0]
          setSelectedTerm(latestResult.term)
          setSelectedSession(latestResult.session)
          calculateSummary(resultsData)
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [router])

  const calculateSummary = (data: Result[]) => {
    const avg = data.reduce((sum, r) => sum + r.score, 0) / data.length
    const excellent = data.filter(r => ['A', 'A+'].includes(r.grade)).length
    const good = data.filter(r => ['B', 'B+'].includes(r.grade)).length
    const average = data.filter(r => ['C', 'C+'].includes(r.grade)).length
    const belowAverage = data.filter(r => ['D', 'F'].includes(r.grade)).length

    setSummary({
      averageScore: Math.round(avg),
      totalSubjects: data.length,
      excellentCount: excellent,
      goodCount: good,
      averageCount: average,
      belowAverageCount: belowAverage,
    })
  }

  const filteredResults = results.filter(
    r => r.term === selectedTerm && r.session === selectedSession
  )

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
      case 'A+':
        return 'bg-green-100 text-green-800'
      case 'B':
      case 'B+':
        return 'bg-blue-100 text-blue-800'
      case 'C':
      case 'C+':
        return 'bg-yellow-100 text-yellow-800'
      case 'D':
        return 'bg-orange-100 text-orange-800'
      case 'F':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const chartData = filteredResults.map(r => ({
    name: r.subject.code,
    score: r.score,
    maxScore: r.max_score,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Results</h1>
          <p className="text-gray-600 mt-2">View your academic performance and grades</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No results available yet. Results will appear here once your teacher releases them.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Results</h1>
        <p className="text-gray-600 mt-2">View your academic performance and grades</p>
      </div>

      {/* Performance Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">{summary.averageScore}</div>
              <p className="text-xs text-gray-500 mt-1">Out of 100</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{summary.totalSubjects}</div>
              <p className="text-xs text-gray-500 mt-1">Enrolled courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Excellent Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{summary.excellentCount}</div>
              <p className="text-xs text-gray-500 mt-1">A & A+ grades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Below Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{summary.belowAverageCount}</div>
              <p className="text-xs text-gray-500 mt-1">D & F grades</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Your scores across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#1e40af" name="Your Score" />
                <Bar dataKey="maxScore" fill="#e5e7eb" name="Max Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>Per-subject breakdown and feedback</CardDescription>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{result.subject.name}</h3>
                      <p className="text-sm text-gray-600">Code: {result.subject.code}</p>
                    </div>
                    <Badge className={getGradeColor(result.grade)}>
                      {result.grade}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-gray-600">Score</p>
                      <p className="font-semibold text-lg">{result.score}/{result.max_score}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Percentage</p>
                      <p className="font-semibold text-lg">
                        {((result.score / result.max_score) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Released</p>
                      <p className="font-semibold text-lg">
                        {new Date(result.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {result.teacher_comment && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                      <p className="text-sm font-medium text-blue-900">Teacher's Comment</p>
                      <p className="text-sm text-blue-800 mt-1">{result.teacher_comment}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-600">No results for this term</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
