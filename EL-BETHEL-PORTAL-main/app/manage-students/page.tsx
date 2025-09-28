"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/components/protected-route"
import { ModernDashboardLayout } from "@/components/modern-dashboard-layout"
import { toast } from "sonner"

export default function ManageStudentsPage(){
  const [students, setStudents] = useState<any[]>([])
  const [query, setQuery] = useState("")

  const load = async ()=>{
    try{ const r = await fetch('/api/users'); const d = await r.json(); if(Array.isArray(d)) setStudents(d.filter((u:any)=> u.role==='student')) } catch {}
  }
  useEffect(()=>{ load() },[])

  const save = async (u:any)=>{
    try{ const r= await fetch(`/api/users/${u.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role: u.role, is_approved: !!u.is_approved })}); if(!r.ok) throw new Error('fail'); toast.success('Updated'); } catch { toast.error('Failed') }
  }

  const filtered = students.filter((s)=> (s.full_name||'').toLowerCase().includes(query.toLowerCase()) || (s.email||'').toLowerCase().includes(query.toLowerCase()))

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ModernDashboardLayout title="Manage Students" subtitle="Approve and manage student accounts">
        <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Search and manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Input placeholder="Search by name or email" value={query} onChange={(e)=> setQuery(e.target.value)} />
              <Button variant="outline" onClick={load}>Refresh</Button>
            </div>
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-center">Approved</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u)=> (
                    <tr key={u.id} className="border-t">
                      <td className="px-3 py-2">{u.full_name||'-'}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!u.is_approved} onChange={(e)=> setStudents((arr)=> arr.map(x=> x.id===u.id? { ...x, is_approved: e.target.checked } : x))} /></td>
                      <td className="px-3 py-2 text-center"><Button size="sm" onClick={()=> save(students.find(x=> x.id===u.id))}>Save</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </ModernDashboardLayout>
    </ProtectedRoute>
  )
}
