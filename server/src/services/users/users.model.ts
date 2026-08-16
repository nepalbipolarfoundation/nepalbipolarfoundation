// ============================================================
// users.model.ts — The shape of a user document in MongoDB.
//
// A "schema" is like a blueprint: it says what fields a user has
// and what type each field is. mongoose.model turns that blueprint
// into an object we can query (find, save, delete) in the database.
//
// `Model<User>` connects the schema to our TypeScript User type,
// so mongoose queries are type-checked too.
// ============================================================

import mongoose, { Schema, type Model } from 'mongoose'
import type { User } from './users.types.js'

export const createModel = (): Model<User> => {
  const schema = new Schema<User>({
    // Full name shown on the profile page
    name: { type: String, required: true },

    // Used as the login username. lowercase/trim normalise input.
    // unique: true creates a database index that rejects duplicate emails.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Hashed password (never store the plain text!)
    password: { type: String, required: true },

    // Public URL of the uploaded profile image (may be null)
    avatar: { type: String, default: null },

    // NOTE: age and city are NOT stored here anymore. They live in
    // the separate "user_details" collection (see user-details.model.js).
    // The /users service hooks move them in/out automatically.

    // createdAt / updatedAt are added automatically by mongoose
  }, { timestamps: true })

  // "users" is the MongoDB collection name.
  return mongoose.model<User>('users', schema)
}
