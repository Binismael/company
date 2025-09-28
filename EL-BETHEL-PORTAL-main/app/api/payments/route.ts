import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let mapped: any[] = []
    // Try relational select first
    const rel = await supabase
      .from("payments")
      .select("id,amount,status,receipt,paid_at,student:profiles(full_name),class:classes(name)")
      .order("paid_at", { ascending: false })
      .limit(50)
    if (!rel.error && rel.data) {
      mapped = rel.data.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        receipt: p.receipt,
        paid_at: p.paid_at,
        student: { full_name: p.student?.full_name },
        class: { name: p.class?.name },
      }))
      return NextResponse.json(mapped)
    }

    // Fallback to flat columns
    const flat = await supabase
      .from("payments")
      .select("id,amount,status,receipt,paid_at,student_name:student_name,class_name:class_name")
      .order("paid_at", { ascending: false })
      .limit(50)
    if (!flat.error && flat.data) {
      mapped = flat.data.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        receipt: p.receipt,
        paid_at: p.paid_at,
        student: { full_name: p.student_name || null },
        class: { name: p.class_name || null },
      }))
      return NextResponse.json(mapped)
    }

    return NextResponse.json([], { status: 200 })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
