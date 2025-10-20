'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ExamSession {
  id: string
  title: string
  description?: string
  class: { name: string; form_level: string }
  subject: { name: string; code: string }
  teacher: { full_name: string; email: string }
  start_time: string
  end_time: string
  duration_minutes: number
  total_marks: number
  status: string
}

export default function AdminExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState<ExamSession | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    const loadExams = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const response = await fetch('/api/exams/sessions')
        const examsData = await response.json()
        setExams(examsData.data || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load exams')
      } finally {
        setLoading(false)
      }
    }

    loadExams()
  }, [router])

  const handleUpdateStatus = async () => {
    if (!selectedExam || !newStatus) return

    try {
      const { error } = await supabase
        .from('exam_sessions')
        .update({ status: newStatus })
        .eq('id', selectedExam.id)

      if (error) throw error

      setExams(
        exams.map((exam) =>
          exam.id === selectedExam.id ? { ...exam, status: newStatus } : exam
        )
      )

      toast.success('Exam status updated')
      setOpenDialog(false)
      setSelectedExam(null)
      setNewStatus('')
    } catch (error: any) {
      toast.error('Failed to update exam status')
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Delete this exam? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('exam_sessions')
        .delete()
        .eq('id', examId)

      if (error) throw error

      setExams(exams.filter((exam) => exam.id !== examId))
      toast.success('Exam deleted')
    } catch (error: any) {
      toast.error('Failed to delete exam')
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
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading exams...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exams Management</h1>
        <p className="text-gray-600 mt-2">Oversee all exams across the school</p>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No exams created yet</p>
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
                        <p>Teacher: {exam.teacher?.full_name}</p>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(exam.status)}>
                    {exam.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exam.description && (
                    <p className="text-sm text-gray-600">{exam.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{exam.duration_minutes} min</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Marks</p>
                      <p className="font-medium">{exam.total_marks}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Scheduled</p>
                      <p className="font-medium">
                        {new Date(exam.start_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/exams/${exam.id}/results`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Results
                    </Button>

                    <Dialog open={openDialog && selectedExam?.id === exam.id} onOpenChange={setOpenDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedExam(exam)
                            setNewStatus(exam.status)
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Change Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Exam Status</DialogTitle>
                          <DialogDescription>
                            Update the status of {exam.title}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <select
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            >
                              <option value="draft">Draft</option>
                              <option value="active">Active</option>
                              <option value="completed">Completed</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>

                          <Button onClick={handleUpdateStatus} className="w-full">
                            Update Status
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteExam(exam.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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
