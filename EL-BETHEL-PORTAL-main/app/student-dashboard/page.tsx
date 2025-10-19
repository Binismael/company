'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, BookOpen, Calendar, Award, FileText, Download, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

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

        // Get student profile
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

        // Get results
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

        // Get attendance
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

        // Get assignments
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

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'text-green-600'
      case 'Absent':
        return 'text-red-600'
      case 'Late':
        return 'text-yellow-600'
      case 'Excused':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome, {student?.user.full_name}
              </h1>
              <div className="mt-2 space-y-1 text-primary-100">
                <p className="text-sm">
                  {student?.class.form_level} • {student?.class.name}
                </p>
                {student?.reg_number && (
                  <p className="text-sm font-mono">
                    Reg. No: <strong>{student.reg_number}</strong>
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 text-white border-white hover:bg-primary-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-primary-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">
                {calculateAverageScore()}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {results.length} results recorded
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {calculateAttendancePercentage()}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {attendance.length} records
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {results.length > 0
                  ? new Set(results.map((r) => r.subject.code)).size
                  : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                taking this term
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {assignments.filter(a => a.status === 'Not Submitted').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                assignments due
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="results" className="gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Academic Results</CardTitle>
                    <CardDescription>
                      Your grades and scores by subject
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No results available yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Subject</th>
                          <th className="text-left py-3 px-4 font-medium">Score</th>
                          <th className="text-left py-3 px-4 font-medium">Grade</th>
                          <th className="text-left py-3 px-4 font-medium">Term</th>
                          <th className="text-left py-3 px-4 font-medium">Session</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result) => (
                          <tr
                            key={result.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 font-medium">
                              {result.subject.name}
                            </td>
                            <td className="py-3 px-4">{result.score}%</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getGradeColor(result.grade)}`}>
                                {result.grade}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{result.term}</td>
                            <td className="py-3 px-4 text-gray-600">{result.session}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Attendance Records</CardTitle>
                    <CardDescription>
                      Your attendance history
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{calculateAttendancePercentage()}%</p>
                    <p className="text-xs text-gray-600">Attendance Rate</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No attendance records available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((record) => (
                          <tr
                            key={record.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              {new Date(
                                record.attendance_date
                              ).toLocaleDateString('en-US', { 
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold ${getAttendanceColor(record.status)}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {record.class.name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>
                  Your current assignments and submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No assignments available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {assignment.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {assignment.subject.name}
                            </p>
                          </div>
                          <Badge variant={assignment.status === 'Submitted' ? 'default' : 'outline'}>
                            {assignment.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>
                  Your account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Full Name</p>
                    <p className="font-semibold text-lg mt-1">{student?.user.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Email</p>
                    <p className="font-semibold text-lg mt-1">{student?.user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Registration Number</p>
                    <p className="font-semibold text-lg font-mono mt-1">
                      {student?.reg_number || student?.admission_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Class</p>
                    <p className="font-semibold text-lg mt-1">{student?.class.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Form Level</p>
                    <p className="font-semibold text-lg mt-1">{student?.class.form_level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Gender</p>
                    <p className="font-semibold text-lg mt-1">{student?.gender || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Date of Birth</p>
                    <p className="font-semibold text-lg mt-1">
                      {student?.date_of_birth
                        ? new Date(
                            student.date_of_birth
                          ).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
