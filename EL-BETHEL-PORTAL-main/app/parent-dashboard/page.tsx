'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, Users, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface Student {
  id: string
  admission_number: string
  user: { full_name: string; email: string }
  class: { name: string; form_level: string }
}

interface Result {
  id: string
  subject: { name: string; code: string }
  score: number
  grade: string
  term: string
  session: string
}

export default function ParentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [children, setChildren] = useState<Student[]>([])
  const [selectedChild, setSelectedChild] = useState<Student | null>(null)
  const [childResults, setChildResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get user info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError) throw userError
        setUser(userData)

        // For now, get all students (in a real app, link parents to children)
        const { data: childrenData, error: childrenError } = await supabase
          .from('students')
          .select(`
            *,
            user:users(full_name, email),
            class:classes(name, form_level)
          `)
          .limit(5)

        if (childrenError) throw childrenError
        setChildren(childrenData)

        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0])
          loadChildResults(childrenData[0].id)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadChildResults = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          subject:subjects(name, code)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setChildResults(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user?.full_name}
              </h1>
              <p className="text-gray-600 mt-1">Parent Portal - Monitor your child's progress</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="children" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="children" className="gap-2">
              <Users className="h-4 w-4" />
              My Children
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Academic Results
            </TabsTrigger>
          </TabsList>

          {/* Children Tab */}
          <TabsContent value="children" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Children</CardTitle>
                <CardDescription>
                  Your enrolled children
                </CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No children found
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child) => (
                      <Card
                        key={child.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedChild(child)
                          loadChildResults(child.id)
                        }}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {child.user.full_name}
                          </CardTitle>
                          <CardDescription>
                            {child.class.name} ({child.class.form_level})
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-gray-600">
                            Admission: {child.admission_number}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {selectedChild && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Results - {selectedChild.user.full_name}
                  </CardTitle>
                  <CardDescription>
                    Academic performance for {selectedChild.class.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {childResults.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No results available yet
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-2 px-4 font-medium">
                              Subject
                            </th>
                            <th className="text-left py-2 px-4 font-medium">
                              Score
                            </th>
                            <th className="text-left py-2 px-4 font-medium">
                              Grade
                            </th>
                            <th className="text-left py-2 px-4 font-medium">
                              Term
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {childResults.map((result) => (
                            <tr
                              key={result.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-2 px-4">
                                {result.subject.name}
                              </td>
                              <td className="py-2 px-4">{result.score}</td>
                              <td className="py-2 px-4">
                                <Badge
                                  variant={
                                    result.grade === 'A'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {result.grade}
                                </Badge>
                              </td>
                              <td className="py-2 px-4">{result.term}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
