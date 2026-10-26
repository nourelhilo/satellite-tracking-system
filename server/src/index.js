import 'dotenv/config'
import { app } from './app.js'
import { close_database, connect_database, query } from './db.js'
import { setup_database } from './schema.js'

const database_url = process.env.database_url
const jwt_secret = process.env.jwt_secret
const port = Number(process.env.port || 4000)

if (!database_url || !jwt_secret || jwt_secret.length < 32) {
  console.error('set database_url and a jwt_secret of at least 32 characters in server/.env')
  process.exit(1)
}

try {
  connect_database()
  await query('select 1')
  await setup_database()
  app.listen(port, () => console.log('server running on http://localhost:' + port))
} catch (error) {
  console.error('could not connect to supabase postgres:', error.message)
  await close_database()
  process.exit(1)
}
