'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

interface Role {
  id: string
  name: string
  description: string
  user_count: number
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface UserForAssignment {
  id: string
  full_name: string
  role: string
}

export default function RolesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users, setUsers] = useState<UserForAssignment[]>([])
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedUserRole, setSelectedUserRole] = useState<string>('')

  const [roleForm, setRoleForm] = useState({ name: '', description: '' })
  const [permissionForm, setPermissionForm] = useState({ name: '', description: '', category: '' })

  useEffect(() => {
    checkAuthorization()
  }, [])

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (userData?.role !== 'admin') {
        router.push('/student-dashboard')
        return
      }

      loadData()
    } catch (error) {
      console.error('Authorization error:', error)
      toast.error('Failed to verify access')
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, name, description')
        .order('name')

      if (rolesError) throw rolesError
      
      const rolesWithCounts = await Promise.all((rolesData || []).map(async (role: any) => {
        const { count } = await supabase
          .from('user_roles')
          .select('id', { count: 'exact', head: true })
          .eq('role_id', role.id)

        return { ...role, user_count: count || 0 }
      }))

      setRoles(rolesWithCounts)

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('id, name, description, category')
        .order('category')

      if (permissionsError) throw permissionsError
      setPermissions(permissionsData || [])

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, role')
        .order('full_name')

      if (usersError) throw usersError
      setUsers(usersData || [])
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    if (!roleForm.name) {
      toast.error('Please enter role name')
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('roles')
        .insert({ name: roleForm.name, description: roleForm.description })

      if (error) throw error
      toast.success('Role created successfully')
      setRoleForm({ name: '', description: '' })
      loadData()
    } catch (error: any) {
      console.error('Error creating role:', error)
      toast.error(error.message || 'Failed to create role')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePermission = async () => {
    if (!permissionForm.name || !permissionForm.category) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('permissions')
        .insert({
          name: permissionForm.name,
          description: permissionForm.description,
          category: permissionForm.category,
        })

      if (error) throw error
      toast.success('Permission created successfully')
      setPermissionForm({ name: '', description: '', category: '' })
      loadData()
    } catch (error: any) {
      console.error('Error creating permission:', error)
      toast.error(error.message || 'Failed to create permission')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoleSelect = async (roleId: string) => {
    setSelectedRole(roleId)
    
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId)

      if (error) throw error
      setSelectedRolePermissions(data?.map(d => d.permission_id) || [])
    } catch (error: any) {
      console.error('Error loading role permissions:', error)
      toast.error('Failed to load permissions')
    }
  }

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) {
      toast.error('Please select a role')
      return
    }

    try {
      setSubmitting(true)

      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', selectedRole)

      const permissionAssignments = selectedRolePermissions.map(permId => ({
        role_id: selectedRole,
        permission_id: permId,
      }))

      if (permissionAssignments.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(permissionAssignments)

        if (error) throw error
      }

      toast.success('Permissions assigned successfully')
      loadData()
    } catch (error: any) {
      console.error('Error saving permissions:', error)
      toast.error(error.message || 'Failed to save permissions')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignUserRole = async () => {
    if (!selectedUser || !selectedUserRole) {
      toast.error('Please select user and role')
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser, role_id: selectedUserRole })

      if (error) throw error
      toast.success('Role assigned successfully')
      setSelectedUser('')
      setSelectedUserRole('')
      loadData()
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('User already has this role')
      } else {
        console.error('Error assigning role:', error)
        toast.error(error.message || 'Failed to assign role')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>

        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="role-permissions">Role Permissions</TabsTrigger>
            <TabsTrigger value="user-roles">User Roles</TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle>Create New Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Name *</label>
                  <Input
                    placeholder="e.g., Editor, Reviewer"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                    className="rounded-lg border border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Role description"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                    className="rounded-lg border border-gray-300"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleCreateRole}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Role
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle>Existing Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roles.map(role => (
                    <div key={role.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{role.name}</h4>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">{role.user_count} users</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle>Create New Permission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Permission Name *</label>
                  <Input
                    placeholder="e.g., view_dashboard"
                    value={permissionForm.name}
                    onChange={(e) => setPermissionForm({...permissionForm, name: e.target.value})}
                    className="rounded-lg border border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <Input
                    placeholder="e.g., dashboard, user_management"
                    value={permissionForm.category}
                    onChange={(e) => setPermissionForm({...permissionForm, category: e.target.value})}
                    className="rounded-lg border border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Permission description"
                    value={permissionForm.description}
                    onChange={(e) => setPermissionForm({...permissionForm, description: e.target.value})}
                    className="rounded-lg border border-gray-300"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleCreatePermission}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Permission
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle>Permissions List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.map(perm => (
                        <TableRow key={perm.id}>
                          <TableCell className="font-medium">{perm.name}</TableCell>
                          <TableCell><Badge className="bg-gray-100 text-gray-800">{perm.category}</Badge></TableCell>
                          <TableCell className="text-sm text-gray-600">{perm.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Permissions Tab */}
          <TabsContent value="role-permissions" className="space-y-4">
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle>Assign Permissions to Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Role *</label>
                  <Select value={selectedRole} onValueChange={handleRoleSelect}>
                    <SelectTrigger className="rounded-lg border border-gray-300">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole && (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {permissions.map(perm => (
                        <label key={perm.id} className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={selectedRolePermissions.includes(perm.id)}
                            onCheckedChange={() => {
                              setSelectedRolePermissions(prev =>
                                prev.includes(perm.id)
                                  ? prev.filter(p => p !== perm.id)
                                  : [...prev, perm.id]
                              )
                            }}
                          />
                          <div>
                            <p className="font-medium text-sm text-gray-900">{perm.name}</p>
                            <p className="text-xs text-gray-600">{perm.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <Button
                      onClick={handleSaveRolePermissions}
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Save Permissions
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Roles Tab */}
          <TabsContent value="user-roles" className="space-y-4">
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle>Assign Roles to Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select User *</label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="rounded-lg border border-gray-300">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Role *</label>
                    <Select value={selectedUserRole} onValueChange={setSelectedUserRole}>
                      <SelectTrigger className="rounded-lg border border-gray-300">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleAssignUserRole}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Assign Role
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
