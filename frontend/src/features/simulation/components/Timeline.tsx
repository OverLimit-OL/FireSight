import { useEffect } from 'react'
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import type { SimulationFrame } from '@/types/simulation'
export default function Timeline({
  frames,
  index,
  onIndex,
  playing,
  onPlaying,
  speed,
  onSpeed,
}: {
  frames: SimulationFrame[]
  index: number
  onIndex: (i: number) => void
  playing: boolean
  onPlaying: (v: boolean) => void
  speed: number
  onSpeed: (v: number) => void
}) {
  useEffect(() => {
    if (!playing) return
    if (index >= frames.length - 1) {
      onPlaying(false)
      return
    }
    const timer = setTimeout(() => onIndex(index + 1), 900 / speed)
    return () => clearTimeout(timer)
  }, [playing, index, frames.length, speed, onIndex, onPlaying])
  return (
    <section className="simulation-timeline" aria-label="Output playback">
      <div className="timeline-top">
        <div className="playback-buttons">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Restart playback"
            onClick={() => {
              onPlaying(false)
              onIndex(0)
            }}
          >
            <RotateCcw />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Previous frame"
            disabled={index === 0}
            onClick={() => {
              onPlaying(false)
              onIndex(index - 1)
            }}
          >
            <SkipBack />
          </Button>
          <Button
            size="icon-sm"
            aria-label={playing ? 'Pause playback' : 'Play output frames'}
            onClick={() => {
              if (index === frames.length - 1) onIndex(0)
              onPlaying(!playing)
            }}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Next frame"
            disabled={index === frames.length - 1}
            onClick={() => {
              onPlaying(false)
              onIndex(index + 1)
            }}
          >
            <SkipForward />
          </Button>
        </div>
        <label className="speed-control">
          Playback speed
          <NativeSelect
            name="playbackSpeed"
            value={speed}
            onChange={(e) => onSpeed(Number(e.target.value))}
          >
            {[0.5, 1, 2].map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s}×
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <output className="frame-readout">
          Step {frames[index].coordinate.value} <span>/ {frames.at(-1)!.coordinate.value}</span>
        </output>
      </div>
      <label htmlFor="simulation-frame" className="sr-only">
        Output frame
      </label>
      <input
        id="simulation-frame"
        name="frame"
        type="range"
        min={0}
        max={frames.length - 1}
        step={1}
        value={index}
        aria-valuetext={`Step ${frames[index].coordinate.value}, frame ${index + 1} of ${frames.length}`}
        onChange={(e) => {
          onPlaying(false)
          onIndex(Number(e.target.value))
        }}
      />
      <div className="timeline-bottom">
        <span>Discrete output frames · no interpolation</span>
        <label>
          Jump to frame
          <NativeSelect
            name="directFrame"
            aria-label="Jump to frame"
            value={index}
            onChange={(e) => {
              onPlaying(false)
              onIndex(Number(e.target.value))
            }}
          >
            {frames.map((f, i) => (
              <NativeSelectOption key={f.id} value={i}>
                Step {f.coordinate.value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>
    </section>
  )
}
