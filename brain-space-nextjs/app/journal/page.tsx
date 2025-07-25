'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { BookOpen, Plus, Calendar, Sword, Shield, Users, Heart, Edit2, Eye } from 'lucide-react'
import { useJournalStore } from '@/store/journalStore'
import { XPBar } from '@/components/journal/XPBar'
import { LevelDisplay } from '@/components/journal/LevelDisplay'
import { StreakCounter } from '@/components/journal/StreakCounter'
import { LEVELS } from '@/types/journal'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardWrapper } from '@/components/DashboardWrapper'

export default function Journal() {
  const { user } = useAuth()
  const { entries, userProgress, getTodayEntry, loadEntriesFromFirestore, loadUserProgressFromFirestore, isLoading } = useJournalStore()
  const todayEntry = getTodayEntry()
  const currentLevel = LEVELS.find(l => l.level === userProgress.level) || LEVELS[0]
  
  useEffect(() => {
    if (user) {
      // Load data from Firestore when user is authenticated
      loadEntriesFromFirestore(user.uid)
      loadUserProgressFromFirestore(user.uid)
    }
  }, [user, loadEntriesFromFirestore, loadUserProgressFromFirestore])
  
  if (isLoading) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading journal...</p>
          </div>
        </div>
      </DashboardWrapper>
    )
  }
  
  return (
    <DashboardWrapper>
      <div className="bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 -m-8 p-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white">Quest Journal</h1>
            <Link href="/journal/new">
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
                    <div className="flex gap-2 mt-4">
                      <Link href={`/journal/entry/${todayEntry.id}`}>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/journal/edit/${todayEntry.id}`}>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No entry for today yet. Start your quest!</p>
                    <Link href="/journal/new">
                      <Button variant="primary">Create Today's Entry</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No entries yet. Start your journey!</p>
                ) : (
                  <div className="space-y-3">
                    {entries.slice(0, 5).map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium">{new Date(entry.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600 truncate">{entry.dailyQuest}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-brain-600 font-medium">+{entry.xpEarned} XP</span>
                          <Link href={`/journal/entry/${entry.id}`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Sidebar */}
          <div className="space-y-4">
            {/* Level Progress Card */}
            <Card className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <LevelDisplay level={userProgress.level} />
                <XPBar
                  currentXP={userProgress.currentXP}
                  maxXP={currentLevel.maxXP === Infinity ? 1000 : currentLevel.maxXP}
                  level={userProgress.level}
                />
                <div className="text-sm text-gray-600">
                  <p>Total XP: {userProgress.totalXP}</p>
                  <p>Total Entries: {userProgress.totalEntries}</p>
                </div>
              </CardContent>
            </Card>

            {/* Streak Card */}
            <Card className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <CardTitle>Current Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <StreakCounter
                  currentStreak={userProgress.currentStreak}
                  longestStreak={userProgress.longestStreak}
                  size="lg"
                />
              </CardContent>
            </Card>

            {/* Level Perks */}
            <Card>
              <CardHeader>
                <CardTitle>Level Perks</CardTitle>
                <CardDescription>Unlocked abilities</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentLevel.perks.map((perk, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-brain-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{perk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </DashboardWrapper>
  )
}