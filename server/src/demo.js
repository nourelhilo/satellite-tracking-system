import { randomBytes } from 'node:crypto'
import { newDb } from 'pg-mem'
import { app } from './app.js'
import { close_database, set_database } from './db.js'
import { setup_database } from './schema.js'

const memory = newDb()
const { Pool } = memory.adapters.createPg()
set_database(new Pool())
process.env.jwt_secret = randomBytes(48).toString('hex')
await setup_database({ with_security: false })

const server = app.listen(4000, () => {
  console.log('demo running on http://127.0.0.1:4000')
  console.log('demo data is temporary and resets when this process stops')
})

async function stop() {
  server.close()
  await close_database()
  process.exit(0)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
