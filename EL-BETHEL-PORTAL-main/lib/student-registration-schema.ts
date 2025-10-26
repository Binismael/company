import { z } from 'zod'

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti',
  'Enugu', 'Federal Capital Territory', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
  'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
]

export const GUARDIAN_RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Sister', 'Brother', 'Aunt', 'Uncle', 'Other']

export const CLASS_LEVELS = {
  JSS: ['JSS1', 'JSS2', 'JSS3'],
  SSS: ['SSS1', 'SSS2', 'SSS3']
}

export const CLASS_OPTIONS = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']

export const DEPARTMENTS = ['Science', 'Arts', 'Commercial']

export const TERMS = ['1st Term', '2nd Term', '3rd Term']

// Department codes for admission number generation
export const DEPT_CODES = {
  Science: 'S',
  Arts: 'A',
  Commercial: 'C'
}

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
        return age >= 5 && age <= 25
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

// Academic Information Schema (New - Enhanced)
export const academicInfoSchema = z.object({
  classLevel: z
    .enum(CLASS_OPTIONS as [string, ...string[]], {
      errorMap: () => ({ message: 'Please select a class level' })
    }),
  department: z
    .enum(DEPARTMENTS as [string, ...string[]], {
      errorMap: () => ({ message: 'Please select a department' })
    }),
  term: z
    .enum(TERMS as [string, ...string[]], {
      errorMap: () => ({ message: 'Please select a term' })
    }),
  subjects: z
    .array(z.string().uuid('Invalid subject ID'))
    .min(1, 'Please select at least one subject')
    .max(10, 'Maximum 10 subjects allowed'),
})

// Complete Student Registration Schema
export const studentRegistrationSchema = accountInfoSchema
  .merge(personalInfoSchema)
  .merge(contactInfoSchema)
  .merge(guardianInfoSchema)
  .merge(academicInfoSchema)
  .extend({
    admissionNumber: z.string().optional(),
  })

export type StudentRegistrationFormData = z.infer<typeof studentRegistrationSchema>

// Helper function to get class code for admission number (JSS1 -> J1, SSS2 -> S2)
export function getClassCode(classLevel: string): string {
  const match = classLevel.match(/([A-Z]).*(\d)/)
  return match ? match[1] + match[2] : 'XX'
}

// Helper function to validate form by step
export const stepSchemas = {
  account: accountInfoSchema,
  personal: personalInfoSchema,
  contact: contactInfoSchema,
  guardian: guardianInfoSchema,
  academic: academicInfoSchema,
}

export type StepSchemaType = keyof typeof stepSchemas
