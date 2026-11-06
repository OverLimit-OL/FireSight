import { InstrumentEnvironment, WindowFrame, OpticalPort } from './InstrumentDetails'
import { useMemo, useEffect } from 'react'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ThreeEvent } from '@react-three/fiber'
import { AdditiveBlending, FrontSide, Vector3, Vector2, CatmullRomCurve3 } from 'three'
import type { ComponentId } from './apparatus'
type Props = {
  selected: string
  onSelect: (id: string) => void
  step: number
  apparatusVisible: boolean
  overlays: boolean
  combustion: boolean
  exposure: number
}
function Block({
  position,
  size,
  color = '#8c9ca7',
  selected,
  onClick,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color?: string
  selected?: boolean
  onClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const [w, h, d] = size
  const geometry = useMemo(
    () => new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.2),
    [w, h, d],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} position={position} onClick={onClick} castShadow receiveShadow>
      <meshStandardMaterial
        color={selected ? '#d7b686' : color}
        emissive={selected ? '#664822' : '#000000'}
        emissiveIntensity={0.18}
        metalness={0.72}
        roughness={0.29}
      />
    </mesh>
  )
}
const flameProfile = new CatmullRomCurve3([
  new Vector3(0, 0, 0),
  new Vector3(0.55, 0.06, 0),
  new Vector3(0.93, 0.36, 0),
  new Vector3(0.82, 0.85, 0),
  new Vector3(0.48, 1.35, 0),
  new Vector3(0.08, 1.8, 0),
  new Vector3(0, 1.87, 0),
])
  .getPoints(48)
  .map((p) => new Vector2(Math.max(0, p.x), p.y))
function Flame({
  step,
  selected,
  onClick,
}: {
  step: number
  selected: boolean
  onClick: (e: ThreeEvent<MouseEvent>) => void
}) {
  // Discrete authored poses share the timeline's frame. No independent animation clock.
  const height = 0.75 + Math.sin(step * 0.6) * 0.16
  return (
    <group position={[0, 0.12, 0]} onClick={onClick} rotation={[0, 0, -0.17 + step * 0.015]}>
      <mesh scale={[0.43, height * 0.72, 0.26]}>
        <latheGeometry args={[flameProfile, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={FrontSide}
          blending={AdditiveBlending}
          toneMapped={false}
          uniforms={{ highlight: { value: selected ? 1 : 0 } }}
          vertexShader={`varying vec3 vNormal; varying vec3 vEye; varying float vHeight;
            void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vEye=normalize(-p.xyz);vHeight=position.y/1.87;gl_Position=projectionMatrix*p;}`}
          fragmentShader={`varying vec3 vNormal; varying vec3 vEye; varying float vHeight; uniform float highlight;
            void main(){float edge=pow(1.0-abs(dot(normalize(vNormal),normalize(vEye))),1.6);
            vec3 base=mix(vec3(0.12,0.28,0.65),vec3(1.0,0.43,0.065),smoothstep(0.02,0.28,vHeight));
            base=mix(base,vec3(1.0,0.72,0.25),edge*0.65);
            float a=(0.09+edge*0.86)*smoothstep(1.0,0.8,vHeight);
            gl_FragColor=vec4(base+highlight*0.12,a);}`}
        />
      </mesh>
      <pointLight color="#ff9c3f" intensity={1.4} distance={3} position={[0, 0.5, 0.3]} />
    </group>
  )
}
export default function ApparatusScene({
  selected,
  onSelect,
  step,
  apparatusVisible,
  overlays,
  combustion,
  exposure,
}: Props) {
  const click = (id: ComponentId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(id)
  }
  return (
    <group>
      <InstrumentEnvironment />
      <ambientLight intensity={0.35 * exposure} />
      <hemisphereLight args={['#e6f5ff', '#1a2630', 1.1 * exposure]} />
      <directionalLight
        position={[2, 7, 4]}
        intensity={2 * exposure}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-4, 2, -2]} intensity={1.5 * exposure} color="#d0e0ec" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#10151c" roughness={0.9} metalness={0} envMapIntensity={0} />
      </mesh>
      {overlays ? (
        <gridHelper args={[12, 24, '#29343f', '#1a242e']} position={[0, -1.39, 0]} />
      ) : null}
      {apparatusVisible ? (
        <group>
          <WindowFrame selected={selected === 'chamber'} onClick={click('chamber')} />
          {[-2.66, 2.66].map((x) => (
            <OpticalPort key={x} x={x} onClick={click('inlet')} />
          ))}
          {[-2.25, 2.25].map((x) =>
            [-1, 1].map((z) => (
              <group key={`${x}-${z}`} onClick={click('chamber')}>
                <mesh position={[x, -1.34, z]} castShadow>
                  <cylinderGeometry args={[0.16, 0.19, 0.16, 32]} />
                  <meshStandardMaterial color="#25323b" roughness={0.85} />
                </mesh>
                <mesh position={[x, -0.995, z]}>
                  <cylinderGeometry args={[0.065, 0.065, 0.025, 12]} />
                  <meshStandardMaterial color="#bac5c9" metalness={0.9} roughness={0.23} />
                </mesh>
              </group>
            )),
          )}
          <Block position={[0, -0.995, 0]} size={[4.85, 0.035, 2.35]} color="#334853" />
          {[-1.08, 1.08].map((z) => (
            <Block key={z} position={[0, -0.965, z]} size={[4.65, 0.025, 0.025]} color="#a6b6bf" />
          ))}
          <Block
            position={[0, -1.16, 0]}
            size={[5.6, 0.28, 3]}
            color="#647984"
            selected={selected === 'chamber'}
            onClick={click('chamber')}
          />
          {[-2.55, 2.55].map((x) => (
            <group key={x}>
              {[-1.28, 1.28].map((z) => (
                <Block
                  key={z}
                  position={[x, 0.2, z]}
                  size={[0.14, 2.6, 0.14]}
                  selected={selected === 'chamber'}
                  onClick={click('chamber')}
                />
              ))}
              <Block position={[x, 1.5, 0]} size={[0.19, 0.16, 2.7]} />
            </group>
          ))}
          {[-1.28, 1.28].map((z) => (
            <Block key={z} position={[0, 1.5, z]} size={[5.3, 0.16, 0.14]} />
          ))}
          <Block
            position={[0, 0.2, -1.3]}
            size={[5.2, 2.5, 0.06]}
            color="#25303b"
            onClick={click('chamber')}
          />
          {[-2.57, 2.57].map((x) => (
            <group key={x} onClick={click('inlet')}>
              <Block
                position={[x, 0.2, 0]}
                size={[0.1, 2.4, 2.5]}
                color="#536a77"
                selected={selected === 'inlet'}
              />
              {Array.from({ length: 9 }, (_, i) => (
                <Block
                  key={i}
                  position={[x + (x < 0 ? -0.06 : 0.06), -0.8 + i * 0.24, 0]}
                  size={[0.05, 0.04, 2.2]}
                  color="#172b38"
                />
              ))}
            </group>
          ))}
          <group onClick={click('holder')}>
            <Block
              position={[0, -0.96, 0]}
              size={[1.6, 0.13, 1]}
              selected={selected === 'holder'}
            />
            {[-0.55, 0.55].map((x) => (
              <Block
                key={x}
                position={[x, -0.5, 0]}
                size={[0.12, 0.85, 0.18]}
                selected={selected === 'holder'}
              />
            ))}
          </group>
          {[-0.55, 0.55].map((x) => (
            <mesh key={x} position={[x, -0.5, 0]} castShadow onClick={click('holder')}>
              <cylinderGeometry args={[0.085, 0.085, 0.8, 32]} />
              <meshStandardMaterial
                color={selected === 'holder' ? '#d7b686' : '#a7b3ba'}
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
          ))}
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={click('sample')}>
            <planeGeometry args={[0.96, 0.6]} />
            <meshStandardMaterial color="#d2c6ad" roughness={0.95} />
          </mesh>
          <group onClick={click('camera')}>
            <Block position={[1.8, -0.7, 1]} size={[0.12, 0.9, 0.12]} />
            <Block
              position={[1.8, -0.15, 1]}
              size={[0.55, 0.35, 0.4]}
              color="#263944"
              selected={selected === 'camera'}
            />
            {[1.4, 1.45, 1.5].map((x) => (
              <mesh key={x} position={[x, -0.15, 1]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.14, 0.14, 0.035, 40]} />
                <meshStandardMaterial color="#81929f" metalness={0.9} roughness={0.21} />
              </mesh>
            ))}
            <mesh position={[1.37, -0.15, 1]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.105, 40]} />
              <meshPhysicalMaterial color="#284953" metalness={0.6} roughness={0.1} clearcoat={1} />
            </mesh>
            <mesh position={[1.48, -0.15, 1]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.12, 0.12, 0.25, 24]} />
              <meshStandardMaterial color="#14212b" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>
      ) : null}
      <Block
        position={[0, -0.02, 0]}
        size={[1.05, 0.12, 0.66]}
        color="#c7bba1"
        selected={selected === 'sample'}
        onClick={click('sample')}
      />
      {combustion ? (
        <Flame step={step} selected={selected === 'flame'} onClick={click('flame')} />
      ) : null}
      {overlays ? (
        <group>
          {[-0.65, 0.65].map((z) => (
            <arrowHelper
              key={z}
              args={[new Vector3(1, 0, 0), new Vector3(-2, 0.4, z), 1.3, '#8abdc9', 0.18, 0.1]}
            />
          ))}
          <axesHelper args={[1]} position={[-2, -1, 1.7]} />
        </group>
      ) : null}
    </group>
  )
}
