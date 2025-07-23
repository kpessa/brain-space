# Unified Todo System Documentation

## Overview

The unified todo system consolidates all task-like items from across Brain Space into a single, coherent database model. This includes:

- **BrainDump** thought nodes (tasks with priorities)
- **Journal** daily quests
- **Routines** morning rituals, MITs, and improvement goals

## Database Architecture

### Core Tables

#### `todos`
Central table storing all task-like items with:
- Unified task properties (title, description, status)
- Eisenhower matrix prioritization (importance/urgency)
- Scheduling (due dates, time blocks)
- Hierarchical relationships (parent/child)
- Source tracking (where the todo originated)

#### `todo_recurrence`
Handles recurring tasks and habits:
- Daily, weekly, monthly patterns
- Custom recurrence rules
- Habit streak tracking

#### `todo_completions`
Tracks completion history for recurring items:
- Completion quality ratings
- Time tracking
- Notes and reflections

#### `todo_attempts`
Records multiple attempts at tasks:
- Success/failure outcomes
- Duration tracking
- Next action planning

#### Supporting Tables
- `todo_relationships` - Complex task dependencies
- `todo_tags` - Flexible categorization
- `braindump_todos`, `journal_todos`, `routine_todos` - Integration links

## Migration Process

### Running the Migration

1. Navigate to `/todo-migration` in the app
2. Review the migration status
3. Click "Migrate X Items" to start
4. Monitor progress and check for errors

### What Gets Migrated

**From BrainDump:**
- Thought nodes with task properties
- Priority ratings (importance/urgency)
- Recurrence patterns
- Attempt history
- Parent-child relationships

**From Journal:**
- Daily quests as completed todos
- Links back to original entries
- XP earned metadata

**From Routines:**
- Morning ritual items
- Most Important Tasks (MITs)
- Improvement goals
- Completion status

## Using the Unified System

### Unified Todos View (`/todos`)
- See all todos across features
- Filter by source, priority, status
- Eisenhower matrix organization
- Hierarchical task view

### Benefits

1. **Cross-feature visibility** - Journal quests appear in Timebox view
2. **Consistent prioritization** - Same urgency/importance everywhere  
3. **Unified recurrence** - One system for all repeating items
4. **Better search** - Find any todo regardless of origin
5. **Simplified codebase** - Single source of truth

### API Usage

```typescript
import { useTodoStore } from '@/store/todos'

// Fetch todos
const { todos, fetchTodos } = useTodoStore()
await fetchTodos(userId)

// Create a todo
const newTodo = await createTodo(userId, {
  title: 'My Task',
  type: 'task',
  priorityImportance: 7,
  priorityUrgency: 5
})

// Complete a todo
await completeTodo(todoId, 'Completion notes')

// Make recurring
await makeRecurring(todoId, 'daily', { frequency: 1 })
```

## Database Schema

### Enums

- `todo_type`: task, quest, ritual, habit, routine_item, gratitude_action
- `todo_status`: pending, in_progress, completed, deferred, cancelled
- `todo_source_type`: braindump, journal, routine, manual, recurring
- `recurrence_pattern_type`: daily, weekly, monthly, custom
- `attempt_outcome`: success, partial, failed, blocked
- `completion_quality`: great, good, okay, poor
- `relationship_type`: subtask, blocks, related, depends_on
- `logic_type`: AND, OR, NONE
- `tag_category`: context, project, area, energy, time

### Computed Fields

- `eisenhower_quadrant`: Automatically calculated from importance/urgency
- `is_due_today`: For recurring instances

## Integration Points

### Maintaining Backward Compatibility

The original features continue to work:
- BrainDump nodes sync to todos
- Journal entries create quest todos
- Routine items generate todos

### Future Enhancements

1. **Smart Scheduling** - AI-powered task scheduling
2. **Dependency Tracking** - Complex project management
3. **Team Collaboration** - Shared todos
4. **Analytics Dashboard** - Productivity insights
5. **Mobile Optimization** - Better touch interactions

## Troubleshooting

### Common Issues

**Migration Errors:**
- Check browser console for details
- Ensure you're logged in
- Try migrating individual features

**Missing Todos:**
- Verify source data exists
- Check filter settings
- Review migration logs

**Performance:**
- Index on commonly queried fields
- Pagination for large datasets
- Caching for recurring instances

## SQL Functions

Key migration functions:
- `migrate_all_to_todos()` - Run complete migration
- `generate_recurring_todo_instances()` - Create recurring instances
- Individual migration functions for each feature

## Development

### Adding New Todo Sources

1. Add new `todo_source_type` enum value
2. Create integration table (e.g., `new_feature_todos`)
3. Implement conversion function
4. Add to migration process

### Extending Todo Properties

1. Add column to `todos` table
2. Update TypeScript types
3. Modify store methods
4. Update UI components