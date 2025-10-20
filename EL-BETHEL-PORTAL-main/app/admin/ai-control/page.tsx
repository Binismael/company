'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Sparkles, AlertCircle, TrendingUp, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface WeakSubject {
  subject: string
  class: string
  averageScore: number
  studentCount: number
  recommendedAction: string
}

interface AIAnalytics {
  module: string
  enabled: boolean
  coverage: number
  lastUpdated: string
}

export default function AIControlPage() {
  const [weakSubjects, setWeakSubjects] = useState<WeakSubject[]>([
    {
      subject: 'Physics',
      class: 'SS2A',
      averageScore: 62,
      studentCount: 15,
      recommendedAction: 'Increase tutorial materials and assignments',
    },
    {
      subject: 'Chemistry',
      class: 'SS2B',
      averageScore: 58,
      studentCount: 12,
      recommendedAction: 'Focus on practical experiments and visualization',
    },
    {
      subject: 'Further Mathematics',
      class: 'SS3A',
      averageScore: 65,
      studentCount: 8,
      recommendedAction: 'Provide more practice problems and step-by-step solutions',
    },
  ])

  const [aiModules, setAIModules] = useState<AIAnalytics[]>([
    { module: 'CBT (Computer-Based Tests)', enabled: true, coverage: 100, lastUpdated: '2024-01-20' },
    { module: 'Assignment Tracking', enabled: true, coverage: 95, lastUpdated: '2024-01-19' },
    { module: 'Attendance Analysis', enabled: true, coverage: 100, lastUpdated: '2024-01-20' },
    { module: 'Performance Prediction', enabled: false, coverage: 60, lastUpdated: '2024-01-15' },
    { module: 'Smart Recommendations', enabled: true, coverage: 85, lastUpdated: '2024-01-18' },
  ])

  const [aiSettings, setAISettings] = useState({
    enableAITutoring: true,
    enablePredictiveAnalytics: false,
    enablePersonalizedLearning: true,
    analysisFrequency: 'weekly',
    sendRecommendations: true,
  })

  const handleModuleToggle = (index: number) => {
    const updated = [...aiModules]
    updated[index].enabled = !updated[index].enabled
    setAIModules(updated)
    toast.success(
      `${updated[index].module} ${updated[index].enabled ? 'enabled' : 'disabled'}`
    )
  }

  const handleSettingChange = (setting: string, value: any) => {
    setAISettings({ ...aiSettings, [setting]: value })
    toast.success('Setting updated')
  }

  const handlePushRecommendations = () => {
    toast.success('Recommendations pushed to all students')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Learning Assistant Control</h1>
          <p className="text-gray-600 mt-2">Manage AI analytics and student learning recommendations</p>
        </div>
      </div>

      {/* AI Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Modules</p>
                <p className="text-3xl font-bold">
                  {aiModules.filter((m) => m.enabled).length}/{aiModules.length}
                </p>
              </div>
              <Sparkles className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Weak Subjects Identified</p>
                <p className="text-3xl font-bold">{weakSubjects.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Average Coverage</p>
                <p className="text-3xl font-bold">
                  {(
                    aiModules.reduce((a, m) => a + m.coverage, 0) / aiModules.length
                  ).toFixed(0)}
                  %
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>AI System Settings</CardTitle>
          <CardDescription>Configure AI learning assistant features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Enable AI Tutoring</p>
              <p className="text-sm text-gray-600">Provide AI-powered tutoring to students</p>
            </div>
            <Switch
              checked={aiSettings.enableAITutoring}
              onCheckedChange={(val) =>
                handleSettingChange('enableAITutoring', val)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Predictive Analytics</p>
              <p className="text-sm text-gray-600">Use ML to predict student performance</p>
            </div>
            <Switch
              checked={aiSettings.enablePredictiveAnalytics}
              onCheckedChange={(val) =>
                handleSettingChange('enablePredictiveAnalytics', val)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Personalized Learning Paths</p>
              <p className="text-sm text-gray-600">Customize learning based on student progress</p>
            </div>
            <Switch
              checked={aiSettings.enablePersonalizedLearning}
              onCheckedChange={(val) =>
                handleSettingChange('enablePersonalizedLearning', val)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Send Recommendations</p>
              <p className="text-sm text-gray-600">Push recommendations to students</p>
            </div>
            <Switch
              checked={aiSettings.sendRecommendations}
              onCheckedChange={(val) =>
                handleSettingChange('sendRecommendations', val)
              }
            />
          </div>

          <div className="border-t pt-4">
            <label className="text-sm font-medium">Analysis Frequency</label>
            <Select
              value={aiSettings.analysisFrequency}
              onValueChange={(val) =>
                handleSettingChange('analysisFrequency', val)
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Weak Subjects Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Weak Subjects Identified
          </CardTitle>
          <CardDescription>
            Classes and subjects where students need additional support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Average Score</TableHead>
                  <TableHead>Affected Students</TableHead>
                  <TableHead>Recommended Action</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weakSubjects.map((subject, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{subject.subject}</TableCell>
                    <TableCell>{subject.class}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          subject.averageScore < 60
                            ? 'bg-red-100 text-red-800'
                            : subject.averageScore < 70
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }
                      >
                        {subject.averageScore}%
                      </Badge>
                    </TableCell>
                    <TableCell>{subject.studentCount}</TableCell>
                    <TableCell className="text-sm">{subject.recommendedAction}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePushRecommendations}
                      >
                        Push Materials
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Module Status */}
      <Card>
        <CardHeader>
          <CardTitle>AI Module Status</CardTitle>
          <CardDescription>Control which AI features are active</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiModules.map((module, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <p className="font-medium">{module.module}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-sm text-gray-600">
                      Coverage: {module.coverage}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Updated: {module.lastUpdated}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={module.enabled}
                  onCheckedChange={() => handleModuleToggle(index)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Bulk AI Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handlePushRecommendations} className="w-full" variant="outline">
            Push Recommendations to All Students
          </Button>
          <Button className="w-full" variant="outline">
            Regenerate Performance Predictions
          </Button>
          <Button className="w-full" variant="outline">
            Export AI Analytics Report
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
