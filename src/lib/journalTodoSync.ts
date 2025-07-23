import { supabase } from '@/lib/supabase'
import type { JournalEntry } from '@/types/journal'
import type { CreateTodoInput, UpdateTodoInput } from '@/types/todo'
import { useTodoStore } from '@/store/todos'
import { logger } from '@/services/logger'

/**
 * Service to sync Journal entries with the unified todo system
 * This ensures that daily quests are automatically reflected in todos
 */

// Check if a journal entry has a quest that should be synced
export function shouldSyncJournalQuest(entry: JournalEntry): boolean {
  return !!entry.dailyQuest && entry.dailyQuest.trim().length > 0
}

// Convert a journal entry's quest to todo input
export function journalQuestToTodoInput(entry: JournalEntry): CreateTodoInput {
  return {
    title: entry.dailyQuest,
    description: `Daily quest from journal entry on ${new Date(entry.date).toLocaleDateString()}`,
    type: 'quest',
    status: 'pending', // New quests start as pending
    scheduledDate: entry.date,
    sourceType: 'journal',
    sourceId: entry.id,
    sourceMetadata: {
      journalEntryId: entry.id,
      entryDate: entry.date,
      xpEarned: entry.xpEarned,
      gratitudeCount: entry.gratitude.filter(g => g.trim()).length,
    },
  }
}

// Sync a journal quest to todos
export async function syncJournalQuestToTodo(
  entry: JournalEntry,
  userId: string
): Promise<string | null> {
  if (!shouldSyncJournalQuest(entry)) return null
  
  try {
    // Check if todo already exists for this journal entry
    const { data: existingLink } = await supabase
      .from('journal_todos')
      .select('todo_id')
      .eq('journal_entry_id', entry.id)
      .eq('todo_type', 'daily_quest')
      .single()
    
    if (existingLink) {
      // Update existing todo
      const updates: UpdateTodoInput = {
        title: entry.dailyQuest,
        scheduledDate: entry.date,
      }
      
      await useTodoStore.getState().updateTodo(existingLink.todo_id, updates)
      
      logger.info('JOURNAL_SYNC', 'Updated existing quest todo', {
        todoId: existingLink.todo_id,
        journalId: entry.id,
      })
      
      return existingLink.todo_id
    } else {
      // Create new todo
      const todoInput = journalQuestToTodoInput(entry)
      const todo = await useTodoStore.getState().createTodo(userId, todoInput)
      
      if (todo) {
        // Create link
        await supabase.from('journal_todos').insert({
          journal_entry_id: entry.id,
          todo_id: todo.id,
          todo_type: 'daily_quest',
        })
        
        logger.info('JOURNAL_SYNC', 'Created new quest todo', {
          todoId: todo.id,
          journalId: entry.id,
          quest: entry.dailyQuest,
        })
        
        return todo.id
      }
    }
  } catch (error) {
    logger.error('JOURNAL_SYNC', 'Error syncing journal quest to todo', {
      journalId: entry.id,
      error,
    })
  }
  
  return null
}

// Sync journal quest deletion
export async function syncJournalQuestDeletion(entryId: string): Promise<void> {
  try {
    // Find and delete associated todo
    const { data: link } = await supabase
      .from('journal_todos')
      .select('todo_id')
      .eq('journal_entry_id', entryId)
      .eq('todo_type', 'daily_quest')
      .single()
    
    if (link) {
      await useTodoStore.getState().deleteTodo(link.todo_id)
      logger.info('JOURNAL_SYNC', 'Deleted todo for removed journal quest', {
        todoId: link.todo_id,
        journalId: entryId,
      })
    }
  } catch (error) {
    logger.error('JOURNAL_SYNC', 'Error deleting todo for journal entry', {
      journalId: entryId,
      error,
    })
  }
}

// Create gratitude action todos (optional feature)
export async function createGratitudeActionTodos(
  entry: JournalEntry,
  userId: string
): Promise<void> {
  // This is an optional feature to create todos from gratitude items
  // that contain action words like "call", "thank", "visit", etc.
  const actionWords = ['call', 'thank', 'visit', 'send', 'help', 'meet', 'contact', 'reach out']
  
  for (let i = 0; i < entry.gratitude.length; i++) {
    const gratitudeItem = entry.gratitude[i]
    if (!gratitudeItem.trim()) continue
    
    const lowerItem = gratitudeItem.toLowerCase()
    const hasAction = actionWords.some(word => lowerItem.includes(word))
    
    if (hasAction) {
      try {
        // Extract action from gratitude
        const todoInput: CreateTodoInput = {
          title: `Gratitude action: ${gratitudeItem}`,
          description: `Action item from gratitude on ${new Date(entry.date).toLocaleDateString()}`,
          type: 'gratitude_action',
          status: 'pending',
          scheduledDate: entry.date,
          sourceType: 'journal',
          sourceId: `${entry.id}:gratitude:${i}`,
          sourceMetadata: {
            journalEntryId: entry.id,
            gratitudeIndex: i,
            originalGratitude: gratitudeItem,
          },
        }
        
        const todo = await useTodoStore.getState().createTodo(userId, todoInput)
        
        if (todo) {
          await supabase.from('journal_todos').insert({
            journal_entry_id: entry.id,
            todo_id: todo.id,
            todo_type: 'gratitude_action',
          })
          
          logger.info('JOURNAL_SYNC', 'Created gratitude action todo', {
            todoId: todo.id,
            journalId: entry.id,
            gratitude: gratitudeItem,
          })
        }
      } catch (error) {
        logger.error('JOURNAL_SYNC', 'Error creating gratitude action todo', {
          journalId: entry.id,
          gratitudeIndex: i,
          error,
        })
      }
    }
  }
}