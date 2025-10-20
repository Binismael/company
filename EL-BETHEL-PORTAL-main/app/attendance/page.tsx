"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

interface AttendanceRow { id: string; attendance_date: string; status: string; }

export default function AttendancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0,7))

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) { router.push("/auth/login"); return }
        const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle()
        if (!student) throw new Error("Student profile not found")
        const { data, error } = await supabase
          .from("attendance")
          .select("id, attendance_date, status")
          .eq("student_id", student.id)
          .order("attendance_date", { ascending: false })
        if (error) throw error
        setRows(data || [])
      } catch (e:any) { setError(e.message || "Failed to load attendance") }
      finally { setLoading(false) }
    }
    load()
  }, [router])

  const filtered = useMemo(() => rows.filter(r => r.attendance_date?.startsWith(month)), [rows, month])
  const presentPct = useMemo(() => {
    if (filtered.length === 0) return 0
    const present = filtered.filter(r => r.status === 'Present' || r.status === 'Late').length
    return Math.round((present/filtered.length)*100)
  }, [filtered])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/student-dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          <h1 className="text-lg sm:text-xl font-semibold">Attendance</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <Alert className="mb-4" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card className="border-0 shadow-sm mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-base">Summary</CardTitle><CardDescription>Select month</CardDescription></CardHeader>
          <CardContent className="flex items-center gap-3">
            <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            <div className="ml-auto text-sm">Present: <span className="font-semibold">{presentPct}%</span></div>
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle>No records</CardTitle><CardDescription>No attendance for selected month.</CardDescription></CardHeader></Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{new Date(r.attendance_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{
                      <Badge variant={r.status==='Present' ? 'default' : r.status==='Absent' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                    }</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
