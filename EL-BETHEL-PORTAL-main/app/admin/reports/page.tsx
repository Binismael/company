'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download, TrendingUp, Users, BookOpen, DollarSign, Award } from 'lucide-react'
import { toast } from 'sonner'

export default function ReportsPage() {
  const [selectedTerm, setSelectedTerm] = useState('term1')
  const [selectedSession, setSelectedSession] = useState('2023/2024')

  const performanceData = [
    { class: 'SS1A', average: 78 },
    { class: 'SS1B', average: 82 },
    { class: 'SS2A', average: 81 },
    { class: 'SS2B', average: 79 },
    { class: 'SS3A', average: 88 },
    { class: 'SS3B', average: 86 },
  ]

  const attendanceData = [
    { month: 'Jan', attendance: 91 },
    { month: 'Feb', attendance: 89 },
    { month: 'Mar', attendance: 92 },
    { month: 'Apr', attendance: 88 },
    { month: 'May', attendance: 93 },
    { month: 'Jun', attendance: 90 },
  ]

  const feeCollectionData = [
    { name: 'Collected', value: 8500000, fill: '#10b981' },
    { name: 'Outstanding', value: 2300000, fill: '#f59e0b' },
    { name: 'Defaulted', value: 500000, fill: '#ef4444' },
  ]

  const subjectPerformanceData = [
    { subject: 'Mathematics', avg: 78 },
    { subject: 'English', avg: 82 },
    { subject: 'Biology', avg: 76 },
    { subject: 'Chemistry', avg: 74 },
    { subject: 'Physics', avg: 71 },
    { subject: 'History', avg: 85 },
  ]

  const enrollmentTrendData = [
    { term: 'Term 1', students: 220, teachers: 22 },
    { term: 'Term 2', students: 245, teachers: 24 },
    { term: 'Term 3', students: 245, teachers: 24 },
  ]

  const handleExportPDF = () => {
    toast.success('Report exported as PDF')
  }

  const handleExportExcel = () => {
    toast.success('Report exported as Excel')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Data-driven insights into school performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Academic Session</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term1">First Term</SelectItem>
                  <SelectItem value="term2">Second Term</SelectItem>
                  <SelectItem value="term3">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Enrollments</p>
                <p className="text-3xl font-bold">245</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Teachers</p>
                <p className="text-3xl font-bold">24</p>
              </div>
              <BookOpen className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Average Score</p>
                <p className="text-3xl font-bold">79.5%</p>
              </div>
              <Award className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Fee Collection</p>
                <p className="text-3xl font-bold">78.8%</p>
              </div>
              <DollarSign className="w-10 h-10 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Academic Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fee Collection</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment Trend</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Class</CardTitle>
                <CardDescription>Average scores across all classes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="average" fill="#1e40af" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance by Subject</CardTitle>
                <CardDescription>Average scores by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="avg" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Attendance Rate</CardTitle>
              <CardDescription>School-wide attendance percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Collection Status</CardTitle>
                <CardDescription>Current term fee status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feeCollectionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ₦${(value / 1000000).toFixed(1)}M`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {feeCollectionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fee Summary</CardTitle>
                <CardDescription>Breakdown of fee collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Total Expected</span>
                  <span className="font-semibold">₦11,300,000</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Amount Collected</span>
                  <span className="font-semibold text-green-600">₦8,500,000</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Outstanding</span>
                  <span className="font-semibold text-amber-600">₦2,300,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Defaulted</span>
                  <span className="font-semibold text-red-600">₦500,000</span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Collection Rate</p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: '75%' }} />
                  </div>
                  <p className="text-sm font-semibold mt-2">75.2%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enrollment Tab */}
        <TabsContent value="enrollment">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment & Staff Growth</CardTitle>
              <CardDescription>Trend of student and teacher enrollment</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={enrollmentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="term" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="students"
                    stroke="#1e40af"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="teachers"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
