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
    const timetableId = searchParams.get('timetableId')
    const dayOfWeek = searchParams.get('dayOfWeek')

    let query = supabaseAdmin
      .from('timetable_schedules')
      .select(`
        *,
        subject:subjects(id, name, code),
        teacher:users(id, full_name, email)
      `)
      .order('period_number', { ascending: true })

    if (timetableId) {
      query = query.eq('timetable_id', timetableId)
    }

    if (dayOfWeek) {
      query = query.eq('day_of_week', parseInt(dayOfWeek))
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
    const {
      timetableId,
      dayOfWeek,
      periodNumber,
      startTime,
      endTime,
      subjectId,
      teacherId,
      location,
    } = body

    if (!timetableId || !dayOfWeek || !periodNumber || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('timetable_schedules')
      .insert([
        {
          timetable_id: timetableId,
          day_of_week: dayOfWeek,
          period_number: periodNumber,
          start_time: startTime,
          end_time: endTime,
          subject_id: subjectId,
          teacher_id: teacherId,
          location,
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

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('timetable_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

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

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('timetable_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
