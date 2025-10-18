import { supabase } from './supabase-client'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'bursar'
}

export interface SignUpData {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'bursar'
}

export interface SignInData {
  email: string
  password: string
}

// Hash password using Supabase Auth (recommended approach)
// Note: Supabase Auth handles password hashing automatically
export const hashPassword = async (password: string): Promise<string> => {
  // This is a placeholder - Supabase Auth handles this server-side
  return password
}

// Sign up new user
export const signUp = async (data: SignUpData) => {
  try {
    // Use Supabase Auth for user registration
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
        },
      },
    })

    if (authError) throw authError

    // Create user record in users table
    if (authData.user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: data.email,
            full_name: data.full_name,
            role: data.role,
            password_hash: '', // Handled by Supabase Auth
          },
        ])

      if (dbError) throw dbError

      // If student, create student record
      if (data.role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert([
            {
              user_id: authData.user.id,
              admission_number: `STU-${Date.now()}`,
            },
          ])

        if (studentError) throw studentError
      }

      return { user: authData.user, session: authData.session }
    }
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

// Sign in user
export const signIn = async (data: SignInData) => {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) throw error

    if (authData.user) {
      // Fetch user details from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError) throw userError

      return {
        user: userData,
        session: authData.session,
      }
    }
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

// Sign out user
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// Get current user
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return userData as AuthUser
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Get user session
export const getSession = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<AuthUser>
) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Update profile error:', error)
    throw error
  }
}

// Verify user email (if needed)
export const verifyEmail = async (token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Email verification error:', error)
    throw error
  }
}

// Reset password
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
  } catch (error) {
    console.error('Reset password error:', error)
    throw error
  }
}

// Update password
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  } catch (error) {
    console.error('Update password error:', error)
    throw error
  }
}
