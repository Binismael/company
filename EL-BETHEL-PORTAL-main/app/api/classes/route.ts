import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET() {
  const { data, error } = await supabase.from('classes').select('id,name,level').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const { data, error } = await supabase.from('classes').insert({ name: body.name, level: body.level || null }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
