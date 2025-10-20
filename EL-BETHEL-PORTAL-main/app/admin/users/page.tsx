'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Plus, Search, Edit2, Trash2, Eye, EyeOff, Download, Upload, Lock, CheckCircle, AlertCircle, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  created_at: string
  last_login?: string
  phone?: string
}

export default function UserManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'student',
    password: '',
  })

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setUsers(userData || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      })

      if (authError) throw authError

      const { error: userError } = await supabase.from('users').insert({
        id: authData.user?.id,
        full_name: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: 'active',
      })

      if (userError) throw userError

      toast.success('User created successfully')
      setShowAddDialog(false)
      setNewUser({ fullName: '', email: '', role: 'student', password: '' })
      
      const { data: updatedUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      setUsers(updatedUsers || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId)
      if (error) throw error

      setUsers(users.filter(u => u.id !== userId))
      toast.success('User deleted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
    }
  }

  const handleSuspendUser = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u))
      toast.success(`User ${newStatus}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-gray-600 mt-2">Manage students, teachers, and parents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new student, teacher, or parent</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    placeholder="Enter full name"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddUser} className="w-full">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="parent">Parents</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Joined</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{user.full_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs capitalize">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-xs capitalize ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSuspendUser(user.id, user.status)}
                          className="text-xs"
                        >
                          {user.status === 'active' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
