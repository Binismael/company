'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { toast } from 'sonner'

interface AttendanceRecord {
  id: string
  attendance_date: string
  status: string
  class: { name: string }
}

interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  percentage: number
}

export default function StudentAttendancePage() {
  const router = useRouter()
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  )

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!studentData) {
          toast.error('Student profile not found')
          return
        }

        const { data: attendanceData, error } = await supabase
          .from('attendance')
          .select(`
            *,
            class:classes(name)
          `)
          .eq('student_id', studentData.id)
          .order('attendance_date', { ascending: false })

        if (error) throw error

        setAttendance(attendanceData || [])
        calculateSummary(attendanceData || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load attendance')
      } finally {
        setLoading(false)
      }
    }

    loadAttendance()
  }, [router])

  const calculateSummary = (data: AttendanceRecord[]) => {
    const total = data.length
    const present = data.filter(a => a.status === 'Present').length
    const absent = data.filter(a => a.status === 'Absent').length
    const late = data.filter(a => a.status === 'Late').length
    const percentage = total > 0 ? ((present + late) / total) * 100 : 0

    setSummary({
      total,
      present,
      absent,
      late,
      percentage: Math.round(percentage),
    })
  }

  const filteredAttendance = attendance.filter(a =>
    a.attendance_date.startsWith(selectedMonth)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return { badge: 'bg-green-100 text-green-800', icon: CheckCircle, color: '#10b981' }
      case 'Absent':
        return { badge: 'bg-red-100 text-red-800', icon: AlertCircle, color: '#ef4444' }
      case 'Late':
        return { badge: 'bg-yellow-100 text-yellow-800', icon: Clock, color: '#f59e0b' }
      default:
        return { badge: 'bg-gray-100 text-gray-800', icon: Calendar, color: '#6b7280' }
    }
  }

  const chartData = [
    { name: 'Present', value: summary?.present || 0, fill: '#10b981' },
    { name: 'Late', value: summary?.late || 0, fill: '#f59e0b' },
    { name: 'Absent', value: summary?.absent || 0, fill: '#ef4444' },
  ]

  const monthlyTrend = filteredAttendance
    .reverse()
    .map((record, index) => ({
      date: new Date(record.attendance_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      status: record.status === 'Present' || record.status === 'Late' ? 1 : 0,
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-gray-600 mt-2">Track your attendance and participation</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{summary.total}</div>
                <p className="text-xs text-gray-500 mt-1">Classes attended</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{summary.present}</div>
                <p className="text-xs text-gray-500 mt-1">Sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Late</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{summary.late}</div>
                <p className="text-xs text-gray-500 mt-1">Sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{summary.percentage}%</div>
                <p className="text-xs text-gray-500 mt-1">Overall</p>
              </CardContent>
            </Card>
          </div>

          {/* Warnings */}
          {summary.percentage < 75 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your attendance is below 75%. Please improve your attendance to avoid academic penalties.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Breakdown</CardTitle>
            <CardDescription>Status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {monthlyTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Present vs Absent</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="status"
                    stroke="#1e40af"
                    dot={false}
                    name="Present (1) / Absent (0)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Month Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Record</CardTitle>
              <CardDescription>Daily attendance log</CardDescription>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length > 0 ? (
            <div className="space-y-2">
              {filteredAttendance.map((record) => {
                const { badge, icon: IconComponent } = getStatusColor(record.status)
                return (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(record.attendance_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-600">{record.class.name}</p>
                      </div>
                    </div>
                    <Badge className={badge}>
                      {record.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-600">No attendance records for this month</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
