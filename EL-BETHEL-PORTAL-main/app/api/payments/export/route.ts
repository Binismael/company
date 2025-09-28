import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET() {
  const { data, error } = await supabase
    .from('payments')
    .select('id,amount,status,receipt,paid_at,profiles!payments_student_id_fkey(full_name),classes!payments_class_id_fkey(name)')
    .order('paid_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data||[]).map((p:any) => ({
    id: p.id,
    student: p.profiles?.full_name || '',
    class: p.classes?.name || '',
    amount: Number(p.amount||0),
    status: p.status,
    receipt: p.receipt,
    paid_at: p.paid_at || ''
  }))

  const header = Object.keys(rows[0] || { id:"", student:"", class:"", amount:0, status:"", receipt:"", paid_at:"" })
  const csv = [header.join(','), ...rows.map(r => header.map(h=> String((r as any)[h]).replace(/,/g,';')).join(','))].join('\n')

  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="payments.csv"' } })
}
