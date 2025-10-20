import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

function calculateGrade(percentage: number): string {
  if (percentage >= 70) return 'A'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 40) return 'D'
  return 'F'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examSessionId = searchParams.get('examSessionId')
    const studentId = searchParams.get('studentId')
    const visibleOnly = searchParams.get('visibleOnly') === 'true'

    let query = supabase
      .from('exam_results')
      .select(`
        *,
        exam_session:exam_sessions(title, term, session),
        student:students(admission_number)
      `)

    if (examSessionId) query = query.eq('exam_session_id', examSessionId)
    if (studentId) query = query.eq('student_id', studentId)
    if (visibleOnly) query = query.eq('visible_to_student', true)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch results' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attemptId, examSessionId, studentId } = body

    if (!attemptId || !examSessionId || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: attemptData } = await supabase
      .from('exam_attempts')
      .select('total_score, total_marks')
      .eq('id', attemptId)
      .single()

    if (!attemptData) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const totalScore = attemptData.total_score || 0
    const totalMarks = attemptData.total_marks || 100
    const percentage = (totalScore / totalMarks) * 100
    const grade = calculateGrade(percentage)

    const { data: examData } = await supabase
      .from('exam_sessions')
      .select('passing_mark')
      .eq('id', examSessionId)
      .single()

    const passed = percentage >= (examData?.passing_mark || 40)

    const { data, error } = await supabase
      .from('exam_results')
      .insert([
        {
          exam_attempt_id: attemptId,
          exam_session_id: examSessionId,
          student_id: studentId,
          total_score: totalScore,
          total_marks: totalMarks,
          percentage: Math.round(percentage * 100) / 100,
          grade,
          passed,
          visible_to_student: false,
          can_download_pdf: false,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create result' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { resultId, visibleToStudent, canDownloadPdf, releasedBy } = body

    if (!resultId) {
      return NextResponse.json(
        { error: 'resultId is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (visibleToStudent !== undefined) updateData.visible_to_student = visibleToStudent
    if (canDownloadPdf !== undefined) updateData.can_download_pdf = canDownloadPdf
    if (releasedBy) {
      updateData.released_by = releasedBy
      updateData.released_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('exam_results')
      .update(updateData)
      .eq('id', resultId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update result' },
      { status: 500 }
    )
  }
}
