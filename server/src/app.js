import express from 'express'
import cookie_parser from 'cookie-parser'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { auth_routes } from './routes/auth.js'
import { satellite_routes } from './routes/satellites.js'

export const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))
app.use(cookie_parser())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', auth_routes)
app.use('/api/satellites', satellite_routes)

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid json' })
  console.error(error)
  res.status(500).json({ error: 'something went wrong' })
})

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist')
if (existsSync(root)) {
  app.use(express.static(root))
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(root, 'index.html')))
}