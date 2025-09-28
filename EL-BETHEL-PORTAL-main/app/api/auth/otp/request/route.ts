import { NextResponse } from "next/server"
import { sendSMS } from "@/lib/sms"
import { supabase } from "@/lib/supabase-client"
import crypto from "crypto"

function hashCode(phone: string, code: string) {
  return crypto.createHash("sha256").update(`${phone}:${code}`).digest("hex")
}

function generateCode() {
  const n = crypto.randomInt(0, 1000000)
  return n.toString().padStart(6, "0")
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const phone = (body?.phone as string | undefined)?.trim()
  if (!phone) return NextResponse.json({ error: "phone is required" }, { status: 400 })

  const code = generateCode()
  const code_hash = hashCode(phone, code)
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error } = await supabase.from("otp_codes").insert({ phone, code_hash, expires_at: expires })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sms = await sendSMS(phone, `Your El Bethel verification code is ${code}. It expires in 5 minutes.`)
  if (!sms.ok) {
    return NextResponse.json({ error: sms.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true, provider: sms.provider })
}
