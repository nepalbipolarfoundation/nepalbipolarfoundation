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
import type { HookContext } from '@feathersjs/feathers'
import type { Application } from './types.js'

// Deprecated in favor of schema resolvers but still functional with Mongoose models.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { hashPassword, protect } = localHooks as any

// Try to decode the JWT if one was sent, without failing for
// unauthenticated requests (public registration has no token).
// This populates context.params.user so restrictRoles can tell
// whether the caller is an admin.
const optionalAuthenticate = async (context: HookContext): Promise<void> => {
  try {
    await authenticate('jwt')(context)
  } catch {
    // No token or invalid token — continue unauthenticated.
  }
}

// Only admins may set or change roles. Non-admin requests silently
// have the roles field stripped so it is never saved.
const restrictRoles = (context: HookContext): void => {
  const userRoles = (context.params.user as any)?.roles as string[] | undefined
  if (!userRoles || !userRoles.includes('admin')) {
    if (context.data && typeof context.data === 'object' && !Array.isArray(context.data)) {
      delete (context.data as Record<string, unknown>).roles
    }
  }
}

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
      // restrictRoles: only admins may assign roles on create/update.
      create: [hashPassword('password'), optionalAuthenticate, restrictRoles],
      // Only logged-in users may list users (dashboard) or view a user.
      find: [authenticate('jwt')],
      get: [authenticate('jwt')],
      // Only logged-in users may update their profile.
      // restrictRoles: non-admins cannot escalate their own roles.
      patch: [authenticate('jwt'), restrictRoles],
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
