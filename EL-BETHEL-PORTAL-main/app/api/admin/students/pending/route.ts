import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authenticated admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)

    // Verify the token and get user
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userData.user.id)
      .single()

    if (!adminCheck) {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 403 })
    }

    // Fetch pending students (not approved)
    const { data: pendingStudents, error } = await supabase
      .from('students')
      .select(
        `
        id,
        user_id,
        first_name,
        last_name,
        email: users(email),
        phone,
        class,
        section,
        guardian_name,
        guardian_phone,
        approved,
        created_at,
        reg_number
      `
      )
      .eq('approved', false)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        data: pendingStudents,
        count: pendingStudents?.length || 0,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
