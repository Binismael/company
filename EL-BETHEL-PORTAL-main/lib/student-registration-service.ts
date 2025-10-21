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
 * Create student user and registration record with auto-generated admission number
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
        password_hash: '', // Will be managed by Supabase Auth
      },
    ])

    if (userError && !userError.message.includes('duplicate')) {
      // Clean up auth user if user table insert fails (ignore duplicate key errors)
      await supabase.auth.admin.deleteUser(userId)
      throw new Error(`User record creation failed: ${userError.message}`)
    }

    // 3. Upload files if provided
    let uploadedFiles: UploadedFiles = {}
    if (files && (files.photo || files.birthCertificate || files.idProof)) {
      uploadedFiles = await uploadStudentDocuments(userId, files)
    }

    // 4. Insert student record with auto-generated admission number via trigger
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

    const student = studentData?.[0]
    const admissionNumber = student?.admission_number

    // 5. Create approval record for tracking
    const { error: approvalError } = await supabase
      .from('student_approvals')
      .insert([
        {
          student_id: student?.id,
          status: 'pending',
          comments: 'Awaiting admin review and approval',
        },
      ])

    if (approvalError) {
      console.warn('Failed to create approval record:', approvalError)
      // Don't fail the entire registration for this
    }

    return {
      success: true,
      userId,
      studentId: student?.id,
      admissionNumber,
      message: `Registration successful! Your admission number is ${admissionNumber}. Please wait for admin approval.`,
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
      .from('pending_student_registrations')
      .select('*')
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
 * Get student details with documents (for admin review)
 */
export async function getStudentWithDocuments(studentId: string) {
  try {
    const [studentRes, docsRes, approvalRes] = await Promise.all([
      supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single(),
      supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId),
      supabase
        .from('student_approvals')
        .select('*')
        .eq('student_id', studentId)
        .single(),
    ])

    if (studentRes.error) throw studentRes.error

    return {
      student: studentRes.data,
      documents: docsRes.data || [],
      approval: approvalRes.data,
    }
  } catch (error) {
    console.error('Error fetching student details:', error)
    return null
  }
}

/**
 * Approve student registration with admin comment (admin only)
 */
export async function approveStudent(
  studentId: string,
  adminId: string,
  comments?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use RPC function for approval
    const { data, error } = await supabase.rpc('approve_student_registration', {
      p_student_id: studentId,
      p_admin_id: adminId,
      p_comments: comments || null,
    })

    if (error) {
      throw new Error(error.message)
    }

    return { success: data === true }
  } catch (error) {
    console.error('Error approving student:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve student',
    }
  }
}

/**
 * Reject student registration with reason (admin only)
 */
export async function rejectStudent(
  studentId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use RPC function for rejection
    const { data, error } = await supabase.rpc('reject_student_registration', {
      p_student_id: studentId,
      p_admin_id: adminId,
      p_reason: reason,
    })

    if (error) {
      throw new Error(error.message)
    }

    return { success: data === true }
  } catch (error) {
    console.error('Error rejecting student:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject student',
    }
  }
}

/**
 * Get student registration statistics (for admin dashboard)
 */
export async function getStudentRegistrationStats() {
  try {
    const [totalRes, approvedRes, pendingRes, rejectedRes] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('approved', true),
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('approved', false),
      supabase
        .from('student_approvals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rejected'),
    ])

    return {
      total: totalRes.count || 0,
      approved: approvedRes.count || 0,
      pending: pendingRes.count || 0,
      rejected: rejectedRes.count || 0,
    }
  } catch (error) {
    console.error('Error fetching registration stats:', error)
    return {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    }
  }
}
