import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const classId = searchParams.get('classId')
    const role = searchParams.get('role')
    const userId = searchParams.get('userId')

    let query = supabase
      .from('exam_sessions')
      .select(`
        *,
        class:classes(name, form_level),
        subject:subjects(name, code),
        teacher:users(full_name, email)
      `)

    if (status) query = query.eq('status', status)
    if (classId) query = query.eq('class_id', classId)

    if (role === 'student' && userId) {
      const { data: studentData } = await supabase
        .from('students')
        .select('class_id')
        .eq('user_id', userId)
        .single()

      if (studentData?.class_id) {
        query = query.eq('class_id', studentData.class_id)
        query = query.eq('status', 'active')
      }
    }

    const { data, error } = await query.order('start_time', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exam sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      classId,
      subjectId,
      teacherId,
      term,
      session,
      startTime,
      endTime,
      durationMinutes,
      totalMarks,
      passingMark,
    } = body

    if (!title || !classId || !subjectId || !teacherId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('exam_sessions')
      .insert([
        {
          title,
          description,
          class_id: classId,
          subject_id: subjectId,
          teacher_id: teacherId,
          term: term || 'First Term',
          session: session || '2024/2025',
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes || 60,
          total_marks: totalMarks || 100,
          passing_mark: passingMark || 40,
          status: 'draft',
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create exam session' },
      { status: 500 }
    )
  }
}
