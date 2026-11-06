import { MOUSE } from 'three'
import { useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { SimulationFrame } from '@/types/simulation'
import { Button } from '@/components/ui/button'
import ApparatusScene from './ApparatusScene'
function Controls({
  preset,
  zoom,
  pan,
  focusRequest,
  focusPoint,
  cameraReset,
  panTool,
}: {
  preset: number
  zoom: number
  pan: [number, number]
  focusRequest: number
  focusPoint: [number, number, number]
  panTool: boolean
  cameraReset: number
}) {
  const { camera, gl, invalidate, size } = useThree()
  const [panX, panY] = pan
  const [focusX, focusY, focusZ] = focusPoint
  const fitScale = Math.max(1, 1.05 / (Math.max(1, size.width) / Math.max(1, size.height)))
  const orbit = useRef<OrbitControls | null>(null)
  const previousFit = useRef(fitScale)
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement)
    controls.enableDamping = false
    controls.minDistance = 2
    controls.maxDistance = 22
    controls.maxPolarAngle = Math.PI * 0.82
    const requestFrame = () => invalidate()
    controls.addEventListener('change', requestFrame)
    orbit.current = controls
    return () => {
      controls.removeEventListener('change', requestFrame)
      controls.dispose()
      orbit.current = null
    }
  }, [camera, gl, invalidate])
  useEffect(() => {
    if (orbit.current) orbit.current.mouseButtons.LEFT = panTool ? MOUSE.PAN : MOUSE.ROTATE
  }, [panTool])
  useEffect(() => {
    camera.position.set(
      ...((preset % 3 === 0 ? [3.8, 1.8, 7.2] : preset % 3 === 1 ? [0, 0, 6] : [6, 0, 0]) as [
        number,
        number,
        number,
      ]),
    )
    const requestedFit = Math.max(
      1,
      1.05 / (Math.max(1, gl.domElement.clientWidth) / Math.max(1, gl.domElement.clientHeight)),
    )
    camera.position.multiplyScalar(zoom * requestedFit)
    camera.position.set(camera.position.x + panX, camera.position.y + panY, camera.position.z)
    camera.lookAt(panX, panY, 0)
    orbit.current?.target.set(panX, panY, 0)
    orbit.current?.update()
    invalidate()
  }, [preset, zoom, panX, panY, cameraReset, camera, gl, invalidate])
  useEffect(() => {
    if (previousFit.current === fitScale) return
    const target = orbit.current?.target
    if (target) {
      camera.position
        .sub(target)
        .multiplyScalar(fitScale / previousFit.current)
        .add(target)
      orbit.current?.update()
      invalidate()
    }
    previousFit.current = fitScale
  }, [fitScale, camera, invalidate])
  useEffect(() => {
    if (!focusRequest) return
    camera.position.set(focusX + 3.5, focusY + 2.2, focusZ + 4)
    orbit.current?.target.set(focusX, focusY, focusZ)
    camera.lookAt(focusX, focusY, focusZ)
    orbit.current?.update()
    invalidate()
  }, [focusRequest, focusX, focusY, focusZ, camera, invalidate])
  return null
}
export default function ThreeDimensionalView({
  frame,
  selectedId,
  onSelect,
  onFailure,
  preset,
  zoom,
  pan,
  apparatusVisible = true,
  overlays = true,
  combustion = true,
  exposure = 1,
  focusRequest = 0,
  focusPoint = [0, 0, 0],
  cameraReset = 0,
  panTool = false,
}: {
  frame: SimulationFrame
  selectedId: string
  onSelect: (id: string) => void
  onFailure: () => void
  preset: number
  zoom: number
  pan: [number, number]
  apparatusVisible?: boolean
  overlays?: boolean
  combustion?: boolean
  exposure?: number
  focusRequest?: number
  focusPoint?: [number, number, number]
  panTool?: boolean
  cameraReset?: number
}) {
  const lossCleanup = useRef<(() => void) | null>(null)
  useEffect(() => () => lossCleanup.current?.(), [])
  return (
    <div
      className="field-3d"
      role="group"
      aria-label="Schematic combustion flow tunnel and solid sample. Illustrative, not a reconstruction. Use the entity selector for keyboard data access. Orbit with pointer, pan with right drag, zoom with wheel."
    >
      <Canvas
        onCreated={({ gl }) => {
          lossCleanup.current?.()
          const lost = (event: Event) => {
            if (!gl.domElement.isConnected) return
            event.preventDefault()
            onFailure()
          }
          gl.domElement.addEventListener('webglcontextlost', lost)
          gl.domElement.dataset.rendererReady = 'true'
          lossCleanup.current = () => gl.domElement.removeEventListener('webglcontextlost', lost)
        }}
        frameloop="demand"
        dpr={[1, 1.5]}
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [3.8, 1.8, 7.2], fov: 45 }}
        fallback={
          <div className="viewport-fallback">
            <p>WebGL is unavailable. The same samples remain available in 2D and Table.</p>
            <Button type="button" onClick={onFailure}>
              Use 2D view
            </Button>
          </div>
        }
      >
        <Controls
          panTool={panTool}
          preset={preset}
          zoom={zoom}
          pan={pan}
          focusRequest={focusRequest}
          focusPoint={focusPoint}
          cameraReset={cameraReset}
        />
        <ApparatusScene
          selected={selectedId}
          onSelect={onSelect}
          step={frame.coordinate.value}
          apparatusVisible={apparatusVisible}
          overlays={overlays}
          combustion={combustion}
          exposure={exposure}
        />
      </Canvas>
    </div>
  )
}
