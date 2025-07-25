"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhanceNodeFlow = exports.contextAwareAnalysisFlow = exports.healthCheckFlow = exports.categorizeThoughtsFlow = void 0;
const genkit_1 = require("genkit");
const googleai_1 = require("@genkit-ai/googleai");
const zod_1 = require("zod");
// Initialize Genkit with plugins
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY;
console.log('Initializing Genkit with API key:', apiKey ? 'present' : 'missing');
if (!apiKey) {
    console.error('WARNING: No Google AI API key found. AI features will not work.');
    console.error('Please set GOOGLE_AI_API_KEY or GOOGLE_GENAI_API_KEY environment variable.');
}
const ai = (0, genkit_1.genkit)({
    plugins: [
        (0, googleai_1.googleAI)({
            apiKey: apiKey || 'dummy-key-for-initialization', // Provide dummy key to prevent initialization errors
        }),
    ],
});
// Zod schema matching GenAiNodeInput type from @/types/node.ts
const AttemptInputSchema = zod_1.z.object({
    description: zod_1.z.string().describe('Description of the attempt'),
    timestamp: zod_1.z.string().describe('ISO timestamp of the attempt'),
});
// Simplified due date schema for Google AI compatibility
const DueDateSchema = zod_1.z.object({
    type: zod_1.z.enum(['exact', 'relative']).describe('Type of due date'),
    date: zod_1.z.string().optional().describe('ISO date string for exact dates'),
    offset: zod_1.z.number().optional().describe('Number of units from now for relative dates'),
    unit: zod_1.z.enum(['minutes', 'hours', 'days', 'weeks', 'months']).optional().describe('Time unit for relative dates'),
}).optional().describe('Due date information');
const RecurrenceSchema = zod_1.z.object({
    frequency: zod_1.z.enum(['daily', 'weekly', 'monthly', 'custom']).describe('Frequency of recurrence'),
    timesPerInterval: zod_1.z.number().optional().describe('Times per interval (e.g., 2 times per day)'),
    timesOfDay: zod_1.z.array(zod_1.z.string()).optional().describe('Specific times of day (e.g., ["08:00", "18:00"])'),
    daysOfWeek: zod_1.z.array(zod_1.z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional().describe('Days of week for weekly recurrence'),
    interval: zod_1.z.number().optional().describe('For custom intervals'),
    unit: zod_1.z.enum(['minutes', 'hours', 'days', 'weeks', 'months']).optional().describe('Unit used with interval'),
    repeatCount: zod_1.z.number().optional().describe('How many times to repeat'),
    endDate: zod_1.z.string().optional().describe('ISO date when recurrence should stop'),
}).optional().describe('Recurrence pattern');
// Schema exactly matching GenAiNodeInput
const GenAiNodeInputSchema = zod_1.z.object({
    title: zod_1.z.string().optional().describe('Concise title for the node'),
    description: zod_1.z.string().optional().describe('Detailed description or context'),
    aliases: zod_1.z.array(zod_1.z.string()).optional().describe('Alternative names or synonyms'),
    type: zod_1.z.enum(['goal', 'project', 'task', 'option', 'idea', 'question', 'problem', 'insight', 'thought', 'concern']).optional().describe('Node type classification'),
    tags: zod_1.z.array(zod_1.z.string()).optional().describe('Categorical tags for organization'),
    urgency: zod_1.z.number().optional().describe('Urgency level (1-10, higher is more urgent)'),
    importance: zod_1.z.number().optional().describe('Importance level (1-10, higher is more important)'),
    priority: zod_1.z.number().optional().describe('Computed priority (can be calculated later)'),
    children: zod_1.z.array(zod_1.z.string()).optional().describe('References to child nodes by title'),
    logicType: zod_1.z.enum(['AND', 'OR']).optional().describe('Logic type for children'),
    attempts: zod_1.z.array(AttemptInputSchema).optional().describe('Attempts (without id)'),
    dueDate: DueDateSchema.describe('Due date information'),
    recurrence: RecurrenceSchema.describe('Recurrence pattern'),
    completed: zod_1.z.boolean().optional().describe('Whether the node is completed'),
});
// Include original text and AI confidence alongside the node data
const ThoughtSchema = zod_1.z.object({
    text: zod_1.z.string().describe('The original thought text'),
    confidence: zod_1.z.number().min(0).max(1).describe('AI confidence in this categorization'),
    reasoning: zod_1.z.string().optional().describe('AI reasoning for this categorization'),
    nodeData: GenAiNodeInputSchema.describe('Node data in GenAiNodeInput format'),
});
const CategorySchema = zod_1.z.object({
    name: zod_1.z.string().describe('Category name (tasks, ideas, questions, problems, insights, etc.)'),
    thoughts: zod_1.z.array(ThoughtSchema).describe('Thoughts that belong to this category'),
    confidence: zod_1.z.number().min(0).max(1).describe('Overall confidence for this category'),
    reasoning: zod_1.z.string().describe('Why these thoughts belong together'),
});
// Result schema focused on categorization for brain dumps
const CategorizationResultSchema = zod_1.z.object({
    categories: zod_1.z.array(CategorySchema).describe('Categorized groups of thoughts'),
    suggestions: zod_1.z.array(zod_1.z.string()).describe('Helpful suggestions for the user'),
});
// Define input schema
const InputSchema = zod_1.z.object({
    text: zod_1.z.string().describe('The brain dump text to categorize'),
    provider: zod_1.z.enum(['gemini', 'openai']).default('gemini'),
    model: zod_1.z.enum(['gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o', 'gpt-4o-mini']).optional(),
});
// Create the categorization flow
exports.categorizeThoughtsFlow = ai.defineFlow('categorizeThoughts', async (input) => {
    console.log('Starting categorizeThoughts flow with input:', {
        textLength: input.text.length,
        provider: input.provider,
        model: input.model,
    });
    // Check if API key is available
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY);
    if (!hasApiKey) {
        throw new Error('No Google AI API key configured. Please set GOOGLE_AI_API_KEY environment variable.');
    }
    // For now, we'll use Gemini for all requests
    const model = input.model === 'gemini-1.5-pro' ? googleai_1.gemini15Pro : googleai_1.gemini15Flash;
    console.log('Using model:', model);
    try {
        // Generate the categorization
        console.log('Calling AI generate...');
        const startTime = Date.now();
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
        });
        const endTime = Date.now();
        console.log(`AI generation completed in ${endTime - startTime}ms`);
        if (!output) {
            throw new Error('Failed to generate categorization');
        }
        // Return the output directly - category names are now more flexible
        return output;
    }
    catch (error) {
        console.error('Error in categorizeThoughts:', error);
        throw error;
    }
});
// Create a simple health check flow
exports.healthCheckFlow = ai.defineFlow('healthCheck', async () => {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o', 'gpt-4o-mini'],
    };
});
// Create a context-aware analysis flow
exports.contextAwareAnalysisFlow = ai.defineFlow('contextAwareAnalysis', async (input) => {
    // Use context to gather information
    const context = [];
    if (input.includeNodes !== false) {
        context.push(`User's recent nodes and tasks provide context for: ${input.query}`);
    }
    if (input.includeBrainDumps !== false) {
        context.push(`User's recent brain dumps provide additional context`);
    }
    // Generate analysis with context
    const { output } = await ai.generate({
        model: googleai_1.gemini15Flash,
        prompt: `You are analyzing the user's Brain Space data to answer their query.
    
Context: ${context.join('\n')}

User Query: ${input.query}

Please provide:
1. A thorough analysis addressing the query
2. Any relevant nodes that relate to the query
3. Actionable suggestions based on the analysis

Focus on being helpful and specific to the user's data.`,
        output: {
            schema: zod_1.z.object({
                analysis: zod_1.z.string(),
                relevantNodes: zod_1.z
                    .array(zod_1.z.object({
                    id: zod_1.z.string(),
                    text: zod_1.z.string(),
                    category: zod_1.z.string(),
                }))
                    .optional(),
                suggestions: zod_1.z.array(zod_1.z.string()).optional(),
            }),
        },
    });
    return output || { analysis: 'Unable to generate analysis' };
});
// Create a flow for enhancing a single node input with AI
exports.enhanceNodeFlow = ai.defineFlow('enhanceNode', async (input) => {
    console.log('Starting enhanceNode flow with input:', {
        textLength: input.text.length,
        provider: input.provider || 'gemini',
        model: input.model,
    });
    // Check if API key is available
    const hasApiKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY);
    if (!hasApiKey) {
        throw new Error('No Google AI API key configured. Please set GOOGLE_AI_API_KEY environment variable.');
    }
    // For now, we'll use Gemini for all requests
    const model = input.model === 'gemini-1.5-pro' ? googleai_1.gemini15Pro : googleai_1.gemini15Flash;
    console.log('Using model:', model);
    try {
        // Generate the enhanced node data
        console.log('Calling AI to enhance node...');
        const startTime = Date.now();
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
                schema: zod_1.z.object({
                    nodeData: GenAiNodeInputSchema,
                }),
            },
        });
        const endTime = Date.now();
        console.log(`AI enhancement completed in ${endTime - startTime}ms`);
        if (!output) {
            throw new Error('Failed to generate enhanced node data');
        }
        return output;
    }
    catch (error) {
        console.error('Error in enhanceNode:', error);
        throw error;
    }
});
//# sourceMappingURL=genkit.js.map