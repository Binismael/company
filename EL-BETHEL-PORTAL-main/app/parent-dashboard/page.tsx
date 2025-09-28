"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  BookOpen,
  CreditCard,
  MessageCircle,
  Calendar,
  TrendingUp,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Award,
  Target,
  Bell,
  Download,
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { ModernDashboardLayout } from "@/components/modern-dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useEffect, useState } from "react"

function AnnouncementsWithComments({ email }: { email: string }) {
  const [list, setList] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [comments, setComments] = useState<any[]>([])

  const load = async () => { try{ const r=await fetch('/api/announcements'); const d=await r.json(); setList(d||[]); if(d?.[0]?.id){ setSelected(d[0].id) } } catch{} }
  useEffect(()=>{ load() },[])
  useEffect(()=>{ (async()=>{ if(!selected) return; try{ const r=await fetch(`/api/announcements/comments?announcement_id=${selected}`); const d=await r.json(); setComments(d||[]) } catch{} })() }, [selected])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1 border rounded p-2 max-h-80 overflow-auto">
        {list.map((a:any)=> (
          <button key={a.id} onClick={()=> setSelected(a.id)} className={`block w-full text-left px-3 py-2 rounded mb-1 ${selected===a.id? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
            <div className="font-medium">{a.title}</div>
            <div className="text-xs text-gray-500">{new Date(a.created_at).toLocaleString()}</div>
          </button>
        ))}
      </div>
      <div className="md:col-span-2 border rounded p-3">
        <div className="space-y-3 max-h-64 overflow-auto">
          {comments.map((c:any)=> (
            <div key={c.id} className="p-2 border rounded">
              <div className="text-sm">{c.body}</div>
              <div className="text-xs text-gray-500">{c.profiles?.full_name || 'User'} • {new Date(c.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input id="comment-input" className="px-3 py-2 border rounded md:col-span-3" placeholder="Write a comment" />
          <Button size="sm" onClick={async()=>{ const body=(document.getElementById('comment-input') as HTMLInputElement)?.value; if(!selected||!body) return; try{ const r=await fetch('/api/announcements/comments',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ announcement_id: selected, author_email: email, body })}); if(!r.ok) throw new Error('fail'); (document.getElementById('comment-input') as HTMLInputElement).value=''; const rr=await fetch(`/api/announcements/comments?announcement_id=${selected}`); const dd=await rr.json(); setComments(dd||[]); } catch{ alert('Failed') } }}>Post</Button>
        </div>
      </div>
    </div>
  )
}

export default function ParentDashboard() {
  const { user } = useAuth()

  const [childData, setChildData] = useState({
    name: "Child",
    class: "",
    regNo: "",
    currentTerm: "First Term 2024/2025",
    overallGrade: "A",
    gpa: 4.57,
    position: "3rd",
    attendance: 95,
    totalStudentsInClass: 27,
  })
  const [subjects, setSubjects] = useState<any[]>([])
  const [paymentStatus, setPaymentStatus] = useState<any>({ totalFees:0, paidAmount:0, balance:0, status:"Pending", dueDate:null, paymentHistory:[] })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/parent/overview?email=${encodeURIComponent(user?.email || "")}`)
        const data = await res.json()
        if (!res.ok) return
        setChildData((s)=>({ ...s, name: data.child?.full_name || s.name, class: data.classInfo?.name || s.class, regNo: s.regNo || "EBS/2024/001" }))
        setTeachers(data.teachers || [])
        setPaymentStatus(data.payment || paymentStatus)
      } catch {}
    }
    load()
  }, [user])

  const sendMessage = (teacher: string) => {
    toast.success(`Message sent to ${teacher}`)
  }

  const downloadReport = () => {
    toast.success("Academic report downloaded successfully!")
  }

  const scheduleMeeting = () => {
    toast.success("Meeting request sent to school administration")
  }

  return (
    <ProtectedRoute allowedRoles={["parent"]}>
      <ModernDashboardLayout
        title="Parent Portal"
        subtitle={`Monitoring ${childData.name}'s academic journey`}
        actions={
          <div className="flex space-x-3">
            <Button
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 transition-all duration-300 transform hover:scale-105"
              variant="outline"
              onClick={downloadReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
            <Button
              className="bg-white hover:bg-gray-100 text-blue-800 hover:text-blue-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={scheduleMeeting}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        }
      >
        {/* Child Overview */}
        <Card className="mb-8 bg-white/80 backdrop-blur-xl shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Child Overview</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                {childData.currentTerm}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <span className="text-white font-bold text-xl">OM</span>
                </div>
                <h3 className="font-medium text-gray-900">{childData.name}</h3>
                <p className="text-sm text-gray-600">
                  {childData.class} • {childData.regNo}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-green-600 mb-2">{childData.gpa}</div>
                <p className="text-sm text-gray-600">Current GPA</p>
                <Badge className="mt-1 bg-green-100 text-green-800">Grade: {childData.overallGrade}</Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-purple-600 mb-2">{childData.position}</div>
                <p className="text-sm text-gray-600">Class Position</p>
                <p className="text-xs text-purple-600">Out of {childData.totalStudentsInClass} students</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-orange-600 mb-2">{childData.attendance}%</div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <Badge className="mt-1 bg-orange-100 text-orange-800">Excellent</Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">6</div>
                <p className="text-sm text-gray-600">Subjects</p>
                <p className="text-xs text-blue-600">All performing well</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="academics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-xl shadow-lg">
            <TabsTrigger
              value="academics"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Academic Progress
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Communication
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Recent Activities
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              Announcements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="academics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Performance */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                    Subject Performance
                  </CardTitle>
                  <CardDescription>Current term academic performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjects.map((subject, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <BookOpen className="h-5 w-5 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-gray-900">{subject.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                className={
                                  subject.grade.startsWith("A")
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {subject.grade}
                              </Badge>
                              <span className="text-sm text-gray-600">{subject.score}%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Last: {subject.lastExam} ({subject.examDate})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp
                            className={`h-4 w-4 ${
                              subject.trend === "up"
                                ? "text-green-500"
                                : subject.trend === "down"
                                  ? "text-red-500"
                                  : "text-gray-500"
                            }`}
                          />
                          <div className="w-20">
                            <Progress value={subject.score} className="h-2" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Performance Summary */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-purple-600" />
                    AI Performance Summary
                  </CardTitle>
                  <CardDescription>Intelligent insights about your child's progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2 flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Strengths
                      </h4>
                      <p className="text-sm text-green-700">
                        Excellent performance in Mathematics and Biology. Shows strong analytical thinking and
                        consistent improvement.
                      </p>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Areas for Improvement
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Chemistry performance has declined slightly. Consider additional practice in organic chemistry
                        topics.
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <Bell className="h-4 w-4 mr-2" />
                        Recommendation
                      </h4>
                      <p className="text-sm text-blue-700">
                        Your child is performing exceptionally well overall. Encourage continued effort in weaker
                        subjects while maintaining strengths.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Status */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                    Payment Status
                  </CardTitle>
                  <CardDescription>Current term fee payment information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                        <div>
                          <h4 className="font-medium text-green-900">Payment Complete</h4>
                          <p className="text-sm text-green-700">All fees paid for current term</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Fees:</span>
                        <span className="font-medium">₦{paymentStatus.totalFees.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-medium text-green-600">₦{paymentStatus.paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Balance:</span>
                        <span className="font-medium">₦{paymentStatus.balance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium">{paymentStatus.dueDate}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      onClick={downloadReport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Payment History
                  </CardTitle>
                  <CardDescription>Previous payment records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentStatus.paymentHistory.map((payment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{payment.term}</p>
                          <p className="text-sm text-gray-600">{payment.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₦{payment.amount.toLocaleString()}</p>
                          <Badge className="bg-green-100 text-green-800">{payment.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Teachers */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                    Contact Teachers
                  </CardTitle>
                  <CardDescription>Communicate with your child's teachers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teachers.map((teacher, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{teacher.name}</h4>
                            <p className="text-sm text-gray-600">{teacher.subject}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105"
                            onClick={() => sendMessage(teacher.name)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* School Contact */}
              <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-green-600" />
                    School Contact
                  </CardTitle>
                  <CardDescription>Get in touch with the school administration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <Phone className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">+234 803 123 4567</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <Mail className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">info@elbethelschool.com</p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      onClick={scheduleMeeting}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-blue-50 text-blue-900 hover:text-blue-900 border-blue-300 hover:border-blue-400 transition-all duration-300"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Feedback
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-purple-600" />
                  Recent Activities
                </CardTitle>
                <CardDescription>Latest updates about your child's school activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-300"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          activity.type === "exam"
                            ? "bg-blue-500"
                            : activity.type === "assignment"
                              ? "bg-green-500"
                              : activity.type === "attendance"
                                ? "bg-purple-500"
                                : activity.type === "payment"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{activity.description}</h4>
                        <p className="text-sm text-gray-600">{activity.date}</p>
                      </div>
                      <div className="text-right">
                        {activity.score && <p className="text-sm font-medium text-blue-600">{activity.score}</p>}
                        {activity.grade && <p className="text-sm font-medium text-green-600">{activity.grade}</p>}
                        <Badge
                          variant="outline"
                          className={
                            activity.status === "excellent" ||
                            activity.status === "approved" ||
                            activity.status === "perfect"
                              ? "border-green-300 text-green-700 bg-green-50"
                              : activity.status === "on-time"
                                ? "border-blue-300 text-blue-700 bg-blue-50"
                                : "border-gray-300 text-gray-700 bg-gray-50"
                          }
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-purple-600" />
                  Announcements & Comments
                </CardTitle>
                <CardDescription>Read and comment on school announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <AnnouncementsWithComments email={user?.email||''} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ModernDashboardLayout>
    </ProtectedRoute>
  )
}
