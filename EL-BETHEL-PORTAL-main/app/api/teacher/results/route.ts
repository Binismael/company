import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

const calculateGrade = (score: number): string => {
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const session = searchParams.get('session')
    const term = searchParams.get('term')

    // Get user from token
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from('results')
      .select(`
        *,
        student:students(user:users(full_name), admission_number),
        subject:subjects(name, code)
      `)

    if (classId) query = query.eq('class_id', classId)
    if (session) query = query.eq('session', session)
    if (term) query = query.eq('term', term)

    const { data, error } = await query.order('created_at', {
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
      subjectId,
      classId,
      term,
      session,
      score,
      results,
    } = body

    // Handle bulk insert
    if (results && Array.isArray(results)) {
      const resultsWithGrade = results.map((result: any) => ({
        ...result,
        grade: calculateGrade(result.score),
        teacher_id: user.id,
      }))

      const { data, error } = await supabase
        .from('results')
        .upsert(resultsWithGrade)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(
        { message: 'Results recorded successfully', data },
        { status: 200 }
      )
    }

    // Handle single insert
    if (studentId && subjectId && classId && term && session && score !== undefined) {
      const grade = calculateGrade(score)

      const { data, error } = await supabase
        .from('results')
        .upsert([
          {
            student_id: studentId,
            subject_id: subjectId,
            class_id: classId,
            term,
            session,
            score,
            grade,
            teacher_id: user.id,
          },
        ])
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(
        { message: 'Result recorded successfully', data },
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
