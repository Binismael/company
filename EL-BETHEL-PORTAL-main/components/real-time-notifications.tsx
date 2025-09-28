"use client"

import { useState, useEffect } from "react"
import { Bell, X, Check, AlertCircle, Info, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: Date
  read: boolean
  actionUrl?: string
  priority: "low" | "medium" | "high"
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  // Simulate real-time notifications
  useEffect(() => {
    if (!user) return

    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "New Assignment Posted",
        message: "Mathematics assignment due in 3 days",
        type: "info",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: "medium",
      },
      {
        id: "2",
        title: "Exam Reminder",
        message: "Physics exam tomorrow at 9:00 AM",
        type: "warning",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: "high",
      },
      {
        id: "3",
        title: "Grade Updated",
        message: "Your Chemistry test score is now available",
        type: "success",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        priority: "low",
      },
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter((n) => !n.read).length)

    // Simulate new notifications
    const interval = setInterval(() => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        title: "System Update",
        message: "New features available in your dashboard",
        type: "info",
        timestamp: new Date(),
        read: false,
        priority: "low",
      }

      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Show toast for new notification
      toast.info(newNotification.title, {
        description: newNotification.message,
      })
    }, 30000) // New notification every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = (id: string) => {
    const notification = notifications.find((n) => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      default:
        return "border-l-blue-500"
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="relative p-2">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.div>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-96 z-50"
          >
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                      Mark all read
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="max-h-96">
                <div className="p-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-3 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} ${
                            notification.read ? "bg-gray-50" : "bg-white shadow-sm"
                          } hover:shadow-md transition-all duration-200 cursor-pointer`}
                          onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4
                                    className={`text-sm font-medium ${
                                      notification.read ? "text-gray-600" : "text-gray-900"
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    {notification.priority === "high" && (
                                      <Badge variant="destructive" className="text-xs">
                                        Urgent
                                      </Badge>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteNotification(notification.id)
                                      }}
                                      className="h-6 w-6 p-0 hover:bg-red-100"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <p className={`text-sm ${notification.read ? "text-gray-500" : "text-gray-700"} mt-1`}>
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {notification.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markAsRead(notification.id)
                                      }}
                                      className="h-6 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Mark read
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
