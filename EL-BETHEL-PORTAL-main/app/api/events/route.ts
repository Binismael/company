import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from") || new Date(Date.now() - 30*86400000).toISOString().slice(0,10)
  const to = searchParams.get("to") || new Date(Date.now() + 180*86400000).toISOString().slice(0,10)
  const { data, error } = await supabase.from("events").select("id,title,description,date,type,created_at").gte("date", from).lte("date", to).order("date", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.title || !body?.date) return NextResponse.json({ error: "title and date required" }, { status: 400 })
  const { data, error } = await supabase.from("events").insert({ title: body.title, description: body.description || '', date: body.date, type: body.type || 'general' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
