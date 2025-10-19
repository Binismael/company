'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Users, BookOpen, UserPlus, Plus, TrendingUp, DollarSign, Calendar, Bell, BarChart3, Settings } from 'lucide-react'
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

        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersError) throw usersError
        setUsers(usersData)

        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .order('name', { ascending: true })

        if (classesError) throw classesError
        setClasses(classesData)

        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .order('name', { ascending: true })

        if (subjectsError) throw subjectsError
        setSubjects(subjectsData)

        await calculateStats(usersData, classesData, subjectsData)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    const calculateStats = async (usersData: any[], classesData: any[], subjectsData: any[]) => {
      try {
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
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-white">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fbd2820205fb947eb8af5752a50d16f87%2F5bda342765554afe869b9b86f5b4343a?format=webp&width=128"
                  alt="El-Bethel Academy Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  School management & analytics
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

        {/* Overview Stats */}
        {stats && (
          <>
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4" />
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

                <Card className="border-0 shadow-sm">
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
                      {stats.totalSubjects} subjects
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
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
                      of ₦{(stats.totalFeeAmount / 1000000).toFixed(1)}M
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
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
                      Average present
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* User Breakdown */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">User Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card className="border-0 shadow-sm p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.totalAdmins}</div>
                  <p className="text-xs text-gray-600 mt-1">Admins</p>
                </Card>
                <Card className="border-0 shadow-sm p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalTeachers}</div>
                  <p className="text-xs text-gray-600 mt-1">Teachers</p>
                </Card>
                <Card className="border-0 shadow-sm p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.totalStudents}</div>
                  <p className="text-xs text-gray-600 mt-1">Students</p>
                </Card>
                <Card className="border-0 shadow-sm p-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.totalParents}</div>
                  <p className="text-xs text-gray-600 mt-1">Parents</p>
                </Card>
                <Card className="border-0 shadow-sm p-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.totalBursars}</div>
                  <p className="text-xs text-gray-600 mt-1">Bursars</p>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Management Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex overflow-x-auto gap-2">
          <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded whitespace-nowrap">
            Overview
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
            Users
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
            Classes
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
            Subjects
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
            Notify
          </button>
        </div>

        <div className="space-y-6">
          {/* System Status */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current system information and health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Database</p>
                  <p className="text-lg font-bold text-green-600 mt-1">Connected ✓</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Authentication</p>
                  <p className="text-lg font-bold text-green-600 mt-1">Active ✓</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">API Services</p>
                  <p className="text-lg font-bold text-green-600 mt-1">Running ✓</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">Last Backup</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Frequently used administrative functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-lg">
                  <UserPlus className="h-5 w-5" />
                  <span className="text-xs text-center">Add User</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-lg">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs text-center">New Class</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-lg">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-xs text-center">Add Subject</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 rounded-lg">
                  <Bell className="h-5 w-5" />
                  <span className="text-xs text-center">Notify All</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="border-0 shadow-sm">
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
                          <td className="py-3 px-4 font-medium text-gray-900">{u.full_name}</td>
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

          {/* Classes Management */}
          <Card className="border-0 shadow-sm">
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
                  className="rounded-lg"
                />
                <select
                  value={newFormLevel}
                  onChange={(e) => setNewFormLevel(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option>SS3</option>
                  <option>SS2</option>
                  <option>SS1</option>
                  <option>JSS3</option>
                  <option>JSS2</option>
                  <option>JSS1</option>
                </select>
                <Button onClick={handleAddClass} className="gap-2 whitespace-nowrap bg-primary-600 hover:bg-primary-700">
                  <Plus className="h-4 w-4" />
                  Add Class
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
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
                          <td className="py-3 px-4 font-medium text-gray-900">{cls.name}</td>
                          <td className="py-3 px-4 text-gray-600">{cls.form_level}</td>
                          <td className="py-3 px-4 text-gray-600">{cls.capacity}</td>
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

          {/* Subjects Management */}
          <Card className="border-0 shadow-sm">
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
                  className="rounded-lg"
                />
                <Input
                  placeholder="Code (e.g., MATH101)"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value.toUpperCase())}
                  className="rounded-lg"
                />
                <Button onClick={handleAddSubject} className="gap-2 whitespace-nowrap bg-primary-600 hover:bg-primary-700">
                  <Plus className="h-4 w-4" />
                  Add Subject
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
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
                          <td className="py-3 px-4 font-medium text-gray-900">{subject.name}</td>
                          <td className="py-3 px-4 text-gray-600">{subject.code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
