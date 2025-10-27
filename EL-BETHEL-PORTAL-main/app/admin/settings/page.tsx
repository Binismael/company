'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Save, Database, Bell, Lock, Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

interface Settings {
  school_name?: string
  school_code?: string
  principal_email?: string
  school_phone?: string
  school_address?: string
  website?: string
  current_session?: string
  current_term?: string
  session_start_date?: string
  session_end_date?: string
  result_release_enabled?: boolean
  result_download_enabled?: boolean
  student_registration_open?: boolean
  enable_payments?: boolean
  fee_reminder_days_before_due?: number
  email_notifications_enabled?: boolean
  sms_notifications_enabled?: boolean
  paystack_webhook_url?: string
  maintenance_mode?: boolean
  auto_backup_enabled?: boolean
  backup_time?: string
  session_timeout?: number
  max_upload_size?: number
  enable_two_factor?: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: '',
    schoolCode: '',
    principalEmail: '',
    schoolPhone: '',
    schoolAddress: '',
    website: '',
  })

  const [academicSettings, setAcademicSettings] = useState({
    currentSession: '',
    currentTerm: '',
    sessionStartDate: '',
    sessionEndDate: '',
    resultReleaseEnabled: true,
    resultDownloadEnabled: true,
    studentRegistrationOpen: true,
  })

  const [paymentSettings, setPaymentSettings] = useState({
    enablePayments: true,
    feeReminderDaysBeforeDue: 7,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    paystackWebhookUrl: '',
  })

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackupEnabled: true,
    backupTime: '02:00',
    sessionTimeout: 30,
    maxUploadSize: 10,
    enableTwoFactor: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Not authenticated')
        return
      }

      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const { settings } = await response.json()

      if (settings) {
        setSchoolSettings({
          schoolName: settings.school_name || '',
          schoolCode: settings.school_code || '',
          principalEmail: settings.principal_email || '',
          schoolPhone: settings.school_phone || '',
          schoolAddress: settings.school_address || '',
          website: settings.website || '',
        })

        setAcademicSettings({
          currentSession: settings.current_session || '',
          currentTerm: settings.current_term || '',
          sessionStartDate: settings.session_start_date || '',
          sessionEndDate: settings.session_end_date || '',
          resultReleaseEnabled: settings.result_release_enabled ?? true,
          resultDownloadEnabled: settings.result_download_enabled ?? true,
          studentRegistrationOpen: settings.student_registration_open ?? true,
        })

        setPaymentSettings({
          enablePayments: settings.enable_payments ?? true,
          feeReminderDaysBeforeDue: settings.fee_reminder_days_before_due || 7,
        })

        setNotificationSettings({
          emailNotificationsEnabled: settings.email_notifications_enabled ?? true,
          smsNotificationsEnabled: settings.sms_notifications_enabled ?? false,
          paystackWebhookUrl: settings.paystack_webhook_url || '',
        })

        setSystemSettings({
          maintenanceMode: settings.maintenance_mode ?? false,
          autoBackupEnabled: settings.auto_backup_enabled ?? true,
          backupTime: settings.backup_time || '02:00',
          sessionTimeout: settings.session_timeout || 30,
          maxUploadSize: settings.max_upload_size || 10,
          enableTwoFactor: settings.enable_two_factor ?? false,
        })
      }
    } catch (error: any) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (settingsToSave: Partial<Settings>) => {
    try {
      setSaving(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Not authenticated')
        return false
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsToSave)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      toast.success('Settings saved successfully')
      return true
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error(error.message || 'Failed to save settings')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSchoolSettings = async () => {
    await saveSettings({
      school_name: schoolSettings.schoolName,
      school_code: schoolSettings.schoolCode,
      principal_email: schoolSettings.principalEmail,
      school_phone: schoolSettings.schoolPhone,
      school_address: schoolSettings.schoolAddress,
      website: schoolSettings.website,
    })
  }

  const handleSaveAcademicSettings = async () => {
    await saveSettings({
      current_session: academicSettings.currentSession,
      current_term: academicSettings.currentTerm,
      session_start_date: academicSettings.sessionStartDate,
      session_end_date: academicSettings.sessionEndDate,
      result_release_enabled: academicSettings.resultReleaseEnabled,
      result_download_enabled: academicSettings.resultDownloadEnabled,
      student_registration_open: academicSettings.studentRegistrationOpen,
    })
  }

  const handleSavePaymentSettings = async () => {
    await saveSettings({
      enable_payments: paymentSettings.enablePayments,
      fee_reminder_days_before_due: paymentSettings.feeReminderDaysBeforeDue,
    })
  }

  const handleSaveNotificationSettings = async () => {
    await saveSettings({
      email_notifications_enabled: notificationSettings.emailNotificationsEnabled,
      sms_notifications_enabled: notificationSettings.smsNotificationsEnabled,
      paystack_webhook_url: notificationSettings.paystackWebhookUrl,
    })
  }

  const handleSaveSystemSettings = async () => {
    await saveSettings({
      maintenance_mode: systemSettings.maintenanceMode,
      auto_backup_enabled: systemSettings.autoBackupEnabled,
      backup_time: systemSettings.backupTime,
      session_timeout: systemSettings.sessionTimeout,
      max_upload_size: systemSettings.maxUploadSize,
      enable_two_factor: systemSettings.enableTwoFactor,
    })
  }

  const handleTestPaystackConnection = async () => {
    try {
      const response = await fetch('/api/payments/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        toast.success('Paystack connection verified')
      } else {
        toast.error('Paystack connection failed')
      }
    } catch (error) {
      toast.error('Failed to test connection')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Configure school-wide system settings</p>
      </div>

      <Tabs defaultValue="school" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="school">School</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        {/* School Settings Tab */}
        <TabsContent value="school" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>Basic school details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">School Name *</label>
                  <Input
                    value={schoolSettings.schoolName}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, schoolName: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">School Code *</label>
                  <Input
                    value={schoolSettings.schoolCode}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, schoolCode: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Principal Email</label>
                  <Input
                    type="email"
                    value={schoolSettings.principalEmail}
                    onChange={(e) =>
                      setSchoolSettings({
                        ...schoolSettings,
                        principalEmail: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">School Phone</label>
                  <Input
                    value={schoolSettings.schoolPhone}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, schoolPhone: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">School Address</label>
                <Textarea
                  value={schoolSettings.schoolAddress}
                  onChange={(e) =>
                    setSchoolSettings({
                      ...schoolSettings,
                      schoolAddress: e.target.value,
                    })
                  }
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Website</label>
                <Input
                  value={schoolSettings.website}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, website: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <Button onClick={handleSaveSchoolSettings} className="gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Settings Tab */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Settings</CardTitle>
              <CardDescription>Configure sessions, terms, and academic controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Academic Session *</label>
                  <Select value={academicSettings.currentSession} onValueChange={(val) =>
                    setAcademicSettings({ ...academicSettings, currentSession: val })
                  }>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2022/2023">2022/2023</SelectItem>
                      <SelectItem value="2023/2024">2023/2024</SelectItem>
                      <SelectItem value="2024/2025">2024/2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Current Term *</label>
                  <Select value={academicSettings.currentTerm} onValueChange={(val) =>
                    setAcademicSettings({ ...academicSettings, currentTerm: val })
                  }>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Term">First Term</SelectItem>
                      <SelectItem value="Second Term">Second Term</SelectItem>
                      <SelectItem value="Third Term">Third Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Session Start Date</label>
                  <Input
                    type="date"
                    value={academicSettings.sessionStartDate}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        sessionStartDate: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Session End Date</label>
                  <Input
                    type="date"
                    value={academicSettings.sessionEndDate}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        sessionEndDate: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable Result Release</p>
                    <p className="text-sm text-gray-600">Allow students to view their results</p>
                  </div>
                  <Switch
                    checked={academicSettings.resultReleaseEnabled}
                    onCheckedChange={(val) =>
                      setAcademicSettings({
                        ...academicSettings,
                        resultReleaseEnabled: val,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable Result Download</p>
                    <p className="text-sm text-gray-600">Allow PDF/Excel result downloads</p>
                  </div>
                  <Switch
                    checked={academicSettings.resultDownloadEnabled}
                    onCheckedChange={(val) =>
                      setAcademicSettings({
                        ...academicSettings,
                        resultDownloadEnabled: val,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Student Registration Open</p>
                    <p className="text-sm text-gray-600">Allow new student registrations</p>
                  </div>
                  <Switch
                    checked={academicSettings.studentRegistrationOpen}
                    onCheckedChange={(val) =>
                      setAcademicSettings({
                        ...academicSettings,
                        studentRegistrationOpen: val,
                      })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSaveAcademicSettings} className="gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Secure Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Keep your payment keys confidential. Never share these with unauthorized persons.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway Configuration</CardTitle>
              <CardDescription>Paystack payment processing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Enable Payments</p>
                  <p className="text-sm text-gray-600">Activate payment processing</p>
                </div>
                <Switch
                  checked={paymentSettings.enablePayments}
                  onCheckedChange={(val) =>
                    setPaymentSettings({ ...paymentSettings, enablePayments: val })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Paystack Public Key *</label>
                <Input
                  type="password"
                  value={paymentSettings.paystackPublicKey}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      paystackPublicKey: e.target.value,
                    })
                  }
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-2">Get from your Paystack dashboard</p>
              </div>

              <div>
                <label className="text-sm font-medium">Paystack Secret Key *</label>
                <Input
                  type="password"
                  value={paymentSettings.paystackSecretKey}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      paystackSecretKey: e.target.value,
                    })
                  }
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-2">Keep this key secret and secure</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fee Reminder (Days Before)</label>
                  <Input
                    type="number"
                    value={paymentSettings.feeReminderDaysBeforeDue}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        feeReminderDaysBeforeDue: parseInt(e.target.value),
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleTestPaystackConnection} variant="outline" className="w-full gap-2">
                    <Zap className="w-4 h-4" />
                    Test Connection
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                <div>
                  <p className="font-medium text-red-900">Auto-block Unpaid Students</p>
                  <p className="text-sm text-red-700">Prevent portal access if fees unpaid</p>
                </div>
                <Switch
                  checked={paymentSettings.autoBlockUnpaidStudents}
                  onCheckedChange={(val) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      autoBlockUnpaidStudents: val,
                    })
                  }
                />
              </div>

              <Button onClick={handleSavePaymentSettings} className="gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure email and SMS notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Send email alerts to users</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotificationsEnabled}
                  onCheckedChange={(val) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotificationsEnabled: val,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Send SMS alerts to users</p>
                </div>
                <Switch
                  checked={notificationSettings.smsNotificationsEnabled}
                  onCheckedChange={(val) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      smsNotificationsEnabled: val,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Paystack Webhook URL</label>
                <Input
                  value={notificationSettings.paystackWebhookUrl}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      paystackWebhookUrl: e.target.value,
                    })
                  }
                  className="mt-2"
                  placeholder="https://yourdomain.com/webhook"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Configure this in your Paystack dashboard
                </p>
              </div>

              <Button onClick={handleSaveNotificationSettings} className="gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Advanced system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                <div>
                  <p className="font-medium text-red-900">Maintenance Mode</p>
                  <p className="text-sm text-red-700">Disable system access for all users except admins</p>
                </div>
                <Switch
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(val) =>
                    setSystemSettings({ ...systemSettings, maintenanceMode: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Auto Backup</p>
                  <p className="text-sm text-gray-600">Schedule automatic database backups</p>
                </div>
                <Switch
                  checked={systemSettings.autoBackupEnabled}
                  onCheckedChange={(val) =>
                    setSystemSettings({ ...systemSettings, autoBackupEnabled: val })
                  }
                />
              </div>

              {systemSettings.autoBackupEnabled && (
                <div>
                  <label className="text-sm font-medium">Backup Time</label>
                  <Input
                    type="time"
                    value={systemSettings.backupTime}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, backupTime: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <Input
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        sessionTimeout: parseInt(e.target.value),
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Upload Size (MB)</label>
                  <Input
                    type="number"
                    value={systemSettings.maxUploadSize}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        maxUploadSize: parseInt(e.target.value),
                      })
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <Button onClick={handleSaveSystemSettings} className="gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
