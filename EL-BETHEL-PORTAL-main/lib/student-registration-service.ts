import { supabase } from './supabase-client'
import type { StudentRegistrationFormData } from './student-registration-validation'

interface UploadedFiles {
  photoUrl?: string
  birthCertificateUrl?: string
  idProofUrl?: string
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFileToStorage(
  file: File,
  userId: string,
  fileType: 'photo' | 'birth_cert' | 'id_proof'
): Promise<string | null> {
  try {
    const fileName = `${fileType}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const path = `student-documents/${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('student-documents')
      .upload(path, file, { upsert: true })

    if (error) {
      console.error(`Error uploading ${fileType}:`, error)
      return null
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('student-documents')
      .getPublicUrl(path)

    return publicUrlData?.publicUrl || null
  } catch (error) {
    console.error(`Error uploading ${fileType}:`, error)
    return null
  }
}

/**
 * Upload multiple files and return URLs
 */
export async function uploadStudentDocuments(
  userId: string,
  files: {
    photo?: File
    birthCertificate?: File
    idProof?: File
  }
): Promise<UploadedFiles> {
  const uploadedFiles: UploadedFiles = {}

  try {
    if (files.photo) {
      uploadedFiles.photoUrl = await uploadFileToStorage(files.photo, userId, 'photo')
    }

    if (files.birthCertificate) {
      uploadedFiles.birthCertificateUrl = await uploadFileToStorage(
        files.birthCertificate,
        userId,
        'birth_cert'
      )
    }

    if (files.idProof) {
      uploadedFiles.idProofUrl = await uploadFileToStorage(files.idProof, userId, 'id_proof')
    }

    return uploadedFiles
  } catch (error) {
    console.error('Error uploading student documents:', error)
    return uploadedFiles
  }
}

/**
 * Create student user and registration record
 */
export async function registerStudent(
  formData: StudentRegistrationFormData,
  files?: {
    photo?: File
    birthCertificate?: File
    idProof?: File
  }
) {
  try {
    // 1. Sign up user with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
        },
      },
    })

    if (signUpError) {
      throw new Error(`Authentication error: ${signUpError.message}`)
    }

    const userId = authData?.user?.id
    if (!userId) {
      throw new Error('Failed to create user account')
    }

    // 2. Create user record in public.users table
    const { error: userError } = await supabase.from('users').insert([
      {
        id: userId,
        email: formData.email.toLowerCase(),
        full_name: `${formData.firstName} ${formData.lastName}`,
        role: 'student',
      },
    ])

    if (userError) {
      // Clean up auth user if user table insert fails
      await supabase.auth.admin.deleteUser(userId)
      throw new Error(`User record creation failed: ${userError.message}`)
    }

    // 3. Upload files if provided
    let uploadedFiles: UploadedFiles = {}
    if (files && (files.photo || files.birthCertificate || files.idProof)) {
      uploadedFiles = await uploadStudentDocuments(userId, files)
    }

    // 4. Insert student record
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
          photo_url: uploadedFiles.photoUrl || null,
          birth_certificate_url: uploadedFiles.birthCertificateUrl || null,
          id_proof_url: uploadedFiles.idProofUrl || null,
          approved: false, // Admin approval required
        },
      ])
      .select()

    if (studentError) {
      throw new Error(`Student record creation failed: ${studentError.message}`)
    }

    return {
      success: true,
      userId,
      studentId: studentData?.[0]?.id,
      admissionNumber: studentData?.[0]?.admission_number,
      message: 'Registration successful! Please wait for admin approval.',
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed. Please try again.',
    }
  }
}

/**
 * Fetch classes for selection dropdown
 */
export async function fetchClasses() {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, form_level')
      .order('form_level', { ascending: true })

    if (error) {
      console.error('Error fetching classes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching classes:', error)
    return []
  }
}

/**
 * Check if email already exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1)

    if (error) {
      console.error('Error checking email:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Error checking email:', error)
    return false
  }
}

/**
 * Get pending students awaiting approval (for admin)
 */
export async function getPendingStudents() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        admission_number,
        first_name,
        last_name,
        email,
        gender,
        date_of_birth,
        created_at,
        users!inner(email)
      `)
      .eq('approved', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending students:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching pending students:', error)
    return []
  }
}

/**
 * Approve student registration (admin only)
 */
export async function approveStudent(studentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('students')
      .update({ approved: true })
      .eq('id', studentId)

    if (error) {
      console.error('Error approving student:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error approving student:', error)
    return false
  }
}

/**
 * Reject student registration (admin only)
 */
export async function rejectStudent(studentId: string, reason?: string): Promise<boolean> {
  try {
    // First get student's user_id
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single()

    if (fetchError || !student?.user_id) {
      console.error('Error fetching student:', fetchError)
      return false
    }

    // Delete student record
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)

    if (deleteError) {
      console.error('Error deleting student record:', deleteError)
      return false
    }

    // Delete associated user (optional - depends on policy)
    // await supabase.auth.admin.deleteUser(student.user_id)

    return true
  } catch (error) {
    console.error('Error rejecting student:', error)
    return false
  }
}
