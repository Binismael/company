"use client"

import type React from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles = [], redirectTo = "/" }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to login
        console.log("No user found, redirecting to login")
        router.push(redirectTo)
        return
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // User doesn't have required role, redirect to their correct dashboard
        const correctDashboard = `/${user.role}-dashboard`
        console.log(`User role ${user.role} not allowed, redirecting to ${correctDashboard}`)
        router.push(correctDashboard)
        return
      }

      console.log(`User ${user.role} accessing protected route - access granted`)
    }
  }, [user, loading, router, allowedRoles, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-100">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-700">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}
