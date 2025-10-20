'use client'

import { useState } from 'react'
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
import { Plus, Edit, Trash2, Eye, Mail, Clock, Award } from 'lucide-react'
import { toast } from 'sonner'

interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  department: string
  assignedClasses: string[]
  subjects: string[]
  status: 'active' | 'inactive' | 'on_leave'
  examsCreated: number
  materialsUploaded: number
  lastActive: string
  joinDate: string
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: '1',
      name: 'Mrs. Adeyemi',
      email: 'adeyemi@elbethel.edu',
      phone: '+234 805 123 4567',
      department: 'Mathematics',
      assignedClasses: ['SS1A', 'SS2B'],
      subjects: ['Mathematics', 'Further Mathematics'],
      status: 'active',
      examsCreated: 8,
      materialsUploaded: 24,
      lastActive: '2024-01-20 10:30 AM',
      joinDate: '2022-09-15',
    },
    {
      id: '2',
      name: 'Mr. Okafor',
      email: 'okafor@elbethel.edu',
      phone: '+234 803 456 7890',
      department: 'English',
      assignedClasses: ['SS2A', 'SS3B'],
      subjects: ['English Language', 'Literature in English'],
      status: 'active',
      examsCreated: 6,
      materialsUploaded: 19,
      lastActive: '2024-01-20 02:15 PM',
      joinDate: '2021-08-20',
    },
    {
      id: '3',
      name: 'Dr. Uzoh',
      email: 'uzoh@elbethel.edu',
      phone: '+234 807 890 1234',
      department: 'Science',
      assignedClasses: ['SS1A', 'SS1B', 'SS2A'],
      subjects: ['Biology', 'Chemistry'],
      status: 'active',
      examsCreated: 10,
      materialsUploaded: 31,
      lastActive: '2024-01-19 11:45 AM',
      joinDate: '2020-06-10',
    },
    {
      id: '4',
      name: 'Prof. Nwosu',
      email: 'nwosu@elbethel.edu',
      phone: '+234 809 234 5678',
      department: 'Science',
      assignedClasses: ['SS2B', 'SS3A'],
      subjects: ['Chemistry', 'Physics'],
      status: 'on_leave',
      examsCreated: 5,
      materialsUploaded: 15,
      lastActive: '2024-01-18 09:00 AM',
      joinDate: '2019-05-12',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = filterDepartment === 'all' || teacher.department === filterDepartment
    const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-800">On Leave</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const handleDeleteTeacher = (id: string) => {
    setTeachers(teachers.filter((t) => t.id !== id))
    toast.success('Teacher removed')
  }

  const departments = ['all', 'Mathematics', 'English', 'Science', 'Social Studies', 'Languages']
  const statuses = ['all', 'active', 'inactive', 'on_leave']

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
                    <AvatarFallback>{teacher.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{teacher.name}</p>
                        <p className="text-sm text-gray-600">{teacher.department} Department</p>
                      </div>
                      {getStatusBadge(teacher.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {teacher.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Last active: {teacher.lastActive}
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        {teacher.examsCreated} exams created
                      </div>
                      <div>
                        <strong>Assigned Classes:</strong> {teacher.assignedClasses.join(', ')}
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
