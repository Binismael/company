'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  User,
  BookOpen,
  FileText,
  DollarSign,
  ClipboardList,
  BarChart3,
  Calendar,
  MessageSquare,
  Award,
  Settings,
  HelpCircle,
  Menu,
  ChevronDown,
  LogOut,
  Home,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { useStudentApprovalGuard } from '@/hooks/use-student-approval-guard'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

export default function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading: approvalLoading, isApproved } = useStudentApprovalGuard()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/student-dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Profile',
      href: '/student/profile',
      icon: <User className="w-5 h-5" />,
    },
    {
      label: 'Exams',
      href: '/student/exams',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: 'Results',
      href: '/student/results',
      icon: <Award className="w-5 h-5" />,
    },
    {
      label: 'Assignments',
      href: '/student/assignments',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: 'Fees & Payments',
      href: '/student/payments',
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      label: 'Courses',
      href: '/student/courses',
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      label: 'Attendance',
      href: '/student/attendance',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: 'Messages',
      href: '/student/messages',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      label: 'AI Tutor',
      href: '/student/ai-tutor',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      label: 'Settings',
      href: '/student/settings',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      label: 'Support',
      href: '/student/support',
      icon: <HelpCircle className="w-5 h-5" />,
    },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      router.push('/auth/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout')
    }
  }

  const NavContent = () => (
    <nav className="space-y-1 px-2">
      {navItems.map((item) => (
        <button
          key={item.href}
          onClick={() => {
            router.push(item.href)
            setMobileOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive(item.href)
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">⚜</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">El Bethel</h1>
            <p className="text-xs text-gray-600">Student Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <NavContent />
        </div>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">⚜</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm">El Bethel</h1>
              </div>
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h1 className="font-bold text-gray-900">Navigation</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="py-4">
                  <NavContent />
                </div>
                <div className="border-t border-gray-200 p-4 space-y-2 absolute bottom-0 left-0 right-0">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
