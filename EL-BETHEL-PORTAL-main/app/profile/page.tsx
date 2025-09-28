"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/protected-route"
import { ModernDashboardLayout } from "@/components/modern-dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, updateProfile, resetPassword } = useAuth()
  const [form, setForm] = useState({ fullName: "", phoneNumber: "", class: "", regNo: "" })

  useEffect(()=>{ if(user){ setForm({ fullName: user.fullName||"", phoneNumber: user.phoneNumber||"", class: (user as any).class || "", regNo: (user as any).regNo || "" }) } }, [user])

  const save = async ()=>{
    try { await updateProfile(form as any); toast.success("Profile updated") } catch { toast.error("Failed to update") }
  }

  const reset = async ()=>{
    try { await resetPassword(user?.email||""); toast.success("Password reset email sent") } catch { toast.error("Failed to send reset") }
  }

  return (
    <ProtectedRoute allowedRoles={["admin","teacher","student","parent","bursar"]}>
      <ModernDashboardLayout title="Profile" subtitle="Manage your personal information">
        <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0 max-w-2xl">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.fullName} onChange={(e)=> setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={form.phoneNumber} onChange={(e)=> setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Input value={form.class} onChange={(e)=> setForm({ ...form, class: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Reg No</Label>
                <Input value={form.regNo} onChange={(e)=> setForm({ ...form, regNo: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save}>Save Changes</Button>
              <Button variant="outline" onClick={reset}>Reset Password</Button>
            </div>
          </CardContent>
        </Card>
      </ModernDashboardLayout>
    </ProtectedRoute>
  )
}
