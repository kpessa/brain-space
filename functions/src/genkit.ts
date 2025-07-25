import { genkit } from 'genkit'
import { googleAI, gemini15Flash, gemini15Pro } from '@genkit-ai/googleai'
import { z } from 'zod'

// Initialize Genkit with plugins
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY
console.log('Initializing Genkit with API key:', apiKey ? 'present' : 'missing')

if (!apiKey) {
  console.error('WARNING: No Google AI API key found. AI features will not work.')
  console.error('Please set GOOGLE_AI_API_KEY or GOOGLE_GENAI_API_KEY environment variable.')
}

const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey || 'dummy-key-for-initialization', // Provide dummy key to prevent initialization errors
    }),
  ],
})

// Zod schema matching GenAiNodeInput type from @/types/node.ts
const AttemptInputSchema = z.object({
  description: z.string().describe('Description of the attempt'),
  timestamp: z.string().describe('ISO timestamp of the attempt'),
})

// Simplified due date schema for Google AI compatibility
const DueDateSchema = z.object({
  type: z.enum(['exact', 'relative']).describe('Type of due date'),
  date: z.string().optional().describe('ISO date string for exact dates'),
  offset: z.number().optional().describe('Number of units from now for relative dates'),
  unit: z.enum(['minutes', 'hours', 'days', 'weeks', 'months']).optional().describe('Time unit for relative dates'),
}).optional().describe('Due date information')

const RecurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']).describe('Frequency of recurrence'),
  timesPerInterval: z.number().optional().describe('Times per interval (e.g., 2 times per day)'),
  timesOfDay: z.array(z.string()).optional().describe('Specific times of day (e.g., ["08:00", "18:00"])'),
  daysOfWeek: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional().describe('Days of week for weekly recurrence'),
  interval: z.number().optional().describe('For custom intervals'),
  unit: z.enum(['minutes', 'hours', 'days', 'weeks', 'months']).optional().describe('Unit used with interval'),
  repeatCount: z.number().optional().describe('How many times to repeat'),
  endDate: z.string().optional().describe('ISO date when recurrence should stop'),
}).optional().describe('Recurrence pattern')

// Schema exactly matching GenAiNodeInput
const GenAiNodeInputSchema = z.object({
  title: z.string().optional().describe('Concise title for the node'),
  description: z.string().optional().describe('Detailed description or context'),
  aliases: z.array(z.string()).optional().describe('Alternative names or synonyms'),
  type: z.enum(['goal', 'project', 'task', 'option', 'idea', 'question', 'problem', 'insight', 'thought', 'concern']).optional().describe('Node type classification'),
  tags: z.array(z.string()).optional().describe('Categorical tags for organization'),
  urgency: z.number().optional().describe('Urgency level (1-10, higher is more urgent)'),
  importance: z.number().optional().describe('Importance level (1-10, higher is more important)'),
  priority: z.number().optional().describe('Computed priority (can be calculated later)'),
  children: z.array(z.string()).optional().describe('References to child nodes by title'),
  logicType: z.enum(['AND', 'OR']).optional().describe('Logic type for children'),
  attempts: z.array(AttemptInputSchema).optional().describe('Attempts (without id)'),
  dueDate: DueDateSchema.describe('Due date information'),
  recurrence: RecurrenceSchema.describe('Recurrence pattern'),
  completed: z.boolean().optional().describe('Whether the node is completed'),
})

// Include original text and AI confidence alongside the node data
const ThoughtSchema = z.object({
  text: z.string().describe('The original thought text'),
  confidence: z.number().min(0).max(1).describe('AI confidence in this categorization'),
  reasoning: z.string().optional().describe('AI reasoning for this categorization'),
  nodeData: GenAiNodeInputSchema.describe('Node data in GenAiNodeInput format'),
})

const CategorySchema = z.object({
  name: z.string().describe('Category name (tasks, ideas, questions, problems, insights, etc.)'),
  thoughts: z.array(ThoughtSchema).describe('Thoughts that belong to this category'),
  confidence: z.number().min(0).max(1).describe('Overall confidence for this category'),
  reasoning: z.string().describe('Why these thoughts belong together'),
})

// Result schema focused on categorization for brain dumps
const CategorizationResultSchema = z.object({
  categories: z.array(CategorySchema).describe('Categorized groups of thoughts'),
  suggestions: z.array(z.string()).describe('Helpful suggestions for the user'),
})

// Define input schema
const InputSchema = z.object({
  text: z.string().describe('The brain dump text to categorize'),
  provider: z.enum(['gemini', 'openai']).default('gemini'),
  model: z.enum(['gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o', 'gpt-4o-mini']).optional(),
})

type InputType = z.infer<typeof InputSchema>
type OutputType = z.infer<typeof CategorizationResultSchema>

// Create the categorization flow
export const categorizeThoughtsFlow = ai.defineFlow(
  'categorizeThoughts',
  async (input: InputType): Promise<OutputType> => {
    console.log('Starting categorizeThoughts flow with input:', {
      textLength: input.text.length,
      provider: input.provider,
      model: input.model,
    })

    // Check if API key is available
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY)
    if (!hasApiKey) {
      throw new Error(
        'No Google AI API key configured. Please set GOOGLE_AI_API_KEY environment variable.'
      )
    }

    // For now, we'll use Gemini for all requests
    const model = input.model === 'gemini-1.5-pro' ? gemini15Pro : gemini15Flash
    console.log('Using model:', model)

    try {
      // Generate the categorization
      console.log('Calling AI generate...')
      const startTime = Date.now()
      const { output } = await ai.generate({
        model,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
        prompt: `You are a thought categorization assistant for Brain Space. Analyze this brain dump and organize the thoughts into logical categories.

Your job is to:
1. **Extract individual thoughts** from the brain dump text
2. **Group related thoughts** into meaningful categories  
3. **Create structured node data** for each thought using the GenAiNodeInput format
4. **Provide insights** about the user's thinking patterns

For each thought, provide:
- **text**: The original thought text (preserve exact wording)
- **confidence**: How confident you are in this categorization (0.0 to 1.0)
- **reasoning**: Brief explanation of your categorization
- **nodeData**: Structured data that includes:

  Core fields:
  - **title**: Clear, concise title (max 60 chars)
  - **type**: One of: "goal", "project", "task", "option", "idea", "question", "problem", "insight", "thought", "concern"
  - **description**: Additional context if needed
  
  Classification:
  - **aliases**: Alternative names or synonyms
  - **tags**: Descriptive labels for organization
  
  Priority (for tasks/goals):
  - **urgency**: Rate 1-10 (higher = more urgent)
  - **importance**: Rate 1-10 (higher = more important)
  - **priority**: Can be computed later, or provide if obvious
  
  Relationships:
  - **children**: References to other thoughts by their titles (for hierarchies)
  - **logicType**: "AND" or "OR" if children exist
  
  Scheduling:
  - **dueDate**: Extract if mentioned as {type: "exact", date: "ISO-date"} or {type: "relative", offset: number, unit: "days"}
  - **recurrence**: If repeating patterns mentioned
  - **completed**: false for new items, true if marked as done

The system will handle:
- ID generation
- User assignment  
- ReactFlow positioning
- Timestamps and auditing

Group thoughts into logical categories and explain why they belong together.

Provide 2-3 actionable suggestions based on the user's thought patterns.

IMPORTANT: Your response MUST include:
1. All thoughts must have "text" field with original text
2. "suggestions" array must always be present (minimum 2 suggestions)

Example response structure:
{
  "categories": [
    {
      "name": "tasks",
      "thoughts": [
        {
          "text": "I need to call the dentist tomorrow",
          "confidence": 0.95,
          "reasoning": "Action item with deadline",
          "nodeData": {
            "title": "Call dentist",
            "type": "task",
            "description": "Schedule dental appointment",
            "urgency": 8,
            "importance": 7,
            "tags": ["health", "appointment"],
            "dueDate": {"type": "relative", "offset": 1, "unit": "days"}
          }
        }
      ],
      "confidence": 0.95,
      "reasoning": "These are actionable items that need to be completed"
    }
  ],
  "suggestions": [
    "Consider setting reminders for time-sensitive tasks",
    "Group related tasks to work on them more efficiently"
  ]
}

Brain dump text to analyze:
${input.text}`,
        output: {
          schema: CategorizationResultSchema,
        },
      })

      const endTime = Date.now()
      console.log(`AI generation completed in ${endTime - startTime}ms`)

      if (!output) {
        throw new Error('Failed to generate categorization')
      }

      // Return the output directly - category names are now more flexible
      return output
    } catch (error) {
      console.error('Error in categorizeThoughts:', error)
      throw error
    }
  }
)

// Create a simple health check flow
export const healthCheckFlow = ai.defineFlow(
  'healthCheck',
  async (): Promise<{ status: string; timestamp: string; models: string[] }> => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o', 'gpt-4o-mini'],
    }
  }
)

// Create a context-aware analysis flow
export const contextAwareAnalysisFlow = ai.defineFlow(
  'contextAwareAnalysis',
  async (input: {
    userId: string
    query: string
    includeNodes?: boolean
    includeBrainDumps?: boolean
  }): Promise<{
    analysis: string
    relevantNodes?: Array<{ id: string; text: string; category: string }>
    suggestions?: string[]
  }> => {
    // Use context to gather information
    const context = []

    if (input.includeNodes !== false) {
      context.push(`User's recent nodes and tasks provide context for: ${input.query}`)
    }

    if (input.includeBrainDumps !== false) {
      context.push(`User's recent brain dumps provide additional context`)
    }

    // Generate analysis with context
    const { output } = await ai.generate({
      model: gemini15Flash,
      prompt: `You are analyzing the user's Brain Space data to answer their query.
    
Context: ${context.join('\n')}

User Query: ${input.query}

Please provide:
1. A thorough analysis addressing the query
2. Any relevant nodes that relate to the query
3. Actionable suggestions based on the analysis

Focus on being helpful and specific to the user's data.`,
      output: {
        schema: z.object({
          analysis: z.string(),
          relevantNodes: z
            .array(
              z.object({
                id: z.string(),
                text: z.string(),
                category: z.string(),
              })
            )
            .optional(),
          suggestions: z.array(z.string()).optional(),
        }),
      },
    })

    return output || { analysis: 'Unable to generate analysis' }
  }
)

// Create a flow for enhancing a single node input with AI
export const enhanceNodeFlow = ai.defineFlow(
  'enhanceNode',
  async (input: {
    text: string
    provider?: 'gemini' | 'openai'
    model?: string
  }): Promise<{ nodeData: z.infer<typeof GenAiNodeInputSchema> }> => {
    console.log('Starting enhanceNode flow with input:', {
      textLength: input.text.length,
      provider: input.provider || 'gemini',
      model: input.model,
    })

    // Check if API key is available
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY)
    if (!hasApiKey) {
      throw new Error(
        'No Google AI API key configured. Please set GOOGLE_AI_API_KEY environment variable.'
      )
    }

    // For now, we'll use Gemini for all requests
    const model = input.model === 'gemini-1.5-pro' ? gemini15Pro : gemini15Flash
    console.log('Using model:', model)

    try {
      // Generate the enhanced node data
      console.log('Calling AI to enhance node...')
      const startTime = Date.now()
      const { output } = await ai.generate({
        model,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
        prompt: `You are a helpful assistant that enhances user input into structured node data for Brain Space.

Given this input text, create a well-structured node with the following fields:

**CRITICAL REQUIREMENT FOR TITLE:**
- **title**: MUST be 1-2 words MAX, or a short mnemonic. Examples:
  - "finish quarterly report" → "Q4Report" or "QuarterlyRpt"
  - "call dentist tomorrow" → "Dentist" or "DentAppt"
  - "implement user authentication" → "UserAuth" or "Auth"
  - "buy groceries" → "Groceries" or "Shop"
  - "fix login bug" → "LoginBug" or "BugFix"
  - "plan vacation" → "Vacation" or "VacPlan"
  
**Other Required Fields:**
- **description**: Put the FULL original text here
- **type**: Choose the most appropriate type:
  - "goal" - Long-term objectives or aspirations
  - "project" - Multi-task initiatives with clear outcomes
  - "task" - Specific actionable items
  - "option" - Choices or alternatives to consider
  - "idea" - Creative concepts or proposals
  - "question" - Things to investigate or understand
  - "problem" - Issues that need solving
  - "insight" - Realizations or learnings
  - "thought" - General reflections
  - "concern" - Worries or risks

**Optional (only include if relevant):**
- **aliases**: Alternative names or synonyms
- **tags**: Descriptive labels for categorization
- **urgency**: 1-10 (only for tasks/problems)
- **importance**: 1-10 (only for tasks/goals)
- **dueDate**: If a deadline is mentioned
- **children**: Break down into subtasks if appropriate
- **recurrence**: If it's a repeating item

Remember: The title MUST be extremely brief (1-2 words) while the description contains all the detail.

Input text: "${input.text}"`,
        output: {
          schema: z.object({
            nodeData: GenAiNodeInputSchema,
          }),
        },
      })

      const endTime = Date.now()
      console.log(`AI enhancement completed in ${endTime - startTime}ms`)

      if (!output) {
        throw new Error('Failed to generate enhanced node data')
      }

      return output
    } catch (error) {
      console.error('Error in enhanceNode:', error)
      throw error
    }
  }
)
