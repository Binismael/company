'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, BookOpen, Calendar, Award, FileText, Download, TrendingUp, CheckCircle, AlertCircle, Clock, Bell, Megaphone } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import StudentPortalLayout from '@/components/student-portal-layout'
import { useStudentApprovalGuard } from '@/hooks/use-student-approval-guard'

interface Student {
  id: string
  user_id: string
  admission_number: string
  reg_number?: string
  date_of_birth?: string
  gender?: string
  class: { name: string; form_level: string }
  user: { full_name: string; email: string }
}

interface Result {
  id: string
  subject: { name: string; code: string }
  score: number
  grade: string
  term: string
  session: string
  created_at: string
}

interface Attendance {
  id: string
  attendance_date: string
  status: string
  class: { name: string }
}

interface Assignment {
  id: string
  title: string
  subject: { name: string }
  due_date: string
  status: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const { isLoading: approvalLoading, isApproved } = useStudentApprovalGuard()
  const [student, setStudent] = useState<Student | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            *,
            class:classes(name, form_level),
            user:users(full_name, email)
          `)
          .eq('user_id', user.id)
          .single()

        if (studentError) throw studentError
        setStudent(studentData)

        const { data: resultsData, error: resultsError } = await supabase
          .from('results')
          .select(`
            *,
            subject:subjects(name, code)
          `)
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })

        if (resultsError) throw resultsError
        setResults(resultsData)

        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select(`
            *,
            class:classes(name)
          `)
          .eq('student_id', studentData.id)
          .order('attendance_date', { ascending: false })
          .limit(30)

        if (attendanceError) throw attendanceError
        setAttendance(attendanceData)

        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            subject:subjects(name)
          `)
          .eq('class_id', studentData.class_id)
          .order('due_date', { ascending: true })
          .limit(10)

        if (assignmentsError) throw assignmentsError
        setAssignments(assignmentsData)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0
    const present = attendance.filter(
      (a) => a.status === 'Present' || a.status === 'Late'
    ).length
    return ((present / attendance.length) * 100).toFixed(1)
  }

  const calculateAverageScore = () => {
    if (results.length === 0) return 0
    const total = results.reduce((sum, r) => sum + (r.score || 0), 0)
    return (total / results.length).toFixed(2)
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-yellow-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <StudentPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">⚜</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Welcome, {student?.user.full_name?.split(' ')[0]}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Student • ID: {student?.reg_number || student?.admission_number}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
        </div>

        {/* Main Content */}
        <div>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Current GPA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary-600">
                4.57
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Overall performance
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Overall Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-amber-600">
                A
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Excellent standing
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Class Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                3rd
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Out of 45 students
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {calculateAttendancePercentage()}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Present this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Learning Assistant Section */}
        <Card className="border-0 shadow-sm mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              AI Learning Assistant
            </CardTitle>
            <CardDescription>
              Personalized recommendations and study guidance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Focus Area 1 */}
                <div className="bg-white rounded-lg p-4 border border-red-200 bg-red-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Focus on Organic Chemistry</h3>
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    You performed in organic chemistry topics needs improvement
                  </p>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    Start Practice
                  </Button>
                </div>

                {/* Focus Area 2 */}
                <div className="bg-white rounded-lg p-4 border border-green-200 bg-green-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Excellent in Calculus</h3>
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    You're performing exceptionally well in calculus topics
                  </p>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    Advanced Problems
                  </Button>
                </div>

                {/* Focus Area 3 */}
                <div className="bg-white rounded-lg p-4 border border-blue-200 bg-blue-50">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Physics Assignment Due</h3>
                    <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Don't forget physics assignment due tomorrow
                  </p>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    Submit Now
                  </Button>
                </div>
              </div>

              {/* Chat Section */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">💬</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Ask AI Tutor</p>
                    <p className="text-xs text-gray-600">Get instant help with your studies</p>
                  </div>
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Chat Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <Tabs defaultValue="exam" className="w-full mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex overflow-x-auto gap-2">
            <button
              onClick={() => router.push('/student/results')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap hover:bg-gray-50 rounded transition-colors"
            >
              Academics
            </button>
            <button
              onClick={() => router.push('/student/exams')}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded whitespace-nowrap hover:bg-gray-800 transition-colors"
            >
              Exam
            </button>
            <button
              onClick={() => router.push('/student/payments')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap hover:bg-gray-50 rounded transition-colors"
            >
              Payments
            </button>
            <button
              onClick={() => router.push('/student/assignments')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap hover:bg-gray-50 rounded transition-colors"
            >
              Assignments
            </button>
          </div>

          {/* Upcoming Exams */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Exams</h2>
              <p className="text-sm text-gray-600 mb-4">Your scheduled CBT and practical exams</p>

              <div className="space-y-3">
                {/* Exam 1 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Mathematics</h3>
                        <p className="text-sm text-gray-600 mt-1">2024-01-15 • 2 hours</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white whitespace-nowrap">CBT</Badge>
                  </div>
                </div>

                {/* Exam 2 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Physics</h3>
                        <p className="text-sm text-gray-600 mt-1">2024-01-17 • 1.5 hours</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white whitespace-nowrap">CBT</Badge>
                  </div>
                </div>

                {/* Exam 3 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Chemistry</h3>
                        <p className="text-sm text-gray-600 mt-1">2024-01-20 • 3 hours</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-600 text-white whitespace-nowrap">Practical</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Preparation */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Exam Preparation</h2>
              <p className="text-sm text-gray-600 mb-4">AI-powered study recommendations</p>

              <div className="space-y-3">
                {/* Status 1 */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-l-green-600">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Ready for Mathematics</h3>
                      <p className="text-sm text-gray-600 mt-1">You've completed 85% of practice questions</p>
                    </div>
                  </div>
                </div>

                {/* Status 2 */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-l-amber-600">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Physics Needs Attention</h3>
                      <p className="text-sm text-gray-600 mt-1">Focus on electromagnetic waves topic</p>
                    </div>
                  </div>
                </div>

                {/* Status 3 */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-l-red-600">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Chemistry Practice Needed</h3>
                      <p className="text-sm text-gray-600 mt-1">Complete organic chemistry exercises</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
    </StudentPortalLayout>
  )
}
