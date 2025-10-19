'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Users, BookOpen, Award, Calendar, Download, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface Student {
  id: string
  admission_number: string
  reg_number?: string
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
}

export default function ParentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [children, setChildren] = useState<Student[]>([])
  const [selectedChild, setSelectedChild] = useState<Student | null>(null)
  const [childResults, setChildResults] = useState<Result[]>([])
  const [childAttendance, setChildAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError || userData.role !== 'parent') {
          router.push('/auth/login')
          return
        }

        setUser(userData)

        const { data: childrenData, error: childrenError } = await supabase
          .from('students')
          .select(`
            *,
            class:classes(name, form_level),
            user:users(full_name, email)
          `)
          .limit(10)

        if (childrenError) throw childrenError
        setChildren(childrenData)

        if (childrenData.length > 0) {
          await loadChildData(childrenData[0])
          setSelectedChild(childrenData[0])
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadChildData = async (child: Student) => {
    try {
      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select(`
          *,
          subject:subjects(name, code)
        `)
        .eq('student_id', child.id)
        .order('created_at', { ascending: false })

      if (resultsError) throw resultsError
      setChildResults(resultsData)

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', child.id)
        .order('attendance_date', { ascending: false })

      if (attendanceError) throw attendanceError
      setChildAttendance(attendanceData)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSelectChild = async (child: Student) => {
    setSelectedChild(child)
    await loadChildData(child)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const calculateAttendancePercentage = () => {
    if (childAttendance.length === 0) return 0
    const present = childAttendance.filter(
      (a) => a.status === 'Present' || a.status === 'Late'
    ).length
    return ((present / childAttendance.length) * 100).toFixed(1)
  }

  const calculateAverageScore = () => {
    if (childResults.length === 0) return 0
    const total = childResults.reduce((sum, r) => sum + (r.score || 0), 0)
    return (total / childResults.length).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-yellow-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">⚜</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Welcome, {user?.full_name?.split(' ')[0]}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Parent • Monitor children's progress
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {children.length === 0 ? (
          <Alert>
            <AlertDescription>
              No children records found in the system.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Child Selector */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">My Children</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={selectedChild?.id === child.id ? 'default' : 'outline'}
                    onClick={() => handleSelectChild(child)}
                    className="h-auto p-4 text-left justify-start flex-col items-start rounded-lg"
                  >
                    <span className="font-bold text-sm">{child.user.full_name}</span>
                    <span className="text-xs opacity-75 mt-1">{child.class.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {selectedChild && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Average Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-primary-600">
                        {calculateAverageScore()}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {childResults.length} results
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Attendance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">
                        {calculateAttendancePercentage()}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {childAttendance.length} records
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Class
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                        {selectedChild.class.form_level}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedChild.class.name}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex overflow-x-auto gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded whitespace-nowrap">
                    Results
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
                    Attendance
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
                    Profile
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Results Section */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Academic Results</CardTitle>
                          <CardDescription>
                            {selectedChild.user.full_name}'s grades and scores
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Export</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {childResults.length === 0 ? (
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
                              </tr>
                            </thead>
                            <tbody>
                              {childResults.map((result) => (
                                <tr
                                  key={result.id}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="py-3 px-4 font-medium text-gray-900">
                                    {result.subject.name}
                                  </td>
                                  <td className="py-3 px-4 text-gray-600">{result.score}%</td>
                                  <td className="py-3 px-4">
                                    <Badge variant="secondary">
                                      {result.grade}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-gray-600 text-xs">
                                    {result.term}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Attendance Section */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Attendance Summary</CardTitle>
                      <CardDescription>
                        {selectedChild.user.full_name}'s attendance record
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {childAttendance.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          No attendance records available
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-2xl font-bold text-green-600">
                                {childAttendance.filter(a => a.status === 'Present').length}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Present</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-2xl font-bold text-red-600">
                                {childAttendance.filter(a => a.status === 'Absent').length}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Absent</p>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-2xl font-bold text-yellow-600">
                                {childAttendance.filter(a => a.status === 'Late').length}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Late</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-2xl font-bold text-blue-600">
                                {calculateAttendancePercentage()}%
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Rate</p>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="text-left py-3 px-4 font-medium">Date</th>
                                  <th className="text-left py-3 px-4 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {childAttendance.slice(0, 20).map((record, idx) => (
                                  <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4 text-gray-600">
                                      {new Date(record.attendance_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4">
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
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Profile Section */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Student Profile</CardTitle>
                      <CardDescription>
                        {selectedChild.user.full_name}'s information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Full Name</p>
                          <p className="font-semibold text-lg mt-1 text-gray-900">
                            {selectedChild.user.full_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Email</p>
                          <p className="font-semibold text-lg mt-1 text-gray-900">
                            {selectedChild.user.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Class</p>
                          <p className="font-semibold text-lg mt-1 text-gray-900">
                            {selectedChild.class.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Form Level</p>
                          <p className="font-semibold text-lg mt-1 text-gray-900">
                            {selectedChild.class.form_level}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">Registration Number</p>
                          <p className="font-semibold text-lg font-mono mt-1 text-gray-900">
                            {selectedChild.reg_number || selectedChild.admission_number}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
