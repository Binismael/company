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
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Loader2 } from 'lucide-react'

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
}

export default function NewExamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    durationMinutes: '60',
    totalMarks: '100',
    passingMarks: '40',
  })

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

        // Get subjects
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('id,name')
          .order('name')

        setSubjects(subjectData || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      if (!selectedClass || !selectedSubject || !formData.title || !formData.startDate) {
        throw new Error('Please fill all required fields')
      }

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.durationMinutes) * 60000)

      const { data, error: err } = await supabase
        .from('exams')
        .insert([
          {
            class_id: selectedClass,
            subject_id: selectedSubject,
            title: formData.title,
            description: formData.description,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            duration_minutes: parseInt(formData.durationMinutes),
            total_marks: parseInt(formData.totalMarks),
            passing_marks: parseInt(formData.passingMarks),
            teacher_id: authUser.id,
          },
        ])
        .select()

      if (err) throw err

      if (data && data.length > 0) {
        router.push(`/teacher/exams/${data[0].id}`)
      }
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Exam</h1>
        <p className="text-gray-500 mt-1">Create a new CBT exam for your class</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Class Selection */}
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

            {/* Subject Selection */}
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
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

            {/* Title */}
            <div>
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Physics First Term Test"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Exam instructions, topics covered..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Exam Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="totalMarks">Total Marks *</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  min="1"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, totalMarks: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="passingMarks">Passing Marks *</Label>
                <Input
                  id="passingMarks"
                  type="number"
                  min="0"
                  value={formData.passingMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, passingMarks: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-6 border-t">
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
                Create Exam
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
