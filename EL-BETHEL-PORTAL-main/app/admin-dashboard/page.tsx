"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Users,
  GraduationCap,
  DollarSign,
  BookOpen,
  AlertTriangle,
  BarChart3,
  Settings,
  UserPlus,
  FileText,
  Bell,
  TrendingUp,
  Shield,
  Calendar,
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { ModernDashboardLayout } from "@/components/modern-dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState("current-term")
  const [newTeacherCode, setNewTeacherCode] = useState("")
  const [users, setUsers] = useState<any[]>([])

  const loadUsers = async () => {
    try { const res = await fetch('/api/users'); const d = await res.json(); if(Array.isArray(d)) setUsers(d) } catch {}
  }

  useEffect(()=>{ loadUsers() }, [])

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activeExams: 0,
    systemAlerts: 0,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/overview")
        const data = await res.json()
        if (!res.ok) return
        setStats(data.stats)
      } catch {}
    }
    load()
  }, [])

  const [recentActivities, setRecentActivities] = useState<Array<{type:string;description:string;time:string;status:string}>>([])

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements")
        const items = await res.json()
        const mapped = items.map((a: any) => ({
          type: "announcement",
          description: a.title,
          time: new Date(a.created_at).toLocaleString(),
          status: "info",
        }))
        setRecentActivities(mapped)
      } catch (e) {
        // ignore
      }
    }
    fetchAnnouncements()
  }, [])

  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/payments")
        const items = await res.json()
        const pend = (items || []).filter((p:any)=> p.status === 'pending').slice(0,5).map((p:any)=> ({ type: 'payment', name: p.student?.full_name || 'Pending Payment', amount: `₦${Number(p.amount).toLocaleString()}`, status: 'pending' }))
        setPendingApprovals(pend)
      } catch {}
    }
    load()
  }, [])

  const generateTeacherCode = () => {
    const code = "TCH" + Math.random().toString(36).substr(2, 6).toUpperCase()
    setNewTeacherCode(code)
    toast.success("Teacher code generated successfully!")
  }

  const copyTeacherCode = () => {
    navigator.clipboard.writeText(newTeacherCode)
    toast.success("Teacher code copied to clipboard!")
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ModernDashboardLayout
        title="Admin Dashboard"
        subtitle="Complete school management and oversight"
        actions={
          <div className="flex space-x-3">
            <Button
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 transition-all duration-300 transform hover:scale-105"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button className="bg-white hover:bg-gray-100 text-blue-800 hover:text-blue-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        }
      >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold">{stats.totalStudents.toLocaleString()}</p>
                    <p className="text-blue-100 text-xs mt-1">+12% from last term</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Teachers</p>
                    <p className="text-3xl font-bold">{stats.totalTeachers}</p>
                    <p className="text-green-100 text-xs mt-1">+3 new this month</p>
                  </div>
                  <GraduationCap className="h-12 w-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Revenue (₦)</p>
                    <p className="text-3xl font-bold">{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
                    <p className="text-yellow-100 text-xs mt-1">+8% this term</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Pending Items</p>
                    <p className="text-3xl font-bold">{stats.pendingPayments}</p>
                    <p className="text-red-100 text-xs mt-1">Requires attention</p>
                  </div>
                  <AlertTriangle className="h-12 w-12 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-xl shadow-lg">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              User Management
            </TabsTrigger>
            <TabsTrigger
              value="academics"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Academics
            </TabsTrigger>
            <TabsTrigger
              value="finances"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Finances
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-blue-600" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${
                            activity.status === "success"
                              ? "bg-green-500"
                              : activity.status === "warning"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Approvals */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-yellow-600" />
                    Pending Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingApprovals.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.subject || item.amount || item.department}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300 transform hover:scale-105"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-300 bg-transparent"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="h-24 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl" onClick={()=> window.location.assign('/manage-students')}>
                    <Users className="h-8 w-8" />
                    <span className="text-sm font-medium">Manage Students</span>
                  </Button>
                  <Button className="h-24 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl" onClick={()=> window.location.assign('/manage-teachers')}>
                    <GraduationCap className="h-8 w-8" />
                    <span className="text-sm font-medium">Manage Teachers</span>
                  </Button>
                  <Button className="h-24 flex flex-col items-center justify-center space-y-2 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl" onClick={()=> window.location.assign('/timetable')}>
                    <BookOpen className="h-8 w-8" />
                    <span className="text-sm font-medium">Timetable</span>
                  </Button>
                  <Button className="h-24 flex flex-col items-center justify-center space-y-2 bg-yellow-600 hover:bg-yellow-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl" onClick={()=> window.location.assign('/reports')}>
                    <BarChart3 className="h-8 w-8" />
                    <span className="text-sm font-medium">View Reports</span>
                  </Button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">New Announcement</h4>
                    <Input id="ann-title" placeholder="Title" className="mb-2" />
                    <Textarea id="ann-body" placeholder="Write announcement..." className="mb-2" />
                    <Button size="sm" onClick={async()=>{ try{ const title=(document.getElementById('ann-title') as HTMLInputElement)?.value; const body=(document.getElementById('ann-body') as HTMLTextAreaElement)?.value; const res = await fetch('/api/announcements',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, body })}); if(!res.ok) throw new Error('fail'); toast.success('Announcement posted'); } catch { toast.error('Failed to post') } }}>Post</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Add Class & Subject</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input id="new-class" placeholder="Class name (e.g., SS2)" />
                      <Button size="sm" onClick={async()=>{ const name=(document.getElementById('new-class') as HTMLInputElement)?.value; if(!name) return; const res=await fetch('/api/classes',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name })}); if(!res.ok) return toast.error('Failed'); toast.success('Class added') }}>Add Class</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <Input id="sub-class" placeholder="Class name" />
                      <Input id="sub-name" placeholder="Subject name" />
                      <Button size="sm" onClick={async()=>{ const cname=(document.getElementById('sub-class') as HTMLInputElement)?.value; const sname=(document.getElementById('sub-name') as HTMLInputElement)?.value; if(!cname||!sname) return; const cid = await (async()=>{ const r=await fetch('/api/classes'); const arr=await r.json(); return (arr.find((x:any)=> x.name===cname)?.id)||null })(); if(!cid) return toast.error('Class not found'); const res=await fetch('/api/subjects',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ class_id: cid, name: sname })}); if(!res.ok) return toast.error('Failed'); toast.success('Subject added') }}>Add Subject</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Generate Teacher Code */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle>Generate Teacher Code</CardTitle>
                  <CardDescription>Create access codes for new teachers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={generateTeacherCode} className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">Generate New Teacher Code</Button>
                  {newTeacherCode && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-blue-800">Teacher Code</Label>
                          <p className="text-lg font-mono font-bold text-blue-900">{newTeacherCode}</p>
                        </div>
                        <Button size="sm" onClick={copyTeacherCode} className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105">Copy</Button>
                      </div>
                    </div>
                  )}

                  {/* Users table */}
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Users</h4>
                      <Button size="sm" variant="outline" onClick={async ()=>{ await loadUsers(); }}>Refresh</Button>
                    </div>
                    <div className="overflow-x-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2">Role</th>
                            <th className="px-3 py-2">Approved</th>
                            <th className="px-3 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u:any)=> (
                            <tr key={u.id} className="border-t">
                              <td className="px-3 py-2">{u.full_name || '-'}</td>
                              <td className="px-3 py-2">{u.email}</td>
                              <td className="px-3 py-2">
                                <select className="border rounded px-2 py-1" value={u.role} onChange={(e)=> setUsers((arr:any[])=> arr.map(x=> x.id===u.id? { ...x, role: e.target.value } : x))}>
                                  {['admin','teacher','student','parent','bursar'].map(r=> <option key={r} value={r}>{r}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={!!u.is_approved} onChange={(e)=> setUsers((arr:any[])=> arr.map(x=> x.id===u.id? { ...x, is_approved: e.target.checked } : x))} />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Button size="sm" onClick={async()=>{ try{ const res = await fetch(`/api/users/${u.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role: u.role, is_approved: !!u.is_approved })}); if(!res.ok) throw new Error('fail'); toast.success('Updated'); } catch { toast.error('Update failed') } }}>Save</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Statistics */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Students</span>
                      <span className="font-bold text-blue-600">1,247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Teachers</span>
                      <span className="font-bold text-green-600">87</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Approvals</span>
                      <span className="font-bold text-yellow-600">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Parent Accounts</span>
                      <span className="font-bold text-purple-600">892</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academics" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
              <CardHeader>
                <CardTitle>Academic Management</CardTitle>
                <CardDescription>Manage classes, subjects, and academic calendar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button className="h-32 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <BookOpen className="h-12 w-12" />
                    <span className="font-medium">Manage Classes</span>
                  </Button>
                  <Button className="h-32 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <Calendar className="h-12 w-12" />
                    <span className="font-medium">Academic Calendar</span>
                  </Button>
                  <Button className="h-32 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <TrendingUp className="h-12 w-12" />
                    <span className="font-medium">Performance Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finances" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Monitor school finances and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Financial Management</h3>
                  <p className="text-gray-600 mb-6">Comprehensive financial tracking and reporting</p>
                  <Button className="bg-yellow-600 hover:bg-yellow-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Access Financial Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure school settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">System Configuration</h3>
                  <p className="text-gray-600 mb-6">Manage system settings and configurations</p>
                  <Button className="bg-gray-600 hover:bg-gray-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Open Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ModernDashboardLayout>
    </ProtectedRoute>
  )
}
