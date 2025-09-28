"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { ModernDashboardLayout } from "@/components/modern-dashboard-layout"

export default function ReportsPage(){
  const [stats, setStats] = useState<any>({ totalStudents:0,totalTeachers:0,totalRevenue:0,pendingPayments:0 })
  useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/admin/overview'); const d=await r.json(); if(r.ok) setStats(d.stats) } catch {} })() },[])

  return (
    <ProtectedRoute allowedRoles={["admin","bursar"]}>
      <ModernDashboardLayout title="Reports & Stats" subtitle="Summary metrics and exports">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Overview for this term</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex justify-between"><span>Total Students</span><strong>{stats.totalStudents}</strong></li>
                <li className="flex justify-between"><span>Total Teachers</span><strong>{stats.totalTeachers}</strong></li>
                <li className="flex justify-between"><span>Total Revenue (₦)</span><strong>{stats.totalRevenue.toLocaleString()}</strong></li>
                <li className="flex justify-between"><span>Pending Payments</span><strong>{stats.pendingPayments}</strong></li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
            <CardHeader>
              <CardTitle>Exports</CardTitle>
              <CardDescription>Download CSV reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="/api/payments/export" target="_blank" rel="noreferrer">
                <Button className="w-full">Download Payments CSV</Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    </ProtectedRoute>
  )
}
