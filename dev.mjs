// ============================================================
// dev.mjs — Run the API server and the Vue client together.
//
//   npm run dev
//
// Spawns both processes, prefixes their output with [server] /
// [client], and shuts them both down when you press Ctrl+C.
// ============================================================

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname

const isWindows = process.platform === 'win32'

// On Windows npm is `npm.cmd` and must run through cmd.exe.
const npm = isWindows ? 'npm.cmd' : 'npm'

function run(label, cwd, script) {
  const cmd = isWindows ? 'cmd.exe' : npm
  const args = isWindows ? ['/d', '/s', '/c', `${npm} run ${script}`] : ['run', script]
  const child = spawn(cmd, args, { cwd, shell: false, stdio: ['pipe', 'pipe', 'pipe'] })

  const prefix = (data) => {
    String(data)
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .forEach((line) => console.log(`[${label}] ${line}`))
  }

  child.stdout.on('data', prefix)
  child.stderr.on('data', prefix)
  child.on('close', (code) => {
    console.log(`[${label}] exited with code ${code}`)
    shutdown()
  })
  child.on('error', (err) => {
    console.error(`[${label}] failed to start: ${err.message}`)
    shutdown()
  })
  return child
}

const children = []

// Server: Feathers API + MongoDB on http://localhost:3030
children.push(run('server', path.join(root, 'server'), 'dev'))
// Client: Vue dev server on http://localhost:5173
children.push(run('client', path.join(root, 'client'), 'dev'))

let shuttingDown = false
function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  console.log('Shutting down...')
  if (isWindows) {
    // npm spawns grandchildren (tsx/vite) that must be killed too.
    for (const child of children) {
      try {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      } catch {
        child.kill()
      }
    }
  } else {
    for (const child of children) child.kill('SIGTERM')
  }
}

process.on('SIGINT', () => {
  shutdown()
  process.exit(0)
})
process.on('SIGTERM', () => {
  shutdown()
  process.exit(0)
})
