import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

const PAYSTACK_API_URL = 'https://api.paystack.co/transaction/verify'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Paystack configuration is missing' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json(
        { error: 'reference is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${PAYSTACK_API_URL}/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to verify payment' },
        { status: 400 }
      )
    }

    const transaction = data.data

    if (transaction.status === 'success') {
      const metadata = transaction.metadata
      const amount = transaction.amount / 100

      const { data: paymentRecord } = await supabase
        .from('payment_records')
        .select('id')
        .eq('student_id', metadata.student_id)
        .eq('term', metadata.term)
        .eq('session', metadata.session)
        .single()

      if (paymentRecord) {
        const { error } = await supabase
          .from('payment_records')
          .update({
            amount_paid: amount,
            payment_status: 'verified',
            paystack_reference: reference,
            payment_completed_at: new Date().toISOString(),
            verified_at: new Date().toISOString(),
          })
          .eq('id', paymentRecord.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('payment_records')
          .insert([
            {
              student_id: metadata.student_id,
              term: metadata.term,
              session: metadata.session,
              amount_due: amount,
              amount_paid: amount,
              payment_method: 'online',
              payment_status: 'verified',
              paystack_reference: reference,
              payment_completed_at: new Date().toISOString(),
              verified_at: new Date().toISOString(),
            },
          ])

        if (error) throw error
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Payment verified successfully',
          data: {
            reference,
            amount,
            status: 'verified',
          },
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Payment was not successful',
        data: { status: transaction.status },
      },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
