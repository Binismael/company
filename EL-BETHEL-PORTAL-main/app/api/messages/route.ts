import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const role = searchParams.get("role")
  const className = searchParams.get("class")
  let q = supabase.from("messages").select("id,sender_email,recipient_role,recipient_email,class_name,content,created_at").order("created_at", { ascending: false }).limit(200)
  if (email) q = q.or(`sender_email.eq.${email},recipient_email.eq.${email}`)
  if (role) q = q.eq("recipient_role", role)
  if (className) q = q.eq("class_name", className)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.sender_email || !body?.content) return NextResponse.json({ error: "sender_email and content required" }, { status: 400 })
  const { data, error } = await supabase.from("messages").insert({ sender_email: body.sender_email, recipient_role: body.recipient_role || null, recipient_email: body.recipient_email || null, class_name: body.class_name || null, content: body.content }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
