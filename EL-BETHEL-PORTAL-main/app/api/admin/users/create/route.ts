import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

const supabase = createClient(supabaseUrl, serviceKey)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const MAIN_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_MAIN_ADMIN_EMAIL || 'abdulmuizismael@gmail.com').toLowerCase()
    if (userData.user.email?.toLowerCase() !== MAIN_ADMIN_EMAIL) {
      const { data: roleData } = await supabase
        .from('users')
        .select('role')
        .or(`id.eq.${userData.user.id},auth_id.eq.${userData.user.id},email.eq.${userData.user.email}`)
        .maybeSingle()
      if (roleData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { full_name, email, password, role, class_id, subject_id } = body || {}

    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ error: 'full_name, email, password, role are required' }, { status: 400 })
    }

    // Create auth user
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message || 'Failed to create auth user' }, { status: 400 })
    }

    const newUserId = created.user.id

    // Insert into public.users
    const { error: insertUserError } = await supabase.from('users').insert([
      { id: newUserId, email, full_name, role },
    ])
    if (insertUserError) {
      return NextResponse.json({ error: insertUserError.message }, { status: 400 })
    }

    // Role-specific inserts (best-effort)
    if (role === 'student') {
      await supabase.from('students').insert([{ user_id: newUserId, class_id: class_id || null }])
      // Try to mark approved in various schemas
      await supabase.from('students').update({ approved: true }).eq('user_id', newUserId)
        .then(async (r) => { if (r.error) await supabase.from('students').update({ is_approved: true }).eq('user_id', newUserId) })
        .then(async (r: any) => { if (r?.error) await supabase.from('students').update({ status: 'approved' }).eq('user_id', newUserId) })
    } else if (role === 'teacher') {
      await supabase.from('teachers').insert([{ user_id: newUserId, subject_id: subject_id || null }])
    } else if (role === 'admin') {
      // Optional admins table
      await supabase.from('admins').insert([{ user_id: newUserId, name: full_name, status: 'active' }]).catch(() => {})
    }

    return NextResponse.json({ success: true, id: newUserId })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
