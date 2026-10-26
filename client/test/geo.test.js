import assert from 'node:assert/strict'
import test from 'node:test'
import { coords_to_point, point_to_coords } from '../src/geo.js'

test('cardinal coordinates point to the earth model axes', () => {
  const axis = value => Math.abs(value) < 1e-9 ? 0 : Math.round(value)
  assert.deepEqual(coords_to_point(0, 0, 1).map(axis), [0, 0, -1])
  assert.deepEqual(coords_to_point(0, 90, 1).map(axis), [-1, 0, 0])
  assert.deepEqual(coords_to_point(90, 0, 1).map(axis), [0, 1, 0])
})

test('a globe point returns the saved coordinates', () => {
  for (const [latitude, longitude] of [[0, 0], [31.9539, 35.9106], [-33.8688, 151.2093], [65, -135]]) {
    const point = coords_to_point(latitude, longitude, 1.75)
    assert.deepEqual(point_to_coords(point), { latitude, longitude })
  }
})

