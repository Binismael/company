'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Plus, Send, Megaphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
  priority: string
  target_audience: string
}

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    targetAudience: 'all',
    priority: 'normal',
  })

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setAnnouncements(data || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load announcements')
      } finally {
        setLoading(false)
      }
    }

    loadAnnouncements()
  }, [])

  const handleSendAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const { error } = await supabase.from('announcements').insert({
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        target_audience: newAnnouncement.targetAudience,
        priority: newAnnouncement.priority,
      })

      if (error) throw error

      toast.success('Announcement sent to ' + newAnnouncement.targetAudience)
      setShowDialog(false)
      setNewAnnouncement({ title: '', content: '', targetAudience: 'all', priority: 'normal' })

      const { data: updatedAnnouncements } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
      setAnnouncements(updatedAnnouncements || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to send announcement')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error

      setAnnouncements(announcements.filter(a => a.id !== id))
      toast.success('Announcement deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-gray-600 mt-2">Send messages to students, teachers, and parents</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="w-4 h-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>Send a message to your school community</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your announcement..."
                  rows={5}
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Send To</label>
                  <select
                    value={newAnnouncement.targetAudience}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="teachers">Teachers Only</option>
                    <option value="parents">Parents Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleSendAnnouncement} className="w-full gap-2">
                <Megaphone className="w-4 h-4" />
                Send Announcement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {announcement.title}
                    {announcement.priority === 'high' && (
                      <Badge className="bg-red-600">High</Badge>
                    )}
                    {announcement.priority === 'urgent' && (
                      <Badge className="bg-red-900">Urgent</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    To: {announcement.target_audience} • {new Date(announcement.created_at).toLocaleString()}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(announcement.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
