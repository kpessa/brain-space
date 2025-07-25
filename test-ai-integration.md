# AI Categorization Integration Test

## Test Steps

1. **Start the development server**
   ```bash
   pnpm run dev
   ```

2. **Start Firebase Functions emulator**
   ```bash
   cd functions
   npm run serve
   ```

3. **Navigate to Brain Dump page**
   - Go to http://localhost:5174/brain-dump
   - Click "New Brain Dump"

4. **Test with sample text**
   Use this sample text that covers multiple categories:

   ```
   I need to call the dentist tomorrow to schedule a cleaning
   What if we implemented a dark mode for the app?
   The login page is showing a 404 error when refreshing
   How can I optimize the React Flow performance?
   I realized that using memo() reduces unnecessary re-renders
   TODO: Update the documentation for the new Node structure
   ```

5. **Verify AI Processing**
   - Toggle "Use AI" should be ON
   - Click "Process" button
   - Should see "Processing with AI..." message
   - After processing, should navigate to flow view

6. **Check Node Creation**
   The AI should create:
   - Root node labeled "Brain Dump"
   - Category nodes for: tasks, ideas, problems, questions, insights
   - Individual thought nodes connected to their categories
   - Each node should have proper metadata (urgency, importance, etc.)

## Expected Results

### Categories Created:
- **tasks**: "Call dentist", "Update documentation"
- **ideas**: "Dark mode implementation"
- **problems**: "Login page 404 error"
- **questions**: "Optimize React Flow performance"
- **insights**: "memo() reduces re-renders"

### Node Properties:
- Tasks should have urgency/importance ratings
- All nodes should have confidence scores
- Keywords should be extracted
- Relationships between related thoughts

## Debugging

If the AI categorization fails:

1. Check browser console for errors
2. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```

3. Verify API keys are set in functions/.env.local:
   ```
   GOOGLE_AI_API_KEY=your_actual_key_here
   ```

4. Test the function directly:
   ```bash
   curl -X POST http://localhost:5001/brain-space-5d787/us-central1/categorizeThoughts \
     -H "Content-Type: application/json" \
     -d '{"text": "Test thought", "provider": "gemini"}'
   ```