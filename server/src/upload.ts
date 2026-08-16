// ============================================================
// upload.ts — Receives profile picture uploads.
//
// We use "multer" (a popular Express file-upload library).
// The file is saved to: server/public/uploads/avatar-<timestamp>.jpg
// and we return a public URL the client can store on the user record.
//
// This is a plain Express route (NOT a Feathers service) — which is
// fine: Feathers apps are Express apps, so you can mix both freely.
// ============================================================

import path from 'path'
import fs from 'fs'
import multer from 'multer'
import { fileURLToPath } from 'url'
import type { Request, Response } from 'express'
import type { Application } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Folder where uploaded images are stored.
const uploadDir: string = path.join(__dirname, '..', 'public', 'uploads')

// Tell multer where to save files and what name to give them.
const storage = multer.diskStorage({
  // destination: which folder
  destination: (_req, _file, cb) => {
    // create the folder on first run (recursive: true = no error if it exists)
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  // filename: unique name so two users can't overwrite each other
  filename: (_req, file, cb) => {
    // keep only safe image extensions, default to .jpg otherwise
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    const safeExt = allowed.includes(ext) ? ext : '.jpg'
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`)
  },
})

// Build the upload middleware: accept a single file from the "image" field,
// max 2 MB, and only images (checked by MIME type).
const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
}).single('image')

// Register the route: POST /upload  (multipart form data, field name "image")
export const upload = (app: Application): void => {
  app.use('/upload', (req: Request, res: Response) => {
    // multer runs first; err is set if something went wrong
    uploadMiddleware(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'unknown error'
        return res.status(400).json({ error: `Upload failed: ${message}` })
      }
      if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name: image)' })

      // Build a full, publicly accessible URL for the saved file.
      const base = `${req.protocol}://${req.get('host')}`
      res.json({ url: `${base}/public/uploads/${req.file.filename}` })
    })
  })
}
