// ============================================================
// index.ts — The entry point of the server.
//
// What happens here, step by step:
//   1. Import the configured Feathers app (created in app.ts).
//   2. Import mongoose so we can talk to MongoDB.
//   3. Connect to MongoDB. If the database is not running,
//      the server will print an error and stop.
//   4. Start the HTTP server on the port from config/default.json.
//
// Note: we run TypeScript directly with `tsx` (no build step).
// ============================================================

import mongoose from 'mongoose'
import { app } from './app.js'

// Read the port from config/default.json (value: 3030).
// TypeScript knows this is a number because of our Configuration type.
const port: number = app.get('port')

// Start everything. async/await makes the code read top to bottom.
async function start(): Promise<void> {
  try {
    // MongoDB URI from config/default.json, overridable via the
    // MONGODB_URI environment variable (used by docker-compose).
    const mongodbUri = process.env.MONGODB_URI || app.get('mongodb')

    // Connect to MongoDB using the URI from config/default.json
    await mongoose.connect(mongodbUri)
    console.log(`MongoDB connected: ${mongodbUri}`)

    // app.listen() starts the HTTP server and wires up all Feathers
    // services/REST routes. It returns the app (not the http server),
    // so we log readiness here instead of listening for an event.
    app.listen(port)
    console.log(`API running at http://localhost:${port}`)
  } catch (error) {
    // If MongoDB is not running, tell the user clearly and stop.
    console.error('Failed to start server:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

start()
