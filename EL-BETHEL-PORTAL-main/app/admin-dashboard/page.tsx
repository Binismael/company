'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Users, BookOpen, DollarSign, AlertCircle, CheckCircle, TrendingUp, Plus, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import {
  useAdminOverview,
  useAllStudents,
  useAllTeachers,
  useAllClasses,
  useAllSubjects,
  usePendingApprovals,
} from '@/hooks/use-admin-data'

export default function AdminDashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { overview } = useAdminOverview()
  const { students } = useAllStudents()
  const { teachers } = useAllTeachers()
  const { classes } = useAllClasses()
  const { subjects } = useAllSubjects()
  const { pending } = usePendingApprovals()

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

        if (userData?.role !== 'admin') {
          router.push('/student-dashboard')
          return
        }

        setUserInfo(userData)
      } catch (err: any) {
        setError(err.message || 'Failed to load admin')
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

  const feePercentage = overview
    ? ((overview.total_fees_paid / overview.total_fees_expected) * 100).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">⚙️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {userInfo?.full_name}</p>
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

        {/* Pending Alerts */}
        {(pending.students.length > 0 || pending.exams.length > 0 || pending.results.length > 0) && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 ml-2">
              You have {pending.students.length} pending student approvals, {pending.exams.length} pending exams, and {pending.results.length} pending results to review.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {overview?.total_students || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Total Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {overview?.total_teachers || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">On Staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Fees Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                ₦{(overview?.total_fees_paid || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">{feePercentage}% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Outstanding Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                ₦{(overview?.total_fees_expected - (overview?.total_fees_paid || 0) || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Due</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/registrations/create-student">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Student</span>
            </Button>
          </Link>
          <Link href="/admin/registrations/create-teacher">
            <Button className="w-full bg-green-600 hover:bg-green-700 h-12 gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Teacher</span>
            </Button>
          </Link>
          <Link href="/admin/registrations/pending">
            <Button variant="outline" className="w-full h-12 gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Approvals</span>
            </Button>
          </Link>
          <Link href="/admin/classes">
            <Button variant="outline" className="w-full h-12 gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Classes</span>
            </Button>
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Overview */}
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">Classes</p>
                    <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">Subjects</p>
                    <p className="text-2xl font-bold text-indigo-600">{subjects.length}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending Exams</p>
                    <p className="text-2xl font-bold text-amber-600">{overview?.pending_exams || 0}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending Results</p>
                    <p className="text-2xl font-bold text-red-600">{overview?.pending_results || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Students
                  </span>
                  <Link href="/admin/users">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {students.length > 0 ? (
                  <div className="space-y-2">
                    {students.slice(0, 5).map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {student.users?.full_name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {student.registration_number}
                          </p>
                        </div>
                        <Badge variant="outline">{student.class_level}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-4">No students registered yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Teachers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recent Teachers
                  </span>
                  <Link href="/admin/teachers">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teachers.length > 0 ? (
                  <div className="space-y-2">
                    {teachers.slice(0, 5).map((teacher: any) => (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {teacher.users?.full_name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {teacher.employee_id}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-4">No teachers registered yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pending Approvals */}
            {(pending.students.length > 0 || pending.exams.length > 0) && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Pending Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pending.students.length > 0 && (
                    <Link href="/admin/registrations/pending">
                      <div className="p-3 bg-white border border-amber-200 rounded-lg hover:border-amber-300 transition-colors cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">
                          Student Approvals
                        </p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">
                          {pending.students.length}
                        </p>
                      </div>
                    </Link>
                  )}
                  {pending.exams.length > 0 && (
                    <Link href="/admin/exams">
                      <div className="p-3 bg-white border border-amber-200 rounded-lg hover:border-amber-300 transition-colors cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">
                          Pending Exams
                        </p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">
                          {pending.exams.length}
                        </p>
                      </div>
                    </Link>
                  )}
                  {pending.results.length > 0 && (
                    <Link href="/admin/results">
                      <div className="p-3 bg-white border border-amber-200 rounded-lg hover:border-amber-300 transition-colors cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">
                          Pending Results
                        </p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">
                          {pending.results.length}
                        </p>
                      </div>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">At A Glance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="font-bold text-gray-900">
                    {(overview?.total_students || 0) + (overview?.total_teachers || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Classes</span>
                  <span className="font-bold text-gray-900">{classes.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Subjects</span>
                  <span className="font-bold text-gray-900">{subjects.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Fee Collection</span>
                  <span className="font-bold text-green-600">{feePercentage}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/admin/settings">
                  <Button variant="outline" className="w-full justify-start">
                    System Settings
                  </Button>
                </Link>
                <Link href="/admin/announcements">
                  <Button variant="outline" className="w-full justify-start">
                    Send Announcement
                  </Button>
                </Link>
                <Link href="/admin/reports">
                  <Button variant="outline" className="w-full justify-start">
                    View Reports
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
