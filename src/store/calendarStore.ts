import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CalendarStore {
  selectedCalendarIds: Set<string>
  setSelectedCalendarIds: (ids: Set<string>) => void
  addSelectedCalendarId: (id: string) => void
  removeSelectedCalendarId: (id: string) => void
  toggleCalendarSelection: (id: string) => void
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    set => ({
      selectedCalendarIds: new Set<string>(),

      setSelectedCalendarIds: ids => set({ selectedCalendarIds: ids }),

      addSelectedCalendarId: id =>
        set(state => ({
          selectedCalendarIds: new Set([...state.selectedCalendarIds, id]),
        })),

      removeSelectedCalendarId: id =>
        set(state => {
          const newSet = new Set(state.selectedCalendarIds)
          newSet.delete(id)
          return { selectedCalendarIds: newSet }
        }),

      toggleCalendarSelection: id =>
        set(state => {
          const newSet = new Set(state.selectedCalendarIds)
          if (newSet.has(id)) {
            newSet.delete(id)
          } else {
            newSet.add(id)
          }
          return { selectedCalendarIds: newSet }
        }),
    }),
    {
      name: 'calendar-preferences',
      // Custom storage to handle Set serialization
      storage: {
        getItem: name => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const data = JSON.parse(str)
          return {
            ...data,
            state: {
              ...data.state,
              selectedCalendarIds: new Set(data.state.selectedCalendarIds || []),
            },
          }
        },
        setItem: (name, value) => {
          const data = {
            ...value,
            state: {
              ...value.state,
              selectedCalendarIds: Array.from(value.state.selectedCalendarIds),
            },
          }
          localStorage.setItem(name, JSON.stringify(data))
        },
        removeItem: name => localStorage.removeItem(name),
      },
    }
  )
)
