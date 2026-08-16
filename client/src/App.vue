<!-- ============================================================
  App.vue — The root component. It is the "page switcher".
  It decides which screen to show based on login state:

    not logged in → Login screen  (or Register screen)
    logged in     → Dashboard (sidebar menu with Users + Profile)

  Who is logged in is stored in the Pinia auth store
  (stores/auth.ts), so App.vue simply reads `auth.user`:

    - When it is null, the login/register screens are shown.
    - The moment it is filled in, the Dashboard appears.

  Because the store is reactive, no events are needed to move
  between these screens — they react to the store automatically.
  ============================================================ -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import Dashboard from './components/Dashboard.vue'

// One source of truth for the whole auth state.
const auth = useAuthStore()

// true = show the registration form instead of the login form.
// (Purely local UI state, so it stays a ref here.)
const showRegister = ref(false)

// ---- On app start: try to restore a saved session ----
// The store validates any saved JWT and fills `auth.user` (or not).
onMounted(() => auth.restore())
</script>

<template>
  <div>
    <!-- Auth screens: centred, with the brand header -->
    <div v-if="!auth.isAuthenticated" class="page">
      <header>
        <h1>Nepal Bipolar Foundation</h1>
        <p>Supporting people living with bipolar disorder in Nepal.</p>
      </header>

      <Login
        v-if="!showRegister"
        @go-register="showRegister = true"
      />
      <Register
        v-else
        @go-login="showRegister = false"
      />
    </div>

    <!-- Logged in: the admin dashboard with the Users menu -->
    <Dashboard v-else />
  </div>
</template>

<!-- Non-scoped styles: applied to all child components too -->
<style>
* { box-sizing: border-box; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  background: #f6f8f7;
  color: #2b2b2b;
}
</style>

<style scoped>
.page {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
header {
  text-align: center;
  margin-bottom: 2rem;
}
header h1 {
  color: #2e7d32;
  margin: 0;
}
header p {
  color: #777;
  margin: 0.4rem 0 0;
}
</style>
