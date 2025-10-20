'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ExamQuestion {
  id: string
  question_number: number
  question_text: string
  question_type: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  marks: number
}

interface StudentAnswer {
  id: string
  selected_answer: string
  answered_at: string
}

export default function ExamTakePage({ params }: { params: { examId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const attemptId = searchParams.get('attemptId')

  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exam, setExam] = useState<any>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const initializeExam = async () => {
      try {
        if (!attemptId) {
          router.push('/student/exams')
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: examData } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', params.examId)
          .single()

        setExam(examData)

        const response = await fetch(`/api/exams/questions?examSessionId=${params.examId}`)
        const questionsData = await response.json()
        setQuestions(questionsData.data || [])

        const answersResponse = await fetch(`/api/exams/answers?attemptId=${attemptId}`)
        const answersData = await answersResponse.json()

        const answersMap: Record<string, string> = {}
        answersData.data?.forEach((answer: StudentAnswer) => {
          answersMap[answer.id] = answer.selected_answer
        })
        setAnswers(answersMap)

        if (examData) {
          setTimeRemaining(examData.duration_minutes * 60)
        }
      } catch (error: any) {
        toast.error('Failed to load exam')
        router.push('/student/exams')
      } finally {
        setLoading(false)
      }
    }

    initializeExam()
  }, [attemptId, params.examId, router])

  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [])

  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      saveCurrentAnswer()
    }, 30000)

    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current)
    }
  }, [currentQuestionIndex, answers])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const saveCurrentAnswer = async () => {
    if (!attemptId || !questions[currentQuestionIndex]) return

    const question = questions[currentQuestionIndex]
    const answer = answers[question.id]

    if (!answer) return

    try {
      await fetch('/api/exams/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId: question.id,
          selectedAnswer: answer,
        }),
      })
    } catch (error) {
      console.error('Failed to save answer')
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleNextQuestion = async () => {
    await saveCurrentAnswer()
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePreviousQuestion = async () => {
    await saveCurrentAnswer()
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmitExam = async () => {
    setSubmitting(true)
    try {
      await saveCurrentAnswer()

      const response = await fetch('/api/exams/attempts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          status: 'submitted',
        }),
      })

      if (!response.ok) {
        toast.error('Failed to submit exam')
        return
      }

      const examData = await response.json()

      await fetch('/api/exams/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          examSessionId: params.examId,
          studentId: (await supabase.from('students').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single()).data?.id,
        }),
      })

      toast.success('Exam submitted successfully!')
      router.push('/student/exams')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit exam')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading exam...</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No questions found for this exam</AlertDescription>
        </Alert>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestion.id] || ''

  return (
    <div className="space-y-6">
      <div className="sticky top-0 bg-white z-10 border-b p-4 flex items-center justify-between rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">{exam?.title}</h1>
          <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-red-600" />
            <span className="font-mono font-bold text-red-600">{formatTime(timeRemaining)}</span>
          </div>
          <Button
            onClick={handleSubmitExam}
            disabled={submitting}
            size="sm"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Exam
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentQuestion.question_text}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Marks: {currentQuestion.marks}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentQuestion.question_type === 'multiple_choice' && (
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((option, idx) => {
                      const optionKey = `option_${String.fromCharCode(96 + idx + 1)}`
                      const optionValue = currentQuestion[optionKey as keyof ExamQuestion]

                      if (!optionValue) return null

                      return (
                        <label
                          key={option}
                          className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option}
                            checked={currentAnswer === option}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            className="mr-3"
                          />
                          <span className="font-medium">Option {option}:</span>
                          <span className="ml-2">{optionValue}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {currentQuestion.question_type === 'short_answer' && (
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-3 border rounded-lg"
                    rows={6}
                  />
                )}

                {currentQuestion.question_type === 'true_false' && (
                  <div className="space-y-3">
                    {['True', 'False'].map((option) => (
                      <label
                        key={option}
                        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={currentAnswer === option}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="mr-3"
                        />
                        <span className="font-medium">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handlePreviousQuestion}
              variant="outline"
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-32">
            <CardHeader>
              <CardTitle className="text-base">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
                      idx === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : answers[q.id]
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>Total Questions: {questions.length}</p>
                <p>Answered: {Object.keys(answers).length}</p>
                <p>Remaining: {questions.length - Object.keys(answers).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
