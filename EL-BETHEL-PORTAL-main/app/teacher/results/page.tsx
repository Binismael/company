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
import { Loader2, AlertCircle, Plus, Check } from 'lucide-react'

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
}

interface Student {
  id: string
  user: { full_name: string }
  admission_number: string
}

export default function ResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [results, setResults] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        if (uniqueClasses.length > 0) {
          setSelectedClass(uniqueClasses[0].id)
        }

        // Get subjects
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('id,name')
          .order('name')

        setSubjects(subjectData || [])

        // Set current session and term
        const now = new Date()
        const year = now.getFullYear()
        setSelectedSession(`${year}/${year + 1}`)

        if (now.getMonth() < 4) {
          setSelectedTerm('First Term')
        } else if (now.getMonth() < 8) {
          setSelectedTerm('Second Term')
        } else {
          setSelectedTerm('Third Term')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) return

      try {
        const { data } = await supabase
          .from('students')
          .select('id,user:users(full_name),admission_number')
          .eq('class_id', selectedClass)
          .order('user.full_name')

        setStudents(data || [])
        setResults({})
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

      if (!selectedClass || !selectedSubject || !selectedSession || !selectedTerm) {
        throw new Error('Please fill all required fields')
      }

      const records = students
        .filter(s => results[s.id])
        .map(s => ({
          student_id: s.id,
          subject_id: selectedSubject,
          class_id: selectedClass,
          term: selectedTerm,
          session: selectedSession,
          score: results[s.id],
          teacher_id: authUser.id,
        }))

      if (records.length === 0) {
        throw new Error('Please enter scores for at least one student')
      }

      const { error: err } = await supabase
        .from('results')
        .upsert(records, { onConflict: 'student_id,subject_id,class_id,term,session' })

      if (err) throw err
      setSuccess(`${records.length} result(s) recorded successfully!`)
      setResults({})
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
        <h1 className="text-3xl font-bold text-gray-900">Enter Results</h1>
        <p className="text-gray-500 mt-1">Record student scores and grades</p>
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
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Select Class & Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="class">Class *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
                    <SelectValue />
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
                <Label htmlFor="subject">Subject *</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="session">Session *</Label>
                <Input
                  id="session"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="term">Term *</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger id="term">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Grid */}
        {students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Scores</CardTitle>
              <CardDescription>
                Enter scores out of 100 for each student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {student.user.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.admission_number}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Score"
                      className="w-24"
                      value={results[student.id] || ''}
                      onChange={(e) =>
                        setResults({
                          ...results,
                          [student.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
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
              Save Results
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
