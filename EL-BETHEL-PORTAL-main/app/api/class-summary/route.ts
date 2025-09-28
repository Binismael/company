import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabase.rpc("class_payment_summary")
    if (error) return NextResponse.json([], { status: 200 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
