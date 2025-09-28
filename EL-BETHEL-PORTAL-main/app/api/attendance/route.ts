import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const className = searchParams.get("class")
  const date = searchParams.get("date")
  let q = supabase.from("attendance").select("id,class_name,student_email,date,status,recorded_at").order("date", { ascending: false }).limit(200)
  if (email) q = q.eq("student_email", email)
  if (className) q = q.eq("class_name", className)
  if (date) q = q.eq("date", date)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const items = Array.isArray(body) ? body : body?.items
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items array required" }, { status: 400 })
  const safe = items.map((i:any)=> ({ class_name: i.class_name, student_email: i.student_email, date: i.date, status: i.status }))
  const { data, error } = await supabase.from("attendance").insert(safe).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, count: data?.length || 0 })
}
