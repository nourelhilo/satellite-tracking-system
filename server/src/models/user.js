import { randomUUID } from 'node:crypto'
import { query } from '../db.js'

export async function create_user({ name, email, password_hash }) {
  const result = await query(
    'insert into orbit_desk.users (id, name, email, password_hash) values ($1, $2, $3, $4) returning id, name, email',
    [randomUUID(), name, email, password_hash]
  )
  return result.rows[0]
}

export async function find_user_by_email(email) {
  const result = await query('select id, name, email, password_hash from orbit_desk.users where email = $1', [email])
  return result.rows[0]
}

export async function find_user_by_id(id) {
  const result = await query('select id, name, email from orbit_desk.users where id = $1', [id])
  return result.rows[0]
}
