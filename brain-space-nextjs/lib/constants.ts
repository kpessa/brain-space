/**
 * Application constants and configuration
 */

export const APP_CONFIG = {
  name: 'Brain Space',
  description: 'Your intelligent thought management system',
  version: '1.0.0',
  author: 'Brain Space Team',
} as const

export const ROUTES = {
  home: '/',
  login: '/login',
  journal: '/journal',
  nodes: '/nodes',
  braindump: '/braindump',
  progress: '/progress',
  timebox: '/timebox',
  routines: '/routines',
  calendar: '/calendar',
  profile: '/profile',
  settings: '/settings',
} as const

export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4-turbo-preview',
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    defaultModel: 'claude-3-sonnet-20240229',
  },
  google: {
    name: 'Google AI',
    models: ['gemini-pro', 'gemini-pro-vision'],
    defaultModel: 'gemini-pro',
  },
} as const

export const NODE_CATEGORIES = [
  'idea',
  'task',
  'note',
  'question',
  'insight',
  'goal',
  'project',
  'meeting',
  'research',
  'inspiration',
] as const

export const NODE_PRIORITIES = [
  'low',
  'medium', 
  'high',
] as const

export const NODE_STATUSES = [
  'draft',
  'published',
  'archived',
] as const

export const TOAST_DURATION = {
  short: 3000,
  medium: 5000,
  long: 8000,
} as const

export const UI_CONFIG = {
  sidebarWidth: 280,
  sidebarCollapsedWidth: 60,
  maxToasts: 5,
  animationDuration: 300,
} as const

export const VALIDATION = {
  nodeContent: {
    minLength: 1,
    maxLength: 5000,
  },
  nodeTitle: {
    minLength: 1,
    maxLength: 200,
  },
  tagName: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9-_]+$/,
  },
} as const