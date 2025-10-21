'use server'

import { supabase } from '@/lib/supabase-client'

/**
 * Check if email already exists in the system
 */
export async function checkEmailUniqueness(email: string): Promise<{
  available: boolean
  message?: string
}> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1)

    if (error) {
      console.error('Error checking email uniqueness:', error)
      return {
        available: false,
        message: 'Unable to verify email. Please try again.',
      }
    }

    const isAvailable = !data || data.length === 0

    return {
      available: isAvailable,
      message: isAvailable ? undefined : 'This email is already registered',
    }
  } catch (error) {
    console.error('Error in checkEmailUniqueness:', error)
    return {
      available: false,
      message: 'An unexpected error occurred',
    }
  }
}

/**
 * Get available classes for student registration
 */
export async function getAvailableClasses(): Promise<
  Array<{ id: string; name: string; form_level: string }> | null
> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, form_level')
      .order('form_level', { ascending: true })

    if (error) {
      console.error('Error fetching classes:', error)
      return null
    }

    return data || []
  } catch (error) {
    console.error('Error in getAvailableClasses:', error)
    return null
  }
}

/**
 * Create a new student registration
 * This should be called from a secure environment
 */
export async function createStudentRegistration(formData: {
  email: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  phone: string
  address: string
  state: string
  lga: string
  classId?: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  guardianRelationship: string
  previousSchool?: string
  photoUrl?: string
  birthCertificateUrl?: string
  idProofUrl?: string
}) {
  try {
    // Verify email doesn't exist
    const { available, message } = await checkEmailUniqueness(formData.email)

    if (!available) {
      return {
        success: false,
        error: message || 'Email already registered',
      }
    }

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email: formData.email.toLowerCase(),
          full_name: `${formData.firstName} ${formData.lastName}`,
          role: 'student',
          password_hash: 'auth_managed', // Password is managed by Supabase Auth
        },
      ])
      .select()

    if (userError || !userData || userData.length === 0) {
      return {
        success: false,
        error: 'Failed to create user account',
      }
    }

    const userId = userData[0].id

    // Create student record
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert([
        {
          user_id: userId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
          phone: formData.phone,
          address: formData.address,
          state: formData.state,
          lga: formData.lga,
          class_id: formData.classId || null,
          guardian_name: formData.guardianName,
          guardian_phone: formData.guardianPhone,
          guardian_email: formData.guardianEmail,
          guardian_relationship: formData.guardianRelationship,
          previous_school: formData.previousSchool || null,
          photo_url: formData.photoUrl || null,
          birth_certificate_url: formData.birthCertificateUrl || null,
          id_proof_url: formData.idProofUrl || null,
          approved: false,
        },
      ])
      .select()

    if (studentError || !studentData || studentData.length === 0) {
      return {
        success: false,
        error: 'Failed to create student record',
      }
    }

    return {
      success: true,
      userId,
      studentId: studentData[0].id,
      admissionNumber: studentData[0].admission_number,
      message: 'Student registered successfully. Awaiting admin approval.',
    }
  } catch (error) {
    console.error('Error in createStudentRegistration:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during registration',
    }
  }
}

/**
 * Get registration statistics (for admin dashboard)
 */
export async function getRegistrationStats() {
  try {
    // Total pending registrations
    const { count: pendingCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('approved', false)

    // Total approved students
    const { count: approvedCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('approved', true)

    // Total students
    const { count: totalCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    return {
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      total: totalCount || 0,
    }
  } catch (error) {
    console.error('Error fetching registration stats:', error)
    return {
      pending: 0,
      approved: 0,
      total: 0,
    }
  }
}

/**
 * Approve a student registration (admin only)
 */
export async function approveStudentRegistration(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({ approved: true })
      .eq('id', studentId)
      .select()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error approving student:', error)
    return {
      success: false,
      error: 'Failed to approve student',
    }
  }
}

/**
 * Reject a student registration (admin only)
 */
export async function rejectStudentRegistration(studentId: string, reason?: string) {
  try {
    // Get student info first
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single()

    if (fetchError || !student) {
      return {
        success: false,
        error: 'Student not found',
      }
    }

    // Delete student record (cascades will handle auth user)
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message,
      }
    }

    return {
      success: true,
      message: 'Student registration rejected successfully',
    }
  } catch (error) {
    console.error('Error rejecting student:', error)
    return {
      success: false,
      error: 'Failed to reject student registration',
    }
  }
}
