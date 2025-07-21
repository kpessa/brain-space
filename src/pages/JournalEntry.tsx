import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Heart, Sword, Shield, Users, ScrollText, Save, X } from 'lucide-react'
import { useJournalStore } from '../store/journal'
import { useAuth } from '../contexts/AuthContext'

export default function JournalEntry() {
  const navigate = useNavigate()
  const addEntry = useJournalStore(state => state.addEntry)
  const { user } = useAuth()
  const [gratitude, setGratitude] = useState<string[]>([])
  const [dailyQuest, setDailyQuest] = useState('')
  const [threats, setThreats] = useState('')
  const [allies, setAllies] = useState('')
  const [notes, setNotes] = useState('')

  const handleGratitudeChange = (index: number, value: string) => {
    const newGratitude = [...gratitude]
    newGratitude[index] = value
    setGratitude(newGratitude)
  }

  const handleGratitudeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && gratitude[index].trim()) {
      e.preventDefault()
      const newGratitude = [...gratitude]
      if (index === gratitude.length - 1) {
        // Add new empty input at the end
        newGratitude.push('')
        setGratitude(newGratitude)
        // Focus the new input after a brief delay
        setTimeout(() => {
          const inputs = document.querySelectorAll('input[data-gratitude-index]')
          const newInput = inputs[inputs.length - 1] as HTMLInputElement
          newInput?.focus()
        }, 0)
      } else {
        // Focus next input
        const nextInput = document.querySelector(
          `input[data-gratitude-index="${index + 1}"]`
        ) as HTMLInputElement
        nextInput?.focus()
      }
    }
  }

  const handleGratitudeBlur = (index: number) => {
    // Remove empty gratitude items when blurring out
    if (!gratitude[index].trim() && gratitude.length > 1) {
      const newGratitude = gratitude.filter((_, i) => i !== index || gratitude[i].trim())
      setGratitude(newGratitude)
    }
  }

  const addGratitudeItem = () => {
    setGratitude([...gratitude, ''])
    // Focus the new input after a brief delay
    setTimeout(() => {
      const inputs = document.querySelectorAll('input[data-gratitude-index]')
      const newInput = inputs[inputs.length - 1] as HTMLInputElement
      newInput?.focus()
    }, 0)
  }

  const handleSave = () => {
    addEntry({
      userId: user?.id || 'demo-user',
      date: new Date().toISOString(),
      gratitude: gratitude.filter(g => g.trim()),
      dailyQuest,
      threats,
      allies,
      notes,
    })
    navigate('/journal')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">New Quest Entry</h1>
            <p className="text-white/80">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/journal')}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </header>

        <div className="space-y-6">
          <Card className="hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-red-500" />
                <CardTitle>Gratitude</CardTitle>
              </div>
              <CardDescription>
                What three things are you grateful for today? These are your sources of strength.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gratitude.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={item}
                    onChange={e => handleGratitudeChange(index, e.target.value)}
                    onKeyDown={e => handleGratitudeKeyDown(index, e)}
                    onBlur={() => handleGratitudeBlur(index)}
                    placeholder="What are you grateful for?"
                    data-gratitude-index={index}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-brain-500 focus:ring-2 focus:ring-brain-500/20 transition-all"
                  />
                ))}
                {gratitude.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addGratitudeItem}
                    className="w-full border-dashed"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Add Gratitude
                  </Button>
                )}
                {gratitude.length > 0 && !gratitude[gratitude.length - 1]?.trim() && (
                  <p className="text-sm text-gray-500 italic">Press Enter to add more</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sword className="w-6 h-6 text-orange-500" />
                <CardTitle>Today's Quest</CardTitle>
              </div>
              <CardDescription>
                What is your main quest for today? What adventure awaits you?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={dailyQuest}
                onChange={e => setDailyQuest(e.target.value)}
                placeholder="Describe your quest for today..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-brain-500 focus:ring-2 focus:ring-brain-500/20 transition-all resize-none"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-red-600" />
                  <CardTitle>Threats & Challenges</CardTitle>
                </div>
                <CardDescription>What obstacles might you face? Name your dragons.</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={threats}
                  onChange={e => setThreats(e.target.value)}
                  placeholder="Identify potential challenges..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-brain-500 focus:ring-2 focus:ring-brain-500/20 transition-all resize-none"
                />
              </CardContent>
            </Card>

            <Card className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-green-600" />
                  <CardTitle>Allies & Resources</CardTitle>
                </div>
                <CardDescription>Who or what can help you on your quest?</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={allies}
                  onChange={e => setAllies(e.target.value)}
                  placeholder="List your allies and resources..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-brain-500 focus:ring-2 focus:ring-brain-500/20 transition-all resize-none"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="hover:shadow-glow transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ScrollText className="w-6 h-6 text-purple-600" />
                <CardTitle>Additional Notes</CardTitle>
              </div>
              <CardDescription>Any other thoughts, reflections, or wisdom gained?</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Write your thoughts..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-brain-500 focus:ring-2 focus:ring-brain-500/20 transition-all resize-none"
              />
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => navigate('/journal')}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Save Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
