'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft, Edit2, Heart, Sword, Shield, Users, Scroll, Calendar, Trophy } from 'lucide-react'
import { useJournalStore } from '@/store/journalStore'
import { XPBar } from '@/components/journal/XPBar'
import { LevelDisplay } from '@/components/journal/LevelDisplay'
import { LEVELS } from '@/types/journal'

export default function JournalEntryView() {
  const params = useParams()
  const router = useRouter()
  const { entries, userProgress } = useJournalStore()
  
  const entry = entries.find(e => e.id === params.id)
  const currentLevel = LEVELS.find(l => l.level === userProgress.level) || LEVELS[0]

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">Entry not found</p>
            <Link href="/journal">
              <Button variant="primary">Back to Journal</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const entryDate = new Date(entry.date)

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/journal">
              <Button variant="ghost" className="text-white hover:text-white/80">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Journal
              </Button>
            </Link>
            <Link href={`/journal/edit/${entry.id}`}>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Entry
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-white">Journal Entry</h1>
          <div className="flex items-center gap-4 mt-2 text-white/80">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{entryDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>{entry.xpEarned} XP earned</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Quest */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sword className="w-5 h-5 text-yellow-500" />
                  <CardTitle>Daily Quest</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{entry.dailyQuest}</p>
              </CardContent>
            </Card>

            {/* Gratitude */}
            {entry.gratitude.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <CardTitle>Gratitude</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {entry.gratitude.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Threats */}
            {entry.threats && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    <CardTitle>Threats</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{entry.threats}</p>
                </CardContent>
              </Card>
            )}

            {/* Allies */}
            {entry.allies && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    <CardTitle>Allies</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{entry.allies}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {entry.notes && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Scroll className="w-5 h-5 text-purple-500" />
                    <CardTitle>Additional Notes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{entry.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* XP Summary Sidebar */}
          <div className="space-y-4">
            <Card className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <CardTitle>XP Breakdown</CardTitle>
                <CardDescription>Points earned from this entry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Entry</span>
                    <span className="font-medium">+25 XP</span>
                  </div>
                  {entry.gratitude.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gratitude ({entry.gratitude.length})</span>
                      <span className="font-medium">+{entry.gratitude.length * 5} XP</span>
                    </div>
                  )}
                  {entry.dailyQuest && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quest Defined</span>
                      <span className="font-medium">+10 XP</span>
                    </div>
                  )}
                  {entry.threats && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Threats Identified</span>
                      <span className="font-medium">+5 XP</span>
                    </div>
                  )}
                  {entry.allies && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allies Recognized</span>
                      <span className="font-medium">+5 XP</span>
                    </div>
                  )}
                  {entry.notes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes Bonus</span>
                      <span className="font-medium">+10 XP</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-brain-600">{entry.xpEarned} XP</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Level Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <LevelDisplay level={userProgress.level} size="sm" />
                <XPBar
                  currentXP={userProgress.currentXP}
                  maxXP={currentLevel.maxXP === Infinity ? 1000 : currentLevel.maxXP}
                  level={userProgress.level}
                  className="h-2"
                />
                <p className="text-sm text-gray-600">
                  {userProgress.currentXP} / {currentLevel.maxXP === Infinity ? '∞' : currentLevel.maxXP} XP
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}