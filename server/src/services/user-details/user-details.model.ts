// ============================================================
// user-details.model.ts — The shape of a user-details document.
//
// One row per user. `userId` references the "_id" of a user in the
// "users" collection; the unique index guarantees a user can only
// have a single details row. `collection: 'user_details'` pins the
// MongoDB collection name explicitly.
// ============================================================

import mongoose, { Schema, type Model } from 'mongoose'
import type { UserDetails } from './user-details.types.js'

export const createModel = (): Model<UserDetails> => {
  const schema = new Schema<UserDetails>({
    // Which user this row belongs to (reference to "users"._id).
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true, unique: true },

    // Age of the user in years (may be null/unknown)
    age: { type: Number, default: null },

    // City the user lives in (may be null/unknown)
    city: { type: String, default: null, trim: true },

    // createdAt / updatedAt are added automatically by mongoose
  }, { timestamps: true, collection: 'user_details' })

  return mongoose.model<UserDetails>('user_details', schema)
}
