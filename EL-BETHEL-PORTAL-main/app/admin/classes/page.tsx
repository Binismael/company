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
  class_teacher?: { full_name: string }
  student_count: number
}

interface Subject {
  id: string
  name: string
  code: string
  class_id: string
  teacher?: { full_name: string }
}

export default function ClassManagementPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([
    {
      id: '1',
      name: 'SS1A',
      form_level: 'SS 1',
      capacity: 40,
      student_count: 38,
      class_teacher: { full_name: 'Mrs. Adeyemi' },
    },
    {
      id: '2',
      name: 'SS1B',
      form_level: 'SS 1',
      capacity: 42,
      student_count: 40,
      class_teacher: { full_name: 'Mr. Okafor' },
    },
    {
      id: '3',
      name: 'SS2A',
      form_level: 'SS 2',
      capacity: 45,
      student_count: 42,
      class_teacher: { full_name: 'Dr. Uzoh' },
    },
    {
      id: '4',
      name: 'SS2B',
      form_level: 'SS 2',
      capacity: 43,
      student_count: 40,
      class_teacher: { full_name: 'Prof. Nwosu' },
    },
    {
      id: '5',
      name: 'SS3A',
      form_level: 'SS 3',
      capacity: 38,
      student_count: 37,
      class_teacher: { full_name: 'Mr. Bello' },
    },
    {
      id: '6',
      name: 'SS3B',
      form_level: 'SS 3',
      capacity: 40,
      student_count: 38,
      class_teacher: { full_name: 'Mrs. Eze' },
    },
  ])

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: 'Mathematics', code: 'MATH101', class_id: '1', teacher: { full_name: 'Mrs. Adeyemi' } },
    { id: '2', name: 'English Language', code: 'ENG101', class_id: '1', teacher: { full_name: 'Mr. Okafor' } },
    { id: '3', name: 'Biology', code: 'BIO101', class_id: '1', teacher: { full_name: 'Dr. Uzoh' } },
    { id: '4', name: 'Chemistry', code: 'CHEM101', class_id: '1', teacher: { full_name: 'Prof. Nwosu' } },
    { id: '5', name: 'Physics', code: 'PHY101', class_id: '1', teacher: { full_name: 'Mr. Bello' } },
    { id: '6', name: 'History', code: 'HIST101', class_id: '1', teacher: { full_name: 'Mrs. Eze' } },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddClassDialog, setShowAddClassDialog] = useState(false)
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false)
  const [newClass, setNewClass] = useState({ name: '', formLevel: '', capacity: 40 })
  const [newSubject, setNewSubject] = useState({ name: '', code: '', classId: '' })

  useEffect(() => {
    setLoading(false)
  }, [])

  const handleAddClass = () => {
    if (!newClass.name || !newClass.formLevel) {
      toast.error('Please fill in all fields')
      return
    }

    const classItem: Class = {
      id: String(classes.length + 1),
      name: newClass.name,
      form_level: newClass.formLevel,
      capacity: newClass.capacity,
      student_count: 0,
      class_teacher: undefined,
    }

    setClasses([...classes, classItem])
    setNewClass({ name: '', formLevel: '', capacity: 40 })
    setShowAddClassDialog(false)
    toast.success('Class created successfully')
  }

  const handleAddSubject = () => {
    if (!newSubject.name || !newSubject.code || !newSubject.classId) {
      toast.error('Please fill in all fields')
      return
    }

    const subject: Subject = {
      id: String(subjects.length + 1),
      name: newSubject.name,
      code: newSubject.code,
      class_id: newSubject.classId,
      teacher: undefined,
    }

    setSubjects([...subjects, subject])
    setNewSubject({ name: '', code: '', classId: '' })
    setShowAddSubjectDialog(false)
    toast.success('Subject created successfully')
  }

  const handleDeleteClass = (classId: string) => {
    if (confirm('Delete this class? This action cannot be undone.')) {
      setClasses(classes.filter((c) => c.id !== classId))
      toast.success('Class deleted')
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
