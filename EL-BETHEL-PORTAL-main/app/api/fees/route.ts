import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: classes } = await supabase.from("classes").select("id,name").order("name")
    const { data: fees } = await supabase.from("fee_structures").select("class_id, amount, currency")
    const map = new Map((fees || []).map((f:any)=> [f.class_id, f]))
    const payload = (classes || []).map((c:any)=> ({ class_id: c.id, class: c.name, amount: Number(map.get(c.id)?.amount||0), currency: map.get(c.id)?.currency || 'NGN' }))
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=> null)
    if (!body?.class_id || body.amount == null) return NextResponse.json({ error: 'class_id and amount required' }, { status: 400 })
    const { data, error } = await supabase.from('fee_structures').upsert({ class_id: body.class_id, amount: Number(body.amount), currency: body.currency || 'NGN' }).select('class_id, amount, currency').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'unexpected error' }, { status: 500 })
  }
}
