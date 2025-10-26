'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Mail, Bell, Megaphone, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface Announcement {
  id: string
  title: string
  content: string
  sender?: string
  created_at: string
  type: 'announcement' | 'message' | 'notification'
  is_read?: boolean
  priority?: 'high' | 'normal' | 'low'
}

export default function StudentMessagesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<Announcement[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUserId(user.id)
      } catch (err: any) {
        setError(err.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  useEffect(() => {
    if (!userId) return

    const fetchMessages = async () => {
      try {
        setMessagesLoading(true)
        setError('')

        const { data, error: err } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (err) throw err
        setMessages(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch messages')
      } finally {
        setMessagesLoading(false)
      }
    }

    fetchMessages()
  }, [userId])

  const announcements = messages.filter((m: any) => m.type === 'announcement' || m.type !== 'message')
  const directMessages = messages.filter((m: any) => m.type === 'message')
  const unreadCount = messages.filter((m: any) => !m.is_read).length

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-600 bg-red-50'
      case 'normal':
        return 'border-l-blue-600 bg-blue-50'
      case 'low':
        return 'border-l-gray-600 bg-gray-50'
      default:
        return 'border-l-gray-400 bg-white'
    }
  }

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages & Announcements</h1>
              <p className="text-gray-600 mt-2">Stay updated with school announcements and messages</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Bell className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 ml-2">
              You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 bg-white border border-gray-200">
            <TabsTrigger value="all">
              All Messages
              {messages.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{messages.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="announcements">
              Announcements
              {announcements.length > 0 && (
                <Badge className="ml-2 bg-green-600">{announcements.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">
              Direct Messages
              {directMessages.length > 0 && (
                <Badge className="ml-2 bg-purple-600">{directMessages.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* All Messages */}
          <TabsContent value="all" className="space-y-4">
            {messagesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((message: any) => (
                <Card
                  key={message.id}
                  className={`border-l-4 hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(
                    message.priority
                  )}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{message.title}</CardTitle>
                          {message.priority && (
                            <Badge className={getPriorityBadge(message.priority)}>
                              {message.priority.toUpperCase()}
                            </Badge>
                          )}
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <CardDescription>
                          {message.sender || 'School Administration'} • {formatDate(message.created_at)}
                        </CardDescription>
                      </div>
                      <div className="flex-shrink-0">
                        {message.type === 'announcement' ? (
                          <Megaphone className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Mail className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 line-clamp-3">{message.content}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No messages</p>
                  <p className="text-gray-500 mt-1">Check back later for announcements and messages</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Announcements */}
          <TabsContent value="announcements" className="space-y-4">
            {messagesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : announcements.length > 0 ? (
              announcements.map((message: any) => (
                <Card
                  key={message.id}
                  className={`border-l-4 hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(
                    message.priority
                  )}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{message.title}</CardTitle>
                          {message.priority && (
                            <Badge className={getPriorityBadge(message.priority)}>
                              {message.priority.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {formatDate(message.created_at)}
                        </CardDescription>
                      </div>
                      <Megaphone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{message.content}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No announcements</p>
                  <p className="text-gray-500 mt-1">School announcements will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Direct Messages */}
          <TabsContent value="messages" className="space-y-4">
            {messagesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : directMessages.length > 0 ? (
              directMessages.map((message: any) => (
                <Card
                  key={message.id}
                  className="border-l-4 border-l-green-600 hover:shadow-md transition-shadow cursor-pointer bg-green-50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{message.title}</CardTitle>
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-green-600 rounded-full" />
                          )}
                        </div>
                        <CardDescription>
                          From: {message.sender || 'Staff'} • {formatDate(message.created_at)}
                        </CardDescription>
                      </div>
                      <Mail className="h-5 w-5 text-green-600 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{message.content}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No direct messages</p>
                  <p className="text-gray-500 mt-1">Direct messages from teachers and staff will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Communication Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Check announcements regularly for important school updates</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Monitor direct messages for personalized feedback from teachers</span>
              </li>
              <li className="flex items-start gap-2">
                <Send className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>High-priority messages require immediate attention</span>
              </li>
              <li className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Ensure you have enabled notifications in your browser settings</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
