'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import StudentPortalLayout from '@/components/student-portal-layout'
import { useStudentApprovalGuard } from '@/hooks/use-student-approval-guard'
import {
  useStudentProfile,
  useStudentClasses,
  useStudentSubjects,
  useStudentExams,
  useStudentResults,
  useStudentFees,
  useStudentAttendance,
} from '@/hooks/use-student-data'

export default function StudentDashboard() {
  const router = useRouter()
  const { isLoading: approvalLoading, isApproved } = useStudentApprovalGuard()
  const [userId, setUserId] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { profile, loading: profileLoading } = useStudentProfile(userId)
  const { classes, loading: classesLoading } = useStudentClasses(userId)
  const { subjects, loading: subjectsLoading } = useStudentSubjects(userId)
  const { exams, loading: examsLoading } = useStudentExams(userId)
  const { results, loading: resultsLoading } = useStudentResults(userId)
  const { fees, totalFees, paidFees, balance, loading: feesLoading } = useStudentFees(userId)
  const { attendance, loading: attendanceLoading } = useStudentAttendance(userId)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

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

        if (userData) {
          setUserInfo(userData)
        }
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

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0
    const present = attendance.filter(
      (a) => a.status === 'Present' || a.status === 'Late'
    ).length
    return ((present / attendance.length) * 100).toFixed(1)
  }

  const calculateAverageScore = () => {
    if (results.length === 0) return 0
    const total = results.reduce((sum: number, r: any) => sum + (r.score || 0), 0)
    return (total / results.length).toFixed(2)
  }

  const getUpcomingExams = () => {
    const now = new Date()
    return exams
      .filter((exam: any) => new Date(exam.start_time) > now)
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3)
  }

  if (approvalLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-yellow-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-yellow-50">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-600 animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-xl">Account Pending Approval</CardTitle>
            <CardDescription>
              Your account is awaiting admin approval. You will be redirected to the pending approval page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const upcomingExams = getUpcomingExams()
  const isDataLoading =
    profileLoading || classesLoading || subjectsLoading || examsLoading || resultsLoading || feesLoading || attendanceLoading

  return (
    <StudentPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">⚜</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Welcome, {userInfo?.full_name?.split(' ')[0] || 'Student'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {profile?.registration_number && `ID: ${profile.registration_number}`}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {isDataLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    calculateAverageScore()
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {results.length} results
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Subjects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600">
                  {isDataLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    subjects.length
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enrolled this term
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                  Fees Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-amber-600">
                  {isDataLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `₦${balance.toLocaleString()}`
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Outstanding
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
                  {isDataLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${calculateAttendancePercentage()}%`
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Present this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button
              onClick={() => router.push('/student/exams')}
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2 justify-start px-4"
            >
              <Calendar className="h-5 w-5" />
              <span>My Exams</span>
            </Button>
            <Button
              onClick={() => router.push('/student/results')}
              variant="outline"
              className="h-12 font-medium gap-2 justify-start px-4"
            >
              📊
              <span>My Results</span>
            </Button>
            <Button
              onClick={() => router.push('/student/payments')}
              variant="outline"
              className="h-12 font-medium gap-2 justify-start px-4"
            >
              💳
              <span>Pay Fees</span>
            </Button>
          </div>

          {/* Upcoming Exams */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Exams
              </CardTitle>
              <CardDescription>
                Your scheduled exams for this term
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : upcomingExams.length > 0 ? (
                <div className="space-y-3">
                  {upcomingExams.map((exam: any) => (
                    <div
                      key={exam.id}
                      className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {exam.subject || exam.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(exam.start_time).toLocaleDateString()} •{' '}
                              {Math.round((new Date(exam.end_time).getTime() - new Date(exam.start_time).getTime()) / 60000)} minutes
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-blue-600 text-white whitespace-nowrap">
                          {exam.exam_type || 'CBT'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-8">No upcoming exams scheduled</p>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classes Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Classes Enrolled</CardTitle>
              </CardHeader>
              <CardContent>
                {isDataLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classes.length > 0 ? (
                      classes.map((cls: any) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium text-gray-900">{cls.name}</span>
                          <Badge variant="outline">{cls.level}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-600 py-4">No classes assigned yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fee Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fee Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isDataLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-gray-900">Paid</span>
                      <span className="font-semibold text-green-600">₦{paidFees.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-sm font-medium text-gray-900">Outstanding</span>
                      <span className="font-semibold text-red-600">₦{balance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-900">Total</span>
                      <span className="font-semibold text-gray-900">₦{totalFees.toLocaleString()}</span>
                    </div>
                    <Button
                      onClick={() => router.push('/student/payments')}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Pay Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentPortalLayout>
  )
}
