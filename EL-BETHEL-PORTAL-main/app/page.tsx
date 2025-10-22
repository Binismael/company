'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  GraduationCap,
  Users,
  BookOpen,
  CreditCard,
  Brain,
  Shield,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  CheckCircle,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

const roles = [
  {
    id: 'student',
    title: 'Student',
    description: 'Access your courses, assignments, and grades',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
    features: ['View Grades', 'Submit Assignments', 'Track Attendance'],
  },
  {
    id: 'teacher',
    title: 'Teacher',
    description: 'Manage classes, mark attendance, and record results',
    icon: GraduationCap,
    color: 'from-green-500 to-green-600',
    features: ['Mark Attendance', 'Record Results', 'View Classes'],
  },
  {
    id: 'parent',
    title: 'Parent',
    description: 'Monitor your child\'s academic progress and performance',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    features: ['Child Results', 'Attendance Status', 'Progress Reports'],
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Full system access and school management',
    icon: Shield,
    color: 'from-red-500 to-red-600',
    features: ['User Management', 'Class Setup', 'System Settings'],
  },
  {
    id: 'bursar',
    title: 'Bursar',
    description: 'Manage fees, payments, and financial records',
    icon: CreditCard,
    color: 'from-yellow-500 to-yellow-600',
    features: ['Fee Management', 'Payment Processing', 'Financial Reports'],
  },
]

const teachers = [
  { name: 'Mr. Adebayo Johnson', subject: 'Mathematics', image: 'https://via.placeholder.com/150?text=Teacher+1' },
  { name: 'Mrs. Chioma Okafor', subject: 'English Language', image: 'https://via.placeholder.com/150?text=Teacher+2' },
  { name: 'Dr. Emeka Okonkwo', subject: 'Physics', image: 'https://via.placeholder.com/150?text=Teacher+3' },
  { name: 'Ms. Folake Adeyemi', subject: 'Biology', image: 'https://via.placeholder.com/150?text=Teacher+4' },
]

const testimonials = [
  { name: 'Abigail Obi', role: 'Student, SS3', text: 'This platform made learning fun and interactive. I can access my grades anytime!' },
  { name: 'Mr. Yinka Adebule', role: 'Parent', text: 'I can now monitor my child\'s progress easily. Great initiative!' },
  { name: 'Miss Zainab Ibrahim', role: 'Teacher', text: 'Managing attendance and results is now seamless. A game-changer!' },
]

const features = [
  { icon: Brain, title: 'CBT Exams', desc: 'Students take online exams with instant grading and feedback' },
  { icon: CheckCircle, title: 'Result Management', desc: 'Automated score computation and result sheet generation' },
  { icon: CreditCard, title: 'Fee Payment', desc: 'Secure online payments via Paystack' },
  { icon: Calendar, title: 'Attendance', desc: 'Track and report student attendance' },
  { icon: MessageSquare, title: 'Communication', desc: 'Messaging and announcements between teachers and students' },
  { icon: BookOpen, title: 'Learning Materials', desc: 'Upload class notes, assignments, and past questions' },
]

const news = [
  { date: '2025-01-15', title: 'Portal Launch Announcement', desc: 'El Bethel Academy Portal is now live!' },
  { date: '2025-01-10', title: 'New CBT Exam Module', desc: 'Students can now take online exams with instant results.' },
  { date: '2025-01-05', title: 'Payment Integration Ready', desc: 'Paystack integration for school fees is now available.' },
]

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })

  const handleNewsletterSignup = () => {
    if (!email) {
      toast.error('Please enter your email')
      return
    }
    toast.success(`Newsletter signup from: ${email}`)
    setEmail('')
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all fields')
      return
    }
    toast.success(`Message sent! We'll contact you at ${contactForm.email}`)
    setContactForm({ name: '', email: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://via.placeholder.com/50?text=Logo" alt="Logo" className="h-12 w-12 rounded-lg" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">El Bethel Academy</h1>
              <p className="text-sm text-gray-500">Minna</p>
            </div>
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
            <a href="#programs" className="text-gray-600 hover:text-gray-900">Programs</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            <a href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">Portal</a>
          </div>
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Empowering Education Through Technology
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A unified portal for students, teachers, and administrators to manage classes, exams, payments, and communication easily.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="gap-2">
                <CheckCircle className="h-5 w-5" />
                Login to Portal
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2">
              <Mail className="h-5 w-5" />
              Apply for Admission
            </Button>
            <a href="#contact">
              <Button size="lg" variant="outline" className="gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Us
              </Button>
            </a>
          </div>
        </div>

        {/* About Section */}
        <div id="about" className="mb-20 bg-white rounded-2xl p-12 shadow-lg">
          <h3 className="text-3xl font-bold mb-6">About El Bethel Academy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4">Our Mission</h4>
              <p className="text-gray-600 mb-6">
                To provide world-class education that develops critical thinkers, responsible citizens, and innovative problem-solvers equipped with the skills for global competitiveness.
              </p>
              <h4 className="text-xl font-bold mb-4">Our Vision</h4>
              <p className="text-gray-600">
                To be the leading educational institution in Nigeria, recognized for academic excellence, character development, and technological innovation.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-yellow-100 rounded-xl p-8">
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-blue-600">15+</p>
                  <p className="text-gray-600">Years of Excellence</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-600">500+</p>
                  <p className="text-gray-600">Alumni Success Stories</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-purple-600">100%</p>
                  <p className="text-gray-600">Student-Centered Approach</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Programs Section */}
        <div id="programs" className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">Our Programs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Junior Secondary School</CardTitle>
                <CardDescription>Grades 7-9</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Foundation & Exploration phase focusing on basic competencies.</p>
                <ul className="space-y-2">
                  {['JSS1', 'JSS2', 'JSS3'].map((level) => (
                    <li key={level} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700">{level} - Full curriculum</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Senior Secondary School</CardTitle>
                <CardDescription>Grades 10-12</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Specialization & Excellence phase with WAEC preparation.</p>
                <ul className="space-y-2">
                  {['SS1', 'SS2', 'SS3'].map((level) => (
                    <li key={level} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">{level} - Advanced subjects</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Teachers Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">Our Expert Teachers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teachers.map((teacher) => (
              <Card key={teacher.name} className="text-center">
                <CardContent className="pt-6">
                  <img src={teacher.image} alt={teacher.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                  <h4 className="font-bold text-lg mb-2">{teacher.name}</h4>
                  <p className="text-sm text-gray-600 font-medium">{teacher.subject}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">Portal Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <Icon className="h-8 w-8 text-primary-600 mb-2" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">School Gallery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative overflow-hidden rounded-xl group">
                <img
                  src={`https://via.placeholder.com/400x300?text=Gallery+${i}`}
                  alt={`Gallery ${i}`}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center">
                  <p className="text-white text-lg font-bold">School Facility {i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* News Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">Latest News & Updates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <Card key={item.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <p className="text-sm text-gray-500">{item.date}</p>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">What People Say</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div id="contact" className="mb-20 bg-white rounded-2xl p-12 shadow-lg">
          <h3 className="text-3xl font-bold mb-12 text-center">Get In Touch</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h4 className="text-xl font-bold mb-8">Contact Information</h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="h-6 w-6 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">Address</p>
                    <p className="text-gray-600">Opposite Off Bida Road, Zakka Villge, Gbaganu Minna, Niger State</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Phone className="h-6 w-6 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">Phone</p>
                    <p className="text-gray-600">+234 806 092 0319</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Mail className="h-6 w-6 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">Email</p>
                    <p className="text-gray-600">elbethelacademy99@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="Your email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  placeholder="Your message"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                ></textarea>
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mb-20 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h3>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Get the latest updates about new features, announcements, and school news.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white text-gray-900"
            />
            <Button onClick={handleNewsletterSignup} className="bg-white text-primary-600 hover:bg-gray-100">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">Choose Your Role</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
              const IconComponent = role.icon
              return (
                <Card
                  key={role.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden"
                >
                  <div className={`h-1 bg-gradient-to-r ${role.color}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{role.title}</CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                      <IconComponent className="h-6 w-6 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {role.features.map((feature) => (
                        <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/register" className="block">
                      <Button
                        variant="outline"
                        className="w-full gap-2 group"
                      >
                        Get Started
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">El Bethel Academy</h4>
              <p className="text-gray-400">
                Empowering Education Through Technology
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white">About</a></li>
                <li><a href="#programs" className="hover:text-white">Programs</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Portal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/auth/login" className="hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="hover:text-white">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>elbethelacademy99@gmail.com</li>
                <li>+234 806 092 0319</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 El Bethel Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
