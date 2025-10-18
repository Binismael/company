import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Get user from token
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student ID
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (studentError) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get attendance records
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        class:classes(name)
      `)
      .eq('student_id', studentData.id)
      .order('attendance_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Calculate attendance percentage
    const presentCount = data.filter(
      (r: any) => r.status === 'Present' || r.status === 'Late'
    ).length
    const percentage =
      data.length > 0 ? ((presentCount / data.length) * 100).toFixed(2) : '0'

    return NextResponse.json(
      {
        records: data,
        total: data.length,
        present: presentCount,
        percentage: parseFloat(percentage),
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
