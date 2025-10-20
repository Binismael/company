'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Download,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceRecord {
  id: string
  studentName: string
  studentId: string
  class: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
}

interface ClassAttendanceSummary {
  class: string
  totalStudents: number
  presentToday: number
  absentToday: number
  lateToday: number
  attendanceRate: number
}

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState('SS2A')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    { id: '1', studentName: 'Chisom Okafor', studentId: 'EBS/2024/001', class: 'SS2A', date: '2024-01-20', status: 'present' },
    { id: '2', studentName: 'Blessing Adeyemi', studentId: 'EBS/2024/002', class: 'SS2A', date: '2024-01-20', status: 'present' },
    { id: '3', studentName: 'Grace Uzoh', studentId: 'EBS/2024/003', class: 'SS2A', date: '2024-01-20', status: 'absent' },
    { id: '4', studentName: 'David Okoro', studentId: 'EBS/2024/004', class: 'SS2A', date: '2024-01-20', status: 'late' },
    { id: '5', studentName: 'Ngozi Nwosu', studentId: 'EBS/2024/005', class: 'SS2A', date: '2024-01-20', status: 'present' },
    { id: '6', studentName: 'Amara Eze', studentId: 'EBS/2024/006', class: 'SS2A', date: '2024-01-20', status: 'excused' },
    { id: '7', studentName: 'Adekunle Bello', studentId: 'EBS/2024/007', class: 'SS2A', date: '2024-01-20', status: 'present' },
  ])

  const [classSummaries, setClassSummaries] = useState<ClassAttendanceSummary[]>([
    { class: 'SS1A', totalStudents: 40, presentToday: 38, absentToday: 1, lateToday: 1, attendanceRate: 95 },
    { class: 'SS1B', totalStudents: 42, presentToday: 40, absentToday: 2, lateToday: 0, attendanceRate: 95.2 },
    { class: 'SS2A', totalStudents: 45, presentToday: 41, absentToday: 2, lateToday: 2, attendanceRate: 91.1 },
    { class: 'SS2B', totalStudents: 43, presentToday: 39, absentToday: 3, lateToday: 1, attendanceRate: 90.7 },
    { class: 'SS3A', totalStudents: 38, presentToday: 37, absentToday: 0, lateToday: 1, attendanceRate: 97.4 },
    { class: 'SS3B', totalStudents: 40, presentToday: 38, absentToday: 2, lateToday: 0, attendanceRate: 95 },
  ])

  const attendanceTrendData = [
    { date: 'Mon', percentage: 94 },
    { date: 'Tue', percentage: 92 },
    { date: 'Wed', percentage: 88 },
    { date: 'Thu', percentage: 91 },
    { date: 'Fri', percentage: 87 },
  ]

  const classPerformanceData = [
    { class: 'SS1A', attendance: 95 },
    { class: 'SS1B', attendance: 95.2 },
    { class: 'SS2A', attendance: 91.1 },
    { class: 'SS2B', attendance: 90.7 },
    { class: 'SS3A', attendance: 97.4 },
    { class: 'SS3B', attendance: 95 },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const handleStatusChange = (recordId: string, newStatus: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceRecords(
      attendanceRecords.map((record) =>
        record.id === recordId ? { ...record, status: newStatus } : record
      )
    )
    toast.success('Attendance updated')
  }

  const handleExportAttendance = () => {
    toast.success('Attendance report exported as CSV')
  }

  const currentClassSummary = classSummaries.find((s) => s.class === selectedClass) || classSummaries[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-2">Track and manage student attendance</p>
        </div>
        <Button onClick={handleExportAttendance} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="mark" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="summary">Class Summary</TabsTrigger>
        </TabsList>

        {/* Mark Attendance Tab */}
        <TabsContent value="mark" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>Record daily attendance for students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium">Select Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SS1A">SS1A</SelectItem>
                      <SelectItem value="SS1B">SS1B</SelectItem>
                      <SelectItem value="SS2A">SS2A</SelectItem>
                      <SelectItem value="SS2B">SS2B</SelectItem>
                      <SelectItem value="SS3A">SS3A</SelectItem>
                      <SelectItem value="SS3B">SS3B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full">Save Attendance</Button>
                </div>
              </div>

              {/* Class Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{currentClassSummary.presentToday}</div>
                    <p className="text-xs text-gray-600 mt-1">Present</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-600">{currentClassSummary.absentToday}</div>
                    <p className="text-xs text-gray-600 mt-1">Absent</p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-600">{currentClassSummary.lateToday}</div>
                    <p className="text-xs text-gray-600 mt-1">Late</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-600">{currentClassSummary.attendanceRate}%</div>
                    <p className="text-xs text-gray-600 mt-1">Rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.studentName}</TableCell>
                        <TableCell className="text-sm text-gray-600">{record.studentId}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={record.status}
                            onValueChange={(value) => 
                              handleStatusChange(record.id, value as 'present' | 'absent' | 'late' | 'excused')
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="excused">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Trend</CardTitle>
                <CardDescription>Overall attendance percentage by day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class-wise Attendance Rate</CardTitle>
                <CardDescription>Attendance percentage by class</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={classPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class" />
                    <YAxis domain={[85, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="attendance" fill="#1e40af" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary by Class</CardTitle>
              <CardDescription>Today's attendance overview for all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Total Students</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Attendance Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classSummaries.map((summary) => (
                      <TableRow key={summary.class}>
                        <TableCell className="font-medium">{summary.class}</TableCell>
                        <TableCell>{summary.totalStudents}</TableCell>
                        <TableCell className="text-green-600 font-medium">{summary.presentToday}</TableCell>
                        <TableCell className="text-red-600 font-medium">{summary.absentToday}</TableCell>
                        <TableCell className="text-yellow-600 font-medium">{summary.lateToday}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600 rounded-full"
                                style={{ width: `${summary.attendanceRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{summary.attendanceRate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
