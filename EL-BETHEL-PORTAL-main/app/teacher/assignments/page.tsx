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

interface Assignment {
  id: string
  title: string
  description: string
  class: { name: string }
  subject: { name: string }
  due_date: string
  submissions: { length: number }
  created_at: string
}

export default function AssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        const { data, error: err } = await supabase
          .from('assignments')
          .select(`
            *,
            class:classes(name),
            subject:subjects(name),
            submissions:assignment_submissions(count)
          `)
          .eq('teacher_id', authUser.id)
          .order('due_date', { ascending: false })

        if (err) throw err
        setAssignments(data || [])
        setFilteredAssignments(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }

    loadAssignments()
  }, [router])

  useEffect(() => {
    const filtered = assignments.filter(
      a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.class.name.toLowerCase().includes(search.toLowerCase()) ||
        a.subject.name.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredAssignments(filtered)
  }, [search, assignments])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-500 mt-1">Create and manage class assignments</p>
        </div>
        <Link href="/teacher/assignments/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Assignment
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

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500 mb-4">
                {assignments.length === 0 ? 'No assignments created yet' : 'No assignments match your search'}
              </p>
              {assignments.length === 0 && (
                <Link href="/teacher/assignments/new">
                  <Button>Create Your First Assignment</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {assignment.class.name} • {assignment.subject.name}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={isOverdue(assignment.due_date) ? 'destructive' : 'default'}
                  >
                    {isOverdue(assignment.due_date) ? 'Overdue' : 'Active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {assignment.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">{assignment.submissions?.length || 0}</span> submissions
                  </div>
                  <span className="text-sm text-gray-500">
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </span>
                </div>
                <Link href={`/teacher/assignments/${assignment.id}`}>
                  <Button variant="outline" className="w-full">
                    View & Grade
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
