import { Router } from 'express'
import { require_user } from '../auth.js'
import {
  count_satellites, create_sample_satellites, create_satellite,
  delete_satellite, list_satellites, update_satellite
} from '../models/satellite.js'

export const satellite_routes = Router()
satellite_routes.use(require_user)

const uuid_pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function text_field(value, label, max = 80) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text || text.length > max) throw new Error('check ' + label)
  return text
}

function choice(value, options, label) {
  if (!options.includes(value)) throw new Error('check ' + label)
  return value
}

function number_field(value, min, max, label) {
  if (value === '' || value === null || value === undefined) throw new Error('check ' + label)
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) throw new Error('check ' + label)
  return number
}

function satellite_input(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('check satellite fields')
  const norad_id = number_field(body.norad_id, 1, 999999999, 'norad id')
  if (!Number.isInteger(norad_id)) throw new Error('check norad id')
  const launch_date = body.launch_date ? new Date(body.launch_date) : null
  if (launch_date && Number.isNaN(launch_date.getTime())) throw new Error('check launch date')
  return {
    norad_id,
    name: text_field(body.name, 'name'),
    type: choice(body.type, ['earth_observation', 'communication'], 'type'),
    status: choice(body.status, ['active', 'inactive', 'decommissioned'], 'status'),
    launch_date,
    operator_name: text_field(body.operator_name, 'operator'),
    orbit_type: choice(body.orbit_type, ['leo', 'meo', 'geo'], 'orbit'),
    ground_station_name: text_field(body.ground_station_name, 'ground station'),
    position: {
      latitude: number_field(body.position?.latitude, -90, 90, 'latitude'),
      longitude: number_field(body.position?.longitude, -180, 180, 'longitude'),
      altitude_km: number_field(body.position?.altitude_km, 0, 1000000, 'altitude'),
      velocity_km_s: number_field(body.position?.velocity_km_s, 0, 100, 'velocity')
    },
    telemetry: {
      battery_pct: number_field(body.telemetry?.battery_pct, 0, 100, 'battery'),
      temperature_c: number_field(body.telemetry?.temperature_c, -150, 150, 'temperature'),
      signal_pct: number_field(body.telemetry?.signal_pct, 0, 100, 'signal'),
      mode: text_field(body.telemetry?.mode, 'mode', 40)
    }
  }
}

function public_satellite(row) {
  return {
    id: row.id,
    norad_id: row.norad_id,
    name: row.name,
    type: row.type,
    status: row.status,
    launch_date: row.launch_date,
    operator_name: row.operator_name,
    orbit_type: row.orbit_type,
    ground_station_name: row.ground_station_name,
    position: typeof row.position === 'string' ? JSON.parse(row.position) : row.position,
    telemetry: typeof row.telemetry === 'string' ? JSON.parse(row.telemetry) : row.telemetry,
    sample: row.sample,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

satellite_routes.get('/', async (req, res) => {
  const satellites = await list_satellites(req.user.id)
  res.json({ satellites: satellites.map(public_satellite) })
})

satellite_routes.post('/', async (req, res) => {
  let fields
  try {
    fields = satellite_input(req.body)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
  try {
    const satellite = await create_satellite(fields, req.user.id)
    res.status(201).json({ satellite: public_satellite(satellite) })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'norad id is already in your list' })
    throw error
  }
})

satellite_routes.patch('/:id', async (req, res) => {
  if (!uuid_pattern.test(req.params.id)) return res.status(404).json({ error: 'satellite not found' })
  let fields
  try {
    fields = satellite_input(req.body)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
  try {
    const satellite = await update_satellite(req.params.id, req.user.id, fields)
    if (!satellite) return res.status(404).json({ error: 'satellite not found' })
    res.json({ satellite: public_satellite(satellite) })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'norad id is already in your list' })
    throw error
  }
})

satellite_routes.delete('/:id', async (req, res) => {
  if (!uuid_pattern.test(req.params.id)) return res.status(404).json({ error: 'satellite not found' })
  const deleted = await delete_satellite(req.params.id, req.user.id)
  if (!deleted) return res.status(404).json({ error: 'satellite not found' })
  res.json({ ok: true })
})

satellite_routes.post('/sample', async (req, res) => {
  const count = await count_satellites(req.user.id)
  if (count) return res.status(409).json({ error: 'sample data can only be added to an empty list' })
  const samples = [
    {
      norad_id: 10001, name: 'JORDAN-SAT-1', type: 'earth_observation', status: 'active',
      launch_date: new Date('2022-04-15'), operator_name: 'Jordan Space Agency', orbit_type: 'leo',
      ground_station_name: 'Amman Ground Station',
      position: { latitude: 31.9, longitude: 35.85, altitude_km: 545.2, velocity_km_s: 7.65 },
      telemetry: { battery_pct: 86, temperature_c: 21, signal_pct: 94, mode: 'nominal' }
    },
    {
      norad_id: 10002, name: 'JORDAN-SAT-2', type: 'communication', status: 'active',
      launch_date: new Date('2023-08-20'), operator_name: 'Jordan Space Agency', orbit_type: 'geo',
      ground_station_name: 'Amman Ground Station',
      position: { latitude: 0, longitude: 35.85, altitude_km: 35786, velocity_km_s: 3.07 },
      telemetry: { battery_pct: 63, temperature_c: 26, signal_pct: 88, mode: 'nominal' }
    }
  ]
  try {
    const satellites = await create_sample_satellites(samples, req.user.id)
    res.status(201).json({ satellites: satellites.map(public_satellite) })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'sample data is already in your list' })
    throw error
  }
})
