import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

const PAYSTACK_API_URL = 'https://api.paystack.co/transaction/initialize'
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
    const { studentId, amount, email, term, session } = body

    if (!studentId || !amount || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: studentData } = await supabase
      .from('students')
      .select(`
        user:users(full_name, email),
        admission_number
      `)
      .eq('id', studentId)
      .single()

    if (!studentData) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    const response = await fetch(PAYSTACK_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        metadata: {
          student_id: studentId,
          admission_number: studentData.admission_number,
          full_name: studentData.user?.full_name,
          term: term || 'First Term',
          session: session || '2024/2025',
          payment_type: 'school_fees',
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to initialize payment' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        data: {
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
