'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Calendar, CheckCircle, X, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useStudentAttendance } from '@/hooks/use-student-data'

export default function StudentAttendancePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { attendance, loading: attendanceLoading } = useStudentAttendance(userId)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUserId(user.id)
      } catch (err: any) {
        setError(err.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0
    const present = attendance.filter(
      (a: any) => a.status === 'Present' || a.status === 'Late'
    ).length
    return ((present / attendance.length) * 100).toFixed(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
      case 'Late':
        return 'bg-green-100 text-green-800'
      case 'Absent':
        return 'bg-red-100 text-red-800'
      case 'Excused':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present':
      case 'Late':
        return <CheckCircle className="h-4 w-4" />
      case 'Absent':
        return <X className="h-4 w-4" />
      case 'Excused':
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const monthlyStats = attendance.reduce((acc: any, record: any) => {
    const date = new Date(record.attendance_date)
    const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    if (!acc[month]) {
      acc[month] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
    }

    acc[month].total++
    if (record.status === 'Present') acc[month].present++
    if (record.status === 'Absent') acc[month].absent++
    if (record.status === 'Late') acc[month].late++
    if (record.status === 'Excused') acc[month].excused++

    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
              <p className="text-gray-600 mt-2">Track your class attendance records</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
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

        {/* Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {attendance.filter((a: any) => a.status === 'Present').length}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Present</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {attendance.filter((a: any) => a.status === 'Late').length}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Late</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {attendance.filter((a: any) => a.status === 'Absent').length}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Absent</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {attendance.length}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Total Records</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {calculateAttendancePercentage()}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Percentage</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Statistics */}
        {Object.keys(monthlyStats).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(monthlyStats).map(([month, stats]: [string, any]) => (
                <Card key={month}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{month}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Present:</span>
                        <span className="font-semibold text-green-600">{stats.present}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Late:</span>
                        <span className="font-semibold text-yellow-600">{stats.late}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Absent:</span>
                        <span className="font-semibold text-red-600">{stats.absent}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{stats.total}</span>
                      </div>
                      <div className="bg-gray-100 p-2 rounded mt-2">
                        <p className="text-xs text-gray-600">
                          Percentage: {((stats.present / stats.total) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Records</h2>
          {attendanceLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : attendance.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Class</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record: any) => (
                        <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(record.attendance_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.classes?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge className={getStatusColor(record.status)}>
                              {getStatusIcon(record.status)}
                              <span className="ml-1">{record.status}</span>
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.remark || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No attendance records</p>
                <p className="text-gray-500 mt-1">Your attendance records will appear here</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Attendance Policy */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Attendance Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>80% attendance is mandatory for exam eligibility</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Medical leaves must be supported with a doctor's note</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Repeated absences will be reported to parents/guardians</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Arrival after 8:00 AM is marked as late</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
