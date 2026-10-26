import jwt from 'jsonwebtoken'
import { find_user_by_id } from './models/user.js'

const cookie_name = 'satellite_session'

export function set_session(res, user) {
  const token = jwt.sign({ sub: String(user.id) }, process.env.jwt_secret, { expiresIn: '1d' })
  res.cookie(cookie_name, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  })
}

export function clear_session(res) {
  res.clearCookie(cookie_name, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
}

export async function require_user(req, res, next) {
  let payload
  try {
    const token = req.cookies[cookie_name]
    if (!token) return res.status(401).json({ error: 'please log in' })
    payload = jwt.verify(token, process.env.jwt_secret)
  } catch {
    return res.status(401).json({ error: 'please log in' })
  }

  try {
    const user = await find_user_by_id(payload.sub)
    if (!user) return res.status(401).json({ error: 'please log in' })
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
