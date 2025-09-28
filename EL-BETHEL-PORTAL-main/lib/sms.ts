export type SMSResult = { ok: true; provider: string; id?: string } | { ok: false; error: string }

function env(name: string) {
  return process.env[name]
}

function hasTwilioEnv() {
  return !!(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_FROM"))
}

async function sendViaTwilio(to: string, message: string): Promise<SMSResult> {
  const sid = env("TWILIO_ACCOUNT_SID") as string
  const token = env("TWILIO_AUTH_TOKEN") as string
  const from = env("TWILIO_FROM") as string
  try {
    const auth = typeof Buffer !== "undefined"
      ? Buffer.from(`${sid}:${token}`).toString("base64")
      : (globalThis as any).btoa
      ? (globalThis as any).btoa(`${sid}:${token}`)
      : ""
    if (!auth) return { ok: false, error: "Base64 encoding not supported in this runtime" }

    const body = new URLSearchParams({ To: to, From: from, Body: message }).toString()
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })
    const data = (await res.json()) as any
    if (!res.ok) {
      return { ok: false, error: data?.message || "Twilio error" }
    }
    return { ok: true, provider: "twilio", id: data?.sid }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Twilio request failed" }
  }
}

async function sendViaZapier(to: string, message: string): Promise<SMSResult> {
  const hook = env("ZAPIER_SMS_WEBHOOK")
  if (!hook) return { ok: false, error: "ZAPIER_SMS_WEBHOOK not configured" }
  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    })
    if (!res.ok) {
      const txt = await res.text()
      return { ok: false, error: txt || `Zapier webhook error ${res.status}` }
    }
    return { ok: true, provider: "zapier" }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Zapier request failed" }
  }
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  const provider = (env("SMS_PROVIDER") || "auto").toLowerCase()
  if (provider === "twilio" || (provider === "auto" && hasTwilioEnv())) {
    return await sendViaTwilio(to, message)
  }
  if (provider === "zapier" || provider === "auto") {
    const res = await sendViaZapier(to, message)
    if (res.ok || provider === "zapier") return res
  }
  return { ok: false, error: "No SMS provider configured (set Twilio envs or ZAPIER_SMS_WEBHOOK)" }
}
