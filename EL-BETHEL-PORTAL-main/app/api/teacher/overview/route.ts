import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

function q(url: URL, key: string) { return url.searchParams.get(key) || undefined }

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = q(url, 'email')

  let teacher
  if (email) {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle()
    if (data) teacher = data
  }
  if (!teacher) {
    const { data } = await supabase.from('profiles').select('*').eq('email','teacher@elbethel.edu').maybeSingle()
    teacher = data
  }
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  // subjects taught
  const { data: subj } = await supabase
    .from('teacher_subjects')
    .select('subjects(id,name,class_id), subjects:subjects(name, class_id), classes:subjects!inner(class_id)')
    .eq('teacher_id', teacher.id)

  // classes taught
  const classIds = Array.from(new Set((subj||[]).map((s:any)=> s.subjects?.class_id).filter(Boolean)))
  const { data: classes } = await supabase.from('classes').select('*').in('id', classIds.length? classIds : ['00000000-0000-0000-0000-000000000000'])

  // upcoming exams for those classes
  const { data: exams } = await supabase
    .from('exams')
    .select('id, scheduled_at, duration_minutes, exam_type, subjects(name), classes(name)')
    .in('class_id', classIds.length? classIds : ['00000000-0000-0000-0000-000000000000'])
    .gt('scheduled_at', new Date().toISOString())
    .order('scheduled_at')

  // recent submissions for assignments created by this teacher
  const { data: subs } = await supabase
    .from('submissions')
    .select('status, score, submitted_at, assignments(title, class_id), profiles(full_name), classes:assignments!inner(class_id)')
    .order('submitted_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    teacher,
    classes: classes || [],
    upcomingExams: (exams||[]).map(e=>({ class: e.classes?.name, subject: e.subjects?.name, date: e.scheduled_at, type: e.exam_type, questions: 40, duration: `${e.duration_minutes} min` })),
    submissions: (subs||[]).map(s=>({ student: s.profiles?.full_name, assignment: s.assignments?.title, class: s.classes?.name, score: s.score, status: s.status }))
  })
}
