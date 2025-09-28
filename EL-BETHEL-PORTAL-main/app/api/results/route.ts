import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const limit = Number(searchParams.get("limit") || 100)
  let q = supabase.from("results").select("id,student_email,subject,score,grade,term,recorded_at").order("recorded_at", { ascending: false }).limit(limit)
  if (email) q = q.eq("student_email", email)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.student_email || !body?.subject || typeof body?.score !== 'number' || !body?.term) {
    return NextResponse.json({ error: "student_email, subject, score, term required" }, { status: 400 })
  }
  const grade = body.grade || (body.score >= 75 ? 'A' : body.score >= 65 ? 'B' : body.score >= 50 ? 'C' : body.score >= 45 ? 'D' : 'F')
  const { data, error } = await supabase.from("results").insert({ student_email: body.student_email, subject: body.subject, score: body.score, grade, term: body.term }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
