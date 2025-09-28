import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.class_id || !body?.subject_id || !body?.title) return NextResponse.json({ error: 'class_id, subject_id, title required' }, { status: 400 })
  const payload = { class_id: body.class_id, subject_id: body.subject_id, title: body.title, due_date: body.due_date || null, max_score: body.max_score || 100, created_by: body.created_by || null, description: body.description || null }
  const { data, error } = await supabase.from('assignments').insert(payload).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const teacher_email = url.searchParams.get('teacher_email')
  if (!teacher_email) return NextResponse.json([])
  const { data: teacher } = await supabase.from('profiles').select('id').eq('email', teacher_email).maybeSingle()
  const { data, error } = await supabase.from('assignments').select('id,title,due_date,max_score,classes(name),subjects(name)').eq('created_by', teacher?.id || '').order('created_at', { ascending: false }).limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
