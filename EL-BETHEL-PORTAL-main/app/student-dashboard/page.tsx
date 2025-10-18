'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, BookOpen, Calendar, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'

interface Student {
  id: string
  user_id: string
  admission_number: string
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
}

interface Attendance {
  id: string
  attendance_date: string
  status: string
  class: { name: string }
}

export default function StudentDashboard() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
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
          .limit(20)

        if (attendanceError) throw attendanceError
        setAttendance(attendanceData)
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

  const calculateGPA = () => {
    if (results.length === 0) return 0
    const total = results.reduce((sum, r) => sum + (r.score || 0), 0)
    return (total / results.length).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {student?.user.full_name}
              </h1>
              <p className="text-gray-600 mt-1">
                {student?.class.form_level} • {student?.class.name} •{' '}
                {student?.admission_number}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Current GPA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">
                {calculateGPA()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Based on {results.length} subjects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Attendance Rate
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {results.length > 0
                  ? new Set(results.map((r) => r.subject.code)).size
                  : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Subjects taking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="results" className="gap-2">
              <Award className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <Calendar className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Academic Results</CardTitle>
                <CardDescription>
                  Your grades and scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No results available yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-4 font-medium">
                            Subject
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Score
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Grade
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Term
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Session
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result) => (
                          <tr
                            key={result.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-2 px-4">
                              {result.subject.name}
                            </td>
                            <td className="py-2 px-4">{result.score}</td>
                            <td className="py-2 px-4">
                              <Badge
                                variant={
                                  result.grade === 'A'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {result.grade}
                              </Badge>
                            </td>
                            <td className="py-2 px-4">{result.term}</td>
                            <td className="py-2 px-4">{result.session}</td>
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
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>
                  Your attendance history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No attendance records available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-4 font-medium">
                            Date
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Status
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Class
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((record) => (
                          <tr
                            key={record.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-2 px-4">
                              {new Date(
                                record.attendance_date
                              ).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-4">
                              <Badge
                                variant={
                                  record.status === 'Present'
                                    ? 'default'
                                    : record.status === 'Absent'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {record.status}
                              </Badge>
                            </td>
                            <td className="py-2 px-4">
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

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>
                  Your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">{student?.user.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{student?.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Admission Number</p>
                    <p className="font-medium">{student?.admission_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Class</p>
                    <p className="font-medium">{student?.class.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Form Level</p>
                    <p className="font-medium">{student?.class.form_level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium">
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
