'use client'

import { useRef, useState, useEffect } from 'react'

export default function CheesePage() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => setPlaying(false)
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [])

  function play() {
    audioRef.current?.play()
    setPlaying(true)
  }

  function pause() {
    audioRef.current?.pause()
    setPlaying(false)
  }

  function replay() {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play()
    setPlaying(true)
  }

  function changeSpeed(s: number) {
    setSpeed(s)
    if (audioRef.current) audioRef.current.playbackRate = s
  }

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 mt-2" style={{ color: '#4A4035' }}>偷奶酪</h1>

      <div className="flex flex-col items-center gap-3">
        <button onClick={play} className="btn btn-primary w-48 py-3 text-base">
          {playing ? '▶ 播放中...' : '▶ 开始'}
        </button>
        <button onClick={pause} className="btn btn-ghost w-48 py-3 text-base">⏸ 暂停</button>
        <button onClick={replay} className="btn btn-ghost w-48 py-3 text-base">↻ 重播</button>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => changeSpeed(0.9)}
            className="text-sm px-4 py-2 rounded-full font-medium transition-all"
            style={{
              background: speed === 0.9 ? 'rgba(143,191,143,0.15)' : '#EDE7DB',
              color: speed === 0.9 ? '#5A9A5A' : '#8A7F73',
              border: `1px solid ${speed === 0.9 ? 'rgba(143,191,143,0.4)' : 'transparent'}`,
            }}
          >
            0.9x
          </button>
          <button
            onClick={() => changeSpeed(1.0)}
            className="text-sm px-4 py-2 rounded-full font-medium transition-all"
            style={{
              background: speed === 1.0 ? 'rgba(143,191,143,0.15)' : '#EDE7DB',
              color: speed === 1.0 ? '#5A9A5A' : '#8A7F73',
              border: `1px solid ${speed === 1.0 ? 'rgba(143,191,143,0.4)' : 'transparent'}`,
            }}
          >
            1.0x
          </button>
          <button
            onClick={() => changeSpeed(1.1)}
            className="text-sm px-4 py-2 rounded-full font-medium transition-all"
            style={{
              background: speed === 1.1 ? 'rgba(143,191,143,0.15)' : '#EDE7DB',
              color: speed === 1.1 ? '#5A9A5A' : '#8A7F73',
              border: `1px solid ${speed === 1.1 ? 'rgba(143,191,143,0.4)' : 'transparent'}`,
            }}
          >
            1.1x
          </button>
        </div>
      </div>

      <audio ref={audioRef} src="/personal-app/cheese.mp3" preload="auto" />
    </div>
  )
}
