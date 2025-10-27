'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'

interface Question {
  id: string
  question_number: number
  question_text: string
  question_type: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_answer: string
  marks: number
  explanation?: string
}

export default function TeacherQuestionsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'multiple_choice',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    marks: '1',
    explanation: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: examData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', examId)
          .single()

        setExam(examData)

        const response = await fetch(`/api/exams/questions?examSessionId=${examId}`)
        const questionsData = await response.json()
        setQuestions(questionsData.data || [])
      } catch (error: any) {
        toast.error('Failed to load exam data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [examId])

  const handleSaveQuestion = async () => {
    if (!formData.questionText || !formData.correctAnswer) {
      toast.error('Please fill in required fields')
      return
    }

    if (
      formData.questionType === 'multiple_choice' &&
      (!formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD)
    ) {
      toast.error('Please provide all options for multiple choice question')
      return
    }

    try {
      const questionNumber = editingQuestion?.question_number || questions.length + 1

      const response = await fetch('/api/exams/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examSessionId: examId,
          questionNumber,
          questionText: formData.questionText,
          questionType: formData.questionType,
          optionA: formData.optionA,
          optionB: formData.optionB,
          optionC: formData.optionC,
          optionD: formData.optionD,
          correctAnswer: formData.correctAnswer,
          marks: parseInt(formData.marks),
          explanation: formData.explanation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(getErrorMessage(data, 'Failed to save question'))
        return
      }

      if (editingQuestion) {
        setQuestions(
          questions.map((q) => (q.id === editingQuestion.id ? data.data : q))
        )
        toast.success('Question updated')
      } else {
        setQuestions([...questions, data.data])
        toast.success('Question added')
      }

      resetForm()
      setOpenDialog(false)
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to save question'))
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return

    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      setQuestions(questions.filter((q) => q.id !== questionId))
      toast.success('Question deleted')
    } catch (error: any) {
      toast.error('Failed to delete question')
    }
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      questionText: question.question_text,
      questionType: question.question_type,
      optionA: question.option_a || '',
      optionB: question.option_b || '',
      optionC: question.option_c || '',
      optionD: question.option_d || '',
      correctAnswer: question.correct_answer,
      marks: question.marks.toString(),
      explanation: question.explanation || '',
    })
    setOpenDialog(true)
  }

  const resetForm = () => {
    setEditingQuestion(null)
    setFormData({
      questionText: '',
      questionType: 'multiple_choice',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
      marks: '1',
      explanation: '',
    })
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{exam?.title}</h1>
          <p className="text-gray-600 mt-2">
            Questions: {questions.length} | Total Marks:{' '}
            {questions.reduce((sum, q) => sum + q.marks, 0)}
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Question Text *</label>
                <Textarea
                  value={formData.questionText}
                  onChange={(e) =>
                    setFormData({ ...formData, questionText: e.target.value })
                  }
                  placeholder="Enter the question"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Question Type *</label>
                <select
                  value={formData.questionType}
                  onChange={(e) =>
                    setFormData({ ...formData, questionType: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="true_false">True/False</option>
                </select>
              </div>

              {formData.questionType === 'multiple_choice' && (
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <div key={letter}>
                      <label className="text-sm font-medium">Option {letter} *</label>
                      <Input
                        value={
                          formData[`option${letter}` as keyof typeof formData]
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [`option${letter}`]: e.target.value,
                          })
                        }
                        placeholder={`Enter option ${letter}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Correct Answer *</label>
                {formData.questionType === 'multiple_choice' ? (
                  <select
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData({ ...formData, correctAnswer: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Correct Answer</option>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                ) : formData.questionType === 'true_false' ? (
                  <select
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData({ ...formData, correctAnswer: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Answer</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                ) : (
                  <Input
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData({ ...formData, correctAnswer: e.target.value })
                    }
                    placeholder="Enter the correct answer"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Marks</label>
                  <Input
                    type="number"
                    value={formData.marks}
                    onChange={(e) =>
                      setFormData({ ...formData, marks: e.target.value })
                    }
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Explanation (Optional)</label>
                <Textarea
                  value={formData.explanation}
                  onChange={(e) =>
                    setFormData({ ...formData, explanation: e.target.value })
                  }
                  placeholder="Provide explanation for the correct answer"
                  rows={2}
                />
              </div>

              <Button onClick={handleSaveQuestion} className="w-full">
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {questions.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No questions added yet. Click "Add Question" to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      Q{question.question_number}: {question.question_text}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      Type: {question.question_type} | Marks: {question.marks}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuestion(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {question.question_type === 'multiple_choice' && (
                    <div>
                      <p className="font-medium">Options:</p>
                      <ul className="ml-4 space-y-1">
                        {['a', 'b', 'c', 'd'].map((opt, idx) => {
                          const optionValue =
                            question[`option_${opt}` as keyof Question]
                          if (!optionValue) return null
                          const letter = opt.toUpperCase()
                          const isCorrect = letter === question.correct_answer
                          return (
                            <li
                              key={opt}
                              className={isCorrect ? 'text-green-700 font-medium' : ''}
                            >
                              {letter}: {optionValue}
                              {isCorrect && ' ✓'}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                  {question.question_type === 'true_false' && (
                    <p>
                      Correct Answer: <span className="font-medium">{question.correct_answer}</span>
                    </p>
                  )}
                  {question.explanation && (
                    <p className="mt-2 text-gray-600">
                      <span className="font-medium">Explanation:</span> {question.explanation}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button onClick={() => router.push('/teacher/exams')} variant="outline">
        Back to Exams
      </Button>
    </div>
  )
}
