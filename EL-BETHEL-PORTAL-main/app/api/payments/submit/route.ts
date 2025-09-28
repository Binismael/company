import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(req: Request) {
  const body = await req.json().catch(()=>null)
  const email = body?.email
  const amount = Number(body?.amount || 0)
  const receipt = String(body?.receipt || '')
  const paid_at = body?.paid_at || null
  const class_name = body?.class || null
  if (!email || !amount) return NextResponse.json({ error: 'email and amount required' }, { status: 400 })

  const { data: student } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
  if (!student) return NextResponse.json({ error: 'student not found' }, { status: 404 })

  let class_id: string | null = null
  if (class_name) {
    const { data: c } = await supabase.from('classes').select('id').eq('name', class_name).maybeSingle()
    class_id = c?.id || null
  }

  const { error, data } = await supabase.from('payments').insert({
    student_id: student.id,
    class_id: class_id,
    amount,
    status: 'pending',
    receipt,
    paid_at
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
