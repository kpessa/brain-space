'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { ArrowLeft, Plus, X, Heart, Sword, Shield, Users, Scroll, Trash2 } from 'lucide-react'
import { useJournalStore } from '@/store/journalStore'
import { useAuth } from '@/contexts/AuthContext'

export default function EditJournalEntry() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { entries, updateEntry, deleteEntry } = useJournalStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const entry = entries.find(e => e.id === params.id)

  const [formData, setFormData] = useState({
    gratitude: [''],
    dailyQuest: '',
    threats: '',
    allies: '',
    notes: '',
  })

  useEffect(() => {
    if (entry) {
      setFormData({
        gratitude: entry.gratitude.length > 0 ? entry.gratitude : [''],
        dailyQuest: entry.dailyQuest,
        threats: entry.threats || '',
        allies: entry.allies || '',
        notes: entry.notes || '',
      })
    }
  }, [entry])

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
      await updateEntry(entry.id, {
        ...formData,
        gratitude: formData.gratitude.filter(item => item.trim()),
      })
      router.push(`/journal/entry/${entry.id}`)
    } catch (error) {
      console.error('Error updating journal entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    try {
      await deleteEntry(entry.id)
      router.push('/journal')
    } catch (error) {
      console.error('Error deleting journal entry:', error)
    }
  }

  const entryDate = new Date(entry.date)

  return (
    <div className="min-h-screen bg-gradient-to-br from-brain-600 via-space-600 to-brain-700 p-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link href={`/journal/entry/${entry.id}`}>
            <Button variant="ghost" className="mb-4 text-white hover:text-white/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Entry
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white">Edit Journal Entry</h1>
          <p className="text-white/80 mt-2">Editing entry from {entryDate.toLocaleDateString()}</p>
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

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Entry
              </Button>
              <div className="flex gap-4">
                <Link href={`/journal/entry/${entry.id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Delete Entry?</CardTitle>
                <CardDescription>
                  This action cannot be undone. The entry and all associated XP will be permanently removed.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                >
                  Delete Entry
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}