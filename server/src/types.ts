// ============================================================
// types.ts — Shared TypeScript types for the server.
//
// `ServiceTypes` tells TypeScript which services exist and the
// generic `Application` type makes the Feathers app fully typed
// (e.g. app.get('port') knows it returns a number).
// ============================================================

import type { Application as ExpressFeathers } from '@feathersjs/express'
import type { AuthenticationService } from '@feathersjs/authentication'

// The shape of config/default.json (read via app.get(...))
export interface Configuration {
  port: number
  mongodb: string
  authentication: unknown
}

// The list of Feathers services mounted on this app.
// `users` and `user-details` are typed loosely (any) because
// feathers-mongoose does not ship TypeScript types yet.
export interface ServiceTypes {
  users: any
  'user-details': any
  authentication: AuthenticationService
}

// The fully typed Feathers + Express application.
export type Application = ExpressFeathers<ServiceTypes, Configuration>
