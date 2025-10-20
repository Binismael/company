'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from 'recharts'
import {
  Users,
  DollarSign,
  BookOpen,
  FileText,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  feesCollected: number
  outstandingFees: number
  activeExams: number
  attendanceRate: number
  systemAlerts: number
}

interface RecentRegistration {
  id: string
  name: string
  role: string
  date: string
}

interface SystemAlert {
  id: string
  title: string
  description: string
  type: 'error' | 'warning' | 'info'
  timestamp: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 245,
    totalTeachers: 24,
    totalClasses: 15,
    feesCollected: 8500000,
    outstandingFees: 2300000,
    activeExams: 3,
    attendanceRate: 92.5,
    systemAlerts: 4,
  })

  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([
    { id: '1', name: 'Chisom Okafor', role: 'Student', date: '2024-01-20' },
    { id: '2', name: 'Blessing Adeyemi', role: 'Teacher', date: '2024-01-19' },
    { id: '3', name: 'Grace Uzoh', role: 'Student', date: '2024-01-18' },
    { id: '4', name: 'David Okoro', role: 'Student', date: '2024-01-17' },
    { id: '5', name: 'Ngozi Nwosu', role: 'Parent', date: '2024-01-16' },
  ])

  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      title: 'Payment Sync Issue',
      description: '5 students have outstanding fees exceeding 30 days',
      type: 'warning',
      timestamp: '2024-01-20 10:30 AM',
    },
    {
      id: '2',
      title: 'Low Attendance',
      description: 'SS2B class attendance dropped to 78% this week',
      type: 'warning',
      timestamp: '2024-01-20 08:15 AM',
    },
    {
      id: '3',
      title: 'Exam Schedule Conflict',
      description: 'Mathematics exam overlaps with English exam on Jan 25',
      type: 'error',
      timestamp: '2024-01-19 02:45 PM',
    },
    {
      id: '4',
      title: 'System Backup Completed',
      description: 'Database backup completed successfully',
      type: 'info',
      timestamp: '2024-01-19 12:00 AM',
    },
  ])

  const attendanceData = [
    { name: 'Mon', attendance: 89 },
    { name: 'Tue', attendance: 91 },
    { name: 'Wed', attendance: 88 },
    { name: 'Thu', attendance: 94 },
    { name: 'Fri', attendance: 87 },
  ]

  const feesData = [
    { name: 'Collected', value: stats.feesCollected, fill: '#10b981' },
    { name: 'Outstanding', value: stats.outstandingFees, fill: '#f59e0b' },
  ]

  const classPerformanceData = [
    { name: 'SS1A', avg: 78 },
    { name: 'SS1B', avg: 82 },
    { name: 'SS2A', avg: 81 },
    { name: 'SS2B', avg: 79 },
    { name: 'SS3A', avg: 88 },
    { name: 'SS3B', avg: 86 },
  ]

  const StatCard = ({ icon: Icon, label, value, unit, color }: any) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>
              {typeof value === 'number' && value > 1000000
                ? `₦${(value / 1000000).toFixed(1)}M`
                : typeof value === 'number' && value > 100
                  ? `${value}%`
                  : value}
            </p>
            {unit && <p className="text-xs text-gray-500 mt-1">{unit}</p>}
          </div>
          <div className={`p-3 rounded-lg ${color.includes('text') ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your school.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="text-blue-600" />
        <StatCard icon={BookOpen} label="Total Teachers" value={stats.totalTeachers} color="text-green-600" />
        <StatCard icon={BookOpen} label="Total Classes" value={stats.totalClasses} color="text-purple-600" />
        <StatCard
          icon={FileText}
          label="Active Exams"
          value={stats.activeExams}
          color="text-orange-600"
        />
      </div>

      {/* Fees Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fees Overview</CardTitle>
            <CardDescription>Current term fee collection status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={feesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₦${(value / 1000000).toFixed(1)}M`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {feesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Collected</span>
                <span className="font-semibold text-green-600">₦{(stats.feesCollected / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Outstanding</span>
                <span className="font-semibold text-amber-600">₦{(stats.outstandingFees / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Collection Rate</span>
                <span className="font-semibold">
                  {((stats.feesCollected / (stats.feesCollected + stats.outstandingFees)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Average attendance across all classes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
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
      </div>

      {/* Performance & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance (Average Scores)</CardTitle>
              <CardDescription>Current academic performance by class</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="avg" fill="#1e40af" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/exams')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Add Student
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/results')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upload Result
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/announcements')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Send Announcement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Alerts */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            System Alerts
          </CardTitle>
          <CardDescription>Important notifications and warnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {systemAlerts.length === 0 ? (
            <p className="text-sm text-gray-600">No alerts at this time</p>
          ) : (
            systemAlerts.map((alert) => (
              <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                <div className="flex items-start gap-3">
                  {alert.type === 'error' && <AlertTriangle className="w-4 h-4 mt-0.5" />}
                  {alert.type === 'warning' && <AlertCircle className="w-4 h-4 mt-0.5" />}
                  {alert.type === 'info' && <CheckCircle className="w-4 h-4 mt-0.5" />}
                  <div className="flex-1">
                    <AlertTitle className="mb-1">{alert.title}</AlertTitle>
                    <AlertDescription className="text-xs">{alert.description}</AlertDescription>
                    <p className="text-xs text-gray-500 mt-2">{alert.timestamp}</p>
                  </div>
                </div>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
          <CardDescription>New accounts created this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRegistrations.map((registration) => (
              <div key={registration.id} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{registration.name}</p>
                  <p className="text-xs text-gray-600">{registration.role}</p>
                </div>
                <p className="text-xs text-gray-500">{registration.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
