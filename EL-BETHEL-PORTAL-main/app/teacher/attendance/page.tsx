'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Loader2, Check } from 'lucide-react'

interface Student {
  id: string
  user: { full_name: string }
  admission_number: string
}

interface Class {
  id: string
  name: string
}

export default function AttendancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        const { data: classData } = await supabase
          .from('class_subjects')
          .select('class_id,class:classes(id,name)')
          .eq('teacher_id', authUser.id)

        const uniqueClasses = Array.from(
          new Map(
            (classData || []).map(item => [item.class_id, item.class])
          ).values()
        ) as Class[]

        setClasses(uniqueClasses)
        if (uniqueClasses.length > 0) {
          setSelectedClass(uniqueClasses[0].id)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
  }, [router])

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) return

      try {
        const { data, error: err } = await supabase
          .from('students')
          .select('id,user:users(full_name),admission_number')
          .eq('class_id', selectedClass)
          .order('user.full_name')

        if (err) throw err
        setStudents(data || [])
        setAttendance({})
      } catch (err: any) {
        setError(err.message)
      }
    }

    loadStudents()
  }, [selectedClass])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      const records = students.map((student) => ({
        student_id: student.id,
        class_id: selectedClass,
        attendance_date: attendanceDate,
        status: attendance[student.id] || 'Present',
        marked_by: authUser.id,
      }))

      const { error: err } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,class_id,attendance_date' })

      if (err) throw err
      setSuccess('Attendance recorded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-500 mt-1">Record daily class attendance</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Class & Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class">Class *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Attendance */}
        {students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Students ({students.length})</CardTitle>
              <CardDescription>
                Mark attendance for {new Date(attendanceDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {student.user.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.admission_number}
                      </p>
                    </div>
                    <Select
                      value={attendance[student.id] || 'Present'}
                      onValueChange={(value) =>
                        setAttendance({ ...attendance, [student.id]: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Present">Present</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                        <SelectItem value="Late">Late</SelectItem>
                        <SelectItem value="Excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {students.length > 0 && (
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Attendance
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
