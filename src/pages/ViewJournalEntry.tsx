import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Heart, Sword, Shield, Users, ScrollText, X, Edit2, Trophy } from 'lucide-react'
import { useJournalStore } from '../store/journal'

export default function ViewJournalEntry() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { entries } = useJournalStore()

  // Find the entry to view
  const entry = entries.find(e => e.id === id)

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">Entry not found</p>
            <Button variant="primary" onClick={() => navigate('/journal')}>
              Back to Journal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Quest Entry</h1>
            <p className="text-white/80">
              {new Date(entry.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate(`/journal/edit/${entry.id}`)}
              className="text-white hover:bg-white/10"
            >
              <Edit2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/journal')}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="mb-6 flex items-center gap-3 text-white">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-lg font-semibold">+{entry.xpEarned} XP Earned</span>
        </div>

        <div className="space-y-6">
          {entry.gratitude.length > 0 && (
            <Card className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-red-500" />
                  <CardTitle>Gratitude</CardTitle>
                </div>
                <CardDescription>Sources of strength from this day</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {entry.gratitude.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {entry.dailyQuest && (
            <Card className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Sword className="w-6 h-6 text-orange-500" />
                  <CardTitle>Daily Quest</CardTitle>
                </div>
                <CardDescription>The adventure undertaken</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{entry.dailyQuest}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {entry.threats && (
              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-red-600" />
                    <CardTitle>Threats & Challenges</CardTitle>
                  </div>
                  <CardDescription>Dragons faced</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{entry.threats}</p>
                </CardContent>
              </Card>
            )}

            {entry.allies && (
              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-green-600" />
                    <CardTitle>Allies & Resources</CardTitle>
                  </div>
                  <CardDescription>Companions on the journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{entry.allies}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {entry.notes && (
            <Card className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ScrollText className="w-6 h-6 text-purple-600" />
                  <CardTitle>Additional Notes</CardTitle>
                </div>
                <CardDescription>Wisdom and reflections</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{entry.notes}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/journal')}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Back to Journal
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/journal/edit/${entry.id}`)}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Edit Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
