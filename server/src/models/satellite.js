import { randomUUID } from 'node:crypto'
import { query } from '../db.js'

const columns = 'id, owner_id, norad_id, name, type, status, launch_date, operator_name, orbit_type, ground_station_name, position, telemetry, sample'

function values_of(fields, owner_id, sample = false) {
  return [
    randomUUID(), owner_id, fields.norad_id, fields.name, fields.type, fields.status,
    fields.launch_date, fields.operator_name, fields.orbit_type, fields.ground_station_name,
    JSON.stringify(fields.position), JSON.stringify(fields.telemetry), sample
  ]
}

function placeholders(start) {
  return '(' + Array.from({ length: 13 }, (_, index) => '$' + (start + index)).join(', ') + ')'
}

export async function list_satellites(owner_id) {
  const result = await query('select * from orbit_desk.satellites where owner_id = $1 order by name', [owner_id])
  return result.rows
}

export async function create_satellite(fields, owner_id) {
  const result = await query(
    `insert into orbit_desk.satellites (${columns}) values ${placeholders(1)} returning *`,
    values_of(fields, owner_id)
  )
  return result.rows[0]
}

export async function update_satellite(id, owner_id, fields) {
  const result = await query(`
    update orbit_desk.satellites set
      norad_id = $3, name = $4, type = $5, status = $6, launch_date = $7,
      operator_name = $8, orbit_type = $9, ground_station_name = $10,
      position = $11, telemetry = $12, updated_at = now()
    where id = $1 and owner_id = $2 returning *
  `, [
    id, owner_id, fields.norad_id, fields.name, fields.type, fields.status,
    fields.launch_date, fields.operator_name, fields.orbit_type, fields.ground_station_name,
    JSON.stringify(fields.position), JSON.stringify(fields.telemetry)
  ])
  return result.rows[0]
}

export async function delete_satellite(id, owner_id) {
  const result = await query('delete from orbit_desk.satellites where id = $1 and owner_id = $2 returning id', [id, owner_id])
  return Boolean(result.rows.length)
}

export async function count_satellites(owner_id) {
  const result = await query('select count(*)::int as total from orbit_desk.satellites where owner_id = $1', [owner_id])
  return result.rows[0].total
}

export async function create_sample_satellites(samples, owner_id) {
  const values = samples.flatMap(sample => values_of(sample, owner_id, true))
  const result = await query(
    `insert into orbit_desk.satellites (${columns}) values ${placeholders(1)}, ${placeholders(14)} returning *`,
    values
  )
  return result.rows
}
