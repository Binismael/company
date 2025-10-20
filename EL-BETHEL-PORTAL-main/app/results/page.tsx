"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Download, Filter } from "lucide-react"
import Link from "next/link"

interface ResultRow {
  id: string
  subject: { name: string; code?: string } | null
  score: number
  grade: string
  term: string
  session: string
  created_at: string
}

export default function ResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rows, setRows] = useState<ResultRow[]>([])
  const [term, setTerm] = useState<string>("All")
  const [session, setSession] = useState<string>("All")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) {
          router.push("/auth/login")
          return
        }
        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()
        if (!student) throw new Error("Student profile not found")

        const { data, error } = await supabase
          .from("results")
          .select("id, score, grade, term, session, created_at, subject:subjects(name,code)")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })
        if (error) throw error
        setRows(data || [])
      } catch (e: any) {
        setError(e.message || "Failed to load results")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const terms = useMemo(() => ["All", ...Array.from(new Set(rows.map(r => r.term)))], [rows])
  const sessions = useMemo(() => ["All", ...Array.from(new Set(rows.map(r => r.session)))], [rows])
  const filtered = rows.filter(r => (term === "All" || r.term === term) && (session === "All" || r.session === session))

  const downloadCsv = () => {
    const header = ["Subject","Score","Grade","Term","Session","Date"]
    const csv = [header.join(","), ...filtered.map(r => [r.subject?.name||"", r.score, r.grade, r.term, r.session, new Date(r.created_at).toLocaleString()].join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "results.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/student-dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          <h1 className="text-lg sm:text-xl font-semibold">My Results</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <Alert className="mb-4" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card className="border-0 shadow-sm mb-4">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" /> Filters</CardTitle></CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <select value={term} onChange={e=>setTerm(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              {terms.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={session} onChange={e=>setSession(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              {sessions.map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="flex-1" />
            <Button onClick={downloadCsv} className="gap-2" variant="outline"><Download className="h-4 w-4" /> Export CSV</Button>
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle>No results</CardTitle><CardDescription>There are no result records yet.</CardDescription></CardHeader></Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Subject</th>
                  <th className="text-left py-3 px-4 font-medium">Score</th>
                  <th className="text-left py-3 px-4 font-medium">Grade</th>
                  <th className="text-left py-3 px-4 font-medium">Term</th>
                  <th className="text-left py-3 px-4 font-medium">Session</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{r.subject?.name}</td>
                    <td className="py-3 px-4">{r.score}%</td>
                    <td className="py-3 px-4"><Badge variant="secondary">{r.grade}</Badge></td>
                    <td className="py-3 px-4">{r.term}</td>
                    <td className="py-3 px-4">{r.session}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
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
