'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
  class_id: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  registration_number: string
}

interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  student_reg: string
  status: 'present' | 'absent' | 'late' | 'excused'
  date: string
  recorded_by_name: string
}

export default function AttendancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStudents, setSelectedStudents] = useState<{ [key: string]: 'present' | 'absent' | 'late' | 'excused' }>({})

  useEffect(() => {
    checkAuthorization()
  }, [])

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (userData?.role !== 'teacher' && userData?.role !== 'admin') {
        router.push('/student-dashboard')
        return
      }

      setUserRole(userData?.role)
      loadInitialData()
    } catch (error) {
      console.error('Authorization error:', error)
      toast.error('Failed to verify access')
    }
  }

  const loadInitialData = async () => {
    try {
      setLoading(true)

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .order('name')

      if (classesError) throw classesError
      setClasses(classesData || [])

      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, class_id')
        .order('name')

      if (subjectsError) throw subjectsError
      setSubjects(subjectsData || [])

      loadAttendanceRecords()
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadStudentsForClass = async (classId: string) => {
    if (!classId) return

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, registration_number')
        .eq('class_id', classId)
        .order('last_name')

      if (error) throw error
      setStudents(data || [])
      setSelectedStudents({})
    } catch (error: any) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    }
  }

  const loadAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          student_id,
          status,
          date,
          students(first_name, last_name, registration_number),
          users(full_name)
        `)
        .order('date', { ascending: false })
        .limit(100)

      if (error) throw error

      const mapped = (data || []).map((record: any) => ({
        id: record.id,
        student_id: record.student_id,
        student_name: `${record.students.first_name} ${record.students.last_name}`,
        student_reg: record.students.registration_number,
        status: record.status,
        date: record.date,
        recorded_by_name: record.users?.full_name || 'System',
      }))

      setRecords(mapped)
    } catch (error: any) {
      console.error('Error loading attendance records:', error)
      toast.error('Failed to load attendance records')
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId)
    setSelectedSubject('')
    loadStudentsForClass(classId)
  }

  const handleStudentStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setSelectedStudents(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedDate || Object.keys(selectedStudents).length === 0) {
      toast.error('Please select class, date, and at least one student')
      return
    }

    try {
      setSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const attendanceData = Object.entries(selectedStudents).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: selectedClass,
        subject_id: selectedSubject || null,
        date: selectedDate,
        status,
        recorded_by: user.id,
      }))

      const { error } = await supabase
        .from('attendance')
        .insert(attendanceData)

      if (error) throw error

      toast.success('Attendance recorded successfully')
      setSelectedStudents({})
      loadAttendanceRecords()
    } catch (error: any) {
      console.error('Error submitting attendance:', error)
      toast.error(error.message || 'Failed to record attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredSubjects = subjects.filter(s => s.class_id === selectedClass)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="text-gray-600 mt-1">Record and manage student attendance</p>
        </div>

        {/* Form Card */}
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle>Record Attendance</CardTitle>
            <CardDescription>Select class, date, and mark attendance for students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Class *</label>
                <Select value={selectedClass} onValueChange={handleClassChange}>
                  <SelectTrigger className="rounded-lg border border-gray-300">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="rounded-lg border border-gray-300">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubjects.map(subj => (
                      <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date *</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-gray-300"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleSubmitAttendance}
                  disabled={submitting || Object.keys(selectedStudents).length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Attendance
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Students List */}
            {selectedClass && students.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Mark Students ({students.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {students.map(student => (
                    <div key={student.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-gray-500">{student.registration_number}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {(['present', 'absent', 'late', 'excused'] as const).map(status => (
                          <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={selectedStudents[student.id] === status}
                              onCheckedChange={() => handleStudentStatusChange(student.id, status)}
                            />
                            <span className="capitalize text-xs">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle>Recent Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Reg. Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No attendance records yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="text-sm">{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm font-medium">{record.student_name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{record.student_reg}</TableCell>
                        <TableCell>
                          <Badge className={`
                            ${record.status === 'present' ? 'bg-green-100 text-green-800' : ''}
                            ${record.status === 'absent' ? 'bg-red-100 text-red-800' : ''}
                            ${record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${record.status === 'excused' ? 'bg-blue-100 text-blue-800' : ''}
                          `}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{record.recorded_by_name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
