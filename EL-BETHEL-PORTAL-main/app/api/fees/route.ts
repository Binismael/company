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
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const term = searchParams.get('term')
    const session = searchParams.get('session')

    let query = supabaseAdmin
      .from('fees')
      .select(`
        *,
        student:students(id, admission_number, user:users(full_name))
      `)
      .order('created_at', { ascending: false })

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (term) {
      query = query.eq('term', term)
    }

    if (session) {
      query = query.eq('session', session)
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
    const { studentId, term, session, amount, dueDate } = body

    if (!studentId || !term || !session || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('fees')
      .insert([
        {
          student_id: studentId,
          term,
          session,
          amount,
          due_date: dueDate || null,
          status: 'Pending',
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
    const { feeId, paidAmount, status } = body

    if (!feeId) {
      return NextResponse.json(
        { error: 'feeId is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (paidAmount !== undefined) {
      updateData.paid_amount = paidAmount
    }
    if (status !== undefined) {
      updateData.status = status
    }

    const { data, error } = await supabaseAdmin
      .from('fees')
      .update(updateData)
      .eq('id', feeId)
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
