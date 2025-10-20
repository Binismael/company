'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Loader2, Plus, AlertCircle, Search } from 'lucide-react'

interface Exam {
  id: string
  title: string
  description: string
  class: { name: string }
  subject: { name: string }
  start_time: string
  duration_minutes: number
  total_marks: number
  results_released: boolean
  questions: { length: number }
  attempts: { length: number }
  created_at: string
}

export default function ExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadExams = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        const { data, error: err } = await supabase
          .from('exams')
          .select(`
            *,
            class:classes(name),
            subject:subjects(name),
            questions:exam_questions(count),
            attempts:exam_attempts(count)
          `)
          .eq('teacher_id', authUser.id)
          .order('created_at', { ascending: false })

        if (err) throw err
        setExams(data || [])
        setFilteredExams(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load exams')
      } finally {
        setLoading(false)
      }
    }

    loadExams()
  }, [router])

  useEffect(() => {
    const filtered = exams.filter(
      e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.class.name.toLowerCase().includes(search.toLowerCase()) ||
        e.subject.name.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredExams(filtered)
  }, [search, exams])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-500 mt-1">Create and manage CBT exams</p>
        </div>
        <Link href="/teacher/exams/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Exam
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by title, class, or subject..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500 mb-4">
                {exams.length === 0 ? 'No exams created yet' : 'No exams match your search'}
              </p>
              {exams.length === 0 && (
                <Link href="/teacher/exams/new">
                  <Button>Create Your First Exam</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {exam.class.name} • {exam.subject.name}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={exam.results_released ? 'default' : 'secondary'}
                  >
                    {exam.results_released ? 'Released' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Questions</p>
                      <p className="font-medium text-lg">{exam.questions?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Attempts</p>
                      <p className="font-medium text-lg">{exam.attempts?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-medium">{exam.duration_minutes} min</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Marks</p>
                      <p className="font-medium">{exam.total_marks}</p>
                    </div>
                  </div>
                  <Link href={`/teacher/exams/${exam.id}`}>
                    <Button variant="outline" className="w-full">
                      Manage Exam
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
