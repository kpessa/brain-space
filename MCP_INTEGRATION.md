# Brain Space MCP (Model Context Protocol) Integration

## Overview

The Brain Space application now includes a Model Context Protocol (MCP) server that allows Genkit AI flows to access and utilize your Brain Space data as context. This enables more intelligent and context-aware AI features.

## What is MCP?

Model Context Protocol (MCP) is an open standard for building AI tool and resource servers. It allows AI systems to:
- Access application data as context
- Execute tools and functions
- Use predefined prompts
- Integrate with various AI models seamlessly

## Brain Space MCP Features

### Available Resources

1. **Nodes** (`brainspace://nodes`)
   - Access all user nodes (tasks, ideas, questions, etc.)
   - Filterable by category, date, and search text

2. **Brain Dumps** (`brainspace://braindumps`)
   - Access brain dump entries
   - Includes associated nodes when requested

3. **Routines** (`brainspace://routines`)
   - Access user routines and habits

### Available Tools

1. **searchNodes**
   - Search for nodes by category, text, or date range
   - Parameters:
     - `userId`: The user ID to search for
     - `category`: Filter by category (optional)
     - `searchText`: Search in node text (optional)
     - `startDate`: Start date for date range filter (optional)
     - `endDate`: End date for date range filter (optional)
     - `limit`: Maximum number of results (default: 10)

2. **getRecentBrainDumps**
   - Get recent brain dump entries
   - Parameters:
     - `userId`: The user ID
     - `limit`: Number of brain dumps to retrieve (default: 5)
     - `includeNodes`: Include associated nodes (default: false)

3. **getNodeRelationships**
   - Get relationships between nodes
   - Parameters:
     - `userId`: The user ID
     - `nodeId`: The node ID to find relationships for

### Available Prompts

1. **weeklyReview**
   - Generate a weekly review based on completed nodes and brain dumps
   - Automatically fetches data from the past week
   - Provides summaries, patterns, and suggestions

## Using MCP in Genkit Flows

### Example: Context-Aware Analysis

```typescript
const result = await contextAwareAnalysisFlow({
  userId: 'user123',
  query: 'What tasks should I prioritize this week?',
  includeNodes: true,
  includeBrainDumps: true
});
```

### Example: Using MCP Tools Directly

```typescript
import { useTool } from '@genkit-ai/core';

// Search for specific nodes
const nodes = await useTool('searchNodes', {
  userId: 'user123',
  category: 'tasks',
  searchText: 'urgent',
  limit: 20
});

// Get recent brain dumps with nodes
const brainDumps = await useTool('getRecentBrainDumps', {
  userId: 'user123',
  limit: 10,
  includeNodes: true
});
```

## Benefits

1. **Contextual AI Responses**: AI can reference your actual data when providing suggestions
2. **Smart Analysis**: Analyze patterns across your nodes and brain dumps
3. **Personalized Insights**: Get recommendations based on your specific content
4. **Automated Reviews**: Generate summaries and reports from your data

## Security

- All MCP operations require proper authentication
- Data access is scoped to the authenticated user
- Firebase security rules apply to all data access

## Future Enhancements

1. **Additional Tools**:
   - Node creation and updates
   - Bulk operations
   - Advanced analytics

2. **More Resources**:
   - Calendar events integration
   - Journal entries
   - Matrix visualizations

3. **Enhanced Prompts**:
   - Daily planning assistant
   - Project progress tracking
   - Goal achievement analysis

## Development

To extend the MCP server:

1. Add new tools in `functions/src/mcp-server.ts`
2. Define tool schemas with Zod
3. Implement the execute function
4. Test with Genkit flows

The MCP integration makes Brain Space's AI features truly context-aware and personalized to each user's data.