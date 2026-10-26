import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { create_user, find_user_by_email } from '../models/user.js'
import { clear_session, require_user, set_session } from '../auth.js'

export const auth_routes = Router()

function public_user(user) {
  return { id: user.id, name: user.name, email: user.email }
}

auth_routes.post('/signup', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''

  if (name.length < 2 || name.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128) {
    return res.status(400).json({ error: 'enter a name, valid email, and password of at least 10 characters' })
  }

  try {
    const password_hash = await bcrypt.hash(password, 12)
    const user = await create_user({ name, email, password_hash })
    set_session(res, user)
    res.status(201).json({ user: public_user(user) })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'email is already registered' })
    throw error
  }
})

auth_routes.post('/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const user = await find_user_by_email(email)
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'invalid email or password' })
  }
  set_session(res, user)
  res.json({ user: public_user(user) })
})

auth_routes.get('/me', require_user, (req, res) => {
  res.json({ user: public_user(req.user) })
})

auth_routes.post('/logout', (req, res) => {
  clear_session(res)
  res.json({ ok: true })
})
