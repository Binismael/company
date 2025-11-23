'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft,
  AlertCircle,
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Plus,
  Clock,
  CheckCheck,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'
import { useRealtimeChat } from '@/hooks/use-realtime'

export default function MessagesPage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<any>(null)
  const [chatRooms, setChatRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)

  // Use realtime hook for messages
  const { messages, isSubscribed } = useRealtimeChat(selectedRoom?.id || '')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get user profile
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        setUser(userData)

        // Load chat rooms
        await loadChatRooms(authUser.id)

        // Load available users for messaging
        const { data: availableUsers } = await supabase
          .from('users')
          .select('id, full_name, role')
          .neq('id', authUser.id)

        setUsers(availableUsers || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const loadChatRooms = async (userId: string) => {
    try {
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          participant_1:users!participant_1_id(id, full_name, role),
          participant_2:users!participant_2_id(id, full_name, role)
        `)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      setChatRooms(rooms || [])
      
      if (rooms && rooms.length > 0) {
        setSelectedRoom(rooms[0])
      }
    } catch (err: any) {
      toast.error('Failed to load chat rooms')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageText.trim() || !selectedRoom) {
      return
    }

    try {
      const { error: sendError } = await supabase
        .from('chat_messages')
        .insert([
          {
            chat_room_id: selectedRoom.id,
            sender_id: user.id,
            content: messageText,
          },
        ])

      if (sendError) throw sendError

      setMessageText('')

      // Update room's updated_at
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedRoom.id)
    } catch (err: any) {
      toast.error('Failed to send message')
    }
  }

  const createNewChat = async (recipientId: string) => {
    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant1Id: user.id,
          participant2Id: recipientId,
        }),
      })

      if (!response.ok) throw new Error('Failed to create chat')

      const newRoom = await response.json()
      setChatRooms([newRoom, ...chatRooms])
      setSelectedRoom(newRoom)
      setShowNewChat(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create chat')
    }
  }

  const getOtherParticipant = (room: any) => {
    if (room.participant_1_id === user?.id) {
      return room.participant_2
    }
    return room.participant_1
  }

  const filteredRooms = chatRooms.filter((room) => {
    const other = getOtherParticipant(room)
    return other?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="text-sm text-gray-600">
                  {isSubscribed && <span className="text-green-600">Live updates</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="rounded-none border-0 border-b">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Chat List Sidebar */}
        <aside className="w-full sm:w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Search and New Chat */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>
            <Button
              onClick={() => setShowNewChat(!showNewChat)}
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              New Message
            </Button>
          </div>

          {/* New Chat Panel */}
          {showNewChat && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <p className="text-xs font-semibold text-gray-900 mb-3">Start conversation with</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => createNewChat(u.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white transition-colors"
                  >
                    <div className="font-medium text-gray-900 text-sm">{u.full_name}</div>
                    <div className="text-xs text-gray-500">{u.role}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => {
                  const other = getOtherParticipant(room)
                  const isActive = selectedRoom?.id === room.id

                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full text-left px-3 py-3 rounded-lg mb-1 transition-all ${
                        isActive
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {other?.full_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {other?.full_name}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {other?.role}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <p className="text-center py-8 text-gray-600 text-sm">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Chat Window */}
        <main className="hidden sm:flex sm:flex-1 flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getOtherParticipant(selectedRoom)?.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {getOtherParticipant(selectedRoom)?.full_name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {isSubscribed ? 'Active' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className="text-xs mt-1 opacity-70 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {msg.sender_id === user?.id && msg.is_read && (
                            <CheckCheck className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="bg-white border-t border-gray-200 px-6 py-4"
              >
                <div className="flex gap-3">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="rounded-lg"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="gap-2"
                    disabled={!messageText.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-gray-600">
              <div className="text-center">
                <p className="mb-2">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
