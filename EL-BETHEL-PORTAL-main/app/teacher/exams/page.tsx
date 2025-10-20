'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit2, Eye, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ExamSession {
  id: string
  title: string
  description?: string
  class: { name: string; form_level: string }
  subject: { name: string; code: string }
  start_time: string
  end_time: string
  duration_minutes: number
  total_marks: number
  status: string
}

interface Class {
  id: string
  name: string
  form_level: string
}

interface Subject {
  id: string
  name: string
  code: string
}

export default function TeacherExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<ExamSession[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    startTime: '',
    endTime: '',
    durationMinutes: '60',
    totalMarks: '100',
    passingMark: '40',
  })

  useEffect(() => {
    const initializePage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .order('name')

        setClasses(classesData || [])

        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .order('name')

        setSubjects(subjectsData || [])

        const response = await fetch(`/api/exams/sessions`)
        const examsData = await response.json()

        const teacherExams = examsData.data?.filter((exam: ExamSession) => exam.teacher)

        setExams(teacherExams || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [router])

  const handleCreateExam = async () => {
    if (!formData.title || !formData.classId || !formData.subjectId) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/exams/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          classId: formData.classId,
          subjectId: formData.subjectId,
          teacherId: userId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          durationMinutes: parseInt(formData.durationMinutes),
          totalMarks: parseInt(formData.totalMarks),
          passingMark: parseInt(formData.passingMark),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to create exam')
        return
      }

      toast.success('Exam created successfully!')
      setExams([...exams, data.data])
      setOpenDialog(false)
      setFormData({
        title: '',
        description: '',
        classId: '',
        subjectId: '',
        startTime: '',
        endTime: '',
        durationMinutes: '60',
        totalMarks: '100',
        passingMark: '40',
      })

      router.push(`/teacher/exams/${data.data.id}/questions`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create exam')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-gray-600 mt-2">Create and manage exams for your classes</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
              <DialogDescription>
                Fill in the exam details below. You'll add questions in the next step.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Exam Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., First Term Mathematics Exam"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Exam details and instructions"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Class *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Subject *</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Total Marks</label>
                  <Input
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Passing Mark</label>
                  <Input
                    type="number"
                    value={formData.passingMark}
                    onChange={(e) => setFormData({ ...formData, passingMark: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleCreateExam} className="w-full">
                Create Exam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No exams created yet</p>
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Exam
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{exam.title}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="space-y-1">
                        <p>Class: {exam.class?.name}</p>
                        <p>Subject: {exam.subject?.name}</p>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(exam.status)}>
                    {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exam.description && (
                    <p className="text-sm text-gray-600">{exam.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{exam.duration_minutes} minutes</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Marks</p>
                      <p className="font-medium">{exam.total_marks}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Manage Questions
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/teacher/exams/${exam.id}/results`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
