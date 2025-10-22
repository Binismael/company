import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, approved, note } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

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

    // Update student approval status
    const { error: updateError } = await supabase
      .from('students')
      .update({ approved })
      .eq('id', studentId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Log the approval action
    const { error: logError } = await supabase.from('student_approval_logs').insert([
      {
        student_id: studentId,
        admin_user_id: userData.user.id,
        action: approved ? 'approved' : 'rejected',
        note,
      },
    ])

    if (logError) {
      console.error('Error logging approval:', logError)
    }

    return NextResponse.json(
      {
        message: `Student ${approved ? 'approved' : 'rejected'} successfully`,
        studentId,
        approved,
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
