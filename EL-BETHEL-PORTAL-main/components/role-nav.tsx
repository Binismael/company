"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  MessageCircle,
  Calendar,
  TrendingUp,
  CheckCircle,
  Target,
  Receipt,
  FileText,
  Shield,
  Home,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

function basePathForRole(role?: string) {
  switch (role) {
    case "admin":
      return "/admin-dashboard"
    case "teacher":
      return "/teacher-dashboard"
    case "student":
      return "/student-dashboard"
    case "parent":
      return "/parent-dashboard"
    case "bursar":
      return "/bursar-dashboard"
    default:
      return "/"
  }
}

export function useRoleNav(): NavItem[] {
  const { user } = useAuth()
  const role = user?.role

  if (role === "admin") {
    return [
      { label: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
      { label: "Manage Students", href: "/manage-students", icon: Users },
      { label: "Manage Teachers", href: "/manage-teachers", icon: Users },
      { label: "Academics", href: "/admin-dashboard#academics", icon: BookOpen },
      { label: "Finances", href: "/admin-dashboard#finances", icon: CreditCard },
      { label: "Timetable", href: "/timetable", icon: Calendar },
      { label: "Messages", href: "/messages", icon: MessageCircle },
      { label: "Reports", href: "/reports", icon: FileText },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ]
  }

  if (role === "teacher") {
    return [
      { label: "Overview", href: "/teacher-dashboard", icon: LayoutDashboard },
      { label: "My Classes", href: "/teacher-dashboard#classes", icon: BookOpen },
      { label: "Assignments", href: "/teacher-dashboard#assignments", icon: Target },
      { label: "CBT Exams", href: "/teacher-dashboard#exams", icon: Calendar },
      { label: "Grading", href: "/teacher-dashboard#grading", icon: CheckCircle },
      { label: "Analytics", href: "/teacher-dashboard#analytics", icon: TrendingUp },
      { label: "Timetable", href: "/timetable", icon: Calendar },
      { label: "Messages", href: "/messages", icon: MessageCircle },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ]
  }

  if (role === "student") {
    return [
      { label: "Overview", href: "/student-dashboard", icon: LayoutDashboard },
      { label: "Academics", href: "/student-dashboard#academics", icon: BookOpen },
      { label: "Exams", href: "/student-dashboard#exams", icon: Calendar },
      { label: "Payments", href: "/student-dashboard#payments", icon: CreditCard },
      { label: "Assignments", href: "/student-dashboard#assignments", icon: Target },
      { label: "Timetable", href: "/timetable", icon: Calendar },
      { label: "Messages", href: "/messages", icon: MessageCircle },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ]
  }

  if (role === "parent") {
    return [
      { label: "Overview", href: "/parent-dashboard", icon: LayoutDashboard },
      { label: "Academic Progress", href: "/parent-dashboard#academics", icon: BookOpen },
      { label: "Payments", href: "/parent-dashboard#payments", icon: CreditCard },
      { label: "Communication", href: "/parent-dashboard#communication", icon: MessageCircle },
      { label: "Activities", href: "/parent-dashboard#activities", icon: Calendar },
      { label: "Timetable", href: "/timetable", icon: Calendar },
      { label: "Messages", href: "/messages", icon: MessageCircle },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ]
  }

  if (role === "bursar") {
    return [
      { label: "Overview", href: "/bursar-dashboard", icon: LayoutDashboard },
      { label: "Payment Review", href: "/bursar-dashboard#payments", icon: CreditCard },
      { label: "Class Summary", href: "/bursar-dashboard#summary", icon: Users },
      { label: "Reports", href: "/reports", icon: FileText },
      { label: "Fee Settings", href: "/bursar-dashboard#settings", icon: Settings },
      { label: "Timetable", href: "/timetable", icon: Calendar },
      { label: "Messages", href: "/messages", icon: MessageCircle },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ]
  }

  return [{ label: "Home", href: "/", icon: Home }]
}

export function RoleNavList({ onNavigate }: { onNavigate?: () => void }) {
  const items = useRoleNav()
  const pathname = usePathname()

  return (
    <nav className="mt-4 grid gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href.replace(/#.*/, "")
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
              "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800",
              isActive ? "bg-gray-100 text-gray-900 dark:bg-gray-800" : "text-gray-600 dark:text-gray-300"
            )}
          >
            <Icon className="h-4 w-4 mr-2" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
