'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Loader2, AlertCircle, Users, BookOpen } from 'lucide-react'

interface ClassInfo {
  id: string
  name: string
  form_level: string
  capacity: number
  students_count: number
}

export default function ClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get unique classes for this teacher
        const { data: classSubjectsData } = await supabase
          .from('class_subjects')
          .select('class_id,class:classes(id,name,form_level,capacity)')
          .eq('teacher_id', authUser.id)

        const uniqueClasses = Array.from(
          new Map(
            (classSubjectsData || []).map(item => [item.class_id, item.class])
          ).values()
        ) as any[]

        // Get student counts for each class
        const classesWithCounts = await Promise.all(
          uniqueClasses.map(async (cls) => {
            const { count } = await supabase
              .from('students')
              .select('*', { count: 'exact' })
              .eq('class_id', cls.id)

            return {
              ...cls,
              students_count: count || 0,
            }
          })
        )

        setClasses(classesWithCounts)
      } catch (err: any) {
        setError(err.message || 'Failed to load classes')
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-500 mt-1">Classes you are assigned to teach</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500">No classes assigned yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/teacher/classes/${cls.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{cls.name}</CardTitle>
                  <CardDescription>{cls.form_level}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        <span className="font-medium">{cls.students_count}</span> students
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Capacity: <span className="font-medium">{cls.capacity}</span>
                      </span>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      View Class
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
