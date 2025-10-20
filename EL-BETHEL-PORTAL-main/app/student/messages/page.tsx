'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, MessageSquare, Megaphone, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  from_user: { full_name: string; role: string }
  subject: string
  body: string
  is_read: boolean
  created_at: string
}

interface Announcement {
  id: string
  title: string
  content: string
  sender: { full_name: string }
  created_at: string
  priority: string
}

export default function StudentMessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [newMessage, setNewMessage] = useState({ recipient: '', subject: '', body: '' })

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!studentData) {
          toast.error('Student profile not found')
          return
        }

        setStudentId(studentData.id)

        // Load messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            from_user:users(full_name, role)
          `)
          .eq('to_student_id', studentData.id)
          .order('created_at', { ascending: false })

        if (messagesError) throw messagesError
        setMessages(messagesData || [])

        // Load announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select(`
            *,
            sender:users(full_name)
          `)
          .eq('class_id', null)
          .order('created_at', { ascending: false })
          .limit(10)

        if (announcementsError) throw announcementsError
        setAnnouncements(announcementsData || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSendMessage = async () => {
    if (!newMessage.recipient || !newMessage.subject || !newMessage.body) {
      toast.error('Please fill in all fields')
      return
    }

    setSendingMessage(true)
    try {
      const { data: recipientData } = await supabase
        .from('users')
        .select('id')
        .eq('email', newMessage.recipient)
        .single()

      if (!recipientData) {
        toast.error('Recipient not found')
        return
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          from_user_id: (await supabase.auth.getUser()).data.user?.id,
          to_user_id: recipientData.id,
          subject: newMessage.subject,
          body: newMessage.body,
          is_read: false,
        })

      if (error) throw error

      toast.success('Message sent successfully')
      setNewMessage({ recipient: '', subject: '', body: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-gray-600 mt-2">Communicate with teachers and administrators</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="w-4 h-4" />
              Send Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to a teacher or administrator
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient (Email)</label>
                <Input
                  placeholder="teacher@school.com"
                  value={newMessage.recipient}
                  onChange={(e) => setNewMessage({ ...newMessage, recipient: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Message subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={5}
                  value={newMessage.body}
                  onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={sendingMessage}
                className="w-full"
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inbox" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Inbox ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="w-4 h-4" />
            Announcements ({announcements.length})
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <Card
                  key={message.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !message.is_read ? 'border-primary-600 bg-primary-50' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{message.subject}</CardTitle>
                          {!message.is_read && (
                            <Badge className="bg-primary-600">New</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          From: {message.from_user.full_name} ({message.from_user.role})
                        </CardDescription>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 line-clamp-2">{message.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No messages in your inbox</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((announcement) => {
                const isPriority = announcement.priority === 'high'
                return (
                  <Card
                    key={announcement.id}
                    className={`${isPriority ? 'border-red-200 bg-red-50' : ''}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{announcement.title}</CardTitle>
                            {isPriority && (
                              <Badge className="bg-red-600">Priority</Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">
                            From: {announcement.sender.full_name}
                          </CardDescription>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{announcement.content}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No announcements available</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
