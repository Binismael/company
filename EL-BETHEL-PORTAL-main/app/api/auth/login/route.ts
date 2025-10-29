import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    if (authData.user) {
      // Fetch user details from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .or(`auth_id.eq.${authData.user.id},id.eq.${authData.user.id}`)
        .single()

      if (userError) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          message: 'Login successful',
          user: userData,
          session: authData.session,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
