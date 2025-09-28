import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

function q(url: URL, key: string) { return url.searchParams.get(key) || undefined }

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = q(url, 'email')

  let parent
  if (email) {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle()
    if (data) parent = data
  }
  if (!parent) {
    const { data } = await supabase.from('profiles').select('*').eq('email','parent@elbethel.edu').maybeSingle()
    parent = data
  }
  if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

  // child link
  const { data: link } = await supabase.from('parent_child').select('student_id').eq('parent_id', parent.id).maybeSingle()
  if (!link) return NextResponse.json({ error: 'No child linked' }, { status: 404 })

  const { data: student } = await supabase.from('profiles').select('*').eq('id', link.student_id).maybeSingle()

  // enrollment & class
  const { data: enr } = await supabase.from('enrollments').select('class_id').eq('student_id', link.student_id).maybeSingle()
  const { data: clazz } = await supabase.from('classes').select('*').eq('id', enr?.class_id).maybeSingle()

  // teachers for class (via teacher_subjects on subjects with class)
  const { data: teacherRows } = await supabase
    .from('teacher_subjects')
    .select('profiles(full_name, email), subjects(name)')
    .in('subject_id', (await supabase.from('subjects').select('id').eq('class_id', clazz?.id)).data?.map(r=>r.id) || [])

  // payment history
  const { data: paymentHistory } = await supabase
    .from('payments')
    .select('amount,status,receipt,paid_at')
    .eq('student_id', link.student_id)
    .order('paid_at', { ascending: false })

  return NextResponse.json({
    child: student,
    classInfo: clazz,
    teachers: (teacherRows||[]).map((t:any)=>({ name: t.profiles?.full_name, subject: t.subjects?.name, email: t.profiles?.email })),
    payment: {
      totalFees: (paymentHistory||[]).filter(p=>p.status==='approved').reduce((s,p)=>s+Number(p.amount||0),0),
      paidAmount: (paymentHistory||[]).filter(p=>p.status==='approved').reduce((s,p)=>s+Number(p.amount||0),0),
      balance: 0,
      status: 'Completed',
      dueDate: null,
      paymentHistory: paymentHistory || []
    },
    activities: []
  })
}
