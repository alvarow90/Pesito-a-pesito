'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UserType = {
  id: string
  email: string
  subscriptionStatus: 'free' | 'premium'
  messageCount: number
}

type UserState = {
  user: UserType | null
  subscription: any | null
  setUser: (user: UserType | null) => void
  setSubscription: (subscription: any | null) => void
  fetchUser: () => Promise<void>
  fetchSubscription: () => Promise<void>
  incrementMessageCount: () => Promise<number>
  resetMessageCount: () => Promise<void>
  resetStore: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,

      setUser: user => set({ user }),
      setSubscription: subscription => set({ subscription }),

      fetchUser: async () => {
        try {
          const response = await fetch('/api/user')
          if (response.ok) {
            const data = await response.json()
            set({ user: data.user })
          }
        } catch (error) {
          console.error('Error fetching user:', error)
        }
      },

      fetchSubscription: async () => {
        try {
          const response = await fetch('/api/subscription')
          if (response.ok) {
            const data = await response.json()
            set({ subscription: data.subscription })

            // Update user subscription status based on subscription data
            if (data.subscription?.status === 'active') {
              set(state => ({
                user: state.user
                  ? { ...state.user, subscriptionStatus: 'premium' }
                  : null
              }))
            }
          }
        } catch (error) {
          console.error('Error fetching subscription:', error)
        }
      },

      incrementMessageCount: async () => {
        try {
          const response = await fetch('/api/user/increment-message-count', {
            method: 'POST'
          })

          if (response.ok) {
            const data = await response.json()
            set(state => ({
              user: state.user
                ? { ...state.user, messageCount: data.messageCount }
                : null
            }))
            return data.messageCount
          }
          return get().user?.messageCount || 0
        } catch (error) {
          console.error('Error incrementing message count:', error)
          return get().user?.messageCount || 0
        }
      },

      resetMessageCount: async () => {
        try {
          const response = await fetch('/api/user/reset-message-count', {
            method: 'POST'
          })

          if (response.ok) {
            set(state => ({
              user: state.user ? { ...state.user, messageCount: 0 } : null
            }))
          }
        } catch (error) {
          console.error('Error resetting message count:', error)
        }
      },

      resetStore: () => {
        // Reset the store state
        set({ user: null, subscription: null })

        // Optional: Also clear the persisted storage.
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-storage')
        }
      }
    }),
    {
      name: 'user-storage',
      partialize: state => ({
        user: state.user,
        subscription: state.subscription
      })
    }
  )
)
