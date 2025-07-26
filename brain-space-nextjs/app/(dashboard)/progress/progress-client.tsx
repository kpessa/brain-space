'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Trophy, Star, Target, Calendar, TrendingUp, Award, Crown, Zap, Flame } from 'lucide-react'
import { useJournalStore } from '@/store/journalStore'
import { useNodesStore } from '@/store/nodeStore'
import { LEVELS } from '@/types/journal'

export default function ProgressClient({ userId }: { userId: string }) {
  const { entries, userProgress, loadEntriesFromFirestore } = useJournalStore()
  const { nodes, loadNodes } = useNodesStore()
  
  useEffect(() => {
    loadEntriesFromFirestore(userId)
    loadNodes(userId)
  }, [userId, loadEntriesFromFirestore, loadNodes])
  
  const currentLevel = LEVELS.find(l => l.level === userProgress.level) || LEVELS[0]
  const nextLevel = LEVELS[userProgress.level] || null
  const xpProgress = nextLevel
    ? (userProgress.currentXP / (nextLevel.maxXP - nextLevel.minXP)) * 100
    : 100
  
  const completedNodes = nodes.filter(n => n.completed).length
  const totalNodes = nodes.length
  const nodeProgress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0
  
  type ActivityType = 'journal' | 'node' | 'braindump' | 'routine' | 'timebox'
  
  interface Activity {
    date: string
    activity: string
    xp: number
    type: ActivityType
  }
  
  const journalActivities: Activity[] = entries.slice(0, 3).map(entry => ({
    date: entry.date,
    activity: `Journal entry: Daily reflection`,
    xp: entry.xpEarned || 50,
    type: 'journal'
  }))
  
  const nodeActivities: Activity[] = nodes.slice(0, 2).map(node => ({
    date: node.createdAt,
    activity: `Created ${node.type}: ${node.title}`,
    xp: 25,
    type: 'node'
  }))
  
  const recentActivities: Activity[] = [...journalActivities, ...nodeActivities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
  
  // Dynamic achievements based on real data
  const achievements = [
    {
      id: 1,
      title: 'First Quest',
      description: 'Complete your first journal entry',
      icon: '🎯',
      unlocked: entries.length > 0,
      date: entries[0]?.date,
    },
    {
      id: 2,
      title: 'Week Warrior',
      description: 'Journal for 7 consecutive days',
      icon: '🔥',
      unlocked: userProgress.currentStreak >= 7,
      date: userProgress.currentStreak >= 7 ? new Date().toISOString() : null,
    },
    {
      id: 3,
      title: 'Mind Mapper',
      description: 'Create your first node',
      icon: '🧠',
      unlocked: nodes.length > 0,
      date: nodes[0]?.createdAt,
    },
    {
      id: 4,
      title: 'Task Master',
      description: 'Complete 10 nodes',
      icon: '✅',
      unlocked: completedNodes >= 10,
      date: completedNodes >= 10 ? new Date().toISOString() : null,
    },
    {
      id: 5,
      title: 'Productivity Hero',
      description: 'Create 50 nodes',
      icon: '🚀',
      unlocked: nodes.length >= 50,
      date: nodes.length >= 50 ? new Date().toISOString() : null,
    },
    {
      id: 6,
      title: 'Reflection Sage',
      description: 'Write 50 journal entries',
      icon: '📚',
      unlocked: entries.length >= 50,
      date: entries.length >= 50 ? new Date().toISOString() : null,
    },
  ]

  return (
      <div className="bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 -m-8 p-8 min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-12 h-12 text-yellow-400" />
              <h1 className="text-4xl font-bold text-white">Hero Progress</h1>
            </div>
            <p className="text-white/80 text-lg">
              Track your growth, celebrate achievements, and level up your life
            </p>
          </header>

        {/* Player Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">Level {userProgress.level}</div>
              <div className="text-sm text-gray-600">Hero Level</div>
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {userProgress.totalXP} / {nextLevel ? nextLevel.maxXP : '∞'} XP
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{completedNodes}</div>
              <div className="text-sm text-gray-600">Nodes Completed</div>
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${nodeProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {completedNodes} / {totalNodes} total
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{userProgress.currentStreak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
              <div className="text-xs text-green-600 mt-2 font-medium">
                🔥 Keep it going!
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{userProgress.totalXP}</div>
              <div className="text-sm text-gray-600">Total XP</div>
              <div className="text-xs text-pink-600 mt-2 font-medium">
                ⚡ {currentLevel.title}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-yellow-500" />
                <CardTitle>Achievements</CardTitle>
              </div>
              <CardDescription>Unlock badges as you complete various challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                      achievement.unlocked 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{achievement.title}</div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                      {achievement.unlocked && achievement.date && (
                        <div className="text-xs text-yellow-600 mt-1">
                          Unlocked {new Date(achievement.date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {achievement.unlocked && (
                      <div className="text-yellow-500">
                        <Star className="w-5 h-5 fill-current" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>Your latest progress and accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${
                        activity.type === 'journal' ? 'bg-blue-500' :
                        activity.type === 'node' ? 'bg-purple-500' :
                        activity.type === 'braindump' ? 'bg-green-500' :
                        activity.type === 'routine' ? 'bg-orange-500' :
                        activity.type === 'timebox' ? 'bg-pink-500' :
                        'bg-yellow-500'
                      }`}>
                        {activity.type === 'journal' ? '📖' :
                         activity.type === 'node' ? '🎯' :
                         activity.type === 'braindump' ? '🧠' :
                         activity.type === 'routine' ? '🌅' :
                         activity.type === 'timebox' ? '⏰' :
                         '🏆'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{activity.activity}</div>
                      <div className="text-sm text-gray-600">{activity.date}</div>
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      +{activity.xp} XP
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
  )
}