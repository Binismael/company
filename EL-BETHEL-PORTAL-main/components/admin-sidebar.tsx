'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface NavItem {
  label: string
  icon: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '📊', href: '/admin-dashboard' },
  { label: 'Students', icon: '👥', href: '/admin/registrations' },
  { label: 'Teachers', icon: '👨‍🏫', href: '/admin/teachers' },
  { label: 'Classes', icon: '📚', href: '/admin/classes' },
  { label: 'Exams', icon: '📝', href: '/admin/exams' },
  { label: 'Attendance', icon: '✓', href: '/admin/attendance' },
  { label: 'Payments', icon: '💰', href: '/admin/payments' },
  { label: 'Assignments', icon: '📋', href: '/admin/assignments' },
  { label: 'Results', icon: '📊', href: '/admin/results' },
  { label: 'Announcements', icon: '📢', href: '/admin/announcements' },
  { label: 'Settings', icon: '⚙️', href: '/admin/settings' },
]

export function AdminSidebar() {
  const router = useRouter()

  const handleLogout = async () => {
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('session')
    router.push('/auth/login')
  }

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-xl p-6 fixed h-screen overflow-y-auto">
      {/* Logo Section */}
      <div className="mb-8 pb-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-white">El Bethel</h2>
        <p className="text-xs text-slate-400 mt-1">Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 hover:bg-slate-700 group"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="group-hover:translate-x-0.5 transition-transform">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="mt-8 pt-6 border-t border-slate-700">
        <Button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white justify-start gap-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
