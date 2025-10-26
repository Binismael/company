'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  studentRegistrationSchema,
  type StudentRegistrationFormData,
  NIGERIAN_STATES,
  GUARDIAN_RELATIONSHIPS,
  CLASS_OPTIONS,
  DEPARTMENTS,
  TERMS,
} from '@/lib/student-registration-schema'
import {
  generateAdmissionNumber,
  fetchSubjectsByFilter,
  formatAdmissionNumberForDisplay,
  getDefaultSubjectsForDepartment,
} from '@/lib/student-registration-utils'
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
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Upload,
  GraduationCap,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { id: 'account', label: 'Account', icon: '📧' },
  { id: 'personal', label: 'Personal', icon: '👤' },
  { id: 'contact', label: 'Contact', icon: '📍' },
  { id: 'guardian', label: 'Guardian', icon: '👨‍👩‍👧' },
  { id: 'academic', label: 'Academic', icon: '📚' },
  { id: 'review', label: 'Review', icon: '✅' },
]

interface SubjectOption {
  id: string
  name: string
  code: string
  class_level?: string
  department?: string
  term?: string
}

export default function EnhancedStudentRegistration() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState('account')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [admissionNumber, setAdmissionNumber] = useState<string>('')
  const [generatingAdmission, setGeneratingAdmission] = useState(false)
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{
    passport?: File
    birthCertificate?: File
    idProof?: File
  }>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<StudentRegistrationFormData>({
    resolver: zodResolver(studentRegistrationSchema),
    mode: 'onBlur',
  })

  const classLevelValue = watch('classLevel')
  const departmentValue = watch('department')
  const termValue = watch('term')
  const passwordValue = watch('password')
  const selectedSubjects = watch('subjects')

  // Auto-generate admission number when class level or department changes
  useEffect(() => {
    if (classLevelValue && departmentValue) {
      generateAdmissionNumberAutomatic()
    }
  }, [classLevelValue, departmentValue])

  // Fetch subjects when class level, department, or term changes
  useEffect(() => {
    if (classLevelValue && departmentValue && termValue) {
      fetchSubjects()
    }
  }, [classLevelValue, departmentValue, termValue])

  const generateAdmissionNumberAutomatic = useCallback(async () => {
    if (!classLevelValue || !departmentValue) return

    setGeneratingAdmission(true)
    try {
      const newAdmissionNumber = await generateAdmissionNumber(classLevelValue, departmentValue)
      setAdmissionNumber(newAdmissionNumber)
      setValue('admissionNumber', newAdmissionNumber)
    } catch (error) {
      console.error('Error generating admission number:', error)
      toast.error('Failed to generate admission number')
    } finally {
      setGeneratingAdmission(false)
    }
  }, [classLevelValue, departmentValue, setValue])

  const fetchSubjects = useCallback(async () => {
    if (!classLevelValue || !departmentValue || !termValue) return

    setLoadingSubjects(true)
    try {
      const fetchedSubjects = await fetchSubjectsByFilter(
        classLevelValue,
        departmentValue,
        termValue
      )
      setSubjects(fetchedSubjects)

      // Auto-select default subjects if none selected
      if (selectedSubjects.length === 0 && fetchedSubjects.length > 0) {
        const defaultSubjectNames = getDefaultSubjectsForDepartment(departmentValue)
        const defaultSubjectIds = fetchedSubjects
          .filter((s) => defaultSubjectNames.includes(s.name))
          .map((s) => s.id)
          .slice(0, 5) // Max 5 subjects

        if (defaultSubjectIds.length > 0) {
          setValue('subjects', defaultSubjectIds)
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      toast.error('Failed to load subjects')
    } finally {
      setLoadingSubjects(false)
    }
  }, [classLevelValue, departmentValue, termValue, selectedSubjects, setValue])

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'passport' | 'birthCertificate' | 'idProof'
  ) => {
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
    }
  }

  const handleSubjectToggle = (subjectId: string) => {
    const currentSubjects = selectedSubjects || []
    if (currentSubjects.includes(subjectId)) {
      setValue(
        'subjects',
        currentSubjects.filter((id) => id !== subjectId)
      )
    } else {
      if (currentSubjects.length < 10) {
        setValue('subjects', [...currentSubjects, subjectId])
      } else {
        toast.error('Maximum 10 subjects allowed')
      }
    }
  }

  const handleNextStep = async () => {
    const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
    if (currentStepIndex < STEPS.length - 1) {
      const isValid = await trigger()
      if (isValid) {
        setCurrentStep(STEPS[currentStepIndex + 1].id)
      }
    }
  }

  const handlePreviousStep = () => {
    const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id)
    }
  }

  const onSubmit = async (data: StudentRegistrationFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()

      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v, i) => formData.append(`${key}[${i}]`, v))
        } else {
          formData.append(key, String(value))
        }
      })

      // Add uploaded files
      if (uploadedFiles.passport) {
        formData.append('passport', uploadedFiles.passport)
      }
      if (uploadedFiles.birthCertificate) {
        formData.append('birthCertificate', uploadedFiles.birthCertificate)
      }
      if (uploadedFiles.idProof) {
        formData.append('idProof', uploadedFiles.idProof)
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Registration successful! Please check your email to verify your account.')
        router.push('/auth/login')
      } else {
        toast.error(result.error || 'Registration failed')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'An error occurred during registration')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">El Bethel Academy</h1>
          </div>
          <p className="text-lg text-gray-600">Student Registration</p>
        </div>

        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep
              const isCompleted = STEPS.findIndex((s) => s.id === currentStep) > index

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-300'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                  </div>
                  <p
                    className={`text-xs font-medium text-center ${
                      isActive ? 'text-indigo-600 font-bold' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Connector Line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 mt-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{STEPS.find((s) => s.id === currentStep)?.label} Information</CardTitle>
            <CardDescription>
              {currentStep === 'account' && 'Create your account with email and password'}
              {currentStep === 'personal' && 'Tell us about yourself'}
              {currentStep === 'contact' && 'Where can we reach you?'}
              {currentStep === 'guardian' && 'Guardian or parent information'}
              {currentStep === 'academic' && 'Academic details and subject selection'}
              {currentStep === 'review' && 'Review your information before submitting'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Account Step */}
              {currentStep === 'account' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...register('email')}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('password')}
                        className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('confirmPassword')}
                        className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Personal Step */}
              {currentStep === 'personal' && (
                <div className="space-y-4">
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
                        <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>
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
                        <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <select
                        id="gender"
                        {...register('gender')}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors.gender ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && (
                        <p className="text-xs text-red-600 mt-1">{errors.gender.message}</p>
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
                        <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Step */}
              {currentStep === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      {...register('phone')}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street"
                      {...register('address')}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <select
                        id="state"
                        {...register('state')}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors.state ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {errors.state && (
                        <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="lga">Local Government Area *</Label>
                      <Input
                        id="lga"
                        placeholder="LGA"
                        {...register('lga')}
                        className={errors.lga ? 'border-red-500' : ''}
                      />
                      {errors.lga && (
                        <p className="text-xs text-red-600 mt-1">{errors.lga.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Guardian Step */}
              {currentStep === 'guardian' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="guardianName">Guardian/Parent Name *</Label>
                    <Input
                      id="guardianName"
                      placeholder="Full name"
                      {...register('guardianName')}
                      className={errors.guardianName ? 'border-red-500' : ''}
                    />
                    {errors.guardianName && (
                      <p className="text-xs text-red-600 mt-1">{errors.guardianName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guardianRelationship">Relationship *</Label>
                      <select
                        id="guardianRelationship"
                        {...register('guardianRelationship')}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors.guardianRelationship ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select relationship</option>
                        {GUARDIAN_RELATIONSHIPS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {errors.guardianRelationship && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.guardianRelationship.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="guardianPhone">Phone Number *</Label>
                      <Input
                        id="guardianPhone"
                        type="tel"
                        placeholder="+234 800 000 0000"
                        {...register('guardianPhone')}
                        className={errors.guardianPhone ? 'border-red-500' : ''}
                      />
                      {errors.guardianPhone && (
                        <p className="text-xs text-red-600 mt-1">{errors.guardianPhone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guardianEmail">Email Address *</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      placeholder="email@example.com"
                      {...register('guardianEmail')}
                      className={errors.guardianEmail ? 'border-red-500' : ''}
                    />
                    {errors.guardianEmail && (
                      <p className="text-xs text-red-600 mt-1">{errors.guardianEmail.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Academic Step */}
              {currentStep === 'academic' && (
                <div className="space-y-6">
                  {/* Admission Number - Auto Generated */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <Label className="font-semibold text-blue-900">Admission Number</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={admissionNumber}
                        disabled
                        className="bg-white"
                        placeholder="Auto-generated"
                      />
                      {generatingAdmission && <Loader2 className="w-4 h-4 animate-spin" />}
                    </div>
                    {admissionNumber && (
                      <p className="text-xs text-blue-600 mt-2">
                        Formatted: {formatAdmissionNumberForDisplay(admissionNumber)}
                      </p>
                    )}
                  </div>

                  {/* Class Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="classLevel">Class Level *</Label>
                      <select
                        id="classLevel"
                        {...register('classLevel')}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors.classLevel ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select class level</option>
                        {CLASS_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.classLevel && (
                        <p className="text-xs text-red-600 mt-1">{errors.classLevel.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <select
                        id="department"
                        {...register('department')}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors.department ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select department</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      {errors.department && (
                        <p className="text-xs text-red-600 mt-1">{errors.department.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Term */}
                  <div>
                    <Label htmlFor="term">Term *</Label>
                    <select
                      id="term"
                      {...register('term')}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.term ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select term</option>
                      {TERMS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {errors.term && (
                      <p className="text-xs text-red-600 mt-1">{errors.term.message}</p>
                    )}
                  </div>

                  {/* Subjects */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4" />
                      Select Subjects *
                      {loadingSubjects && <Loader2 className="w-4 h-4 animate-spin" />}
                    </Label>

                    {subjects.length > 0 ? (
                      <div className="space-y-3 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                        {subjects.map((subject) => (
                          <div key={subject.id} className="flex items-center gap-3">
                            <Checkbox
                              id={subject.id}
                              checked={selectedSubjects?.includes(subject.id) || false}
                              onCheckedChange={() => handleSubjectToggle(subject.id)}
                            />
                            <Label htmlFor={subject.id} className="cursor-pointer flex-1">
                              <div className="font-medium text-sm">{subject.name}</div>
                              <div className="text-xs text-gray-500">{subject.code}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : classLevelValue && departmentValue && termValue ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          No subjects available for the selected combination. Please try different
                          selections.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          Select class level, department, and term to view available subjects.
                        </AlertDescription>
                      </Alert>
                    )}

                    {errors.subjects && (
                      <p className="text-xs text-red-600 mt-2">{errors.subjects.message}</p>
                    )}

                    {selectedSubjects && (
                      <p className="text-xs text-gray-600 mt-2">
                        Selected: {selectedSubjects.length} subjects (Max: 10)
                      </p>
                    )}
                  </div>

                  {/* Passport Photo */}
                  <div>
                    <Label htmlFor="passport">Passport Photo</Label>
                    <div className="mt-2 flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition">
                      <div className="text-center">
                        <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                        <label
                          htmlFor="passport"
                          className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          <span>Click to upload</span>
                          <input
                            id="passport"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'passport')}
                            className="sr-only"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </div>
                    {uploadedFiles.passport && (
                      <p className="text-xs text-green-600 mt-2">✓ {uploadedFiles.passport.name}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Review Step */}
              {currentStep === 'review' && (
                <div className="space-y-6">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Please review your information before submitting. You can go back to edit any
                      section.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Review */}
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">📧 Account</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Email:</span> {watch('email')}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Personal Review */}
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">👤 Personal</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {watch('firstName')}{' '}
                          {watch('lastName')}
                        </div>
                        <div>
                          <span className="font-medium">Gender:</span> {watch('gender')}
                        </div>
                        <div>
                          <span className="font-medium">DOB:</span> {watch('dateOfBirth')}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact Review */}
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">📍 Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Phone:</span> {watch('phone')}
                        </div>
                        <div>
                          <span className="font-medium">Address:</span> {watch('address')}
                        </div>
                        <div>
                          <span className="font-medium">State:</span> {watch('state')}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Guardian Review */}
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">👨‍👩‍👧 Guardian</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {watch('guardianName')}
                        </div>
                        <div>
                          <span className="font-medium">Relationship:</span>{' '}
                          {watch('guardianRelationship')}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {watch('guardianPhone')}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Academic Review */}
                    <Card className="bg-gray-50 md:col-span-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">📚 Academic</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="font-medium">Admission #:</span>
                            <div className="text-xs">{admissionNumber}</div>
                          </div>
                          <div>
                            <span className="font-medium">Class:</span> {watch('classLevel')}
                          </div>
                          <div>
                            <span className="font-medium">Department:</span> {watch('department')}
                          </div>
                          <div>
                            <span className="font-medium">Term:</span> {watch('term')}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Subjects:</span>
                          <div className="text-xs mt-1">
                            {selectedSubjects
                              ?.map(
                                (subId) =>
                                  subjects.find((s) => s.id === subId)?.name || subId
                              )
                              .join(', ')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                {currentStep !== 'account' && (
                  <Button type="button" variant="outline" onClick={handlePreviousStep}>
                    ← Previous
                  </Button>
                )}

                {currentStep !== 'review' ? (
                  <Button type="button" onClick={handleNextStep} className="flex-1 ml-auto">
                    Next →
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 ml-auto bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      '✓ Complete Registration'
                    )}
                  </Button>
                )}
              </div>

              {/* Login Link */}
              {currentStep === 'account' && (
                <div className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-indigo-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
