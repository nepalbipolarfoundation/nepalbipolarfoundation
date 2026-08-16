<!-- ============================================================
  Dashboard.vue — The logged-in admin shell.
  Layout:
    - Sidebar menu (Users, Profile) + logout button.
    - Main content area, which swaps between the selected menu.

  The logged-in user lives in the Pinia auth store, so the sidebar
  reads `auth.user` and logout simply calls `auth.logout()`.
============================================================ -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import UsersAdmin from './UsersAdmin.vue'
import Profile from './Profile.vue'

// The store knows who is logged in.
const auth = useAuthStore()

// Which sidebar menu item is currently open.
const activeMenu = ref<'users' | 'profile'>('users')

async function logout(): Promise<void> {
  await auth.logout() // store clears the user → App.vue shows the login screen
}
</script>

<template>
  <div class="dashboard">
    <aside class="sidebar">
      <h2>Dashboard</h2>
      <nav>
        <button
          :class="{ active: activeMenu === 'users' }"
          @click="activeMenu = 'users'"
        >
          Users
        </button>
        <button
          :class="{ active: activeMenu === 'profile' }"
          @click="activeMenu = 'profile'"
        >
          Profile
        </button>
      </nav>
      <button class="logout" @click="logout">Log out</button>
    </aside>

    <main class="content">
      <UsersAdmin v-if="activeMenu === 'users'" />
      <Profile v-else />
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #23442b;
  color: #fff;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.sidebar h2 {
  margin: 0;
  font-size: 1.1rem;
}
.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}
.sidebar nav button {
  text-align: left;
  padding: 0.6rem 0.8rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #dcebe0;
  font-size: 0.95rem;
  cursor: pointer;
}
.sidebar nav button:hover {
  background: rgba(255, 255, 255, 0.08);
}
.sidebar nav button.active {
  background: #2e7d32;
  color: #fff;
  font-weight: 600;
}
.sidebar .logout {
  padding: 0.6rem 0.8rem;
  border: none;
  border-radius: 8px;
  background: #c62828;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
}
.content {
  flex: 1;
  padding: 2rem;
  overflow-x: auto;
}
</style>
