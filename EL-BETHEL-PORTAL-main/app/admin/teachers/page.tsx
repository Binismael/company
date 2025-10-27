'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Trash2, Eye, Mail, Clock, Award, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

interface Teacher {
  id: string
  user_id: string
  full_name: string
  email?: string
  phone?: string
  department?: string
  status?: string
  employee_id?: string
  created_at?: string
}

export default function TeachersPage() {
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('teachers')
        .select('*, users:user_id(full_name, email)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedTeachers = (data || []).map((teacher: any) => ({
        id: teacher.id,
        user_id: teacher.user_id,
        full_name: teacher.users?.full_name || 'Unknown',
        email: teacher.users?.email || teacher.email,
        phone: teacher.phone,
        department: teacher.department || 'Not specified',
        status: teacher.status || 'active',
        employee_id: teacher.employee_id,
        created_at: teacher.created_at,
      }))

      setTeachers(mappedTeachers)
    } catch (error: any) {
      console.error('Error loading teachers:', error)
      toast.error('Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesDepartment = filterDepartment === 'all' || (teacher.department?.toLowerCase() === filterDepartment.toLowerCase())
    const matchesStatus = filterStatus === 'all' || (teacher.status?.toLowerCase() === filterStatus.toLowerCase())
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-800">On Leave</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>
    }
  }

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Delete this teacher? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTeachers(teachers.filter((t) => t.id !== id))
      toast.success('Teacher removed successfully')
    } catch (error: any) {
      console.error('Error deleting teacher:', error)
      toast.error(error.message || 'Failed to delete teacher')
    }
  }

  const departments = ['all', 'Mathematics', 'English', 'Science', 'Social Studies', 'Languages', 'Computer Science', 'Physical Education']
  const statuses = ['all', 'active', 'inactive', 'on_leave']

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
          <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-600 mt-2">Manage teacher accounts and assignments</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Create a new teacher account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Full Name" />
              <Input placeholder="Email" type="email" />
              <Input placeholder="Phone Number" type="tel" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="social">Social Studies</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full">Create Account</Button>
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
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Social Studies">Social Studies</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teachers ({filteredTeachers.length})</CardTitle>
          <CardDescription>Manage school teachers and their assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTeachers.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No teachers found</p>
            ) : (
              filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition">
                  <Avatar>
                    <AvatarFallback>{teacher.full_name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{teacher.full_name}</p>
                        <p className="text-sm text-gray-600">{teacher.department || 'Not specified'}</p>
                      </div>
                      {getStatusBadge(teacher.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {teacher.email || 'No email'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Joined: {teacher.created_at ? new Date(teacher.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        ID: {teacher.employee_id || 'Not assigned'}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteTeacher(teacher.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
