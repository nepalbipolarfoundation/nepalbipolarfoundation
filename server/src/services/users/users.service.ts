// ============================================================
// users.service.ts — Exposes the "users" collection as a Feathers
// service. A Feathers service is just an object with methods:
//   find()   → GET  /users
//   get(id)  → GET  /users/:id
//   create() → POST /users           (registration uses this)
//   patch()  → PATCH /users/:id      (profile update uses this)
//   remove() → DELETE /users/:id
// Feathers + Express turn those methods into REST endpoints for free.
//
// age and city are NOT stored on the user document. They live in the
// separate "user_details" collection (one row per user). The hooks at
// the bottom of this file keep that table in sync:
//   - create/patch: pull age/city out of the request and store them in
//     the user's details row.
//   - find/get/patch: read the details row back and attach age/city to
//     the returned user, so the API looks unchanged to the client.
//   - remove: delete the details row along with the user.
// ============================================================

import feathersMongoose from 'feathers-mongoose'
import type { HookContext } from '@feathersjs/feathers'
import { createModel } from './users.model.js'
import type { Application } from '../../types.js'

// feathers-mongoose is a CommonJS package. At runtime the default import
// is the whole module.exports object, so `Service` lives on it. The
// shipped TypeScript types describe the default as a factory function
// instead, so this cast realigns the types with reality.
const { Service } = feathersMongoose as unknown as {
  Service: new (options: { Model: unknown }) => any
}

export const users = (app: Application): void => {
  // Options tell the adapter which Mongoose model to use.
  const options = {
    Model: createModel(),
  }

  // Create the service and mount it at /users.
  // (Feathers mounts it under '/users' automatically.)
  app.use('users', new Service(options))

  const userService = app.service('users')

  // ----- Hooks that move age/city between users and user_details -----

  // BEFORE create/patch: if age or city was sent, take it out of the
  // user document and remember it for the after hook.
  const extractDetails = (context: HookContext): void => {
    if (Array.isArray(context.data)) return // multi-create not supported here
    const data = context.data as Record<string, any>
    if (!('age' in data) && !('city' in data)) return

    const details: Record<string, any> = {}
    if ('age' in data) {
      details.age = data.age
      delete data.age
    }
    if ('city' in data) {
      details.city = data.city
      delete data.city
    }
    ;(context.params as Record<string, any>)._userDetails = details
  }

  // AFTER create/patch: store (or update) the user's details row.
  // `create === true` is used for a brand-new user (row cannot exist yet).
  const saveDetails = (create: boolean) => async (context: HookContext): Promise<void> => {
    const details = (context.params as Record<string, any>)._userDetails as Record<string, any> | undefined
    if (!details) return

    const userDetailsService = context.app.service('user-details')
    if (create) {
      await userDetailsService.create({ userId: context.result._id, ...details })
      return
    }

    const existing = await userDetailsService.find({ query: { userId: context.id } })
    if (existing.length > 0) {
      await userDetailsService.patch(existing[0]._id, details)
    } else {
      await userDetailsService.create({ userId: context.id, ...details })
    }
  }

  // AFTER find/get/patch: re-attach age/city from user_details so the
  // API response looks exactly like it did before the split.
  const attachDetails = async (context: HookContext): Promise<void> => {
    const userDetailsService = context.app.service('user-details')
    const attach = async (user: Record<string, any>): Promise<void> => {
      const existing = await userDetailsService.find({ query: { userId: user._id } })
      const row = existing[0]
      user.age = row?.age ?? null
      user.city = row?.city ?? null
    }

    if (Array.isArray(context.result)) {
      await Promise.all(context.result.map(attach))
    } else if (context.result) {
      await attach(context.result)
    }
  }

  // AFTER remove: delete the user's details row so no orphans remain.
  const removeDetails = async (context: HookContext): Promise<void> => {
    const userDetailsService = context.app.service('user-details')
    const existing = await userDetailsService.find({ query: { userId: context.id } })
    if (existing.length > 0) {
      await userDetailsService.remove(existing[0]._id)
    }
  }

  userService.hooks({
    before: {
      create: [extractDetails],
      patch: [extractDetails],
    },
    after: {
      create: [saveDetails(true)],
      patch: [saveDetails(false), attachDetails],
      find: [attachDetails],
      get: [attachDetails],
      remove: [removeDetails],
    },
  })
}
