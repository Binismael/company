'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  studentRegistrationSchema, 
  type StudentRegistrationFormData,
  NIGERIAN_STATES,
  GUARDIAN_RELATIONSHIPS,
  CLASS_OPTIONS,
} from '@/lib/student-registration-validation'
import { 
  registerStudent, 
  fetchClasses,
  checkEmailExists,
} from '@/lib/student-registration-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff,
  FileUp,
  GraduationCap,
} from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { id: 'account', label: 'Account', icon: '📧' },
  { id: 'personal', label: 'Personal', icon: '👤' },
  { id: 'contact', label: 'Contact', icon: '📍' },
  { id: 'guardian', label: 'Guardian', icon: '👨‍👩‍👧' },
  { id: 'academic', label: 'Academic', icon: '📚' },
  { id: 'documents', label: 'Documents', icon: '📄' },
]

export default function StudentRegistration() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState('account')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState<Array<{ id: string; name: string; form_level: string }>>([])
  const [uploadedFiles, setUploadedFiles] = useState<{
    photo?: File
    birthCertificate?: File
    idProof?: File
  }>({})

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting },
    watch,
    setValue,
    trigger,
  } = useForm<StudentRegistrationFormData & { photo?: File; birthCertificate?: File; idProof?: File }>({
    resolver: zodResolver(studentRegistrationSchema),
    mode: 'onBlur',
  })

  const passwordValue = watch('password')
  const emailValue = watch('email')

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      const classesData = await fetchClasses()
      setClasses(classesData)
    }
    loadClasses()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'photo' | 'birthCertificate' | 'idProof') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${fieldName} file must be less than 5MB`)
        return
      }

      setUploadedFiles((prev) => ({
        ...prev,
        [fieldName]: file,
      }))
      toast.success(`${fieldName} selected`)
    }
  }

  const validateEmail = async () => {
    if (!emailValue) return true
    const exists = await checkEmailExists(emailValue)
    if (exists) {
      toast.error('Email already registered')
      return false
    }
    return true
  }

  const handleStepChange = async (newStep: string) => {
    // Validate current step before moving
    const stepFields = getStepFields(currentStep)
    const isValid = await trigger(stepFields as any)

    if (isValid || currentStep === 'documents') {
      // Special validation for email
      if (currentStep === 'account') {
        const emailValid = await validateEmail()
        if (!emailValid) return
      }
      setCurrentStep(newStep)
    } else {
      toast.error('Please fix the errors in this section')
    }
  }

  const getStepFields = (step: string) => {
    const fieldMap: Record<string, string[]> = {
      account: ['email', 'password', 'confirmPassword'],
      personal: ['firstName', 'lastName', 'gender', 'dateOfBirth'],
      contact: ['phone', 'address', 'state', 'lga'],
      guardian: ['guardianName', 'guardianPhone', 'guardianEmail', 'guardianRelationship'],
      academic: ['classId', 'previousSchool'],
    }
    return fieldMap[step] || []
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((step, index) => {
          const stepIndex = STEPS.findIndex((s) => s.id === step.id)
          const currentIndex = STEPS.findIndex((s) => s.id === currentStep)
          const isCompleted = stepIndex < currentIndex
          const isCurrent = step.id === currentStep

          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => handleStepChange(step.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  isCurrent
                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                    : isCompleted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                } hover:shadow-md`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Step {STEPS.findIndex((s) => s.id === currentStep) + 1} of {STEPS.length}
        </span>
        <span className="font-medium">
          {STEPS.find((s) => s.id === currentStep)?.label}
        </span>
      </div>
    </div>
  )

  const onSubmit: SubmitHandler<StudentRegistrationFormData & { photo?: File; birthCertificate?: File; idProof?: File }> = async (data) => {
    setIsSubmitting(true)
    try {
      const result = await registerStudent(data, uploadedFiles)

      if (result.success) {
        toast.success(result.message)
        setTimeout(() => {
          router.push('/auth/login?message=registration-pending')
        }, 2000)
      } else {
        toast.error(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderAccountStep = () => (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>

      <div>
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="student@example.com"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters with uppercase, lowercase, and numbers"
            {...register('password')}
            className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Password Requirements</AlertTitle>
        <AlertDescription>
          Must be at least 8 characters with uppercase, lowercase, and numbers
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderPersonalStep = () => (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            placeholder="John"
            {...register('firstName')}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            {...register('lastName')}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gender">Gender *</Label>
          <Select defaultValue="" onValueChange={(value) => setValue('gender', value as any)}>
            <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-sm text-red-500 mt-1">{errors.gender.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            {...register('dateOfBirth')}
            className={errors.dateOfBirth ? 'border-red-500' : ''}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth.message}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderContactStep = () => (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          placeholder="+234 800 000 0000"
          {...register('phone')}
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          placeholder="Street address and city"
          {...register('address')}
          className={errors.address ? 'border-red-500' : ''}
        />
        {errors.address && (
          <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="state">State *</Label>
          <Select defaultValue="" onValueChange={(value) => setValue('state', value as any)}>
            <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {NIGERIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lga">LGA *</Label>
          <Input
            id="lga"
            placeholder="Local Government Area"
            {...register('lga')}
            className={errors.lga ? 'border-red-500' : ''}
          />
          {errors.lga && (
            <p className="text-sm text-red-500 mt-1">{errors.lga.message}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderGuardianStep = () => (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h2>

      <div>
        <Label htmlFor="guardianName">Guardian Full Name *</Label>
        <Input
          id="guardianName"
          placeholder="Guardian's full name"
          {...register('guardianName')}
          className={errors.guardianName ? 'border-red-500' : ''}
        />
        {errors.guardianName && (
          <p className="text-sm text-red-500 mt-1">{errors.guardianName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="guardianPhone">Phone Number *</Label>
          <Input
            id="guardianPhone"
            placeholder="+234 800 000 0000"
            {...register('guardianPhone')}
            className={errors.guardianPhone ? 'border-red-500' : ''}
          />
          {errors.guardianPhone && (
            <p className="text-sm text-red-500 mt-1">{errors.guardianPhone.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="guardianEmail">Email Address *</Label>
          <Input
            id="guardianEmail"
            type="email"
            placeholder="guardian@example.com"
            {...register('guardianEmail')}
            className={errors.guardianEmail ? 'border-red-500' : ''}
          />
          {errors.guardianEmail && (
            <p className="text-sm text-red-500 mt-1">{errors.guardianEmail.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="guardianRelationship">Relationship *</Label>
        <Select defaultValue="" onValueChange={(value) => setValue('guardianRelationship', value as any)}>
          <SelectTrigger className={errors.guardianRelationship ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select Relationship" />
          </SelectTrigger>
          <SelectContent>
            {GUARDIAN_RELATIONSHIPS.map((rel) => (
              <SelectItem key={rel} value={rel}>
                {rel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.guardianRelationship && (
          <p className="text-sm text-red-500 mt-1">{errors.guardianRelationship.message}</p>
        )}
      </div>
    </div>
  )

  const renderAcademicStep = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Academic Information</h2>
      </div>

      <div>
        <Label htmlFor="classId">Class (Optional)</Label>
        <Select defaultValue="" onValueChange={(value) => setValue('classId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None - To be assigned</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name} ({cls.form_level})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="previousSchool">Previous School (Optional)</Label>
        <Input
          id="previousSchool"
          placeholder="Name of previous school"
          {...register('previousSchool')}
        />
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Admission Number</AlertTitle>
        <AlertDescription>
          Your admission number will be automatically generated and assigned upon admin approval
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderDocumentsStep = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <FileUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Document Upload</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">Upload supporting documents (optional but recommended)</p>

      {/* Passport Photo */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'photo')}
          className="hidden"
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className="cursor-pointer block">
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm font-medium text-gray-900">
              {uploadedFiles.photo ? uploadedFiles.photo.name : 'Upload Passport Photo'}
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
          </div>
        </label>
      </div>

      {/* Birth Certificate */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => handleFileChange(e, 'birthCertificate')}
          className="hidden"
          id="birth-cert-upload"
        />
        <label htmlFor="birth-cert-upload" className="cursor-pointer block">
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm font-medium text-gray-900">
              {uploadedFiles.birthCertificate ? uploadedFiles.birthCertificate.name : 'Upload Birth Certificate'}
            </p>
            <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB (Optional)</p>
          </div>
        </label>
      </div>

      {/* ID Proof */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => handleFileChange(e, 'idProof')}
          className="hidden"
          id="id-proof-upload"
        />
        <label htmlFor="id-proof-upload" className="cursor-pointer block">
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm font-medium text-gray-900">
              {uploadedFiles.idProof ? uploadedFiles.idProof.name : 'Upload ID Proof'}
            </p>
            <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB (Optional)</p>
          </div>
        </label>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Document Upload</AlertTitle>
        <AlertDescription>
          All document uploads are optional. However, providing them helps speed up the approval process
        </AlertDescription>
      </Alert>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F291857ff22134997b4885aff7248bbb5%2Fee4263e9927d42dba9246b8809a43ad7?format=webp&width=800"
              alt="El Bethel Academy Logo"
              className="h-16 w-16"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1">El Bethel Academy</h1>
          <p className="text-sm text-gray-500 mb-2">Minna</p>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Student Registration</h2>
          <p className="text-gray-600">Create your account and register to access the school portal</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-lg">
            <CardTitle className="text-white">Registration Form</CardTitle>
            <CardDescription className="text-blue-100">
              Complete all sections to register. Fields marked with * are required
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            {renderStepIndicator()}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 'account' && renderAccountStep()}
              {currentStep === 'personal' && renderPersonalStep()}
              {currentStep === 'contact' && renderContactStep()}
              {currentStep === 'guardian' && renderGuardianStep()}
              {currentStep === 'academic' && renderAcademicStep()}
              {currentStep === 'documents' && renderDocumentsStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4 pt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentIndex = STEPS.findIndex((s) => s.id === currentStep)
                    if (currentIndex > 0) {
                      setCurrentStep(STEPS[currentIndex - 1].id)
                    }
                  }}
                  disabled={currentStep === 'account'}
                >
                  Previous
                </Button>

                {currentStep === 'documents' ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting || formSubmitting}
                    className="flex-1"
                    size="lg"
                  >
                    {isSubmitting || formSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      const currentIndex = STEPS.findIndex((s) => s.id === currentStep)
                      if (currentIndex < STEPS.length - 1) {
                        handleStepChange(STEPS[currentIndex + 1].id)
                      }
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Next
                  </Button>
                )}
              </div>

              {/* Login Link */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Already registered?{' '}
                  <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
