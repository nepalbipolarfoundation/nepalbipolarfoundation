<!-- ============================================================
  Register.vue — The registration form (with optional profile photo).
  Steps on submit:
    1. If an image was chosen, upload it to POST /upload.
       The server replies with a public URL for the image.
    2. Create the user via the /users service with name, email,
       password and the image URL.
       (The server hashes the password — we never send plain text back.)
    3. Automatically log the new user in through the Pinia auth
       store. Once `auth.user` is filled, App.vue shows the Dashboard.
============================================================ -->
<script setup lang="ts">
import { ref } from 'vue'
import feathers, { SERVER_URL } from '../feathers'
import { useAuthStore } from '../stores/auth'

// Ask App.vue to switch to the login screen.
const emit = defineEmits<{
  'go-login': []
}>()

// The store logs the new user in and holds the session.
const auth = useAuthStore()

// ---- Form state ----
const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const avatarFile = ref<File | null>(null) // the File object picked in the input
const preview = ref('') // a data URL used to show a preview of the image
const error = ref('')
const loading = ref(false)

// Runs when the user picks a file. `preview` lets them see it
// before uploading.
function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  avatarFile.value = input.files?.[0] ?? null
  preview.value = avatarFile.value
    ? URL.createObjectURL(avatarFile.value)
    : ''
}

// Upload the image and return its public URL.
async function uploadImage(): Promise<string> {
  const form = new FormData() // multipart form, like submitting an <input type="file">
  form.append('image', avatarFile.value as Blob) // field name must match the server ('image')

  const res = await fetch(`${SERVER_URL}/upload`, {
    method: 'POST',
    body: form,
  })
  const data = (await res.json()) as { url: string; error?: string }
  if (!res.ok) throw new Error(data.error || 'Image upload failed')
  return data.url
}

async function submit(): Promise<void> {
  error.value = ''

  // ---- Simple client-side validation ----
  if (!name.value || !email.value || !password.value) {
    error.value = 'Please fill in your name, email and password.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    // Step 1: upload the photo (if one was chosen)
    let avatar: string | null = null
    if (avatarFile.value) {
      avatar = await uploadImage()
    }

    // Step 2: create the account on the server
    await feathers.service('users').create({
      name: name.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: password.value,
      avatar,
    })

    // Step 3: log the new user in automatically.
    // The store fills `auth.user` → App.vue switches to the Dashboard.
    await auth.login(email.value.trim().toLowerCase(), password.value)
  } catch (e) {
    const message = e instanceof Error ? e.message : ''
    const code = (e as { code?: number }).code
    // Nice message if the email is already registered.
    if (code === 409 || /duplicate/i.test(message)) {
      error.value = 'That email is already registered. Try logging in instead.'
    } else {
      error.value = message || 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card">
    <h2>Create an account</h2>

    <form @submit.prevent="submit">
      <label for="name">Full name</label>
      <input id="name" v-model.trim="name" type="text" placeholder="e.g. Asha Gurung" required />

      <label for="email">Email</label>
      <input id="email" v-model.trim="email" type="email" placeholder="you@example.com" required />

      <label for="password">Password (min 6 characters)</label>
      <input id="password" v-model="password" type="password" placeholder="Your password" required />

      <label for="confirm">Confirm password</label>
      <input id="confirm" v-model="confirm" type="password" placeholder="Repeat your password" required />

      <label for="image">Profile photo (optional)</label>
      <!-- accept="image/*" opens the picture picker on mobile/desktop -->
      <input id="image" type="file" accept="image/*" @change="onFileChange" />

      <!-- Live preview of the chosen photo -->
      <img v-if="preview" :src="preview" alt="Preview" class="preview" />

      <p class="error">{{ error }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Creating account...' : 'Create account' }}
      </button>
    </form>

    <p class="switch">
      Already have an account?
      <a href="#" @click.prevent="emit('go-login')">Log in</a>
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
.preview {
  display: block;
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  margin-top: 0.6rem;
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
