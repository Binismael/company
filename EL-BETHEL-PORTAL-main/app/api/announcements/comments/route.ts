import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const aid = url.searchParams.get('announcement_id')
  if (!aid) return NextResponse.json({ error: 'announcement_id required' }, { status: 400 })
  const { data, error } = await supabase
    .from('announcement_comments')
    .select('id, body, created_at, profiles:author_id(full_name)')
    .eq('announcement_id', aid)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.announcement_id || !body?.author_email || !body?.body) return NextResponse.json({ error: 'announcement_id, author_email and body required' }, { status: 400 })
  const { data: author } = await supabase.from('profiles').select('id').eq('email', body.author_email).maybeSingle()
  const { data, error } = await supabase.from('announcement_comments').insert({ announcement_id: body.announcement_id, author_id: author?.id || null, body: body.body }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
