'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Users, BookOpen, UserPlus, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface Class {
  id: string
  name: string
  form_level: string
  class_teacher: { full_name: string }
  students: { count: number }[]
}

interface Subject {
  id: string
  name: string
  code: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newClassName, setNewClassName] = useState('')
  const [newFormLevel, setNewFormLevel] = useState('SS3')

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
          .select(`
            *,
            class_teacher:users(full_name),
            students:students(count)
          `)
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
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
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
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const userStats = {
    admins: users.filter((u) => u.role === 'admin').length,
    teachers: users.filter((u) => u.role === 'teacher').length,
    students: users.filter((u) => u.role === 'student').length,
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage users, classes, and system settings</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">
                {users.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {userStats.teachers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {userStats.students}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {classes.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              Classes
            </TabsTrigger>
            <TabsTrigger value="subjects" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>
                  View and manage all system users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No users found
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
                            Email
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Role
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">{u.full_name}</td>
                            <td className="py-2 px-4">{u.email}</td>
                            <td className="py-2 px-4">
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
                  Create a new class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Class name (e.g., SS3A, JSS1B)"
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
                  <Button onClick={handleAddClass} className="gap-2">
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
                  Classes in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No classes found
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
                            Form Level
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Class Teacher
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Students
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((cls) => (
                          <tr
                            key={cls.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-2 px-4 font-medium">
                              {cls.name}
                            </td>
                            <td className="py-2 px-4">{cls.form_level}</td>
                            <td className="py-2 px-4">
                              {cls.class_teacher?.full_name || 'Not assigned'}
                            </td>
                            <td className="py-2 px-4">
                              {cls.students && cls.students.length > 0
                                ? cls.students[0].count
                                : 0}
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
                <CardTitle>All Subjects</CardTitle>
                <CardDescription>
                  Subjects available in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No subjects found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-4 font-medium">
                            Subject Name
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Code
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subject) => (
                          <tr
                            key={subject.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-2 px-4 font-medium">
                              {subject.name}
                            </td>
                            <td className="py-2 px-4 text-gray-600">
                              {subject.code}
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
      </div>
    </div>
  )
}
