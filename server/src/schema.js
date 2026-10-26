import { query } from './db.js'

export async function setup_database({ with_security = true } = {}) {
  await query('create schema if not exists orbit_desk')
  await query(`
    create table if not exists orbit_desk.users (
      id uuid primary key,
      name text not null,
      email text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now()
    )
  `)
  await query(`
    create table if not exists orbit_desk.satellites (
      id uuid primary key,
      owner_id uuid not null references orbit_desk.users(id) on delete cascade,
      norad_id integer not null,
      name text not null,
      type text not null,
      status text not null,
      launch_date date,
      operator_name text not null,
      orbit_type text not null,
      ground_station_name text not null,
      position jsonb not null,
      telemetry jsonb not null,
      sample boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (owner_id, norad_id)
    )
  `)
  await query('create index if not exists satellites_owner_name on orbit_desk.satellites (owner_id, name)')
  if (with_security) {
    await query('alter table orbit_desk.users enable row level security')
    await query('alter table orbit_desk.satellites enable row level security')
    await query('revoke all on schema orbit_desk from public')
    await query('revoke all on all tables in schema orbit_desk from public')
  }
}
