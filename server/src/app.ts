// ============================================================
// app.ts — The main application. This is where the Feathers
// server is assembled like a LEGO tower.
//
// A Feathers "app" IS an Express app, but with super powers:
//   - Services (like /users) expose REST endpoints automatically.
//   - Hooks run before/after every service call.
//
// Order matters here (read from top to bottom):
//   config → cors → body parsers → static files → REST support
//   → upload route → users service → user-details service
//   → built client (static) → authentication → error handlers
// ============================================================

import { feathers } from '@feathersjs/feathers'
import feathersExpress, {
  rest, // makes services available over HTTP (GET/POST/PATCH/...)
  json, // parses incoming JSON bodies
  urlencoded, // parses form bodies
  notFound, // returns a 404 for unknown routes
  errorHandler, // converts errors into nice JSON responses
  static as serveStatic, // serves static files (the uploaded images)
} from '@feathersjs/express'
import configuration from '@feathersjs/configuration' // loads config/default.json
import cors from 'cors' // lets the browser app on another port call this API
import path from 'path'
import { fileURLToPath } from 'url'

import { authentication } from './authentication.js' // login / JWT logic
import { users } from './services/users/users.service.js' // the /users service
import { userDetails } from './services/user-details/user-details.service.js' // the /user-details service
import { upload } from './upload.js' // the /upload route for profile images
import type { Application, Configuration, ServiceTypes } from './types.js'

// __dirname is the folder of this file.
// (ES modules don't have __dirname, so we build it from import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create the Feathers app (also an Express app), fully typed.
export const app: Application = feathersExpress<ServiceTypes, Configuration>(feathers())

// 1) configuration() loads config/default.json into app.get('...')
app.configure(configuration())

// 2) CORS: the Vue app runs on http://localhost:5173 and calls this
//    API on http://localhost:3030. CORS allows that cross-origin call.
app.use(cors())

// 3) Body parsers: without these, req.body would be undefined.
app.use(json()) // for JSON data (login, registration)
app.use(urlencoded({ extended: true })) // for form data

// 4) Serve uploaded profile images as static files.
//    Example: GET http://localhost:3030/public/uploads/photo.jpg
app.use('/public', serveStatic(path.join(__dirname, '..', 'public')))

// 5) Enable REST transport so services work over plain HTTP.
app.configure(rest())

// 6) The image upload route (POST /upload with a file called "image").
app.configure(upload)

// 7) The /users service (register, view, update profiles).
app.configure(users)

// 7b) The /user-details service (age + city, kept separate from users).
app.configure(userDetails)

// 7c) Serve the built Vue client (used in production / Docker).
//     In development the client runs on its own Vite server (port 5173),
//     so this only matters when a build exists. `CLIENT_DIST` points at
//     the build folder; by default we look next to the project.
const clientDist = process.env.CLIENT_DIST || path.join(__dirname, '..', '..', 'client', 'dist')
app.use(serveStatic(clientDist))

// 8) Authentication (login) must be configured AFTER users service,
//    because it adds security hooks to the users service.
app.configure(authentication)

// 9) Error handling: 404 for unknown routes, JSON errors otherwise.
app.use(notFound())
app.use(errorHandler())
