'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  GraduationCap,
  Users,
  BookOpen,
  CreditCard,
  Brain,
  Shield,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

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
    description: 'Manage school finances and student payments',
    icon: CreditCard,
    color: 'from-yellow-500 to-yellow-600',
    features: ['Track Payments', 'Manage Fees', 'Payment Reports'],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F291857ff22134997b4885aff7248bbb5%2Fee4263e9927d42dba9246b8809a43ad7?format=webp&width=800"
                alt="El Bethel Academy Logo"
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-xl font-bold text-primary-700">
                  El Bethel Academy
                </h1>
                <p className="text-xs text-gray-500">Minna</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-primary-600 hover:bg-primary-700">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-5xl font-bold text-gray-900">
            Next-Generation Learning Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-Powered School Management System with Advanced Analytics, Real-time Collaboration, and Secure Access for Students, Teachers, Parents, and Administrators.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="gap-2 bg-primary-600 hover:bg-primary-700">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary-600 mb-2">1,200+</div>
              <p className="text-gray-600">Active Students</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-2">85+</div>
              <p className="text-gray-600">Expert Teachers</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <p className="text-gray-600">System Uptime</p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">
            Powerful Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>AI-Powered Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Intelligent tutoring system that adapts to each student's learning pace
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Real-time Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Seamless communication between students, teachers, and parents
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Advanced Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Enterprise-grade encryption and role-based access control
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12">
            Choose Your Role
          </h3>
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

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your School Experience?
          </h3>
          <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
            Join thousands of students, teachers, and parents using El Bethel Academy's
            cutting-edge learning platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                Register Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/20"
              >
                Login to Your Account
              </Button>
            </Link>
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
                Next-Generation Learning Platform
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Users</h4>
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
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Results Management</a></li>
                <li><a href="#" className="hover:text-white">Attendance Tracking</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
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
