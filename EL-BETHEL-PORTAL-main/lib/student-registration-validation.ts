import { z } from 'zod'

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti',
  'Enugu', 'Federal Capital Territory', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
  'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
]

const GUARDIAN_RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Sister', 'Brother', 'Aunt', 'Uncle', 'Other']

const CLASS_OPTIONS = [
  'JSS1', 'JSS2', 'JSS3',
  'SSS1', 'SSS2', 'SSS3'
]

// Account Information Schema
export const accountInfoSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and numbers'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Personal Information Schema
export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  gender: z
    .enum(['Male', 'Female', 'Other'], {
      errorMap: () => ({ message: 'Please select a gender' })
    }),
  dateOfBirth: z
    .string()
    .refine(
      (date) => {
        const birthDate = new Date(date)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        return age >= 5 && age <= 25 // Reasonable age range for student
      },
      'Please enter a valid date of birth (student should be between 5-25 years)'
    ),
})

// Contact Information Schema
export const contactInfoSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number'),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address must be less than 255 characters'),
  state: z
    .enum(NIGERIAN_STATES as [string, ...string[]], {
      errorMap: () => ({ message: 'Please select a valid state' })
    }),
  lga: z
    .string()
    .min(2, 'LGA must be at least 2 characters')
    .max(100, 'LGA must be less than 100 characters'),
})

// Guardian Information Schema
export const guardianInfoSchema = z.object({
  guardianName: z
    .string()
    .min(2, 'Guardian name must be at least 2 characters')
    .max(100, 'Guardian name must be less than 100 characters'),
  guardianPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number'),
  guardianEmail: z
    .string()
    .email('Please enter a valid email address'),
  guardianRelationship: z
    .enum(GUARDIAN_RELATIONSHIPS as [string, ...string[]], {
      errorMap: () => ({ message: 'Please select a valid relationship' })
    }),
})

// Academic Information Schema
export const academicInfoSchema = z.object({
  classId: z.string().optional(),
  previousSchool: z
    .string()
    .max(255, 'School name must be less than 255 characters')
    .optional()
    .or(z.literal('')),
})

// File Schema
export const fileSchema = z.object({
  photo: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'Passport photo must be less than 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Passport photo must be JPEG, PNG, or WebP'
    )
    .optional(),
  birthCertificate: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'Birth certificate must be less than 5MB'
    )
    .optional(),
  idProof: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'ID proof must be less than 5MB'
    )
    .optional(),
}).partial()

// Complete Registration Form Schema
export const studentRegistrationSchema = accountInfoSchema
  .merge(personalInfoSchema)
  .merge(contactInfoSchema)
  .merge(guardianInfoSchema)
  .merge(academicInfoSchema)

// Type exports
export type StudentRegistrationFormData = z.infer<typeof studentRegistrationSchema>
export type AccountInfoFormData = z.infer<typeof accountInfoSchema>
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>
export type ContactInfoFormData = z.infer<typeof contactInfoSchema>
export type GuardianInfoFormData = z.infer<typeof guardianInfoSchema>
export type AcademicInfoFormData = z.infer<typeof academicInfoSchema>
export type FileUploadData = z.infer<typeof fileSchema>

// Helper: Nigerian States
export { NIGERIAN_STATES, GUARDIAN_RELATIONSHIPS, CLASS_OPTIONS }

// Helper: Validate email uniqueness (call from server action)
export async function isEmailUnique(email: string, supabase: any): Promise<boolean> {
  try {
    const { data: existingUsers, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1)

    if (error) {
      console.error('Error checking email uniqueness:', error)
      return false
    }

    return !existingUsers || existingUsers.length === 0
  } catch {
    return false
  }
}
