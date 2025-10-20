'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, Sparkles, BookOpen, TrendingUp, AlertCircle, CheckCircle, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface WeakTopic {
  name: string
  subject: string
  score: number
  recommendation: string
}

interface PracticeQuiz {
  id: string
  subject: string
  topic: string
  difficulty: string
  questions: number
  completed: boolean
}

export default function StudentAITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI Learning Assistant. How can I help you study today? I can help you with practice questions, explain concepts, or recommend study materials.',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const weakTopics: WeakTopic[] = [
    {
      name: 'Quadratic Equations',
      subject: 'Mathematics',
      score: 62,
      recommendation: 'Practice more problems on solving quadratic equations using factorization and the quadratic formula.',
    },
    {
      name: 'Photosynthesis',
      subject: 'Biology',
      score: 58,
      recommendation: 'Review the light-dependent and light-independent reactions. Watch the recommended video tutorial.',
    },
    {
      name: 'Paragraph Writing',
      subject: 'English',
      score: 71,
      recommendation: 'Focus on thesis statements and topic sentences. Complete the writing exercises.',
    },
  ]

  const strongTopics = [
    {
      name: 'Algebra',
      subject: 'Mathematics',
      score: 94,
    },
    {
      name: 'Cell Biology',
      subject: 'Biology',
      score: 89,
    },
    {
      name: 'Shakespearean Literature',
      subject: 'English',
      score: 92,
    },
  ]

  const practiceQuizzes: PracticeQuiz[] = [
    {
      id: '1',
      subject: 'Mathematics',
      topic: 'Trigonometry Basics',
      difficulty: 'Medium',
      questions: 10,
      completed: true,
    },
    {
      id: '2',
      subject: 'Physics',
      topic: 'Newton\'s Laws of Motion',
      difficulty: 'Hard',
      questions: 15,
      completed: false,
    },
    {
      id: '3',
      subject: 'Chemistry',
      topic: 'Periodic Table & Bonding',
      difficulty: 'Medium',
      questions: 12,
      completed: false,
    },
  ]

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1500))

      const responses = [
        `That's a great question! Let me help you understand this concept better. To solve ${inputValue.toLowerCase()}, you should: 1) Identify the key components, 2) Apply the relevant formulas or principles, 3) Work through the steps systematically. Would you like me to walk you through an example?`,
        `Interesting! I've found some resources that might help. Based on your learning patterns, I recommend practicing more problems on this topic. Here are the key points to remember...`,
        `I see you're working on this. Let me break it down: First, remember that... Second, you need to consider... Third, apply the formula or concept. Try practicing with 5-10 similar problems.`,
      ]

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to get AI response')
    } finally {
      setLoading(false)
    }
  }

  const startQuiz = (quizId: string) => {
    toast.success('Quiz started! Good luck!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-yellow-500" />
          AI Learning Assistant
        </h1>
        <p className="text-gray-600 mt-2">
          Personalized learning support, practice quizzes, and study recommendations
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="gap-2">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="weak" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Weak Areas</span>
          </TabsTrigger>
          <TabsTrigger value="strong" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Strengths</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Quizzes</span>
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="h-96 flex flex-col">
            <CardHeader>
              <CardTitle>Chat with AI Tutor</CardTitle>
              <CardDescription>Ask questions and get instant help</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-none">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
            </CardContent>

            {/* Chat Input */}
            <div className="border-t p-4 space-y-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask me anything about your studies..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  rows={2}
                  disabled={loading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || loading}
                  size="icon"
                  className="self-end"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Press Shift + Enter for new line
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Weak Areas Tab */}
        <TabsContent value="weak" className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Focus on these areas to improve your overall performance
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {weakTopics.map((topic, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{topic.name}</CardTitle>
                      <CardDescription>{topic.subject}</CardDescription>
                    </div>
                    <Badge variant="destructive">{topic.score}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${topic.score}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-700">{topic.recommendation}</p>
                  <Button variant="outline" className="w-full">
                    Start Practice on {topic.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Strong Areas Tab */}
        <TabsContent value="strong" className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You're excelling in these areas! Keep up the great work!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strongTopics.map((topic, index) => (
              <Card key={index} className="bg-green-50 border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{topic.name}</CardTitle>
                      <CardDescription>{topic.subject}</CardDescription>
                    </div>
                    <Badge className="bg-green-600">{topic.score}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${topic.score}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-4">
          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              Practice quizzes help reinforce your learning
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {practiceQuizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{quiz.topic}</CardTitle>
                      <CardDescription className="mt-1">
                        {quiz.subject} • {quiz.questions} questions • {quiz.difficulty} level
                      </CardDescription>
                    </div>
                    {quiz.completed && (
                      <Badge className="bg-green-600">Completed</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => startQuiz(quiz.id)}
                    className="w-full"
                    variant={quiz.completed ? 'outline' : 'default'}
                  >
                    {quiz.completed ? 'Review Quiz' : 'Start Quiz'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
