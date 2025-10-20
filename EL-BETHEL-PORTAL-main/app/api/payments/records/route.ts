import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const term = searchParams.get('term')

    let query = supabase
      .from('payment_records')
      .select(`
        *,
        student:students(admission_number, user_id),
        verified_by_user:users(full_name)
      `)

    if (studentId) query = query.eq('student_id', studentId)
    if (status) query = query.eq('payment_status', status)
    if (term) query = query.eq('term', term)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      term,
      session,
      amountDue,
      paymentMethod,
      receiptUrl,
      paystackReference,
    } = body

    if (!studentId || !amountDue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: existingPayment } = await supabase
      .from('payment_records')
      .select('id')
      .eq('student_id', studentId)
      .eq('term', term || 'First Term')
      .eq('session', session || '2024/2025')
      .single()

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment record already exists for this term' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('payment_records')
      .insert([
        {
          student_id: studentId,
          term: term || 'First Term',
          session: session || '2024/2025',
          amount_due: amountDue,
          amount_paid: paymentMethod === 'online' ? amountDue : 0,
          payment_method: paymentMethod || 'proof_upload',
          payment_status:
            paymentMethod === 'online' ? 'completed' : 'pending',
          receipt_url: receiptUrl,
          paystack_reference: paystackReference,
          payment_completed_at:
            paymentMethod === 'online'
              ? new Date().toISOString()
              : null,
          proof_uploaded_at:
            paymentMethod === 'proof_upload'
              ? new Date().toISOString()
              : null,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create payment record' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordId, amountPaid, paymentStatus, verifiedBy, remarks } =
      body

    if (!recordId) {
      return NextResponse.json(
        { error: 'recordId is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}

    if (amountPaid !== undefined) {
      updateData.amount_paid = amountPaid
    }

    if (paymentStatus) {
      updateData.payment_status = paymentStatus
      if (paymentStatus === 'verified') {
        updateData.verified_at = new Date().toISOString()
        updateData.verified_by = verifiedBy
      }
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks
    }

    const { data, error } = await supabase
      .from('payment_records')
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update payment record' },
      { status: 500 }
    )
  }
}
