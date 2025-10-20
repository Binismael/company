'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, BookOpen, FileText, Users, Calendar, AlertCircle, Download, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Subject {
  id: string
  name: string
  code: string
  teacher?: { full_name: string; email: string }
}

interface Material {
  id: string
  title: string
  type: string
  url: string
  uploaded_at: string
}

export default function StudentCoursesPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [materials, setMaterials] = useState<Record<string, Material[]>>({})
  const [loading, setLoading] = useState(true)
  const [classId, setClassId] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: studentData } = await supabase
          .from('students')
          .select('id, class_id')
          .eq('user_id', user.id)
          .single()

        if (!studentData) {
          toast.error('Student profile not found')
          return
        }

        setClassId(studentData.class_id)

        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select(`
            *,
            teacher:teachers(full_name, email)
          `)
          .eq('class_id', studentData.class_id)
          .order('name')

        if (subjectsError) throw subjectsError

        setSubjects(subjectsData || [])

        for (const subject of subjectsData || []) {
          const { data: materialsData } = await supabase
            .from('course_materials')
            .select('*')
            .eq('subject_id', subject.id)
            .order('uploaded_at', { ascending: false })

          if (materialsData) {
            setMaterials(prev => ({
              ...prev,
              [subject.id]: materialsData,
            }))
          }
        }

        if (subjectsData && subjectsData.length > 0) {
          setSelectedSubject(subjectsData[0])
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [router])

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄'
      case 'video':
        return '🎥'
      case 'presentation':
        return '📊'
      case 'document':
        return '📝'
      default:
        return '📎'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses & Subjects</h1>
          <p className="text-gray-600 mt-2">Access course materials and connect with teachers</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No courses available yet. Please check back later.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Courses & Subjects</h1>
        <p className="text-gray-600 mt-2">Access course materials and connect with teachers</p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Card
            key={subject.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedSubject?.id === subject.id
                ? 'ring-2 ring-primary-600 shadow-lg'
                : ''
            }`}
            onClick={() => setSelectedSubject(subject)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <CardDescription>Code: {subject.code}</CardDescription>
                </div>
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {subject.teacher && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{subject.teacher.full_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{materials[subject.id]?.length || 0} materials</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Details */}
      {selectedSubject && (
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="outline">Outline</TabsTrigger>
            <TabsTrigger value="teacher">Teacher Info</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{selectedSubject.name} - Course Materials</CardTitle>
                <CardDescription>Download and access course resources</CardDescription>
              </CardHeader>
              <CardContent>
                {materials[selectedSubject.id] && materials[selectedSubject.id].length > 0 ? (
                  <div className="space-y-3">
                    {materials[selectedSubject.id].map((material) => (
                      <a
                        key={material.id}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(material.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-primary-600">
                              {material.title}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(material.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-600">
                    No materials uploaded yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Outline</CardTitle>
                <CardDescription>Topics and learning objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Course outline will be available soon. Check back later for details.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teacher" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Information</CardTitle>
                <CardDescription>Contact and office details</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSubject.teacher ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Teacher Name</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedSubject.teacher.full_name}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Email</p>
                      <a
                        href={`mailto:${selectedSubject.teacher.email}`}
                        className="text-lg font-semibold text-primary-600 hover:underline"
                      >
                        {selectedSubject.teacher.email}
                      </a>
                    </div>
                    <Button className="w-full gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Send Message to Teacher
                    </Button>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Teacher information not available</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
