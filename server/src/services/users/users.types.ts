// ============================================================
// users.types.ts — The TypeScript shape of a user document.
// Mirrors the mongoose schema in users.model.ts.
//
// `age` and `city` are not stored on the user document; the users
// service hooks attach them from the "user_details" collection so
// every API response still includes them.
// ============================================================

export interface User {
  _id: string
  name: string
  email: string
  password: string
  avatar: string | null
  age: number | null
  city: string | null
  createdAt: string
  updatedAt: string
  roles: string[]
}
