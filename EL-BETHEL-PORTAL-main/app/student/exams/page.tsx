'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Calendar, Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useStudentExams } from '@/hooks/use-student-data'

interface Exam {
  id: string
  name: string
  subject?: string
  description?: string
  start_time: string
  end_time: string
  exam_type: string
  status: 'active' | 'completed' | 'upcoming'
  total_questions: number
  duration: number
  instructions?: string
}

export default function StudentExamsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { exams, loading: examsLoading } = useStudentExams(userId)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUserId(user.id)

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single()

        setUserInfo(userData)
      } catch (err: any) {
        setError(err.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const getExamStatus = (exam: Exam) => {
    const now = new Date()
    const startTime = new Date(exam.start_time)
    const endTime = new Date(exam.end_time)

    if (now < startTime) return 'upcoming'
    if (now >= startTime && now <= endTime) return 'active'
    return 'completed'
  }

  const sortedExams = {
    active: exams.filter((e: any) => getExamStatus(e) === 'active'),
    upcoming: exams.filter((e: any) => getExamStatus(e) === 'upcoming').sort(
      (a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ),
    completed: exams.filter((e: any) => getExamStatus(e) === 'completed'),
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTimeRemaining = (startTime: string) => {
    const now = new Date()
    const start = new Date(startTime)
    const diff = start.getTime() - now.getTime()

    if (diff < 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
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
              <h1 className="text-3xl font-bold text-gray-900">My Exams</h1>
              <p className="text-gray-600 mt-2">View and take your scheduled exams</p>
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

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-6 bg-white border border-gray-200">
            <TabsTrigger value="active" className="relative">
              Active
              {sortedExams.active.length > 0 && (
                <Badge className="ml-2 bg-red-600">{sortedExams.active.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="relative">
              Upcoming
              {sortedExams.upcoming.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{sortedExams.upcoming.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="relative">
              Completed
              {sortedExams.completed.length > 0 && (
                <Badge className="ml-2 bg-green-600">{sortedExams.completed.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Active Exams */}
          <TabsContent value="active" className="space-y-4">
            {examsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : sortedExams.active.length > 0 ? (
              sortedExams.active.map((exam: any) => (
                <Card
                  key={exam.id}
                  className="border-l-4 border-l-red-600 hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-red-600">IN PROGRESS</Badge>
                          <Badge variant="outline">{exam.total_questions || 0} Questions</Badge>
                        </div>
                        <CardTitle>{exam.name || exam.subject}</CardTitle>
                        <CardDescription>
                          Duration: {exam.duration || 120} minutes
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => router.push(`/student/exams/${exam.id}/take`)}
                        className="bg-red-600 hover:bg-red-700"
                        size="lg"
                      >
                        Continue Exam <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {exam.description && (
                    <CardContent>
                      <p className="text-sm text-gray-600">{exam.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No active exams</p>
                  <p className="text-gray-500 mt-1">You don't have any exams in progress</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Upcoming Exams */}
          <TabsContent value="upcoming" className="space-y-4">
            {examsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : sortedExams.upcoming.length > 0 ? (
              sortedExams.upcoming.map((exam: any) => (
                <Card
                  key={exam.id}
                  className="border-l-4 border-l-blue-600 hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-600">UPCOMING</Badge>
                          <Badge variant="outline">{exam.total_questions || 0} Questions</Badge>
                        </div>
                        <CardTitle>{exam.name || exam.subject}</CardTitle>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{formatDateTime(exam.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{exam.duration || 120} minutes</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {getTimeRemaining(exam.start_time) || 'Soon'}
                        </div>
                        <p className="text-xs text-gray-500">Time remaining</p>
                      </div>
                    </div>
                  </CardHeader>
                  {exam.description && (
                    <CardContent>
                      <p className="text-sm text-gray-600">{exam.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No upcoming exams</p>
                  <p className="text-gray-500 mt-1">Check back later for scheduled exams</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Exams */}
          <TabsContent value="completed" className="space-y-4">
            {examsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : sortedExams.completed.length > 0 ? (
              sortedExams.completed.map((exam: any) => (
                <Card
                  key={exam.id}
                  className="border-l-4 border-l-green-600 hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            COMPLETED
                          </Badge>
                          <Badge variant="outline">{exam.total_questions || 0} Questions</Badge>
                        </div>
                        <CardTitle>{exam.name || exam.subject}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(exam.start_time)}</span>
                        </div>
                      </div>
                      <Link href={`/student/results?exam=${exam.id}`}>
                        <Button variant="outline">View Results</Button>
                      </Link>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No completed exams</p>
                  <p className="text-gray-500 mt-1">Your exam results will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Exam Tips */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Exam Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Ensure stable internet connection before starting an exam</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Read all instructions carefully before beginning</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Manage your time effectively during the exam</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Do not close the browser or refresh the page during the exam</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
