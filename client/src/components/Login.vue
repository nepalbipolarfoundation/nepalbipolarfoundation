<!-- ============================================================
  Login.vue — The login form.
  On submit it calls the server's /authentication endpoint with
  the 'local' strategy (email + password) through the Pinia auth
  store. When it succeeds, the store fills in `auth.user`, which
  makes App.vue switch to the Dashboard automatically — nothing
  needs to be emitted up.
============================================================ -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

// Emit lets this component ask its parent (App.vue) to switch to
// the registration screen. Only this one stays an event.
const emit = defineEmits<{
  'go-register': []
}>()

// The store owns the login state; we just call its action.
const auth = useAuthStore()

// ---- Form state (two-way bound to the inputs with v-model) ----
const email = ref('')
const password = ref('')
const error = ref('') // shown when login fails
const loading = ref(false) // disables the button while the request runs

async function submit(): Promise<void> {
  error.value = ''
  loading.value = true
  try {
    // Ask the store to log us in ('local' = email + password).
    // On success it stores the user → App.vue shows the Dashboard.
    await auth.login(email.value.trim().toLowerCase(), password.value)
  } catch (e) {
    // e.message is a human-readable error from the server.
    error.value = e instanceof Error ? e.message : 'Login failed. Please try again.'
  } finally {
    loading.value = false // always re-enable the button
  }
}
</script>

<template>
  <div class="card">
    <h2>Log in</h2>

    <!-- @submit.prevent runs submit() and stops the page from reloading -->
    <form @submit.prevent="submit">
      <label for="email">Email</label>
      <input id="email" v-model.trim="email" type="email" placeholder="you@example.com" required />

      <label for="password">Password</label>
      <input id="password" v-model="password" type="password" placeholder="Your password" required />

      <!-- Reserved space for the error message so the form doesn't jump -->
      <p class="error">{{ error }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Log in' }}
      </button>
    </form>

    <!-- Emits 'go-register' so App.vue switches to the registration form -->
    <p class="switch">
      New here?
      <a href="#" @click.prevent="emit('go-register')">Create an account</a>/<a href="#top"">Go to top</a>
    </p>
  </div>
</template>

<style scoped>
.card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
h2 { margin-top: 0; }
label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.8rem 0 0.3rem;
}
input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
}
button {
  width: 100%;
  margin-top: 0.8rem;
  padding: 0.65rem;
  border: none;
  border-radius: 6px;
  background: #2e7d32;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}
button:disabled { opacity: 0.6; cursor: not-allowed; }
.error { color: #c62828; font-size: 0.85rem; min-height: 1.2em; margin: 0.5rem 0 0; }
.switch { text-align: center; font-size: 0.9rem; margin: 1rem 0 0; }
.switch a { color: #2e7d32; }
</style>
