import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import crypto from 'crypto'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      )
    }

    const body = await request.text()
    const hash = request.headers.get('x-paystack-signature')

    if (!hash) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    const computedHash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')

    if (computedHash !== hash) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const transaction = event.data
      const reference = transaction.reference
      const metadata = transaction.metadata
      const amount = transaction.amount / 100

      const { data: existingPayment } = await supabase
        .from('payment_records')
        .select('id')
        .eq('paystack_reference', reference)
        .single()

      if (existingPayment) {
        await supabase
          .from('payment_records')
          .update({
            amount_paid: amount,
            payment_status: 'verified',
            payment_completed_at: new Date().toISOString(),
            verified_at: new Date().toISOString(),
          })
          .eq('id', existingPayment.id)
      } else {
        await supabase
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
      }

      console.log(`✅ Payment verified: ${reference}`)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
