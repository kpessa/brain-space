import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Plus, Calendar, BookOpen, Edit2, Eye, Heart } from 'lucide-react'
import { useJournalStore } from '../store/journal'
import { XPBar } from '../components/XPBar'
import { LevelDisplay } from '../components/LevelDisplay'
import { StreakCounter } from '../components/StreakCounter'
import { LEVELS } from '../types/journal'

export default function Journal() {
  const { entries, userProgress, getTodayEntry } = useJournalStore()
  const todayEntry = getTodayEntry()
  const currentLevel = LEVELS.find(l => l.level === userProgress.level) || LEVELS[0]
  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white">Quest Journal</h1>
            <Link to="/journal/new">
              <Button variant="primary" className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Entry
              </Button>
            </Link>
          </div>
          <p className="text-white/80">Your chronicles of adventure, growth, and discovery</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brain-500" />
                    <CardTitle>Today's Quest</CardTitle>
                  </div>
                  <span className="text-sm text-gray-500">
                    {todayEntry ? 'Completed' : 'Not yet started'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {todayEntry ? (
                  <div className="space-y-2">
                    <p className="font-semibold">Today's Quest:</p>
                    <p className="text-gray-600">{todayEntry.dailyQuest}</p>
                    <p className="text-sm text-brain-600">+{todayEntry.xpEarned} XP earned</p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">
                      Begin today's journey by recording your gratitude, setting your quest, and
                      preparing for the challenges ahead.
                    </p>
                    <Link to="/journal/new">
                      <Button variant="outline" className="w-full">
                        Start Today's Entry
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
                <CardDescription>Your past adventures and reflections</CardDescription>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No entries yet. Start your first quest!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {entries.slice(0, 5).map(entry => (
                      <div
                        key={entry.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-brain-600">+{entry.xpEarned} XP</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/journal/view/${entry.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 hover:bg-gray-200"
                                  title="View entry"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Link to={`/journal/edit/${entry.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 hover:bg-gray-200"
                                  title="Edit entry"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{entry.dailyQuest}</p>
                        {entry.gratitude.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                            <Heart className="w-3 h-3" />
                            <span>
                              {entry.gratitude.length} gratitude
                              {entry.gratitude.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-brain-50 to-space-50">
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <LevelDisplay level={userProgress.level} size="sm" />
                  <XPBar
                    currentXP={userProgress.currentXP}
                    maxXP={currentLevel.maxXP - currentLevel.minXP}
                    level={userProgress.level}
                  />
                  <StreakCounter
                    currentStreak={userProgress.currentStreak}
                    longestStreak={userProgress.longestStreak}
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Entries</span>
                    <span className="font-semibold">{entries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gratitude Items</span>
                    <span className="font-semibold">
                      {entries.reduce((sum, e) => sum + e.gratitude.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total XP Earned</span>
                    <span className="font-semibold">{userProgress.totalXP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Achievements</span>
                    <span className="font-semibold">{userProgress.achievements.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
