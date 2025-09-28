"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { ModernDashboardLayout } from "@/components/modern-dashboard-layout"
import { Calendar as CalIcon, PlusCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

export default function CalendarPage(){
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [form, setForm] = useState({ title: "", date: "", description: "", type: "general" })

  const load = async ()=> { const r = await fetch('/api/events'); const d = await r.json(); if(Array.isArray(d)) setEvents(d) }
  useEffect(()=>{ load() }, [])

  const create = async ()=>{
    if(!form.title || !form.date) return
    const r = await fetch('/api/events', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    if(r.ok){ setForm({ title: "", date: "", description: "", type: "general" }); await load() }
  }

  return (
    <ProtectedRoute allowedRoles={["admin","teacher","student","parent","bursar"]}>
      <ModernDashboardLayout title="School Calendar" subtitle="Events and schedules">
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">Events</TabsTrigger>
            <TabsTrigger value="create">Create Event</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center"><CalIcon className="h-5 w-5 mr-2 text-blue-600"/>Upcoming Events</CardTitle>
                <CardDescription>All scheduled school events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((e,i)=> (
                    <div key={i} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-sm text-gray-600">{e.date} • {e.type}</div>
                        {e.description && <div className="text-sm text-gray-700">{e.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0 max-w-xl">
              <CardHeader>
                <CardTitle>Create Event</CardTitle>
                <CardDescription>Add an event to the calendar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e)=> setForm({ ...form, title: e.target.value })}/></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e)=> setForm({ ...form, date: e.target.value })}/></div>
                <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e)=> setForm({ ...form, description: e.target.value })}/></div>
                <div className="space-y-2"><Label>Type</Label><Input value={form.type} onChange={(e)=> setForm({ ...form, type: e.target.value })}/></div>
                <Button onClick={create}><PlusCircle className="h-4 w-4 mr-2"/>Create</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ModernDashboardLayout>
    </ProtectedRoute>
  )
}
