"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  User,
  Settings,
  LogOut,
  Menu,
  Search,
  Moon,
  Sun,
  Monitor,
  Wifi,
  WifiOff,
  Battery,
  Zap,
  Globe,
  Shield,
} from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "next-themes"
import { RealTimeNotifications } from "./real-time-notifications"
import { AIChatWidget } from "./ai-chat-widget"
import { RoleNavList } from "./role-nav"

interface ModernDashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function ModernDashboardLayout({ children, title, subtitle, actions }: ModernDashboardLayoutProps) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isOnline, setIsOnline] = useState(true)
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check battery status if available
    if ("getBattery" in navigator) {
      ;(navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
        battery.addEventListener("levelchange", () => {
          setBatteryLevel(Math.round(battery.level * 100))
        })
      })
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Modern Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-xl dark:bg-gray-900/80 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                    <SheetDescription>Access your dashboard features</SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.photoURL || ""} alt={user?.fullName || ""} />
                        <AvatarFallback className="bg-gradient-to-r from-[#4D3821] to-[#6A4A2D] text-white">
                          {user?.fullName?.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.fullName || user?.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {user?.role}
                          </Badge>
                          {user?.isOnline && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              Online
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <RoleNavList />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fbd2820205fb947eb8af5752a50d16f87%2F5bda342765554afe869b9b86f5b4343a?format=webp&width=128"
                    alt="El-Bethel Academy Logo"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
                  {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
                </div>
              </div>
            </div>

            {/* Center Section - Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* System Status */}
              <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  {isOnline ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span>{isOnline ? "Online" : "Offline"}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center space-x-1">
                  <Battery className="h-3 w-3" />
                  <span>{batteryLevel}%</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <RealTimeNotifications />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL || ""} alt={user?.fullName || ""} />
                      <AvatarFallback className="bg-gradient-to-r from-[#4D3821] to-[#6A4A2D] text-white">
                        {user?.fullName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {user?.isOnline && (
                      <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.fullName || user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {user?.role}
                        </Badge>
                        {user?.isOnline && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Online
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" />
                    Privacy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#4D3821] to-[#6A4A2D] rounded-2xl p-6 text-white mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {getGreeting()}, {user?.fullName?.split(" ")[0] || "there"}! 👋
              </h2>
              <p className="text-blue-100 mb-4">
                Ready to continue your learning journey? Let's make today productive!
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Globe className="h-4 w-4" />
                  <span>Real-time Sync</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Secure</span>
                </div>
              </div>
            </div>
            {actions && <div className="hidden md:block">{actions}</div>}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {children}
        </motion.div>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  )
}
