'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Search, Trash2, Edit2 } from 'lucide-react'
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
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddClassDialog, setShowAddClassDialog] = useState(false)
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false)
  const [newClass, setNewClass] = useState({ name: '', formLevel: '', capacity: 0 })
  const [newSubject, setNewSubject] = useState({ name: '', code: '', classId: '' })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classesData, subjectsData] = await Promise.all([
          supabase.from('classes').select('*, class_teacher:teachers(full_name)').order('name'),
          supabase.from('subjects').select('*, teacher:teachers(full_name)').order('name'),
        ])

        setClasses(classesData.data || [])
        setSubjects(subjectsData.data || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.formLevel) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const { error } = await supabase.from('classes').insert({
        name: newClass.name,
        form_level: newClass.formLevel,
        capacity: newClass.capacity || 50,
      })

      if (error) throw error

      toast.success('Class created successfully')
      setShowAddClassDialog(false)
      setNewClass({ name: '', formLevel: '', capacity: 0 })

      const { data: updatedClasses } = await supabase.from('classes').select('*').order('name')
      setClasses(updatedClasses || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to create class')
    }
  }

  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.code || !newSubject.classId) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const { error } = await supabase.from('subjects').insert({
        name: newSubject.name,
        code: newSubject.code,
        class_id: newSubject.classId,
      })

      if (error) throw error

      toast.success('Subject created successfully')
      setShowAddSubjectDialog(false)
      setNewSubject({ name: '', code: '', classId: '' })

      const { data: updatedSubjects } = await supabase.from('subjects').select('*').order('name')
      setSubjects(updatedSubjects || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to create subject')
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Delete this class? This action cannot be undone.')) return

    try {
      const { error } = await supabase.from('classes').delete().eq('id', classId)
      if (error) throw error

      setClasses(classes.filter(c => c.id !== classId))
      toast.success('Class deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete class')
    }
  }

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold tracking-tight">Classes & Subjects</h1>
          <p className="text-gray-600 mt-2">Manage school structure and curriculum</p>
        </div>
      </div>

      <Tabs defaultValue="classes" className="w-full">
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
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Class Name</label>
                    <Input
                      placeholder="e.g., JSS 1A"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Form Level</label>
                    <select
                      value={newClass.formLevel}
                      onChange={(e) => setNewClass({ ...newClass, formLevel: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">Select level</option>
                      <option value="JS1">JS 1</option>
                      <option value="JS2">JS 2</option>
                      <option value="JS3">JS 3</option>
                      <option value="SS1">SS 1</option>
                      <option value="SS2">SS 2</option>
                      <option value="SS3">SS 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Capacity</label>
                    <Input
                      type="number"
                      placeholder="Class capacity"
                      value={newClass.capacity}
                      onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) })}
                    />
                  </div>
                  <Button onClick={handleAddClass} className="w-full">
                    Create Class
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClasses.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{cls.name}</CardTitle>
                      <CardDescription>{cls.form_level}</CardDescription>
                    </div>
                    <Badge>{cls.student_count || 0} students</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-600">Class Teacher</p>
                    <p className="font-medium">{cls.class_teacher?.full_name || 'Unassigned'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Capacity</p>
                    <p className="font-medium">{cls.capacity} students</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteClass(cls.id)}
                    className="w-full gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search subjects..."
                className="pl-10"
              />
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
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Subject Name</label>
                    <Input
                      placeholder="e.g., Mathematics"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject Code</label>
                    <Input
                      placeholder="e.g., MATH101"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Assign to Class</label>
                    <select
                      value={newSubject.classId}
                      onChange={(e) => setNewSubject({ ...newSubject, classId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">Select class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
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

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-sm text-gray-600">{subject.code}</p>
                    </div>
                    <span className="text-sm text-gray-600">{subject.teacher?.full_name || 'Unassigned'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
