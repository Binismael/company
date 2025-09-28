import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET() {
  const { data } = await supabase.from('school_accounts').select('*').order('updated_at', { ascending: false }).limit(1)
  return NextResponse.json(data?.[0] || null)
}

export async function POST(req: Request) {
  const body = await req.json()
  const payload = {
    bank_name: body?.bank_name || null,
    account_name: body?.account_name || null,
    account_number: body?.account_number || null,
  }
  const { data, error } = await supabase.from('school_accounts').upsert(payload, { onConflict: 'id' }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
