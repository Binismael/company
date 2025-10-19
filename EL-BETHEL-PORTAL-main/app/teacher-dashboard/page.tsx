'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, LogOut, Users, BookOpen, Calendar, CheckCircle, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface Class {
  id: string
  name: string
  form_level: string
  capacity: number
  created_at: string
}

interface Student {
  id: string
  reg_number: string
  user: { full_name: string; email: string }
  admission_number: string
  class_id: string
}

interface ClassSubject {
  id: string
  class_id: string
  subject_id: string
  subject: { name: string; code: string }
}

interface Attendance {
  id: string
  attendance_date: string
  status: string
  student: { user: { full_name: string } }
}

interface Result {
  id: string
  student_id: string
  score: number
  grade: string
  subject: { name: string }
  student: { user: { full_name: string } }
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [classStudents, setClassStudents] = useState<Student[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([])
  const [recentResults, setRecentResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [selectedStudentAttendance, setSelectedStudentAttendance] = useState<
    Record<string, string>
  >({})

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

        if (userError || userData.role !== 'teacher') {
          router.push('/auth/login')
          return
        }

        setUser(userData)

        // Get teacher's classes (as class teacher or subject teacher)
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('class_teacher_id', authUser.id)
          .order('name', { ascending: true })

        if (classesError) throw classesError
        setClasses(classesData)

        if (classesData.length > 0) {
          const cls = classesData[0]
          setSelectedClass(cls)
          await loadClassData(cls.id, authUser.id)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadClassData = async (classId: string, userId: string) => {
    try {
      // Get students in class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          reg_number,
          admission_number,
          class_id,
          user:users(full_name, email)
        `)
        .eq('class_id', classId)
        .order('user.full_name', { ascending: true })

      if (studentsError) throw studentsError
      setClassStudents(studentsData)

      // Get subjects for this class
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('class_subjects')
        .select(`
          id,
          class_id,
          subject_id,
          subject:subjects(name, code)
        `)
        .eq('class_id', classId)

      if (subjectsError) throw subjectsError
      setClassSubjects(subjectsData)

      // Get recent attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          attendance_date,
          status,
          student:students(user:users(full_name))
        `)
        .eq('class_id', classId)
        .order('attendance_date', { ascending: false })
        .limit(20)

      if (attendanceError) throw attendanceError
      setRecentAttendance(attendanceData)

      // Get recent results
      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select(`
          id,
          student_id,
          score,
          grade,
          subject:subjects(name),
          student:students(user:users(full_name))
        `)
        .eq('class_id', classId)
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (resultsError) throw resultsError
      setRecentResults(resultsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load class data')
    }
  }

  const handleClassChange = async (cls: Class) => {
    setSelectedClass(cls)
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      await loadClassData(cls.id, authUser.id)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
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
                Manage your classes and student records
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

        {/* Class Selector */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">My Classes</h2>
          {classes.length === 0 ? (
            <Alert>
              <AlertDescription>
                You are not assigned to any classes yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {classes.map((cls) => (
                <Button
                  key={cls.id}
                  variant={selectedClass?.id === cls.id ? 'default' : 'outline'}
                  onClick={() => handleClassChange(cls)}
                  className="h-auto p-4 text-left justify-start flex-col items-start"
                >
                  <span className="font-bold text-lg">{cls.name}</span>
                  <span className="text-xs opacity-75">{cls.form_level}</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {selectedClass && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {classStudents.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {classSubjects.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {recentAttendance.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">records</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="students" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Students</span>
                </TabsTrigger>
                <TabsTrigger value="attendance" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Attendance</span>
                </TabsTrigger>
                <TabsTrigger value="results" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Results</span>
                </TabsTrigger>
                <TabsTrigger value="subjects" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Subjects</span>
                </TabsTrigger>
              </TabsList>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Students in {selectedClass.name}</CardTitle>
                    <CardDescription>
                      Total: {classStudents.length} students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {classStudents.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No students in this class
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium">Name</th>
                              <th className="text-left py-3 px-4 font-medium">Reg. Number</th>
                              <th className="text-left py-3 px-4 font-medium">Email</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classStudents.map((student) => (
                              <tr
                                key={student.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {student.user.full_name}
                                </td>
                                <td className="py-3 px-4 font-mono text-xs">
                                  {student.reg_number || student.admission_number}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {student.user.email}
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
                    <CardTitle>Mark Attendance</CardTitle>
                    <CardDescription>
                      Record student attendance for {selectedClass.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Date
                      </label>
                      <Input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Students
                      </label>
                      <div className="space-y-2">
                        {classStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <span className="text-sm font-medium">
                              {student.user.full_name}
                            </span>
                            <select
                              value={selectedStudentAttendance[student.id] || 'Present'}
                              onChange={(e) =>
                                setSelectedStudentAttendance({
                                  ...selectedStudentAttendance,
                                  [student.id]: e.target.value,
                                })
                              }
                              className="px-3 py-1 border rounded text-sm"
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Late">Late</option>
                              <option value="Excused">Excused</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Submit Attendance
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Attendance</CardTitle>
                    <CardDescription>
                      Last 20 attendance records
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentAttendance.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No attendance records yet
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium">Date</th>
                              <th className="text-left py-3 px-4 font-medium">Student</th>
                              <th className="text-left py-3 px-4 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentAttendance.map((record) => (
                              <tr
                                key={record.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4">
                                  {new Date(
                                    record.attendance_date
                                  ).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 font-medium">
                                  {record.student.user.full_name}
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
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Results</CardTitle>
                    <CardDescription>
                      Grades and scores recorded by you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentResults.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No results recorded yet
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium">Student</th>
                              <th className="text-left py-3 px-4 font-medium">Subject</th>
                              <th className="text-left py-3 px-4 font-medium">Score</th>
                              <th className="text-left py-3 px-4 font-medium">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentResults.map((result) => (
                              <tr
                                key={result.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {result.student.user.full_name}
                                </td>
                                <td className="py-3 px-4">
                                  {result.subject.name}
                                </td>
                                <td className="py-3 px-4">{result.score}%</td>
                                <td className="py-3 px-4">
                                  <Badge variant="secondary">
                                    {result.grade}
                                  </Badge>
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

              {/* Subjects Tab */}
              <TabsContent value="subjects" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Subjects in {selectedClass.name}</CardTitle>
                    <CardDescription>
                      Subjects assigned to this class
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {classSubjects.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No subjects assigned yet
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium">Subject</th>
                              <th className="text-left py-3 px-4 font-medium">Code</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classSubjects.map((cs) => (
                              <tr
                                key={cs.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4 font-medium">
                                  {cs.subject.name}
                                </td>
                                <td className="py-3 px-4 text-gray-600 font-mono">
                                  {cs.subject.code}
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
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
