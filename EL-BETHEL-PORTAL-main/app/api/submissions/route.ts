import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.assignment_id || !body?.student_email) return NextResponse.json({ error: 'assignment_id and student_email required' }, { status: 400 })
  const { data: student } = await supabase.from('profiles').select('id').eq('email', body.student_email).maybeSingle()
  const payload = { assignment_id: body.assignment_id, student_id: student?.id || null, content: body.content || null, status: 'pending', submitted_at: new Date().toISOString() }
  const { data, error } = await supabase.from('submissions').insert(payload).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
