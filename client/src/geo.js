export const earth_radius = 1.75

export function coords_to_point(latitude, longitude, radius = earth_radius) {
  const lat = Number(latitude) * Math.PI / 180
  const lon = Number(longitude) * Math.PI / 180
  return [
    -radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.cos(lon)
  ]
}

export function point_to_coords(point) {
  const x = point.x ?? point[0]
  const y = point.y ?? point[1]
  const z = point.z ?? point[2]
  const radius = Math.hypot(x, y, z)
  return {
    latitude: Number((Math.asin(y / radius) * 180 / Math.PI).toFixed(4)),
    longitude: Number((Math.atan2(-x, -z) * 180 / Math.PI).toFixed(4))
  }
}