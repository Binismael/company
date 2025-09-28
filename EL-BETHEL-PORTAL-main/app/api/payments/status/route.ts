import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { sendSMS } from "@/lib/sms"

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.id || !body?.status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  if (!['pending','approved','rejected'].includes(body.status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 })

  const { error } = await supabase.from('payments').update({ status: body.status }).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('id,status,amount,paid_at,student:profiles(full_name,phone,email)')
      .eq('id', body.id)
      .single()

    if (!fetchErr && (body.status === 'approved' || body.status === 'rejected')) {
      const phone = (payment as any)?.student?.phone as string | undefined
      if (phone) {
        const firstName = ((payment as any)?.student?.full_name || '').split(' ')[0] || 'Student'
        const amount = Number((payment as any)?.amount || 0)
        const message = body.status === 'approved'
          ? `Hi ${firstName}, your payment of ₦${amount.toLocaleString()} has been approved. Thank you.`
          : `Hi ${firstName}, your payment of ₦${amount.toLocaleString()} was rejected. Please contact the bursar.`
        await sendSMS(phone, message)
      }
    }
  } catch (_) {
    // ignore SMS errors to avoid blocking status update
  }

  return NextResponse.json({ ok: true })
}
