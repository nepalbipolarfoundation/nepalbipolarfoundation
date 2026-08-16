// ============================================================
// user-details.service.ts — Exposes the "user_details" collection
// as a Feathers service. Same pattern as the users service.
//
// The client never calls this directly: the /users service hooks
// keep this table in sync. It is still exposed as REST endpoints
// (GET/POST/PATCH/DELETE /user-details) but locked down to logged
// in users.
// ============================================================

import feathersMongoose from 'feathers-mongoose'
import { authenticate } from '@feathersjs/authentication'
import { createModel } from './user-details.model.js'
import type { Application } from '../../types.js'

// feathers-mongoose is a CommonJS package. At runtime the default import
// is the whole module.exports object, so `Service` lives on it. The
// shipped TypeScript types describe the default as a factory function
// instead, so this cast realigns the types with reality.
const { Service } = feathersMongoose as unknown as {
  Service: new (options: { Model: unknown }) => any
}

export const userDetails = (app: Application): void => {
  // Create the service and mount it at /user-details.
  app.use('user-details', new Service({ Model: createModel() }))

  // Only logged-in users may read or change user details.
  // (Internal calls from the /users hooks skip this — no "provider".)
  app.service('user-details').hooks({
    before: {
      all: [authenticate('jwt')],
    },
  })
}
