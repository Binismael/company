'use client'

import { useState, useCallback, useMemo } from 'react'
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
  Eye,
  Download,
  RefreshCw,
  Zap,
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

  const [previousStats] = useState({
    totalStudents: 238,
    feesCollected: 8200000,
    attendanceRate: 89.2,
  })

  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('week')

  const [recentRegistrations] = useState<RecentRegistration[]>([
    { id: '1', name: 'Chisom Okafor', role: 'Student', date: '2024-01-20' },
    { id: '2', name: 'Blessing Adeyemi', role: 'Teacher', date: '2024-01-19' },
    { id: '3', name: 'Grace Uzoh', role: 'Student', date: '2024-01-18' },
    { id: '4', name: 'David Okoro', role: 'Student', date: '2024-01-17' },
    { id: '5', name: 'Ngozi Nwosu', role: 'Parent', date: '2024-01-16' },
  ])

  const [systemAlerts] = useState<SystemAlert[]>([
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
    { name: 'Mon', attendance: 89, target: 95 },
    { name: 'Tue', attendance: 91, target: 95 },
    { name: 'Wed', attendance: 88, target: 95 },
    { name: 'Thu', attendance: 94, target: 95 },
    { name: 'Fri', attendance: 87, target: 95 },
  ]

  const feesData = [
    { name: 'Collected', value: stats.feesCollected, fill: '#10b981' },
    { name: 'Outstanding', value: stats.outstandingFees, fill: '#f59e0b' },
  ]

  const classPerformanceData = [
    { name: 'SS1A', avg: 78, target: 80 },
    { name: 'SS1B', avg: 82, target: 80 },
    { name: 'SS2A', avg: 81, target: 80 },
    { name: 'SS2B', avg: 79, target: 80 },
    { name: 'SS3A', avg: 88, target: 80 },
    { name: 'SS3B', avg: 86, target: 80 },
  ]

  const revenueData = [
    { month: 'Jan', revenue: 7200000, fees: 6500000 },
    { month: 'Feb', revenue: 8100000, fees: 7800000 },
    { month: 'Mar', revenue: 7900000, fees: 7200000 },
    { month: 'Apr', revenue: 8500000, fees: 8200000 },
    { month: 'May', revenue: 9200000, fees: 8500000 },
    { month: 'Jun', revenue: 8900000, fees: 8600000 },
  ]

  const enrollmentData = [
    { quarter: 'Q1', students: 210, teachers: 20 },
    { quarter: 'Q2', students: 225, teachers: 22 },
    { quarter: 'Q3', students: 235, teachers: 23 },
    { quarter: 'Q4', students: 245, teachers: 24 },
  ]

  const statChanges = useMemo(() => ({
    studentChange: ((stats.totalStudents - previousStats.totalStudents) / previousStats.totalStudents * 100).toFixed(1),
    feeChange: ((stats.feesCollected - previousStats.feesCollected) / previousStats.feesCollected * 100).toFixed(1),
    attendanceChange: (stats.attendanceRate - previousStats.attendanceRate).toFixed(1),
  }), [stats, previousStats])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }, [])

  const StatCard = ({ icon: Icon, label, value, unit, color, trend, trendValue }: any) => (
    <Card className="hover:shadow-md transition-all hover:border-primary-200 border-transparent">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>
              {typeof value === 'number' && value > 1000000
                ? `₦${(value / 1000000).toFixed(1)}M`
                : typeof value === 'number' && value > 100
                  ? `${value}%`
                  : value}
            </p>
            {unit && <p className="text-xs text-gray-500 mt-1">{unit}</p>}
            {trendValue && (
              <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(parseFloat(trendValue))}% vs last period
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${
            color.includes('blue') ? 'from-blue-100 to-blue-50' :
            color.includes('green') ? 'from-green-100 to-green-50' :
            color.includes('purple') ? 'from-purple-100 to-purple-50' :
            'from-orange-100 to-orange-50'
          }`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8 pb-8">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your school.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['today', 'week', 'month', 'year'].map((range) => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeRange(range)}
            className="capitalize"
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Quick Stats with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats.totalStudents}
          unit="Enrolled"
          color="text-blue-600"
          trend="up"
          trendValue={statChanges.studentChange}
        />
        <StatCard
          icon={BookOpen}
          label="Total Teachers"
          value={stats.totalTeachers}
          unit="Teaching"
          color="text-green-600"
        />
        <StatCard
          icon={BookOpen}
          label="Total Classes"
          value={stats.totalClasses}
          unit="Active"
          color="text-purple-600"
        />
        <StatCard
          icon={FileText}
          label="Active Exams"
          value={stats.activeExams}
          unit="In Progress"
          color="text-orange-600"
        />
      </div>

      {/* KPI Cards with Goals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Target: 95% • {statChanges.attendanceChange}% vs last period</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fee Collection</p>
                <p className="text-2xl font-bold text-orange-600">
                  {((stats.feesCollected / (stats.feesCollected + stats.outstandingFees)) * 100).toFixed(0)}%
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{
                  width: `${((stats.feesCollected / (stats.feesCollected + stats.outstandingFees)) * 100).toFixed(0)}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Outstanding: ₦{(stats.outstandingFees / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">System Health</p>
                <p className="text-2xl font-bold text-blue-600">98%</p>
              </div>
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '98%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
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
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 5 }}
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#d1d5db"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

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
                      <Legend />
                      <Bar dataKey="avg" fill="#1e40af" radius={[8, 8, 0, 0]} name="Current" />
                      <Bar dataKey="target" fill="#d1d5db" radius={[8, 8, 0, 0]} name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-primary-50"
                  onClick={() => router.push('/admin/exams')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create Exam
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-primary-50"
                  onClick={() => router.push('/admin/users')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-primary-50"
                  onClick={() => router.push('/admin/results')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upload Result
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-primary-50"
                  onClick={() => router.push('/admin/announcements')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Send Announcement
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue and fee collection</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    fill="#1e40af"
                    stroke="#1e40af"
                    name="Total Revenue"
                    opacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="fees"
                    fill="#10b981"
                    stroke="#10b981"
                    name="Fee Collection"
                    opacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollment Growth</CardTitle>
              <CardDescription>Students and teachers growth over quarters</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#1e40af" yAxisId="left" name="Students" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="teachers" fill="#f59e0b" yAxisId="right" name="Teachers" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key metrics comparison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Academic Performance</span>
                    <span className="text-sm font-bold text-blue-600">82%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Student Engagement</span>
                    <span className="text-sm font-bold text-green-600">76%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '76%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Financial Health</span>
                    <span className="text-sm font-bold text-orange-600">79%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: '79%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Infrastructure</span>
                    <span className="text-sm font-bold text-purple-600">95%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Based on performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Boost Student Engagement</p>
                  <p className="text-xs text-blue-700 mt-1">Consider introducing interactive learning modules</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-900">Follow-up on Outstanding Fees</p>
                  <p className="text-xs text-orange-700 mt-1">5 students have overdue payments</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-900">Excellent Infrastructure</p>
                  <p className="text-xs text-green-700 mt-1">System health is at 98% - great work!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
              <div key={registration.id} className="flex items-center justify-between pb-3 border-b last:border-b-0 hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
                <div>
                  <p className="font-medium text-sm">{registration.name}</p>
                  <p className="text-xs text-gray-600">{registration.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{registration.role}</Badge>
                  <p className="text-xs text-gray-500">{registration.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
