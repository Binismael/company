'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle, Search, Mail } from 'lucide-react'

interface Student {
  id: string
  user: { full_name: string; email: string }
  admission_number: string
  class: { name: string }
}

interface Class {
  id: string
  name: string
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get classes
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

        // Get all students from teacher's classes
        let allStudents: Student[] = []
        for (const cls of uniqueClasses) {
          const { data } = await supabase
            .from('students')
            .select('id,user:users(full_name,email),admission_number,class:classes(name)')
            .eq('class_id', cls.id)

          allStudents = [...allStudents, ...(data || [])]
        }

        setStudents(allStudents)
        setFilteredStudents(allStudents)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  useEffect(() => {
    let filtered = students

    if (selectedClass) {
      filtered = filtered.filter(s => s.class.name === selectedClass)
    }

    if (search) {
      filtered = filtered.filter(
        s =>
          s.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
          s.admission_number.toLowerCase().includes(search.toLowerCase()) ||
          s.user.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredStudents(filtered)
  }, [search, selectedClass, students])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-500 mt-1">All students in your classes</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or admission number..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.name}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              {students.length === 0 ? 'No students found' : 'No students match your filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Students ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Admission #</th>
                    <th className="text-left py-3 px-4 font-medium">Class</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">
                        {student.user.full_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {student.admission_number}
                      </td>
                      <td className="py-3 px-4">{student.class.name}</td>
                      <td className="py-3 px-4 text-gray-600">{student.user.email}</td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Mail className="h-3 w-3" />
                          Message
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
