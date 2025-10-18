'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Users, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface Class {
  id: string
  name: string
  form_level: string
  students: { count: number }[]
}

interface Student {
  id: string
  user: { full_name: string }
  admission_number: string
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [classStudents, setClassStudents] = useState<Student[]>([])
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

        if (userError) throw userError
        setUser(userData)

        // Get teacher's classes
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            *,
            students:students(count)
          `)
          .eq('class_teacher_id', authUser.id)

        if (classesError) throw classesError
        setClasses(classesData)

        if (classesData.length > 0) {
          setSelectedClass(classesData[0])
          loadClassStudents(classesData[0].id)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadClassStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          user:users(full_name)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setClassStudents(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
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
                Welcome, {user?.full_name}
              </h1>
              <p className="text-gray-600 mt-1">Teacher Dashboard</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Classes Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">
                {classes.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Form classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {classes.reduce(
                  (sum, c) =>
                    sum + (c.students && c.students.length > 0 ? c.students[0].count : 0),
                  0
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Across all classes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="classes" className="gap-2">
              <Users className="h-4 w-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              Mark Attendance
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Classes</CardTitle>
                <CardDescription>
                  Classes you teach
                </CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No classes assigned
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classes.map((cls) => (
                      <Card
                        key={cls.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedClass(cls)
                          loadClassStudents(cls.id)
                        }}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <CardDescription>{cls.form_level}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-600" />
                            <span className="text-gray-600">
                              {cls.students && cls.students.length > 0
                                ? cls.students[0].count
                                : 0}{' '}
                              students
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedClass && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedClass.name} - Students</CardTitle>
                  <CardDescription>
                    Enrolled students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {classStudents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No students in this class
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-2 px-4 font-medium">
                              Name
                            </th>
                            <th className="text-left py-2 px-4 font-medium">
                              Admission Number
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {classStudents.map((student) => (
                            <tr
                              key={student.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-2 px-4">
                                {student.user.full_name}
                              </td>
                              <td className="py-2 px-4">
                                {student.admission_number}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>
                  Record student attendance for your classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-blue-800">
                    Attendance marking feature coming soon. Use the API to mark attendance for now.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Record Results</CardTitle>
                <CardDescription>
                  Enter student grades and scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-blue-800">
                    Results management feature coming soon. Use the API to submit results.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
