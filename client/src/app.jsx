import { useEffect, useState } from 'react'
import { api } from './api.js'
import EarthScene from './earth_scene.jsx'

const empty_satellite = {
  norad_id: '',
  name: '',
  type: 'earth_observation',
  status: 'active',
  launch_date: '',
  operator_name: 'independent',
  orbit_type: 'leo',
  ground_station_name: 'not assigned',
  position: { latitude: 0, longitude: 0, altitude_km: 500, velocity_km_s: 7.5 },
  telemetry: { battery_pct: 100, temperature_c: 20, signal_pct: 100, mode: 'nominal' }
}

function Auth({ on_auth }) {
  const [mode, set_mode] = useState('login')
  const [name, set_name] = useState('')
  const [email, set_email] = useState('')
  const [password, set_password] = useState('')
  const [error, set_error] = useState('')
  const [busy, set_busy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    set_error('')
    set_busy(true)
    try {
      const result = await api('/auth/' + mode, {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      })
      on_auth(result.user)
    } catch (issue) {
      set_error(issue.message)
    } finally {
      set_busy(false)
    }
  }

  function switch_mode() {
    set_mode(current => current === 'login' ? 'signup' : 'login')
    set_error('')
    set_password('')
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>{mode === 'login' ? 'log in' : 'sign up'}</h1>
        <form onSubmit={submit}>
          {mode === 'signup' && <label>name<input value={name} onChange={event => set_name(event.target.value)} minLength="2" maxLength="60" autoComplete="name" required /></label>}
          <label>email<input type="email" value={email} onChange={event => set_email(event.target.value)} autoComplete="email" required /></label>
          <label>password<input type="password" value={password} onChange={event => set_password(event.target.value)} minLength={mode === 'signup' ? 10 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>
          {mode === 'signup' && <span className="hint">use at least 10 characters.</span>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button primary full" type="submit" disabled={busy}>{busy ? 'please wait...' : mode === 'login' ? 'log in' : 'sign up'}</button>
        </form>
        <p className="switch-line">
          {mode === 'login' ? 'new here?' : 'already have an account?'}{' '}
          <button className="text-button" type="button" onClick={switch_mode}>{mode === 'login' ? 'sign up' : 'log in'}</button>
        </p>
      </section>
    </main>
  )
}

function SatelliteForm({ initial, picked_position, on_close, on_save, busy, error }) {
  const [draft, set_draft] = useState(() => initial
    ? { ...initial, launch_date: initial.launch_date?.slice(0, 10) || '' }
    : { ...structuredClone(empty_satellite), position: { ...empty_satellite.position, ...picked_position } })

  function change(path, value) {
    const [group, field] = path.split('.')
    if (field) {
      set_draft(current => ({ ...current, [group]: { ...current[group], [field]: value } }))
    } else {
      set_draft(current => ({ ...current, [group]: value }))
    }
  }

  function field(title, path, type = 'text', extra = {}) {
    const parts = path.split('.')
    const value = parts.length === 2 ? draft[parts[0]][parts[1]] : draft[path]
    return (
      <label key={path}>{title}
        <input type={type} value={value ?? ''} onChange={event => change(path, event.target.value)} required={extra.required !== false} min={extra.min} max={extra.max} step={extra.step} />
      </label>
    )
  }

  return (
    <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) on_close() }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modal-head">
          <h2 id="form-title">{initial ? 'edit satellite' : 'add satellite'}</h2>
          <button className="icon-button" type="button" onClick={on_close} aria-label="close">×</button>
        </div>
        <form onSubmit={event => { event.preventDefault(); on_save(draft) }}>
          <div className="form-grid">
            {field('name', 'name')}
            {field('norad id', 'norad_id', 'number', { min: 1, step: 1 })}
            {field('latitude', 'position.latitude', 'number', { min: -90, max: 90, step: 'any' })}
            {field('longitude', 'position.longitude', 'number', { min: -180, max: 180, step: 'any' })}
          </div>
          <details className="more-fields">
            <summary>more details</summary>
            <div className="form-grid">
              <label>type
                <select value={draft.type} onChange={event => change('type', event.target.value)}>
                  <option value="earth_observation">earth observation</option>
                  <option value="communication">communication</option>
                </select>
              </label>
              <label>status
                <select value={draft.status} onChange={event => change('status', event.target.value)}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="decommissioned">decommissioned</option>
                </select>
              </label>
              {field('operator', 'operator_name')}
              {field('ground station', 'ground_station_name')}
              <label>orbit
                <select value={draft.orbit_type} onChange={event => change('orbit_type', event.target.value)}>
                  <option value="leo">leo</option>
                  <option value="meo">meo</option>
                  <option value="geo">geo</option>
                </select>
              </label>
              {field('launch date', 'launch_date', 'date', { required: false })}
              {field('altitude (km)', 'position.altitude_km', 'number', { min: 0, step: 'any' })}
              {field('velocity (km/s)', 'position.velocity_km_s', 'number', { min: 0, step: 'any' })}
              {field('battery (%)', 'telemetry.battery_pct', 'number', { min: 0, max: 100, step: 'any' })}
              {field('temperature (°c)', 'telemetry.temperature_c', 'number', { min: -150, max: 150, step: 'any' })}
              {field('signal (%)', 'telemetry.signal_pct', 'number', { min: 0, max: 100, step: 'any' })}
              {field('mode', 'telemetry.mode')}
            </div>
          </details>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="button secondary" type="button" onClick={on_close}>cancel</button>
            <button className="button primary" type="submit" disabled={busy}>{busy ? 'saving...' : 'save satellite'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ManagePanel({ satellites, selected, loading, busy, error, on_close, on_select, on_add, on_edit, on_delete, on_samples }) {
  return (
    <div className="drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) on_close() }}>
      <aside className="manage-panel" role="dialog" aria-modal="true" aria-labelledby="manage-title">
        <div className="drawer-head">
          <div>
            <h2 id="manage-title">manage satellites</h2>
            <p>{satellites.length} saved</p>
          </div>
          <button className="icon-button" type="button" onClick={on_close} aria-label="close">×</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading ? <p className="empty-list">loading...</p> : satellites.length === 0 ? (
          <div className="empty-list">
            <p>no satellites yet.</p>
            <button className="button primary" type="button" onClick={on_add}>add satellite</button>
            <button className="text-button" type="button" onClick={on_samples} disabled={busy}>load sample satellites</button>
          </div>
        ) : (
          <ul className="satellite-list">
            {satellites.map(item => (
              <li key={item.id} className={selected?.id === item.id ? 'active-item' : ''}>
                <button className="satellite-select" type="button" onClick={() => { on_select(item.id); on_close() }}>
                  <strong>{item.name}</strong>
                  <span>{item.position.latitude}°, {item.position.longitude}°</span>
                </button>
                <div className="item-actions">
                  <button className="text-button" type="button" onClick={() => on_edit(item)}>edit</button>
                  <button className="text-button danger-text" type="button" onClick={() => on_delete(item)} disabled={busy}>delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

function Dashboard({ on_logout }) {
  const [satellites, set_satellites] = useState([])
  const [selected_id, set_selected_id] = useState(null)
  const [form_item, set_form_item] = useState(null)
  const [picked_position, set_picked_position] = useState(null)
  const [show_form, set_show_form] = useState(false)
  const [show_manage, set_show_manage] = useState(false)
  const [error, set_error] = useState('')
  const [form_error, set_form_error] = useState('')
  const [busy, set_busy] = useState(false)
  const [loading, set_loading] = useState(true)

  useEffect(() => {
    api('/satellites')
      .then(result => set_satellites(result.satellites))
      .catch(issue => set_error(issue.message))
      .finally(() => set_loading(false))
  }, [])

  const selected = satellites.find(item => item.id === selected_id) || satellites[0]

  function open_form(item = null, coords = null) {
    set_form_item(item)
    set_picked_position(coords)
    set_form_error('')
    set_show_manage(false)
    set_show_form(true)
  }

  async function save_satellite(draft) {
    set_form_error('')
    set_busy(true)
    try {
      const result = await api('/satellites' + (form_item ? '/' + form_item.id : ''), {
        method: form_item ? 'PATCH' : 'POST',
        body: JSON.stringify(draft)
      })
      set_satellites(current => {
        const next = form_item ? current.map(item => item.id === result.satellite.id ? result.satellite : item) : [...current, result.satellite]
        return next.sort((a, b) => a.name.localeCompare(b.name))
      })
      set_selected_id(result.satellite.id)
      set_show_form(false)
    } catch (issue) {
      set_form_error(issue.message)
    } finally {
      set_busy(false)
    }
  }

  async function add_samples() {
    set_error('')
    set_busy(true)
    try {
      const result = await api('/satellites/sample', { method: 'POST' })
      set_satellites(result.satellites)
      set_selected_id(result.satellites[0]?.id)
      set_show_manage(false)
    } catch (issue) {
      set_error(issue.message)
    } finally {
      set_busy(false)
    }
  }

  async function delete_satellite(item) {
    if (!window.confirm('delete ' + item.name + '?')) return
    set_error('')
    set_busy(true)
    try {
      await api('/satellites/' + item.id, { method: 'DELETE' })
      set_satellites(current => current.filter(saved => saved.id !== item.id))
      if (selected_id === item.id) set_selected_id(null)
    } catch (issue) {
      set_error(issue.message)
    } finally {
      set_busy(false)
    }
  }

  async function log_out() {
    set_error('')
    try {
      await api('/auth/logout', { method: 'POST' })
      on_logout()
    } catch (issue) {
      set_error(issue.message)
    }
  }

  return (
    <main className="workspace">
      <EarthScene satellites={satellites} selected={selected} on_select={set_selected_id} on_pick={coords => open_form(null, coords)} />
      
        <nav className="workspace-actions" aria-label="satellite actions">
          <button className="button primary" type="button" onClick={() => open_form()}>add satellite</button>
          <button className="button secondary" type="button" onClick={() => set_show_manage(true)}>manage satellites</button>
          <button className="button secondary" type="button" onClick={log_out}>log out</button>
        </nav>
      
      {selected && <div className="satellite-caption"><strong>{selected.name}</strong><span>{selected.position.latitude}° · {selected.position.longitude}°</span></div>}
      <p className="globe-hint">drag to rotate · click earth to add</p>
      {error && <p className="page-error" role="alert">{error}</p>}
      {show_manage && <ManagePanel satellites={satellites} selected={selected} loading={loading} busy={busy} error={error} on_close={() => set_show_manage(false)} on_select={set_selected_id} on_add={() => open_form()} on_edit={open_form} on_delete={delete_satellite} on_samples={add_samples} />}
      {show_form && <SatelliteForm initial={form_item} picked_position={picked_position} on_close={() => set_show_form(false)} on_save={save_satellite} busy={busy} error={form_error} />}
    </main>
  )
}

export default function App() {
  const [user, set_user] = useState(null)
  const [checking, set_checking] = useState(true)

  useEffect(() => {
    api('/auth/me').then(result => set_user(result.user)).catch(() => {}).finally(() => set_checking(false))
  }, [])

  if (checking) return <div className="loading-screen">loading...</div>
  return user ? <Dashboard on_logout={() => set_user(null)} /> : <Auth on_auth={set_user} />
}




