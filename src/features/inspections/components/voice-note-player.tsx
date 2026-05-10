import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Trash2 } from 'lucide-react'

interface VoiceNotePlayerProps {
  url: string
  durationSeconds: number
  onDelete: () => void
}

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function VoiceNotePlayer({ url, durationSeconds, onDelete }: VoiceNotePlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const raf = useRef<number>(0)

  useEffect(() => {
    const audio = new Audio(url)
    audioRef.current = audio
    audio.addEventListener('ended', () => setPlaying(false))
    return () => {
      audio.pause()
      cancelAnimationFrame(raf.current)
    }
  }, [url])

  useEffect(() => {
    if (playing) {
      const tick = () => {
        if (audioRef.current) setCurrent(audioRef.current.currentTime)
        raf.current = requestAnimationFrame(tick)
      }
      tick()
    } else {
      cancelAnimationFrame(raf.current)
    }
    return () => cancelAnimationFrame(raf.current)
  }, [playing])

  function toggle() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const progress = durationSeconds > 0 ? current / durationSeconds : 0

  return (
    <div className="flex items-center gap-2.5 bg-cream-100/70 rounded-lg px-3 py-2">
      <button
        type="button"
        onClick={toggle}
        className="size-9 flex items-center justify-center rounded-full bg-honey-500 text-cream-50 hover:bg-honey-600 transition-colors shrink-0"
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-honey-500 rounded-full transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="text-xs text-wood-500 mt-0.5">
          {fmtDuration(current)} / {fmtDuration(durationSeconds)}
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="size-8 flex items-center justify-center text-wood-400 hover:text-danger-500 rounded transition-colors shrink-0"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
