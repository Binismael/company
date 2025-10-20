'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Search, Eye, Users, Clock, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface ExamSession {
  id: string
  title: string
  subject: { name: string }
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
  total_marks: number
  question_count: number
}

export default function ExamManagementPage() {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<ExamSession[]>([])
  const [showAddExamDialog, setShowAddExamDialog] = useState(false)
  const [newExam, setNewExam] = useState({
    title: '',
    subjectId: '',
    startTime: '',
    endTime: '',
    duration: 60,
    totalMarks: 100,
  })

  useEffect(() => {
    const loadExams = async () => {
      try {
        const { data, error } = await supabase
          .from('exam_sessions')
          .select('*, subject:subjects(name)')
          .order('start_time', { ascending: false })

        if (error) throw error
        setExams(data || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load exams')
      } finally {
        setLoading(false)
      }
    }

    loadExams()
  }, [])

  const handleCreateExam = async () => {
    if (!newExam.title || !newExam.subjectId || !newExam.startTime) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase.from('exam_sessions').insert({
        title: newExam.title,
        subject_id: newExam.subjectId,
        start_time: newExam.startTime,
        end_time: newExam.endTime || newExam.startTime,
        duration_minutes: newExam.duration,
        total_marks: newExam.totalMarks,
        status: 'scheduled',
      })

      if (error) throw error

      toast.success('Exam created successfully')
      setShowAddExamDialog(false)
      setNewExam({ title: '', subjectId: '', startTime: '', endTime: '', duration: 60, totalMarks: 100 })

      const { data: updatedExams } = await supabase
        .from('exam_sessions')
        .select('*')
        .order('start_time', { ascending: false })
      setExams(updatedExams || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to create exam')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Exam Management</h1>
          <p className="text-gray-600 mt-2">Create, schedule, and monitor exams</p>
        </div>
        <Dialog open={showAddExamDialog} onOpenChange={setShowAddExamDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
              <DialogDescription>Set up a new exam session for students</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Exam Title</label>
                  <Input
                    placeholder="e.g., Mathematics Final Exam"
                    value={newExam.title}
                    onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <select
                    value={newExam.subjectId}
                    onChange={(e) => setNewExam({ ...newExam, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Select subject</option>
                    <option value="math">Mathematics</option>
                    <option value="english">English</option>
                    <option value="science">Science</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={newExam.startTime}
                    onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="datetime-local"
                    value={newExam.endTime}
                    onChange={(e) => setNewExam({ ...newExam, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={newExam.duration}
                    onChange={(e) => setNewExam({ ...newExam, duration: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total Marks</label>
                  <Input
                    type="number"
                    value={newExam.totalMarks}
                    onChange={(e) => setNewExam({ ...newExam, totalMarks: parseInt(e.target.value) })}
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Exams ({exams.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {['all', 'scheduled', 'active', 'completed'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {exams
              .filter(exam => tab === 'all' || exam.status === tab)
              .map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.subject.name}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(exam.status)}>
                        {exam.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-sm">
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {exam.duration_minutes} mins
                        </p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-600">Total Marks</p>
                        <p className="font-medium">{exam.total_marks}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-600">Questions</p>
                        <p className="font-medium">{exam.question_count || 0}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-600">Start Time</p>
                        <p className="font-medium text-xs">
                          {new Date(exam.start_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-2 flex-1">
                        <Eye className="w-4 h-4" />
                        Monitor
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 flex-1">
                        <Users className="w-4 h-4" />
                        Attempts
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 flex-1">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
