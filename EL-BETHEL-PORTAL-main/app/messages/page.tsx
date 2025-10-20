"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"

interface NotificationRow { id: string; title: string; message?: string | null; created_at?: string }

export default function MessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rows, setRows] = useState<NotificationRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) { router.push("/auth/login"); return }
        const { data, error } = await supabase.from("notifications").select("id,title,message,created_at").eq("user_id", user.id).order("created_at", { ascending: false })
        if (error) {
          // fallback to messages table
          const { data: msgs } = await supabase.from("messages").select("id, subject:title, body:message, created_at").eq("recipient_id", user.id).order("created_at", { ascending: false })
          setRows((msgs as any) || [])
        } else {
          setRows(data || [])
        }
      } catch (e:any) { setError(e.message || "Failed to load notifications") }
      finally { setLoading(false) }
    }
    load()
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/student-dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          <h1 className="text-lg sm:text-xl font-semibold">Messages & Notifications</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <Alert className="mb-4" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="space-y-3">
          {rows.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardHeader><CardTitle>No messages</CardTitle><CardDescription>Announcements or messages will appear here.</CardDescription></CardHeader></Card>
          ) : rows.map(n => (
            <Card key={n.id} className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">{n.title}</CardTitle><CardDescription>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</CardDescription></CardHeader>
              {n.message && <CardContent className="pt-0"><p className="text-sm text-gray-700 whitespace-pre-wrap">{n.message}</p></CardContent>}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
