"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"

interface UserProfile {
  uid: string
  email: string
  role: "admin" | "teacher" | "student" | "bursar" | "parent"
  fullName: string
  displayName?: string
  photoURL?: string
  phoneNumber?: string

  // Admin specific
  schoolName?: string
  schoolCode?: string
  adminCode?: string

  // Teacher specific
  teacherCode?: string
  department?: string
  assignedClasses?: string[]

  // Student specific
  class?: string
  studentId?: string
  regNo?: string
  admissionCode?: string

  // Common
  createdAt?: any
  lastLogin?: any
  isOnline?: boolean
  isApproved?: boolean
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, role: string, additionalData?: any) => Promise<any>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithMicrosoft: () => Promise<void>
  signInAsGuest: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const savedUser = localStorage.getItem("elbethel_user")
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser(userData)
          console.log("Restored user session:", userData.role)
        }
      } catch (error) {
        console.error("Error restoring session:", error)
        localStorage.removeItem("elbethel_user")
      } finally {
        setLoading(false)
      }
    }

    checkExistingSession()
  }, [])

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("elbethel_user", JSON.stringify(user))
    } else {
      localStorage.removeItem("elbethel_user")
    }
  }, [user])

  const signUp = async (email: string, password: string, role: string, additionalData?: any) => {
    try {
      setLoading(true)

      // Validate role-specific requirements
      if (role === "teacher" && !additionalData?.teacherCode) {
        throw new Error("Teacher code is required for teacher registration")
      }

      if (role === "admin" && !additionalData?.schoolName) {
        throw new Error("School name is required for admin registration")
      }

      // Generate codes for admin
      let schoolCode = ""
      let adminCode = ""
      if (role === "admin") {
        schoolCode = "SCH" + Math.random().toString(36).substr(2, 6).toUpperCase()
        adminCode = "ADM" + Math.random().toString(36).substr(2, 6).toUpperCase()
      }

      const mockUser: UserProfile = {
        uid: Math.random().toString(36).substr(2, 9),
        email,
        role: role as UserProfile["role"],
        fullName: additionalData?.fullName || `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        phoneNumber: additionalData?.phoneNumber,

        // Admin specific
        schoolName: additionalData?.schoolName,
        schoolCode,
        adminCode,

        // Teacher specific
        teacherCode: additionalData?.teacherCode,
        department: additionalData?.department,
        assignedClasses: additionalData?.assignedClasses || [],

        // Student specific
        class: additionalData?.class,
        studentId: additionalData?.studentId,
        regNo:
          additionalData?.regNo ||
          `EBS/2024/${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0")}`,
        admissionCode: additionalData?.admissionCode,

        isOnline: true,
        isApproved: role === "admin" ? true : false, // Admin auto-approved
        createdAt: new Date(),
        lastLogin: new Date(),
      }

      setUser(mockUser)
      console.log("User created with role:", role, mockUser)

      if (role === "admin") {
        toast.success(`Admin account created! School Code: ${schoolCode}, Admin Code: ${adminCode}`)
        return { schoolCode, adminCode }
      } else {
        toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`)
      }

      return mockUser
    } catch (error: any) {
      toast.error(error.message || "Failed to create account")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)

      // Mock sign in with role detection based on email patterns
      let userRole: UserProfile["role"] = "student" // default

      // Enhanced role detection based on email patterns
      if (email.includes("admin") || email.includes("principal") || email.includes("headmaster")) {
        userRole = "admin"
      } else if (email.includes("teacher") || email.includes("staff") || email.includes("faculty")) {
        userRole = "teacher"
      } else if (email.includes("bursar") || email.includes("finance") || email.includes("accounts")) {
        userRole = "bursar"
      } else if (
        email.includes("parent") ||
        email.includes("guardian") ||
        email.includes("father") ||
        email.includes("mother")
      ) {
        userRole = "parent"
      }

      // Create mock user based on detected role
      const mockUser: UserProfile = {
        uid: Math.random().toString(36).substr(2, 9),
        email,
        role: userRole,
        fullName: `Demo ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`,
        isOnline: true,
        lastLogin: new Date(),

        // Add role-specific data
        ...(userRole === "admin" && {
          schoolName: "El Bethel Academy",
          schoolCode: "SCH123456",
          adminCode: "ADM789012",
        }),
        ...(userRole === "teacher" && {
          department: "Mathematics",
          assignedClasses: ["SS1A", "SS1B", "SS2A"],
        }),
        ...(userRole === "student" && {
          class: "SS2A",
          regNo: "EBS/2024/001",
        }),
        ...(userRole === "parent" &&
          {
            // Parent can have child info
          }),
      }

      setUser(mockUser)
      console.log("User signed in with role:", userRole, mockUser)
      toast.success(`Welcome back, ${userRole}!`)
    } catch (error: any) {
      toast.error("Failed to sign in")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const mockUser: UserProfile = {
        uid: Math.random().toString(36).substr(2, 9),
        email: "demo@google.com",
        role: "student",
        fullName: "Google User",
        photoURL: "https://via.placeholder.com/40",
        isOnline: true,
        lastLogin: new Date(),
        class: "SS2A",
        regNo: "EBS/2024/002",
      }
      setUser(mockUser)
      toast.success("Signed in with Google!")
    } catch (error: any) {
      toast.error("Failed to sign in with Google")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithMicrosoft = async () => {
    try {
      setLoading(true)
      const mockUser: UserProfile = {
        uid: Math.random().toString(36).substr(2, 9),
        email: "demo@microsoft.com",
        role: "student",
        fullName: "Microsoft User",
        isOnline: true,
        lastLogin: new Date(),
        class: "SS2A",
        regNo: "EBS/2024/003",
      }
      setUser(mockUser)
      toast.success("Signed in with Microsoft!")
    } catch (error: any) {
      toast.error("Failed to sign in with Microsoft")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInAsGuest = async () => {
    try {
      setLoading(true)
      const mockUser: UserProfile = {
        uid: "guest-" + Math.random().toString(36).substr(2, 9),
        email: "guest@elbethel.edu",
        role: "student",
        fullName: "Guest User",
        isOnline: true,
        lastLogin: new Date(),
        class: "SS2A",
        regNo: "EBS/2024/GUEST",
      }
      setUser(mockUser)
      toast.success("Signed in as guest!")
    } catch (error: any) {
      toast.error("Failed to sign in as guest")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setUser(null)
      localStorage.removeItem("elbethel_user")
      toast.success("Signed out successfully")
    } catch (error: any) {
      toast.error("Failed to sign out")
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      toast.success("Password reset email sent!")
    } catch (error: any) {
      toast.error("Failed to send password reset email")
      throw error
    }
  }

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in")

    try {
      const updatedUser = { ...user, ...profileData }
      setUser(updatedUser)
      toast.success("Profile updated successfully")
    } catch (error: any) {
      toast.error("Failed to update profile")
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithMicrosoft,
    signInAsGuest,
    logout,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
