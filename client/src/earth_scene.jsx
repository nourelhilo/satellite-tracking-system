import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { Box3, Vector3 } from 'three'
import { coords_to_point, earth_radius, point_to_coords } from './geo.js'

function Model({ url, size, position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const gltf = useLoader(GLTFLoader, url, loader => {
    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    loader.setDRACOLoader(draco)
  })
  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new Box3().setFromObject(scene)
    const center = box.getCenter(new Vector3())
    const dimensions = box.getSize(new Vector3())
    const scale = size / Math.max(dimensions.x, dimensions.y, dimensions.z)
    return { scene, scale, center }
  }, [gltf, size])

  return (
    <group position={position} rotation={rotation}>
      <primitive
        object={prepared.scene}
        scale={prepared.scale}
        position={[
          -prepared.center.x * prepared.scale,
          -prepared.center.y * prepared.scale,
          -prepared.center.z * prepared.scale
        ]}
      />
    </group>
  )
}

function SatelliteMarker({ satellite, selected, on_select }) {
  const surface = coords_to_point(satellite.position.latitude, satellite.position.longitude, earth_radius + 0.045)
  const satellite_point = coords_to_point(satellite.position.latitude, satellite.position.longitude, earth_radius + 0.4)

  return (
    <group onClick={event => { event.stopPropagation(); on_select(satellite.id) }}>
      <mesh position={surface}>
        <sphereGeometry args={[selected ? 0.07 : 0.045, 16, 16]} />
        <meshBasicMaterial color={selected ? '#8be5f3' : '#ffd9a1'} />
      </mesh>
      {selected && <Line points={[surface, satellite_point]} color="#8be5f3" lineWidth={1.5} />}
      {selected && <Model url="/models/landsat-8.glb" size={0.95} position={satellite_point} rotation={[Math.PI / 4, Math.PI / 4, 0]} />}
    </group>
  )
}

function Scene({ satellites, selected, on_select, on_pick }) {
  const globe = useRef()
  const controls = useRef()
  const { camera, size } = useThree()

  useEffect(() => {
    const aspect = size.width / size.height
    camera.position.set(0, 0.1, Math.max(6, 5.4 / aspect))
    camera.updateProjectionMatrix()
    controls.current?.saveState()
  }, [camera, size.width, size.height])

  useEffect(() => {
    controls.current?.reset()
  }, [selected?.id])

  useFrame((state, delta) => {
    if (!globe.current) return
    const target_x = selected ? Number(selected.position.latitude) * Math.PI / 180 - 0.15 : 0
    const target_y = selected ? Math.PI - Number(selected.position.longitude) * Math.PI / 180 + 0.25 : Math.PI
    const blend = 1 - Math.exp(-4 * delta)
    globe.current.rotation.x += (target_x - globe.current.rotation.x) * blend
    const difference = Math.atan2(Math.sin(target_y - globe.current.rotation.y), Math.cos(target_y - globe.current.rotation.y))
    globe.current.rotation.y += difference * blend
  })

  function pick(event) {
    event.stopPropagation()
    const local = globe.current.worldToLocal(event.point.clone())
    on_pick(point_to_coords(local))
  }

  return (
    <>
      <ambientLight intensity={2.2} />
      <directionalLight position={[4, 3, 5]} intensity={2.8} />
      <group ref={globe} rotation={[0, Math.PI, 0]}>
        <group onClick={pick}>
          <Model url="/models/earth-clouds.glb" size={earth_radius * 2} />
        </group>
        {satellites.map(satellite => (
          <SatelliteMarker
            key={satellite.id}
            satellite={satellite}
            selected={selected?.id === satellite.id}
            on_select={on_select}
          />
        ))}
      </group>
      <OrbitControls ref={controls} enablePan={false} enableZoom={false} minPolarAngle={0.4} maxPolarAngle={2.8} />
    </>
  )
}

class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return <div className="scene-fallback">3d view is unavailable. your satellite records are still saved.</div>
    return this.props.children
  }
}

export default function EarthScene({ satellites, selected, on_select, on_pick }) {
  return (
    <div className="earth-scene" aria-label="3d earth showing saved satellite coordinates">
      <SceneBoundary>
        <Canvas camera={{ position: [0, 0.1, 6], fov: 42 }} dpr={[1, 1.7]} fallback={<div className="scene-fallback">3d preview unavailable</div>}>
          <Suspense fallback={null}>
            <Scene satellites={satellites} selected={selected} on_select={on_select} on_pick={on_pick} />
          </Suspense>
        </Canvas>
      </SceneBoundary>
    </div>
  )
}

