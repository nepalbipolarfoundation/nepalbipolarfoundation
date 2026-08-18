// ============================================================
// stores/auth.ts — The Pinia store that owns the login state.
//
// Before Pinia, App.vue held the logged-in user in a ref and
// passed it down (and received "updated"/"logout" events back up)
// through Dashboard and Profile. Now the user lives here in ONE
// place, and every component can read it directly:
//
//   const auth = useAuthStore()
//   auth.user            → the logged-in user (or null)
//   auth.isAuthenticated → true/false
//   auth.login(...)      → logs in and fills `user`
//   auth.logout()        → clears `user`
//   auth.restore()       → tries to restore a saved session on load
//
// Because the store is reactive, when `user` changes here, every
// component that reads it re-renders automatically.
// ============================================================

import { defineStore } from 'pinia'
import feathers, { type User } from '../feathers'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // The currently logged-in user, or null when logged out.
    user: null as User | null,
  }),

  getters: {
    // true when someone is logged in (handy for v-if in templates).
    isAuthenticated: (state): boolean => state.user !== null,
    // true when the current user has the 'admin' role.
    isAdmin: (state): boolean => state.user?.roles.includes('admin') ?? false,
  },

  actions: {
    // Call once on app start. If a JWT is saved in localStorage,
    // validate it and restore the user; otherwise stay logged out.
    async restore(): Promise<void> {
      try {
        const result = await feathers.reAuthenticate()
        this.user = result.user as User
      } catch {
        this.user = null // no valid token → show the login screen
      }
    },

    // Log in with email + password and store the returned user.
    async login(email: string, password: string): Promise<void> {
      const result = await feathers.authenticate({ strategy: 'local', email, password })
      this.user = result.user as User
    },

    // Log out: remove the token and clear the stored user.
    async logout(): Promise<void> {
      await feathers.logout()
      this.user = null
    },

    // Replace the stored user (e.g. after the profile is saved).
    updateUser(user: User): void {
      this.user = user
    },
  },
})
