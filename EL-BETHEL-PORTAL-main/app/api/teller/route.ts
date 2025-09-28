import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  const { data: student } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle()
  const { data: account } = await supabase.from('school_accounts').select('*').order('updated_at', { ascending: false }).limit(1)
  const acc = account?.[0]
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payment Teller</title><style>body{font-family:Arial;padding:24px} .box{border:1px solid #ddd;padding:16px;border-radius:8px} .row{display:flex;justify-content:space-between;margin:8px 0}</style></head><body><h2>El Bethel Academy - Payment Teller</h2><div class="box"><div class="row"><strong>Student</strong><span>${student?.full_name||''}</span></div><div class="row"><strong>Class</strong><span>${student?.class||''}</span></div><div class="row"><strong>Bank</strong><span>${acc?.bank_name||'-'}</span></div><div class="row"><strong>Account Name</strong><span>${acc?.account_name||'-'}</span></div><div class="row"><strong>Account Number</strong><span>${acc?.account_number||'-'}</span></div><div class="row"><strong>Date</strong><span>${new Date().toLocaleString()}</span></div></div><p style="margin-top:16px;color:#666">Present this teller at the bank or use for transfer reference.</p></body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
