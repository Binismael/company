'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Award, TrendingUp, Download, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useStudentResults, useStudentProfile } from '@/hooks/use-student-data'

interface Result {
  id: string
  subject: string
  score: number
  grade: string
  percentage: number
  term: string
  session: string
  exam_date: string
  teacher_feedback?: string
}

export default function StudentResultsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { results, loading: resultsLoading } = useStudentResults(userId)
  const { profile } = useStudentProfile(userId)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUserId(user.id)
      } catch (err: any) {
        setError(err.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const getGradeColor = (grade: string) => {
    const grades: Record<string, string> = {
      'A': 'bg-green-100 text-green-800 border-green-300',
      'B': 'bg-blue-100 text-blue-800 border-blue-300',
      'C': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'D': 'bg-orange-100 text-orange-800 border-orange-300',
      'F': 'bg-red-100 text-red-800 border-red-300',
    }
    return grades[grade] || 'bg-gray-100 text-gray-800'
  }

  const getGradePoints = (grade: string): number => {
    const points: Record<string, number> = {
      'A': 5,
      'B': 4,
      'C': 3,
      'D': 2,
      'F': 0,
    }
    return points[grade] || 0
  }

  const calculateGPA = () => {
    if (results.length === 0) return 0
    const totalPoints = results.reduce((sum: number, r: any) => sum + getGradePoints(r.grade), 0)
    return (totalPoints / results.length).toFixed(2)
  }

  const calculateAverageScore = () => {
    if (results.length === 0) return 0
    const total = results.reduce((sum: number, r: any) => sum + (r.score || 0), 0)
    return (total / results.length).toFixed(1)
  }

  const groupedResults = results.reduce((acc: any, result: any) => {
    const term = result.term || 'Unknown'
    if (!acc[term]) {
      acc[term] = []
    }
    acc[term].push(result)
    return acc
  }, {})

  const handleDownloadSlip = (resultId: string) => {
    // This would typically trigger a PDF download
    alert('Result slip download feature coming soon')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
              <p className="text-gray-600 mt-2">View your academic performance and grades</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">GPA</CardTitle>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-600">{calculateGPA()}</div>
                  <p className="text-xs text-gray-500 mt-1">{results.length} subjects</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600">{calculateAverageScore()}%</div>
                  <p className="text-xs text-gray-500 mt-1">Overall performance</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Best Subject</CardTitle>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : results.length > 0 ? (
                <>
                  <div className="text-3xl font-bold text-amber-600">
                    {results.reduce((best: any, current: any) =>
                      (current.score || 0) > (best.score || 0) ? current : best
                    ).subject}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Highest performing</p>
                </>
              ) : (
                <>
                  <div className="text-xl text-gray-500">N/A</div>
                  <p className="text-xs text-gray-500 mt-1">No results yet</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results by Term */}
        {resultsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : Object.keys(groupedResults).length > 0 ? (
          <Tabs defaultValue={Object.keys(groupedResults)[0]} className="w-full">
            <TabsList className="mb-6 bg-white border border-gray-200">
              {Object.keys(groupedResults).map((term) => (
                <TabsTrigger key={term} value={term}>
                  {term}
                  <Badge className="ml-2 bg-blue-600">
                    {groupedResults[term].length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.keys(groupedResults).map((term) => (
              <TabsContent key={term} value={term} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {groupedResults[term].map((result: any) => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {result.subjects?.name || result.subject}
                            </CardTitle>
                            <CardDescription>
                              Exam Date: {new Date(result.exam_date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className={`badge px-3 py-1 rounded-full font-bold ${getGradeColor(result.grade)}`}>
                                {result.grade}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{result.score || 0}/100</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Score Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Score</span>
                            <span className="text-sm font-bold text-gray-900">{result.percentage || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                result.percentage >= 80
                                  ? 'bg-green-600'
                                  : result.percentage >= 60
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                              }`}
                              style={{ width: `${result.percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Teacher Feedback */}
                        {result.teacher_feedback && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-900 mb-1">Teacher's Feedback</p>
                            <p className="text-sm text-blue-800">{result.teacher_feedback}</p>
                          </div>
                        )}

                        {/* Download Button */}
                        <Button
                          onClick={() => handleDownloadSlip(result.id)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Result Slip
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No results available</p>
              <p className="text-gray-500 mt-1">Your exam results will appear here once graded</p>
            </CardContent>
          </Card>
        )}

        {/* Performance Tips */}
        {results.length > 0 && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Focus on improving subjects where you scored below 60%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Practice regularly with past exam questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Consult with teachers for additional support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Use the AI tutor for personalized study recommendations</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
