'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { ArrowLeft, Plus, X, Heart, Sword, Shield, Users, Scroll } from 'lucide-react'
import { useJournalStore } from '@/store/journalStore'
import { useAuth } from '@/contexts/AuthContext'

export default function NewJournalEntry() {
  const router = useRouter()
  const { user } = useAuth()
  const { addEntry } = useJournalStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    gratitude: ['', '', ''],
    dailyQuest: '',
    threats: '',
    allies: '',
    notes: '',
  })

  const handleGratitudeChange = (index: number, value: string) => {
    const newGratitude = [...formData.gratitude]
    newGratitude[index] = value
    setFormData(prev => ({ ...prev, gratitude: newGratitude }))
  }

  const addGratitudeItem = () => {
    setFormData(prev => ({ ...prev, gratitude: [...prev.gratitude, ''] }))
  }

  const removeGratitudeItem = (index: number) => {
    const newGratitude = formData.gratitude.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, gratitude: newGratitude }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    try {
      await addEntry({
        ...formData,
        gratitude: formData.gratitude.filter(item => item.trim()),
        userId: user.uid,
        date: new Date().toISOString(),
      })
      router.push('/journal')
    } catch (error) {
      console.error('Error creating journal entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link href="/journal">
            <Button variant="ghost" className="mb-4 text-white hover:text-white/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Journal
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white">New Journal Entry</h1>
          <p className="text-white/80 mt-2">Document your journey for {new Date().toLocaleDateString()}</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Gratitude Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <CardTitle>Gratitude</CardTitle>
                </div>
                <CardDescription>What are you grateful for today?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.gratitude.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Gratitude item ${index + 1}`}
                      value={item}
                      onChange={(e) => handleGratitudeChange(index, e.target.value)}
                    />
                    {formData.gratitude.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGratitudeItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGratitudeItem}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add More
                </Button>
              </CardContent>
            </Card>

            {/* Daily Quest */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sword className="w-5 h-5 text-yellow-500" />
                  <CardTitle>Daily Quest</CardTitle>
                </div>
                <CardDescription>What is your main focus or goal for today?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Today's quest or main objective..."
                  value={formData.dailyQuest}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyQuest: e.target.value }))}
                  rows={3}
                  required
                />
              </CardContent>
            </Card>

            {/* Threats */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <CardTitle>Threats</CardTitle>
                </div>
                <CardDescription>What challenges or obstacles do you face?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Challenges, obstacles, or things to watch out for..."
                  value={formData.threats}
                  onChange={(e) => setFormData(prev => ({ ...prev, threats: e.target.value }))}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Allies */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <CardTitle>Allies</CardTitle>
                </div>
                <CardDescription>Who or what supports you on your journey?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="People, resources, or things that help you..."
                  value={formData.allies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allies: e.target.value }))}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Scroll className="w-5 h-5 text-purple-500" />
                  <CardTitle>Additional Notes</CardTitle>
                </div>
                <CardDescription>Any other thoughts or reflections?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Additional thoughts, insights, or reflections..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link href="/journal">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Entry'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}