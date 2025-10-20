"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, ArrowLeft, Clock } from "lucide-react"

interface ExamRow { id: string; title: string; scheduled_at: string; duration_minutes: number; exam_type: string; subject?: { name: string } | null }

export default function ExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rows, setRows] = useState<ExamRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) { router.push("/auth/login"); return }
        const { data: student } = await supabase.from("students").select("id,class_id").eq("user_id", user.id).maybeSingle()
        if (!student) throw new Error("Student profile not found")
        const { data, error } = await supabase
          .from("exams")
          .select("id,title,scheduled_at,duration_minutes,exam_type,subject:subjects(name)")
          .eq("class_id", student.class_id)
          .order("scheduled_at")
        if (error) throw error
        setRows(data || [])
      } catch (e:any) { setError(e.message || "Failed to load exams") }
      finally { setLoading(false) }
    }
    load()
  }, [router])

  const now = Date.now()
  const upcoming = rows.filter(r => new Date(r.scheduled_at).getTime() >= now)
  const past = rows.filter(r => new Date(r.scheduled_at).getTime() < now)

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/student-dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          <h1 className="text-lg sm:text-xl font-semibold">Exams</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <Alert className="mb-4" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card className="border-0 shadow-sm mb-6">
          <CardHeader><CardTitle>Upcoming Exams</CardTitle><CardDescription>Your scheduled CBT and written exams</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? <p className="text-sm text-gray-600">No upcoming exams.</p> : upcoming.map(e => (
              <div key={e.id} className="bg-white rounded-lg p-4 border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{e.title || e.subject?.name}</div>
                    <div className="text-sm text-gray-600">{new Date(e.scheduled_at).toLocaleString()} • {e.duration_minutes} min</div>
                  </div>
                  <Badge className="whitespace-nowrap">{e.exam_type || 'Written'}</Badge>
                </div>
                <div className="mt-3">
                  <Link href={`/exams/${e.id}`} className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50"><Clock className="h-4 w-4" /> Start Exam</Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Past Exams</CardTitle><CardDescription>Completed exams</CardDescription></CardHeader>
          <CardContent>
            {past.length === 0 ? <p className="text-sm text-gray-600">No past exams.</p> : (
              <ul className="space-y-2">{past.map(e => (
                <li key={e.id} className="p-3 border rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.title || e.subject?.name}</div>
                    <div className="text-xs text-gray-600">{new Date(e.scheduled_at).toLocaleString()}</div>
                  </div>
                  <Badge variant="secondary">{e.exam_type}</Badge>
                </li>
              ))}</ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
