"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/protected-route"
import { ModernDashboardLayout } from "@/components/modern-dashboard-layout"
import { useAuth } from "@/lib/auth-context"

export default function MessagesPage(){
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [form, setForm] = useState({ recipient_role: "", recipient_email: "", class_name: "", content: "" })

  const load = async ()=>{ const url = new URL(location.origin + '/api/messages'); if(user?.email) url.searchParams.set('email', user.email); if(user?.role) url.searchParams.set('role', user.role); const r = await fetch(url.toString()); const d = await r.json(); if(Array.isArray(d)) setMessages(d) }
  useEffect(()=>{ load() },[user])

  const send = async ()=>{
    const body = { sender_email: user?.email, ...form }
    const r = await fetch('/api/messages', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    if(r.ok){ setForm({ recipient_role: "", recipient_email: "", class_name: "", content: "" }); await load() }
  }

  return (
    <ProtectedRoute allowedRoles={["admin","teacher","student","parent","bursar"]}>
      <ModernDashboardLayout title="Messages" subtitle="Send and receive messages">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
              <CardDescription>Recent messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[60vh] overflow-auto">
                {messages.map((m,i)=> (
                  <div key={i} className="p-3 border rounded">
                    <div className="text-sm text-gray-600">From: {m.sender_email}</div>
                    <div className="font-medium">{m.content}</div>
                    <div className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>Choose a recipient or class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2"><Label>To Role (optional)</Label><Input value={form.recipient_role} onChange={(e)=> setForm({ ...form, recipient_role: e.target.value })} placeholder="student|teacher|parent|bursar|admin"/></div>
              <div className="space-y-2"><Label>To Email (optional)</Label><Input value={form.recipient_email} onChange={(e)=> setForm({ ...form, recipient_email: e.target.value })} placeholder="user@example.com"/></div>
              <div className="space-y-2"><Label>Class (optional)</Label><Input value={form.class_name} onChange={(e)=> setForm({ ...form, class_name: e.target.value })} placeholder="SS2"/></div>
              <div className="space-y-2"><Label>Message</Label><Input value={form.content} onChange={(e)=> setForm({ ...form, content: e.target.value })} placeholder="Type message"/></div>
              <Button onClick={send}>Send</Button>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    </ProtectedRoute>
  )
}
