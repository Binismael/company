'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Role {
  id: string
  name: string
  description: string
  userCount: number
  permissions: string[]
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Admin',
      description: 'Full access to all system features',
      userCount: 1,
      permissions: [
        'view_dashboard',
        'manage_users',
        'manage_classes',
        'manage_exams',
        'manage_results',
        'manage_fees',
        'view_reports',
        'manage_permissions',
        'system_settings',
      ],
    },
    {
      id: '2',
      name: 'Teacher',
      description: 'Manage classes, exams, and student records',
      userCount: 24,
      permissions: [
        'view_dashboard',
        'view_students',
        'create_exams',
        'mark_attendance',
        'submit_results',
        'upload_materials',
      ],
    },
    {
      id: '3',
      name: 'Student',
      description: 'Access learning materials and take exams',
      userCount: 245,
      permissions: [
        'view_dashboard',
        'take_exams',
        'submit_assignments',
        'view_results',
        'view_attendance',
        'view_fees',
      ],
    },
    {
      id: '4',
      name: 'Parent',
      description: 'View child academic progress',
      userCount: 120,
      permissions: [
        'view_child_results',
        'view_attendance',
        'view_fees',
        'contact_teacher',
      ],
    },
    {
      id: '5',
      name: 'Bursar',
      description: 'Manage fees and payments',
      userCount: 2,
      permissions: [
        'view_dashboard',
        'manage_fees',
        'process_payments',
        'view_reports',
        'generate_receipts',
      ],
    },
  ])

  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: '1',
      name: 'view_dashboard',
      description: 'Access main dashboard',
      category: 'Dashboard',
    },
    {
      id: '2',
      name: 'manage_users',
      description: 'Create, edit, delete users',
      category: 'User Management',
    },
    {
      id: '3',
      name: 'manage_classes',
      description: 'Create and manage classes',
      category: 'Class Management',
    },
    {
      id: '4',
      name: 'manage_exams',
      description: 'Create and manage exams',
      category: 'Exam Management',
    },
    {
      id: '5',
      name: 'mark_attendance',
      description: 'Record student attendance',
      category: 'Attendance',
    },
    {
      id: '6',
      name: 'submit_results',
      description: 'Submit student results',
      category: 'Results',
    },
    {
      id: '7',
      name: 'manage_fees',
      description: 'Manage fee structures',
      category: 'Fees',
    },
    {
      id: '8',
      name: 'view_reports',
      description: 'Access analytics and reports',
      category: 'Reports',
    },
    {
      id: '9',
      name: 'manage_permissions',
      description: 'Manage roles and permissions',
      category: 'System',
    },
  ])

  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(roles[0].permissions)

  const handlePermissionToggle = (permissionId: string) => {
    if (selectedRole) {
      const updated = selectedPermissions.includes(permissionId)
        ? selectedPermissions.filter((p) => p !== permissionId)
        : [...selectedPermissions, permissionId]
      setSelectedPermissions(updated)

      const updatedRoles = roles.map((r) =>
        r.id === selectedRole.id ? { ...r, permissions: updated } : r
      )
      setRoles(updatedRoles)
      setSelectedRole({ ...selectedRole, permissions: updated })
      toast.success('Permissions updated')
    }
  }

  const handleDeleteRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id))
    toast.success('Role deleted')
  }

  const permissionsByCategory = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = []
      }
      acc[perm.category].push(perm)
      return acc
    },
    {} as Record<string, Permission[]>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600 mt-2">Control access levels and system permissions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Define a new role with specific permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Role name" />
              <Input placeholder="Role description" />
              <Button className="w-full">Create Role</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roles List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Available Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setSelectedRole(role)
                          setSelectedPermissions(role.permissions)
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition ${
                          selectedRole?.id === role.id
                            ? 'bg-primary-50 border-primary-500'
                            : 'hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <p className="font-medium">{role.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{role.userCount} users</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Permissions Editor */}
            <div className="lg:col-span-2">
              {selectedRole && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedRole.name} Role</CardTitle>
                        <CardDescription>{selectedRole.description}</CardDescription>
                      </div>
                      {selectedRole.id !== '1' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteRole(selectedRole.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(permissionsByCategory).map(([category, perms]) => (
                        <div key={category}>
                          <h3 className="font-semibold text-sm mb-3 text-gray-700">{category}</h3>
                          <div className="space-y-2">
                            {perms.map((perm) => (
                              <div key={perm.id} className="flex items-start gap-3">
                                <Checkbox
                                  id={perm.id}
                                  checked={selectedPermissions.includes(perm.id)}
                                  onCheckedChange={() => handlePermissionToggle(perm.id)}
                                  className="mt-1"
                                />
                                <label htmlFor={perm.id} className="flex-1 cursor-pointer">
                                  <p className="text-sm font-medium">{perm.name}</p>
                                  <p className="text-xs text-gray-600">{perm.description}</p>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>System Permissions</CardTitle>
              <CardDescription>All available system permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Used By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((perm) => {
                      const rolesWithPerm = roles.filter((r) =>
                        r.permissions.includes(perm.id)
                      )
                      return (
                        <TableRow key={perm.id}>
                          <TableCell className="font-medium">{perm.name}</TableCell>
                          <TableCell>{perm.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{perm.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 flex-wrap">
                              {rolesWithPerm.map((role) => (
                                <Badge key={role.id} variant="secondary" className="text-xs">
                                  {role.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
