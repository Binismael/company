"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"

interface Question { id: string; question_text: string; option_a?: string; option_b?: string; option_c?: string; option_d?: string; correct_option?: string; marks?: number }
interface Exam { id: string; title: string; duration_minutes: number }

export default function ExamInterface() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [index, setIndex] = useState(0)
  const [deadline, setDeadline] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) { router.push("/auth/login"); return }
        // fetch student
        const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle()
        if (!student) throw new Error("Student profile not found")
        // exam
        const { data: ex } = await supabase.from("exams").select("id,title,duration_minutes").eq("id", id).maybeSingle()
        if (!ex) throw new Error("Exam not found")
        setExam(ex)
        // questions
        const { data: qs } = await supabase.from("questions").select("*").eq("exam_id", id).order("id")
        setQuestions(qs || [])
        // attempt (create if not exists)
        const { data: existing } = await supabase.from("exam_attempts").select("id, start_time").eq("exam_id", id).eq("student_id", student.id).maybeSingle()
        let atId = existing?.id
        let start = existing?.start_time ? new Date(existing.start_time).getTime() : null
        if (!atId) {
          const { data, error } = await supabase.from("exam_attempts").insert([{ exam_id: id, student_id: student.id, start_time: new Date().toISOString(), submitted: false, score: 0 }]).select("id,start_time").single()
          if (error) throw error
          atId = data.id
          start = new Date(data.start_time).getTime()
        }
        setAttemptId(atId as string)
        // set deadline based on start + duration
        const durMs = (ex.duration_minutes || 60) * 60 * 1000
        setDeadline((start as number) + durMs)
        // preload saved answers
        const { data: saved } = await supabase.from("answers").select("question_id, selected_option").eq("attempt_id", atId)
        const map: Record<string, string> = {}
        ;(saved||[]).forEach((s:any)=>{ map[s.question_id] = s.selected_option })
        setAnswers(map)
      } catch (e:any) { setError(e.message || "Failed to start exam") }
      finally { setLoading(false) }
    }
    load()
  }, [id, router])

  // autosubmit on deadline
  useEffect(() => {
    if (!deadline) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (Date.now() >= deadline) {
        clearInterval(timerRef.current as NodeJS.Timeout)
        submit()
      }
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [deadline])

  const saveAnswer = async (qid: string, choice: string) => {
    if (!attemptId) return
    setAnswers(a => ({ ...a, [qid]: choice }))
    await supabase.from("answers").upsert([{ attempt_id: attemptId, question_id: qid, selected_option: choice }])
  }

  const scoreClientSide = () => {
    let score = 0
    for (const q of questions) {
      const sel = answers[q.id]
      const isCorrect = sel && q.correct_option && sel === q.correct_option
      if (isCorrect) score += Number(q.marks || 1)
    }
    return score
  }

  const submit = async () => {
    try {
      if (!attemptId) return
      const total = scoreClientSide()
      await supabase.from("exam_attempts").update({ submitted: true, end_time: new Date().toISOString(), score: total }).eq("id", attemptId)
      router.replace(`/exams/${id}/result`)
    } catch (e:any) { setError(e.message || "Failed to submit exam") }
  }

  const remaining = useMemo(() => {
    if (!deadline) return "--:--"
    const ms = Math.max(0, deadline - Date.now())
    const m = Math.floor(ms/60000)
    const s = Math.floor((ms%60000)/1000)
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }, [deadline, loading])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  const q = questions[index]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/exams" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          <h1 className="text-lg sm:text-xl font-semibold flex-1">{exam?.title || "Exam"}</h1>
          <div className="text-sm">Time left: <span className="font-semibold">{remaining}</span></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <Alert className="mb-4" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {!q ? (
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle>No questions</CardTitle><CardDescription>This exam has no questions yet.</CardDescription></CardHeader></Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Question {index+1} of {questions.length}</CardTitle><CardDescription>{q.marks || 1} mark(s)</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-900">{q.question_text}</p>
              <div className="grid grid-cols-1 gap-2">
                {(["A","B","C","D"] as const).map((opt) => {
                  const key = `option_${opt.toLowerCase()}` as keyof Question
                  const label = q[key] as string | undefined
                  if (!label) return null
                  const value = opt
                  const selected = answers[q.id] === value
                  return (
                    <label key={value} className={`flex items-center gap-3 border rounded-md px-3 py-2 cursor-pointer ${selected? 'bg-blue-50 border-blue-300' : ''}`}>
                      <input type="radio" name={`q-${q.id}`} className="h-4 w-4" checked={selected} onChange={()=> saveAnswer(q.id, value)} />
                      <span className="font-medium">{opt}.</span>
                      <span className="text-gray-800">{label}</span>
                    </label>
                  )
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={()=> setIndex(i=> Math.max(0, i-1))} disabled={index===0}>Previous</Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={()=> setIndex(i=> Math.min(questions.length-1, i+1))} disabled={index===questions.length-1}>Next</Button>
                  <Button onClick={submit} className="bg-blue-600 hover:bg-blue-700">Submit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
