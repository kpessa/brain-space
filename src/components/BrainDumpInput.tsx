import { useState } from 'react'
import { Button } from './Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card'
import { Brain, Sparkles, FileText, Loader2 } from 'lucide-react'

interface BrainDumpInputProps {
  onProcess: (text: string) => void
  isProcessing?: boolean
  useAI?: boolean
  onToggleAI?: (useAI: boolean) => void
}

export function BrainDumpInput({
  onProcess,
  isProcessing = false,
  useAI = true,
  onToggleAI,
}: BrainDumpInputProps) {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')

  // Get AI provider from environment
  const aiProvider = import.meta.env.VITE_AI_PROVIDER || 'mock'
  const providerLabel =
    {
      openai: 'OpenAI GPT-4',
      anthropic: 'Claude AI',
      gemini: 'Google Gemini',
      mock: 'Mock AI (Demo)',
    }[aiProvider] || 'Mock AI'

  const handleSubmit = () => {
    if (text.trim()) {
      onProcess(text.trim())
    }
  }

  const placeholderText = `What's on your mind? Just dump all your thoughts here...

Examples:
- Need to finish the project proposal by Friday
- Idea: What if we added a notification system?
- Feeling overwhelmed with all the tasks
- Remember to call mom about dinner plans
- Bug: Login page crashes on mobile
- Should we use TypeScript for the new feature?`

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-brain-500" />
          <CardTitle>Brain Dump</CardTitle>
        </div>
        <CardDescription>
          Empty your mind. Let your thoughts flow freely, then let AI help organize them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Morning thoughts, Project brainstorm, etc."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-brain-500 focus:ring-2 focus:ring-brain-500/20 transition-all"
          />
        </div>

        <div>
          <label htmlFor="brain-dump" className="block text-sm font-medium mb-2">
            Your Thoughts
          </label>
          <textarea
            id="brain-dump"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholderText}
            rows={10}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-brain-500 focus:ring-2 focus:ring-brain-500/20 transition-all resize-none font-mono text-sm"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">{text.length} characters</span>
            <span className="text-sm text-gray-500">Press Shift+Enter for new line</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useAI}
                onChange={e => onToggleAI?.(e.target.checked)}
                className="w-4 h-4 text-brain-600 border-gray-300 rounded focus:ring-brain-500"
              />
              <span className="text-sm font-medium">Use AI categorization</span>
            </label>
            {useAI && <span className="text-xs text-gray-500 ml-2">({providerLabel})</span>}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setText('')
                setTitle('')
              }}
              disabled={!text && !title}
            >
              <FileText className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!text.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {useAI ? 'Process with AI' : 'Process'}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
