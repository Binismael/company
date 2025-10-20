'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Download, CheckCircle, Eye, Lock, Unlock, FileDown } from 'lucide-react'
import { toast } from 'sonner'

interface Result {
  id: string
  student: { full_name: string }
  subject: { name: string }
  score: number
  grade: string
  term: string
  status: string
}

export default function ResultsManagementPage() {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<Result[]>([])
  const [showReleasDialog, setShowReleasDialog] = useState(false)
  const [enableDownload, setEnableDownload] = useState(false)

  useEffect(() => {
    const loadResults = async () => {
      try {
        const { data, error } = await supabase
          .from('results')
          .select(`
            *,
            student:students(full_name),
            subject:subjects(name)
          `)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setResults(data || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [])

  const handleReleaseResults = async () => {
    try {
      const { error } = await supabase
        .from('results')
        .update({ status: 'released' })
        .eq('status', 'pending')

      if (error) throw error

      toast.success('Results released to students')
      setShowReleasDialog(false)

      const { data: updatedResults } = await supabase
        .from('results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      setResults(updatedResults || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to release results')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results Management</h1>
          <p className="text-gray-600 mt-2">Approve and release academic results</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showReleasDialog} onOpenChange={setShowReleasDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Unlock className="w-4 h-4" />
                Release Results
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Release Results to Students?</DialogTitle>
                <DialogDescription>
                  Once released, students will be able to view their results
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ This action is permanent. All approved results will become visible to students.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confirm-release"
                    className="w-4 h-4"
                  />
                  <label htmlFor="confirm-release" className="text-sm">
                    I confirm all results are accurate and ready for release
                  </label>
                </div>
                <Button onClick={handleReleaseResults} className="w-full">
                  Release Results
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant={enableDownload ? 'default' : 'outline'}
            onClick={() => setEnableDownload(!enableDownload)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {enableDownload ? 'Disable' : 'Enable'} Downloads
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="released">Released</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'released'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Student</th>
                        <th className="text-left py-2 px-3">Subject</th>
                        <th className="text-left py-2 px-3">Score</th>
                        <th className="text-left py-2 px-3">Grade</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-left py-2 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results
                        .filter(r => r.status === tab)
                        .map((result) => (
                          <tr key={result.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">{result.student.full_name}</td>
                            <td className="py-2 px-3">{result.subject.name}</td>
                            <td className="py-2 px-3 font-medium">{result.score}</td>
                            <td className="py-2 px-3">
                              <Badge>{result.grade}</Badge>
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="outline">{result.status}</Badge>
                            </td>
                            <td className="py-2 px-3">
                              <Button size="sm" variant="ghost">
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
