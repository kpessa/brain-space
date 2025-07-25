# AI Integration Example

## Configuration

Add to your `.env` file:
```env
# Choose your provider
VITE_AI_PROVIDER=anthropic  # or 'openai'

# Add your API keys
VITE_OPENAI_API_KEY=sk-...your-key...
VITE_ANTHROPIC_API_KEY=sk-ant-...your-key...
```

## How It Works

### Input Example:
```
I really need to prepare the presentation for tomorrow's client meeting at 9am, 
it's super important. Also need to book flights for the New York trip by Friday. 
Maybe I should also learn React Native for the mobile project next quarter. 
Oh and fix that critical bug in production ASAP!
```

### AI Output:

**Categories Created:**
1. **Work** (3 items)
2. **Travel** (1 item)  
3. **Learning** (1 item)

**Extracted Thoughts with Metadata:**

**Work Category:**
- "Prepare presentation for client meeting"
  - Urgency: 9/10 (tomorrow morning)
  - Importance: 8/10 (client meeting)
  - Due Date: 2024-01-16
  - Reasoning: "Meeting tomorrow indicates critical urgency"

- "Fix critical bug in production"
  - Urgency: 10/10 (ASAP)
  - Importance: 9/10 (production issue)
  - Reasoning: "Production bug requires immediate attention"

**Travel Category:**
- "Book flights for New York trip"
  - Urgency: 7/10 (by Friday)
  - Importance: 6/10 (travel arrangement)
  - Due Date: 2024-01-19
  - Reasoning: "Deadline approaching but not immediate"

**Learning Category:**
- "Learn React Native for mobile project"
  - Urgency: 3/10 (next quarter)
  - Importance: 7/10 (project requirement)
  - Due Date: 2024-04-01
  - Reasoning: "Long-term skill development"

## Key Features:

1. **Filler Removal**: "I really need to", "Maybe I should" → removed
2. **Date Extraction**: "tomorrow", "by Friday", "next quarter" → specific dates
3. **Priority Analysis**: Based on keywords like "critical", "ASAP", "important"
4. **Smart Categorization**: Groups by content themes, not generic categories
5. **Eisenhower Matrix**: Automatic urgency/importance for prioritization

## API Usage:

- **OpenAI**: Uses GPT-4 Turbo with JSON mode
- **Anthropic**: Uses Claude 3 Haiku for fast, cost-effective processing
- **Fallback**: Uses pattern matching if no API configured

## Error Handling:

- Retries on API failures
- Falls back to mock service if API unavailable
- Logs usage for monitoring
- Validates JSON responses