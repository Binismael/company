"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/protected-route"
import { ModernDashboardLayout } from "@/components/modern-dashboard-layout"
import { useAuth } from "@/lib/auth-context"

export default function TimetablePage(){
  const { user } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({ title: "", date: "", description: "", type: "timetable" })

  const load = async ()=>{ const r = await fetch('/api/events'); const d = await r.json(); if(Array.isArray(d)) setItems(d.filter((x:any)=> x.type==='timetable')) }
  useEffect(()=>{ load() },[])

  const create = async ()=>{ if(!form.title || !form.date) return; const r = await fetch('/api/events', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) }); if(r.ok){ setForm({ title: "", date: "", description: "", type: "timetable" }); await load() } }

  const canCreate = user?.role==='admin' || user?.role==='teacher'

  return (
    <ProtectedRoute allowedRoles={["admin","teacher","student","parent","bursar"]}>
      <ModernDashboardLayout title="Class Timetable" subtitle="Schedule of classes and exams">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
            <CardHeader>
              <CardTitle>Timetable</CardTitle>
              <CardDescription>All upcoming schedule items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((e,i)=> (
                  <div key={i} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-sm text-gray-600">{e.date}</div>
                      {e.description && <div className="text-sm text-gray-700">{e.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {canCreate && (
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
              <CardHeader>
                <CardTitle>Add to Timetable</CardTitle>
                <CardDescription>Admins and teachers can add items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e)=> setForm({ ...form, title: e.target.value })}/></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e)=> setForm({ ...form, date: e.target.value })}/></div>
                <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e)=> setForm({ ...form, description: e.target.value })}/></div>
                <Button onClick={create}>Add</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </ModernDashboardLayout>
    </ProtectedRoute>
  )
}
