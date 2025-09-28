import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"
import crypto from "crypto"

function hashCode(phone: string, code: string) {
  return crypto.createHash("sha256").update(`${phone}:${code}`).digest("hex")
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const phone = (body?.phone as string | undefined)?.trim()
  const code = (body?.code as string | undefined)?.trim()
  if (!phone || !code) return NextResponse.json({ error: "phone and code are required" }, { status: 400 })

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("otp_codes")
    .select("id, code_hash, attempts, expires_at")
    .eq("phone", phone)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const record = data?.[0]
  if (!record) return NextResponse.json({ error: "No valid code. Request a new one." }, { status: 400 })

  if (record.attempts >= 5) return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 })

  const candidate = hashCode(phone, code)
  const ok = crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(record.code_hash, "hex"))

  if (!ok) {
    await supabase.from("otp_codes").update({ attempts: record.attempts + 1 }).eq("id", record.id)
    return NextResponse.json({ error: "Invalid code" }, { status: 401 })
  }

  await supabase.from("otp_codes").delete().eq("id", record.id)
  return NextResponse.json({ ok: true })
}
