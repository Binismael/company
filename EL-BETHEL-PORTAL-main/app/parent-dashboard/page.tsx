'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertCircle,
  LogOut,
  Menu,
  X,
  Download,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

export default function ParentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/parent-login')
          return
        }

        // Get user profile
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError || userProfile.role !== 'parent') {
          throw new Error('Unauthorized')
        }

        setUser(userProfile)

        // Get parent's children
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select(
            `
            *,
            children:parent_student(
              student:students(
                id,
                admission_number,
                user:users(full_name),
                class:classes(name, form_level)
              )
            )
          `
          )
          .eq('user_id', authUser.id)
          .single()

        if (parentError) {
          throw new Error(parentError.message)
        }

        if (parentData.children && parentData.children.length > 0) {
          const mappedChildren = parentData.children.map((c: any) => c.student)
          setChildren(mappedChildren)
          setSelectedChild(mappedChildren[0])

          // Fetch results for first child
          await fetchChildData(mappedChildren[0].id)
        } else {
          setError('No children found. Please contact the admin.')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const fetchChildData = async (studentId: string) => {
    try {
      // Fetch results
      const { data: resultsData } = await supabase
        .from('results')
        .select('*, subject:subjects(name), class:classes(name)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      setResults(resultsData || [])

      // Fetch attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('attendance_date', { ascending: false })
        .limit(30)

      setAttendance(attendanceData || [])

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(5)

      setAnnouncements(announcementsData || [])
    } catch (err: any) {
      toast.error('Failed to load child data')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/parent-login')
  }

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0
    const present = attendance.filter((a) => a.status === 'Present').length
    return Math.round((present / attendance.length) * 100)
  }

  const calculateAverageScore = () => {
    if (results.length === 0) return 0
    const total = results.reduce((sum, r) => sum + (r.score || 0), 0)
    return (total / results.length).toFixed(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.full_name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 bg-white border-r border-gray-200 p-6 space-y-6`}
        >
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">My Children</h2>
            <div className="space-y-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChild(child)
                    fetchChildData(child.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedChild?.id === child.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{child.user.full_name}</div>
                  <div className="text-xs text-gray-500">
                    {child.class.name} • {child.admission_number}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <Link
              href="/parent-dashboard/fees"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
            >
              School Fees
            </Link>
            <Link
              href="/parent-dashboard/profile"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium mt-2"
            >
              My Profile
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selectedChild && (
            <div className="space-y-6">
              {/* Child Profile Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedChild.user.full_name}
                      </h2>
                      <p className="text-gray-600">
                        {selectedChild.class.name} • {selectedChild.class.form_level}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Admission: {selectedChild.admission_number}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Full Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Average Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {calculateAverageScore()}%
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {results.length} subjects graded
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {calculateAttendancePercentage()}%
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {attendance.filter((a) => a.status === 'Present').length} days present
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      Subjects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {results.length}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Total registered</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="results" className="bg-white rounded-lg">
                <TabsList className="grid w-full grid-cols-3 p-4 bg-gray-50 border-b">
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="announcements">Announcements</TabsTrigger>
                </TabsList>

                {/* Results Tab */}
                <TabsContent value="results" className="p-6 space-y-4">
                  {results.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 font-semibold text-gray-900">Subject</th>
                            <th className="text-left py-3 font-semibold text-gray-900">Score</th>
                            <th className="text-left py-3 font-semibold text-gray-900">Grade</th>
                            <th className="text-left py-3 font-semibold text-gray-900">Term</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result) => (
                            <tr
                              key={result.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 text-gray-900">{result.subject.name}</td>
                              <td className="py-3 font-semibold">{result.score}%</td>
                              <td className="py-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    result.score >= 70
                                      ? 'bg-green-100 text-green-800'
                                      : result.score >= 50
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {result.grade || (result.score >= 70 ? 'A' : result.score >= 50 ? 'B' : 'C')}
                                </span>
                              </td>
                              <td className="py-3 text-gray-600">{result.term}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-600">No results available yet</p>
                  )}
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="p-6">
                  {attendance.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {attendance.filter((a) => a.status === 'Present').length}
                          </div>
                          <p className="text-xs text-gray-600">Present</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {attendance.filter((a) => a.status === 'Absent').length}
                          </div>
                          <p className="text-xs text-gray-600">Absent</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {attendance.filter((a) => a.status === 'Late').length}
                          </div>
                          <p className="text-xs text-gray-600">Late</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {attendance.filter((a) => a.status === 'Excused').length}
                          </div>
                          <p className="text-xs text-gray-600">Excused</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 font-semibold text-gray-900">Date</th>
                              <th className="text-left py-3 font-semibold text-gray-900">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.slice(0, 10).map((record) => (
                              <tr
                                key={record.id}
                                className="border-b border-gray-100 hover:bg-gray-50"
                              >
                                <td className="py-3">
                                  {new Date(record.attendance_date).toLocaleDateString()}
                                </td>
                                <td className="py-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      record.status === 'Present'
                                        ? 'bg-green-100 text-green-800'
                                        : record.status === 'Absent'
                                        ? 'bg-red-100 text-red-800'
                                        : record.status === 'Late'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-600">No attendance records yet</p>
                  )}
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="p-6 space-y-4">
                  {announcements.length > 0 ? (
                    announcements.map((announcement) => (
                      <Card key={announcement.id} className="border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{announcement.title}</CardTitle>
                          <CardDescription>
                            {new Date(announcement.published_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 text-sm">{announcement.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center py-8 text-gray-600">No announcements yet</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
