<!-- ============================================================
  UsersAdmin.vue — The "Users" page of the dashboard.
  Fetches every user from GET /users and shows them in a table,
  with full CRUD support:
    - Create: "Add user" opens a form (POST /users)
    - Read:   the table lists all users (GET /users)
    - Update: "Edit" opens the form prefilled (PATCH /users/:id)
    - Delete: "Delete" asks for confirmation (DELETE /users/:id)
============================================================ -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import feathers, { type User } from '../feathers'

// ---- Table state ----
const users = ref<User[]>([])
const loading = ref(true)
const error = ref('')
const message = ref('')

// ---- Modal / form state ----
// editingId === null → we are creating a new user, otherwise editing that one.
const editingId = ref<string | null>(null)
const showModal = ref(false)
const saving = ref(false)
const formError = ref('')
const form = ref({
  name: '',
  email: '',
  password: '',
  age: '',
  city: '',
})

async function loadUsers(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    // GET /users — the server returns an array (pagination is off).
    users.value = await feathers.service('users').find()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load users.'
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)

// Show the "Add user" modal (empty form).
function openCreate(): void {
  editingId.value = null
  form.value = { name: '', email: '', password: '', age: '', city: '' }
  formError.value = ''
  showModal.value = true
}

// Show the "Edit user" modal, prefilled from the row.
function openEdit(u: User): void {
  editingId.value = u._id
  form.value = {
    name: u.name,
    email: u.email,
    password: '',
    age: u.age === null || u.age === undefined ? '' : String(u.age),
    city: u.city ?? '',
  }
  formError.value = ''
  showModal.value = true
}

// Create (POST) or update (PATCH) a user, then refresh the table.
async function save(): Promise<void> {
  formError.value = ''
  if (!form.value.name.trim() || !form.value.email.trim()) {
    formError.value = 'Name and email are required.'
    return
  }
  if (!editingId.value && form.value.password.length < 6) {
    formError.value = 'Password must be at least 6 characters.'
    return
  }

  saving.value = true
  try {
    const parsedAge = form.value.age === '' ? null : Number(form.value.age)
    const age = parsedAge === null || Number.isNaN(parsedAge) ? null : parsedAge
    const base = {
      name: form.value.name.trim(),
      age,
      city: form.value.city.trim() || null,
    }

    if (editingId.value) {
      await feathers.service('users').patch(editingId.value, base)
      message.value = 'User updated.'
    } else {
      await feathers.service('users').create({
        ...base,
        email: form.value.email.trim().toLowerCase(),
        password: form.value.password,
      })
      message.value = 'User created.'
    }

    showModal.value = false
    await loadUsers()
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    formError.value = /duplicate/i.test(msg)
      ? 'That email is already registered.'
      : msg || 'Could not save user.'
  } finally {
    saving.value = false
  }
}

// Delete a user after confirmation (DELETE /users/:id).
async function removeUser(u: User): Promise<void> {
  if (!window.confirm(`Delete "${u.name}" (${u.email})? This cannot be undone.`)) return
  try {
    await feathers.service('users').remove(u._id)
    message.value = 'User deleted.'
    await loadUsers()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not delete user.'
  }
}

function initials(u: User): string {
  const parts = (u.name || '').trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts[1]?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString()
}
</script>

<template>
  <section>
    <!-- Header row with the "Add user" action (Create) -->
    <div class="toolbar">
      <h2>Users</h2>
      <button class="primary" @click="openCreate">Add user</button>
    </div>

    <p class="error" v-if="error">{{ error }}</p>
    <p class="message" v-if="message">{{ message }}</p>

    <p class="hint" v-if="loading">Loading users...</p>

    <!-- Read: all users in a table -->
    <div class="table-wrap" v-else-if="users.length">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Email</th>
            <th>Age</th>
            <th>City</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u._id">
            <td>
              <img v-if="u.avatar" :src="u.avatar" class="thumb" alt="" />
              <span v-else class="thumb placeholder">{{ initials(u) }}</span>
            </td>
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.age ?? '—' }}</td>
            <td>{{ u.city || '—' }}</td>
            <td>{{ formatDate(u.createdAt) }}</td>
            <td class="actions">
              <button class="edit" @click="openEdit(u)">Edit</button>
              <button class="danger" @click="removeUser(u)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint" v-else>No users yet. Click "Add user" to create the first one.</p>

    <!-- Create / Update modal -->
    <div v-if="showModal" class="overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editingId ? 'Edit user' : 'Add user' }}</h3>
        <form @submit.prevent="save">
          <label for="u-name">Name</label>
          <input id="u-name" v-model.trim="form.name" type="text" required />

          <label for="u-email">Email</label>
          <!-- Email is fixed when editing (it is the login username) -->
          <input id="u-email" v-model.trim="form.email" type="email" required :disabled="!!editingId" />

          <template v-if="!editingId">
            <label for="u-password">Password (min 6 characters)</label>
            <input id="u-password" v-model="form.password" type="password" required />
          </template>

          <label for="u-age">Age</label>
          <input id="u-age" v-model="form.age" type="number" min="0" max="150" />

          <label for="u-city">City</label>
          <input id="u-city" v-model.trim="form.city" type="text" />

          <p class="error">{{ formError }}</p>

          <div class="modal-actions">
            <button type="button" class="ghost" @click="showModal = false">Cancel</button>
            <button type="submit" class="primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.toolbar h2 {
  margin: 0;
  color: #2e7d32;
}
.hint {
  color: #777;
}
.error {
  color: #c62828;
  font-size: 0.9rem;
}
.message {
  color: #2e7d32;
  font-size: 0.9rem;
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
  min-width: 640px;
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
.actions {
  white-space: nowrap;
}
.actions button {
  padding: 0.35rem 0.7rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}
.actions button + button {
  margin-left: 0.4rem;
}
button.edit {
  background: #e8f0e9;
  color: #2e7d32;
}
button.danger {
  background: #fdecea;
  color: #c62828;
}
button.primary {
  background: #2e7d32;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.55rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
}
button.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
button.ghost {
  background: #eef1ef;
  color: #333;
  border: none;
  border-radius: 6px;
  padding: 0.55rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 4rem 1rem;
  z-index: 10;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}
.modal h3 {
  margin: 0 0 1rem;
}
.modal label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.8rem 0 0.3rem;
}
.modal input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
}
.modal input:disabled {
  background: #f2f2f2;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.2rem;
}
</style>
