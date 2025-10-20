'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Eye, Reply, Trash2, Download, RotateCw, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface SupportTicket {
  id: string
  title: string
  description: string
  userEmail: string
  status: 'open' | 'in_progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  createdDate: string
  updatedDate: string
  category: string
}

interface SystemLog {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  user?: string
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TKT-001',
      title: 'Unable to login to teacher account',
      description: 'I cannot access my teacher account. Getting incorrect password error.',
      userEmail: 'teacher@elbethel.edu',
      status: 'in_progress',
      priority: 'high',
      createdDate: '2024-01-19',
      updatedDate: '2024-01-20',
      category: 'Account Access',
    },
    {
      id: 'TKT-002',
      title: 'Exam question upload failed',
      description: 'The system rejected my exam questions file saying format is invalid.',
      userEmail: 'admin@elbethel.edu',
      status: 'open',
      priority: 'medium',
      createdDate: '2024-01-20',
      updatedDate: '2024-01-20',
      category: 'Technical Issue',
    },
    {
      id: 'TKT-003',
      title: 'Result calculation error',
      description: 'Students scores are not being calculated correctly in the system.',
      userEmail: 'bursar@elbethel.edu',
      status: 'resolved',
      priority: 'high',
      createdDate: '2024-01-15',
      updatedDate: '2024-01-18',
      category: 'Data Issue',
    },
    {
      id: 'TKT-004',
      title: 'Payment notification not sent',
      description: 'Student completed payment but didnt receive confirmation email.',
      userEmail: 'student@elbethel.edu',
      status: 'open',
      priority: 'medium',
      createdDate: '2024-01-18',
      updatedDate: '2024-01-20',
      category: 'Notification',
    },
  ])

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([
    {
      id: '1',
      timestamp: '2024-01-20 14:30:45',
      level: 'info',
      message: 'Database backup completed successfully',
      user: 'system',
    },
    {
      id: '2',
      timestamp: '2024-01-20 13:45:20',
      level: 'warning',
      message: 'High memory usage detected - 85% utilized',
      user: 'system',
    },
    {
      id: '3',
      timestamp: '2024-01-20 11:20:10',
      level: 'info',
      message: 'Admin user logged in',
      user: 'admin@elbethel.edu',
    },
    {
      id: '4',
      timestamp: '2024-01-20 10:15:30',
      level: 'error',
      message: 'Failed to process payment from student account EBS/2024/045',
      user: 'system',
    },
    {
      id: '5',
      timestamp: '2024-01-20 09:00:15',
      level: 'info',
      message: 'Exam TKT-2024-05 created by Mrs. Adeyemi',
      user: 'teacher@elbethel.edu',
    },
  ])

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [newTicket, setNewTicket] = useState({ title: '', description: '', category: '' })

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority
    return matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-red-100 text-red-800">Open</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const handleCreateTicket = () => {
    if (!newTicket.title || !newTicket.description) {
      toast.error('Please fill in all required fields')
      return
    }

    const ticket: SupportTicket = {
      id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
      title: newTicket.title,
      description: newTicket.description,
      userEmail: 'admin@elbethel.edu',
      status: 'open',
      priority: 'medium',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      category: newTicket.category,
    }

    setTickets([ticket, ...tickets])
    setNewTicket({ title: '', description: '', category: '' })
    toast.success('Support ticket created')
  }

  const handleRunDatabaseBackup = () => {
    toast.loading('Running backup...')
    setTimeout(() => {
      toast.success('Database backup completed successfully')
      setSystemLogs([
        {
          id: String(systemLogs.length + 1),
          timestamp: new Date().toLocaleString(),
          level: 'info',
          message: 'Database backup completed successfully',
          user: 'admin',
        },
        ...systemLogs,
      ])
    }, 2000)
  }

  const handleClearLogs = () => {
    setSystemLogs([])
    toast.success('System logs cleared')
  }

  const handleDeleteTicket = (id: string) => {
    setTickets(tickets.filter((t) => t.id !== id))
    toast.success('Ticket deleted')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support & Maintenance</h1>
          <p className="text-gray-600 mt-2">Manage support tickets and system tools</p>
        </div>
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="system">System Logs</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Manage user support requests and issues</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                    <DialogDescription>Report a system issue or problem</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Title *</label>
                      <Input
                        placeholder="Issue title"
                        value={newTicket.title}
                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Input
                        placeholder="Category"
                        value={newTicket.category}
                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description *</label>
                      <Textarea
                        placeholder="Detailed description"
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                        className="mt-2"
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleCreateTicket} className="w-full">
                      Create Ticket
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.id}</TableCell>
                          <TableCell>{ticket.title}</TableCell>
                          <TableCell className="text-sm">{ticket.userEmail}</TableCell>
                          <TableCell>{ticket.category}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{ticket.createdDate}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Reply className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:text-red-600"
                                onClick={() => handleDeleteTicket(ticket.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>View system activity and error logs</CardDescription>
              </div>
              <Button
                onClick={handleClearLogs}
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Clear Logs
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-1">{getLogLevelIcon(log.level)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{log.message}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {log.timestamp} {log.user && `• ${log.user}`}
                      </p>
                    </div>
                    <Badge
                      className={
                        log.level === 'error'
                          ? 'bg-red-100 text-red-800'
                          : log.level === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {log.level.charAt(0).toUpperCase() + log.level.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>Backup and restore operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <div>
                  <AlertDescription className="mt-2">
                    Last backup: 2024-01-20 at 02:00 AM
                  </AlertDescription>
                </div>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleRunDatabaseBackup}
                  className="gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  Run Backup Now
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Latest Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Monitor system performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">Database Size</p>
                  <p className="text-2xl font-bold mt-2">1.2 GB</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold mt-2">12</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">System Uptime</p>
                  <p className="text-2xl font-bold mt-2">99.8%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
