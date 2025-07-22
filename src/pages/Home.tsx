import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { BookOpen, Sword, Trophy, Sparkles, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 animate-fadeIn">
            Your Hero's Journey Begins
          </h1>
          <p className="text-xl text-white/80 animate-fadeIn animation-delay-100">
            Chronicle your adventures, track your growth, and become the hero of your own story
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-glow transition-all duration-300 animate-slideInLeft">
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
              <Link to="/journal">
                <Button variant="primary" className="w-full">
                  Begin Your Quest
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-glow transition-all duration-300 animate-slideInRight">
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
              <Link to="/progress">
                <Button variant="secondary" className="w-full">
                  View Achievements
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-glow transition-all duration-300 animate-slideInLeft animation-delay-100">
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
              <Link to="/timebox">
                <Button variant="primary" className="w-full">
                  Plan Your Day
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="hover:shadow-glow transition-all duration-300 animate-fadeIn animation-delay-200">
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
            <Link to="/journal/new">
              <Button size="lg" variant="primary" className="animate-pulse">
                Create Your First Entry
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
