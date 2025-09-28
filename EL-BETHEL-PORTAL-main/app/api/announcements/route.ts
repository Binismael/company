import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import { sendSMS } from "@/lib/sms"

export async function GET() {
  const { data, error } = await supabase
    .from("announcements")
    .select("id,title,body,created_at")
    .order("created_at", { ascending: false })
    .limit(10)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('announcements')
    .insert({ title: body.title, body: body.body || '' })
    .select('id,title,body,created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort SMS broadcast to parents with phone numbers
  try {
    const { data: parents } = await supabase
      .from('profiles')
      .select('phone,full_name')
      .eq('role', 'parent')
      .not('phone', 'is', null)
      .limit(200)

    if (parents && parents.length) {
      const title = (data as any).title as string
      const text = body.body ? `${title}: ${body.body}` : title
      const jobs = parents.map((p: any) => p.phone && sendSMS(p.phone, `Announcement: ${text}`))
      await Promise.allSettled(jobs)
    }
  } catch (_) {
    // ignore broadcast failures
  }

  return NextResponse.json(data)
}
