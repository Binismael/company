"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"

export default function ExamResult() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) { router.push("/auth/login"); return }
        const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle()
        if (!student) throw new Error("Student profile not found")
        const { data: attempt } = await supabase.from("exam_attempts").select("score").eq("exam_id", id).eq("student_id", student.id).maybeSingle()
        if (!attempt) throw new Error("Attempt not found")
        setScore(Number(attempt.score||0))
      } catch (e:any) { setError(e.message || "Failed to load result") }
      finally { setLoading(false) }
    }
    load()
  }, [id, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/exams" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          <h1 className="text-lg sm:text-xl font-semibold">Exam Result</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <Alert className="mb-4" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Your Score</CardTitle><CardDescription>Calculated based on correct answers</CardDescription></CardHeader>
          <CardContent><div className="text-3xl font-bold">{score}</div></CardContent>
        </Card>
      </div>
    </div>
  )
}
