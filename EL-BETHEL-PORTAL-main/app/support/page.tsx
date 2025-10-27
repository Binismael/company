'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

interface SupportTicket {
  id: string
  user_id: string
  user_name: string
  category: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: string
  assigned_to?: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
}

export default function SupportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([])
  const [allTickets, setAllTickets] = useState<SupportTicket[]>([])

  const [formData, setFormData] = useState({
    category: 'technical',
    subject: '',
    message: '',
  })

  useEffect(() => {
    checkAuthorization()
  }, [])

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_id', user.id)
        .single()

      setUserId(userData?.id)
      setUserRole(userData?.role)
      loadData(userData?.id, userData?.role)
    } catch (error) {
      console.error('Authorization error:', error)
      toast.error('Failed to verify access')
    }
  }

  const loadData = async (userId: string, userRole: string) => {
    try {
      setLoading(true)

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select(`
          id,
          user_id,
          category,
          subject,
          message,
          status,
          priority,
          assigned_to,
          created_at,
          updated_at,
          users(full_name),
          assigned_users:assigned_to(full_name)
        `)
        .order('created_at', { ascending: false })

      if (ticketsError) throw ticketsError

      const mapped = (ticketsData || []).map((ticket: any) => ({
        id: ticket.id,
        user_id: ticket.user_id,
        user_name: ticket.users?.full_name || 'Unknown',
        category: ticket.category,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        assigned_to: ticket.assigned_to,
        assigned_to_name: ticket.assigned_users?.full_name,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
      }))

      if (userRole === 'admin') {
        setAllTickets(mapped)
        const { data: adminsData } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('role', 'admin')
        setAdmins(adminsData || [])
      } else {
        setMyTickets(mapped.filter(t => t.user_id === userId))
      }
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitTicket = async () => {
    if (!formData.subject || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      if (!userId) {
        toast.error('User not found')
        return
      }

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          status: 'open',
          priority: 'normal',
        })

      if (error) throw error

      toast.success('Support ticket created successfully')
      setFormData({ category: 'technical', subject: '', message: '' })
      loadData(userId, userRole || 'student')
    } catch (error: any) {
      console.error('Error creating ticket:', error)
      toast.error(error.message || 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId)

      if (error) throw error

      toast.success('Status updated successfully')
      if (userId && userRole) {
        loadData(userId, userRole)
      }
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleAssignTicket = async (ticketId: string, adminId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: adminId, updated_at: new Date().toISOString() })
        .eq('id', ticketId)

      if (error) throw error

      toast.success('Ticket assigned successfully')
      if (userId && userRole) {
        loadData(userId, userRole)
      }
    } catch (error: any) {
      console.error('Error assigning ticket:', error)
      toast.error('Failed to assign ticket')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    }
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    }
    return <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      {priority.toUpperCase()}
    </Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-1">Create and track support tickets</p>
        </div>

        {userRole === 'admin' ? (
          /* Admin View */
          <Tabs defaultValue="all-tickets" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all-tickets">All Tickets ({allTickets.length})</TabsTrigger>
              <TabsTrigger value="open">Open ({allTickets.filter(t => t.status === 'open').length})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({allTickets.filter(t => t.status === 'in_progress').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all-tickets">
              <Card className="rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle>All Support Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTickets.map(ticket => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.subject}</TableCell>
                            <TableCell>{ticket.user_name}</TableCell>
                            <TableCell className="capitalize">{ticket.category}</TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>
                              <Select value={ticket.assigned_to || ''} onValueChange={(val) => handleAssignTicket(ticket.id, val)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Assign..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Unassigned</SelectItem>
                                  {admins.map(admin => (
                                    <SelectItem key={admin.id} value={admin.id}>{admin.full_name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select value={ticket.status} onValueChange={(val) => handleStatusChange(ticket.id, val)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
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

            <TabsContent value="open">
              <Card className="rounded-2xl shadow-lg border-0">
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTickets.filter(t => t.status === 'open').map(ticket => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.subject}</TableCell>
                            <TableCell>{ticket.user_name}</TableCell>
                            <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button
                                onClick={() => handleStatusChange(ticket.id, 'in_progress')}
                                size="sm"
                                variant="outline"
                              >
                                Start
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="in-progress">
              <Card className="rounded-2xl shadow-lg border-0">
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTickets.filter(t => t.status === 'in_progress').map(ticket => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.subject}</TableCell>
                            <TableCell>{ticket.user_name}</TableCell>
                            <TableCell>{ticket.assigned_to_name || 'Unassigned'}</TableCell>
                            <TableCell>
                              <Button
                                onClick={() => handleStatusChange(ticket.id, 'resolved')}
                                size="sm"
                                variant="outline"
                              >
                                Resolve
                              </Button>
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
        ) : (
          /* User View */
          <>
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle>Create New Ticket</CardTitle>
                <CardDescription>Let us know how we can help</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category *</label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                    <SelectTrigger className="rounded-lg border border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="payment">Payment Issue</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subject *</label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="rounded-lg border border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Message *</label>
                  <Textarea
                    placeholder="Detailed description of your issue"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="rounded-lg border border-gray-300"
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleSubmitTicket}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {myTickets.length > 0 && (
              <Card className="rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle>My Support Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myTickets.map(ticket => (
                      <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                            <p className="text-sm text-gray-600 mt-1">{ticket.message.substring(0, 100)}...</p>
                            <div className="flex gap-2 mt-3">
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
