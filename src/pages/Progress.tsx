import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Trophy, Target, Flame, Star, Award, TrendingUp, ArrowLeft } from 'lucide-react'
import { useJournalStore } from '../store/journal'
import { LEVELS } from '../types/journal'
import { AchievementBadge } from '../components/AchievementBadge'

export default function Progress() {
  const { entries, userProgress } = useJournalStore()
  const currentLevel = LEVELS.find(l => l.level === userProgress.level) || LEVELS[0]
  const nextLevel = LEVELS[userProgress.level] || null
  const progressPercentage = nextLevel
    ? (userProgress.currentXP / (nextLevel.maxXP - nextLevel.minXP)) * 100
    : 100
  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-white">Your Hero's Progress</h1>
          </div>
          <p className="text-white/80">Track your journey from novice to legendary hero</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-gradient-to-br from-brain-50 to-space-50">
            <CardHeader>
              <CardTitle className="text-2xl">Character Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-brain-700">
                      Level {userProgress.level} - {currentLevel.title}
                    </h3>
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Experience Points</span>
                      <span>
                        {userProgress.currentXP} /{' '}
                        {nextLevel ? nextLevel.maxXP - nextLevel.minXP : '∞'} XP
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-brain-500 to-space-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Complete daily quests to gain experience and level up!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{userProgress.currentStreak}</p>
                    <p className="text-sm text-gray-600">Day Streak</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{entries.length}</p>
                    <p className="text-sm text-gray-600">Quests Completed</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Next Milestone Rewards</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <Star className="w-6 h-6 text-yellow-500" />
                      <div>
                        <p className="font-medium">
                          Level {nextLevel?.level || 5} - {nextLevel?.title || 'Max Level'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {nextLevel?.perks[0] || "You've reached the highest level!"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg opacity-50">
                      <Award className="w-6 h-6 text-purple-500" />
                      <div>
                        <p className="font-medium">First Week Warrior</p>
                        <p className="text-sm text-gray-600">Complete 7 consecutive days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Badges earned on your journey</CardDescription>
              </CardHeader>
              <CardContent>
                {userProgress.achievements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No achievements yet</p>
                    <p className="text-sm mt-2">Start journaling to earn badges!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {userProgress.achievements.map(achievement => (
                      <AchievementBadge key={achievement.id} achievement={achievement} size="sm" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Entries</span>
                    <span className="font-semibold">{entries.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Gratitude Items</span>
                    <span className="font-semibold">
                      {entries.reduce((sum, e) => sum + e.gratitude.length, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Threats Identified</span>
                    <span className="font-semibold">
                      {entries.filter(e => e.threats.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Allies Found</span>
                    <span className="font-semibold">
                      {entries.filter(e => e.allies.trim()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Words Written</span>
                    <span className="font-semibold">
                      {entries.reduce((sum, e) => sum + e.notes.length + e.dailyQuest.length, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <CardTitle>Growth Tip</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  <strong>Hero's Wisdom:</strong> Consistency is key! Try to journal at the same
                  time each day to build a powerful habit.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
