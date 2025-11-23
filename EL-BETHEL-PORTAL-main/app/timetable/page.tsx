'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, AlertCircle, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const TIME_SLOTS = [
  '8:00 AM', '8:45 AM', '9:30 AM', '10:15 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '1:45 PM', '2:30 PM', '3:15 PM'
]

export default function TimetablePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<string>(
    searchParams.get('classId') || ''
  )
  const [timetable, setTimetable] = useState<any>(null)
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get user info
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        setUser(userData)

        // Fetch classes based on user role
        let classesQuery = supabase.from('classes').select('id, name, form_level')

        if (userData?.role === 'teacher') {
          classesQuery = classesQuery.eq('class_teacher_id', authUser.id)
        }

        const { data: classesData } = await classesQuery

        if (classesData && classesData.length > 0) {
          setClasses(classesData)
          const defaultClassId = selectedClass || classesData[0].id
          setSelectedClass(defaultClassId)
          await fetchTimetableData(defaultClassId)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load timetable')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, selectedClass])

  const fetchTimetableData = async (classId: string) => {
    try {
      // Fetch timetable
      const { data: timetableData } = await supabase
        .from('timetables')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (timetableData) {
        setTimetable(timetableData)

        // Fetch schedules
        const { data: schedulesData } = await supabase
          .from('timetable_schedules')
          .select(`
            *,
            subject:subjects(id, name, code),
            teacher:users(id, full_name)
          `)
          .eq('timetable_id', timetableData.id)
          .order('day_of_week, period_number')

        setSchedules(schedulesData || [])
      }
    } catch (err: any) {
      toast.error('Failed to load timetable')
    }
  }

  const getScheduleForSlot = (dayOfWeek: number, periodNumber: number) => {
    return schedules.find(
      (s) => s.day_of_week === dayOfWeek && s.period_number === periodNumber
    )
  }

  const renderTimetableGrid = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 w-20">
                Period
              </th>
              {DAYS.map((day, index) => (
                <th
                  key={day}
                  className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time, periodIndex) => (
              <tr key={time}>
                <td className="border border-gray-200 px-4 py-3 text-xs font-medium text-gray-600 bg-gray-50">
                  <div>{time}</div>
                  <div className="text-gray-500">P{periodIndex + 1}</div>
                </td>
                {DAYS.map((_, dayIndex) => {
                  const schedule = getScheduleForSlot(dayIndex + 1, periodIndex + 1)
                  return (
                    <td
                      key={`${dayIndex}-${periodIndex}`}
                      className="border border-gray-200 p-2"
                    >
                      {schedule ? (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 h-full border border-blue-200">
                          <div className="font-semibold text-sm text-gray-900 mb-1">
                            {schedule.subject?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {schedule.teacher?.full_name || 'TBA'}
                          </div>
                          {schedule.location && (
                            <div className="text-xs text-gray-500 px-2 py-1 bg-white rounded">
                              {schedule.location}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-300">-</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timetable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Class Timetable</h1>
              <p className="text-sm text-gray-600">Weekly schedule and class periods</p>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Selection */}
        {classes.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Class
            </label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.form_level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Timetable Info */}
        {timetable && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Session</p>
                  <p className="font-semibold text-gray-900">{timetable.session}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Term</p>
                  <p className="font-semibold text-gray-900">{timetable.term}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Periods</p>
                  <p className="font-semibold text-gray-900">{schedules.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timetable Grid */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>
              {DAYS.length} school days, {TIME_SLOTS.length} periods per day
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {schedules.length > 0 ? (
              renderTimetableGrid()
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No timetable available for this class</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">How to Read the Timetable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded border border-blue-200 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Class Period</p>
                <p className="text-sm text-gray-600">Shows the subject, teacher name, and location for each class period</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 flex items-center justify-center text-gray-300 font-semibold text-2xl flex-shrink-0">-</div>
              <div>
                <p className="font-medium text-gray-900">Free Period</p>
                <p className="text-sm text-gray-600">No class scheduled for this period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="mt-8 flex gap-3">
          <Button className="gap-2">
            <Calendar className="w-4 h-4" />
            Download as PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <Clock className="w-4 h-4" />
            Print Timetable
          </Button>
        </div>
      </main>
    </div>
  )
}
