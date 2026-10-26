import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { app } from '../src/app.js'
import { close_database, set_database } from '../src/db.js'
import { setup_database } from '../src/schema.js'

before(async () => {
  process.env.jwt_secret = 'test_secret_for_api_checks_12345678901234567890'
  const memory = newDb()
  const { Pool } = memory.adapters.createPg()
  set_database(new Pool())
  await setup_database({ with_security: false })
})

after(async () => {
  await close_database()
})
test('accounts stay separate and satellite data is validated', async () => {
  const anonymous = await request(app).get('/api/satellites')
  assert.equal(anonymous.status, 401)

  const first = request.agent(app)
  const second = request.agent(app)
  const signup = await first.post('/api/auth/signup').send({
    name: 'noor',
    email: 'noor@example.com',
    password: 'long_password_123'
  })
  assert.equal(signup.status, 201)
  assert.equal(signup.body.user.email, 'noor@example.com')
  assert.match(signup.headers['set-cookie'][0], /httponly/i)

  const duplicate = await request(app).post('/api/auth/signup').send({
    name: 'other',
    email: 'noor@example.com',
    password: 'long_password_456'
  })
  assert.equal(duplicate.status, 409)

  const second_signup = await second.post('/api/auth/signup').send({
    name: 'taseem',
    email: 'taseem@example.com',
    password: 'long_password_789'
  })
  assert.equal(second_signup.status, 201)

  const sample = {
    norad_id: 10001,
    name: 'JORDAN-SAT-1',
    type: 'earth_observation',
    status: 'active',
    launch_date: '2022-04-15',
    operator_name: 'Jordan Space Agency',
    orbit_type: 'leo',
    ground_station_name: 'Amman Ground Station',
    position: { latitude: 31.9, longitude: 35.85, altitude_km: 545.2, velocity_km_s: 7.65 },
    telemetry: { battery_pct: 86, temperature_c: 21, signal_pct: 94, mode: 'nominal' }
  }

  const invalid = await first.post('/api/satellites').send({
    ...sample,
    position: { ...sample.position, latitude: 91 }
  })
  assert.equal(invalid.status, 400)

  const created = await first.post('/api/satellites').send(sample)
  assert.equal(created.status, 201)
  const id = created.body.satellite.id

  const second_list = await second.get('/api/satellites')
  assert.equal(second_list.status, 200)
  assert.equal(second_list.body.satellites.length, 0)

  const forbidden_edit = await second.patch('/api/satellites/' + id).send({
    ...sample, name: 'changed'
  })
  assert.equal(forbidden_edit.status, 404)

  const edited = await first.patch('/api/satellites/' + id).send({
    ...sample, telemetry: { ...sample.telemetry, battery_pct: 17 }
  })
  assert.equal(edited.status, 200)
  assert.equal(edited.body.satellite.telemetry.battery_pct, 17)

  const forbidden_delete = await second.delete('/api/satellites/' + id)
  assert.equal(forbidden_delete.status, 404)

  const deleted = await first.delete('/api/satellites/' + id)
  assert.equal(deleted.status, 200)

  const logout = await first.post('/api/auth/logout')
  assert.equal(logout.status, 200)
  const after_logout = await first.get('/api/auth/me')
  assert.equal(after_logout.status, 401)
})
