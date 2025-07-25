# Testing GenAiNodeInput Format in Gen Studio

## Overview
The categorization flow now outputs thoughts in the `GenAiNodeInput` format that matches your Node type structure.

## How to Test in Gen Studio

### 1. Start Gen Studio
```bash
cd functions
pnpm run genkit:start
```

### 2. Test Input JSON
Use this JSON input in Gen Studio:

```json
{
  "text": "I need to finish the quarterly report by Friday at 5pm\nWhat if we created a mobile app version of our product?\nThe database connection keeps timing out after 30 seconds\nHow can we improve team collaboration on remote projects?\nI realized that daily standups are more effective when timeboxed to 15 minutes\nNeed to update the API documentation with the new endpoints",
  "provider": "gemini"
}
```

### 3. Expected Output Structure
You'll see output with this structure:

```json
{
  "categories": [
    {
      "name": "tasks",
      "thoughts": [
        {
          "text": "I need to finish the quarterly report by Friday at 5pm",
          "confidence": 0.95,
          "reasoning": "Clear action item with deadline",
          "nodeData": {
            "title": "Finish quarterly report",
            "type": "task",
            "description": "Complete and submit Q4 report",
            "urgency": 9,
            "importance": 8,
            "priority": 17,
            "tags": ["report", "deadline", "quarterly"],
            "dueDate": {
              "type": "exact",
              "date": "2024-01-19T17:00:00Z"
            },
            "completed": false
          }
        }
      ],
      "confidence": 0.95,
      "reasoning": "These are actionable items that need to be completed"
    }
  ],
  "suggestions": [
    "Prioritize tasks by urgency and importance",
    "Consider breaking down large tasks into smaller subtasks"
  ]
}
```

## Key Features of GenAiNodeInput Format

### Node Type Options
- `goal` - Long-term objectives
- `project` - Multi-task initiatives  
- `task` - Actionable items
- `option` - Choices to consider
- `idea` - Creative concepts
- `question` - Things to investigate
- `problem` - Issues to solve
- `insight` - Realizations
- `thought` - General reflections
- `concern` - Worries or risks

### Priority Fields
- **urgency**: 1-10 scale (10 = most urgent)
- **importance**: 1-10 scale (10 = most important)
- **priority**: Computed as urgency + importance

### Relationships
- **children**: Array of node titles that are subtasks/subnodes
- **logicType**: "AND" (all children required) or "OR" (any child sufficient)

### Scheduling
- **dueDate**: Can be exact date or relative (e.g., "3 days from now")
- **recurrence**: Patterns like daily, weekly, monthly with specific times

### Metadata
- **aliases**: Alternative names for the node
- **tags**: Categories for organization
- **attempts**: Previous attempts at completing (for tasks)
- **completed**: Boolean completion status

## Frontend Processing

The brain dump store converts this `nodeData` into full Node objects with:
- Generated unique IDs
- User assignment
- React Flow positioning
- Audit timestamps
- Firestore persistence

## Benefits

1. **Rich Data Structure**: Each thought gets full Node metadata
2. **Natural Categorization**: AI groups related thoughts
3. **Actionable Output**: Ready to convert to tasks, projects, etc.
4. **Flexible Types**: Supports all 10 node types in your system
5. **Hierarchical Support**: Can reference child nodes by title