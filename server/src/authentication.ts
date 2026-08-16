// ============================================================
// authentication.ts — Login and JWT security.
//
// Feathers separates concerns nicely:
//   1. AuthenticationService handles login/logout + issues JWTs.
//   2. A "strategy" is one way to prove who you are:
//        - 'local' = email + password  (the classic login form)
//        - 'jwt'   = a token you already got from a previous login
//   3. Hooks secure the users service (hash passwords, protect them).
// ============================================================

import { AuthenticationService, JWTStrategy, authenticate } from '@feathersjs/authentication'
import { LocalStrategy, hooks as localHooks } from '@feathersjs/authentication-local'
import type { Application } from './types.js'

// Feathers 5 keeps these security hooks under the "hooks" export.
const { hashPassword, protect } = localHooks

export const authentication = (app: Application): void => {
  // Create the authentication service and expose it at POST /authentication
  const authService = new AuthenticationService(app)

  // Register the two login strategies we support.
  authService.register('jwt', new JWTStrategy()) // "I already have a token"
  authService.register('local', new LocalStrategy()) // "email + password"

  // Expose it at POST /authentication (Feathers adds the slash).
  app.use('authentication', authService)

  // ----- Security hooks on the /users service -----
  const userService = app.service('users')

  userService.hooks({
    before: {
      // hashPassword: turn the plain-text password into a bcrypt hash
      // BEFORE it is saved. We never store plain passwords!
      create: [hashPassword('password')],
      // Only logged-in users may list users (dashboard) or view a user.
      find: [authenticate('jwt')],
      get: [authenticate('jwt')],
      // Only logged-in users may update their profile.
      patch: [authenticate('jwt')],
      update: [authenticate('jwt')],
      remove: [authenticate('jwt')],
    },
    after: {
      // protect: remove the password field from every response.
      // (internal calls like login still see it, external calls do not)
      all: [protect('password')],
    },
  })
}
