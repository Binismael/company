import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get('attemptId')

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('student_answers')
      .select(`
        *,
        question:exam_questions(question_text, option_a, option_b, option_c, option_d, correct_answer, marks)
      `)
      .eq('exam_attempt_id', attemptId)
      .order('answered_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch answers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attemptId, questionId, selectedAnswer, timeSpentSeconds } = body

    if (!attemptId || !questionId) {
      return NextResponse.json(
        { error: 'attemptId and questionId are required' },
        { status: 400 }
      )
    }

    const { data: questionData } = await supabase
      .from('exam_questions')
      .select('correct_answer, marks')
      .eq('id', questionId)
      .single()

    let isCorrect = false
    let marksObtained = 0

    if (questionData) {
      isCorrect = selectedAnswer === questionData.correct_answer
      marksObtained = isCorrect ? questionData.marks : 0
    }

    const { data: existingAnswer } = await supabase
      .from('student_answers')
      .select('id')
      .eq('exam_attempt_id', attemptId)
      .eq('question_id', questionId)
      .single()

    let result

    if (existingAnswer) {
      const { data, error } = await supabase
        .from('student_answers')
        .update({
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          marks_obtained: marksObtained,
          time_spent_seconds: timeSpentSeconds,
          answered_at: new Date().toISOString(),
        })
        .eq('id', existingAnswer.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('student_answers')
        .insert([
          {
            exam_attempt_id: attemptId,
            question_id: questionId,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
            marks_obtained: marksObtained,
            time_spent_seconds: timeSpentSeconds,
          },
        ])
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save answer' },
      { status: 500 }
    )
  }
}
