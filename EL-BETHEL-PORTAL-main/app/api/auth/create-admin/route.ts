import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, hasServiceRole } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY env. Please set it." }, { status: 500 })
    }

    const body = await request.json()
    const { email, password, full_name } = body || {}

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "email, password, full_name are required" }, { status: 400 })
    }

    // Create auth user with admin privileges (service role)
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: "admin" },
    })

    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message || "Failed to create user" }, { status: 400 })
    }

    const userId = created.user.id

    // Insert into users table (bypass RLS with service role)
    const { error: insertError } = await supabaseAdmin.from("users").insert([
      { id: userId, email, full_name, role: "admin" },
    ])

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Admin created", userId }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}
