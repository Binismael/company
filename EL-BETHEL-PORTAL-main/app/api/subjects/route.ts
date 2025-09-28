import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const class_id = url.searchParams.get('class_id')
  let q = supabase.from('subjects').select('id,name,class_id')
  if (class_id) q = q.eq('class_id', class_id)
  const { data, error } = await q.order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.class_id || !body?.name) return NextResponse.json({ error: 'class_id and name required' }, { status: 400 })
  const { data, error } = await supabase.from('subjects').insert({ class_id: body.class_id, name: body.name }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
