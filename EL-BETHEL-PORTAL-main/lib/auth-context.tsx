"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"
import { supabase } from "./supabase-client"

interface UserProfile {
  uid: string
  email: string
  role: "admin" | "teacher" | "student" | "bursar" | "parent"
  fullName: string
  displayName?: string
  photoURL?: string
  phoneNumber?: string

  schoolName?: string
  schoolCode?: string
  adminCode?: string

  teacherCode?: string
  department?: string
  assignedClasses?: string[]

  class?: string
  studentId?: string
  regNo?: string
  admissionNumber?: string

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
  signInWithRegNumber: (regNumber: string, password: string) => Promise<void>
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

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const userData = await fetchUserProfile(session.user.id)
          if (userData) {
            setUser(userData)
          }
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userData = await fetchUserProfile(session.user.id)
        if (userData) {
          setUser(userData)
        }
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching user from users table:", error.message)
        throw error
      }

      if (!data) {
        console.warn("No user data found for userId:", userId)
        return null
      }

      let additionalData: any = {}

      if (data.role === "student") {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (studentError) {
          console.warn("Error fetching student data:", studentError.message)
        }

        if (studentData) {
          additionalData = {
            regNo: studentData.reg_number,
            admissionNumber: studentData.admission_number,
            class: studentData.class_id,
          }
        }
      } else if (data.role === "teacher") {
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (teacherError) {
          console.warn("Error fetching teacher data:", teacherError.message)
        }

        if (teacherData) {
          additionalData = {
            teacherCode: teacherData.teacher_code,
            department: teacherData.department,
          }
        }
      }

      return {
        uid: data.id,
        email: data.email,
        role: data.role,
        fullName: data.full_name,
        phoneNumber: data.phone_number,
        isApproved: data.is_approved,
        createdAt: data.created_at,
        lastLogin: data.last_login,
        ...additionalData,
      }
    } catch (error: any) {
      const errorMessage = error?.message || JSON.stringify(error)
      console.error("Error fetching user profile:", errorMessage)
      return null
    }
  }

  const signUp = async (email: string, password: string, role: string, additionalData?: any) => {
    try {
      setLoading(true)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create user account")

      const { error: userError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email,
          full_name: additionalData?.fullName || email,
          role,
          phone_number: additionalData?.phoneNumber,
          is_approved: role === "admin",
        },
      ])

      if (userError) throw userError

      if (role === "student") {
        const regNumber = additionalData?.regNumber || generateRegNumber()
        const { error: studentError } = await supabase.from("students").insert([
          {
            user_id: authData.user.id,
            admission_number: additionalData?.admissionNumber || `ADM${Date.now()}`,
            reg_number: regNumber,
            gender: additionalData?.gender,
            date_of_birth: additionalData?.dateOfBirth,
            guardian_name: additionalData?.guardianName,
            guardian_phone: additionalData?.guardianPhone,
            guardian_email: additionalData?.guardianEmail,
            class_id: additionalData?.classId,
            session_admitted: additionalData?.sessionAdmitted || "2024/2025",
          },
        ])

        if (studentError) throw studentError
      } else if (role === "teacher") {
        const { error: teacherError } = await supabase.from("teachers").insert([
          {
            user_id: authData.user.id,
            teacher_code: additionalData?.teacherCode || `TCH${Date.now()}`,
            department: additionalData?.department,
          },
        ])

        if (teacherError) throw teacherError
      }

      const userData = await fetchUserProfile(authData.user.id)
      if (userData) {
        setUser(userData)
      }

      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`)
      return userData
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      if (!data.user) throw new Error("Failed to sign in")

      const userData = await fetchUserProfile(data.user.id)
      if (userData) {
        setUser(userData)
        toast.success(`Welcome back, ${userData.role}!`)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithRegNumber = async (regNumber: string, password: string) => {
    try {
      setLoading(true)

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("users(id, email, role)")
        .eq("reg_number", regNumber)
        .single()

      if (studentError || !studentData) {
        throw new Error("Invalid registration number")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: studentData.users.email,
        password,
      })

      if (error) throw error
      if (!data.user) throw new Error("Failed to sign in")

      const userData = await fetchUserProfile(data.user.id)
      if (userData) {
        setUser(userData)
        toast.success("Welcome back!")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      toast.success("Signed out successfully")
    } catch (error: any) {
      toast.error("Failed to sign out")
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      toast.success("Password reset email sent!")
    } catch (error: any) {
      toast.error("Failed to send password reset email")
      throw error
    }
  }

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in")

    try {
      const { error } = await supabase.from("users").update(profileData).eq("id", user.uid)

      if (error) throw error

      const updatedUser = { ...user, ...profileData }
      setUser(updatedUser)
      toast.success("Profile updated successfully")
    } catch (error: any) {
      toast.error("Failed to update profile")
      throw error
    }
  }

  const generateRegNumber = (): string => {
    const year = new Date().getFullYear().toString().slice(-2)
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    return `ELBA/${year}/${random}`
  }

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithRegNumber,
    logout,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
