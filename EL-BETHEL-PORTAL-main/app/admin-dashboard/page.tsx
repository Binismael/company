'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import AdminPortalLayout from '@/components/admin-portal-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, BookOpen, DollarSign, AlertTriangle, TrendingUp, FileText, Calendar, CheckCircle, Clock, Plus } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { toast } from 'sonner'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  feesCollected: number
  feesOutstanding: number
  activeExams: number
  attendanceRate: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: Date
  status: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    feesCollected: 0,
    feesOutstanding: 0,
    activeExams: 0,
    attendanceRate: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Load statistics
        const [studentsData, teachersData, classesData, paymentsData] = await Promise.all([
          supabase.from('students').select('id'),
          supabase.from('teachers').select('id'),
          supabase.from('classes').select('id'),
          supabase.from('payments').select('amount_paid, amount_due'),
        ])

        const feesCollected = paymentsData.data?.reduce((sum, p: any) => sum + (p.amount_paid || 0), 0) || 0
        const feesOutstanding = paymentsData.data?.reduce((sum, p: any) => sum + (p.amount_due - p.amount_paid || 0), 0) || 0

        setStats({
          totalStudents: studentsData.data?.length || 0,
          totalTeachers: teachersData.data?.length || 0,
          totalClasses: classesData.data?.length || 0,
          feesCollected,
          feesOutstanding,
          activeExams: 2,
          attendanceRate: 87,
        })

        // Load recent activities
        const recentActivities: RecentActivity[] = [
          {
            id: '1',
            type: 'Registration',
            description: '5 new students registered',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'success',
          },
          {
            id: '2',
            type: 'Payment',
            description: '₦450,000 fees collected',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            status: 'success',
          },
          {
            id: '3',
            type: 'Exam',
            description: 'Mathematics CBT exam started',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            status: 'warning',
          },
          {
            id: '4',
            type: 'Attendance',
            description: '3 students with low attendance',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
            status: 'alert',
          },
        ]
        setRecentActivity(recentActivities)
      } catch (error: any) {
        toast.error(error.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router])

  const feeChartData = [
    { name: 'Jan', collected: 400000, outstanding: 150000 },
    { name: 'Feb', collected: 520000, outstanding: 120000 },
    { name: 'Mar', collected: 680000, outstanding: 100000 },
    { name: 'Apr', collected: 750000, outstanding: 80000 },
    { name: 'May', collected: 920000, outstanding: 50000 },
  ]

  const studentDistributionData = [
    { name: 'JS1', value: 120 },
    { name: 'JS2', value: 110 },
    { name: 'JS3', value: 105 },
    { name: 'SS1', value: 95 },
    { name: 'SS2', value: 90 },
    { name: 'SS3', value: 85 },
  ]

  const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']

  if (loading) {
    return (
      <AdminPortalLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </AdminPortalLayout>
    )
  }

  return (
    <AdminPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Overview of school operations and analytics</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/admin/users')} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
            <Button onClick={() => router.push('/admin/exams')} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Create Exam
            </Button>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">{stats.totalStudents}</div>
              <p className="text-xs text-gray-500 mt-1">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalTeachers}</div>
              <p className="text-xs text-gray-500 mt-1">Teaching staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Fees Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₦{(stats.feesCollected / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500 mt-1">This session</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Outstanding Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                ₦{(stats.feesOutstanding / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-500 mt-1">Pending collection</p>
            </CardContent>
          </Card>
        </div>

        {/* More Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalClasses}</div>
              <p className="text-xs text-gray-500 mt-1">Total classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.activeExams}</div>
              <p className="text-xs text-gray-500 mt-1">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">{stats.attendanceRate}%</div>
              <p className="text-xs text-gray-500 mt-1">School-wide</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <div className="space-y-3">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ₦{(stats.feesOutstanding / 1000000).toFixed(1)}M outstanding fees - 42 students have not paid
            </AlertDescription>
          </Alert>
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              3 students with attendance below 75% - Send warning notices
            </AlertDescription>
          </Alert>
        </div>

        {/* Charts */}
        <Tabs defaultValue="fees" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fees">Fee Collection</TabsTrigger>
            <TabsTrigger value="distribution">Student Distribution</TabsTrigger>
            <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee Collection Trend</CardTitle>
                <CardDescription>Monthly fees collected vs outstanding</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₦${(value / 1000).toFixed(0)}K`} />
                    <Legend />
                    <Bar dataKey="collected" fill="#10b981" name="Collected" />
                    <Bar dataKey="outstanding" fill="#ef4444" name="Outstanding" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Distribution by Class</CardTitle>
                <CardDescription>Total enrolled students per class</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={studentDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {studentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest events in the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                      activity.status === 'success' ? 'bg-green-600' :
                      activity.status === 'warning' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.type} • {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={() => router.push('/admin/users')} variant="outline" className="h-24 flex-col gap-2">
                <Users className="w-6 h-6" />
                <span className="text-xs">Manage Users</span>
              </Button>
              <Button onClick={() => router.push('/admin/exams')} variant="outline" className="h-24 flex-col gap-2">
                <FileText className="w-6 h-6" />
                <span className="text-xs">Create Exam</span>
              </Button>
              <Button onClick={() => router.push('/admin/results')} variant="outline" className="h-24 flex-col gap-2">
                <CheckCircle className="w-6 h-6" />
                <span className="text-xs">Release Results</span>
              </Button>
              <Button onClick={() => router.push('/admin/payments')} variant="outline" className="h-24 flex-col gap-2">
                <DollarSign className="w-6 h-6" />
                <span className="text-xs">Payment Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPortalLayout>
  )
}
