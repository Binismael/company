import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

interface TeacherRegistrationData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  qualification?: string
  assignedClasses?: string[]
  assignedSubjects?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: TeacherRegistrationData = await request.json()

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      qualification,
      assignedClasses = [],
      assignedSubjects = [],
    } = body

    // Validation
    if (!firstName?.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!lastName?.trim()) {
      return NextResponse.json(
        { error: 'Last name is required' },
        { status: 400 }
      )
    }

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Step 1: Create Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Step 2: Create user profile
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      auth_id: userId,
      email,
      full_name: `${firstName} ${lastName}`,
      role: 'teacher',
      phone_number: phone,
    })

    if (userError) {
      console.error('Error creating user profile:', userError)
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + userError.message },
        { status: 500 }
      )
    }

    // Step 3: Assign classes and subjects to teacher
    const assignments = []

    // Get all valid class-subject combinations
    if (assignedClasses.length > 0 && assignedSubjects.length > 0) {
      for (const classId of assignedClasses) {
        for (const subjectId of assignedSubjects) {
          // Verify that this class-subject combination exists
          const { data: classSubjectData } = await supabase
            .from('class_subjects')
            .select('id')
            .eq('class_id', classId)
            .eq('subject_id', subjectId)
            .single()

          if (classSubjectData) {
            assignments.push({
              class_id: classId,
              subject_id: subjectId,
              teacher_id: userId,
            })
          }
        }
      }

      // If we have valid assignments, update class_subjects records
      if (assignments.length > 0) {
        for (const assignment of assignments) {
          await supabase
            .from('class_subjects')
            .update({ teacher_id: userId })
            .eq('class_id', assignment.class_id)
            .eq('subject_id', assignment.subject_id)
        }
      }
    }

    // Step 4: Store additional teacher info in a JSON field if available
    // or update the users table with qualification
    if (qualification) {
      await supabase
        .from('users')
        .update({ metadata: { qualification } })
        .eq('id', userId)
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher registered successfully!',
      data: {
        userId,
        email,
        fullName: `${firstName} ${lastName}`,
        classesAssigned: assignedClasses.length,
        subjectsAssigned: assignedSubjects.length,
      },
    })
  } catch (error: any) {
    console.error('Teacher registration error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
