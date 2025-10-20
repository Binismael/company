'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  BookOpen,
  FileText,
  BarChart3,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react'
import Link from 'next/link'

export default function TeacherDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    activeExams: 0,
  })
  const [recentAssignments, setRecentAssignments] = useState([])
  const [recentExams, setRecentExams] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get classes
        const { data: classesData, error: classesError } = await supabase
          .from('class_subjects')
          .select('class_id', { count: 'exact' })
          .eq('teacher_id', authUser.id)

        if (classesError) throw classesError
        const uniqueClasses = new Set(classesData?.map(c => c.class_id) || [])
        setStats(prev => ({ ...prev, totalClasses: uniqueClasses.size }))

        // Get total students
        let totalStudents = 0
        for (const classId of Array.from(uniqueClasses)) {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact' })
            .eq('class_id', classId)
          totalStudents += count || 0
        }
        setStats(prev => ({ ...prev, totalStudents }))

        // Get assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`*,subject:subjects(name),class:classes(name)`)
          .eq('teacher_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (assignmentsError) throw assignmentsError
        setRecentAssignments(assignmentsData || [])
        const pendingCount = (assignmentsData || []).filter(
          a => new Date(a.due_date) > new Date()
        ).length
        setStats(prev => ({ ...prev, pendingAssignments: pendingCount }))

        // Get exams
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select(`*,subject:subjects(name),class:classes(name)`)
          .eq('teacher_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (examsError) throw examsError
        setRecentExams(examsData || [])
        const activeCount = (examsData || []).filter(
          e => !e.results_released
        ).length
        setStats(prev => ({ ...prev, activeExams: activeCount }))

      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">{stats.totalClasses}</div>
            <p className="text-xs text-gray-500 mt-1">Classes assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">All classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingAssignments}</div>
            <p className="text-xs text-gray-500 mt-1">Due soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Active Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.activeExams}</div>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Assignments</CardTitle>
                <CardDescription>Last 5 assignments created</CardDescription>
              </div>
              <Link href="/teacher/assignments/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentAssignments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No assignments yet</p>
            ) : (
              <div className="space-y-4">
                {recentAssignments.map((assignment: any) => (
                  <Link
                    key={assignment.id}
                    href={`/teacher/assignments/${assignment.id}`}
                    className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {assignment.class?.name} • {assignment.subject?.name}
                        </p>
                      </div>
                      {new Date(assignment.due_date) > new Date() ? (
                        <Badge variant="outline">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Exams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Exams</CardTitle>
                <CardDescription>Last 5 exams created</CardDescription>
              </div>
              <Link href="/teacher/exams/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentExams.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No exams yet</p>
            ) : (
              <div className="space-y-4">
                {recentExams.map((exam: any) => (
                  <Link
                    key={exam.id}
                    href={`/teacher/exams/${exam.id}`}
                    className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{exam.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {exam.class?.name} • {exam.subject?.name}
                        </p>
                      </div>
                      {exam.results_released ? (
                        <Badge className="bg-green-100 text-green-800">Released</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/teacher/assignments/new">
              <Button variant="outline" className="w-full">
                Create Assignment
              </Button>
            </Link>
            <Link href="/teacher/exams/new">
              <Button variant="outline" className="w-full">
                Create Exam
              </Button>
            </Link>
            <Link href="/teacher/attendance">
              <Button variant="outline" className="w-full">
                Mark Attendance
              </Button>
            </Link>
            <Link href="/teacher/results">
              <Button variant="outline" className="w-full">
                Enter Results
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
