'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Save, Database, Bell, Lock, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: 'El Bethel Academy',
    schoolCode: 'EBA-2024',
    principalEmail: 'principal@elbethel.edu',
    schoolPhone: '+234 803 123 4567',
    schoolAddress: '123 Education Lane, Lagos, Nigeria',
    website: 'www.elbethel.edu',
  })

  const [academicSettings, setAcademicSettings] = useState({
    currentSession: '2023/2024',
    currentTerm: 'First Term',
    sessionStartDate: '2023-09-01',
    sessionEndDate: '2024-06-30',
    resultReleaseEnabled: true,
    resultDownloadEnabled: true,
    studentRegistrationOpen: true,
  })

  const [paymentSettings, setPaymentSettings] = useState({
    paystackPublicKey: 'pk_live_xxxxxxxxx',
    paystackSecretKey: 'sk_live_xxxxxxxxx',
    enablePayments: true,
    autoBlockUnpaidStudents: false,
    feeReminderDaysBeforeDue: 7,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    paystackWebhookUrl: 'https://yourdomain.com/webhook',
    smsProvider: 'none',
  })

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackupEnabled: true,
    backupTime: '02:00',
    sessionTimeout: 30,
    maxUploadSize: 10,
    enableTwoFactor: false,
  })

  const handleSaveSchoolSettings = () => {
    toast.success('School settings saved')
  }

  const handleSaveAcademicSettings = () => {
    toast.success('Academic settings saved')
  }

  const handleSavePaymentSettings = () => {
    toast.success('Payment settings saved')
  }

  const handleSaveNotificationSettings = () => {
    toast.success('Notification settings saved')
  }

  const handleSaveSystemSettings = () => {
    toast.success('System settings saved')
  }

  const handleTestPaystackConnection = () => {
    toast.success('Paystack connection verified')
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
