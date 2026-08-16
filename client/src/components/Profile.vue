<!-- ============================================================
  Profile.vue — The minimum profile page.
  Shows the logged-in user's photo, name and email.
  The user can:
    - change their photo (upload → PATCH /users/:id)
    - change their name (PATCH /users/:id)
    - log out

  The current user comes from the Pinia auth store (no props), and
  after saving, `auth.updateUser()` refreshes it in the store.
============================================================ -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import feathers, { SERVER_URL, type User } from '../feathers'
import { useAuthStore } from '../stores/auth'

// The store holds the logged-in user; read it from there.
const auth = useAuthStore()
const user = computed(() => auth.user!)

// ---- Local form state, prefilled from the user object ----
const name = ref(user.value.name)
const avatarFile = ref<File | null>(null)
const preview = ref(user.value.avatar) // current photo (or null)
const saving = ref(false)
const message = ref('')

// Show the user's initials when no photo was uploaded.
const initials = computed((): string => {
  const parts = (user.value.name || '').trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts[1]?.[0] || ''
  return (first + last).toUpperCase() || '?'
})

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  avatarFile.value = input.files?.[0] ?? null
  // Show a live preview of the new photo before saving.
  preview.value = avatarFile.value
    ? URL.createObjectURL(avatarFile.value)
    : user.value.avatar
}

// Upload a new photo and return its public URL.
async function uploadImage(): Promise<string> {
  const form = new FormData()
  form.append('image', avatarFile.value as Blob)

  const res = await fetch(`${SERVER_URL}/upload`, {
    method: 'POST',
    body: form,
  })
  const data = (await res.json()) as { url: string; error?: string }
  if (!res.ok) throw new Error(data.error || 'Image upload failed')
  return data.url
}

async function save(): Promise<void> {
  saving.value = true
  message.value = ''
  try {
    // Build the list of changes. Only changed fields are sent.
    const updates: Partial<Pick<User, 'name' | 'avatar'>> = {}
    if (name.value !== user.value.name) updates.name = name.value
    if (avatarFile.value) {
      updates.avatar = await uploadImage()
      preview.value = updates.avatar // show the uploaded photo
    }

    if (Object.keys(updates).length > 0) {
      // PATCH /users/:id — the server requires a valid JWT for this.
      const updated = await feathers.service('users').patch(user.value._id, updates)
      // Keep the store in sync so every screen shows the new data.
      auth.updateUser(updated)
    }
    message.value = 'Profile saved.'
  } catch (e) {
    message.value = e instanceof Error ? e.message : 'Could not save changes.'
  } finally {
    saving.value = false
  }
}

async function logout(): Promise<void> {
  await auth.logout() // store clears the user → App.vue shows the login screen
}
</script>

<template>
  <div class="card">
    <h2>My profile</h2>

    <!-- The current photo, or a placeholder if none was uploaded -->
    <img v-if="preview" :src="preview" alt="Profile photo" class="avatar" />
    <div v-else class="avatar placeholder">{{ initials }}</div>

    <label for="avatar">Change photo</label>
    <input id="avatar" type="file" accept="image/*" @change="onFileChange" />

    <label for="name">Name</label>
    <input id="name" v-model.trim="name" type="text" />

    <!-- Email is read-only in this minimum version -->
    <label for="email">Email</label>
    <input id="email" :value="user.email" type="email" disabled />

    <p class="message">{{ message }}</p>

    <button @click="save" :disabled="saving">
      {{ saving ? 'Saving...' : 'Save changes' }}
    </button>
    <button class="logout" @click="logout">Log out</button>
  </div>
</template>

<style scoped>
.card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  text-align: center;
}
h2 { margin-top: 0; }
.avatar {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 1rem;
}
.placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2e7d32;
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
}
label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.8rem 0 0.3rem;
  text-align: left;
}
input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
}
input:disabled { background: #f2f2f2; }
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
button.logout { background: #c62828; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.message { color: #2e7d32; font-size: 0.9rem; min-height: 1.2em; }
</style>
