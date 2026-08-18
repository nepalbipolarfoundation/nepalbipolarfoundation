<!-- ============================================================
  UsersAdmin.vue — The "Users" page of the dashboard.
  Admins see all users and can add new ones.
  Non-admins see only their own profile.
============================================================ -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import feathers, { type User } from '../feathers'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()


// ---- Table state ----
const users = ref<User[]>([])
const loading = ref(true)
const error = ref('')
const message = ref('')

// ---- Edit modal state ----
const editingId = ref<string | null>(null)
const showEditModal = ref(false)
const saving = ref(false)
const editFormError = ref('')
const editForm = ref({
  name: '',
  email: '',
  age: '',
  city: '',
})

// ---- Create modal state ----
const showCreateModal = ref(false)
const creating = ref(false)
const createFormError = ref('')
const createForm = ref({
  name: '',
  email: '',
  password: '',
  age: '',
  city: '',
  roles: '',
})

async function loadUsers(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const all = await feathers.service('users').find()
    // Admins see all users; non-admins see only themselves.
    users.value = auth.isAdmin
      ? all
      : all.filter((u: User) => u._id === auth.user?._id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load users.'
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)

// ---- Edit user ----
function openEdit(u: User): void {
  editingId.value = u._id
  editForm.value = {
    name: u.name,
    email: u.email,
    age: u.age === null || u.age === undefined ? '' : String(u.age),
    city: u.city ?? '',
  }
  editFormError.value = ''
  showEditModal.value = true
}

async function saveEdit(): Promise<void> {
  editFormError.value = ''
  if (!editForm.value.name.trim() || !editForm.value.email.trim()) {
    editFormError.value = 'Name and email are required.'
    return
  }

  saving.value = true
  try {
    const parsedAge = editForm.value.age === '' ? null : Number(editForm.value.age)
    const age = parsedAge === null || Number.isNaN(parsedAge) ? null : parsedAge
    const base = {
      name: editForm.value.name.trim(),
      age,
      city: editForm.value.city.trim() || null,
    }

    await feathers.service('users').patch(editingId.value!, base)
    message.value = 'User updated.'

    showEditModal.value = false
    await loadUsers()
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    editFormError.value = /duplicate/i.test(msg)
      ? 'That email is already registered.'
      : msg || 'Could not save user.'
  } finally {
    saving.value = false
  }
}

// ---- Create user (admin only) ----
function openCreate(): void {
  createForm.value = { name: '', email: '', password: '', age: '', city: '', roles: '' }
  createFormError.value = ''
  showCreateModal.value = true
}

async function createUser(): Promise<void> {
  createFormError.value = ''
  if (!createForm.value.name.trim() || !createForm.value.email.trim() || !createForm.value.password) {
    createFormError.value = 'Name, email and password are required.'
    return
  }
  if (createForm.value.password.length < 6) {
    createFormError.value = 'Password must be at least 6 characters.'
    return
  }

  creating.value = true
  try {
    const parsedAge = createForm.value.age === '' ? null : Number(createForm.value.age)
    const age = parsedAge === null || Number.isNaN(parsedAge) ? null : parsedAge
    const roles = createForm.value.roles
      ? createForm.value.roles.split(',').map(r => r.trim()).filter(Boolean)
      : []

    await feathers.service('users').create({
      name: createForm.value.name.trim(),
      email: createForm.value.email.trim().toLowerCase(),
      password: createForm.value.password,
      age,
      city: createForm.value.city.trim() || null,
      roles,
    })

    message.value = 'User created successfully.'
    showCreateModal.value = false
    await loadUsers()
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    const code = (e as { code?: number }).code
    if (code === 409 || /duplicate/i.test(msg)) {
      createFormError.value = 'That email is already registered.'
    } else {
      createFormError.value = msg || 'Could not create user.'
    }
  } finally {
    creating.value = false
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
    <!-- Header row with the "Add user" action (admin only) -->
    <div class="toolbar">
      <h2>{{ auth.isAdmin ? 'Users' : 'My Profile' }}</h2>
      <button v-if="auth.isAdmin" class="primary" @click="openCreate">+ Add User</button>
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
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u._id" :class="{ 'current-user': u._id === auth.user?._id }">
            <td>
              <img v-if="u.avatar" :src="u.avatar" class="thumb" alt="" />
              <span v-else class="thumb placeholder">{{ initials(u) }}</span>
            </td>
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.age ?? '—' }}</td>
            <td>{{ u.city || '—' }}</td>
            <td>{{ formatDate(u.createdAt) }}</td>
             <td>{{ u.roles.join(', ') || '—' }}</td>
            <td class="actions">
              <button class="edit" @click="openEdit(u)">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint" v-else>No user data found.</p>

    <!-- Edit modal -->
    <div v-if="showEditModal" class="overlay" @click.self="showEditModal = false">
      <div class="modal">
        <h3>Edit user</h3>
        <form @submit.prevent="saveEdit">
          <label for="u-name">Name</label>
          <input id="u-name" v-model.trim="editForm.name" type="text" required />

          <label for="u-email">Email</label>
          <input id="u-email" v-model.trim="editForm.email" type="email" required disabled />

          <label for="u-age">Age</label>
          <input id="u-age" v-model="editForm.age" type="number" min="0" max="150" />

          <label for="u-city">City</label>
          <input id="u-city" v-model.trim="editForm.city" type="text" />

          <p class="error">{{ editFormError }}</p>

          <div class="modal-actions">
            <button type="button" class="ghost" @click="showEditModal = false">Cancel</button>
            <button type="submit" class="primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create user modal (admin only) -->
    <div v-if="showCreateModal" class="overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <h3>Add new user</h3>
        <form @submit.prevent="createUser">
          <label for="c-name">Name</label>
          <input id="c-name" v-model.trim="createForm.name" type="text" placeholder="Full name" required />

          <label for="c-email">Email</label>
          <input id="c-email" v-model.trim="createForm.email" type="email" placeholder="user@example.com" required />

          <label for="c-password">Password</label>
          <input id="c-password" v-model="createForm.password" type="password" placeholder="Min 6 characters" required />

          <label for="c-age">Age</label>
          <input id="c-age" v-model="createForm.age" type="number" min="0" max="150" />

          <label for="c-city">City</label>
          <input id="c-city" v-model.trim="createForm.city" type="text" placeholder="e.g. Kathmandu" />

          <label for="c-roles">Roles</label>
          <input id="c-roles" v-model.trim="createForm.roles" type="text" placeholder="e.g. admin, editor (comma-separated)" />

          <p class="error">{{ createFormError }}</p>

          <div class="modal-actions">
            <button type="button" class="ghost" @click="showCreateModal = false">Cancel</button>
            <button type="submit" class="primary" :disabled="creating">
              {{ creating ? 'Creating...' : 'Create User' }}
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
tbody tr.current-user {
  background: #e8f5e9;
}
tbody tr.current-user td:first-child {
  position: relative;
}
tbody tr.current-user td:first-child::before {
  /* content: 'You'; */
  position: absolute;
  top: -0.2rem;
  right: -0.2rem;
  background: #2e7d32;
  color: #fff;
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 600;
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
