import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const timetableId = searchParams.get('id')

    let query = supabaseAdmin
      .from('timetables')
      .select(`
        *,
        class:classes(id, name, form_level),
        schedules:timetable_schedules(
          id,
          day_of_week,
          period_number,
          start_time,
          end_time,
          subject:subjects(id, name, code),
          teacher:users(id, full_name)
        )
      `)

    if (timetableId) {
      query = query.eq('id', timetableId).single()
    } else if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { classId, session, term, createdBy } = body

    if (!classId || !session || !term) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('timetables')
      .insert([
        {
          class_id: classId,
          session,
          term,
          created_by: createdBy,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
