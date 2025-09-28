import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const class_id = url.searchParams.get('class_id')
  const class_name = url.searchParams.get('class_name')
  let cid = class_id
  if (!cid && class_name) {
    const { data: c } = await supabase.from('classes').select('id').eq('name', class_name).maybeSingle()
    cid = c?.id || ''
  }
  if (!cid) return NextResponse.json([])
  const { data, error } = await supabase.from('assignments').select('id,title,due_date,max_score,subjects(name)').eq('class_id', cid).order('due_date', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
