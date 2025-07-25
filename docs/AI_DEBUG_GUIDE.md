# AI Debugging Guide

## Enabling Debug Mode

### Method 1: Debug Toggle Button
- Click the bug icon in the bottom-right corner of the Brain Dump page
- Yellow = Debug ON, Gray = Debug OFF

### Method 2: Browser Console
```javascript
// Enable debug mode
localStorage.setItem('ai_debug', 'true')

// Disable debug mode
localStorage.setItem('ai_debug', 'false')
```

## Debug Information Provided

### 1. AI Service Factory
```
🔧 AI Service Factory
Configured provider: anthropic
Environment: {
  VITE_AI_PROVIDER: "anthropic",
  hasOpenAIKey: false,
  hasAnthropicKey: true
}
✅ Creating Anthropic provider
```

### 2. Brain Dump Processing
```
🧠 Starting AI brain dump processing
Raw text length: 245
Raw text preview: I need to prepare the presentation for tomorrow's client meeting...
```

### 3. API Call Details
```
🤖 Anthropic API Call
Input text: [your brain dump text]
Generated prompt: [full prompt sent to AI]
Request body: {...}
```

### 4. API Response
```
Raw API response: {
  id: "msg_...",
  content: [...],
  usage: {
    input_tokens: 523,
    output_tokens: 187
  }
}
Token usage: { input_tokens: 523, output_tokens: 187 }
Anthropic API call duration: 1234ms
```

### 5. Parsed Results
```
Parsed result: {
  categories: [
    { id: "work", name: "Work", confidence: 0.9 }
  ],
  thoughts: [
    {
      text: "Prepare client presentation",
      category: "work",
      urgency: 9,
      importance: 8,
      dueDate: "2024-01-16",
      reasoning: "Meeting tomorrow indicates critical urgency"
    }
  ]
}
```

### 6. Final Processing Results
```
📊 AI Processing Results:
Total thoughts extracted: 5
Thought 1: {
  text: "Prepare client presentation",
  category: "work",
  urgency: 9,
  importance: 8,
  dueDate: "2024-01-16",
  reasoning: "Meeting tomorrow indicates critical urgency"
}
```

### 7. Node Creation
```
🌳 Node creation results:
Total nodes: 8
Total edges: 7
Categories found: ["work", "travel", "learning"]
```

## Common Debug Scenarios

### API Key Issues
```
❌ Anthropic key not configured properly
⚠️ Falling back to mock AI service
```

### API Errors
```
API Error Response: {
  "error": {
    "type": "invalid_request_error",
    "message": "API key is invalid"
  }
}
```

### JSON Parsing Errors
```
Failed to find JSON in response: [raw text response]
❌ AI processing error: Failed to extract JSON from response
```

### Token Usage Monitoring
- Input tokens: Number of tokens in your prompt
- Output tokens: Number of tokens in AI response
- Useful for cost estimation and optimization

## Troubleshooting Tips

1. **Check Environment Variables**
   - Ensure `VITE_AI_PROVIDER` is set correctly
   - Verify API keys are valid and not the placeholder values

2. **Monitor API Responses**
   - Look for rate limiting errors
   - Check for malformed JSON responses
   - Verify token usage is within limits

3. **Test with Simple Input**
   - Try: "Buy milk tomorrow"
   - Should extract: urgency=8, importance=3, dueDate=[tomorrow's date]

4. **Check Network Tab**
   - Look for failed requests to AI providers
   - Verify request headers and body

5. **Fallback Behavior**
   - If AI fails, system falls back to pattern matching
   - Check console for "falling back to simple processing"