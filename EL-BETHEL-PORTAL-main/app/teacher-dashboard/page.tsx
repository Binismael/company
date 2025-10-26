'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Users, BookOpen, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import {
  useTeacherProfile,
  useTeacherClasses,
  useTeacherSubjects,
  useTeacherExams,
  useTeacherPendingGrading,
  useTeacherStudents,
} from '@/hooks/use-teacher-data'

export default function TeacherDashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { profile } = useTeacherProfile(userId)
  const { classes } = useTeacherClasses(userId)
  const { subjects } = useTeacherSubjects(userId)
  const { exams } = useTeacherExams(userId)
  const { pendingGrading } = useTeacherPendingGrading(userId)
  const { students } = useTeacherStudents(userId)

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
        setError(err.message || 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
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
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">👨‍🏫</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {userInfo?.full_name?.split(' ')[0]}
                </h1>
                <p className="text-sm text-gray-600">
                  {profile?.employee_id && `ID: ${profile.employee_id}`} • Teacher
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{classes.length}</div>
              <p className="text-xs text-gray-500 mt-1">Assigned classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{subjects.length}</div>
              <p className="text-xs text-gray-500 mt-1">Teaching</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{students.length}</div>
              <p className="text-xs text-gray-500 mt-1">Under your classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Grading</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pendingGrading.length}</div>
              <p className="text-xs text-gray-500 mt-1">Exams to grade</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/teacher/exams/new">
            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2 justify-start px-4">
              <Calendar className="h-5 w-5" />
              <span>Create Exam</span>
            </Button>
          </Link>
          <Link href="/teacher/attendance">
            <Button variant="outline" className="w-full h-12 font-medium gap-2 justify-start px-4">
              <CheckCircle className="h-5 w-5" />
              <span>Take Attendance</span>
            </Button>
          </Link>
          <Link href="/teacher/results">
            <Button variant="outline" className="w-full h-12 font-medium gap-2 justify-start px-4">
              <AlertCircle className="h-5 w-5" />
              <span>Grade Results</span>
            </Button>
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assigned Classes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classes.length > 0 ? (
                  <div className="space-y-3">
                    {classes.slice(0, 5).map((cls: any) => (
                      <Link
                        key={cls.id}
                        href={`/teacher/classes/${cls.id}`}
                        className="block p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                            <p className="text-xs text-gray-600">Level: {cls.level}</p>
                          </div>
                          <Badge variant="outline">View Class</Badge>
                        </div>
                      </Link>
                    ))}
                    {classes.length > 5 && (
                      <Link href="/teacher/classes">
                        <Button variant="outline" className="w-full">
                          View All Classes ({classes.length})
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-8">No classes assigned yet</p>
                )}
              </CardContent>
            </Card>

            {/* Exams Created */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Exams
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exams.length > 0 ? (
                  <div className="space-y-3">
                    {exams.slice(0, 5).map((exam: any) => (
                      <div
                        key={exam.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{exam.name}</h3>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(exam.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">{exam.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {exams.length > 5 && (
                      <Link href="/teacher/exams">
                        <Button variant="outline" className="w-full">
                          View All Exams ({exams.length})
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-8">No exams created yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pending Grading */}
            <Card className={pendingGrading.length > 0 ? 'border-amber-200 bg-amber-50' : ''}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Pending Grading
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingGrading.length > 0 ? (
                  <>
                    <div className="text-3xl font-bold text-amber-600 mb-4">
                      {pendingGrading.length}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Exams awaiting your grades
                    </p>
                    <Link href="/teacher/results">
                      <Button className="w-full bg-amber-600 hover:bg-amber-700">
                        Grade Now
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">All grading complete</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Teaching Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Teaching Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Classes</span>
                    <span className="text-lg font-bold text-blue-600">{classes.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Subjects</span>
                    <span className="text-lg font-bold text-indigo-600">{subjects.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Students</span>
                    <span className="text-lg font-bold text-green-600">{students.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Exams Created</span>
                    <span className="text-lg font-bold text-purple-600">{exams.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/teacher/students" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Manage Students
                  </Button>
                </Link>
                <Link href="/teacher/attendance" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Attendance
                  </Button>
                </Link>
                <Link href="/teacher/messages" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    Messages
                  </Button>
                </Link>
                <Link href="/teacher/profile" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    My Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
