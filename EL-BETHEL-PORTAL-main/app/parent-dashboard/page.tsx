'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Users, BookOpen, Award, Calendar, Download } from 'lucide-react'
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

        // Get user info
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

        // Get children (assuming parent has same email as student guardian)
        // In a real system, you'd have a parent-child relationship table
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
      // Get results
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

      // Get attendance
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome, {user?.full_name}
              </h1>
              <p className="mt-2 text-primary-100">
                Monitor your children's academic progress
              </p>
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
              <h2 className="text-lg font-bold text-gray-900 mb-3">My Children</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={selectedChild?.id === child.id ? 'default' : 'outline'}
                    onClick={() => handleSelectChild(child)}
                    className="h-auto p-4 text-left justify-start flex-col items-start"
                  >
                    <span className="font-bold text-lg">{child.user.full_name}</span>
                    <span className="text-xs opacity-75">{child.class.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {selectedChild && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card className="border-l-4 border-l-blue-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Average Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {calculateAverageScore()}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {childResults.length} results
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
                        {childAttendance.length} records
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Class
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {selectedChild.class.form_level}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedChild.class.name}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="results" className="gap-2">
                      <Award className="h-4 w-4" />
                      <span className="hidden sm:inline">Results</span>
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">Attendance</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="gap-2">
                      <Users className="h-4 w-4" />
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
                              {selectedChild.user.full_name}'s grades and scores
                            </CardDescription>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Export
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
                                    <td className="py-3 px-4 font-medium">
                                      {result.subject.name}
                                    </td>
                                    <td className="py-3 px-4">{result.score}%</td>
                                    <td className="py-3 px-4">
                                      <Badge variant="secondary">
                                        {result.grade}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
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
                  </TabsContent>

                  {/* Attendance Tab */}
                  <TabsContent value="attendance" className="space-y-4">
                    <Card>
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
                          <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-3 mb-6">
                              <div className="p-3 bg-green-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-green-600">
                                  {childAttendance.filter(a => a.status === 'Present').length}
                                </p>
                                <p className="text-xs text-gray-600">Present</p>
                              </div>
                              <div className="p-3 bg-red-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-red-600">
                                  {childAttendance.filter(a => a.status === 'Absent').length}
                                </p>
                                <p className="text-xs text-gray-600">Absent</p>
                              </div>
                              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-yellow-600">
                                  {childAttendance.filter(a => a.status === 'Late').length}
                                </p>
                                <p className="text-xs text-gray-600">Late</p>
                              </div>
                              <div className="p-3 bg-blue-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                  {calculateAttendancePercentage()}%
                                </p>
                                <p className="text-xs text-gray-600">Rate</p>
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
                                      <td className="py-3 px-4">
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
                  </TabsContent>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-4">
                    <Card>
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
                            <p className="font-semibold text-lg mt-1">
                              {selectedChild.user.full_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">Email</p>
                            <p className="font-semibold text-lg mt-1">
                              {selectedChild.user.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">Class</p>
                            <p className="font-semibold text-lg mt-1">
                              {selectedChild.class.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">Form Level</p>
                            <p className="font-semibold text-lg mt-1">
                              {selectedChild.class.form_level}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">Registration Number</p>
                            <p className="font-semibold text-lg font-mono mt-1">
                              {selectedChild.reg_number || selectedChild.admission_number}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
