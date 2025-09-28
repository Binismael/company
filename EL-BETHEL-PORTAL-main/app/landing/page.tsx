"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  BookOpen,
  Brain,
  Shield,
  Star,
  ChevronRight,
  GraduationCap,
  Award,
  Globe,
  Smartphone,
  Zap,
  CheckCircle,
  Quote,
} from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Personalized education with advanced AI tutoring and smart recommendations",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: BookOpen,
      title: "CBT Examination System",
      description: "Modern computer-based testing with instant results and analytics",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Interactive classrooms with seamless teacher-student communication",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access control",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ]

  const testimonials = [
    {
      name: "Mrs. Sarah Johnson",
      role: "Mathematics Teacher",
      content:
        "The AI-powered grading system has revolutionized how I assess my students. It's incredibly accurate and saves me hours of work.",
      rating: 5,
    },
    {
      name: "David Okafor",
      role: "SS3 Student",
      content:
        "The CBT system is amazing! I can practice exams anytime and get instant feedback. My grades have improved significantly.",
      rating: 5,
    },
    {
      name: "Dr. Michael Adebayo",
      role: "School Administrator",
      content:
        "El Bethel Academy's platform has streamlined our entire school management process. The analytics are incredibly insightful.",
      rating: 5,
    },
  ]

  const stats = [
    { number: "1,200+", label: "Active Students" },
    { number: "85+", label: "Expert Teachers" },
    { number: "98%", label: "Success Rate" },
    { number: "24/7", label: "AI Support" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Image src="/images/logo.png" alt="El Bethel Academy" width={40} height={40} />
              <div>
                <h1 className="text-xl font-bold text-blue-900">El Bethel Academy</h1>
                <p className="text-sm text-yellow-700">Next-Generation Learning</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" className="bg-white/50 hover:bg-white/80">
                  Sign In
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-gradient-to-r from-blue-800 to-yellow-600 hover:from-blue-900 hover:to-yellow-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
                <Zap className="h-3 w-3 mr-1" />
                AI-Powered Education Platform
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-900 via-blue-700 to-yellow-600 bg-clip-text text-transparent mb-6">
                Welcome to the Future of Learning
              </h1>
              <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
                Experience next-generation education with AI-powered learning, real-time collaboration, and
                comprehensive school management. Join thousands of students and teachers already transforming their
                educational journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-800 to-yellow-600 hover:from-blue-900 hover:to-yellow-700 text-lg px-8 py-4"
                  >
                    Start Learning Today
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="bg-white/50 hover:bg-white/80 text-lg px-8 py-4">
                  Watch Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-blue-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">Powerful Features for Modern Education</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform combines cutting-edge technology with proven educational methods
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <Card className="h-full bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div
                        className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
                      >
                        <IconComponent className={`h-8 w-8 ${feature.color}`} />
                      </div>
                      <h3 className="text-xl font-semibold text-blue-900 mb-3">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* About School Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <h2 className="text-4xl font-bold text-blue-900 mb-6">About El Bethel Academy</h2>
              <p className="text-lg text-gray-700 mb-6">
                Founded on the principles of excellence and innovation, El Bethel Academy has been at the forefront of
                educational transformation. We combine traditional values with cutting-edge technology to provide
                world-class education.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-gray-700">Accredited by National Education Board</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-gray-700">Award-winning AI-powered curriculum</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-gray-700">98% university admission rate</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-gray-700">24/7 AI tutoring support</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                <CardContent className="p-6 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">15+</h3>
                  <p className="text-blue-100">Years of Excellence</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white">
                <CardContent className="p-6 text-center">
                  <Award className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">50+</h3>
                  <p className="text-yellow-100">Awards Won</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white">
                <CardContent className="p-6 text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Global</h3>
                  <p className="text-green-100">Recognition</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white">
                <CardContent className="p-6 text-center">
                  <Smartphone className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">24/7</h3>
                  <p className="text-purple-100">AI Support</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">What Our Community Says</h2>
            <p className="text-xl text-gray-600">
              Hear from students, teachers, and administrators who love our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-white/80 backdrop-blur-sm shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-blue-300 mb-4" />
                    <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                    <div>
                      <h4 className="font-semibold text-blue-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-800 to-yellow-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Education?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of students and teachers who are already experiencing the future of learning with El Bethel
              Academy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="bg-white text-blue-800 hover:bg-gray-100 text-lg px-8 py-4">
                  Start Your Journey
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 bg-transparent"
              >
                Contact Us
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image src="/images/logo.png" alt="El Bethel Academy" width={32} height={32} />
                <h3 className="text-xl font-bold">El Bethel Academy</h3>
              </div>
              <p className="text-blue-200">
                Transforming education through AI-powered learning and innovative technology.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-blue-200">
                <li>
                  <Link href="/" className="hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">For Users</h4>
              <ul className="space-y-2 text-blue-200">
                <li>
                  <Link href="/" className="hover:text-white">
                    Student Portal
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Teacher Portal
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Admin Portal
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Parent Access
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-blue-200">
                <p>📧 info@elbethelacademy.edu</p>
                <p>📞 +234 803 123 4567</p>
                <p>📍 Lagos, Nigeria</p>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200">
            <p>&copy; 2025 El Bethel Academy. All rights reserved. Powered by AI & Innovation.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
