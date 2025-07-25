import { create } from 'zustand'
import { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,

  setUser: (user) => 
    set({ 
      user, 
      isAuthenticated: !!user,
      error: null 
    }),

  setLoading: (loading) => 
    set({ loading }),

  setError: (error) => 
    set({ error }),

  logout: () => 
    set({ 
      user: null, 
      isAuthenticated: false, 
      error: null 
    }),
}))