"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Loader2, CheckCircle, Clock, ArrowLeft, BookOpen } from "lucide-react"

interface AssignmentRow {
  id: string
  title: string
  description: string | null
  due_date: string
  subject?: { name: string } | null
}

interface SubmissionRow {
  id: string
  assignment_id: string
  student_id: string
  submitted_at: string | null
  status: string
  score: number | null
}

export default function AssignmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [submissions, setSubmissions] = useState<Record<string, SubmissionRow | null>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

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
        // Find student + class
        const { data: student, error: stErr } = await supabase
          .from("students")
          .select("id, class_id")
          .eq("user_id", user.id)
          .single()
        if (stErr || !student) throw new Error("Student record not found")

        // Load assignments for the class
        const { data: asg, error: asgErr } = await supabase
          .from("assignments")
          .select("id, title, description, due_date, subject:subjects(name)")
          .eq("class_id", student.class_id)
          .order("due_date", { ascending: true })
        if (asgErr) throw asgErr
        setAssignments(asg || [])

        // Load existing submissions for this student
        const { data: subs, error: subErr } = await supabase
          .from("assignment_submissions")
          .select("id, assignment_id, student_id, submitted_at, status, score")
          .eq("student_id", student.id)
        if (subErr) {
          // Table may not exist yet; show soft message
          console.warn("assignment_submissions not available", subErr)
        }
        const map: Record<string, SubmissionRow | null> = {}
        for (const a of asg || []) {
          map[a.id] = (subs || []).find((s) => s.assignment_id === a.id) || null
        }
        setSubmissions(map)
      } catch (e: any) {
        setError(e.message || "Failed to load assignments")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const submitAssignment = async (assignmentId: string) => {
    try {
      setSubmittingId(assignmentId)
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) throw new Error("Not authenticated")
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!student) throw new Error("Student not found")

      const { data, error } = await supabase
        .from("assignment_submissions")
        .upsert([
          {
            assignment_id: assignmentId,
            student_id: student.id,
            submitted_at: new Date().toISOString(),
            status: "Submitted",
          },
        ])
        .select()
      if (error) throw error

      setSubmissions((s) => ({
        ...s,
        [assignmentId]: data?.[0] || null,
      }))
    } catch (e: any) {
      setError(e.message || "Submission failed. Ensure database tables exist.")
    } finally {
      setSubmittingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/student-dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-600" />
            <h1 className="text-lg sm:text-xl font-semibold">Assignments</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {assignments.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>No assignments</CardTitle>
              <CardDescription>There are currently no assignments for your class.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const sub = submissions[a.id]
              const due = new Date(a.due_date)
              const overdue = due.getTime() < Date.now() && (!sub || !sub.submitted_at)
              return (
                <Card key={a.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-semibold">{a.title}</CardTitle>
                        <CardDescription>
                          {(a.subject?.name ? `${a.subject.name} • ` : "")}Due {due.toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub?.status === "Submitted" ? (
                          <Badge className="bg-green-600">Submitted</Badge>
                        ) : overdue ? (
                          <Badge className="bg-red-600">Overdue</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {a.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-700 mb-3">{a.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {sub?.status === "Submitted" ? (
                          <Button disabled variant="outline" className="gap-2">
                            <CheckCircle className="h-4 w-4" /> Submitted
                          </Button>
                        ) : (
                          <Button onClick={() => submitAssignment(a.id)} disabled={!!submittingId} className="gap-2">
                            {submittingId === a.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                            {submittingId === a.id ? "Submitting..." : "Submit"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
