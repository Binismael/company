import { NextResponse } from "next/server"
import { sendSMS } from "@/lib/sms"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const to = body?.to as string | undefined
  const message = body?.message as string | undefined

  if (!to || !message) {
    return NextResponse.json({ error: "to and message are required" }, { status: 400 })
  }

  const res = await sendSMS(to, message)
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 502 })
  }
  return NextResponse.json({ ok: true, provider: res.provider, id: (res as any).id })
}
