"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  GraduationCap,
  Users,
  BookOpen,
  CreditCard,
  Brain,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Globe,
  Smartphone,
  UserCheck,
  ArrowLeft,
  ChevronRight,
  Home,
  Copy,
  Check,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState<"role-selection" | "authentication">("role-selection")
  const [selectedRole, setSelectedRole] = useState("")
  const [credentials, setCredentials] = useState({ email: "", password: "", confirmPassword: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [generatedCodes, setGeneratedCodes] = useState({ schoolCode: "", adminCode: "" })
  const [copiedCode, setCopiedCode] = useState("")

  // Registration form data
  const [registrationData, setRegistrationData] = useState({
    fullName: "",
    phoneNumber: "",
    schoolName: "",
    teacherCode: "",
    department: "",
    class: "",
    studentId: "",
    admissionCode: "",
  })

  const { signIn, signUp, signInWithGoogle, signInWithMicrosoft, signInAsGuest, resetPassword, user, loading } =
    useAuth()
  const router = useRouter()

  // Role options with descriptions
  const roleOptions = [
    {
      id: "admin",
      title: "Administrator",
      description: "Full system access and school management",
      icon: Shield,
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
      features: ["User Management", "System Settings", "Reports", "AI Analytics"],
    },
    {
      id: "teacher",
      title: "Teacher",
      description: "Manage classes, create exams, and track student progress",
      icon: GraduationCap,
      color: "bg-green-100 text-green-700 hover:bg-green-200",
      features: ["Create CBT Exams", "Grade Students", "AI Assistant", "Class Analytics"],
      requiresCode: true,
    },
    {
      id: "student",
      title: "Student",
      description: "Access your courses, assignments, and grades",
      icon: BookOpen,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
      features: ["View Grades", "Submit Assignments", "AI Tutor", "CBT Exams"],
    },
    {
      id: "bursar",
      title: "Bursar",
      description: "Manage school finances and student payments",
      icon: CreditCard,
      color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
      features: ["Payment Management", "Financial Reports", "Fee Structure", "Collections"],
    },
    {
      id: "parent",
      title: "Parent",
      description: "Monitor your child's academic progress",
      icon: Users,
      color: "bg-pink-100 text-pink-700 hover:bg-pink-200",
      features: ["Child's Progress", "Communication", "Payment Status", "Reports"],
    },
  ]

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      const role = user.role || "student"
      const dashboardPath = `/${role}-dashboard`
      console.log(`User authenticated as ${role}, redirecting to ${dashboardPath}`)
      router.push(dashboardPath)
    }
  }, [user, loading, router])

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    setCurrentStep("authentication")
  }

  const handleBackToRoleSelection = () => {
    setCurrentStep("role-selection")
    setSelectedRole("")
    setError("")
    setCredentials({ email: "", password: "", confirmPassword: "" })
    setRegistrationData({
      fullName: "",
      phoneNumber: "",
      schoolName: "",
      teacherCode: "",
      department: "",
      class: "",
      studentId: "",
      admissionCode: "",
    })
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(type)
    toast.success(`${type} copied to clipboard!`)
    setTimeout(() => setCopiedCode(""), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!credentials.email || !credentials.password) {
      setError("Please fill in all fields")
      return
    }

    if (isRegistering) {
      if (credentials.password !== credentials.confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (!registrationData.fullName) {
        setError("Full name is required")
        return
      }

      // Role-specific validations
      if (selectedRole === "admin" && !registrationData.schoolName) {
        setError("School name is required for admin registration")
        return
      }

      if (selectedRole === "teacher" && !registrationData.teacherCode) {
        setError("Teacher code is required for teacher registration")
        return
      }

      if (selectedRole === "student" && !registrationData.class) {
        setError("Class is required for student registration")
        return
      }
    }

    setIsLoading(true)
    setError("")

    try {
      if (isRegistering) {
        const result = await signUp(credentials.email, credentials.password, selectedRole, registrationData)

        // Show generated codes for admin
        if (selectedRole === "admin" && result?.schoolCode && result?.adminCode) {
          setGeneratedCodes({ schoolCode: result.schoolCode, adminCode: result.adminCode })
          return // Don't redirect yet, show codes first
        }
      } else {
        await signIn(credentials.email, credentials.password)
      }

      // After successful authentication, redirect will happen automatically via useEffect
    } catch (error: any) {
      setError(error.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")

    try {
      await signInWithGoogle()
      // Redirect will happen automatically via useEffect
    } catch (error: any) {
      setError(error.message || "Google sign-in failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true)
    setError("")

    try {
      await signInWithMicrosoft()
      // Redirect will happen automatically via useEffect
    } catch (error: any) {
      setError(error.message || "Microsoft sign-in failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestSignIn = async () => {
    setIsLoading(true)
    setError("")

    try {
      await signInAsGuest()
      // Redirect will happen automatically via useEffect
    } catch (error: any) {
      setError(error.message || "Guest sign-in failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) {
      toast.error("Please enter your email address")
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(resetEmail)
      setShowForgotPassword(false)
      setResetEmail("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <Image src="/images/logo.png" alt="El Bethel Academy" width={80} height={80} className="animate-pulse" />
          <div className="flex items-center space-x-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
            <span className="text-lg text-gray-700 font-medium">Loading your portal...</span>
          </div>
        </motion.div>
      </div>
    )
  }

  // Show generated codes for admin
  if (generatedCodes.schoolCode && generatedCodes.adminCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/images/logo.png" alt="El Bethel Academy" width={60} height={60} />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Admin Account Created!</CardTitle>
            <CardDescription>Save these codes securely - you'll need them to manage your school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-green-800">School Code</Label>
                    <p className="text-lg font-mono font-bold text-green-900">{generatedCodes.schoolCode}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCodes.schoolCode, "School Code")}
                    className="bg-white"
                  >
                    {copiedCode === "School Code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-blue-800">Admin Code</Label>
                    <p className="text-lg font-mono font-bold text-blue-900">{generatedCodes.adminCode}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCodes.adminCode, "Admin Code")}
                    className="bg-white"
                  >
                    {copiedCode === "Admin Code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> Share the School Code with teachers for registration. Keep the Admin Code
                private for administrative access.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => router.push("/admin-dashboard")}
              className="w-full bg-gradient-to-r from-blue-800 to-yellow-600 hover:from-blue-900 hover:to-yellow-700"
            >
              Continue to Admin Dashboard
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedRoleData = roleOptions.find((role) => role.id === selectedRole)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl"
        />
      </div>

      {/* Navigation */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/landing">
          <Button variant="ghost" size="sm" className="bg-white/50 hover:bg-white/80">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side - School Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          <div className="flex items-center justify-center lg:justify-start mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg"
            >
              <Image src="/images/logo.png" alt="El Bethel Academy" width={48} height={48} />
              <div>
                <h1 className="text-3xl font-bold text-blue-900">El Bethel Academy</h1>
                <p className="text-yellow-700">Next-Generation Learning Platform</p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <motion.div whileHover={{ scale: 1.02 }} className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-10 w-10 text-blue-700" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">1,200+</p>
                  <p className="text-sm text-gray-600">Active Students</p>
                </div>
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-10 w-10 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">85+</p>
                  <p className="text-sm text-gray-600">Expert Teachers</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl"
            >
              <Brain className="h-8 w-8 text-blue-700" />
              <div>
                <h3 className="font-semibold text-blue-900">AI-Powered Learning</h3>
                <p className="text-sm text-gray-600">Personalized education with advanced AI tutoring</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl"
            >
              <Zap className="h-8 w-8 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Real-time Collaboration</h3>
                <p className="text-sm text-gray-600">Interactive classrooms and instant feedback</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl"
            >
              <Shield className="h-8 w-8 text-blue-700" />
              <div>
                <h3 className="font-semibold text-blue-900">Advanced Security</h3>
                <p className="text-sm text-gray-600">Secure authentication and protected data</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-wrap gap-2 justify-center lg:justify-start"
          >
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Enhanced
            </Badge>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Globe className="h-3 w-3 mr-1" />
              Cloud-Native
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile-First
            </Badge>
          </motion.div>
        </motion.div>

        {/* Right Side - Role Selection or Authentication */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <AnimatePresence mode="wait">
            {currentStep === "role-selection" ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/90 backdrop-blur-xl shadow-2xl border-0">
                  <CardHeader className="text-center pb-6">
                    <div className="flex justify-center mb-4">
                      <Image src="/images/logo.png" alt="El Bethel Academy" width={60} height={60} />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-yellow-600 bg-clip-text text-transparent">
                      Choose Your Role
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Select your role to access the appropriate portal
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {roleOptions.map((role) => {
                      const IconComponent = role.icon
                      return (
                        <motion.div
                          key={role.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl border-2 border-transparent hover:border-blue-200 cursor-pointer transition-all duration-200 ${role.color}`}
                          onClick={() => handleRoleSelect(role.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-white/50 rounded-lg">
                                <IconComponent className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg flex items-center">
                                  {role.title}
                                  {role.requiresCode && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Code Required
                                    </Badge>
                                  )}
                                </h3>
                                <p className="text-sm opacity-80">{role.description}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 opacity-60" />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {role.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-white/30">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </motion.div>
                      )
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="authentication"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/90 backdrop-blur-xl shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
                  <CardHeader className="text-center pb-6">
                    <div className="flex items-center justify-center mb-4 space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToRoleSelection}
                        className="absolute left-4 top-4"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Image src="/images/logo.png" alt="El Bethel Academy" width={60} height={60} />
                    </div>

                    {selectedRoleData && (
                      <div className="mb-4">
                        <div
                          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${selectedRoleData.color}`}
                        >
                          <selectedRoleData.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{selectedRoleData.title}</span>
                        </div>
                      </div>
                    )}

                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-yellow-600 bg-clip-text text-transparent">
                      {showForgotPassword ? "Reset Password" : isRegistering ? "Create Your Account" : "Welcome Back"}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {showForgotPassword
                        ? "Enter your email to receive reset instructions"
                        : isRegistering
                          ? `Join as ${selectedRoleData?.title}`
                          : `Sign in to your ${selectedRoleData?.title} portal`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Alert variant="destructive" className="bg-red-50 border-red-200">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {showForgotPassword ? (
                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="resetEmail">Email Address</Label>
                          <Input
                            id="resetEmail"
                            type="email"
                            placeholder="Enter your email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            className="bg-white/50"
                          />
                        </div>

                        <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Reset Link"
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => setShowForgotPassword(false)}
                        >
                          Back to Sign In
                        </Button>
                      </form>
                    ) : (
                      <>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          {/* Registration Fields */}
                          {isRegistering && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input
                                  id="fullName"
                                  type="text"
                                  placeholder="Enter your full name"
                                  value={registrationData.fullName}
                                  onChange={(e) =>
                                    setRegistrationData({ ...registrationData, fullName: e.target.value })
                                  }
                                  required
                                  className="bg-white/50"
                                />
                              </div>

                              {/* Admin specific fields */}
                              {selectedRole === "admin" && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="schoolName">School Name *</Label>
                                    <Input
                                      id="schoolName"
                                      type="text"
                                      placeholder="Enter your school name"
                                      value={registrationData.schoolName}
                                      onChange={(e) =>
                                        setRegistrationData({ ...registrationData, schoolName: e.target.value })
                                      }
                                      required
                                      className="bg-white/50"
                                    />
                                  </div>
                                </>
                              )}

                              {/* Teacher specific fields */}
                              {selectedRole === "teacher" && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input
                                      id="phoneNumber"
                                      type="tel"
                                      placeholder="Enter your phone number"
                                      value={registrationData.phoneNumber}
                                      onChange={(e) =>
                                        setRegistrationData({ ...registrationData, phoneNumber: e.target.value })
                                      }
                                      className="bg-white/50"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="teacherCode">Teacher Code *</Label>
                                    <Input
                                      id="teacherCode"
                                      type="text"
                                      placeholder="Enter teacher code provided by admin"
                                      value={registrationData.teacherCode}
                                      onChange={(e) =>
                                        setRegistrationData({ ...registrationData, teacherCode: e.target.value })
                                      }
                                      required
                                      className="bg-white/50"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="department">Department/Subject</Label>
                                    <Input
                                      id="department"
                                      type="text"
                                      placeholder="e.g., Mathematics, English, Science"
                                      value={registrationData.department}
                                      onChange={(e) =>
                                        setRegistrationData({ ...registrationData, department: e.target.value })
                                      }
                                      className="bg-white/50"
                                    />
                                  </div>
                                </>
                              )}

                              {/* Student specific fields */}
                              {selectedRole === "student" && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="class">Class *</Label>
                                    <Select
                                      value={registrationData.class}
                                      onValueChange={(value) =>
                                        setRegistrationData({ ...registrationData, class: value })
                                      }
                                    >
                                      <SelectTrigger className="bg-white/50">
                                        <SelectValue placeholder="Select your class" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="JSS1A">JSS1A</SelectItem>
                                        <SelectItem value="JSS1B">JSS1B</SelectItem>
                                        <SelectItem value="JSS2A">JSS2A</SelectItem>
                                        <SelectItem value="JSS2B">JSS2B</SelectItem>
                                        <SelectItem value="JSS3A">JSS3A</SelectItem>
                                        <SelectItem value="JSS3B">JSS3B</SelectItem>
                                        <SelectItem value="SS1A">SS1A</SelectItem>
                                        <SelectItem value="SS1B">SS1B</SelectItem>
                                        <SelectItem value="SS2A">SS2A</SelectItem>
                                        <SelectItem value="SS2B">SS2B</SelectItem>
                                        <SelectItem value="SS3A">SS3A</SelectItem>
                                        <SelectItem value="SS3B">SS3B</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="studentId">Student ID (Optional)</Label>
                                    <Input
                                      id="studentId"
                                      type="text"
                                      placeholder="Enter your student ID if available"
                                      value={registrationData.studentId}
                                      onChange={(e) =>
                                        setRegistrationData({ ...registrationData, studentId: e.target.value })
                                      }
                                      className="bg-white/50"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="admissionCode">Admission Code (Optional)</Label>
                                    <Input
                                      id="admissionCode"
                                      type="text"
                                      placeholder="Enter admission code if provided"
                                      value={registrationData.admissionCode}
                                      onChange={(e) =>
                                        setRegistrationData({ ...registrationData, admissionCode: e.target.value })
                                      }
                                      className="bg-white/50"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {/* Common fields */}
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              value={credentials.email}
                              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                              required
                              className="bg-white/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                required
                                className="bg-white/50 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {isRegistering && (
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirm Password</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={credentials.confirmPassword}
                                onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                                required
                                className="bg-white/50"
                              />
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-800 to-yellow-600 hover:from-blue-900 hover:to-yellow-700"
                            disabled={isLoading || !credentials.email || !credentials.password}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isRegistering ? "Creating Account..." : "Signing In..."}
                              </>
                            ) : (
                              <>{isRegistering ? "Create Account" : "Sign In"}</>
                            )}
                          </Button>
                        </form>

                        {!isRegistering && (
                          <>
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant="outline"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="bg-white/50 hover:bg-white/80"
                              >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                  <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                  />
                                  <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                  />
                                  <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                  />
                                  <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                  />
                                </svg>
                                Google
                              </Button>

                              <Button
                                variant="outline"
                                onClick={handleMicrosoftSignIn}
                                disabled={isLoading}
                                className="bg-white/50 hover:bg-white/80"
                              >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                  <path fill="#f25022" d="M1 1h10v10H1z" />
                                  <path fill="#00a4ef" d="M13 1h10v10H13z" />
                                  <path fill="#7fba00" d="M1 13h10v10H1z" />
                                  <path fill="#ffb900" d="M13 13h10v10H13z" />
                                </svg>
                                Microsoft
                              </Button>
                            </div>

                            <Button
                              variant="outline"
                              onClick={handleGuestSignIn}
                              disabled={isLoading}
                              className="w-full bg-white/50 hover:bg-white/80"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Continue as Guest
                            </Button>
                          </>
                        )}

                        <div className="text-center space-y-2">
                          <Button
                            variant="link"
                            onClick={() => setIsRegistering(!isRegistering)}
                            disabled={isLoading}
                            className="text-sm text-blue-800"
                          >
                            {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Register"}
                          </Button>

                          {!isRegistering && (
                            <Button
                              variant="link"
                              onClick={() => setShowForgotPassword(true)}
                              disabled={isLoading}
                              className="text-sm text-gray-600"
                            >
                              Forgot your password?
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center text-xs text-gray-500"
          >
            <p>Powered by Next.js 15 • AI • Cloud Technology</p>
            <p className="mt-1">© 2025 El Bethel Academy. All rights reserved.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
