import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Layout
  sidebarCollapsed: boolean
  
  // Modals
  isNodeModalOpen: boolean
  isSettingsModalOpen: boolean
  
  // Toasts
  toasts: Toast[]
  
  // Loading states
  globalLoading: boolean
  
  // AI settings
  aiProvider: string
  aiDebugMode: boolean

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  openNodeModal: () => void
  closeNodeModal: () => void
  openSettingsModal: () => void
  closeSettingsModal: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  setGlobalLoading: (loading: boolean) => void
  setAIProvider: (provider: string) => void
  toggleAIDebugMode: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      sidebarCollapsed: false,
      isNodeModalOpen: false,
      isSettingsModalOpen: false,
      toasts: [],
      globalLoading: false,
      aiProvider: 'openai',
      aiDebugMode: false,

      // Theme actions
      setTheme: (theme) => set({ theme }),

      // Sidebar actions
      toggleSidebar: () => 
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      setSidebarCollapsed: (collapsed) => 
        set({ sidebarCollapsed: collapsed }),

      // Modal actions
      openNodeModal: () => set({ isNodeModalOpen: true }),
      closeNodeModal: () => set({ isNodeModalOpen: false }),
      openSettingsModal: () => set({ isSettingsModalOpen: true }),
      closeSettingsModal: () => set({ isSettingsModalOpen: false }),

      // Toast actions
      addToast: (toastData) => {
        const toast: Toast = {
          ...toastData,
          id: crypto.randomUUID(),
        }
        set((state) => ({
          toasts: [...state.toasts, toast],
        }))

        // Auto-remove toast after duration
        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(toast.id)
          }, toast.duration || 5000)
        }
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),

      clearToasts: () => set({ toasts: [] }),

      // Global loading
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // AI settings
      setAIProvider: (provider) => set({ aiProvider: provider }),
      
      toggleAIDebugMode: () =>
        set((state) => ({ aiDebugMode: !state.aiDebugMode })),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        aiProvider: state.aiProvider,
        aiDebugMode: state.aiDebugMode,
      }),
    }
  )
)