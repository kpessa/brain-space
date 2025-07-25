# AI Setup Instructions

## You're Almost There!

I've added `VITE_AI_PROVIDER=anthropic` to your `.env` file.

### Next Steps:

1. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   pnpm run dev
   ```

2. **Verify it's working**:
   - Go to Brain Dump page
   - Enable debug mode (click bug icon)
   - Open browser console
   - Create a brain dump
   - You should see:
     ```
     🔧 AI Service Factory
     Configured provider: anthropic
     ✅ Creating Anthropic provider
     🤖 Anthropic API Call
     ```

### Switch Between Providers:

To use OpenAI instead:
```bash
# Edit .env file
VITE_AI_PROVIDER=openai
```

To use Anthropic:
```bash
# Edit .env file
VITE_AI_PROVIDER=anthropic
```

### Recommendations:

- **Anthropic (Claude)**: Faster, cheaper, good for most use cases
- **OpenAI (GPT-4)**: More powerful, better for complex analysis

### Remember:
- Restart dev server after changing .env
- Add these same variables to Vercel for production
- The bug icon toggles debug logging on/off