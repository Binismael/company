import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')

    // Get user from token
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:students(user:users(full_name), admission_number)
      `)

    if (classId) query = query.eq('class_id', classId)
    if (date) query = query.eq('attendance_date', date)

    const { data, error } = await query.order('attendance_date', {
      ascending: false,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const body = await request.json()

    // Get user from token
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      studentId,
      classId,
      date,
      status,
      records,
    } = body

    // Handle bulk insert
    if (records && Array.isArray(records)) {
      const recordsWithTeacher = records.map((record: any) => ({
        ...record,
        marked_by: user.id,
      }))

      const { data, error } = await supabase
        .from('attendance')
        .upsert(recordsWithTeacher)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(
        { message: 'Attendance recorded successfully', data },
        { status: 200 }
      )
    }

    // Handle single insert
    if (studentId && classId && date && status) {
      const { data, error } = await supabase
        .from('attendance')
        .upsert([
          {
            student_id: studentId,
            class_id: classId,
            attendance_date: date,
            status,
            marked_by: user.id,
          },
        ])
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(
        { message: 'Attendance recorded successfully', data },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
