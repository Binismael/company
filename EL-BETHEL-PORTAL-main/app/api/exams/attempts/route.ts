import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examSessionId = searchParams.get('examSessionId')
    const studentId = searchParams.get('studentId')

    let query = supabase
      .from('exam_attempts')
      .select(`
        *,
        exam_session:exam_sessions(title, subject_id),
        student:students(user_id, admission_number)
      `)

    if (examSessionId) query = query.eq('exam_session_id', examSessionId)
    if (studentId) query = query.eq('student_id', studentId)

    const { data, error } = await query.order('started_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exam attempts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examSessionId, studentId } = body

    if (!examSessionId || !studentId) {
      return NextResponse.json(
        { error: 'examSessionId and studentId are required' },
        { status: 400 }
      )
    }

    const existingAttempt = await supabase
      .from('exam_attempts')
      .select('id')
      .eq('exam_session_id', examSessionId)
      .eq('student_id', studentId)
      .single()

    if (existingAttempt.data) {
      return NextResponse.json(
        { error: 'Student has already attempted this exam' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('exam_attempts')
      .insert([
        {
          exam_session_id: examSessionId,
          student_id: studentId,
          started_at: new Date().toISOString(),
          status: 'in_progress',
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create exam attempt' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { attemptId, status } = body

    if (!attemptId || !status) {
      return NextResponse.json(
        { error: 'attemptId and status are required' },
        { status: 400 }
      )
    }

    const updateData: any = { status }

    if (status === 'submitted') {
      updateData.submitted_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('exam_attempts')
      .update(updateData)
      .eq('id', attemptId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update exam attempt' },
      { status: 500 }
    )
  }
}
