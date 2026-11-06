import { useEffect, useMemo, useRef } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import {
  Color,
  Fog,
  ExtrudeGeometry,
  Shape,
  Path,
  PMREMGenerator,
  Object3D,
  type InstancedMesh,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/** Procedural studio reflections. No external images or historical apparatus assets. */
export function InstrumentEnvironment() {
  const { gl, scene, invalidate } = useThree()
  useEffect(() => {
    const generator = new PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = generator.fromScene(room, 0.04)
    const intensity = scene.environmentIntensity
    const previous = scene.environment
    const background = scene.background
    const fog = scene.fog
    // Three.js owns these mutable scene properties; this effect restores them on cleanup.
    // oxlint-disable-next-line react/immutability
    scene.background = new Color('#0d1219')
    scene.fog = new Fog('#0d1219', 12, 28)
    scene.environment = target.texture
    scene.environmentIntensity = 0.65
    invalidate()
    return () => {
      scene.environmentIntensity = intensity
      scene.environment = previous
      scene.background = background
      scene.fog = fog
      target.dispose()
      room.dispose()
      generator.dispose()
    }
  }, [gl, scene, invalidate])
  return null
}
function roundedPath(path: Shape | Path, x: number, y: number, w: number, h: number, r: number) {
  path.moveTo(x + r, y)
  path.lineTo(x + w - r, y)
  path.quadraticCurveTo(x + w, y, x + w, y + r)
  path.lineTo(x + w, y + h - r)
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  path.lineTo(x + r, y + h)
  path.quadraticCurveTo(x, y + h, x, y + h - r)
  path.lineTo(x, y + r)
  path.quadraticCurveTo(x, y, x + r, y)
}
export function WindowFrame({
  selected,
  onClick,
}: {
  selected: boolean
  onClick: (e: ThreeEvent<MouseEvent>) => void
}) {
  const geometry = useMemo(() => {
    const shape = new Shape()
    roundedPath(shape, -2.66, -1.12, 5.32, 2.78, 0.2)
    const hole = new Path()
    roundedPath(hole, -2.4, -0.88, 4.8, 2.3, 0.15)
    shape.holes.push(hole)
    return new ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      curveSegments: 12,
    })
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const bolts = useRef<InstancedMesh>(null)
  const positions = useMemo(
    () => [
      ...Array.from({ length: 9 }, (_, i) => [-2.5 + i * 0.625, 1.55, 1.44]),
      ...Array.from({ length: 9 }, (_, i) => [-2.5 + i * 0.625, -1.02, 1.44]),
      ...[-2.54, 2.54].flatMap((x) => [-0.6, 0, 0.6, 1.1].map((y) => [x, y, 1.44])),
    ],
    [],
  )
  useEffect(() => {
    const object = new Object3D()
    positions.forEach((p, i) => {
      object.position.set(p[0], p[1], p[2])
      object.rotation.x = Math.PI / 2
      object.updateMatrix()
      bolts.current?.setMatrixAt(i, object.matrix)
    })
    if (bolts.current) bolts.current.instanceMatrix.needsUpdate = true
  }, [positions])
  return (
    <group onClick={onClick}>
      <mesh geometry={geometry} position={[0, 0, 1.27]} castShadow receiveShadow>
        <meshStandardMaterial
          color={selected ? '#d3a371' : '#9ba7ae'}
          metalness={0.88}
          roughness={0.24}
        />
      </mesh>
      <mesh geometry={geometry} position={[0, 0, 1.22]} scale={[0.97, 0.97, 1]}>
        <meshStandardMaterial color="#1e252b" metalness={0.3} roughness={0.6} />
      </mesh>
      <instancedMesh ref={bolts} args={[undefined, undefined, positions.length]}>
        <cylinderGeometry args={[0.047, 0.047, 0.035, 6]} />
        <meshStandardMaterial color="#bac3cb" metalness={0.95} roughness={0.22} />
      </instancedMesh>
      {/* Open inspection plane keeps the specimen unobscured; glazing is limited to the sides. */}
      {[-2.5, 2.5].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.4, 2.35]} />
          <meshPhysicalMaterial
            color="#b4c8d1"
            transparent
            opacity={0.1}
            metalness={0.1}
            roughness={0.08}
            depthWrite={false}
            side={2}
          />
        </mesh>
      ))}
    </group>
  )
}
export function OpticalPort({
  x,
  onClick,
}: {
  x: number
  onClick: (e: ThreeEvent<MouseEvent>) => void
}) {
  return (
    <group position={[x, 0.35, 0]} rotation={[0, Math.PI / 2, 0]} onClick={onClick}>
      <mesh castShadow>
        <torusGeometry args={[0.46, 0.11, 12, 48]} />
        <meshStandardMaterial color="#a3afb8" metalness={0.9} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <circleGeometry args={[0.36, 48]} />
        <meshPhysicalMaterial color="#18272e" metalness={0.5} roughness={0.13} clearcoat={1} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[Math.cos((i * Math.PI) / 4) * 0.47, Math.sin((i * Math.PI) / 4) * 0.47, 0.1]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.06, 6]} />
          <meshStandardMaterial color="#c3c8ce" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}
