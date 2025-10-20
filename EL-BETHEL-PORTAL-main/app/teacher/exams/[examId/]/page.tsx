'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, AlertCircle, Plus, Trash2, Check } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: Record<string, string> | null
  correct_answer: string
  marks: number
  order_index: number
}

interface Attempt {
  id: string
  student_id: string
  student: { user: { full_name: string }; admission_number: string }
  score: number
  submitted: boolean
  graded: boolean
}

interface Exam {
  id: string
  title: string
  description: string
  class: { name: string }
  subject: { name: string }
  duration_minutes: number
  total_marks: number
  results_released: boolean
}

export default function ExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showNewQuestion, setShowNewQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    questionType: 'multiple_choice',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    marks: '1',
  })

  useEffect(() => {
    const loadExamData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get exam
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select(`
            *,
            class:classes(name),
            subject:subjects(name)
          `)
          .eq('id', examId)
          .eq('teacher_id', authUser.id)
          .single()

        if (examError) throw examError
        setExam(examData)

        // Get questions
        const { data: questionsData } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', examId)
          .order('order_index')

        setQuestions(questionsData || [])

        // Get attempts
        const { data: attemptsData } = await supabase
          .from('exam_attempts')
          .select(`
            *,
            student:students(user:users(full_name),admission_number)
          `)
          .eq('exam_id', examId)
          .order('created_at', { ascending: false })

        setAttempts(attemptsData || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadExamData()
  }, [examId, router])

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const options = newQuestion.questionType === 'multiple_choice'
        ? {
            A: newQuestion.optionA,
            B: newQuestion.optionB,
            C: newQuestion.optionC,
            D: newQuestion.optionD,
          }
        : null

      const { data, error: err } = await supabase
        .from('exam_questions')
        .insert([
          {
            exam_id: examId,
            question_text: newQuestion.questionText,
            question_type: newQuestion.questionType,
            options,
            correct_answer: newQuestion.correctAnswer,
            marks: parseInt(newQuestion.marks),
            order_index: questions.length,
          },
        ])
        .select()

      if (err) throw err

      setQuestions([...questions, data[0]])
      setNewQuestion({
        questionText: '',
        questionType: 'multiple_choice',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        marks: '1',
      })
      setShowNewQuestion(false)
      setSuccess('Question added successfully!')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return

    try {
      await supabase
        .from('exam_questions')
        .delete()
        .eq('id', questionId)

      setQuestions(questions.filter(q => q.id !== questionId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleReleaseResults = async () => {
    if (!confirm('Release results to all students?')) return

    try {
      await supabase
        .from('exams')
        .update({ results_released: true })
        .eq('id', examId)

      setExam(exam ? { ...exam, results_released: true } : null)
      setSuccess('Results released successfully!')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Exam not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Exam Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
              <CardDescription className="mt-2">
                {exam.class.name} • {exam.subject.name}
              </CardDescription>
            </div>
            {!exam.results_released && (
              <Button onClick={handleReleaseResults} className="gap-2">
                <Check className="h-4 w-4" />
                Release Results
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-medium">{exam.duration_minutes} min</p>
            </div>
            <div>
              <p className="text-gray-500">Total Marks</p>
              <p className="font-medium">{exam.total_marks}</p>
            </div>
            <div>
              <p className="text-gray-500">Questions</p>
              <p className="font-medium">{questions.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Attempts</p>
              <p className="font-medium">{attempts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="questions" className="w-full">
        <TabsList>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
          <TabsTrigger value="attempts">Attempts ({attempts.length})</TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          {!showNewQuestion ? (
            <Button onClick={() => setShowNewQuestion(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          ) : null}

          {showNewQuestion && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Question</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div>
                    <Label htmlFor="questionText">Question Text *</Label>
                    <Input
                      id="questionText"
                      placeholder="Enter question text"
                      value={newQuestion.questionText}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          questionText: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="questionType">Question Type *</Label>
                      <Select
                        value={newQuestion.questionType}
                        onValueChange={(value) =>
                          setNewQuestion({
                            ...newQuestion,
                            questionType: value,
                          })
                        }
                      >
                        <SelectTrigger id="questionType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="fill_blank">Fill Blank</SelectItem>
                          <SelectItem value="theory">Theory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="marks">Marks *</Label>
                      <Input
                        id="marks"
                        type="number"
                        min="1"
                        value={newQuestion.marks}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            marks: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {newQuestion.questionType === 'multiple_choice' && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Options</p>
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <div key={option}>
                          <Label htmlFor={`option${option}`}>Option {option}</Label>
                          <Input
                            id={`option${option}`}
                            placeholder={`Option ${option}`}
                            value={newQuestion[`option${option.toLowerCase()}` as keyof typeof newQuestion]}
                            onChange={(e) =>
                              setNewQuestion({
                                ...newQuestion,
                                [`option${option.toLowerCase()}`]: e.target.value,
                              } as any)
                            }
                          />
                        </div>
                      ))}
                      <div>
                        <Label htmlFor="correctAnswer">Correct Answer *</Label>
                        <Select
                          value={newQuestion.correctAnswer}
                          onValueChange={(value) =>
                            setNewQuestion({
                              ...newQuestion,
                              correctAnswer: value,
                            })
                          }
                        >
                          <SelectTrigger id="correctAnswer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewQuestion(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Question</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {questions.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">No questions added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          Question {index + 1} ({question.marks} marks)
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {question.question_text}
                        </p>
                        {question.options && (
                          <div className="mt-3 space-y-1 text-sm">
                            {Object.entries(question.options).map(([key, value]) => (
                              <p
                                key={key}
                                className={question.correct_answer === key ? 'font-medium text-green-600' : ''}
                              >
                                {key}. {value}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Attempts Tab */}
        <TabsContent value="attempts">
          {attempts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">No attempts yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Student Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium">Student</th>
                        <th className="text-left py-3 px-4 font-medium">Admission #</th>
                        <th className="text-left py-3 px-4 font-medium">Score</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {attempt.student.user.full_name}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">
                            {attempt.student.admission_number}
                          </td>
                          <td className="py-3 px-4">
                            {attempt.submitted ? `${attempt.score}/${exam.total_marks}` : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {!attempt.submitted && <span className="text-orange-600">In Progress</span>}
                            {attempt.submitted && !attempt.graded && <span className="text-yellow-600">Submitted</span>}
                            {attempt.graded && <span className="text-green-600">Graded</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
