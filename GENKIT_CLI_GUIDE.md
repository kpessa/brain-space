# Genkit CLI Guide

The Genkit CLI is now installed and ready to use in your Brain Space project!

## Installation

The Genkit CLI has been installed as a dev dependency:
```bash
pnpm add -D genkit
```

## Available Commands

### From the project root:

```bash
# Run Genkit CLI directly
pnpm genkit

# Start Genkit Developer UI with Firebase Functions
pnpm genkit:start

# Run a specific flow
pnpm genkit:flow-run

# Run evaluations
pnpm genkit:eval
```

### Key Genkit Commands:

1. **Start Developer UI**
   ```bash
   pnpm genkit:start
   ```
   This starts the Genkit Developer UI at http://localhost:4000 and connects it to your Firebase Functions.

2. **Run a Flow**
   ```bash
   cd functions
   genkit flow:run categorizeThoughts '{"text": "I need to buy groceries and finish the project report", "provider": "gemini"}'
   ```

3. **List Available Flows**
   ```bash
   cd functions
   genkit flow:list
   ```

4. **Test MCP Tools**
   ```bash
   cd functions
   genkit tool:run searchNodes '{"userId": "test-user", "category": "tasks"}'
   ```

## Developer UI Features

The Genkit Developer UI provides:

1. **Flow Playground**: Test your AI flows with different inputs
2. **Trace Inspector**: View detailed execution traces
3. **Prompt Testing**: Experiment with prompts and see responses
4. **Tool Testing**: Test MCP tools directly
5. **Performance Metrics**: Monitor latency and token usage

## Using with Firebase Functions

1. Start the Firebase emulators:
   ```bash
   firebase emulators:start
   ```

2. In another terminal, start Genkit:
   ```bash
   pnpm genkit:start
   ```

3. Open http://localhost:4000 to access the Developer UI

## Available Flows in Brain Space

1. **categorizeThoughts**: Categorize brain dump text into nodes
2. **healthCheck**: Simple health check flow
3. **contextAwareAnalysis**: Analyze data with MCP context

## MCP Tools Available

Through the Brain Space MCP server:
- `searchNodes`: Search user nodes
- `getRecentBrainDumps`: Get recent brain dumps
- `getNodeRelationships`: Find node relationships

## Tips

1. **Environment Variables**: Make sure your `.secret.local` file in the functions directory has the necessary API keys
2. **Node Version**: Genkit requires Node.js 20 or later
3. **Hot Reload**: The Developer UI automatically reloads when you make changes to your flows
4. **Debugging**: Use the trace inspector to debug complex flows

## Example Workflow

1. Start developing a new flow:
   ```bash
   pnpm genkit:start
   ```

2. Open the Developer UI and navigate to the Flow Playground

3. Select your flow (e.g., `categorizeThoughts`)

4. Enter test input and see the results

5. Use the trace inspector to understand how the flow executed

6. Iterate on your prompts and logic

The Genkit CLI significantly improves the development experience for AI features in Brain Space!