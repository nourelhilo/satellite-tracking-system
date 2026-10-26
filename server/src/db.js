import pg from 'pg'
import { readFileSync } from 'node:fs'

let database

export function connect_database() {
  database = new pg.Pool({
    connectionString: process.env.database_url,
    ssl: {
      ca: readFileSync(new URL('../certs/supabase-ca.crt', import.meta.url), 'utf8'),
      rejectUnauthorized: true
    },
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  })
  return database
}

export function set_database(value) {
  database = value
}

export function query(sql, values = []) {
  if (!database) throw new Error('database is not connected')
  return database.query(sql, values)
}

export async function close_database() {
  await database?.end()
  database = undefined
}


