import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const studentId = url.searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  const body = await req.json()

  // Support both old format (assignment_id, student_email) and new format (assignmentId, studentId)
  const assignmentId = body?.assignmentId || body?.assignment_id
  const studentId = body?.studentId

  if (!assignmentId || !studentId) {
    return NextResponse.json({ error: 'assignmentId and studentId required' }, { status: 400 })
  }

  const payload = {
    assignment_id: assignmentId,
    student_id: studentId,
    file_url: body.fileUrl || null,
    content: body.content || null,
    status: body.status || 'submitted',
    submitted_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
