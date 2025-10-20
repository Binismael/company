import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examSessionId = searchParams.get('examSessionId')

    if (!examSessionId) {
      return NextResponse.json(
        { error: 'examSessionId is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_session_id', examSessionId)
      .order('question_number', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      examSessionId,
      questionNumber,
      questionText,
      questionType,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      marks,
      explanation,
    } = body

    if (
      !examSessionId ||
      questionNumber === undefined ||
      !questionText ||
      !correctAnswer
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('exam_questions')
      .insert([
        {
          exam_session_id: examSessionId,
          question_number: questionNumber,
          question_text: questionText,
          question_type: questionType || 'multiple_choice',
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_answer: correctAnswer,
          marks: marks || 1,
          explanation,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create question' },
      { status: 500 }
    )
  }
}
