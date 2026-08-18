// ============================================================
// feathers.ts — One small file that creates the Feathers client.
// Every component imports `app` from here and calls services:
//
//   feathers.authenticate({ strategy: 'local', email, password })
//   feathers.service('users').create({ name, email, password })
//   feathers.service('users').patch(id, { avatar })
//
// The Feathers client is a mirror of the server: the SAME app object
// we use on the server works in the browser too.
// ============================================================

import { feathers } from '@feathersjs/feathers'
import restClient from '@feathersjs/rest-client'
import authenticationClient from '@feathersjs/authentication-client'

// The TypeScript shape of a user returned by the API.
export interface User {
  _id: string
  name: string
  email: string
  avatar: string | null
  age: number | null
  city: string | null
  roles: string[]
  createdAt: string
  updatedAt: string
}

// Which services exist, and their typed methods. This is what makes
// `feathers.service('users').create(...)` fully type-checked.
export interface ServiceTypes {
  users: {
    find(): Promise<User[]>
    create(data: { name: string; email: string; password: string; avatar?: string | null; age?: number | null; city?: string | null; roles?: string[] }): Promise<User>
    patch(id: string, data: Partial<Pick<User, 'name' | 'avatar' | 'age' | 'city' | 'roles'>>): Promise<User>
    remove(id: string): Promise<User>
  }
  authentication: {
    create(data: Record<string, unknown>): Promise<unknown>
  }
}

// The address of the backend API (see server/config/default.json).
// In dev this is http://localhost:3030. When the built app is served
// BY the API server (e.g. the Docker image), VITE_SERVER_URL is set to
// empty so the SPA talks to the same origin it was served from.
export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3030'

// Create the typed client app.
const app = feathers<ServiceTypes>()

// Tell it to use REST (fetch) and point it at our API.
// Note: fetch must be called as a method of `window`, otherwise the
// browser throws "Illegal invocation". Wrapping it in an arrow function
// preserves the correct `this` when the Feathers client calls it.
app.configure(restClient(SERVER_URL).fetch((url, init) => fetch(url, init)))

// Enable authentication. storage: the access token is saved in the
// browser's localStorage so the user stays logged in after refresh.
app.configure(authenticationClient({ storage: window.localStorage }))

export default app
