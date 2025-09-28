"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/protected-route"
import { ModernDashboardLayout } from "@/components/modern-dashboard-layout"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function SettingsPage(){
  const { theme, setTheme } = useTheme()
  const [sms, setSms] = useState(false)
  const [email, setEmail] = useState(true)

  useEffect(()=>{
    setSms(localStorage.getItem("pref_sms") === "1")
    setEmail(localStorage.getItem("pref_email") !== "0")
  },[])

  useEffect(()=>{ localStorage.setItem("pref_sms", sms ? "1" : "0") }, [sms])
  useEffect(()=>{ localStorage.setItem("pref_email", email ? "1" : "0") }, [email])

  return (
    <ProtectedRoute allowedRoles={["admin","teacher","student","parent","bursar"]}>
      <ModernDashboardLayout title="Settings" subtitle="Customize your preferences">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Switch between light, dark and system themes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button variant={theme==='light'? 'default':'outline'} onClick={()=> setTheme('light')}>Light</Button>
                <Button variant={theme==='dark'? 'default':'outline'} onClick={()=> setTheme('dark')}>Dark</Button>
                <Button variant={theme==='system'? 'default':'outline'} onClick={()=> setTheme('system')}>System</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you get notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-600">Receive important alerts via SMS</p>
                </div>
                <Switch checked={sms} onCheckedChange={setSms} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Get updates by email</p>
                </div>
                <Switch checked={email} onCheckedChange={setEmail} />
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    </ProtectedRoute>
  )
}
