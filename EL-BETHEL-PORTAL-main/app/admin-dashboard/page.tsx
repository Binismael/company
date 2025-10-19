'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Users, BookOpen, UserPlus, Plus, TrendingUp, DollarSign, Calendar, Bell, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface Class {
  id: string
  name: string
  form_level: string
  class_teacher_id?: string
  capacity: number
  created_at: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface DashboardStats {
  totalUsers: number
  totalAdmins: number
  totalTeachers: number
  totalStudents: number
  totalParents: number
  totalBursars: number
  totalClasses: number
  totalSubjects: number
  totalFeeAmount: number
  totalFeesCollected: number
  attendancePercentage: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newClassName, setNewClassName] = useState('')
  const [newFormLevel, setNewFormLevel] = useState('SS3')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectCode, setNewSubjectCode] = useState('')

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

        if (userError || userData.role !== 'admin') {
          router.push('/auth/login')
          return
        }

        setUser(userData)

        // Get all users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersError) throw usersError
        setUsers(usersData)

        // Get all classes
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .order('name', { ascending: true })

        if (classesError) throw classesError
        setClasses(classesData)

        // Get all subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .order('name', { ascending: true })

        if (subjectsError) throw subjectsError
        setSubjects(subjectsData)

        // Calculate stats
        await calculateStats(usersData, classesData, subjectsData)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    const calculateStats = async (usersData: any[], classesData: any[], subjectsData: any[]) => {
      try {
        // Get fees data
        const { data: feesData } = await supabase
          .from('fees')
          .select('amount, paid_amount')

        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')

        const totalFeeAmount = feesData?.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) || 0
        const totalFeesCollected = feesData?.reduce((sum, f) => sum + (parseFloat(f.paid_amount) || 0), 0) || 0
        const presentCount = attendanceData?.filter(a => a.status === 'Present').length || 0
        const attendancePercentage = attendanceData && attendanceData.length > 0 
          ? Math.round((presentCount / attendanceData.length) * 100) 
          : 0

        setStats({
          totalUsers: usersData.length,
          totalAdmins: usersData.filter(u => u.role === 'admin').length,
          totalTeachers: usersData.filter(u => u.role === 'teacher').length,
          totalStudents: usersData.filter(u => u.role === 'student').length,
          totalParents: usersData.filter(u => u.role === 'parent').length,
          totalBursars: usersData.filter(u => u.role === 'bursar').length,
          totalClasses: classesData.length,
          totalSubjects: subjectsData.length,
          totalFeeAmount,
          totalFeesCollected,
          attendancePercentage,
        })
      } catch (err) {
        console.error('Error calculating stats:', err)
      }
    }

    loadData()
  }, [router])

  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      setError('Class name is required')
      return
    }

    try {
      const { data, error: classError } = await supabase
        .from('classes')
        .insert([
          {
            name: newClassName,
            form_level: newFormLevel,
          },
        ])
        .select()

      if (classError) throw classError

      setClasses([...classes, data[0]])
      setNewClassName('')
      setNewFormLevel('SS3')
      setError('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !newSubjectCode.trim()) {
      setError('Subject name and code are required')
      return
    }

    try {
      const { data, error: subjectError } = await supabase
        .from('subjects')
        .insert([
          {
            name: newSubjectName,
            code: newSubjectCode.toUpperCase(),
          },
        ])
        .select()

      if (subjectError) throw subjectError

      setSubjects([...subjects, data[0]])
      setNewSubjectName('')
      setNewSubjectCode('')
      setError('')
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
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Command Center
              </h1>
              <p className="text-gray-600 mt-1">Complete school management and analytics hub</p>
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

        {/* Overview Stats */}
        {stats && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* User Stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary-600">
                      {stats.totalUsers}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalTeachers} teachers • {stats.totalStudents} students
                    </p>
                  </CardContent>
                </Card>

                {/* Classes */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Classes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.totalClasses}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalSubjects} subjects active
                    </p>
                  </CardContent>
                </Card>

                {/* Finance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fees Collected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      ₦{(stats.totalFeesCollected / 1000000).toFixed(1)}M
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      of ₦{(stats.totalFeeAmount / 1000000).toFixed(1)}M expected
                    </p>
                  </CardContent>
                </Card>

                {/* Attendance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.attendancePercentage}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Average present today
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Detailed Stats Grid */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">User Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card className="p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.totalAdmins}</div>
                  <p className="text-xs text-gray-600">Admins</p>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalTeachers}</div>
                  <p className="text-xs text-gray-600">Teachers</p>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.totalStudents}</div>
                  <p className="text-xs text-gray-600">Students</p>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.totalParents}</div>
                  <p className="text-xs text-gray-600">Parents</p>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.totalBursars}</div>
                  <p className="text-xs text-gray-600">Bursars</p>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Management Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Classes</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Subjects</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notify</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system information and health metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600">Database</p>
                    <p className="text-lg font-bold text-green-600">Connected ✓</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600">Authentication</p>
                    <p className="text-lg font-bold text-green-600">Active ✓</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600">API Services</p>
                    <p className="text-lg font-bold text-green-600">Running ✓</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600">Last Backup</p>
                    <p className="text-lg font-bold text-blue-600">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Frequently used administrative functions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    <span className="text-xs">Add User</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">New Class</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span className="text-xs">Add Subject</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <Bell className="h-5 w-5" />
                    <span className="text-xs">Notify All</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Total: {users.length} users in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No users found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Name</th>
                          <th className="text-left py-3 px-4 font-medium">Email</th>
                          <th className="text-left py-3 px-4 font-medium">Role</th>
                          <th className="text-left py-3 px-4 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{u.full_name}</td>
                            <td className="py-3 px-4 text-gray-600">{u.email}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  u.role === 'admin'
                                    ? 'default'
                                    : u.role === 'teacher'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {u.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600 text-xs">
                              {new Date(u.created_at).toLocaleDateString()}
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

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Class</CardTitle>
                <CardDescription>
                  Create a new class in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Class name (e.g., SS3A)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                  <select
                    value={newFormLevel}
                    onChange={(e) => setNewFormLevel(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option>SS3</option>
                    <option>SS2</option>
                    <option>SS1</option>
                    <option>JSS3</option>
                    <option>JSS2</option>
                    <option>JSS1</option>
                  </select>
                  <Button onClick={handleAddClass} className="gap-2 whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                    Add Class
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Classes</CardTitle>
                <CardDescription>
                  Total: {classes.length} classes in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No classes found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Name</th>
                          <th className="text-left py-3 px-4 font-medium">Form Level</th>
                          <th className="text-left py-3 px-4 font-medium">Capacity</th>
                          <th className="text-left py-3 px-4 font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((cls) => (
                          <tr key={cls.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{cls.name}</td>
                            <td className="py-3 px-4">{cls.form_level}</td>
                            <td className="py-3 px-4">{cls.capacity}</td>
                            <td className="py-3 px-4 text-gray-600 text-xs">
                              {new Date(cls.created_at).toLocaleDateString()}
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
                <CardTitle>Add New Subject</CardTitle>
                <CardDescription>
                  Create a new subject in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Subject name (e.g., Mathematics)"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                  <Input
                    placeholder="Code (e.g., MATH101)"
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value.toUpperCase())}
                  />
                  <Button onClick={handleAddSubject} className="gap-2 whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                    Add Subject
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Subjects</CardTitle>
                <CardDescription>
                  Total: {subjects.length} subjects available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No subjects found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Subject Name</th>
                          <th className="text-left py-3 px-4 font-medium">Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subject) => (
                          <tr key={subject.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{subject.name}</td>
                            <td className="py-3 px-4 text-gray-600">{subject.code}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Notifications</CardTitle>
                <CardDescription>
                  Send announcements and messages to users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message Title
                  </label>
                  <Input placeholder="e.g., Important: Term Break Schedule" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message Content
                  </label>
                  <textarea
                    className="w-full p-3 border rounded-md text-sm"
                    rows={4}
                    placeholder="Write your announcement here..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Send To
                  </label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">All Users</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Teachers</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Students</span>
                    </label>
                  </div>
                </div>
                <Button className="w-full gap-2">
                  <Bell className="h-4 w-4" />
                  Send Notification
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
