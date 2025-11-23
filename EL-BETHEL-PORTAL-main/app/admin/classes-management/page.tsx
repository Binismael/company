'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  BookOpen,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

export default function ClassesManagementPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showClassDialog, setShowClassDialog] = useState(false)
  const [showSubjectDialog, setShowSubjectDialog] = useState(false)
  const [editingClass, setEditingClass] = useState<any>(null)
  const [editingSubject, setEditingSubject] = useState<any>(null)

  // Form states
  const [classForm, setClassForm] = useState({
    name: '',
    formLevel: 'JSS1',
    capacity: '40',
    classTeacherId: '',
  })

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    description: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Verify admin role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single()

        if (userData?.role !== 'admin') {
          throw new Error('Unauthorized access')
        }

        // Fetch classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('*, class_teacher:users(id, full_name)')
          .order('form_level, name')

        setClasses(classesData || [])

        // Fetch subjects
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .order('name')

        setSubjects(subjectsData || [])

        // Fetch teachers
        const { data: teachersData } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('role', 'teacher')
          .order('full_name')

        setTeachers(teachersData || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!classForm.name.trim()) {
        toast.error('Class name is required')
        return
      }

      const classData: any = {
        name: classForm.name,
        form_level: classForm.formLevel,
        capacity: parseInt(classForm.capacity),
      }

      if (classForm.classTeacherId) {
        classData.class_teacher_id = classForm.classTeacherId
      }

      const { data, error: insertError } = await supabase
        .from('classes')
        .insert([classData])
        .select()

      if (insertError) throw insertError

      setClasses([...classes, data[0]])
      setShowClassDialog(false)
      setClassForm({ name: '', formLevel: 'JSS1', capacity: '40', classTeacherId: '' })
      toast.success('Class created successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create class')
    }
  }

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
        toast.error('Subject name and code are required')
        return
      }

      const { data, error: insertError } = await supabase
        .from('subjects')
        .insert([
          {
            name: subjectForm.name,
            code: subjectForm.code.toUpperCase(),
            description: subjectForm.description || null,
          },
        ])
        .select()

      if (insertError) throw insertError

      setSubjects([...subjects, data[0]])
      setShowSubjectDialog(false)
      setSubjectForm({ name: '', code: '', description: '' })
      toast.success('Subject created successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create subject')
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return

    try {
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (deleteError) throw deleteError

      setClasses(classes.filter((c) => c.id !== classId))
      toast.success('Class deleted successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete class')
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return

    try {
      const { error: deleteError } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)

      if (deleteError) throw deleteError

      setSubjects(subjects.filter((s) => s.id !== subjectId))
      toast.success('Subject deleted successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete subject')
    }
  }

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
              <p className="text-sm text-gray-600">Create and manage classes and subjects</p>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="classes" className="bg-white rounded-lg">
          <TabsList className="grid w-full grid-cols-2 p-4 bg-gray-50 border-b">
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Subjects
            </TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes" className="p-6 space-y-6">
            {/* Search and Create */}
            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>
              <Button onClick={() => setShowClassDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Class
              </Button>
            </div>

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((cls) => (
                <Card key={cls.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <CardDescription>{cls.form_level}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClass(cls.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold">{cls.capacity} students</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Class Teacher:</span>
                      <span className="font-semibold">
                        {cls.class_teacher?.full_name || 'TBA'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClasses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery ? 'No classes found' : 'No classes yet. Create one to get started.'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="p-6 space-y-6">
            <Button onClick={() => setShowSubjectDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Subject
            </Button>

            {/* Subjects Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Subject Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {subject.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                          {subject.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {subject.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {subjects.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No subjects yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Class Dialog */}
      <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Add a new class to your school
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClass} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class Name
              </label>
              <Input
                placeholder="e.g., JSS1 A"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Form Level
              </label>
              <Select
                value={classForm.formLevel}
                onValueChange={(value) =>
                  setClassForm({ ...classForm, formLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSS1">JSS1</SelectItem>
                  <SelectItem value="JSS2">JSS2</SelectItem>
                  <SelectItem value="JSS3">JSS3</SelectItem>
                  <SelectItem value="SS1">SS1</SelectItem>
                  <SelectItem value="SS2">SS2</SelectItem>
                  <SelectItem value="SS3">SS3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class Capacity
              </label>
              <Input
                type="number"
                placeholder="40"
                value={classForm.capacity}
                onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class Teacher (Optional)
              </label>
              <Select
                value={classForm.classTeacherId}
                onValueChange={(value) =>
                  setClassForm({ ...classForm, classTeacherId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowClassDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Class</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Subject Dialog */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>
              Add a new subject to your curriculum
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject Name
              </label>
              <Input
                placeholder="e.g., Mathematics"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject Code
              </label>
              <Input
                placeholder="e.g., MATH101"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (Optional)
              </label>
              <Input
                placeholder="Brief description"
                value={subjectForm.description}
                onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubjectDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Subject</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
