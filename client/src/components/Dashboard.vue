<!-- ============================================================
  Dashboard.vue — The logged-in user dashboard.
  Shows the logged-in user's details in a table and provides
  a logout button.
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
  await auth.logout()
}
</script>

<template>
  <div class="dashboard">
    <aside class="sidebar">
      <h2>Dashboard</h2>
         
        <button class="user"
          :class="{ active: activeMenu === 'users' }"
          @click="activeMenu = 'users'"
        >
        {{ auth.isAdmin ? 'Users' : 'User' }}
        </button>
        <button class="profile"
          :class="{ active: activeMenu === 'profile' }"
          @click="activeMenu = 'profile'"
        >
          Profile
        </button>
      
      <button class="logout" @click="logout">Log out</button>
    </aside>

    <main class="content">
      <UsersAdmin v-if="activeMenu === 'users'" />
      <Profile v-else-if="activeMenu === 'profile'" />
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
.content h2 {
  margin: 0 0 1rem;
  color: #2e7d32;
}
.table-wrap {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}
th,
td {
  padding: 0.7rem 0.9rem;
  text-align: left;
  border-bottom: 1px solid #eef1ef;
  font-size: 0.9rem;
}
th {
  background: #f3f6f4;
  color: #4a554f;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
tbody tr:last-child td {
  border-bottom: none;
}
.thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.thumb.placeholder {
  background: #2e7d32;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
}
.sidebar .user {
  padding: 0.6rem 0.8rem;
  border: none;
  border-radius: 8px;
  background: #28c635;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
}
.sidebar .profile {
  padding: 0.6rem 0.8rem;
  border: none;
  border-radius: 8px;
  background: #28c635;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
}
</style>
