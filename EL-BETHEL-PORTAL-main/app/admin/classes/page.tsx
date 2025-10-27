'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Plus, Search, Trash2, Edit2, Users, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface Class {
  id: string
  name: string
  form_level: string
  capacity: number
  class_teacher_id?: string
  class_teacher?: { full_name: string }
  student_count: number
}

interface Subject {
  id: string
  name: string
  code: string
  class_id: string
  teacher_id?: string
  teacher?: { full_name: string }
}

export default function ClassManagementPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddClassDialog, setShowAddClassDialog] = useState(false)
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false)
  const [newClass, setNewClass] = useState({ name: '', formLevel: '', capacity: 40 })
  const [newSubject, setNewSubject] = useState({ name: '', code: '', classId: '' })

  useEffect(() => {
    loadClassesAndSubjects()
  }, [])

  const loadClassesAndSubjects = async () => {
    try {
      setLoading(true)

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          form_level,
          capacity,
          class_teacher_id,
          users:class_teacher_id(full_name)
        `)
        .order('form_level', { ascending: true })
        .order('name', { ascending: true })

      if (classesError) throw classesError

      const classesWithCount = await Promise.all(
        (classesData || []).map(async (cls: any) => {
          const { count } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', cls.id)

          return {
            id: cls.id,
            name: cls.name,
            form_level: cls.form_level,
            capacity: cls.capacity,
            class_teacher_id: cls.class_teacher_id,
            class_teacher: cls.users ? { full_name: cls.users.full_name } : undefined,
            student_count: count || 0,
          }
        })
      )

      setClasses(classesWithCount)

      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          code,
          class_id,
          teacher_id,
          users:teacher_id(full_name)
        `)
        .order('name', { ascending: true })

      if (subjectsError) throw subjectsError

      setSubjects(
        (subjectsData || []).map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          class_id: subject.class_id,
          teacher_id: subject.teacher_id,
          teacher: subject.users ? { full_name: subject.users.full_name } : undefined,
        }))
      )
    } catch (error: any) {
      console.error('Error loading classes and subjects:', error)
      toast.error('Failed to load classes and subjects')
    } finally {
      setLoading(false)
    }
  }

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.formLevel) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: newClass.name,
          form_level: newClass.formLevel,
          capacity: newClass.capacity,
        })
        .select()
        .single()

      if (error) throw error

      setClasses([...classes, {
        id: data.id,
        name: data.name,
        form_level: data.form_level,
        capacity: data.capacity,
        student_count: 0,
      }])

      setNewClass({ name: '', formLevel: '', capacity: 40 })
      setShowAddClassDialog(false)
      toast.success('Class created successfully')
    } catch (error: any) {
      console.error('Error creating class:', error)
      toast.error(error.message || 'Failed to create class')
    }
  }

  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.code || !newSubject.classId) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          name: newSubject.name,
          code: newSubject.code,
          class_id: newSubject.classId,
        })
        .select()
        .single()

      if (error) throw error

      setSubjects([...subjects, {
        id: data.id,
        name: data.name,
        code: data.code,
        class_id: data.class_id,
      }])

      setNewSubject({ name: '', code: '', classId: '' })
      setShowAddSubjectDialog(false)
      toast.success('Subject created successfully')
    } catch (error: any) {
      console.error('Error creating subject:', error)
      toast.error(error.message || 'Failed to create subject')
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Delete this class? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (error) throw error

      setClasses(classes.filter((c) => c.id !== classId))
      toast.success('Class deleted successfully')
    } catch (error: any) {
      console.error('Error deleting class:', error)
      toast.error(error.message || 'Failed to delete class')
    }
  }

  const filteredClasses = classes.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const classStats = {
    total: classes.length,
    totalCapacity: classes.reduce((sum, c) => sum + c.capacity, 0),
    totalEnrolled: classes.reduce((sum, c) => sum + c.student_count, 0),
    totalSubjects: subjects.length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes & Subjects</h1>
          <p className="text-gray-600 mt-2">Manage school structure and curriculum</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Classes</p>
            <p className="text-3xl font-bold mt-2">{classStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Capacity</p>
            <p className="text-3xl font-bold mt-2">{classStats.totalCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Enrolled</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{classStats.totalEnrolled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Subjects</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{classStats.totalSubjects}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="classes" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="classes">Classes ({classes.length})</TabsTrigger>
          <TabsTrigger value="subjects">Subjects ({subjects.length})</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={showAddClassDialog} onOpenChange={setShowAddClassDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>Add a new class to your school</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Class Name *</label>
                    <Input
                      placeholder="e.g., SS1A"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Form Level *</label>
                    <select
                      value={newClass.formLevel}
                      onChange={(e) => setNewClass({ ...newClass, formLevel: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                    >
                      <option value="">Select level</option>
                      <option value="JS 1">JS 1</option>
                      <option value="JS 2">JS 2</option>
                      <option value="JS 3">JS 3</option>
                      <option value="SS 1">SS 1</option>
                      <option value="SS 2">SS 2</option>
                      <option value="SS 3">SS 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Class Capacity</label>
                    <Input
                      type="number"
                      placeholder="e.g., 40"
                      value={newClass.capacity}
                      onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleAddClass} className="w-full">
                    Create Class
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Form Level</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Enrolled / Capacity</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => {
                  const utilization = ((cls.student_count / cls.capacity) * 100).toFixed(0)
                  return (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.form_level}</TableCell>
                      <TableCell>{cls.class_teacher?.full_name || 'Unassigned'}</TableCell>
                      <TableCell>
                        {cls.student_count} / {cls.capacity}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{utilization}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-red-600"
                            onClick={() => handleDeleteClass(cls.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search subjects..." className="pl-10" />
            </div>
            <Dialog open={showAddSubjectDialog} onOpenChange={setShowAddSubjectDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subject</DialogTitle>
                  <DialogDescription>Add a new subject to a class</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject Name *</label>
                    <Input
                      placeholder="e.g., Mathematics"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject Code *</label>
                    <Input
                      placeholder="e.g., MATH101"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Assign to Class *</label>
                    <select
                      value={newSubject.classId}
                      onChange={(e) => setNewSubject({ ...newSubject, classId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
                    >
                      <option value="">Select class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAddSubject} className="w-full">
                    Create Subject
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => {
                  const classItem = classes.find((c) => c.id === subject.class_id)
                  return (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{subject.code}</TableCell>
                      <TableCell>{classItem?.name || 'N/A'}</TableCell>
                      <TableCell>{subject.teacher?.full_name || 'Unassigned'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
