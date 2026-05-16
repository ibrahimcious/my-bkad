// Production server entry point.
//
// `pnpm build` produces a Web `fetch` handler at dist/server/server.js
// plus static client assets in dist/client/. This file wraps them in a
// Node HTTP server: it serves static files when one matches the request
// path, and delegates everything else to the SSR handler.
//
// Run with `node server.js` (see the `start` script and the Dockerfile).

import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

import { serve } from '@hono/node-server'
import * as Sentry from '@sentry/node'

// Initialise Sentry before the app module loads so its global error
// handlers are installed first. Configuration mirrors the documented
// helper in src/shared/lib/sentry.ts; a missing DSN disables it.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: 0,
  })
}

const { default: ssrHandler } = await import('./dist/server/server.js')

const CLIENT_DIR = resolve('dist/client')

const CONTENT_TYPES = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

/** Serve a file from dist/client/ if the request path maps to one. */
async function tryStaticFile(pathname) {
  const filePath = resolve(join(CLIENT_DIR, pathname))
  // Reject any path that escapes the client directory.
  if (filePath !== CLIENT_DIR && !filePath.startsWith(CLIENT_DIR + '/')) {
    return null
  }
  try {
    const stats = await stat(filePath)
    if (!stats.isFile()) return null
    const body = await readFile(filePath)
    return new Response(body, {
      headers: {
        'content-type':
          CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return null
  }
}

async function fetchHandler(request) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    const asset = await tryStaticFile(new URL(request.url).pathname)
    if (asset) return asset
  }
  return ssrHandler.fetch(request)
}

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: fetchHandler, port, hostname: '0.0.0.0' }, ({ port }) => {
  console.log(`BKAD Pasuruan dashboard listening on http://0.0.0.0:${port}`)
})
