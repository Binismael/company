import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name, role } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      // Create user record in users table
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name,
            role,
            password_hash: '', // Handled by Supabase Auth
          },
        ])

      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 400 })
      }

      // If student, create student record
      if (role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert([
            {
              user_id: authData.user.id,
              admission_number: `STU-${Date.now()}`,
            },
          ])

        if (studentError) {
          return NextResponse.json(
            { error: studentError.message },
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        {
          message: 'User created successfully',
          user: authData.user,
          session: authData.session,
        },
        { status: 201 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
