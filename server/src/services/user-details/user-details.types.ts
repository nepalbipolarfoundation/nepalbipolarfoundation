// ============================================================
// user-details.types.ts — The TypeScript shape of a user-details
// document. Mirrors the mongoose schema in user-details.model.ts.
//
// There is exactly one row per user: `userId` links back to the
// user in the "users" collection, and the profile details (age,
// city) live here instead of on the user document itself.
// ============================================================

import type { Types } from 'mongoose'

export interface UserDetails {
  _id: string
  userId: Types.ObjectId
  age: number | null
  city: string | null
  createdAt: string
  updatedAt: string
}
