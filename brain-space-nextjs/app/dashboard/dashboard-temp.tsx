'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { BookOpen, Trophy, Clock, SunMoon, Brain, Sparkles, Sword, Calendar, Grid3x3 } from 'lucide-react'

export default function Dashboard() {
  // Force client component by using state and effect
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in">
            Your Hero's Journey Begins
          </h1>
          <p className="text-xl text-white/80 animate-fade-in">
            Chronicle your adventures, track your growth, and become the hero of your own story
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-brain-500" />
                <CardTitle>Daily Quest Journal</CardTitle>
              </div>
              <CardDescription>
                Record your gratitude, define your quests, and identify allies & threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Transform your daily reflections into epic adventures with guided prompts and
                AI-powered insights.
              </p>
              <Link href="/dashboard/journal">
                <Button variant="primary" className="w-full">
                  Begin Your Quest
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-brain-500" />
                <CardTitle>Brain Dump</CardTitle>
              </div>
              <CardDescription>
                Visualize your thoughts in interactive mindmaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Transform scattered thoughts into organized, AI-categorized mindmaps for better clarity.
              </p>
              <Link href="/dashboard/braindump">
                <Button variant="primary" className="w-full">
                  Explore Ideas
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Grid3x3 className="w-8 h-8 text-purple-500" />
                <CardTitle>Eisenhower Matrix</CardTitle>
              </div>
              <CardDescription>
                Prioritize tasks by urgency and importance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Organize your tasks into four quadrants to focus on what matters most.
              </p>
              <Link href="/dashboard/matrix">
                <Button variant="primary" className="w-full">
                  Prioritize Tasks
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-space-500" />
                <CardTitle>Your Progress</CardTitle>
              </div>
              <CardDescription>
                Track your level, achievements, and journey milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Watch your character grow as you complete quests and overcome challenges.
              </p>
              <Link href="/dashboard/progress">
                <Button variant="secondary" className="w-full">
                  View Achievements
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-brain-500" />
                <CardTitle>Timebox Schedule</CardTitle>
              </div>
              <CardDescription>
                Organize your tasks into time blocks for focused productivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop tasks from your brain dumps into 2-hour time blocks throughout your day.
              </p>
              <Link href="/dashboard/timebox">
                <Button variant="primary" className="w-full">
                  Plan Your Day
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <SunMoon className="w-8 h-8 text-purple-500" />
                <CardTitle>Morning & Evening Routines</CardTitle>
              </div>
              <CardDescription>
                Transform your days with intentional morning and evening rituals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Join a 66-day journey to wake up earlier and create powerful daily routines.
              </p>
              <Link href="/dashboard/routines">
                <Button variant="primary" className="w-full">
                  Start Your Journey
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-space-500" />
                <CardTitle>Calendar & Events</CardTitle>
              </div>
              <CardDescription>
                Sync with Google Calendar and manage your schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Integrate your calendar events with your productivity workflow.
              </p>
              <Link href="/dashboard/calendar">
                <Button variant="secondary" className="w-full">
                  View Calendar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="hover:shadow-lg transition-all duration-300 animate-fade-in">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-brain-500" />
              <CardTitle>New Adventure Awaits</CardTitle>
              <Sword className="w-6 h-6 text-space-500" />
            </div>
            <CardDescription>
              Start your journey today and unlock the power of reflective journaling
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/dashboard/journal/new">
              <Button size="lg" variant="primary" className="animate-pulse-subtle">
                Create Your First Entry
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}