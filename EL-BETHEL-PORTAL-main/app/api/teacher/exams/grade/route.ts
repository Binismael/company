import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const { attemptId } = await request.json()

    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      )
    }

    // Get the exam attempt with all answers
    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        answers:exam_answers(
          id,
          question_id,
          selected_option,
          question:exam_questions(
            id,
            correct_answer,
            marks
          )
        )
      `)
      .eq('id', attemptId)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      )
    }

    // Calculate marks
    let totalMarks = 0
    const answerUpdates = (attempt.answers || []).map((answer: any) => {
      const isCorrect = answer.selected_option === answer.question.correct_answer
      const marksAwarded = isCorrect ? answer.question.marks : 0
      totalMarks += marksAwarded

      return {
        id: answer.id,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
      }
    })

    // Update answers with marks
    for (const update of answerUpdates) {
      await supabase
        .from('exam_answers')
        .update({
          is_correct: update.is_correct,
          marks_awarded: update.marks_awarded,
        })
        .eq('id', update.id)
    }

    // Update attempt score
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('exam_attempts')
      .update({
        score: totalMarks,
        raw_score: totalMarks,
        auto_graded: true,
        graded: true,
      })
      .eq('id', attemptId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update attempt' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      score: totalMarks,
      attempt: updatedAttempt,
    })
  } catch (error: any) {
    console.error('Auto-grading error:', error)
    return NextResponse.json(
      { error: 'Auto-grading failed', details: error.message },
      { status: 500 }
    )
  }
}
