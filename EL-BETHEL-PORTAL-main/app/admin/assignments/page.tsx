'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, FileUp, Download, Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

interface Assignment {
  id: string
  title: string
  description?: string
  due_date: string
  class_id?: string
  subject_id?: string
  teacher_id?: string
  created_at: string
  status?: string
}

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [filterClass, setFilterClass] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    class: '',
    subject: '',
    dueDate: '',
    description: '',
  })

  useEffect(() => {
    loadAssignmentsAndData()
  }, [])

  const loadAssignmentsAndData = async () => {
    try {
      setLoading(true)

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false })

      if (assignmentsError) throw assignmentsError

      setAssignments(assignmentsData || [])

      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name')
        .order('name')

      setClasses(classesData || [])

      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name, code')
        .order('name')

      setSubjects(subjectsData || [])
    } catch (error: any) {
      console.error('Error loading assignments:', error)
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesClass = filterClass === 'all' || assignment.class_id === filterClass
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesClass && matchesSearch
  })

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.class || !newAssignment.dueDate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('assignments')
        .insert({
          title: newAssignment.title,
          description: newAssignment.description,
          due_date: newAssignment.dueDate,
          class_id: newAssignment.class,
          subject_id: newAssignment.subject || null,
          teacher_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setAssignments([data, ...assignments])
      setNewAssignment({ title: '', class: '', subject: '', dueDate: '', description: '' })
      toast.success('Assignment created successfully')
    } catch (error: any) {
      console.error('Error creating assignment:', error)
      toast.error(error.message || 'Failed to create assignment')
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment?')) return

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAssignments(assignments.filter((a) => a.id !== id))
      toast.success('Assignment deleted')
    } catch (error: any) {
      console.error('Error deleting assignment:', error)
      toast.error(error.message || 'Failed to delete assignment')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'active':
      default:
        return <Clock className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      case 'active':
      default:
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>
    }
  }

  const submissionRate = (submissions: number, total: number) => {
    return ((submissions / total) * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-2">Manage course materials and student submissions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>Add a new assignment for students</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="Assignment title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Class *</label>
                  <Select value={newAssignment.class} onValueChange={(val) =>
                    setNewAssignment({ ...newAssignment, class: val })
                  }>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Select value={newAssignment.subject} onValueChange={(val) =>
                    setNewAssignment({ ...newAssignment, subject: val })
                  }>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subj) => (
                        <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date *</label>
                <Input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Assignment description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateAssignment} className="w-full">
                Create Assignment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments ({filteredAssignments.length})</CardTitle>
          <CardDescription>Manage course materials and track submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>{assignment.class}</TableCell>
                      <TableCell>{assignment.subject}</TableCell>
                      <TableCell>{assignment.teacher}</TableCell>
                      <TableCell>{assignment.dueDate}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {assignment.submissions}/{assignment.totalStudents}
                          </div>
                          <div className="text-xs text-gray-500">
                            {submissionRate(assignment.submissions, assignment.totalStudents)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View submissions"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit assignment"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-red-600"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            title="Delete assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
