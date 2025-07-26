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

export default function NewJournalEntryClient({ userId }: { userId: string }) {
  const router = useRouter()
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
    setFormData({ ...formData, gratitude: newGratitude })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await addEntry({
        ...formData,
        userId,
        date: new Date().toISOString(),
      })
      
      router.push('/journal')
    } catch (error) {
      console.error('Failed to create entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 -m-8 p-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">New Journal Entry</h1>
          <Link href="/journal">
            <Button variant="secondary" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Journal
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gratitude Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <CardTitle>Gratitude</CardTitle>
              </div>
              <CardDescription>What are you grateful for today?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.gratitude.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Gratitude #${index + 1}`}
                    value={item}
                    onChange={(e) => handleGratitudeChange(index, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Daily Quest */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sword className="w-5 h-5 text-blue-500" />
                <CardTitle>Daily Quest</CardTitle>
              </div>
              <CardDescription>What&apos;s your main quest for today?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Today's main objective..."
                value={formData.dailyQuest}
                onChange={(e) => setFormData({ ...formData, dailyQuest: e.target.value })}
                required
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Threats & Obstacles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                <CardTitle>Threats & Obstacles</CardTitle>
              </div>
              <CardDescription>What challenges might you face today?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Potential challenges..."
                value={formData.threats}
                onChange={(e) => setFormData({ ...formData, threats: e.target.value })}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Allies & Resources */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                <CardTitle>Allies & Resources</CardTitle>
              </div>
              <CardDescription>Who or what can help you succeed?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="People, tools, or resources that can help..."
                value={formData.allies}
                onChange={(e) => setFormData({ ...formData, allies: e.target.value })}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-purple-500" />
                <CardTitle>Adventure Notes</CardTitle>
              </div>
              <CardDescription>Any other thoughts or reflections?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Additional thoughts..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/journal">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || !formData.dailyQuest}>
              {isSubmitting ? 'Creating Entry...' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}