export async function api(path, options = {}) {
  const response = await fetch('/api' + path, {
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...options.headers },
    ...options
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'request failed')
  return data
}